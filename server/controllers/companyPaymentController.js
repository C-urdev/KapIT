const pool = require('../config/database');
const { ensureBaseUserSchemaReady, ensureHiringSchemaReady } = require('../config/runtimeSchema');
const {
  JOB_POST_PLANS,
  getPaymentProviderAvailability,
  getPaymentRecordForCompany,
  getOrCreateCompanyForUserId,
  normalizeProvider,
  startJobPostCheckout,
  extractStripeVerification,
  capturePayPalOrder,
  finalizeVerifiedPayment,
  updatePaymentRecord,
} = require('../services/paymentService');

const listJobPostingPlans = async (req, res) => {
  try {
    return res.json({ success: true, plans: JOB_POST_PLANS });
  } catch (error) {
    console.error('List job posting plans error:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading plans' });
  }
};

const listPaymentProviders = async (req, res) => {
  try {
    return res.json({ success: true, providers: getPaymentProviderAvailability() });
  } catch (error) {
    console.error('List payment providers error:', error);
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
    const data = await startJobPostCheckout({
      client,
      req,
      companyUserId: req.user.id,
      provider,
      planId,
      draft,
      jobId: Number.isFinite(jobId) ? jobId : null,
    });

    await client.query('COMMIT');
    return res.status(201).json({
      success: true,
      paymentId: data.payment.id,
      checkoutUrl: data.checkoutUrl,
      plan: data.plan,
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Create checkout session error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Failed to start checkout.' });
  } finally {
    client?.release();
  }
};

const verifyStripeCheckout = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const payment = await getPaymentRecordForCompany(client, req.body?.paymentId, company.id);
    if (!payment) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.provider !== 'stripe') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'This payment does not use Stripe.' });
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

    const verification = await extractStripeVerification(req.body?.sessionId);
    if (payment.provider_checkout_id && payment.provider_checkout_id !== verification.providerCheckoutId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Stripe session does not match this payment.' });
    }

    const result = await finalizeVerifiedPayment({
      client,
      companyUserId: req.user.id,
      payment,
      verification,
    });

    await client.query('COMMIT');
    return res.json({ success: true, payment: result.payment, job: result.job });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Verify Stripe checkout error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Failed to verify Stripe payment.' });
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
    const payment = await getPaymentRecordForCompany(client, req.body?.paymentId, company.id);
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
    return res.json({ success: true, payment: result.payment, job: result.job });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Capture PayPal checkout error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Failed to capture PayPal payment.' });
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
    console.error('Cancel checkout session error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Failed to cancel payment.' });
  } finally {
    client?.release();
  }
};

module.exports = {
  listJobPostingPlans,
  listPaymentProviders,
  createCheckoutSession,
  verifyStripeCheckout,
  capturePayPalCheckout,
  cancelCheckoutSession,
};
