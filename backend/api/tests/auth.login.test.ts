const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.ts');

ensureBaseTestEnv();

const { createApp } = require('../app');

test('POST /api/auth/login validates required payload', async () => {
  const app = createApp();
  const response = await request(app)
    .post('/api/auth/login')
    .set('x-forwarded-for', '203.0.113.201')
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'validation error');
  assert.ok(Array.isArray(response.body.details));

  assert.ok(response.body.details.length >= 1);
});
