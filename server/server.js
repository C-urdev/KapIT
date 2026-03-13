const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const companyRoutes = require('./routes/companyRoutes');
const { ensureUsersProfileSchema } = require('./config/ensureUsersProfileSchema');
const { ensureCompanySchema } = require('./config/ensureCompanySchema');
const { ensureOnboardingSchema } = require('./config/ensureOnboardingSchema');
const developerRoutes = require('./routes/developerRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin) and explicitly allowed browser origins.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/developer', developerRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await ensureUsersProfileSchema();
    await ensureCompanySchema();
    await ensureOnboardingSchema();
    console.log('✅ Database schema ready');
  } catch (error) {
    console.warn('⚠️  Continuing without schema bootstrap (profile saving may fail).');
    console.warn(error?.message || error);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
