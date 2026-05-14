const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const { ensureBaseTestEnv, getTestEnvValue } = require('./testEnv.cjs');

ensureBaseTestEnv();
getTestEnvValue('PAYPAL_CLIENT_ID', 'test-client-id');
getTestEnvValue('PAYPAL_CLIENT_SECRET', 'test-client-secret');
getTestEnvValue('PAYPAL_WEBHOOK_ID', 'test-webhook-id');
getTestEnvValue('PAYMENT_API_RETRY_MAX', '1');

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

test('verifyPayPalWebhookSignature validates required headers and paypal verification response', async () => {
  const modulePath = require.resolve('../services/paymentService');
  delete require.cache[modulePath];
  const { verifyPayPalWebhookSignature } = require('../services/paymentService');

  await assert.rejects(
    () => verifyPayPalWebhookSignature({ headers: {}, webhookEvent: { event_type: 'PAYMENT.CAPTURE.COMPLETED' } }),
    (error) => {
      assert.equal(error.statusCode, 400);
      return true;
    }
  );

  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes('/v1/oauth2/token')) {
      return {
        ok: true,
        json: async () => ({ access_token: 'token-1' }),
      };
    }
    return {
      ok: true,
      json: async () => ({ verification_status: 'FAILURE' }),
    };
  };

  try {
    await assert.rejects(
      () => verifyPayPalWebhookSignature({
        headers: {
          'paypal-transmission-id': 'tx-1',
          'paypal-transmission-time': new Date().toISOString(),
          'paypal-transmission-sig': 'sig-1',
          'paypal-cert-url': 'https://api-m.sandbox.paypal.com/certs/cert.pem',
          'paypal-auth-algo': 'SHA256withRSA',
        },
        webhookEvent: {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: { id: 'CAPTURE-1' },
        },
      }),
      (error) => {
        assert.equal(error.statusCode, 401);
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/payments/paypal/webhook accepts public requests and handles verification outcomes', async () => {
  clearServerModuleCache();
  const events = [];

  mockServerModule('config/database.js', {
    connect: async () => ({
      query: async () => ({ rows: [] }),
      release: () => {},
    }),
    query: async () => ({ rows: [] }),
  });
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
  });
  mockServerModule('services/paymentService.js', {
    verifyPayPalWebhookSignature: async ({ webhookEvent }) => {
      if (String(webhookEvent?.event_type || '').includes('BAD_SIG')) {
        const error = new Error('Invalid PayPal webhook signature.');
        error.statusCode = 401;
        throw error;
      }
      return true;
    },
    reconcilePayPalWebhookEvent: async ({ webhookEvent }) => {
      events.push(webhookEvent?.event_type || '');
      return {
        handled: true,
        ignored: false,
        changed: true,
      };
    },
  });

  const { createApp } = require('../app');
  const app = createApp();

  const invalid = await request(app)
    .post('/api/payments/paypal/webhook')
    .send({ event_type: 'PAYMENT.CAPTURE.BAD_SIG', resource: { id: 'C1' } });

  assert.equal(invalid.status, 401);
  assert.equal(invalid.body.success, false);

  const valid = await request(app)
    .post('/api/payments/paypal/webhook')
    .send({
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: { id: 'C2' },
    });

  assert.equal(valid.status, 200);
  assert.equal(valid.body.success, true);
  assert.equal(valid.body.handled, true);
  assert.equal(valid.body.changed, true);
  assert.deepEqual(events, ['PAYMENT.CAPTURE.COMPLETED']);
});
