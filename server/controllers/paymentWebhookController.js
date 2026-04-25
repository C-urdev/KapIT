const pool = require('../config/database');
const { logger } = require('../config/logger');
const { ensureBaseUserSchemaReady, ensureHiringSchemaReady } = require('../config/runtimeSchema');
const { verifyPayPalWebhookSignature, reconcilePayPalWebhookEvent } = require('../services/paymentService');

const handlePayPalWebhook = async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid PayPal webhook payload.' });
  }

  try {
    await verifyPayPalWebhookSignature({
      headers: req.headers || {},
      webhookEvent: req.body,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode || 401);
    return res.status(statusCode).json({
      success: false,
      error: error?.message || 'Invalid PayPal webhook signature.',
    });
  }

  let client;
  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const result = await reconcilePayPalWebhookEvent({
      client,
      webhookEvent: req.body,
    });

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      received: true,
      eventType: String(req.body?.event_type || '').trim() || null,
      handled: Boolean(result?.handled),
      ignored: Boolean(result?.ignored),
      changed: Boolean(result?.changed),
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => null);
    }
    logger.error({ err: error }, 'PayPal webhook processing failed.');
    return res.status(500).json({
      success: false,
      error: 'Failed to process PayPal webhook event.',
    });
  } finally {
    client?.release();
  }
};

module.exports = {
  handlePayPalWebhook,
};
