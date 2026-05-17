const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.cjs');

ensureBaseTestEnv();

const { createApp } = require('../app');

test('GET /api/health returns service status', async () => {
  const app = createApp();
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'Server is running');
});

test('GET /health returns liveness status', async () => {
  const app = createApp();
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'Server is running');
});

test('GET /health uses success data envelope when compatibility flag is enabled', async () => {
  const previous = process.env.SUCCESS_RESPONSE_DATA_ENVELOPE;
  process.env.SUCCESS_RESPONSE_DATA_ENVELOPE = 'true';

  try {
    const app = createApp();
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.deepEqual(response.body.data, { message: 'Server is running' });
  } finally {
    if (previous == null) {
      delete process.env.SUCCESS_RESPONSE_DATA_ENVELOPE;
    } else {
      process.env.SUCCESS_RESPONSE_DATA_ENVELOPE = previous;
    }
  }
});
