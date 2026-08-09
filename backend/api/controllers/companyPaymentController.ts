const pool = require('../config/database');
const { ensureBaseUserSchemaReady, ensureHiringSchemaReady } = require('../config/runtimeSchema');
const { logger } = require('../config/logger');
const { getLocalPaymentBypassAvailability } = require('../config/localBypass');
const {
  JOB_POST_PLANS,
  getPaymentProviderAvailability,
  getPaymentPresentationMeta,
  getPaymentRecordForCompany,
  getOrCreateCompanyForUserId,
  normalizeProvider,
  assertLocalBypassAllowed,
  startJobPostCheckoutIdempotent,
  completeLocalBypassPayment,
  capturePayPalOrder,
  finalizeVerifiedPayment,
  updatePaymentRecord,
} = require('../services/paymentService');
const { sendCompanyJobPostPaymentEmail } = require('../services/emailService');

const parseProviderPayload = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

const getReceiptPricingMeta = (payment, fallbackAmount) => {
  const payload = parseProviderPayload(payment?.provider_payload);
  const chargedAmount = Number(
    payload?.payment_reconciliation?.actual_provider_amount_php
    ?? payload?.payment_pricing?.expected_provider_amount_php
    ?? fallbackAmount
    ?? 0
  );
  const originalPlanAmount = Number(payment?.amount ?? fallbackAmount ?? 0);
  const isDemoPayment = Boolean(payload?.payment_pricing?.is_demo_pricing_active);

  return {
    actualPaidAmount: chargedAmount,
    originalPlanAmount,
    isDemoPayment,
  };
};

const listJobPostingPlans = async (req, res) => {
  try {
    return res.json({ success: true, plans: JOB_POST_PLANS });
  } catch (error) {
    logger.error('List job posting plans error:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading plans' });
  }
};

const listPaymentProviders = async (req, res) => {
  try {
    return res.json({
      success: true,
      providers: getPaymentProviderAvailability(),
      ...getPaymentPresentationMeta(),
      localPaymentBypass: getLocalPaymentBypassAvailability(req),
    });
  } catch (error) {
    logger.error('List payment providers error:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading payment providers' });
  }
};

const createCheckoutSession = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const provider = normalizeProvider(req.body?.provider);
    const planId = req.body?.planId;
    const draft = req.body?.draft || {};
    const jobId = req.body?.jobId == null ? null : Number(req.body.jobId);
    const idempotencyKey = String(req.get('x-idempotency-key') || req.body?.idempotencyKey || '').trim();
    const data = await startJobPostCheckoutIdempotent({
      client,
      req,
      companyUserId: req.user.id,
      provider,
      planId,
      draft,
      jobId: Number.isFinite(jobId) ? jobId : null,
      idempotencyKey,
    });

    await client.query('COMMIT');
    return res.status(201).json({
      success: true,
      paymentId: data.payment.id,
      checkoutUrl: data.checkoutUrl,
      checkoutUrls: Array.isArray(data.checkoutUrls) ? data.checkoutUrls : [data.checkoutUrl],
      plan: data.plan,
      idempotencyKey: data.idempotencyKey || idempotencyKey || null,
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 400;
    logger.error(
      {
        err: error,
        userId: req.user?.id || null,
        provider: req.body?.provider || null,
        planId: req.body?.planId || null,
        statusCode,
      },
      'Create checkout session error.'
    );
    return res.status(statusCode).json({ success: false, message: error?.message || 'Failed to start checkout.' });
  } finally {
    client?.release();
  }
};

