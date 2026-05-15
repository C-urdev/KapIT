const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');
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
  const company = { id: 'company-1', user_id: 'company-user-1', name: 'Acme Labs' };
  const jobs = [
    {
      id: 101,
      company_id: company.id,
      title: 'Frontend Engineer',
      status: 'open',
      applicant_count: 3,
      hires_needed: 1,
      pay_per_use_fee: 0,
      posting_plan_duration_days: null,
      posting_plan_price: null,
    },
  ];

  const client = {
    query: async (sql) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();
      if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
        return { rows: [], rowCount: 0 };
      }
      if (normalized === 'SELECT * FROM companies WHERE user_id = $1') {
        return { rows: [company], rowCount: 1 };
      }
      if (normalized.includes('FROM jobs j')) {
        return { rows: jobs, rowCount: jobs.length };
      }
      return { rows: [], rowCount: 0 };
    },
    release: () => {},
  };

  return {
    connect: async () => client,
    query: async () => ({ rows: [], rowCount: 0 }),
  };
};

const loadApp = () => {
  clearServerModuleCache();

  mockServerModule('config/database.js', createPoolMock());
  mockServerModule('services/authSessionService.js', createAuthSessionServiceMock());
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {
      throw new Error('onboarding bootstrap failed');
    },
  });
  mockServerModule('services/planAccessService.js', {
    assertCompanyCanCreateDraftJob: async () => ({ isPremium: false, freeCompanyActiveJobLimit: 3 }),
    getPremiumStateForCompanyUser: async () => ({ isPremium: false }),
    requirePremiumEmployerFeature: () => {},
    getPremiumStateForUser: async () => ({ isPremium: false }),
    requirePremiumApplicantFeature: () => {},
  });
  mockServerModule('services/jobService.js', {
    createDraftJobForCompany: async (client, companyId, draft) => ({
      id: 202,
      company_id: companyId,
      title: String(draft?.title || 'Draft Role'),
      status: 'draft',
      applicant_count: 0,
      hires_needed: 1,
      pay_per_use_fee: 0,
      posting_plan_duration_days: null,
      posting_plan_price: null,
    }),
  });
  mockServerModule('services/jobAvailabilityService.js', {
    withJobAvailability: (job) => job,
    closeExpiredJobs: async () => {},
    normalizeDeadlineInput: (value) => value,
  });

  return require('../app').createApp();
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

test('company jobs APIs stay available even when onboarding bootstrap fails', async () => {
  const app = loadApp();
  const token = createCompanyToken('company-user-1');

  const getJobsResponse = await request(app)
    .get('/api/company/jobs')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(getJobsResponse.status, 200);
  assert.equal(getJobsResponse.body.success, true);
  assert.equal(Array.isArray(getJobsResponse.body.jobs), true);

  const createDraftResponse = await request(app)
    .post('/api/company/jobs/draft')
    .set('Authorization', `Bearer ${token}`)
    .set('x-csrf-token', 'csrf-test-token')
    .send({
      title: 'Draft Frontend Engineer',
      description: 'Build product UI',
      skills: ['React'],
    });

  assert.equal(createDraftResponse.status, 201);
  assert.equal(createDraftResponse.body.success, true);
  assert.equal(String(createDraftResponse.body.job?.status || '').toLowerCase(), 'draft');
});
