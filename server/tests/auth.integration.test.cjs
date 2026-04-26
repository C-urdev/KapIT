const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const request = require('supertest');

process.env.JWT_SECRET ||= 'test-jwt-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-chars';
process.env.DATABASE_URL ||= 'postgres://test:test@localhost:5432/test';

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
  getTokenPayload: (user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    userType: user.user_type,
    role: user.role || user.user_type,
    accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
  }),
  signAccessToken: (user) => jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      userType: user.user_type,
      role: user.role || user.user_type,
      accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
    },
    process.env.JWT_SECRET,
    { expiresIn: '20m' }
  ),
  attachSessionCookies: async () => ({ csrfToken: 'csrf-test-token' }),
  clearSessionCookies: () => {},
  verifyRefreshTokenSession: async () => {
    throw new Error('refresh not available in test');
  },
  revokeSessionById: async () => {},
  revokeSessionByToken: async () => {},
});

const createAuthPoolMock = () => {
  const users = [];

  const client = {
    query: async (sql, params = []) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();

      if (normalized.startsWith('SELECT * FROM users WHERE email = $1 OR username = $2')) {
        const [email, username] = params;
        const row = users.find((user) => user.email === email || user.username === username);
        return { rows: row ? [row] : [] };
      }

      if (normalized.startsWith('INSERT INTO users (id, username, email, password, user_type, account_type)')) {
        const [id, username, email, password, userType, accountType] = params;
        const now = new Date().toISOString();
        const row = {
          id,
          username,
          email,
          password,
          user_type: userType,
          account_type: accountType,
          role: userType,
          is_premium: false,
          profile_completed: false,
          bio: '',
          socials: '',
          profile_image: '',
          phone: '',
          address: '',
          name: '',
          education: '',
          vocational_course: '',
          desired_job: '',
          birthday: null,
          age: null,
          sex: '',
          company_name: '',
          industry: '',
          company_size: '',
          website: '',
          hiring_for: '',
          created_at: now,
        };
        users.push(row);
        return { rows: [row] };
      }

      if (normalized.startsWith('SELECT * FROM users WHERE email = $1 OR username = $1 LIMIT 1')) {
        const [identifier] = params;
        const row = users.find((user) => user.email === identifier || user.username === identifier);
        return { rows: row ? [row] : [] };
      }

      if (normalized.startsWith('UPDATE users SET profile_completed = $1 WHERE id = $2')) {
        const [profileCompleted, userId] = params;
        const row = users.find((user) => user.id === userId);
        if (row) {
          row.profile_completed = Boolean(profileCompleted);
        }
        return { rows: row ? [row] : [] };
      }

      return { rows: [] };
    },
    release: () => {},
  };

  return {
    connect: async () => client,
    query: async () => ({ rows: [] }),
  };
};

const loadAppForAuthIntegration = () => {
  clearServerModuleCache();
  mockServerModule('config/database.js', createAuthPoolMock());
  mockServerModule('services/authSessionService.js', createAuthSessionServiceMock());
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
  });

  return require('../app').createApp();
};

const assertSuccessShape = (body) => {
  assert.equal(body.success, true);
  const hasLegacy = typeof body.message !== 'undefined' || typeof body.user !== 'undefined';
  const hasEnvelope = typeof body.data !== 'undefined';
  assert.equal(hasLegacy || hasEnvelope, true);
};

test('auth integration: register + login success, generic login failure, and missing fields fail', async () => {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_LOCAL_AUTH_BYPASS = 'true';

  const app = loadAppForAuthIntegration();

  const registerPayload = {
    username: 'qa_user_001',
    email: 'mock-qa_user_001@example.com',
    password: 'StrongPass123',
    accountType: 'developer',
  };

  const registerResponse = await request(app).post('/api/auth/register').send(registerPayload);
  assert.equal(registerResponse.status, 201);
  assertSuccessShape(registerResponse.body);

  const loginSuccess = await request(app)
    .post('/api/auth/login')
    .send({ email: registerPayload.email, password: registerPayload.password });
  assert.equal(loginSuccess.status, 200);
  assertSuccessShape(loginSuccess.body);

  const wrongPassword = await request(app)
    .post('/api/auth/login')
    .send({ email: registerPayload.email, password: 'WrongPass123' });
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongPassword.body.success, false);
  assert.equal(wrongPassword.body.error, 'Invalid email or password');

  const unknownAccount = await request(app)
    .post('/api/auth/login')
    .send({ email: 'missing-user@example.com', password: 'WrongPass123' });
  assert.equal(unknownAccount.status, 401);
  assert.equal(unknownAccount.body.success, false);
  assert.equal(unknownAccount.body.error, 'Invalid email or password');

  const missingFields = await request(app)
    .post('/api/auth/register')
    .send({ username: 'missing_fields_only' });
  assert.equal(missingFields.status, 400);
  assert.equal(missingFields.body.success, false);
  assert.equal(missingFields.body.error, 'validation error');
  assert.ok(Array.isArray(missingFields.body.details));
});