const capturePayPalCheckout = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const payment = await getPaymentRecordForCompany(client, req.body?.paymentId, company.id, { forUpdate: true });
    if (!payment) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.provider !== 'paypal') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'This payment does not use PayPal.' });
    }

    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'PayPal order id is required.' });
    }

    if (payment.status === 'paid' && payment.job_id) {
      const result = await finalizeVerifiedPayment({
        client,
        companyUserId: req.user.id,
        payment,
        verification: {
          providerCheckoutId: payment.provider_checkout_id,
          providerPaymentId: payment.provider_payment_id,
          payerEmail: payment.payer_email,
          status: 'paid',
          rawPayload: payment.provider_payload || {},
          amount: Number(payment.amount || 0),
        },
      });
      await client.query('COMMIT');
      return res.json({ success: true, payment: result.payment, job: result.job });
    }

    if (payment.provider_checkout_id && payment.provider_checkout_id !== orderId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'PayPal order does not match this payment.' });
    }

    const verification = await capturePayPalOrder(orderId);
    const result = await finalizeVerifiedPayment({
      client,
      companyUserId: req.user.id,
      payment,
      verification,
    });

    await client.query('COMMIT');
    await sendCompanyJobPostPaymentEmail({
      to: req.user?.email || null,
      companyName: req.user?.company_name || req.user?.name || req.user?.username || 'Company',
      jobTitle: result?.job?.title || payment?.draft_payload?.title || 'Untitled job',
      planLabel: result?.payment?.plan_label || payment?.plan_label || 'Job posting',
      durationLabel: result?.payment?.plan_duration || payment?.plan_duration || '',
      amount: Number(result?.payment?.amount || payment?.amount || 0),
      ...getReceiptPricingMeta(result?.payment || payment, payment?.amount || 0),
      paidAt: result?.payment?.paid_at || new Date().toISOString(),
      provider: result?.payment?.provider || payment?.provider || 'paypal',
    }).catch((error) => {
      logger.warn({ err: error }, 'Company payment receipt email delivery failed.');
    });
    return res.json({ success: true, payment: result.payment, job: result.job });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 400;
    logger.error(
      {
        err: error,
        userId: req.user?.id || null,
        paymentId: req.body?.paymentId || null,
        statusCode,
      },
      'Capture PayPal checkout error.'
    );
    return res.status(statusCode).json({ success: false, message: error?.message || 'Failed to capture PayPal payment.' });
  } finally {
    client?.release();
  }
};

const cancelCheckoutSession = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const payment = await getPaymentRecordForCompany(client, req.params.paymentId, company.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (!['pending', 'processing'].includes(String(payment.status || '').toLowerCase())) {
      return res.json({ success: true, payment });
    }

    const updated = await updatePaymentRecord(client, payment.id, {
      status: 'cancelled',
      cancelled_at: new Date(),
    });

    return res.json({ success: true, payment: updated || payment });
  } catch (error) {
    logger.error('Cancel checkout session error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Failed to cancel payment.' });
  } finally {
    client?.release();
  }
};

const completeLocalBypassCheckout = async (req, res) => {
  let client;

  try {
    assertLocalBypassAllowed(req);

    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const provider = normalizeProvider(req.body?.provider);
    const planId = req.body?.planId;
    const draft = req.body?.draft || {};
    const jobId = req.body?.jobId == null ? null : Number(req.body.jobId);
    const result = await completeLocalBypassPayment({
      client,
      companyUserId: req.user.id,
      provider,
      planId,
      draft,
      jobId: Number.isFinite(jobId) ? jobId : null,
      payerEmail: req.user?.email || null,
    });

    await client.query('COMMIT');
    await sendCompanyJobPostPaymentEmail({
      to: req.user?.email || null,
      companyName: req.user?.company_name || req.user?.name || req.user?.username || 'Company',
      jobTitle: result?.job?.title || req.body?.draft?.title || 'Untitled job',
      planLabel: result?.payment?.plan_label || 'Job posting',
      durationLabel: result?.payment?.plan_duration || '',
      amount: Number(result?.payment?.amount || 0),
      ...getReceiptPricingMeta(result?.payment, result?.payment?.amount || 0),
      paidAt: result?.payment?.paid_at || new Date().toISOString(),
      provider: result?.payment?.provider || provider,
    }).catch((error) => {
      logger.warn({ err: error }, 'Company localhost bypass receipt email failed.');
    });
    return res.json({ success: true, payment: result.payment, job: result.job });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 400;
    logger.error(
      {
        err: error,
        userId: req.user?.id || null,
        provider: req.body?.provider || null,
        planId: req.body?.planId || null,
        statusCode,
      },
      'Complete localhost bypass checkout error.'
    );
    return res.status(statusCode).json({ success: false, message: error?.message || 'Failed to complete localhost bypass payment.' });
  } finally {
    client?.release();
  }
};

module.exports = {
  listJobPostingPlans,
  listPaymentProviders,
  createCheckoutSession,
  capturePayPalCheckout,
  cancelCheckoutSession,
  completeLocalBypassCheckout,
};
