const crypto = require('crypto');
const Stripe = require('stripe');
const { getJobPostPlanById, JOB_POST_PLANS } = require('./jobPostingPlans');
const { getOrCreateCompanyForUserId, serializeJobRow } = require('./companyService');
const { createPublishedJobForCompany, publishDraftJobForCompany } = require('./jobService');
const { getRedisClient } = require('../config/redis');

let stripeClient = null;

const PAYMENT_PROVIDERS = new Set(['stripe', 'paypal']);
const PAYMENT_API_TIMEOUT_MS = Math.max(1000, Number(process.env.PAYMENT_API_TIMEOUT_MS || 10000));
const PAYMENT_API_RETRY_MAX = Math.max(1, Number(process.env.PAYMENT_API_RETRY_MAX || 3));
const PAYMENT_API_RETRY_BASE_MS = Math.max(50, Number(process.env.PAYMENT_API_RETRY_BASE_MS || 300));
const PAYMENT_IDEMPOTENCY_TTL_SECONDS = Math.max(60, Number(process.env.PAYMENT_IDEMPOTENCY_TTL_SECONDS || 86400));

const getPaymentProviderAvailability = () => ({
  stripe: {
    enabled: Boolean(process.env.STRIPE_SECRET_KEY),
    label: 'Stripe',
    reason: process.env.STRIPE_SECRET_KEY ? '' : 'Stripe is not configured yet.',
  },
  paypal: {
    enabled: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    label: 'PayPal',
    reason: process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? '' : 'PayPal is not configured yet.',
  },
});

const formatPhpAmount = (amount) => Number(amount || 0).toFixed(2);

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to the server environment.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      timeout: PAYMENT_API_TIMEOUT_MS,
      maxNetworkRetries: Math.max(0, PAYMENT_API_RETRY_MAX - 1),
    });
  }

  return stripeClient;
};

const getPayPalBaseUrl = () => (String(process.env.PAYPAL_ENV || 'sandbox').trim().toLowerCase() === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com');

const getPayPalCredentials = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to the server environment.');
  }

  return { clientId, clientSecret };
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

const createPaymentError = (message, retryable = false) => {
  const error = new Error(message);
  error.retryable = retryable;
  return error;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  if (!error) {
    return false;
  }

  if (error.retryable === true) {
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
      console.warn(`${label} failed (attempt ${attempt}/${PAYMENT_API_RETRY_MAX}). Retrying in ${backoffMs}ms.`);
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
  skills: Array.isArray(draft?.skills) ? draft.skills.map((item) => String(item).trim()).filter(Boolean) : [],
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

const getPaymentRecordForCompany = async (client, paymentId, companyId, options = {}) => {
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

const createStripeCheckout = async ({ companyId, payment, plan, clientBaseUrl }) => {
  const stripe = getStripeClient();
  const session = await withRetry(
    () => stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${buildSuccessUrl(clientBaseUrl, 'stripe', payment.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: buildCancelUrl(clientBaseUrl, 'stripe', payment.id),
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'php',
            unit_amount: Number(plan.price) * 100,
            product_data: {
              name: `KapIT Job Post - ${plan.label}`,
              description: `${plan.description}. Publish one company job post for ${plan.durationLabel}.`,
            },
          },
        },
      ],
      metadata: {
        companyId,
        paymentId: payment.id,
        planId: plan.id,
      },
      payment_intent_data: {
        metadata: {
          companyId,
          paymentId: payment.id,
          planId: plan.id,
        },
      },
    }),
    { label: 'Stripe checkout session creation' }
  );

  return {
    checkoutUrl: session.url,
    providerCheckoutId: session.id,
  };
};

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

const createPayPalOrder = async ({ payment, plan, clientBaseUrl }) => {
  const accessToken = await getPayPalAccessToken();
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
              value: formatPhpAmount(plan.price),
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
    if (response.status >= 500) {
      throw createPaymentError(data?.message || 'PayPal order creation temporary failure.', true);
    }
    throw new Error(data?.message || 'Failed to create PayPal order.');
  }

  const approvalLink = data.links.find((link) => link.rel === 'approve')?.href;
  if (!approvalLink) {
    throw new Error('PayPal did not return an approval URL.');
  }

  return {
    checkoutUrl: approvalLink,
    providerCheckoutId: data.id,
  };
};

