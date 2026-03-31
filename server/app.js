const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const companyRoutes = require('./routes/companyRoutes');
const developerRoutes = require('./routes/developerRoutes');
const { warmRuntimeSchemas } = require('./config/runtimeSchema');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });

const ensureSchemaReady = async () => warmRuntimeSchemas();

const createApp = () => {
  const app = express();
  const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');
  const isKapitVercelOrigin = (origin) => /^https:\/\/kapit-website(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);

  const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://kapit-website.vercel.app',
    'http://localhost:5173',
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

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

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(async (req, res, next) => {
    try {
      await ensureSchemaReady();
    } catch (error) {
      console.warn('Continuing without schema bootstrap (profile saving may fail).');
      console.warn(error?.message || error);
    }

    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/company', companyRoutes);
  app.use('/api/developer', developerRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  app.use((err, req, res, next) => {
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
