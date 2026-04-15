const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.JWT_SECRET ||= 'test-jwt-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-chars';
process.env.DATABASE_URL ||= 'postgres://test:test@localhost:5432/test';

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

test('Redis unavailable uses fail-open limiter behavior', async () => {
  delete process.env.REDIS_URL;
  const app = createApp();
  const response = await request(app).post('/api/auth/login').send({});
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'validation error');
});

test('Payment provider timeout surfaces handled error', async () => {
  process.env.PAYPAL_CLIENT_ID = 'test-client';
  process.env.PAYPAL_CLIENT_SECRET = 'test-secret';
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
  const app = createApp();
  const requests = Array.from({ length: 10 }).map(() => request(app).post('/api/auth/login').send({ foo: 'bar' }));
  const responses = await Promise.all(requests);

  responses.forEach((response) => {
    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error, 'validation error');
    assert.ok(Array.isArray(response.body.details));
  });
});

test('auth protected endpoint rejects missing token', async () => {
  const app = createApp();
  const response = await request(app).get('/api/auth/me');
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error);
});
