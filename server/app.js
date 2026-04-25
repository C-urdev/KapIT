const { initEnvironment } = require('./config/env');
initEnvironment();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { logger, installConsoleBridge, requestContextMiddleware } = require('./config/logger');
const authRoutes = require('./routes/authRoutes');
const paymentWebhookRoutes = require('./routes/paymentWebhookRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const companyRoutes = require('./routes/companyRoutes');
const developerRoutes = require('./routes/developerRoutes');
const publicRoutes = require('./routes/publicRoutes');
const matchRoutes = require('./routes/matchRoutes');
const { warmRuntimeSchemas } = require('./config/runtimeSchema');
const { normalizeOrigin, isKapitPreviewOrigin, getAllowedOrigins } = require('./config/origins');
const pool = require('./config/database');
const {
  securityHeaders,
  authApiRateLimiter,
  publicApiRateLimiter,
  messagesReadRateLimiter,
  messagesWriteRateLimiter,
  notificationsRateLimiter,
  companyApiRateLimiter,
  companyWriteRateLimiter,
  developerApiRateLimiter,
} = require('./middleware/security');
const { validateWriteRequests } = require('./middleware/writeValidation');

installConsoleBridge();

const ensureSchemaReady = async () => warmRuntimeSchemas();

const createApp = () => {
  const app = express();
  const allowedOrigins = getAllowedOrigins();
  const successDataEnvelopeEnabled =
    String(process.env.SUCCESS_RESPONSE_DATA_ENVELOPE || '').toLowerCase() === 'true';

  app.disable('x-powered-by');
  app.use(requestContextMiddleware);
  app.use(securityHeaders);
  app.use(
    cors({
      origin: (origin, callback) => {
        const normalizedOrigin = normalizeOrigin(origin);

        // Same-origin browser requests, server-to-server requests, and some
        // platform function invocations may omit the Origin header entirely.
        if (!normalizedOrigin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(normalizedOrigin) || isKapitPreviewOrigin(normalizedOrigin)) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '200kb' }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: process.env.URLENCODED_BODY_LIMIT || '200kb',
      parameterLimit: Number(process.env.URLENCODED_PARAMETER_LIMIT || 200),
    })
  );
  app.use(validateWriteRequests);

  app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      if (
        successDataEnvelopeEnabled &&
        payload &&
        typeof payload === 'object' &&
        payload.success === true &&
        !Object.prototype.hasOwnProperty.call(payload, 'data')
      ) {
        const { success, ...rest } = payload;
        return originalJson({
          success: true,
          data: rest,
        });
      }

      if (
        payload &&
        typeof payload === 'object' &&
        payload.success === false &&
        !Object.prototype.hasOwnProperty.call(payload, 'error')
      ) {
        const normalizedError = String(payload.message || 'Request failed.');
        const normalized = { success: false, error: normalizedError };
        if (Array.isArray(payload.errors)) {
          normalized.details = payload.errors;
        }
        return originalJson(normalized);
      }
      return originalJson(payload);
    };
    next();
  });

  app.use('/api/payments', paymentWebhookRoutes);
  app.use('/api/auth', authApiRateLimiter, authRoutes);
  app.use('/api/match-jobs', developerApiRateLimiter);
  app.use('/api', matchRoutes);
  app.use('/api/public', publicApiRateLimiter, publicRoutes);
  app.use('/api/messages', messagesReadRateLimiter, messagesWriteRateLimiter, messagesRoutes);
  app.use('/api/notifications', notificationsRateLimiter, notificationsRoutes);
  app.use('/api/company', companyApiRateLimiter, companyWriteRateLimiter, companyRoutes);
  app.use('/api/developer', developerApiRateLimiter, developerRoutes);

  app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  app.get('/ready', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      return res.json({
        success: true,
        message: 'Server is ready',
        checks: {
          database: 'ok',
        },
      });
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: 'Server is not ready',
        checks: {
          database: 'unavailable',
        },
      });
    }
  });

  // Backward-compatible alias for older clients/probes.
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  app.use((err, req, res, next) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({
        success: false,
        error: 'Request body too large.',
      });
    }

    logger.error({ err }, 'Unhandled application error');
    res.status(500).json({
      success: false,
      error: 'Something went wrong!',
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });

  return app;
};

module.exports = {
  createApp,
  ensureSchemaReady,
};
