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

const createPaymentServiceMock = () => {
  const state = {
    company: { id: 9001, user_id: '8e39f606-3b7d-4932-8d89-0b6d6f3cf001' },
    payments: new Map(),
    idempotencyIndex: new Map(),
    checkoutCreateCount: 0,
    finalizeProcessCount: 0,
  };

  const basePlan = {
    id: 'starter-30d',
    label: 'Starter 30 days',
    price: 499,
    durationLabel: '30 days',
  };

  const toUuid = (value) => {
    const suffix = String(value).padStart(12, '0');
    return `00000000-0000-4000-8000-${suffix}`;
  };

  const service = {
    __state: state,
    JOB_POST_PLANS: [basePlan],
    getPaymentProviderAvailability: () => ({
      paypal: { enabled: true, label: 'PayPal', reason: '' },
    }),
    normalizeProvider: (provider) => String(provider || '').trim().toLowerCase(),
    assertLocalBypassAllowed: () => {},
    getOrCreateCompanyForUserId: async () => state.company,
    getPaymentRecordForCompany: async (_client, paymentId, companyId) => {
      const payment = state.payments.get(String(paymentId));
      if (!payment || Number(companyId) !== Number(state.company.id)) {
        return null;
      }
      return { ...payment };
    },
    updatePaymentRecord: async (_client, paymentId, fields) => {
      const key = String(paymentId);
      const current = state.payments.get(key);
      if (!current) {
        return null;
      }
      const next = { ...current, ...fields };
      state.payments.set(key, next);
      return { ...next };
    },
    startJobPostCheckoutIdempotent: async ({ provider, planId, idempotencyKey }) => {
      const normalizedKey = String(idempotencyKey || '').trim();
      if (normalizedKey && state.idempotencyIndex.has(normalizedKey)) {
        const existingId = state.idempotencyIndex.get(normalizedKey);
        const existing = state.payments.get(existingId);
        return {
          payment: { id: existing.id },
          plan: existing.plan,
          checkoutUrl: existing.checkoutUrl,
          idempotencyKey: normalizedKey,
        };
      }

      state.checkoutCreateCount += 1;
      const paymentId = toUuid(state.checkoutCreateCount);
      const checkoutId = `order-${paymentId}`;
      const payment = {
        id: paymentId,
        company_id: state.company.id,
        provider: String(provider || 'paypal'),
        provider_checkout_id: checkoutId,
        provider_payment_id: null,
        payer_email: null,
        provider_payload: {},
        status: 'pending',
        amount: 499,
        plan: { ...basePlan, id: String(planId || basePlan.id) },
        job_id: null,
        checkoutUrl: `https://checkout.example.test/${checkoutId}`,
      };

      state.payments.set(paymentId, payment);
      if (normalizedKey) {
        state.idempotencyIndex.set(normalizedKey, paymentId);
      }

      return {
        payment: { id: payment.id },
        plan: payment.plan,
        checkoutUrl: payment.checkoutUrl,
        idempotencyKey: normalizedKey || null,
      };
    },
    capturePayPalOrder: async (orderId) => ({
      providerCheckoutId: String(orderId),
      providerPaymentId: `cap-${orderId}`,
      payerEmail: 'payer@example.com',
      status: 'paid',
      rawPayload: { source: 'mock-paypal' },
      amount: 499,
    }),
    finalizeVerifiedPayment: async (_args) => {
      const payment = _args.payment;
      const stored = state.payments.get(String(payment.id));
      if (!stored) {
        throw new Error('Payment missing');
      }

      if (stored.status === 'paid' && stored.job_id) {
        return {
          payment: { ...stored },
          job: {
            id: stored.job_id,
            title: 'QA Job',
          },
        };
      }

      state.finalizeProcessCount += 1;
      const next = {
        ...stored,
        status: 'paid',
        provider_payment_id: _args.verification.providerPaymentId,
        provider_checkout_id: _args.verification.providerCheckoutId,
        payer_email: _args.verification.payerEmail,
        provider_payload: _args.verification.rawPayload,
        job_id: `job-${stored.id}`,
      };
      state.payments.set(String(payment.id), next);

      return {
        payment: { ...next },
        job: {
          id: next.job_id,
          title: 'QA Job',
        },
      };
    },
    completeLocalBypassPayment: async () => {
      throw new Error('Local bypass not used in this test');
    },
  };

  return service;
};

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

