const test = require('node:test');
const assert = require('node:assert/strict');

const requiredProdEnv = {
  NODE_ENV: 'production',
  JWT_SECRET: 'prod-jwt-secret-abcdefghijklmnopqrstuvwxyz-1234',
  JWT_REFRESH_SECRET: 'prod-refresh-secret-abcdefghijklmnopqrstuvwxyz-1234',
  DATABASE_URL: 'postgresql://prod_user:prod_pass@db.example.com:5432/prod',
  CLIENT_URL: 'https://kapit.example.com',
  NEXT_PUBLIC_SITE_URL: 'https://kapit.example.com',
  EXPRESS_API_URL_PRODUCTION: 'https://api.kapit.example.com/api',
  NEXT_PUBLIC_EXPRESS_API_URL_PRODUCTION: 'https://api.kapit.example.com/api',
  GOOGLE_CLIENT_ID: 'google-client-id-valid',
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'google-client-id-valid',
  GITHUB_CLIENT_ID: 'github-client-id-valid',
  GITHUB_CLIENT_SECRET: 'github-client-secret-valid',
  NEXT_PUBLIC_GITHUB_CLIENT_ID: 'github-client-id-valid',
  ENABLE_LOCAL_AUTH_BYPASS: 'false',
  ENABLE_LOCAL_PAYMENT_BYPASS: 'false',
  NEXT_PUBLIC_ENABLE_LOCAL_AUTH_BYPASS: 'false',
  NEXT_PUBLIC_ENABLE_LOCAL_PAYMENT_BYPASS: 'false',
  PAYPAL_CLIENT_ID: 'paypal-client-id-valid',
  PAYPAL_CLIENT_SECRET: 'paypal-client-secret-valid',
  DB_SSL: 'true',
  FASTAPI_INTERNAL_SERVICE_TOKEN: 'fastapi-internal-service-token-abcdefghijklmnopqrstuvwxyz',
};

const trackedKeys = [
  ...Object.keys(requiredProdEnv),
  'DB_SSL_REJECT_UNAUTHORIZED',
];

const clearEnvModuleCache = () => {
  const modulePath = require.resolve('../config/env');
  delete require.cache[modulePath];
};

const withEnv = async (overrides, run) => {
  const snapshot: Record<string, string | undefined> = {};
  trackedKeys.forEach((key) => {
    snapshot[key] = process.env[key];
  });

  Object.entries(requiredProdEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
  Object.entries(overrides).forEach(([key, value]) => {
    process.env[key] = String(value);
  });

  try {
    clearEnvModuleCache();
    return await run();
  } finally {
    trackedKeys.forEach((key) => {
      if (snapshot[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = snapshot[key];
      }
    });
    clearEnvModuleCache();
  }
};

test('env validation rejects production config when DB_SSL_REJECT_UNAUTHORIZED is not true', async () => {
  await withEnv(
    {
      DB_SSL_REJECT_UNAUTHORIZED: 'false',
    },
    async () => {
      const { initEnvironment } = require('../config/env');
      assert.throws(
        () => initEnvironment(),
        /DB_SSL_REJECT_UNAUTHORIZED must be set to "true" in production\./
      );
    }
  );
});

test('env validation accepts production config when DB_SSL_REJECT_UNAUTHORIZED is true', async () => {
  await withEnv(
    {
      DB_SSL_REJECT_UNAUTHORIZED: 'true',
    },
    async () => {
      const { initEnvironment } = require('../config/env');
      assert.doesNotThrow(() => initEnvironment());
    }
  );
});
