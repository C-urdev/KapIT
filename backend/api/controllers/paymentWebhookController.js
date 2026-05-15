const pool = require('../config/database');
const { logger } = require('../config/logger');
const { ensureBaseUserSchemaReady, ensureHiringSchemaReady } = require('../config/runtimeSchema');
const {
  verifyPayPalWebhookSignature,
  reconcilePayPalWebhookEvent,
  reservePayPalWebhookEvent,
  markPayPalWebhookEventProcessed,
  releasePayPalWebhookEventReservation,
} = require('../services/paymentService');

const handlePayPalWebhook = async (req, res) => {
  const contentType = String(req.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return res.status(415).json({
      success: false,
      error: 'Unsupported content type for PayPal webhook.',
    });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid PayPal webhook payload.' });
  }

  const eventId = String(req.body?.id || '').trim();
  if (!eventId) {
    return res.status(400).json({
      success: false,
      error: 'Missing PayPal webhook event id.',
    });
  }

  let reservation = null;
  try {
    const reserved = await reservePayPalWebhookEvent(eventId);
    if (reserved.duplicate) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate PayPal webhook event.',
      });
    }
    reservation = reserved.reservation;
  } catch (error) {
    return res.status(Number(error?.statusCode || 503)).json({
      success: false,
      error: error?.message || 'Unable to reserve PayPal webhook event.',
    });
  }

  try {
    await verifyPayPalWebhookSignature({
      headers: req.headers || {},
      webhookEvent: req.body,
    });
  } catch (error) {
    await releasePayPalWebhookEventReservation(reservation).catch(() => null);
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
    await markPayPalWebhookEventProcessed(reservation).catch(() => null);
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
    await releasePayPalWebhookEventReservation(reservation).catch(() => null);
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
