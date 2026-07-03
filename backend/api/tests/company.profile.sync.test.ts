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

const createPoolMock = () => {
  const company: Record<string, any> = { id: 'company-1', user_id: 'company-user-2', name: 'Old Name' };
  const users = {
    'company-user-2': {
      id: 'company-user-2',
      username: 'company_owner',
      user_type: 'company',
      account_type: 'company',
      email: 'owner@example.com',
      phone: '',
      company_name: 'Old Name',
      industry: 'Stale Industry',
      company_size: 'Stale Size',
      website: '',
      bio: '',
      address: '',
      profile_image: '',
      is_premium: false,
      profile_completed: true,
      socials: '',
      name: '',
      education: '',
      vocational_course: '',
      desired_job: '',
      birthday: null,
      age: null,
      sex: '',
      hiring_for: '',
    },
  };

  const existingCompanyProfile = {
    industry: 'Stale Industry',
    company_size: 'Stale Size',
  };

  const state = {
    users,
    upsertParams: null,
  };

  const client = {
    query: async (sql, params = []) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();

      if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
        return { rows: [], rowCount: 0 };
      }

      if (normalized === 'SELECT * FROM companies WHERE user_id = $1') {
        return { rows: [company], rowCount: 1 };
      }

      if (normalized.startsWith('UPDATE companies SET name = $1,')) {
        company.name = params[0];
        company.logo = params[1];
        company.description = params[3];
        company.location = params[4];
        company.website = params[5];
        return { rows: [company], rowCount: 1 };
      }

      if (normalized === 'DELETE FROM company_related_companies WHERE company_id = $1') {
        return { rows: [], rowCount: 0 };
      }

      if (normalized.startsWith('UPDATE users SET company_name = $1,')) {
        const user = state.users[params[7]];
        user.company_name = params[0];
        user.website = params[4];
        user.industry = params[5] || user.industry;
        user.company_size = params[6] || user.company_size;
        return { rows: [], rowCount: 1 };
      }

      if (normalized.startsWith('SELECT industry, company_size FROM company_profiles WHERE user_id = $1')) {
        return { rows: [existingCompanyProfile], rowCount: 1 };
      }

      if (normalized.includes('INSERT INTO company_profiles')) {
        state.upsertParams = params;
        return { rows: [{ user_id: params[0] }], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    },
    release: () => {},
  };

  return {
    connect: async () => client,
    query: async () => ({ rows: [], rowCount: 0 }),
    __state: state,
  };
};

const loadApp = () => {
  clearServerModuleCache();
  const poolMock = createPoolMock();

  mockServerModule('config/database.js', poolMock);
  mockServerModule('services/authSessionService.js', createAuthSessionServiceMock());
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
  });
  mockServerModule('services/planAccessService.js', {
    assertCompanyCanCreateDraftJob: async () => ({ isPremium: false, freeCompanyActiveJobLimit: 3 }),
    getPremiumStateForCompanyUser: async () => ({ isPremium: false }),
    requirePremiumEmployerFeature: () => {},
    getPremiumStateForUser: async () => ({ isPremium: false }),
    requirePremiumApplicantFeature: () => {},
  });

  return {
    app: require('../app').createApp(),
    poolMock,
  };
};

const createCompanyToken = (userId) =>
  jwt.sign(
    {
      id: userId,
      userType: 'company',
      accountType: 'company',
      role: 'company',
    },
    process.env.JWT_SECRET
  );

test('company profile update sync writes industry and company_size from current payload', async () => {
  const { app, poolMock } = loadApp();
  const token = createCompanyToken('company-user-2');

  const response = await request(app)
    .put('/api/company/profile')
    .set('Authorization', `Bearer ${token}`)
    .set('x-csrf-token', 'csrf-test-token')
    .send({
      name: 'New Name Inc',
      location: 'Makati, Metro Manila, Philippines',
      website: 'https://example.com',
      shortDescription: 'Company profile update',
      industry: 'Fintech',
      companySize: '11-50',
      relatedCompanies: [],
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.company?.name, 'New Name Inc');

  const upsertParams = poolMock.__state.upsertParams;
  assert.ok(Array.isArray(upsertParams), 'company_profiles upsert should be executed');
  assert.equal(upsertParams[2], 'Fintech');
  assert.equal(upsertParams[3], '11-50');
});
