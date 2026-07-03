const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.ts');

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
  } as NodeJS.Module;
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
  signAccessToken: (user) =>
    jwt.sign(
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

const createProfilePoolMock = () => {
  const users = [
    {
      id: 'profile-security-user-1',
      username: 'profile_user_1',
      email: 'profile-user-1@example.com',
      password: 'hashed-password',
      user_type: 'employee',
      account_type: 'developer',
      role: 'employee',
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
      created_at: new Date().toISOString(),
    },
  ];

  const client = {
    query: async (sql, params = []) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();

      if (normalized === 'SELECT * FROM users WHERE id = $1') {
        const [userId] = params;
        const row = users.find((entry) => entry.id === userId);
        return { rows: row ? [row] : [] };
      }

      if (normalized.startsWith('UPDATE users SET ') && normalized.includes(' WHERE id = $') && normalized.endsWith(' RETURNING *')) {
        const setClause = normalized.split('UPDATE users SET ')[1].split(' WHERE id = $')[0];
        const assignments = setClause.split(',').map((segment) => segment.trim()).filter(Boolean);
        const userId = params[params.length - 1];
        const row = users.find((entry) => entry.id === userId);
        if (!row) {
          return { rows: [] };
        }

        assignments.forEach((assignment, index) => {
          const column = assignment.split(' = ')[0];
          row[column] = params[index];
        });

        return { rows: [row] };
      }

      return { rows: [] };
    },
    release: () => {},
  };

  return {
    connect: async () => client,
    query: async () => ({ rows: [] }),
    __users: users,
  };
};

const loadAppForProfileSecurity = () => {
  clearServerModuleCache();
  const poolMock = createProfilePoolMock();

  mockServerModule('config/database.js', poolMock);
  mockServerModule('services/authSessionService.js', createAuthSessionServiceMock());
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
  });

  return {
    app: require('../app').createApp(),
    poolMock,
  };
};

const createDeveloperToken = (userId) =>
  jwt.sign(
    {
      id: userId,
      userType: 'employee',
      accountType: 'developer',
      role: 'employee',
    },
    process.env.JWT_SECRET
  );

test('PATCH /api/auth/profile rejects isPremium self-upgrade attempts', async () => {
  const { app, poolMock } = loadAppForProfileSecurity();
  const userId = poolMock.__users[0].id;
  const token = createDeveloperToken(userId);

  const response = await request(app)
    .patch('/api/auth/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ isPremium: true });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(Boolean(poolMock.__users[0].is_premium), false);
});

test('PATCH /api/auth/profile with mixed payload does not change premium or profile fields when isPremium is present', async () => {
  const { app, poolMock } = loadAppForProfileSecurity();
  const userId = poolMock.__users[0].id;
  const token = createDeveloperToken(userId);
  const originalBio = String(poolMock.__users[0].bio || '');

  const response = await request(app)
    .patch('/api/auth/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ bio: 'should-not-apply', isPremium: true });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(Boolean(poolMock.__users[0].is_premium), false);
  assert.equal(String(poolMock.__users[0].bio || ''), originalBio);
});

test('PATCH /api/auth/profile still allows normal profile updates and keeps premium unchanged', async () => {
  const { app, poolMock } = loadAppForProfileSecurity();
  const userId = poolMock.__users[0].id;
  const token = createDeveloperToken(userId);

  const response = await request(app)
    .patch('/api/auth/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ bio: 'updated biography' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(String(poolMock.__users[0].bio || ''), 'updated biography');
  assert.equal(Boolean(poolMock.__users[0].is_premium), false);
});

test('PATCH /api/auth/profile accepts empty age and stores null instead of throwing', async () => {
  const { app, poolMock } = loadAppForProfileSecurity();
  const userId = poolMock.__users[0].id;
  const token = createDeveloperToken(userId);

  poolMock.__users[0].age = 27;

  const response = await request(app)
    .patch('/api/auth/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ age: '' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(poolMock.__users[0].age, null);
});
