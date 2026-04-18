const dotenv = require('dotenv');
const path = require('path');

let initialized = false;
let environmentFilesLoaded = false;

const readEnv = (key) => String(process.env[key] || '').trim();

const loadEnvironmentFiles = () => {
  if (environmentFilesLoaded) {
    return;
  }

  dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
  dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local'), override: true });
  environmentFilesLoaded = true;
};

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

const validateUrl = (key, errors) => {
  const value = readEnv(key);
  if (!value) {
    return;
  }

  try {
    new URL(value);
  } catch {
    errors.push(`${key} must be a valid URL.`);
  }
};

const requireAtLeastOne = (keys, errors) => {
  const hasValue = keys.some((key) => Boolean(readEnv(key)));
  if (!hasValue) {
    errors.push(`Set at least one of: ${keys.join(', ')}`);
  }
};

const validateEnvironment = () => {
  const errors = [];
  const isProduction = readEnv('NODE_ENV').toLowerCase() === 'production';

  requireValue('JWT_SECRET', errors);
  requireValue('JWT_REFRESH_SECRET', errors);
  requireDatabaseConfig(errors);
  requirePaired('PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', errors);

  validateSecretQuality('JWT_SECRET', errors);
  validateSecretQuality('JWT_REFRESH_SECRET', errors);

  if (readEnv('JWT_EXPIRE') && !readEnv('JWT_ACCESS_EXPIRE')) {
    errors.push('JWT_EXPIRE is deprecated. Use JWT_ACCESS_EXPIRE and JWT_REFRESH_EXPIRE_DAYS.');
  }

  if (isProduction) {
    requireValue('NEXT_PUBLIC_SITE_URL', errors);
    validateUrl('NEXT_PUBLIC_SITE_URL', errors);

    requireAtLeastOne(
      ['EXPRESS_API_URL_PRODUCTION', 'NEXT_PUBLIC_EXPRESS_API_URL_PRODUCTION'],
      errors
    );

    const hasGoogleConfig = Boolean(readEnv('GOOGLE_CLIENT_ID') || readEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID'));
    if (hasGoogleConfig) {
      requirePaired('GOOGLE_CLIENT_ID', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', errors);
    }

    const hasGitHubConfig = Boolean(
      readEnv('GITHUB_CLIENT_ID') ||
      readEnv('GITHUB_CLIENT_SECRET') ||
      readEnv('NEXT_PUBLIC_GITHUB_CLIENT_ID')
    );
    if (hasGitHubConfig) {
      requireValue('GITHUB_CLIENT_ID', errors);
      requireValue('GITHUB_CLIENT_SECRET', errors);
      requireValue('NEXT_PUBLIC_GITHUB_CLIENT_ID', errors);
    }

    const hasStripe = Boolean(readEnv('STRIPE_SECRET_KEY'));
    const hasPayPal = Boolean(readEnv('PAYPAL_CLIENT_ID') && readEnv('PAYPAL_CLIENT_SECRET'));
    if (!hasStripe && !hasPayPal) {
      errors.push('Configure at least one payment provider in production (Stripe or PayPal).');
    }

    if (readEnv('ENABLE_LOCAL_PAYMENT_BYPASS').toLowerCase() === 'true') {
      errors.push('ENABLE_LOCAL_PAYMENT_BYPASS must be false in production.');
    }
  }

  if (errors.length) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }
};

const initEnvironment = () => {
  if (initialized) {
    return;
  }

  loadEnvironmentFiles();
  validateEnvironment();
  initialized = true;
};

module.exports = {
  loadEnvironmentFiles,
  initEnvironment,
};
