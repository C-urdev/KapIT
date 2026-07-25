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
    if (key.startsWith(serverRoot)) delete require.cache[key];
  });
};

const mockServerModule = (relativePath, exportsValue) => {
  const modulePath = require.resolve(path.join(serverRoot, relativePath));
  require.cache[modulePath] = { id: modulePath, filename: modulePath, loaded: true, exports: exportsValue } as NodeJS.Module;
};

const createAuthSessionServiceMock = () => ({
  ACCESS_COOKIE_NAME: 'kapit_access_token',
  REFRESH_COOKIE_NAME: 'kapit_refresh_token',
  CSRF_COOKIE_NAME: 'kapit_csrf_token',
  getTokenPayload: (user) => ({ id: user.id, email: user.email, username: user.username, userType: user.user_type, accountType: 'company' }),
  signAccessToken: (user) => jwt.sign({ id: user.id, userType: user.user_type, accountType: 'company', role: 'company' }, process.env.JWT_SECRET),
  attachSessionCookies: async () => ({ csrfToken: 'csrf-test-token' }),
  clearSessionCookies: () => {},
  verifyRefreshTokenSession: async () => { throw new Error('refresh unavailable'); },
  revokeSessionById: async () => {},
  revokeSessionByToken: async () => {},
});

const createPoolMock = () => {
  const user = {
    id: 'company-user-1', username: 'acme', email: 'owner@acme.test', user_type: 'company', account_type: 'company',
    name: '', phone: '', company_name: '', industry: '', company_size: '', website: '', bio: '', address: '', profile_image: '',
    hiring_for: '', profile_completed: false, is_premium: false, socials: '', education: '', vocational_course: '', desired_job: '', birthday: null, age: null, sex: '',
  };
  const company = { id: 'company-1', user_id: user.id, name: '' };
  const state = { user, profile: null as Record<string, unknown> | null };
  const client = {
    query: async (sql, params = []) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(normalized)) return { rows: [], rowCount: 0 };
      if (normalized === 'SELECT * FROM users WHERE id = $1') return { rows: [state.user], rowCount: 1 };
      if (normalized === 'SELECT * FROM companies WHERE user_id = $1') return { rows: [company], rowCount: 1 };
      if (normalized.startsWith('UPDATE companies SET name = $1,')) {
        company.name = params[0];
        return { rows: [company], rowCount: 1 };
      }
      if (normalized.includes('INSERT INTO company_profiles')) {
        state.profile = {
          company_name: params[1],
          industry: params[2],
          company_size: params[3],
          website: params[4],
          description: params[5],
          location: params[6],
          logo_url: params[7],
        };
        return { rows: [{ user_id: user.id }], rowCount: 1 };
      }
      if (normalized.startsWith('UPDATE users SET company_name = $1,')) {
        state.user.company_name = params[0];
        state.user.industry = params[1];
        state.user.company_size = params[2] || '';
        state.user.website = params[3] || '';
        state.user.bio = params[4] || '';
        state.user.address = params[5] || '';
        state.user.profile_image = params[6] || '';
        state.user.phone = params[7] || '';
        state.user.hiring_for = params[8] || '';
        state.user.name = params[9] || '';
        state.user.profile_completed = true;
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    },
    release: () => {},
  };
  return { connect: async () => client, query: async () => ({ rows: [], rowCount: 0 }), __state: state };
};

const loadApp = () => {
  clearServerModuleCache();
  const poolMock = createPoolMock();
  mockServerModule('config/database.js', poolMock);
  mockServerModule('services/authSessionService.js', createAuthSessionServiceMock());
  mockServerModule('config/runtimeSchema.js', { warmRuntimeSchemas: async () => {}, ensureBaseUserSchemaReady: async () => {}, ensureHiringSchemaReady: async () => {}, ensureOnboardingSchemaReady: async () => {} });
  mockServerModule('services/planAccessService.js', { assertCompanyCanCreateDraftJob: async () => ({ isPremium: false }), getPremiumStateForCompanyUser: async () => ({ isPremium: false }), requirePremiumEmployerFeature: () => {} });
  return { app: require('../app').createApp(), poolMock };
};

const companyToken = () => jwt.sign({ id: 'company-user-1', userType: 'company', accountType: 'company', role: 'company' }, process.env.JWT_SECRET);

const validPayload = () => ({
  contactName: 'Jane Doe',
  contactEmail: 'owner@acme.test',
  companyName: 'Acme, Inc.',
  industry: 'Software Development',
  companySize: '11-50',
  website: 'https://acme.test',
  location: 'Manila, Metro Manila, Philippines',
  phoneNumber: '+1 555 123 4567',
  description: 'Builds software products.',
});

test('company profile onboarding persists reusable company profile fields', async () => {
  const { app, poolMock } = loadApp();
  const response = await request(app).put('/api/company/onboarding/profile').set('Authorization', `Bearer ${companyToken()}`).set('x-csrf-token', 'csrf-test-token').send(validPayload());

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(poolMock.__state.user.name, 'Jane Doe');
  assert.equal(poolMock.__state.user.company_name, 'Acme, Inc.');
  assert.equal(poolMock.__state.user.industry, 'Software Development');
  assert.equal(poolMock.__state.user.address, 'Manila, Metro Manila, Philippines');
  assert.equal(poolMock.__state.user.hiring_for, '');
  assert.equal(poolMock.__state.user.profile_completed, true);
  assert.deepEqual(poolMock.__state.profile, {
    company_name: 'Acme, Inc.',
    industry: 'Software Development',
    company_size: '11-50',
    website: 'https://acme.test',
    description: 'Builds software products.',
    location: 'Manila, Metro Manila, Philippines',
    logo_url: null,
  });
});

test('company profile onboarding rejects missing company profile requirements', async () => {
  const { app } = loadApp();
  const payload = { ...validPayload(), industry: '' };
  const response = await request(app).put('/api/company/onboarding/profile').set('Authorization', `Bearer ${companyToken()}`).set('x-csrf-token', 'csrf-test-token').send(payload);

  assert.equal(response.status, 400);
});
