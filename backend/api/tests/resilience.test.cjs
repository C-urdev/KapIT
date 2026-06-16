const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { ensureBaseTestEnv, getTestEnvValue } = require('./testEnv.cjs');

ensureBaseTestEnv();

const { createApp } = require('../app');
const pool = require('../config/database');

test('GET /ready returns 503 when database is unavailable', async () => {
  const app = createApp();
  const originalQuery = pool.query.bind(pool);
  pool.query = async () => {
    throw new Error('database unavailable');
  };

  try {
    const response = await request(app).get('/ready');
    assert.equal(response.status, 503);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error, 'Server is not ready');
  } finally {
    pool.query = originalQuery;
  }
});

test('Redis unavailable keeps login route protected via in-memory limiter fallback', async () => {
  delete process.env.REDIS_URL;
  const { __resetRateLimitFallbackForTests } = require('../middleware/security');
  __resetRateLimitFallbackForTests();
  const app = createApp();
  const responses = [];
  for (let attempt = 0; attempt < 7; attempt += 1) {
    // Keep the payload invalid to avoid hitting database auth checks.
    // The limiter runs before validation and should still block.
    // eslint-disable-next-line no-await-in-loop
    const response = await request(app).post('/api/auth/login').send({});
    responses.push(response);
  }

  const blocked = responses.filter((response) => response.status === 429);
  assert.ok(blocked.length >= 1, 'Expected at least one 429 response from in-memory login limiter fallback');
  assert.equal(blocked[0].body.success, false);
  assert.equal(blocked[0].body.error, 'Too many login attempts. Please try again later.');
});

test('Redis unavailable keeps OAuth state route rate-limited via fallback', async () => {
  delete process.env.REDIS_URL;
  const { __resetRateLimitFallbackForTests } = require('../middleware/security');
  __resetRateLimitFallbackForTests();
  const app = createApp();
  const responses = [];

  for (let attempt = 0; attempt < 7; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await request(app).post('/api/auth/oauth/state').send({});
    responses.push(response);
  }

  const blocked = responses.filter((response) => response.status === 429);
  assert.ok(blocked.length >= 1, 'Expected at least one 429 response from OAuth fallback limiter');
  assert.equal(blocked[0].body.success, false);
  assert.equal(blocked[0].body.error, 'Too many authentication attempts. Please try again later.');
});

test('Redis unavailable keeps password reset route rate-limited via fallback', async () => {
  delete process.env.REDIS_URL;
  const { __resetRateLimitFallbackForTests } = require('../middleware/security');
  __resetRateLimitFallbackForTests();
  const app = createApp();
  const responses = [];

  for (let attempt = 0; attempt < 7; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await request(app).post('/api/auth/reset-password').send({});
    responses.push(response);
  }

  const blocked = responses.filter((response) => response.status === 429);
  assert.ok(blocked.length >= 1, 'Expected at least one 429 response from password reset fallback limiter');
  assert.equal(blocked[0].body.success, false);
  assert.equal(blocked[0].body.error, 'Too many password reset attempts. Please try again later.');
});

test('Redis unreachable fails open quickly', async () => {
  const modulePath = require.resolve('../config/redis');
  delete require.cache[modulePath];

  const previousRedisUrl = process.env.REDIS_URL;
  const previousConnectTimeout = process.env.REDIS_CONNECT_TIMEOUT_MS;
  const previousCooldown = process.env.REDIS_FAILOPEN_COOLDOWN_MS;

  process.env.REDIS_URL = 'redis://127.0.0.1:1';
  process.env.REDIS_CONNECT_TIMEOUT_MS = '120';
  process.env.REDIS_FAILOPEN_COOLDOWN_MS = '250';

  try {
    const { getRedisClient, closeRedisClient } = require('../config/redis');
    const started = Date.now();
    const redis = await getRedisClient();
    const elapsedMs = Date.now() - started;

    assert.equal(redis, null);
    assert.ok(elapsedMs < 1500, `Expected Redis fail-open under 1500ms, received ${elapsedMs}ms`);
    await closeRedisClient();
  } finally {
    if (previousRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previousRedisUrl;
    }

    if (previousConnectTimeout === undefined) {
      delete process.env.REDIS_CONNECT_TIMEOUT_MS;
    } else {
      process.env.REDIS_CONNECT_TIMEOUT_MS = previousConnectTimeout;
    }

    if (previousCooldown === undefined) {
      delete process.env.REDIS_FAILOPEN_COOLDOWN_MS;
    } else {
      process.env.REDIS_FAILOPEN_COOLDOWN_MS = previousCooldown;
    }

    delete require.cache[modulePath];
  }
});

