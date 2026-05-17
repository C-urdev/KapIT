const test = require('node:test');
const assert = require('node:assert/strict');

const ENV_KEYS = [
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENTID',
  'PAYPAL_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_CLIENTSECRET',
  'PAYPAL_SECRET',
];

const restoreEnv = (snapshot) => {
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
};

test('paypal env aliases are recognized by provider availability', async () => {
  const snapshot = {};
  for (const key of ENV_KEYS) {
    snapshot[key] = process.env[key];
    delete process.env[key];
  }

  process.env.PAYPAL_ID = 'paypal-id-alias';
  process.env.PAYPAL_SECRET = 'paypal-secret-alias';

  try {
    const modulePath = require.resolve('../services/paymentService');
    delete require.cache[modulePath];
    const paymentService = require('../services/paymentService');
    const providers = paymentService.getPaymentProviderAvailability();

    assert.equal(providers.paypal.enabled, true);
  } finally {
    restoreEnv(snapshot);
  }
});

test('placeholder PayPal env values are treated as not configured', async () => {
  const snapshot = {};
  for (const key of ENV_KEYS) {
    snapshot[key] = process.env[key];
    delete process.env[key];
  }

  process.env.PAYPAL_CLIENT_ID = '<paypal-client-id>';
  process.env.PAYPAL_CLIENT_SECRET = '<paypal-client-secret>';

  try {
    const modulePath = require.resolve('../services/paymentService');
    delete require.cache[modulePath];
    const paymentService = require('../services/paymentService');
    const providers = paymentService.getPaymentProviderAvailability();

    assert.equal(providers.paypal.enabled, false);
  } finally {
    restoreEnv(snapshot);
  }
});
