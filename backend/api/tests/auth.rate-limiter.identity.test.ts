const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.ts');

ensureBaseTestEnv();

const serverRoot = path.resolve(__dirname, '..');
const TEST_IP_REFRESH = `203.0.113.${Math.floor(Math.random() * 50) + 10}`;
const TEST_IP_LOGOUT = `203.0.113.${Math.floor(Math.random() * 50) + 70}`;
const TEST_IP_SOCIAL = `203.0.113.${Math.floor(Math.random() * 50) + 120}`;
const TEST_IP_ANON = `203.0.113.${Math.floor(Math.random() * 50) + 170}`;
const TEST_TOKEN_SUFFIX = Math.random().toString(36).slice(2, 10);
const REFRESH_TOKEN_A = `refresh-token-a-${TEST_TOKEN_SUFFIX}`;
const REFRESH_TOKEN_B = `refresh-token-b-${TEST_TOKEN_SUFFIX}`;
const BEARER_TOKEN_A = `token-user-a-${TEST_TOKEN_SUFFIX}`;
const BEARER_TOKEN_B = `token-user-b-${TEST_TOKEN_SUFFIX}`;
const SOCIAL_SESSION_A = `session-a-${TEST_TOKEN_SUFFIX}`;
const SOCIAL_SESSION_B = `session-b-${TEST_TOKEN_SUFFIX}`;

const clearServerModuleCache = () => {
  Object.keys(require.cache).forEach((key) => {
    if (key.startsWith(serverRoot)) {
      delete require.cache[key];
    }
  });
};

const mockServerModule = (relativePath, exportsValue) => {
  const modulePath = require.resolve(path.join(serverRoot, relativePath));
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: exportsValue,
  } as unknown as NodeJS.Module;
};

const createAuthSessionServiceMock = () => ({
  ACCESS_COOKIE_NAME: 'kapit_access_token',
  REFRESH_COOKIE_NAME: 'kapit_refresh_token',
  CSRF_COOKIE_NAME: 'kapit_csrf_token',
  signAccessToken: () => 'mock-access-token',
  getTokenPayload: () => ({
    id: 'user-1',
    email: 'user1@example.test',
    username: 'user1',
    userType: 'employee',
    role: 'employee',
    accountType: 'developer',
  }),
  attachSessionCookies: async () => ({ csrfToken: 'csrf-test-token' }),
  clearSessionCookies: () => {},
  verifyRefreshTokenSession: async () => {
    throw new Error('refresh token unavailable in test');
  },
  revokeSessionById: async () => {},
  revokeSessionByToken: async () => {},
});

const createPoolMock = () => {
  const client = {
    query: async () => ({ rows: [] }),
    release: () => {},
  };

  return {
    connect: async () => client,
    query: async () => ({ rows: [] }),
  };
};

const loadAppForRateLimiterTests = () => {
  clearServerModuleCache();
  mockServerModule('config/database.js', createPoolMock());
  mockServerModule('services/authSessionService.js', createAuthSessionServiceMock());
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
  });

  const app = require('../app').createApp();
  const security = require('../middleware/security');
  security.__resetRateLimitFallbackForTests();
  return app;
};

const withLimiterTestEnv = () => {
  process.env.NODE_ENV = 'development';
  process.env.AUTH_ATTEMPT_RATE_LIMIT_MAX = '1';
  process.env.AUTH_ATTEMPT_RATE_LIMIT_WINDOW_MS = '600000';
};

test('auth limiter: refresh route separates users on shared IP by refresh token fingerprint', async () => {
  withLimiterTestEnv();
  const app = loadAppForRateLimiterTests();

  const first = await request(app)
    .post('/api/auth/refresh')
    .set('x-forwarded-for', TEST_IP_REFRESH)
    .set('Cookie', [`kapit_refresh_token=${REFRESH_TOKEN_A}`])
    .send({});
  assert.notEqual(first.status, 429);

  const second = await request(app)
    .post('/api/auth/refresh')
    .set('x-forwarded-for', TEST_IP_REFRESH)
    .set('Cookie', [`kapit_refresh_token=${REFRESH_TOKEN_B}`])
    .send({});
  assert.notEqual(second.status, 429);

  const third = await request(app)
    .post('/api/auth/refresh')
    .set('x-forwarded-for', TEST_IP_REFRESH)
    .set('Cookie', [`kapit_refresh_token=${REFRESH_TOKEN_A}`])
    .send({});
  assert.equal(third.status, 429);
});

test('auth limiter: logout route separates users on shared IP by bearer token fingerprint', async () => {
  withLimiterTestEnv();
  const app = loadAppForRateLimiterTests();

  const first = await request(app)
    .post('/api/auth/logout')
    .set('x-forwarded-for', TEST_IP_LOGOUT)
    .set('Authorization', `Bearer ${BEARER_TOKEN_A}`)
    .send({});
  assert.notEqual(first.status, 429);

  const second = await request(app)
    .post('/api/auth/logout')
    .set('x-forwarded-for', TEST_IP_LOGOUT)
    .set('Authorization', `Bearer ${BEARER_TOKEN_B}`)
    .send({});
  assert.notEqual(second.status, 429);

  const third = await request(app)
    .post('/api/auth/logout')
    .set('x-forwarded-for', TEST_IP_LOGOUT)
    .set('Authorization', `Bearer ${BEARER_TOKEN_A}`)
    .send({});
  assert.equal(third.status, 429);
});

test('auth limiter: social signup session route separates shared IP users by social cookie fingerprint', async () => {
  withLimiterTestEnv();
  const app = loadAppForRateLimiterTests();

  const first = await request(app)
    .get('/api/auth/social-signup/session')
    .set('x-forwarded-for', TEST_IP_SOCIAL)
    .set('Cookie', [`kapit_social_signup=${SOCIAL_SESSION_A}`]);
  assert.notEqual(first.status, 429);

  const second = await request(app)
    .get('/api/auth/social-signup/session')
    .set('x-forwarded-for', TEST_IP_SOCIAL)
    .set('Cookie', [`kapit_social_signup=${SOCIAL_SESSION_B}`]);
  assert.notEqual(second.status, 429);

  const third = await request(app)
    .get('/api/auth/social-signup/session')
    .set('x-forwarded-for', TEST_IP_SOCIAL)
    .set('Cookie', [`kapit_social_signup=${SOCIAL_SESSION_A}`]);
  assert.equal(third.status, 429);
});

test('auth limiter: anonymous refresh attempts still fall back to IP bucket', async () => {
  withLimiterTestEnv();
  const app = loadAppForRateLimiterTests();

  const first = await request(app)
    .post('/api/auth/refresh')
    .set('x-forwarded-for', TEST_IP_ANON)
    .send({});
  assert.notEqual(first.status, 429);

  const second = await request(app)
    .post('/api/auth/refresh')
    .set('x-forwarded-for', TEST_IP_ANON)
    .send({});
  assert.equal(second.status, 429);
});
