const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.cjs');

ensureBaseTestEnv();

const serverRoot = path.resolve(__dirname, '..');
const trackedEnvKeys = [
  'REDIS_URL',
  'AUTH_LIMITER_FAIL_CLOSED_AFTER_MS',
  'AUTH_LIMITER_FAIL_CLOSED_FORCE',
  'RATE_LIMITER_ALERT_WEBHOOK_URL',
  'RATE_LIMITER_ALERT_TIMEOUT_MS',
];

const clearServerModuleCache = () => {
  Object.keys(require.cache).forEach((key) => {
    if (key.startsWith(serverRoot)) {
      delete require.cache[key];
    }
  });
};

const withEnv = async (overrides, run) => {
  const snapshot = {};
  trackedEnvKeys.forEach((key) => {
    snapshot[key] = process.env[key];
  });

  Object.entries(overrides).forEach(([key, value]) => {
    if (value == null) {
      delete process.env[key];
      return;
    }
    process.env[key] = String(value);
  });

  try {
    return await run();
  } finally {
    trackedEnvKeys.forEach((key) => {
      if (snapshot[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = snapshot[key];
      }
    });
    clearServerModuleCache();
  }
};

test('auth limiter can fail closed after prolonged degraded mode when explicitly enabled', async () => {
  await withEnv(
    {
      REDIS_URL: '',
      AUTH_LIMITER_FAIL_CLOSED_AFTER_MS: '1',
      AUTH_LIMITER_FAIL_CLOSED_FORCE: 'true',
      RATE_LIMITER_ALERT_WEBHOOK_URL: '',
    },
    async () => {
      clearServerModuleCache();
      const { createApp } = require('../app');
      const { __resetRateLimitFallbackForTests } = require('../middleware/security');
      __resetRateLimitFallbackForTests();

      const app = createApp();
      const first = await request(app).post('/api/auth/login').send({});
      await new Promise((resolve) => setTimeout(resolve, 5));
      const second = await request(app).post('/api/auth/login').send({});

      assert.equal(first.status, 400);
      assert.equal(second.status, 503);
      assert.equal(second.body.success, false);
      assert.equal(second.body.error, 'Authentication is temporarily unavailable. Please retry shortly.');
    }
  );
});

test('rate limiter degraded mode emits optional alert webhook', async () => {
  await withEnv(
    {
      REDIS_URL: '',
      AUTH_LIMITER_FAIL_CLOSED_AFTER_MS: '0',
      AUTH_LIMITER_FAIL_CLOSED_FORCE: 'false',
      RATE_LIMITER_ALERT_WEBHOOK_URL: 'https://alerts.example/webhook',
      RATE_LIMITER_ALERT_TIMEOUT_MS: '1000',
    },
    async () => {
      clearServerModuleCache();
      const originalFetch = global.fetch;
      const fetchCalls = [];
      global.fetch = async (url, options = {}) => {
        fetchCalls.push({ url: String(url), options });
        return {
          ok: true,
          json: async () => ({}),
        };
      };

      try {
        const { createApp } = require('../app');
        const { __resetRateLimitFallbackForTests } = require('../middleware/security');
        __resetRateLimitFallbackForTests();

        const app = createApp();
        await request(app).post('/api/auth/login').send({});
        await new Promise((resolve) => setTimeout(resolve, 25));

        assert.ok(fetchCalls.length >= 1, 'Expected at least one degraded-mode alert webhook call');
        assert.equal(fetchCalls[0].url, 'https://alerts.example/webhook');
      } finally {
        global.fetch = originalFetch;
      }
    }
  );
});
