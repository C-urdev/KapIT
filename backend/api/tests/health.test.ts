const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.ts');

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

test('GET /api/version stays stable across requests when no deploy version env is set', async () => {
  const previousBuildVersion = process.env.VITE_BUILD_VERSION;
  const previousAppVersion = process.env.VITE_APP_VERSION;
  const previousRenderCommit = process.env.RENDER_GIT_COMMIT;
  const originalNow = Date.now;
  delete process.env.VITE_BUILD_VERSION;
  delete process.env.VITE_APP_VERSION;
  delete process.env.RENDER_GIT_COMMIT;

  let nowValue = 1000;
  Date.now = () => {
    nowValue += 1;
    return nowValue;
  };

  try {
    const app = createApp();
    const first = await request(app).get('/api/version');
    const second = await request(app).get('/api/version');

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(first.body.version, second.body.version);
  } finally {
    Date.now = originalNow;

    if (previousBuildVersion == null) {
      delete process.env.VITE_BUILD_VERSION;
    } else {
      process.env.VITE_BUILD_VERSION = previousBuildVersion;
    }

    if (previousAppVersion == null) {
      delete process.env.VITE_APP_VERSION;
    } else {
      process.env.VITE_APP_VERSION = previousAppVersion;
    }

    if (previousRenderCommit == null) {
      delete process.env.RENDER_GIT_COMMIT;
    } else {
      process.env.RENDER_GIT_COMMIT = previousRenderCommit;
    }
  }
});
