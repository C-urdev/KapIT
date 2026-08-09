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

const makeUserToken = () => jwt.sign(
  {
    id: '717f40c7-a791-4c10-a5fa-c252f4ca2001',
    email: 'developer@example.com',
    username: 'developer_qa',
    userType: 'employee',
    role: 'developer',
    accountType: 'developer',
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const makeCompanyToken = () => jwt.sign(
  {
    id: '8e39f606-3b7d-4932-8d89-0b6d6f3cf001',
    email: 'company@example.com',
    username: 'company_qa',
    userType: 'company',
    role: 'company',
    accountType: 'company',
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const createPaymentServiceMock = () => ({
  USER_PREMIUM_PLAN: {
    id: 'premium-monthly',
    label: 'Premium',
    price: 449,
    durationLabel: 'monthly',
  },
  JOB_POST_PLANS: [
    {
      id: 'starter-30d',
      label: 'Starter 30 days',
      price: 499,
      durationLabel: '30 days',
    },
  ],
  getPaymentProviderAvailability: () => ({
    paypal: {
      enabled: true,
      label: 'PayPal',
      reason: '',
    },
  }),
  getPaymentPresentationMeta: () => ({
    demoPricing: {
      active: true,
      enabled: true,
      demoAmountPhp: 1,
      demoAmountValue: '1.00',
      expiresAt: '2099-01-01T00:00:00.000Z',
      expired: false,
      mode: 'demo',
    },
  }),
});

const createPoolMock = () => ({
  connect: async () => ({
    query: async () => ({ rows: [] }),
    release: () => {},
  }),
  query: async () => ({ rows: [] }),
});

const loadApp = () => {
  clearServerModuleCache();

  mockServerModule('config/database.js', createPoolMock());
  mockServerModule('services/paymentService.js', createPaymentServiceMock());
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
  });

  return require('../app').createApp();
};

test('payment providers endpoints expose demo pricing metadata to the frontend', async () => {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_LOCAL_PAYMENT_BYPASS = 'true';
  const app = loadApp();

  const userResponse = await request(app)
    .get('/api/auth/premium/payments/providers')
    .set('Authorization', `Bearer ${makeUserToken()}`);

  assert.equal(userResponse.status, 200);
  assert.equal(userResponse.body.success, true);
  assert.equal(userResponse.body.demoPricing.active, true);
  assert.equal(userResponse.body.demoPricing.demoAmountValue, '1.00');
  assert.equal(userResponse.body.localPaymentBypass.available, true);

  const companyResponse = await request(app)
    .get('/api/company/payments/providers')
    .set('Authorization', `Bearer ${makeCompanyToken()}`);

  assert.equal(companyResponse.status, 200);
  assert.equal(companyResponse.body.success, true);
  assert.equal(companyResponse.body.demoPricing.active, true);
  assert.equal(companyResponse.body.demoPricing.demoAmountPhp, 1);
  assert.equal(companyResponse.body.localPaymentBypass.available, true);
});

test('payment providers endpoints keep local payment bypass locked to localhost', async () => {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_LOCAL_PAYMENT_BYPASS = 'true';
  const app = loadApp();

  const response = await request(app)
    .get('/api/auth/premium/payments/providers')
    .set('Authorization', `Bearer ${makeUserToken()}`)
    .set('Host', '192.168.1.15:5173');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.localPaymentBypass.available, false);
  assert.match(String(response.body.localPaymentBypass.reason || ''), /only allowed from localhost/i);
});
