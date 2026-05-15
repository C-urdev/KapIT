const dotenv = require('dotenv');
const path = require('path');
const { hasPayPalConfig, getPayPalClientId, getPayPalClientSecret } = require('./paymentEnv');

let initialized = false;
let environmentFilesLoaded = false;

const readEnv = (key) => String(process.env[key] || '').trim();

const isProduction = () => readEnv('NODE_ENV').toLowerCase() === 'production';

const getEnvironmentFiles = () => {
  const backendRoot = path.resolve(__dirname, '..', '..');
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  return {
    backendEnv: path.resolve(backendRoot, '.env'),
    backendEnvLocal: path.resolve(backendRoot, '.env.local'),
    repoEnv: path.resolve(repoRoot, '.env'),
    repoEnvLocal: path.resolve(repoRoot, '.env.local'),
  };
};

const loadEnvironmentFiles = () => {
  if (environmentFilesLoaded) {
    return;
  }
  if (readEnv('SKIP_ENV_FILE_LOAD').toLowerCase() === 'true') {
    environmentFilesLoaded = true;
    return;
  }

  const files = getEnvironmentFiles();
  dotenv.config({ path: files.backendEnv });
  dotenv.config({ path: files.repoEnv });

  const allowLocalOverride = !isProduction() && readEnv('NODE_ENV').toLowerCase() !== 'test';
  dotenv.config({ path: files.backendEnvLocal, override: allowLocalOverride });
  dotenv.config({ path: files.repoEnvLocal, override: allowLocalOverride });
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

const validateBooleanString = (key, errors) => {
  const value = readEnv(key);
  if (!value) {
    return;
  }

  if (value !== 'true' && value !== 'false') {
    errors.push(`${key} must be "true" or "false".`);
  }
};

const hasAnyValue = (keys) => keys.some((key) => Boolean(readEnv(key)));

const requireAtLeastOne = (keys, errors) => {
  const hasValue = keys.some((key) => Boolean(readEnv(key)));
  if (!hasValue) {
    errors.push(`Set at least one of: ${keys.join(', ')}`);
  }
};

const validateEnvironment = () => {
  const errors = [];
  const isProduction = readEnv('NODE_ENV').toLowerCase() === 'production';
  const fastApiConfigured = hasAnyValue([
    'FASTAPI_URL_PRODUCTION',
    'NEXT_PUBLIC_FASTAPI_URL_PRODUCTION',
    'FASTAPI_URL',
    'NEXT_PUBLIC_FASTAPI_URL',
  ]);

  requireValue('JWT_SECRET', errors);
  requireValue('JWT_REFRESH_SECRET', errors);
  requireDatabaseConfig(errors);
  if (fastApiConfigured) {
    requireAtLeastOne(['FASTAPI_INTERNAL_SERVICE_TOKEN', 'INTERNAL_SERVICE_TOKEN'], errors);
  }
  const payPalClientId = getPayPalClientId();
  const payPalClientSecret = getPayPalClientSecret();
  if ((payPalClientId && !payPalClientSecret) || (!payPalClientId && payPalClientSecret)) {
    errors.push('Environment variables PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set together.');
  }

  validateSecretQuality('JWT_SECRET', errors);
  validateSecretQuality('JWT_REFRESH_SECRET', errors);
  validateBooleanString('ENABLE_LOCAL_AUTH_BYPASS', errors);
  validateBooleanString('ENABLE_LOCAL_PAYMENT_BYPASS', errors);
  validateBooleanString('NEXT_PUBLIC_ENABLE_LOCAL_AUTH_BYPASS', errors);
  validateBooleanString('NEXT_PUBLIC_ENABLE_LOCAL_PAYMENT_BYPASS', errors);
  validateBooleanString('ALLOW_KAPIT_NETLIFY_PREVIEW', errors);
  validateBooleanString('AUTH_LIMITER_FAIL_CLOSED_FORCE', errors);

  if (readEnv('JWT_EXPIRE') && !readEnv('JWT_ACCESS_EXPIRE')) {
    errors.push('JWT_EXPIRE is deprecated. Use JWT_ACCESS_EXPIRE and JWT_REFRESH_EXPIRE_DAYS.');
  }

  if (isProduction) {
    requireValue('CLIENT_URL', errors);
    validateUrl('CLIENT_URL', errors);
    requireValue('NEXT_PUBLIC_SITE_URL', errors);
    validateUrl('NEXT_PUBLIC_SITE_URL', errors);

    requireAtLeastOne(
      ['EXPRESS_API_URL_PRODUCTION', 'NEXT_PUBLIC_EXPRESS_API_URL_PRODUCTION'],
      errors
    );
    validateUrl('EXPRESS_API_URL_PRODUCTION', errors);
    validateUrl('NEXT_PUBLIC_EXPRESS_API_URL_PRODUCTION', errors);
    validateUrl('FASTAPI_URL_PRODUCTION', errors);
    validateUrl('NEXT_PUBLIC_FASTAPI_URL_PRODUCTION', errors);
    if (fastApiConfigured) {
      const fastApiInternalToken = readEnv('FASTAPI_INTERNAL_SERVICE_TOKEN');
      const legacyInternalToken = readEnv('INTERNAL_SERVICE_TOKEN');
      if (fastApiInternalToken) {
        validateSecretQuality('FASTAPI_INTERNAL_SERVICE_TOKEN', errors);
      }
      if (!fastApiInternalToken && legacyInternalToken) {
        validateSecretQuality('INTERNAL_SERVICE_TOKEN', errors);
      }
    }

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

    const hasPayPal = hasPayPalConfig();
    if (!hasPayPal) {
      errors.push('Configure PayPal in production (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET).');
    }

    if (readEnv('ENABLE_LOCAL_AUTH_BYPASS').toLowerCase() === 'true') {
      errors.push('ENABLE_LOCAL_AUTH_BYPASS must be false in production.');
    }

    if (readEnv('ENABLE_LOCAL_PAYMENT_BYPASS').toLowerCase() === 'true') {
      errors.push('ENABLE_LOCAL_PAYMENT_BYPASS must be false in production.');
    }

    if (readEnv('NEXT_PUBLIC_ENABLE_LOCAL_AUTH_BYPASS').toLowerCase() === 'true') {
      errors.push('NEXT_PUBLIC_ENABLE_LOCAL_AUTH_BYPASS must be false in production.');
    }

    if (readEnv('NEXT_PUBLIC_ENABLE_LOCAL_PAYMENT_BYPASS').toLowerCase() === 'true') {
      errors.push('NEXT_PUBLIC_ENABLE_LOCAL_PAYMENT_BYPASS must be false in production.');
    }

    if (readEnv('DB_SSL_REJECT_UNAUTHORIZED').toLowerCase() !== 'true') {
      errors.push('DB_SSL_REJECT_UNAUTHORIZED must be set to "true" in production.');
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
  getEnvironmentFiles,
  loadEnvironmentFiles,
  initEnvironment,
};
