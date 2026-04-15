const dotenv = require('dotenv');
const path = require('path');

let initialized = false;

const readEnv = (key) => String(process.env[key] || '').trim();

const requireValue = (key, errors) => {
  if (!readEnv(key)) {
    errors.push(`Missing required environment variable: ${key}`);
  }
};

const requireDatabaseConfig = (errors) => {
  const databaseUrl = readEnv('DATABASE_URL');
  if (databaseUrl) {
    return;
  }

  const dbKeys = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingDbKeys = dbKeys.filter((key) => !readEnv(key));
  if (missingDbKeys.length) {
    errors.push(
      `Missing database configuration. Set DATABASE_URL or all of: ${dbKeys.join(', ')}`
    );
  }
};

const requirePaired = (left, right, errors) => {
  const leftValue = readEnv(left);
  const rightValue = readEnv(right);
  if ((leftValue && !rightValue) || (!leftValue && rightValue)) {
    errors.push(`Environment variables ${left} and ${right} must be set together.`);
  }
};

const validateSecretQuality = (key, errors) => {
  const value = readEnv(key);
  if (!value) {
    return;
  }

  const looksLikePlaceholder = /your-|change-this|example|placeholder/i.test(value);
  if (looksLikePlaceholder) {
    errors.push(`${key} cannot use a placeholder value.`);
  }

  if (value.length < 32) {
    errors.push(`${key} must be at least 32 characters long.`);
  }
};

const validateEnvironment = () => {
  const errors = [];

  requireValue('JWT_SECRET', errors);
  requireValue('JWT_REFRESH_SECRET', errors);
  requireDatabaseConfig(errors);
  requirePaired('PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', errors);

  validateSecretQuality('JWT_SECRET', errors);
  validateSecretQuality('JWT_REFRESH_SECRET', errors);

  if (errors.length) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }
};

const initEnvironment = () => {
  if (initialized) {
    return;
  }

  dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
  dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local'), override: true });
  validateEnvironment();
  initialized = true;
};

module.exports = {
  initEnvironment,
};
