const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const companyRoutes = require('./routes/companyRoutes');
const developerRoutes = require('./routes/developerRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { warmRuntimeSchemas } = require('./config/runtimeSchema');
const { normalizeOrigin, isKapitVercelOrigin, getAllowedOrigins } = require('./config/origins');
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

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });

const ensureSchemaReady = async () => warmRuntimeSchemas();

const createApp = () => {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(
    cors({
      origin: (origin, callback) => {
        const normalizedOrigin = normalizeOrigin(origin);

        // Same-origin browser requests, server-to-server requests, and some Vercel
        // function invocations may omit the Origin header entirely.
        if (!normalizedOrigin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(normalizedOrigin) || isKapitVercelOrigin(normalizedOrigin)) {
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

  app.use(async (req, res, next) => {
    try {
      await ensureSchemaReady();
    } catch (error) {
      console.warn('Continuing without schema bootstrap (profile saving may fail).');
      console.warn(error?.message || error);
    }

    next();
  });

  app.use('/api/auth', authApiRateLimiter, authRoutes);
  app.use('/api/public', publicApiRateLimiter, publicRoutes);
  app.use('/api/messages', messagesReadRateLimiter, messagesWriteRateLimiter, messagesRoutes);
  app.use('/api/notifications', notificationsRateLimiter, notificationsRoutes);
  app.use('/api/company', companyApiRateLimiter, companyWriteRateLimiter, companyRoutes);
  app.use('/api/developer', developerApiRateLimiter, developerRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  app.use((err, req, res, next) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({
        success: false,
        message: 'Request body too large.',
      });
    }

    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  return app;
};

module.exports = {
  createApp,
  ensureSchemaReady,
};
