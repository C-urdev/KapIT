const test = require('node:test');
const assert = require('node:assert/strict');

test('checkout session creation requires idempotency key', async () => {
  const modulePath = require.resolve('../services/paymentService');
  delete require.cache[modulePath];

  const paymentService = require('../services/paymentService');

  await assert.rejects(
    () => paymentService.startJobPostCheckoutIdempotent({
      client: {},
      req: {},
      companyUserId: 'company-user-1',
      provider: 'paypal',
      planId: 'starter-30d',
      draft: { title: 'Test', description: 'Test description' },
      idempotencyKey: '',
    }),
    /Idempotency key is required/
  );
});

test('checkout session creation fails safe when Redis idempotency storage is unavailable', async () => {
  const redisModulePath = require.resolve('../config/redis');
  const paymentModulePath = require.resolve('../services/paymentService');
  delete require.cache[redisModulePath];
  delete require.cache[paymentModulePath];

  const previousRedisUrl = process.env.REDIS_URL;
  delete process.env.REDIS_URL;

  try {
    const paymentService = require('../services/paymentService');
    await assert.rejects(
      () => paymentService.startJobPostCheckoutIdempotent({
        client: {},
        req: {},
        companyUserId: 'company-user-1',
        provider: 'paypal',
        planId: 'starter-30d',
        draft: { title: 'Test', description: 'Test description' },
        idempotencyKey: 'idem-test-001',
      }),
      /Redis idempotency storage is not ready/
    );
  } finally {
    if (previousRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previousRedisUrl;
    }

    delete require.cache[redisModulePath];
    delete require.cache[paymentModulePath];
  }
});

test('invalid Redis idempotency cache JSON is cleared and does not crash checkout', async () => {
  const redisModulePath = require.resolve('../config/redis');
  const paymentModulePath = require.resolve('../services/paymentService');
  delete require.cache[redisModulePath];
  delete require.cache[paymentModulePath];

  const deletedKeys = [];
  const fakeRedis = {
    getCallCount: 0,
    async get() {
      this.getCallCount += 1;
      if (this.getCallCount === 1) {
        return '{bad-json';
      }
      return null;
    },
    async set() {
      return null;
    },
    async del(key) {
      deletedKeys.push(String(key));
      return 1;
    },
  };

  require.cache[redisModulePath] = {
    id: redisModulePath,
    filename: redisModulePath,
    loaded: true,
    exports: {
      getRedisClient: async () => fakeRedis,
      closeRedisClient: async () => {},
      logRedisStartupStatus: async () => ({ hasRedisUrl: true, connected: false }),
    },
  } as NodeJS.Module;

  try {
    const paymentService = require('../services/paymentService');
    await assert.rejects(
      () => paymentService.startJobPostCheckoutIdempotent({
        client: {},
        req: {},
        companyUserId: 'company-user-1',
        provider: 'paypal',
        planId: 'starter-30d',
        draft: { title: 'Test', description: 'Test description' },
        idempotencyKey: 'idem-invalid-json-001',
      }),
      /already in progress/
    );

    assert.ok(
      deletedKeys.includes('payment:idempotency:company-user-1:idem-invalid-json-001'),
      'Expected invalid Redis cache key to be cleared'
    );
  } finally {
    delete require.cache[redisModulePath];
    delete require.cache[paymentModulePath];
  }
});