const loadAppForPaymentE2E = () => {
  clearServerModuleCache();
  const paymentService = createPaymentServiceMock();

  mockServerModule('config/database.js', createPoolMock());
  mockServerModule('services/paymentService.js', paymentService);
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
  });

  const app = require('../app').createApp();
  return { app, paymentService };
};

const buildCheckoutBody = (idempotencyKey) => ({
  provider: 'paypal',
  planId: 'starter-30d',
  draft: {
    title: 'QA Integration Job',
    description: 'Testing checkout idempotency behavior',
    salary: '',
    location: '',
    type: '',
    skills: [],
  },
  jobId: null,
  idempotencyKey,
});

test('payment E2E: checkout rejects missing idempotency key', async () => {
  const { app } = loadAppForPaymentE2E();
  const bearer = `Bearer ${makeCompanyToken()}`;

  const response = await request(app)
    .post('/api/company/payments/checkout-session')
    .set('Authorization', bearer)
    .send(buildCheckoutBody(undefined));

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(String(response.body.error || '').toLowerCase(), 'validation error');
});

test('payment E2E: checkout idempotency and PayPal capture retry safety', async () => {
  const { app, paymentService } = loadAppForPaymentE2E();
  const bearer = `Bearer ${makeCompanyToken()}`;

  const first = await request(app)
    .post('/api/company/payments/checkout-session')
    .set('Authorization', bearer)
    .set('x-idempotency-key', 'idem-checkout-001')
    .send(buildCheckoutBody('idem-checkout-001'));

  assert.equal(first.status, 201);
  assert.equal(first.body.success, true);

  const second = await request(app)
    .post('/api/company/payments/checkout-session')
    .set('Authorization', bearer)
    .set('x-idempotency-key', 'idem-checkout-001')
    .send(buildCheckoutBody('idem-checkout-001'));

  assert.equal(second.status, 201);
  assert.equal(second.body.success, true);
  assert.equal(second.body.paymentId, first.body.paymentId);
  assert.equal(second.body.checkoutUrl, first.body.checkoutUrl);

  const rapidResponses = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      request(app)
        .post('/api/company/payments/checkout-session')
        .set('Authorization', bearer)
        .set('x-idempotency-key', 'idem-rapid-001')
        .send(buildCheckoutBody('idem-rapid-001'))
    )
  );

  rapidResponses.forEach((response) => {
    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
  });

  const rapidPaymentIds = new Set(rapidResponses.map((response) => response.body.paymentId));
  assert.equal(rapidPaymentIds.size, 1);

  assert.equal(paymentService.__state.payments.size, 2);

  const verifyPayload = {
    paymentId: first.body.paymentId,
    orderId: `order-${first.body.paymentId}`,
  };

  const verifyFirst = await request(app)
    .post('/api/company/payments/paypal/capture')
    .set('Authorization', bearer)
    .send(verifyPayload);

  assert.equal(verifyFirst.status, 200);
  assert.equal(verifyFirst.body.success, true);

  const verifyRetry = await request(app)
    .post('/api/company/payments/paypal/capture')
    .set('Authorization', bearer)
    .send(verifyPayload);

  assert.equal(verifyRetry.status, 200);
  assert.equal(verifyRetry.body.success, true);

  assert.equal(paymentService.__state.finalizeProcessCount, 1);
  assert.equal(verifyRetry.body.payment.id, verifyFirst.body.payment.id);
  assert.equal(verifyRetry.body.job.id, verifyFirst.body.job.id);
});
