const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.ts');

ensureBaseTestEnv();

const serverRoot = path.resolve(__dirname, '..');
const TEST_IP_FAIL_CLOSED = `198.51.100.${Math.floor(Math.random() * 50) + 10}`;
const TEST_IP_ALERT = `198.51.100.${Math.floor(Math.random() * 50) + 70}`;
const trackedEnvKeys = [
  'SKIP_ENV_FILE_LOAD',
  'REDIS_URL',
  'AUTH_LIMITER_FAIL_CLOSED_AFTER_MS',
  'AUTH_LIMITER_FAIL_CLOSED_FORCE',
  'RATE_LIMITER_ALERT_WEBHOOK_URL',
  'RATE_LIMITER_ALERT_TIMEOUT_MS',
  'AUTH_ATTEMPT_RATE_LIMIT_MAX',
  'AUTH_ATTEMPT_RATE_LIMIT_WINDOW_MS',
  'LOGIN_RATE_LIMIT_MAX',
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
      SKIP_ENV_FILE_LOAD: 'true',
      REDIS_URL: '',
      AUTH_LIMITER_FAIL_CLOSED_AFTER_MS: '60000',
      AUTH_LIMITER_FAIL_CLOSED_FORCE: 'true',
      RATE_LIMITER_ALERT_WEBHOOK_URL: '',
      AUTH_ATTEMPT_RATE_LIMIT_MAX: '5',
      AUTH_ATTEMPT_RATE_LIMIT_WINDOW_MS: '600000',
      LOGIN_RATE_LIMIT_MAX: '5',
    },
    async () => {
      clearServerModuleCache();
      const { createApp } = require('../app');
      const { __resetRateLimitFallbackForTests } = require('../middleware/security');
      __resetRateLimitFallbackForTests();

      const app = createApp();
      const originalDateNow = Date.now;
      try {
        const first = await request(app).post('/api/auth/refresh').set('x-forwarded-for', TEST_IP_FAIL_CLOSED).send({});
        Date.now = () => originalDateNow() + 61000;
        const second = await request(app).post('/api/auth/refresh').set('x-forwarded-for', TEST_IP_FAIL_CLOSED).send({});

        assert.equal(first.status, 401);
        assert.equal(second.status, 503);
        assert.equal(second.body.success, false);
        assert.equal(second.body.error, 'Authentication is temporarily unavailable. Please retry shortly.');
      } finally {
        Date.now = originalDateNow;
      }
    }
  );
});

test('rate limiter degraded mode emits optional alert webhook', async () => {
  await withEnv(
    {
      SKIP_ENV_FILE_LOAD: 'true',
      REDIS_URL: '',
      AUTH_LIMITER_FAIL_CLOSED_AFTER_MS: '0',
      AUTH_LIMITER_FAIL_CLOSED_FORCE: 'false',
      RATE_LIMITER_ALERT_WEBHOOK_URL: 'https://alerts.example/webhook',
      RATE_LIMITER_ALERT_TIMEOUT_MS: '1000',
      AUTH_ATTEMPT_RATE_LIMIT_MAX: '5',
      AUTH_ATTEMPT_RATE_LIMIT_WINDOW_MS: '600000',
      LOGIN_RATE_LIMIT_MAX: '5',
    },
    async () => {
      clearServerModuleCache();
      const originalFetch = global.fetch;
      const fetchCalls = [];
      global.fetch = (async (url: string | URL | Request, options: any = {}) => {
        fetchCalls.push({ url: String(url), options });
        return {
          ok: true,
          json: async () => ({}),
        };
      }) as any;

      try {
        const { createApp } = require('../app');
        const { __resetRateLimitFallbackForTests } = require('../middleware/security');
        __resetRateLimitFallbackForTests();

        const app = createApp();
        await request(app).get('/api/health').set('x-forwarded-for', TEST_IP_ALERT).send();
        await new Promise((resolve) => setTimeout(resolve, 25));

        assert.ok(fetchCalls.length >= 1, 'Expected at least one degraded-mode alert webhook call');
        assert.equal(fetchCalls[0].url, 'https://alerts.example/webhook');
      } finally {
        global.fetch = originalFetch;
      }
    }
  );
});
