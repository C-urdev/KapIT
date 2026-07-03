const crypto = require('crypto');
const { getJobPostPlanById, JOB_POST_PLANS } = require('./jobPostingPlans');
const { getOrCreateCompanyForUserId, serializeJobRow } = require('./companyService');
const { createPublishedJobForCompany, normalizePreAssessmentDraft, publishDraftJobForCompany } = require('./jobService');
const { getRedisClient } = require('../config/redis');
const { logger } = require('../config/logger');
const {
  hasPayPalConfig,
  getPayPalClientId,
  getPayPalClientSecret,
  getPayPalWebhookId,
} = require('../config/paymentEnv');
const {
  formatPhpAmount,
  resolveDemoPricingForAmount,
} = require('../config/paymentDemoPricing');
const { assertLocalPaymentBypassAllowed } = require('../config/localBypass');

const PAYMENT_PROVIDERS = new Set(['paypal']);
const PAYMENT_API_TIMEOUT_MS = Math.max(1000, Number(process.env.PAYMENT_API_TIMEOUT_MS || 10000));
const PAYMENT_API_RETRY_MAX = Math.max(1, Number(process.env.PAYMENT_API_RETRY_MAX || 3));
const PAYMENT_API_RETRY_BASE_MS = Math.max(50, Number(process.env.PAYMENT_API_RETRY_BASE_MS || 300));
const PAYMENT_IDEMPOTENCY_TTL_SECONDS = Math.max(60, Number(process.env.PAYMENT_IDEMPOTENCY_TTL_SECONDS || 86400));
const PAYPAL_WEBHOOK_MAX_AGE_MS = Math.max(1000, Number(process.env.PAYPAL_WEBHOOK_MAX_AGE_MS || 5 * 60 * 1000));
const PAYPAL_WEBHOOK_EVENT_TTL_SECONDS = Math.max(60, Number(process.env.PAYPAL_WEBHOOK_EVENT_TTL_SECONDS || 24 * 60 * 60));
const USER_PREMIUM_PLAN = Object.freeze({
  id: 'premium-monthly',
  label: 'Premium',
  price: 449,
  durationLabel: 'monthly',
  durationDays: 30,
  description: 'Premium applicant subscription',
});
const localWebhookReplayBuckets = new Map();

const pruneExpiredWebhookReplayBuckets = (now = Date.now()) => {
  for (const [key, value] of localWebhookReplayBuckets.entries()) {
    if (!value || Number(value.expiresAt || 0) <= now) {
      localWebhookReplayBuckets.delete(key);
    }
  }
};

const getPaymentProviderAvailability = () => {
  const payPalEnabled = hasPayPalConfig();
  return {
    paypal: {
      enabled: payPalEnabled,
      label: 'PayPal',
      reason: payPalEnabled ? '' : 'PayPal is not configured yet.',
    },
  };
};

const toMinorPhp = (amount) => Math.round(Number(amount || 0) * 100);

const parseProviderPayload = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  return {};
};

const buildExpectedPricingContext = ({ pricing }) => ({
  expected_provider_amount_php: Number(pricing.providerPayableAmount || 0),
  expected_provider_amount_value: pricing.paypalValue,
  real_plan_amount_php: Number(pricing.realAmount || 0),
  is_demo_pricing_active: Boolean(pricing.isDemoActive),
  demo_pricing_enabled_flag: Boolean(pricing.demoEnabledFlag),
  demo_pricing_expires_at: pricing.expiresAt || null,
  demo_pricing_expired: Boolean(pricing.isExpired),
  pricing_mode: pricing.effectiveMode,
});

const mergeProviderPayload = (currentPayload, patch) => {
  const base = parseProviderPayload(currentPayload);
  return {
    ...base,
    ...patch,
  };
};

const getExpectedProviderAmountFromPayment = (payment) => {
  const payload = parseProviderPayload(payment?.provider_payload);
  const expected = Number(payload?.payment_pricing?.expected_provider_amount_php);
  if (Number.isFinite(expected) && expected > 0) {
    return expected;
  }
  return Number(payment?.amount || 0);
};

const buildProviderReconciliationContext = ({ verification }) => ({
  actual_provider_amount_php: Number(verification?.amount || 0),
  actual_provider_amount_value: formatPhpAmount(Number(verification?.amount || 0)),
  provider_checkout_id: verification?.providerCheckoutId || null,
  provider_payment_id: verification?.providerPaymentId || null,
});

const getPayPalBaseUrl = () => (String(process.env.PAYPAL_ENV || 'sandbox').trim().toLowerCase() === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com');

const isPayPalLiveMode = () => String(process.env.PAYPAL_ENV || 'sandbox').trim().toLowerCase() === 'live';

const getPayPalCheckoutHosts = () => (
  isPayPalLiveMode()
    ? ['www.paypal.com', 'paypal.com']
    : ['www.sandbox.paypal.com', 'sandbox.paypal.com']
);

const normalizeCheckoutUrl = (value) => {
  const candidate = String(value || '').trim();
  if (!candidate) {
    return '';
  }
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

const addUniqueUrl = (list, value) => {
  const normalized = normalizeCheckoutUrl(value);
  if (!normalized) {
    return;
  }
  if (!list.includes(normalized)) {
    list.push(normalized);
  }
};

const buildPayPalCheckoutNowUrl = (host, orderId) => {
  const normalizedHost = String(host || '').trim().toLowerCase();
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedHost || !normalizedOrderId) {
    return '';
  }
  return `https://${normalizedHost}/checkoutnow?token=${encodeURIComponent(normalizedOrderId)}`;
};

const resolvePayPalCheckoutTargets = (orderPayload) => {
  const links = Array.isArray(orderPayload?.links) ? orderPayload.links : [];
  const preferred = [];
  const fallback = [];

  for (const link of links) {
    const rel = String(link?.rel || '').trim().toLowerCase();
    const href = normalizeCheckoutUrl(link?.href);
    if (!href) {
      continue;
    }

    if (rel === 'payer-action') {
      preferred.push(href);
      continue;
    }

    if (rel === 'approve') {
      fallback.push(href);
    }
  }

  const checkoutUrls = [];
  preferred.forEach((url) => addUniqueUrl(checkoutUrls, url));
  fallback.forEach((url) => addUniqueUrl(checkoutUrls, url));

  const orderId = String(orderPayload?.id || '').trim();
  if (orderId) {
    getPayPalCheckoutHosts().forEach((host) => {
      addUniqueUrl(checkoutUrls, buildPayPalCheckoutNowUrl(host, orderId));
    });
  }

  if (!checkoutUrls.length) {
    throw new Error('PayPal did not return an approval URL.');
  }

  return {
    checkoutUrl: checkoutUrls[0],
    checkoutUrls,
  };
};

const getPayPalCredentials = () => {
  const clientId = getPayPalClientId();
  const clientSecret = getPayPalClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error('PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to the server environment.');
  }

  return { clientId, clientSecret };
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  return error;
};

