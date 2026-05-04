const pool = require('../config/database');
const { ensureBaseUserSchemaReady } = require('../config/runtimeSchema');
const { logger } = require('../config/logger');
const { serializeUser } = require('../utils/authUserSerializer');
const {
  USER_PREMIUM_PLAN,
  getPaymentProviderAvailability,
  getUserPremiumPaymentRecord,
  normalizeProvider,
  assertLocalBypassAllowed,
  startUserPremiumCheckout,
  completeLocalBypassUserPremiumPayment,
  capturePayPalOrder,
  finalizeVerifiedUserPremiumPayment,
  updateUserPremiumPaymentRecord,
} = require('../services/paymentService');
const { sendUserPremiumPaymentEmail } = require('../services/emailService');

const listUserPremiumPaymentProviders = async (req, res) => {
  try {
    return res.json({
      success: true,
      plan: USER_PREMIUM_PLAN,
      providers: getPaymentProviderAvailability(),
    });
  } catch (error) {
    logger.error('List user premium payment providers error:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading payment providers' });
  }
};

const createUserPremiumCheckoutSession = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const provider = normalizeProvider(req.body?.provider);
    const data = await startUserPremiumCheckout({
      client,
      req,
      userId: req.user.id,
      provider,
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
    logger.error('Create user premium checkout session error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Failed to start checkout.' });
  } finally {
    client?.release();
  }
};

const captureUserPremiumPayPalCheckout = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const payment = await getUserPremiumPaymentRecord(client, req.body?.paymentId, req.user.id, { forUpdate: true });
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

    if (payment.status === 'paid') {
      const result = await finalizeVerifiedUserPremiumPayment({
        client,
        userId: req.user.id,
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
      return res.json({ success: true, payment: result.payment, user: serializeUser(result.user) });
    }

    if (payment.provider_checkout_id && payment.provider_checkout_id !== orderId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'PayPal order does not match this payment.' });
    }

    const verification = await capturePayPalOrder(orderId);
    const result = await finalizeVerifiedUserPremiumPayment({
      client,
      userId: req.user.id,
      payment,
      verification,
    });

    await client.query('COMMIT');
    await sendUserPremiumPaymentEmail({
      to: result?.user?.email || req.user?.email,
      fullName: result?.user?.name || result?.user?.full_name || result?.user?.username || req.user?.name || req.user?.username,
      planLabel: result?.payment?.plan_label || USER_PREMIUM_PLAN.label,
      durationLabel: result?.payment?.plan_duration || USER_PREMIUM_PLAN.durationLabel,
      amount: Number(result?.payment?.amount || USER_PREMIUM_PLAN.price || 0),
      paidAt: result?.payment?.paid_at || new Date().toISOString(),
      provider: result?.payment?.provider || 'paypal',
    }).catch((error) => {
      logger.warn({ err: error }, 'User premium payment email delivery failed.');
    });
    return res.json({ success: true, payment: result.payment, user: serializeUser(result.user) });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Capture user premium PayPal checkout error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Failed to capture PayPal payment.' });
  } finally {
    client?.release();
  }
};

const cancelUserPremiumCheckoutSession = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    const payment = await getUserPremiumPaymentRecord(client, req.params.paymentId, req.user.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (!['pending', 'processing'].includes(String(payment.status || '').toLowerCase())) {
      return res.json({ success: true, payment });
    }

    const updated = await updateUserPremiumPaymentRecord(client, payment.id, {
      status: 'cancelled',
      cancelled_at: new Date(),
    });

    return res.json({ success: true, payment: updated || payment });
  } catch (error) {
    logger.error('Cancel user premium checkout session error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Failed to cancel payment.' });
  } finally {
    client?.release();
  }
};

const completeLocalBypassUserPremiumCheckout = async (req, res) => {
  let client;

  try {
    assertLocalBypassAllowed(req);
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const provider = normalizeProvider(req.body?.provider);
    const result = await completeLocalBypassUserPremiumPayment({
      client,
      userId: req.user.id,
      provider,
      payerEmail: req.user?.email || null,
    });

    await client.query('COMMIT');
    await sendUserPremiumPaymentEmail({
      to: result?.user?.email || req.user?.email,
      fullName: result?.user?.name || result?.user?.full_name || result?.user?.username || req.user?.name || req.user?.username,
      planLabel: result?.payment?.plan_label || USER_PREMIUM_PLAN.label,
      durationLabel: result?.payment?.plan_duration || USER_PREMIUM_PLAN.durationLabel,
      amount: Number(result?.payment?.amount || USER_PREMIUM_PLAN.price || 0),
      paidAt: result?.payment?.paid_at || new Date().toISOString(),
      provider: result?.payment?.provider || provider,
    }).catch((error) => {
      logger.warn({ err: error }, 'User premium localhost bypass receipt email failed.');
    });
    return res.json({
      success: true,
      payment: result.payment,
      user: serializeUser(result.user),
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Complete localhost bypass user premium checkout error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Failed to complete localhost bypass payment.' });
  } finally {
    client?.release();
  }
};

module.exports = {
  listUserPremiumPaymentProviders,
  createUserPremiumCheckoutSession,
  captureUserPremiumPayPalCheckout,
  cancelUserPremiumCheckoutSession,
  completeLocalBypassUserPremiumCheckout,
};
