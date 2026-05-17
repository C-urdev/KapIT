const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.cjs');

ensureBaseTestEnv();

const { createApp } = require('../app');

const buildNestedObject = (depth) => {
  let value = { leaf: 'ok' };
  for (let index = 0; index < depth; index += 1) {
    value = { next: value };
  }
  return value;
};

const createDeveloperToken = () =>
  jwt.sign(
    {
      id: 'test-developer-id',
      userType: 'employee',
      accountType: 'developer',
      role: 'employee',
    },
    process.env.JWT_SECRET
  );

test('malformed JSON request returns a 400 response', async () => {
  const app = createApp();
  const response = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email":"broken"');

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'Malformed JSON payload.');
});

test('oversized JSON request returns a 413 response', async () => {
  const app = createApp();
  const oversizedPassword = `A1a${'z'.repeat(230000)}`;
  const response = await request(app).post('/api/auth/login').send({
    email: 'sample@example.com',
    password: oversizedPassword,
  });

  assert.equal(response.status, 413);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'Request body too large.');
});

test('request sanitizer strips null bytes before schema validation', async () => {
  const app = createApp();
  const response = await request(app).post('/api/auth/oauth/state').send({
    provider: 'google\u0000',
    mode: 'signup',
    accountTypeHint: 'developer',
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.state, 'string');
  assert.ok(response.body.state.length > 0);
});

test('deeply nested payloads are rejected before controller execution', async () => {
  const app = createApp();
  const response = await request(app)
    .put('/api/developer/profile')
    .set('Authorization', `Bearer ${createDeveloperToken()}`)
    .send({
      profile: buildNestedObject(20),
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'Invalid request payload.');
  assert.equal(response.body.details?.[0]?.code, 'invalid_structure');
});
