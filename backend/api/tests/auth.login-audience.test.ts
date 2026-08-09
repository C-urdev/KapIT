const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.ts');

ensureBaseTestEnv();

const serverRoot = path.resolve(__dirname, '..');
const bcryptPath = require.resolve('bcrypt');
const originalBcryptModule = require.cache[bcryptPath];

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

const mockBcrypt = () => {
  require.cache[bcryptPath] = {
    id: bcryptPath,
    filename: bcryptPath,
    loaded: true,
    exports: {
      compare: async () => true,
      hash: async () => 'hashed-password',
    },
  } as NodeJS.Module;
};

const restoreBcrypt = () => {
  if (originalBcryptModule) {
    require.cache[bcryptPath] = originalBcryptModule;
  } else {
    delete require.cache[bcryptPath];
  }
};

const createUser = (overrides = {}) => ({
  id: 'audience-user-1',
  username: 'audience_user',
  email: 'audience@example.com',
  password: '$2b$12$validhashforaudiencetestonly',
  user_type: 'employee',
  account_type: 'developer',
  role: 'employee',
  profile_completed: false,
  terms_accepted: true,
  terms_accepted_at: new Date().toISOString(),
  name: '',
  education: '',
  desired_job: '',
  bio: '',
  company_name: '',
  address: '',
  industry: '',
  company_size: '',
  ...overrides,
});

const loadApp = ({ user }) => {
  clearServerModuleCache();
  mockBcrypt();

  const state = {
    attachSessionCount: 0,
    user,
  };

  const client = {
    query: async (sql) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();

      if (normalized.startsWith('SELECT * FROM users WHERE email = $1 OR username = $1')) {
        return { rows: state.user ? [state.user] : [] };
      }

      if (normalized.startsWith('UPDATE users SET profile_completed = $1 WHERE id = $2')) {
        return { rows: [] };
      }

      return { rows: [] };
    },
    release: () => {},
  };

  mockServerModule('config/database.js', {
    connect: async () => client,
    query: async () => ({ rows: [] }),
  });
  mockServerModule('services/authSessionService.js', {
    attachSessionCookies: async () => {
      state.attachSessionCount += 1;
      return { csrfToken: 'csrf-audience-test' };
    },
    clearSessionCookies: () => {},
    verifyRefreshTokenSession: async () => {
      throw new Error('refresh not available in test');
    },
    revokeSessionById: async () => {},
    revokeSessionByToken: async () => {},
  });
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
    ensureResumeSchemaReady: async () => {},
  });

  return {
    app: require('../app').createApp(),
    state,
  };
};

test.afterEach(() => {
  restoreBcrypt();
  clearServerModuleCache();
});

test('POST /api/auth/login rejects a developer account on the employer sign-in surface', async () => {
  const { app, state } = loadApp({ user: createUser() });

  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'audience@example.com',
      password: 'CorrectHorse1',
      accountTypeHint: 'company',
    });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
  assert.equal(response.body.code, 'LOGIN_ACCOUNT_TYPE_MISMATCH');
  assert.equal(state.attachSessionCount, 0);
});

test('POST /api/auth/login allows a company account on the employer sign-in surface', async () => {
  const { app, state } = loadApp({
    user: createUser({
      user_type: 'company',
      account_type: 'company',
      company_name: 'KapIT Hiring',
    }),
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'audience@example.com',
      password: 'CorrectHorse1',
      accountTypeHint: 'company',
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.user.accountType, 'company');
  assert.equal(state.attachSessionCount, 1);
});
