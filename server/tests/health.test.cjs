const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.JWT_SECRET ||= 'test-jwt-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-chars';
process.env.DATABASE_URL ||= 'postgres://test:test@localhost:5432/test';

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
