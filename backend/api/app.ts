// @ts-nocheck
const { initEnvironment } = require('./config/env.ts');
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
const resumeRoutes = require('./routes/resumeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { warmRuntimeSchemas } = require('./config/runtimeSchema');
const { normalizeOrigin, isKapitPreviewOrigin, isLoopbackOrigin, getAllowedOrigins } = require('./config/origins');
const pool = require('./config/database');
const {
  securityHeaders,
  apiRateLimiter,
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
const { InputValidationError, sanitizeAndValidateInput } = require('./middleware/inputSanitizer');

installConsoleBridge();

const ensureSchemaReady = async () => warmRuntimeSchemas();

const authResponseSecurityHeaders = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
};

const getGlobalQuerySanitizerLimits = () => ({
  maxDepth: Number(process.env.QUERY_INPUT_MAX_DEPTH || 4),
  maxObjectKeys: Number(process.env.QUERY_INPUT_MAX_OBJECT_KEYS || 80),
  maxTotalKeys: Number(process.env.QUERY_INPUT_MAX_TOTAL_KEYS || 200),
  maxArrayLength: Number(process.env.QUERY_INPUT_MAX_ARRAY_LENGTH || 30),
  maxStringLength: Number(process.env.QUERY_INPUT_MAX_STRING_LENGTH || 512),
  maxKeyLength: Number(process.env.QUERY_INPUT_MAX_KEY_LENGTH || 80),
  maxNodes: Number(process.env.QUERY_INPUT_MAX_NODES || 800),
});

const createApp = () => {
  const app = express();
  const allowedOrigins = getAllowedOrigins();
  const isProduction = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
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

        if (!isProduction && isLoopbackOrigin(normalizedOrigin)) {
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
  app.use((req, res, next) => {
    try {
      req.query = sanitizeAndValidateInput(req.query, getGlobalQuerySanitizerLimits());
      return next();
    } catch (error) {
      if (error instanceof InputValidationError) {
        return res.status(Number(error.statusCode || 400)).json({
          success: false,
          error: 'Invalid query payload.',
          details: [
            {
              path: error.path || '',
              code: error.code || 'invalid_input',
              message: error.message,
            },
          ],
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid query payload.',
      });
    }
  });
  app.use(validateWriteRequests);
  app.use('/api', apiRateLimiter);

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
  app.use('/api/auth', authApiRateLimiter, authResponseSecurityHeaders, authRoutes);
  app.use('/api/match-jobs', developerApiRateLimiter);
  app.use('/api', matchRoutes);
  app.use('/api/public', publicApiRateLimiter, publicRoutes);
  app.use('/api/messages', messagesReadRateLimiter, messagesWriteRateLimiter, messagesRoutes);
  app.use('/api/notifications', notificationsRateLimiter, notificationsRoutes);
  app.use('/api/company', companyApiRateLimiter, companyWriteRateLimiter, companyRoutes);
  app.use('/api/developer', developerApiRateLimiter, developerRoutes);
  app.use('/api', developerApiRateLimiter, resumeRoutes);
  app.use('/api', developerApiRateLimiter, uploadRoutes);

  app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  app.get('/api/version', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.json({ version: process.env.VITE_APP_VERSION || Date.now().toString() });
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
    if (err instanceof SyntaxError && err.status === 400 && Object.prototype.hasOwnProperty.call(err, 'body')) {
      return res.status(400).json({
        success: false,
        error: 'Malformed JSON payload.',
      });
    }

    if (err?.type === 'entity.too.large') {
      return res.status(413).json({
        success: false,
        error: 'Request body too large.',
      });
    }

    if (err?.type === 'parameters.too.many') {
      return res.status(413).json({
        success: false,
        error: 'Too many form parameters.',
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