const startJobPostCheckout = async ({ client, req, companyUserId, provider, planId, draft, jobId = null }) => {
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
  const clientBaseUrl = getClientBaseUrl(req);

  const checkout =
    normalizedProvider === 'stripe'
      ? await createStripeCheckout({ companyId: company.id, payment, plan, clientBaseUrl })
      : await createPayPalOrder({ payment, plan, clientBaseUrl });

  const saved = await updatePaymentRecord(client, payment.id, {
    provider_checkout_id: checkout.providerCheckoutId,
  });

  return {
    payment: saved || payment,
    plan,
    checkoutUrl: checkout.checkoutUrl,
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
    return startJobPostCheckout({
      client,
      req,
      companyUserId,
      provider,
      planId,
      draft,
      jobId,
    });
  }

  const redis = await getRedisClient();
  if (!redis) {
    return startJobPostCheckout({
      client,
      req,
      companyUserId,
      provider,
      planId,
      draft,
      jobId,
    });
  }

  const redisKey = buildPaymentIdempotencyRedisKey(companyUserId, normalizedKey);
  const cached = await redis.get(redisKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed?.paymentId && parsed?.checkoutUrl && parsed?.plan) {
      return {
        payment: { id: parsed.paymentId },
        plan: parsed.plan,
        checkoutUrl: parsed.checkoutUrl,
        idempotencyKey: normalizedKey,
      };
    }
  }

  const lockKey = `${redisKey}:lock`;
  const acquired = await redis.set(lockKey, '1', { NX: true, EX: 30 });
  if (!acquired) {
    const pendingCached = await redis.get(redisKey);
    if (pendingCached) {
      const parsed = JSON.parse(pendingCached);
      if (parsed?.paymentId && parsed?.checkoutUrl && parsed?.plan) {
        return {
          payment: { id: parsed.paymentId },
          plan: parsed.plan,
          checkoutUrl: parsed.checkoutUrl,
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
  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  if (isProduction) {
    throw new Error('Local payment bypass is forbidden in production.');
  }

  const bypassEnabled = String(process.env.ENABLE_LOCAL_PAYMENT_BYPASS || '').trim().toLowerCase() === 'true';
  if (!bypassEnabled) {
    throw new Error('Local payment bypass is disabled.');
  }

  const host = String(req.hostname || req.get('host') || '').toLowerCase();
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1');
  if (!isLocalhost) {
    throw new Error('Local payment bypass is only allowed from localhost.');
  }
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

const extractStripeVerification = async (sessionId) => {
  const stripe = getStripeClient();
  const session = await withRetry(
    () => stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    }),
    { label: 'Stripe session verification' }
  );

  if (!session || session.payment_status !== 'paid') {
    throw new Error('Stripe payment is not marked as paid yet.');
  }

  return {
    providerCheckoutId: session.id,
    providerPaymentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null,
    payerEmail: session.customer_details?.email || null,
    status: 'paid',
    rawPayload: session,
    amount: Math.round(Number(session.amount_total || 0) / 100),
  };
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

  const providerAmount = Math.round(Number(verification.amount || 0));
  if (providerAmount !== Number(payment.amount || 0)) {
    throw new Error('Verified payment amount does not match the selected plan.');
  }

  const job = payment.job_id
    ? await publishDraftJobForCompany(client, payment.job_id, company.id, plan, payment.id)
    : await createPublishedJobForCompany(client, company.id, payment.draft_payload || {}, plan, payment.id);
  const savedPayment = await updatePaymentRecord(client, payment.id, {
    provider_checkout_id: verification.providerCheckoutId,
    provider_payment_id: verification.providerPaymentId,
    payer_email: verification.payerEmail,
    provider_payload: JSON.stringify(verification.rawPayload),
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
  getPaymentProviderAvailability,
  getPaymentRecordForCompany,
  getOrCreateCompanyForUserId,
  normalizeProvider,
  assertLocalBypassAllowed,
  startJobPostCheckout,
  startJobPostCheckoutIdempotent,
  completeLocalBypassPayment,
  extractStripeVerification,
  capturePayPalOrder,
  finalizeVerifiedPayment,
  updatePaymentRecord,
};
