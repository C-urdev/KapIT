const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.JWT_SECRET ||= 'test-jwt-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-chars';
process.env.DATABASE_URL ||= 'postgres://test:test@localhost:5432/test';

const { createApp } = require('../app');

test('POST /api/auth/login validates required payload', async () => {
  const app = createApp();
  const response = await request(app).post('/api/auth/login').send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'validation error');
  assert.ok(Array.isArray(response.body.details));

  assert.ok(response.body.details.length >= 1);
});