test('Redis startup status warns when REDIS_URL is missing', async () => {
  const modulePath = require.resolve('../config/redis');
  delete require.cache[modulePath];

  const previousRedisUrl = process.env.REDIS_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousLogRedisStatus = process.env.LOG_REDIS_STATUS;

  delete process.env.REDIS_URL;
  process.env.NODE_ENV = 'development';
  process.env.LOG_REDIS_STATUS = 'true';

  const originalWarn = console.warn;
  const originalInfo = console.info;
  const logs = [];

  console.warn = (...args) => logs.push(args.map(String).join(' '));
  console.info = (...args) => logs.push(args.map(String).join(' '));

  try {
    const { logRedisStartupStatus } = require('../config/redis');
    const status = await logRedisStartupStatus();

    assert.equal(status.hasRedisUrl, false);
    assert.equal(status.connected, false);
    assert.ok(logs.some((line) => line.includes('Redis startup: REDIS_URL is missing')));
  } finally {
    console.warn = originalWarn;
    console.info = originalInfo;

    if (previousRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previousRedisUrl;
    }
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    if (previousLogRedisStatus === undefined) {
      delete process.env.LOG_REDIS_STATUS;
    } else {
      process.env.LOG_REDIS_STATUS = previousLogRedisStatus;
    }

    delete require.cache[modulePath];
  }
});

test('Redis startup status warns when REDIS_URL exists but Redis is unavailable', async () => {
  const modulePath = require.resolve('../config/redis');
  delete require.cache[modulePath];

  const previousRedisUrl = process.env.REDIS_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousLogRedisStatus = process.env.LOG_REDIS_STATUS;
  const previousConnectTimeout = process.env.REDIS_CONNECT_TIMEOUT_MS;
  const previousCooldown = process.env.REDIS_FAILOPEN_COOLDOWN_MS;

  process.env.REDIS_URL = 'redis://127.0.0.1:1';
  process.env.NODE_ENV = 'development';
  process.env.LOG_REDIS_STATUS = 'true';
  process.env.REDIS_CONNECT_TIMEOUT_MS = '120';
  process.env.REDIS_FAILOPEN_COOLDOWN_MS = '250';

  const originalWarn = console.warn;
  const originalInfo = console.info;
  const logs = [];

  console.warn = (...args) => logs.push(args.map(String).join(' '));
  console.info = (...args) => logs.push(args.map(String).join(' '));

  try {
    const { logRedisStartupStatus, closeRedisClient } = require('../config/redis');
    const status = await logRedisStartupStatus();

    assert.equal(status.hasRedisUrl, true);
    assert.equal(status.connected, false);
    assert.ok(logs.some((line) => line.includes('Redis startup: REDIS_URL is set but Redis is unavailable')));
    await closeRedisClient();
  } finally {
    console.warn = originalWarn;
    console.info = originalInfo;

    if (previousRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previousRedisUrl;
    }
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    if (previousLogRedisStatus === undefined) {
      delete process.env.LOG_REDIS_STATUS;
    } else {
      process.env.LOG_REDIS_STATUS = previousLogRedisStatus;
    }
    if (previousConnectTimeout === undefined) {
      delete process.env.REDIS_CONNECT_TIMEOUT_MS;
    } else {
      process.env.REDIS_CONNECT_TIMEOUT_MS = previousConnectTimeout;
    }
    if (previousCooldown === undefined) {
      delete process.env.REDIS_FAILOPEN_COOLDOWN_MS;
    } else {
      process.env.REDIS_FAILOPEN_COOLDOWN_MS = previousCooldown;
    }

    delete require.cache[modulePath];
  }
});

