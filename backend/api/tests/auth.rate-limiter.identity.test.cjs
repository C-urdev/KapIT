const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.cjs');

ensureBaseTestEnv();

const serverRoot = path.resolve(__dirname, '..');

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
  };
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
    .set('x-forwarded-for', '203.0.113.12')
    .set('Cookie', ['kapit_refresh_token=refresh-token-a'])
    .send({});
  assert.notEqual(first.status, 429);

  const second = await request(app)
    .post('/api/auth/refresh')
    .set('x-forwarded-for', '203.0.113.12')
    .set('Cookie', ['kapit_refresh_token=refresh-token-b'])
    .send({});
  assert.notEqual(second.status, 429);

  const third = await request(app)
    .post('/api/auth/refresh')
    .set('x-forwarded-for', '203.0.113.12')
    .set('Cookie', ['kapit_refresh_token=refresh-token-a'])
    .send({});
  assert.equal(third.status, 429);
});

test('auth limiter: logout route separates users on shared IP by bearer token fingerprint', async () => {
  withLimiterTestEnv();
  const app = loadAppForRateLimiterTests();

  const first = await request(app)
    .post('/api/auth/logout')
    .set('x-forwarded-for', '203.0.113.13')
    .set('Authorization', 'Bearer token-user-a')
    .send({});
  assert.notEqual(first.status, 429);

  const second = await request(app)
    .post('/api/auth/logout')
    .set('x-forwarded-for', '203.0.113.13')
    .set('Authorization', 'Bearer token-user-b')
    .send({});
  assert.notEqual(second.status, 429);

  const third = await request(app)
    .post('/api/auth/logout')
    .set('x-forwarded-for', '203.0.113.13')
    .set('Authorization', 'Bearer token-user-a')
    .send({});
  assert.equal(third.status, 429);
});

test('auth limiter: social signup session route separates shared IP users by social cookie fingerprint', async () => {
  withLimiterTestEnv();
  const app = loadAppForRateLimiterTests();

  const first = await request(app)
    .get('/api/auth/social-signup/session')
    .set('x-forwarded-for', '203.0.113.14')
    .set('Cookie', ['kapit_social_signup=session-a']);
  assert.notEqual(first.status, 429);

  const second = await request(app)
    .get('/api/auth/social-signup/session')
    .set('x-forwarded-for', '203.0.113.14')
    .set('Cookie', ['kapit_social_signup=session-b']);
  assert.notEqual(second.status, 429);

  const third = await request(app)
    .get('/api/auth/social-signup/session')
    .set('x-forwarded-for', '203.0.113.14')
    .set('Cookie', ['kapit_social_signup=session-a']);
  assert.equal(third.status, 429);
});

test('auth limiter: anonymous refresh attempts still fall back to IP bucket', async () => {
  withLimiterTestEnv();
  const app = loadAppForRateLimiterTests();

  const first = await request(app)
    .post('/api/auth/refresh')
    .set('x-forwarded-for', '203.0.113.15')
    .send({});
  assert.notEqual(first.status, 429);

  const second = await request(app)
    .post('/api/auth/refresh')
    .set('x-forwarded-for', '203.0.113.15')
    .send({});
  assert.equal(second.status, 429);
});
