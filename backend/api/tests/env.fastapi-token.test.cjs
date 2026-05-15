const test = require('node:test');
const assert = require('node:assert/strict');

const baseEnv = {
  NODE_ENV: 'development',
  JWT_SECRET: 'dev-jwt-secret-abcdefghijklmnopqrstuvwxyz-1234',
  JWT_REFRESH_SECRET: 'dev-refresh-secret-abcdefghijklmnopqrstuvwxyz-1234',
  DATABASE_URL: 'postgresql://dev_user:dev_pass@localhost:5432/dev',
  FASTAPI_URL: 'http://127.0.0.1:8000',
};

const trackedKeys = [
  ...Object.keys(baseEnv),
  'FASTAPI_INTERNAL_SERVICE_TOKEN',
  'INTERNAL_SERVICE_TOKEN',
];

const clearEnvModuleCache = () => {
  const modulePath = require.resolve('../config/env');
  delete require.cache[modulePath];
};

const withEnv = async (overrides, run) => {
  const snapshot = {};
  trackedKeys.forEach((key) => {
    snapshot[key] = process.env[key];
  });

  Object.entries(baseEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });

  Object.entries(overrides).forEach(([key, value]) => {
    if (value == null) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
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

test('env validation rejects FastAPI URL config without internal service token', async () => {
  await withEnv(
    {
      FASTAPI_INTERNAL_SERVICE_TOKEN: null,
      INTERNAL_SERVICE_TOKEN: null,
    },
    async () => {
      const { initEnvironment } = require('../config/env');
      assert.throws(
        () => initEnvironment(),
        /Set at least one of: FASTAPI_INTERNAL_SERVICE_TOKEN, INTERNAL_SERVICE_TOKEN/
      );
    }
  );
});

test('env validation accepts FastAPI URL config with internal service token', async () => {
  await withEnv(
    {
      FASTAPI_INTERNAL_SERVICE_TOKEN: 'fastapi-internal-token-abcdefghijklmnopqrstuvwxyz-1234',
    },
    async () => {
      const { initEnvironment } = require('../config/env');
      assert.doesNotThrow(() => initEnvironment());
    }
  );
});