test('Redis startup status handles malformed REDIS_URL safely', async () => {
  const modulePath = require.resolve('../config/redis');
  delete require.cache[modulePath];

  const previousRedisUrl = process.env.REDIS_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousLogRedisStatus = process.env.LOG_REDIS_STATUS;
  const previousCooldown = process.env.REDIS_FAILOPEN_COOLDOWN_MS;

  process.env.REDIS_URL = 'not-a-redis-url';
  process.env.NODE_ENV = 'development';
  process.env.LOG_REDIS_STATUS = 'true';
  process.env.REDIS_FAILOPEN_COOLDOWN_MS = '100';

  const originalWarn = console.warn;
  const originalInfo = console.info;
  const logs = [];

  console.warn = (...args) => logs.push(args.map(String).join(' '));
  console.info = (...args) => logs.push(args.map(String).join(' '));

  try {
    const { logRedisStartupStatus, getRedisClient, closeRedisClient } = require('../config/redis');
    const status = await logRedisStartupStatus();
    const redis = await getRedisClient();

    assert.equal(status.hasRedisUrl, true);
    assert.equal(status.connected, false);
    assert.equal(redis, null);
    assert.ok(logs.some((line) => line.includes('Redis startup: REDIS_URL is set but Redis is unavailable')));
    await closeRedisClient();
  } finally {
    console.warn = originalWarn;
    console.info = originalInfo;

    if (previousRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previousRedisUrl;
    }
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    if (previousLogRedisStatus === undefined) {
      delete process.env.LOG_REDIS_STATUS;
    } else {
      process.env.LOG_REDIS_STATUS = previousLogRedisStatus;
    }
    if (previousCooldown === undefined) {
      delete process.env.REDIS_FAILOPEN_COOLDOWN_MS;
    } else {
      process.env.REDIS_FAILOPEN_COOLDOWN_MS = previousCooldown;
    }

    delete require.cache[modulePath];
  }
});

test('Payment provider timeout surfaces handled error', async () => {
  process.env.PAYPAL_CLIENT_ID = 'test-client';
  process.env.PAYPAL_CLIENT_SECRET = getTestEnvValue('TEST_PAYPAL_CLIENT_SECRET', 'test-secret');
  process.env.PAYMENT_API_RETRY_MAX = '1';
  process.env.PAYMENT_API_TIMEOUT_MS = '20';

  const modulePath = require.resolve('../services/paymentService');
  delete require.cache[modulePath];
  const paymentService = require('../services/paymentService');
  const originalFetch = global.fetch;
  global.fetch = async () => {
    const err = new Error('timeout');
    err.name = 'AbortError';
    throw err;
  };

  try {
    await assert.rejects(async () => paymentService.capturePayPalOrder('order-123'));
  } finally {
    global.fetch = originalFetch;
  }
});

test('invalid payload spam stays in validation error contract', async () => {
  const { __resetRateLimitFallbackForTests } = require('../middleware/security');
  __resetRateLimitFallbackForTests();
  const app = createApp();
  const requests = Array.from({ length: 10 }).map((_, index) =>
    request(app).post('/api/auth/login').send({ email: `invalid-${index}@example.com` })
  );
  const responses = await Promise.all(requests);

  responses.forEach((response) => {
    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error, 'validation error');
    assert.ok(Array.isArray(response.body.details));
  });
});

test('CSP connect-src no longer allows broad http scheme', async () => {
  const app = createApp();
  const response = await request(app).get('/health');
  const csp = String(response.headers['content-security-policy'] || '');

  assert.ok(csp.includes("connect-src 'self'"));
  assert.equal(/\bconnect-src[^;]*\shttp:(?:\s|;|$)/i.test(csp), false);
});

test('auth protected endpoint rejects missing token', async () => {
  const app = createApp();
  const response = await request(app).get('/api/auth/me');
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error);
});