const getClientBaseUrl = (req) => {
  const configured = String(process.env.CLIENT_URL || '').trim().replace(/\/+$/, '');
  if (configured) {
    return configured;
  }

  const origin = String(req.get('origin') || '').trim().replace(/\/+$/, '');
  if (origin) {
    return origin;
  }

  const forwardedProto = String(req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  const forwardedHost = String(req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  throw new Error('Unable to determine the client URL for payment redirects.');
};

const normalizeProvider = (provider) => String(provider || '').trim().toLowerCase();
const normalizeIdempotencyKey = (raw) => String(raw || '').trim();
const buildPaymentIdempotencyRedisKey = (companyUserId, idempotencyKey) =>
  `payment:idempotency:${companyUserId}:${idempotencyKey}`;

const parseIdempotencyCacheValue = async ({ redis, key, rawValue }) => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    logger.warn('Invalid payment idempotency cache payload detected. Clearing stale Redis key.');
    try {
      await redis.del(key);
    } catch (cleanupError) {
      logger.warn('Failed to clear invalid payment idempotency cache key.');
    }
    return null;
  }
};

const createPaymentError = (message, retryableOrOptions: any = false) => {
  const options = ((retryableOrOptions && typeof retryableOrOptions === 'object')
    ? retryableOrOptions
    : { retryable: Boolean(retryableOrOptions) }) as any;
  const error = new Error(message);
  (error as any).retryable = Boolean(options.retryable);
  if (Number.isInteger(options.statusCode) && options.statusCode >= 400 && options.statusCode <= 599) {
    (error as any).statusCode = options.statusCode;
  }
  if (options.providerIssue) {
    (error as any).providerIssue = String(options.providerIssue);
  }
  if (options.providerDebugId) {
    (error as any).providerDebugId = String(options.providerDebugId);
  }
  return error;
};

const extractPayPalErrorDetail = (data) => {
  const details = Array.isArray(data?.details) ? data.details : [];
  const first = details[0] && typeof details[0] === 'object' ? details[0] : null;
  const issue = String(first?.issue || '').trim();
  const description = String(first?.description || '').trim();
  const message = String(data?.message || '').trim();
  const debugId = String(data?.debug_id || '').trim();
  const name = String(data?.name || '').trim();

  return {
    name,
    issue,
    description,
    message,
    debugId,
    detailsCount: details.length,
  };
};

const formatPayPalOrderErrorMessage = ({ detail, fallbackMessage }) => {
  const base = detail.description || detail.message || fallbackMessage;
  const tags = [];
  if (detail.issue) {
    tags.push(`issue=${detail.issue}`);
  }
  if (detail.debugId) {
    tags.push(`debug_id=${detail.debugId}`);
  }
  if (!tags.length) {
    return base;
  }
  return `${base} (${tags.join(', ')})`;
};

const createPayPalOrderCreationError = ({
  responseStatus,
  data,
  fallbackMessage = 'Failed to create PayPal order.',
}) => {
  const detail = extractPayPalErrorDetail(data);
  const message = formatPayPalOrderErrorMessage({
    detail,
    fallbackMessage,
  });

  const retryable = responseStatus >= 500;
  const statusCode = responseStatus >= 500 ? 503 : 502;
  return createPaymentError(message, {
    retryable,
    statusCode,
    providerIssue: detail.issue || undefined,
    providerDebugId: detail.debugId || undefined,
  } as any);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  if (!error) {
    return false;
  }

  if ((error as any).retryable === true) {
    return true;
  }

  const code = String(error.code || '').toUpperCase();
  if (['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED', 'EPIPE', 'ENOTFOUND'].includes(code)) {
    return true;
  }

  return error.name === 'AbortError';
};

const withRetry = async (action, { label }) => {
  let lastError;
  for (let attempt = 1; attempt <= PAYMENT_API_RETRY_MAX; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt >= PAYMENT_API_RETRY_MAX || !isRetryableError(error)) {
        throw error;
      }

      const backoffMs = PAYMENT_API_RETRY_BASE_MS * (2 ** (attempt - 1));
      logger.warn(`${label} failed (attempt ${attempt}/${PAYMENT_API_RETRY_MAX}). Retrying in ${backoffMs}ms.`);
      await wait(backoffMs);
    }
  }

  throw lastError || new Error(`${label} failed.`);
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAYMENT_API_TIMEOUT_MS);
  timeout.unref?.();

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const assertValidProvider = (provider) => {
  const normalized = normalizeProvider(provider);
  if (!PAYMENT_PROVIDERS.has(normalized)) {
    throw new Error('Unsupported payment provider.');
  }
  return normalized;
};

const normalizeDraftPayload = (draft) => ({
  title: String(draft?.title || '').trim(),
  description: String(draft?.description || '').trim(),
  salary: String(draft?.salary || '').trim(),
  location: String(draft?.location || '').trim(),
  type: String(draft?.type || '').trim(),
  applicationDeadline: String(draft?.applicationDeadline || '').trim(),
  skills: Array.isArray(draft?.skills) ? draft.skills.map((item) => String(item).trim()).filter(Boolean) : [],
  preAssessment: normalizePreAssessmentDraft(draft),
});

const createPaymentRecord = async (client, { companyId, provider, plan, draft, jobId = null }) => {
  const recordId = crypto.randomUUID();
  const result = await client.query(
    `INSERT INTO job_post_payments (
       id,
       company_id,
       job_id,
       provider,
       payment_context,
       currency,
       amount,
       status,
       plan_id,
       plan_label,
       plan_duration,
       plan_duration_days,
       draft_payload
     )
     VALUES ($1, $2, $3, $4, 'job_post', 'PHP', $5, 'pending', $6, $7, $8, $9, $10::jsonb)
     RETURNING *`,
    [
      recordId,
      companyId,
      jobId,
      provider,
      plan.price,
      plan.id,
      plan.label,
      plan.durationLabel,
      plan.durationDays,
      JSON.stringify(draft),
    ]
  );

  return result.rows[0];
};

