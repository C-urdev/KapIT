const crypto = require('node:crypto');

const randomSecret = (prefix: string) => `${prefix}-${crypto.randomBytes(24).toString('hex')}`;
const randomPassword = (prefix: string) => `${prefix}-${crypto.randomBytes(8).toString('hex')}A1!`;

const getOrSet = (name: string, fallbackValue: string | (() => string)) => {
  const current = String(process.env[name] || '').trim();
  if (current) {
    return current;
  }

  const resolved = typeof fallbackValue === 'function' ? String(fallbackValue()) : String(fallbackValue);
  process.env[name] = resolved;
  return resolved;
};

const ensureBaseTestEnv = () => {
  getOrSet('JWT_SECRET', () => randomSecret('test-jwt'));
  getOrSet('JWT_REFRESH_SECRET', () => randomSecret('test-refresh'));
  getOrSet('DATABASE_URL', 'postgres://test:test@localhost:5432/test');
  getOrSet('FASTAPI_INTERNAL_SERVICE_TOKEN', () => randomSecret('test-fastapi-token'));
};

const getTestEnvValue = (name: string, fallbackValue: string | (() => string)) => getOrSet(name, fallbackValue);

const getTestPasswords = () => ({
  validPassword: getTestEnvValue('TEST_AUTH_VALID_PASSWORD', () => randomPassword('valid-pass')),
  invalidPassword: getTestEnvValue('TEST_AUTH_INVALID_PASSWORD', () => randomPassword('invalid-pass')),
});

module.exports = {
  ensureBaseTestEnv,
  getTestEnvValue,
  getTestPasswords,
};
