const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET ||= 'test-jwt-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-chars';
process.env.DATABASE_URL ||= 'postgres://test:test@localhost:5432/test';
process.env.FASTAPI_URL ||= 'http://127.0.0.1:8000';

const { createApp } = require('../app');

const getAccessToken = () =>
  jwt.sign(
    {
      id: 'fcbe1983-6809-4b03-8321-f2b40c3cb4c0',
      userType: 'employee',
      accountType: 'developer',
      role: 'employee',
    },
    process.env.JWT_SECRET,
    { expiresIn: '20m' }
  );

test('POST /api/match-jobs returns normalized matches', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => [
      {
        id: 12,
        title: 'Frontend Developer',
        match: 78,
        matched_skills: ['react', 'javascript'],
        missing_skills: ['node'],
      },
    ],
  });

  try {
    const app = createApp();
    const response = await request(app)
      .post('/api/match-jobs')
      .set('Authorization', `Bearer ${getAccessToken()}`)
      .send({
        skills: ['React', 'JavaScript'],
        experience: 'junior',
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(Array.isArray(response.body.matches), true);
    assert.equal(response.body.matches[0].title, 'Frontend Developer');
    assert.equal(response.body.matches[0].match, 78);
    assert.deepEqual(response.body.matches[0].matched_skills, ['react', 'javascript']);
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/match-jobs rejects invalid request body', async () => {
  const app = createApp();
  const response = await request(app)
    .post('/api/match-jobs')
    .set('Authorization', `Bearer ${getAccessToken()}`)
    .send({
      skills: [],
      experience: 'unknown-level',
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'validation error');
});

test('POST /api/match-jobs handles FastAPI non-200 errors', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 502,
    json: async () => ({ message: 'upstream unavailable' }),
  });

  try {
    const app = createApp();
    const response = await request(app)
      .post('/api/match-jobs')
      .set('Authorization', `Bearer ${getAccessToken()}`)
      .send({
        skills: ['react'],
        experience: 'junior',
      });

    assert.equal(response.status, 502);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error, 'Unable to match jobs right now.');
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/match-jobs handles invalid FastAPI response shapes', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ matches: [] }),
  });

  try {
    const app = createApp();
    const response = await request(app)
      .post('/api/match-jobs')
      .set('Authorization', `Bearer ${getAccessToken()}`)
      .send({
        skills: ['react'],
        experience: 'junior',
      });

    assert.equal(response.status, 502);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error, 'Unable to match jobs right now.');
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/match-jobs maps timeout to 504', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    const timeoutError = new Error('aborted');
    timeoutError.name = 'AbortError';
    throw timeoutError;
  };

  try {
    const app = createApp();
    const response = await request(app)
      .post('/api/match-jobs')
      .set('Authorization', `Bearer ${getAccessToken()}`)
      .send({
        skills: ['react'],
        experience: 'junior',
      });

    assert.equal(response.status, 504);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error, 'Unable to match jobs right now.');
  } finally {
    global.fetch = originalFetch;
  }
});