const getPaymentRecordForCompany = async (client, paymentId, companyId, options = {} as any) => {
  const lockClause = options.forUpdate ? 'FOR UPDATE' : '';
  const result = await client.query(
    `SELECT *
     FROM job_post_payments
     WHERE id = $1::uuid
       AND company_id = $2
     LIMIT 1
     ${lockClause}`,
    [paymentId, companyId]
  );

  return result.rows[0] || null;
};

const updatePaymentRecord = async (client, paymentId, fields) => {
  const assignments = [];
  const values = [];
  let index = 1;

  Object.entries(fields).forEach(([key, value]) => {
    assignments.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  });

  if (!assignments.length) {
    return null;
  }

  values.push(paymentId);
  const result = await client.query(
    `UPDATE job_post_payments
     SET ${assignments.join(', ')},
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $${index}::uuid
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

const buildSuccessUrl = (clientBaseUrl, provider, paymentId) =>
  `${clientBaseUrl}/company/post-job/payment?checkout=${provider}-success&payment_id=${encodeURIComponent(paymentId)}`;

const buildCancelUrl = (clientBaseUrl, provider, paymentId) =>
  `${clientBaseUrl}/company/post-job/payment?checkout=cancelled&provider=${encodeURIComponent(provider)}&payment_id=${encodeURIComponent(paymentId)}`;

const buildUserPremiumSuccessUrl = (clientBaseUrl, provider, paymentId) =>
  `${clientBaseUrl}/premium/payment?checkout=${provider}-success&payment_id=${encodeURIComponent(paymentId)}`;

const buildUserPremiumCancelUrl = (clientBaseUrl, provider, paymentId) =>
  `${clientBaseUrl}/premium/payment?checkout=cancelled&provider=${encodeURIComponent(provider)}&payment_id=${encodeURIComponent(paymentId)}`;

const getPayPalAccessToken = async () => {
  const { clientId, clientSecret } = getPayPalCredentials();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await withRetry(
    () => fetchWithTimeout(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    }),
    { label: 'PayPal token request' }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.access_token) {
    if (response.status >= 500) {
      throw createPaymentError(data?.error_description || 'PayPal auth temporary failure.', true);
    }
    throw new Error(data?.error_description || 'Failed to authenticate with PayPal.');
  }

  return data.access_token;
};

const readPayPalWebhookHeaders = (headers = {}) => {
  const getHeader = (key) => {
    const direct = headers[key];
    if (direct != null) {
      return String(direct).trim();
    }
    const lower = headers[String(key || '').toLowerCase()];
    if (lower != null) {
      return String(lower).trim();
    }
    return '';
  };

  const values = {
    transmissionId: getHeader('paypal-transmission-id'),
    transmissionTime: getHeader('paypal-transmission-time'),
    transmissionSig: getHeader('paypal-transmission-sig'),
    certUrl: getHeader('paypal-cert-url'),
    authAlgo: getHeader('paypal-auth-algo'),
  };

  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw createHttpError(400, `Missing PayPal webhook headers: ${missing.join(', ')}`);
  }

  return values;
};

const assertPayPalTransmissionTimeFresh = (transmissionTime) => {
  const parsed = Date.parse(String(transmissionTime || '').trim());
  if (!Number.isFinite(parsed)) {
    throw createHttpError(400, 'Invalid PayPal transmission timestamp.');
  }

  const ageMs = Math.abs(Date.now() - parsed);
  if (ageMs > PAYPAL_WEBHOOK_MAX_AGE_MS) {
    throw createHttpError(401, 'Stale PayPal webhook transmission timestamp.');
  }
};

const buildPayPalWebhookReplayKey = (eventId) => `paypal:webhook:event:${String(eventId || '').trim()}`;

const reservePayPalWebhookEvent = async (eventId) => {
  const normalizedEventId = String(eventId || '').trim();
  if (!normalizedEventId) {
    throw createHttpError(400, 'Missing PayPal webhook event id.');
  }

  const key = buildPayPalWebhookReplayKey(normalizedEventId);
  const redis = await getRedisClient();
  if (redis) {
    const acquired = await redis.set(
      key,
      JSON.stringify({
        state: 'processing',
        eventId: normalizedEventId,
        updatedAt: new Date().toISOString(),
      }),
      { NX: true, EX: PAYPAL_WEBHOOK_EVENT_TTL_SECONDS }
    );

    if (!acquired) {
      return {
        duplicate: true,
        reservation: null,
      };
    }

    return {
      duplicate: false,
      reservation: {
        store: 'redis',
        key,
      },
    };
  }

  const now = Date.now();
  pruneExpiredWebhookReplayBuckets(now);
  const existing = localWebhookReplayBuckets.get(key);
  if (existing && Number(existing.expiresAt || 0) > now) {
    return {
      duplicate: true,
      reservation: null,
    };
  }

  localWebhookReplayBuckets.set(key, {
    state: 'processing',
    expiresAt: now + (PAYPAL_WEBHOOK_EVENT_TTL_SECONDS * 1000),
  });

  return {
    duplicate: false,
    reservation: {
      store: 'local',
      key,
    },
  };
};

const markPayPalWebhookEventProcessed = async (reservation) => {
  if (!reservation?.key) {
    return;
  }

  if (reservation.store === 'redis') {
    const redis = await getRedisClient();
    if (!redis) {
      return;
    }
    await redis.set(
      reservation.key,
      JSON.stringify({
        state: 'processed',
        updatedAt: new Date().toISOString(),
      }),
      { EX: PAYPAL_WEBHOOK_EVENT_TTL_SECONDS }
    );
    return;
  }

  const existing = localWebhookReplayBuckets.get(reservation.key);
  if (!existing) {
    return;
  }
  localWebhookReplayBuckets.set(reservation.key, {
    state: 'processed',
    expiresAt: Date.now() + (PAYPAL_WEBHOOK_EVENT_TTL_SECONDS * 1000),
  });
};

const releasePayPalWebhookEventReservation = async (reservation) => {
  if (!reservation?.key) {
    return;
  }

  if (reservation.store === 'redis') {
    const redis = await getRedisClient();
    if (!redis) {
      return;
    }
    await redis.del(reservation.key);
    return;
  }

  localWebhookReplayBuckets.delete(reservation.key);
};

const verifyPayPalWebhookSignature = async ({ headers, webhookEvent }) => {
  const webhookId = getPayPalWebhookId();
  if (!webhookId) {
    throw createHttpError(503, 'PayPal webhook is not configured. Add PAYPAL_WEBHOOK_ID.');
  }

  if (!webhookEvent || typeof webhookEvent !== 'object') {
    throw createHttpError(400, 'Invalid PayPal webhook payload.');
  }

  const parsedHeaders = readPayPalWebhookHeaders(headers);
  assertPayPalTransmissionTimeFresh(parsedHeaders.transmissionTime);
  const accessToken = await getPayPalAccessToken();
  const response = await withRetry(
    () => fetchWithTimeout(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: parsedHeaders.transmissionId,
        transmission_time: parsedHeaders.transmissionTime,
        cert_url: parsedHeaders.certUrl,
        auth_algo: parsedHeaders.authAlgo,
        transmission_sig: parsedHeaders.transmissionSig,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    }),
    { label: 'PayPal webhook signature verification' }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw createHttpError(401, data?.message || 'PayPal webhook signature verification failed.');
  }

  if (String(data?.verification_status || '').toUpperCase() !== 'SUCCESS') {
    throw createHttpError(401, 'Invalid PayPal webhook signature.');
  }

  return true;
};

const extractCaptureReference = (webhookEvent) => {
  const resource = webhookEvent?.resource || {};
  const related = resource?.supplementary_data?.related_ids || {};

  const orderId = String(
    related.order_id ||
    resource?.order_id ||
    webhookEvent?.resource?.invoice_id ||
    ''
  ).trim();
  const captureId = String(resource?.id || '').trim();
  const payerEmail = String(resource?.payer?.email_address || '').trim() || null;
  const amount = Number(resource?.amount?.value || 0);

  return {
    orderId: orderId || null,
    captureId: captureId || null,
    payerEmail,
    amount,
    amountValue: formatPhpAmount(amount),
    rawPayload: webhookEvent,
  };
};

const findCompanyPaymentByReference = async (client, { orderId, captureId }) => {
  if (!orderId && !captureId) {
    return null;
  }

  const result = await client.query(
    `SELECT *
     FROM job_post_payments
     WHERE provider = 'paypal'
       AND (
         ($1::text <> '' AND provider_payment_id = $1)
         OR ($2::text <> '' AND provider_checkout_id = $2)
       )
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [captureId || '', orderId || '']
  );

  return result.rows[0] || null;
};

