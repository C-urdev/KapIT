const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.cjs');

ensureBaseTestEnv();

const { createApp } = require('../app');

test('response envelope rollout: legacy mode keeps existing success payload shape', async () => {
  const previous = process.env.SUCCESS_RESPONSE_DATA_ENVELOPE;
  delete process.env.SUCCESS_RESPONSE_DATA_ENVELOPE;

  try {
    const app = createApp();
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'Server is running');
    assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'data'), false);
  } finally {
    if (previous == null) {
      delete process.env.SUCCESS_RESPONSE_DATA_ENVELOPE;
    } else {
      process.env.SUCCESS_RESPONSE_DATA_ENVELOPE = previous;
    }
  }
});

test('response envelope rollout: new mode wraps payload under data', async () => {
  const previous = process.env.SUCCESS_RESPONSE_DATA_ENVELOPE;
  process.env.SUCCESS_RESPONSE_DATA_ENVELOPE = 'true';

  try {
    const app = createApp();
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.deepEqual(response.body.data, { message: 'Server is running' });
    assert.equal(Object.prototype.hasOwnProperty.call(response.body, 'message'), false);
  } finally {
    if (previous == null) {
      delete process.env.SUCCESS_RESPONSE_DATA_ENVELOPE;
    } else {
      process.env.SUCCESS_RESPONSE_DATA_ENVELOPE = previous;
    }
  }
});