const findUserPremiumPaymentByReference = async (client, { orderId, captureId }) => {
  if (!orderId && !captureId) {
    return null;
  }

  const result = await client.query(
    `SELECT *
     FROM user_premium_payments
     WHERE provider = 'paypal'
       AND (
         ($1::text <> '' AND provider_payment_id = $1)
         OR ($2::text <> '' AND provider_checkout_id = $2)
       )
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [captureId || '', orderId || '']
  );

  return result.rows[0] || null;
};

const resolveCompanyUserId = async (client, companyId) => {
  const result = await client.query(
    `SELECT user_id
     FROM companies
     WHERE id = $1
     LIMIT 1`,
    [companyId]
  );
  return result.rows[0]?.user_id || null;
};

const markCompanyPaymentFailed = async (client, payment, reference) => {
  const status = String(payment.status || '').toLowerCase();
  if (status === 'failed') {
    return { changed: false };
  }
  if (!['pending', 'processing'].includes(status)) {
    return { changed: false };
  }

  const mergedProviderPayload = mergeProviderPayload(payment.provider_payload, {
    payment_reconciliation: {
      actual_provider_amount_php: Number(reference.amount || 0),
      actual_provider_amount_value: reference.amountValue || formatPhpAmount(reference.amount || 0),
      provider_checkout_id: reference.orderId || payment.provider_checkout_id || null,
      provider_payment_id: reference.captureId || payment.provider_payment_id || null,
    },
    paypal_webhook_event: reference.rawPayload,
  });
  await updatePaymentRecord(client, payment.id, {
    status: 'failed',
    provider_checkout_id: reference.orderId || payment.provider_checkout_id,
    provider_payment_id: reference.captureId || payment.provider_payment_id,
    payer_email: reference.payerEmail || payment.payer_email,
    provider_payload: JSON.stringify(mergedProviderPayload),
  });
  return { changed: true };
};

const markUserPremiumPaymentFailed = async (client, payment, reference) => {
  const status = String(payment.status || '').toLowerCase();
  if (status === 'failed') {
    return { changed: false };
  }
  if (!['pending', 'processing'].includes(status)) {
    return { changed: false };
  }

  const mergedProviderPayload = mergeProviderPayload(payment.provider_payload, {
    payment_reconciliation: {
      actual_provider_amount_php: Number(reference.amount || 0),
      actual_provider_amount_value: reference.amountValue || formatPhpAmount(reference.amount || 0),
      provider_checkout_id: reference.orderId || payment.provider_checkout_id || null,
      provider_payment_id: reference.captureId || payment.provider_payment_id || null,
    },
    paypal_webhook_event: reference.rawPayload,
  });
  await updateUserPremiumPaymentRecord(client, payment.id, {
    status: 'failed',
    provider_checkout_id: reference.orderId || payment.provider_checkout_id,
    provider_payment_id: reference.captureId || payment.provider_payment_id,
    payer_email: reference.payerEmail || payment.payer_email,
    provider_payload: JSON.stringify(mergedProviderPayload),
  });
  return { changed: true };
};

const markCompanyPaymentRefunded = async (client, payment, reference) => {
  const status = String(payment.status || '').toLowerCase();
  if (status === 'refunded') {
    return { changed: false };
  }

  const mergedProviderPayload = mergeProviderPayload(payment.provider_payload, {
    payment_reconciliation: {
      actual_provider_amount_php: Number(reference.amount || 0),
      actual_provider_amount_value: reference.amountValue || formatPhpAmount(reference.amount || 0),
      provider_checkout_id: reference.orderId || payment.provider_checkout_id || null,
      provider_payment_id: reference.captureId || payment.provider_payment_id || null,
    },
    paypal_webhook_event: reference.rawPayload,
  });
  await updatePaymentRecord(client, payment.id, {
    status: 'refunded',
    provider_checkout_id: reference.orderId || payment.provider_checkout_id,
    provider_payment_id: reference.captureId || payment.provider_payment_id,
    payer_email: reference.payerEmail || payment.payer_email,
    provider_payload: JSON.stringify(mergedProviderPayload),
    cancelled_at: new Date(),
  });

  if (payment.job_id) {
    await client.query(
      `UPDATE jobs
       SET posting_payment_status = 'refunded',
           status = CASE WHEN status = 'closed' THEN status ELSE 'closed' END,
           closed_reason = COALESCE(closed_reason, 'payment_refunded'),
           closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP)
       WHERE id = $1`,
      [payment.job_id]
    );
  }

  return { changed: true };
};

const markUserPremiumPaymentRefunded = async (client, payment, reference) => {
  const status = String(payment.status || '').toLowerCase();
  if (status === 'refunded') {
    await client.query(
      `UPDATE users
       SET is_premium = false
       WHERE id = $1::uuid`,
      [payment.user_id]
    );
    return { changed: false };
  }

  const mergedProviderPayload = mergeProviderPayload(payment.provider_payload, {
    payment_reconciliation: {
      actual_provider_amount_php: Number(reference.amount || 0),
      actual_provider_amount_value: reference.amountValue || formatPhpAmount(reference.amount || 0),
      provider_checkout_id: reference.orderId || payment.provider_checkout_id || null,
      provider_payment_id: reference.captureId || payment.provider_payment_id || null,
    },
    paypal_webhook_event: reference.rawPayload,
  });
  await updateUserPremiumPaymentRecord(client, payment.id, {
    status: 'refunded',
    provider_checkout_id: reference.orderId || payment.provider_checkout_id,
    provider_payment_id: reference.captureId || payment.provider_payment_id,
    payer_email: reference.payerEmail || payment.payer_email,
    provider_payload: JSON.stringify(mergedProviderPayload),
    cancelled_at: new Date(),
  });

  await client.query(
    `UPDATE users
     SET is_premium = false
     WHERE id = $1::uuid`,
    [payment.user_id]
  );

  return { changed: true };
};

const reconcileCompletedCompanyPayment = async (client, payment, reference) => {
  const status = String(payment.status || '').toLowerCase();
  if (status === 'paid' && payment.job_id) {
    return { changed: false };
  }
  if (!['pending', 'processing', 'paid'].includes(status)) {
    return { changed: false };
  }

  const companyUserId = await resolveCompanyUserId(client, payment.company_id);
  if (!companyUserId) {
    throw new Error(`Company user not found for company payment ${payment.id}`);
  }

  await finalizeVerifiedPayment({
    client,
    companyUserId,
    payment,
    verification: {
      providerCheckoutId: reference.orderId || payment.provider_checkout_id,
      providerPaymentId: reference.captureId || payment.provider_payment_id,
      payerEmail: reference.payerEmail || payment.payer_email,
      status: 'paid',
      rawPayload: reference.rawPayload,
      amount: Number(reference.amount || payment.amount || 0),
    },
  });

  return { changed: true };
};

const reconcileCompletedUserPremiumPayment = async (client, payment, reference) => {
  const status = String(payment.status || '').toLowerCase();
  if (status === 'paid') {
    return { changed: false };
  }
  if (!['pending', 'processing'].includes(status)) {
    return { changed: false };
  }

  await finalizeVerifiedUserPremiumPayment({
    client,
    userId: payment.user_id,
    payment,
    verification: {
      providerCheckoutId: reference.orderId || payment.provider_checkout_id,
      providerPaymentId: reference.captureId || payment.provider_payment_id,
      payerEmail: reference.payerEmail || payment.payer_email,
      status: 'paid',
      rawPayload: reference.rawPayload,
      amount: Number(reference.amount || payment.amount || 0),
    },
  });

  return { changed: true };
};

const reconcilePayPalWebhookEvent = async ({ client, webhookEvent }) => {
  const eventType = String(webhookEvent?.event_type || '').trim().toUpperCase();
  const supported = new Set([
    'PAYMENT.CAPTURE.COMPLETED',
    'PAYMENT.CAPTURE.DENIED',
    'PAYMENT.CAPTURE.REFUNDED',
  ]);
  if (!supported.has(eventType)) {
    return { handled: false, ignored: true, reason: 'unsupported_event' };
  }

  const reference = extractCaptureReference(webhookEvent);
  if (!reference.orderId && !reference.captureId) {
    return { handled: false, ignored: true, reason: 'missing_reference' };
  }

  const companyPayment = await findCompanyPaymentByReference(client, reference);
  const userPremiumPayment = await findUserPremiumPaymentByReference(client, reference);
  if (!companyPayment && !userPremiumPayment) {
    return { handled: false, ignored: true, reason: 'payment_not_found' };
  }

  let changed = false;
  if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    if (companyPayment) {
      changed = (await reconcileCompletedCompanyPayment(client, companyPayment, reference)).changed || changed;
    }
    if (userPremiumPayment) {
      changed = (await reconcileCompletedUserPremiumPayment(client, userPremiumPayment, reference)).changed || changed;
    }
  } else if (eventType === 'PAYMENT.CAPTURE.DENIED') {
    if (companyPayment) {
      changed = (await markCompanyPaymentFailed(client, companyPayment, reference)).changed || changed;
    }
    if (userPremiumPayment) {
      changed = (await markUserPremiumPaymentFailed(client, userPremiumPayment, reference)).changed || changed;
    }
  } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
    if (companyPayment) {
      changed = (await markCompanyPaymentRefunded(client, companyPayment, reference)).changed || changed;
    }
    if (userPremiumPayment) {
      changed = (await markUserPremiumPaymentRefunded(client, userPremiumPayment, reference)).changed || changed;
    }
  }

  return {
    handled: true,
    ignored: false,
    changed,
    eventType,
  };
};

const createPayPalOrder = async ({ payment, plan, clientBaseUrl, pricing }) => {
  const accessToken = await getPayPalAccessToken();
  if (pricing?.isDemoActive) {
    logger.warn({
      paymentId: payment.id,
      pricingMode: pricing.effectiveMode,
      realAmountPhp: pricing.realAmount,
      providerPayableAmountPhp: pricing.providerPayableAmount,
      expiresAt: pricing.expiresAt,
    }, 'Demo pricing active for company checkout payment.');
  }
  const response = await withRetry(
    () => fetchWithTimeout(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': payment.id,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: payment.id,
            custom_id: payment.id,
            description: `KapIT Job Post - ${plan.label}`,
            amount: {
              currency_code: 'PHP',
              value: pricing?.paypalValue || formatPhpAmount(plan.price),
            },
          },
        ],
        application_context: {
          brand_name: 'KapIT',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: buildSuccessUrl(clientBaseUrl, 'paypal', payment.id),
          cancel_url: buildCancelUrl(clientBaseUrl, 'paypal', payment.id),
        },
      }),
    }),
    { label: 'PayPal order creation' }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(data?.links)) {
    logger.warn(
      {
        responseStatus: response.status,
        paypalError: extractPayPalErrorDetail(data),
        paymentId: payment.id,
        context: 'company_job_post_checkout',
      },
      'PayPal order creation failed.'
    );
    throw createPayPalOrderCreationError({
      responseStatus: response.status,
      data,
    });
  }

  const checkoutTarget = resolvePayPalCheckoutTargets(data);

  return {
    checkoutUrl: checkoutTarget.checkoutUrl,
    checkoutUrls: checkoutTarget.checkoutUrls,
    providerCheckoutId: data.id,
  };
};

const createUserPremiumPaymentRecord = async (client, { userId, provider, plan }) => {
  const recordId = crypto.randomUUID();
  const result = await client.query(
    `INSERT INTO user_premium_payments (
       id,
       user_id,
       provider,
       payment_context,
       currency,
       amount,
       status,
       plan_id,
       plan_label,
       plan_duration,
       plan_duration_days
     )
     VALUES ($1, $2, $3, 'user_premium', 'PHP', $4, 'pending', $5, $6, $7, $8)
     RETURNING *`,
    [
      recordId,
      userId,
      provider,
      plan.price,
      plan.id,
      plan.label,
      plan.durationLabel,
      plan.durationDays,
    ]
  );

  return result.rows[0];
};

const getUserPremiumPaymentRecord = async (client, paymentId, userId, options = {} as any) => {
  const lockClause = options.forUpdate ? 'FOR UPDATE' : '';
  const result = await client.query(
    `SELECT *
     FROM user_premium_payments
     WHERE id = $1::uuid
       AND user_id = $2::uuid
     LIMIT 1
     ${lockClause}`,
    [paymentId, userId]
  );

  return result.rows[0] || null;
};

const createUserPremiumPayPalOrder = async ({ payment, plan, clientBaseUrl, pricing }) => {
  const accessToken = await getPayPalAccessToken();
  if (pricing?.isDemoActive) {
    logger.warn({
      paymentId: payment.id,
      pricingMode: pricing.effectiveMode,
      realAmountPhp: pricing.realAmount,
      providerPayableAmountPhp: pricing.providerPayableAmount,
      expiresAt: pricing.expiresAt,
    }, 'Demo pricing active for user premium checkout payment.');
  }
  const response = await withRetry(
    () => fetchWithTimeout(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': payment.id,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: payment.id,
            custom_id: payment.id,
            description: `KapIT ${plan.label} Subscription`,
            amount: {
              currency_code: 'PHP',
              value: pricing?.paypalValue || formatPhpAmount(plan.price),
            },
          },
        ],
        application_context: {
          brand_name: 'KapIT',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: buildUserPremiumSuccessUrl(clientBaseUrl, 'paypal', payment.id),
          cancel_url: buildUserPremiumCancelUrl(clientBaseUrl, 'paypal', payment.id),
        },
      }),
    }),
    { label: 'PayPal user premium order creation' }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(data?.links)) {
    logger.warn(
      {
        responseStatus: response.status,
        paypalError: extractPayPalErrorDetail(data),
        paymentId: payment.id,
        pricingMode: pricing?.effectiveMode || 'real',
        context: 'user_premium_checkout',
      },
      'PayPal user premium order creation failed.'
    );
    throw createPayPalOrderCreationError({
      responseStatus: response.status,
      data,
    });
  }

  const checkoutTarget = resolvePayPalCheckoutTargets(data);

  return {
    checkoutUrl: checkoutTarget.checkoutUrl,
    checkoutUrls: checkoutTarget.checkoutUrls,
    providerCheckoutId: data.id,
  };
};

const startUserPremiumCheckout = async ({ client, req, userId, provider }) => {
  const normalizedProvider = assertValidProvider(provider);
  const plan = USER_PREMIUM_PLAN;
  const pricing = resolveDemoPricingForAmount(Number(plan.price || 0));

  const payment = await createUserPremiumPaymentRecord(client, {
    userId,
    provider: normalizedProvider,
    plan,
  });
  const clientBaseUrl = getClientBaseUrl(req);

  const checkout = await createUserPremiumPayPalOrder({
    payment,
    plan,
    clientBaseUrl,
    pricing,
  });

  const saved = await updateUserPremiumPaymentRecord(client, payment.id, {
    provider_checkout_id: checkout.providerCheckoutId,
    provider_payload: JSON.stringify(mergeProviderPayload(payment.provider_payload, {
      payment_pricing: buildExpectedPricingContext({ pricing }),
    })),
  });

  return {
    payment: saved || {
      ...payment,
      provider_payload: mergeProviderPayload(payment.provider_payload, {
        payment_pricing: buildExpectedPricingContext({ pricing }),
      }),
    },
    plan,
    checkoutUrl: checkout.checkoutUrl,
    checkoutUrls: checkout.checkoutUrls,
  };
};

const updateUserPremiumPaymentRecord = async (client, paymentId, fields) => {
  const assignments = [];
  const values = [];
  let index = 1;

  Object.entries(fields).forEach(([key, value]) => {
    assignments.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  });

  if (!assignments.length) {
    return null;
  }

  values.push(paymentId);
  const result = await client.query(
    `UPDATE user_premium_payments
     SET ${assignments.join(', ')},
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $${index}::uuid
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

const finalizeVerifiedUserPremiumPayment = async ({ client, userId, payment, verification }) => {
  if (String(payment.user_id) !== String(userId)) {
    throw new Error('Payment does not belong to this user.');
  }

  const paymentStatus = String(payment.status || '').toLowerCase();
  if (paymentStatus === 'paid') {
    const userResult = await client.query(
      `UPDATE users
       SET is_premium = true
       WHERE id = $1::uuid
       RETURNING *`,
      [userId]
    );
    if (!userResult.rows.length) {
      throw new Error('User not found.');
    }
    return {
      payment,
      user: userResult.rows[0],
    };
  }

  if (!['pending', 'processing'].includes(paymentStatus)) {
    throw new Error(`Payment cannot be finalized from status "${payment.status}".`);
  }

  const expectedProviderAmount = getExpectedProviderAmountFromPayment(payment);
  const providerAmountMinor = toMinorPhp(verification.amount || 0);
  const expectedProviderAmountMinor = toMinorPhp(expectedProviderAmount || 0);
  if (providerAmountMinor !== expectedProviderAmountMinor) {
    throw new Error('Verified payment amount does not match the premium plan.');
  }

  const mergedProviderPayload = mergeProviderPayload(payment.provider_payload, {
    payment_reconciliation: buildProviderReconciliationContext({ verification }),
  });
  const savedPayment = await updateUserPremiumPaymentRecord(client, payment.id, {
    provider_checkout_id: verification.providerCheckoutId,
    provider_payment_id: verification.providerPaymentId,
    payer_email: verification.payerEmail,
    provider_payload: JSON.stringify({
      ...mergedProviderPayload,
      paypal_capture_payload: verification.rawPayload,
    }),
    status: verification.status,
    paid_at: new Date(),
  });

  const userResult = await client.query(
    `UPDATE users
     SET is_premium = true
     WHERE id = $1::uuid
     RETURNING *`,
    [userId]
  );
  if (!userResult.rows.length) {
    throw new Error('User not found.');
  }

  return {
    payment: savedPayment || payment,
    user: userResult.rows[0],
  };
};

const completeLocalBypassUserPremiumPayment = async ({ client, userId, provider, payerEmail = null }) => {
  const normalizedProvider = assertValidProvider(provider);
  const plan = USER_PREMIUM_PLAN;

  const payment = await createUserPremiumPaymentRecord(client, {
    userId,
    provider: normalizedProvider,
    plan,
  });

  return finalizeVerifiedUserPremiumPayment({
    client,
    userId,
    payment,
    verification: {
      providerCheckoutId: `localhost-checkout-${payment.id}`,
      providerPaymentId: `localhost-paid-${Date.now()}`,
      payerEmail,
      status: 'paid',
      rawPayload: {
        bypass: true,
        source: 'localhost-env-flag',
      },
      amount: Number(plan.price || 0),
    },
  });
};

const startJobPostCheckout = async ({ client, req, companyUserId, provider, planId, draft, jobId = null }) => {
  const normalizedProvider = assertValidProvider(provider);
  const plan = getJobPostPlanById(planId);
  const pricing = resolveDemoPricingForAmount(Number(plan?.price || 0));

  if (!plan) {
    throw new Error('Please select a valid pricing plan.');
  }

  const normalizedDraft = normalizeDraftPayload(draft);
  if (!normalizedDraft.title || !normalizedDraft.description) {
    throw new Error('Job title and description are required.');
  }

  const company = await getOrCreateCompanyForUserId(client, companyUserId);
  let linkedJobId = null;
  if (jobId != null) {
    const draftJobResult = await client.query(
      `SELECT id
       FROM jobs
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(posting_payment_status, 'pending') <> 'paid'
       LIMIT 1`,
      [Number(jobId), company.id]
    );

    if (!draftJobResult.rows.length) {
      throw new Error('Draft job not found for payment.');
    }

    linkedJobId = draftJobResult.rows[0].id;
  }

  const payment = await createPaymentRecord(client, {
    companyId: company.id,
    provider: normalizedProvider,
    plan,
    draft: normalizedDraft,
    jobId: linkedJobId,
  });
  const clientBaseUrl = getClientBaseUrl(req);

  const checkout = await createPayPalOrder({
    payment,
    plan,
    clientBaseUrl,
    pricing,
  });

  const saved = await updatePaymentRecord(client, payment.id, {
    provider_checkout_id: checkout.providerCheckoutId,
    provider_payload: JSON.stringify(mergeProviderPayload(payment.provider_payload, {
      payment_pricing: buildExpectedPricingContext({ pricing }),
    })),
  });

  return {
    payment: saved || {
      ...payment,
      provider_payload: mergeProviderPayload(payment.provider_payload, {
        payment_pricing: buildExpectedPricingContext({ pricing }),
      }),
    },
    plan,
    checkoutUrl: checkout.checkoutUrl,
    checkoutUrls: checkout.checkoutUrls,
  };
};

const startJobPostCheckoutIdempotent = async ({
  client,
  req,
  companyUserId,
  provider,
  planId,
  draft,
  jobId = null,
  idempotencyKey,
}) => {
  const normalizedKey = normalizeIdempotencyKey(idempotencyKey);
  if (!normalizedKey) {
    throw new Error('Idempotency key is required. Send x-idempotency-key for checkout session creation.');
  }

  const redis = await getRedisClient();
  if (!redis) {
    throw new Error('Checkout is temporarily unavailable because Redis idempotency storage is not ready. Please retry shortly.');
  }

  const redisKey = buildPaymentIdempotencyRedisKey(companyUserId, normalizedKey);
  const cached = await redis.get(redisKey);
  if (cached) {
    const parsed = await parseIdempotencyCacheValue({ redis, key: redisKey, rawValue: cached });
    if (parsed?.paymentId && parsed?.checkoutUrl && parsed?.plan) {
      const cachedCheckoutUrls = Array.isArray(parsed.checkoutUrls)
        ? parsed.checkoutUrls.map(normalizeCheckoutUrl).filter(Boolean)
        : [];
      if (!cachedCheckoutUrls.length) {
        addUniqueUrl(cachedCheckoutUrls, parsed.checkoutUrl);
      }
      return {
        payment: { id: parsed.paymentId },
        plan: parsed.plan,
        checkoutUrl: parsed.checkoutUrl,
        checkoutUrls: cachedCheckoutUrls,
        idempotencyKey: normalizedKey,
      };
    }
  }

  const lockKey = `${redisKey}:lock`;
  const acquired = await redis.set(lockKey, '1', { NX: true, EX: 30 });
  if (!acquired) {
    const pendingCached = await redis.get(redisKey);
    if (pendingCached) {
      const parsed = await parseIdempotencyCacheValue({ redis, key: redisKey, rawValue: pendingCached });
      if (parsed?.paymentId && parsed?.checkoutUrl && parsed?.plan) {
        const cachedCheckoutUrls = Array.isArray(parsed.checkoutUrls)
          ? parsed.checkoutUrls.map(normalizeCheckoutUrl).filter(Boolean)
          : [];
        if (!cachedCheckoutUrls.length) {
          addUniqueUrl(cachedCheckoutUrls, parsed.checkoutUrl);
        }
        return {
          payment: { id: parsed.paymentId },
          plan: parsed.plan,
          checkoutUrl: parsed.checkoutUrl,
          checkoutUrls: cachedCheckoutUrls,
          idempotencyKey: normalizedKey,
        };
      }
    }
    throw new Error('This payment request is already in progress. Please retry with the same idempotency key.');
  }

  try {
    const result = await startJobPostCheckout({
      client,
      req,
      companyUserId,
      provider,
      planId,
      draft,
      jobId,
    });

    await redis.set(
      redisKey,
      JSON.stringify({
        paymentId: result.payment.id,
        checkoutUrl: result.checkoutUrl,
        checkoutUrls: Array.isArray(result.checkoutUrls) ? result.checkoutUrls : [result.checkoutUrl],
        plan: result.plan,
        cachedAt: new Date().toISOString(),
      }),
      { EX: PAYMENT_IDEMPOTENCY_TTL_SECONDS }
    );

    return {
      ...result,
      idempotencyKey: normalizedKey,
    };
  } finally {
    await redis.del(lockKey);
  }
};

const assertLocalBypassAllowed = (req) => {
  assertLocalPaymentBypassAllowed(req);
};

const completeLocalBypassPayment = async ({ client, companyUserId, provider, planId, draft, jobId = null, payerEmail = null }) => {
  const normalizedProvider = assertValidProvider(provider);
  const plan = getJobPostPlanById(planId);

  if (!plan) {
    throw new Error('Please select a valid pricing plan.');
  }

  const normalizedDraft = normalizeDraftPayload(draft);
  if (!normalizedDraft.title || !normalizedDraft.description) {
    throw new Error('Job title and description are required.');
  }

  const company = await getOrCreateCompanyForUserId(client, companyUserId);
  let linkedJobId = null;
  if (jobId != null) {
    const draftJobResult = await client.query(
      `SELECT id
       FROM jobs
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(posting_payment_status, 'pending') <> 'paid'
       LIMIT 1`,
      [Number(jobId), company.id]
    );

    if (!draftJobResult.rows.length) {
      throw new Error('Draft job not found for payment.');
    }

    linkedJobId = draftJobResult.rows[0].id;
  }

  const payment = await createPaymentRecord(client, {
    companyId: company.id,
    provider: normalizedProvider,
    plan,
    draft: normalizedDraft,
    jobId: linkedJobId,
  });

  return finalizeVerifiedPayment({
    client,
    companyUserId,
    payment,
    verification: {
      providerCheckoutId: `localhost-checkout-${payment.id}`,
      providerPaymentId: `localhost-paid-${Date.now()}`,
      payerEmail,
      status: 'paid',
      rawPayload: {
        bypass: true,
        source: 'localhost-env-flag',
      },
      amount: Number(plan.price || 0),
    },
  });
};

const capturePayPalOrder = async (orderId) => {
  const accessToken = await getPayPalAccessToken();
  const response = await withRetry(
    () => fetchWithTimeout(`${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }),
    { label: 'PayPal order capture' }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status >= 500) {
      throw createPaymentError(data?.message || 'PayPal capture temporary failure.', true);
    }
    const issue = data?.details?.[0]?.description || data?.message;
    throw new Error(issue || 'Failed to capture PayPal payment.');
  }

  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  if (data?.status !== 'COMPLETED' || capture?.status !== 'COMPLETED') {
    throw new Error('PayPal payment is not completed yet.');
  }

  return {
    providerCheckoutId: data.id,
    providerPaymentId: capture?.id || null,
    payerEmail: data?.payer?.email_address || null,
    status: 'paid',
    rawPayload: data,
    amount: Number(capture?.amount?.value || 0),
  };
};

const finalizeVerifiedPayment = async ({ client, companyUserId, payment, verification }) => {
  const company = await getOrCreateCompanyForUserId(client, companyUserId);
  if (payment.company_id !== company.id) {
    throw new Error('Payment does not belong to this company.');
  }

  const paymentStatus = String(payment.status || '').toLowerCase();
  if (paymentStatus === 'paid' && payment.job_id) {
    const existingJobResult = await client.query(
      `SELECT *
       FROM jobs
       WHERE id = $1
         AND company_id = $2
       LIMIT 1`,
      [payment.job_id, company.id]
    );
    if (!existingJobResult.rows.length) {
      throw new Error('Payment is marked paid but linked job is missing.');
    }

    return {
      payment,
      job: serializeJobRow(existingJobResult.rows[0]),
    };
  }

  if (!['pending', 'processing'].includes(paymentStatus)) {
    throw new Error(`Payment cannot be finalized from status "${payment.status}".`);
  }

  const plan = getJobPostPlanById(payment.plan_id);
  if (!plan) {
    throw new Error('The saved payment plan is no longer available.');
  }

  const expectedProviderAmount = getExpectedProviderAmountFromPayment(payment);
  const providerAmountMinor = toMinorPhp(verification.amount || 0);
  const expectedProviderAmountMinor = toMinorPhp(expectedProviderAmount || 0);
  if (providerAmountMinor !== expectedProviderAmountMinor) {
    throw new Error('Verified payment amount does not match the selected plan.');
  }

  const job = payment.job_id
    ? await publishDraftJobForCompany(client, payment.job_id, company.id, plan, payment.id)
    : await createPublishedJobForCompany(client, company.id, payment.draft_payload || {}, plan, payment.id);
  const mergedProviderPayload = mergeProviderPayload(payment.provider_payload, {
    payment_reconciliation: buildProviderReconciliationContext({ verification }),
  });
  const savedPayment = await updatePaymentRecord(client, payment.id, {
    provider_checkout_id: verification.providerCheckoutId,
    provider_payment_id: verification.providerPaymentId,
    payer_email: verification.payerEmail,
    provider_payload: JSON.stringify({
      ...mergedProviderPayload,
      paypal_capture_payload: verification.rawPayload,
    }),
    status: verification.status,
    paid_at: new Date(),
    job_id: job.id,
  });

  return {
    payment: savedPayment || payment,
    job,
  };
};

module.exports = {
  JOB_POST_PLANS,
  USER_PREMIUM_PLAN,
  getPaymentProviderAvailability,
  getPaymentRecordForCompany,
  getUserPremiumPaymentRecord,
  getOrCreateCompanyForUserId,
  normalizeProvider,
  assertLocalBypassAllowed,
  startJobPostCheckout,
  startJobPostCheckoutIdempotent,
  startUserPremiumCheckout,
  completeLocalBypassPayment,
  completeLocalBypassUserPremiumPayment,
  capturePayPalOrder,
  verifyPayPalWebhookSignature,
  reservePayPalWebhookEvent,
  markPayPalWebhookEventProcessed,
  releasePayPalWebhookEventReservation,
  reconcilePayPalWebhookEvent,
  finalizeVerifiedPayment,
  finalizeVerifiedUserPremiumPayment,
  updatePaymentRecord,
  updateUserPremiumPaymentRecord,
};

