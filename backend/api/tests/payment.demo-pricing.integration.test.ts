const test = require('node:test');
const assert = require('node:assert/strict');
const { ensureBaseTestEnv } = require('./testEnv.ts');

const trackedEnvKeys = [
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_ENV',
  'PAYMENT_DEMO_PRICING_ENABLED',
  'PAYMENT_DEMO_AMOUNT_PHP',
  'PAYMENT_DEMO_PRICING_EXPIRES_AT',
  'CLIENT_URL',
  'RESEND_API_KEY',
  'EMAIL_FROM',
];

const clearPaymentModuleCache = () => {
  delete require.cache[require.resolve('../config/paymentDemoPricing')];
  delete require.cache[require.resolve('../config/paymentEnv')];
  delete require.cache[require.resolve('../services/paymentService')];
  delete require.cache[require.resolve('../services/emailService')];
};

const withEnv = async (overrides, run) => {
  const snapshot = {};
  trackedEnvKeys.forEach((key) => {
    snapshot[key] = process.env[key];
  });

  Object.entries(overrides).forEach(([key, value]) => {
    if (value == null) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  });

  try {
    clearPaymentModuleCache();
    return await run();
  } finally {
    trackedEnvKeys.forEach((key) => {
      if (snapshot[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = snapshot[key];
      }
    });
    clearPaymentModuleCache();
  }
};

const createMockClient = () => ({
  query: async (sql) => {
    const text = String(sql || '');

    if (text.includes('SELECT * FROM companies WHERE user_id = $1')) {
      return {
        rows: [{ id: 'company-1', user_id: 'user-1', name: 'Demo Co' }],
      };
    }

    if (text.includes('INSERT INTO user_premium_payments')) {
      return {
        rows: [{
          id: 'payment-premium-1',
          user_id: 'user-1',
          provider: 'paypal',
          amount: 449,
          status: 'pending',
          provider_payload: null,
        }],
      };
    }

    if (text.includes('UPDATE user_premium_payments')) {
      return {
        rows: [{
          id: 'payment-premium-1',
          user_id: 'user-1',
          provider: 'paypal',
          amount: 449,
          status: 'pending',
          provider_payload: {},
        }],
      };
    }

    if (text.includes('INSERT INTO job_post_payments')) {
      return {
        rows: [{
          id: 'payment-company-1',
          company_id: 'company-1',
          provider: 'paypal',
          amount: 699,
          status: 'pending',
          plan_id: '1-week',
          provider_payload: null,
        }],
      };
    }

    if (text.includes('UPDATE job_post_payments')) {
      return {
        rows: [{
          id: 'payment-company-1',
          company_id: 'company-1',
          provider: 'paypal',
          amount: 699,
          status: 'pending',
          plan_id: '1-week',
          provider_payload: {},
        }],
      };
    }

    return { rows: [] };
  },
});

const createMockReq = () => ({
  protocol: 'http',
  get: (name) => {
    if (String(name).toLowerCase() === 'origin') {
      return 'http://127.0.0.1:3001';
    }
    return '';
  },
});

test('payment checkout sends PHP 1.00 to PayPal for user and company when demo pricing is enabled', async () => {
  ensureBaseTestEnv();
  await withEnv(
    {
      PAYPAL_CLIENT_ID: 'paypal-client',
      PAYPAL_CLIENT_SECRET: 'paypal-secret',
      PAYPAL_ENV: 'sandbox',
      PAYMENT_DEMO_PRICING_ENABLED: 'true',
      PAYMENT_DEMO_AMOUNT_PHP: '1.00',
      PAYMENT_DEMO_PRICING_EXPIRES_AT: '2099-01-01T00:00:00Z',
    },
    async () => {
      const payloads: any[] = [];
      const originalFetch = global.fetch;
      global.fetch = (async (_url, options: any = {}) => {
        const url = String(_url || '');
        if (url.includes('/v1/oauth2/token')) {
          return { ok: true, json: async () => ({ access_token: 'token-1' }) };
        }
        if (url.includes('/v2/checkout/orders')) {
          payloads.push(JSON.parse(String(options.body || '{}')));
          return {
            ok: true,
            json: async () => ({
              id: `ORDER-${payloads.length}`,
              links: [{ rel: 'approve', href: `https://checkout.test/${payloads.length}` }],
            }),
          };
        }
        throw new Error('Unexpected fetch call');
      }) as any;

      try {
        const paymentService = require('../services/paymentService');
        const client = createMockClient();
        const req = createMockReq();

        await paymentService.startUserPremiumCheckout({
          client,
          req,
          userId: 'user-1',
          provider: 'paypal',
        });

        await paymentService.startJobPostCheckout({
          client,
          req,
          companyUserId: 'user-1',
          provider: 'paypal',
          planId: '1-week',
          draft: { title: 'Demo Job', description: 'Demo Description' },
        });
      } finally {
        global.fetch = originalFetch;
      }

      assert.equal(payloads.length, 2);
      payloads.forEach((payload) => {
        assert.equal(payload.purchase_units[0].amount.currency_code, 'PHP');
        assert.equal(payload.purchase_units[0].amount.value, '1.00');
      });
    }
  );
});

test('payment checkout sends real amount when demo pricing is disabled', async () => {
  ensureBaseTestEnv();
  await withEnv(
    {
      PAYPAL_CLIENT_ID: 'paypal-client',
      PAYPAL_CLIENT_SECRET: 'paypal-secret',
      PAYPAL_ENV: 'sandbox',
      PAYMENT_DEMO_PRICING_ENABLED: 'false',
      PAYMENT_DEMO_AMOUNT_PHP: '1.00',
      PAYMENT_DEMO_PRICING_EXPIRES_AT: '2099-01-01T00:00:00Z',
    },
    async () => {
      const payloads: any[] = [];
      const originalFetch = global.fetch;
      global.fetch = (async (_url, options: any = {}) => {
        const url = String(_url || '');
        if (url.includes('/v1/oauth2/token')) {
          return { ok: true, json: async () => ({ access_token: 'token-1' }) };
        }
        if (url.includes('/v2/checkout/orders')) {
          payloads.push(JSON.parse(String(options.body || '{}')));
          return {
            ok: true,
            json: async () => ({
              id: 'ORDER-REAL',
              links: [{ rel: 'approve', href: 'https://checkout.test/real' }],
            }),
          };
        }
        throw new Error('Unexpected fetch call');
      }) as any;

      try {
        const paymentService = require('../services/paymentService');
        const client = createMockClient();
        const req = createMockReq();

        await paymentService.startUserPremiumCheckout({
          client,
          req,
          userId: 'user-1',
          provider: 'paypal',
        });
      } finally {
        global.fetch = originalFetch;
      }

      assert.equal(payloads.length, 1);
      assert.equal(payloads[0].purchase_units[0].amount.currency_code, 'PHP');
      assert.equal(payloads[0].purchase_units[0].amount.value, '449.00');
    }
  );
});

test('demo receipts include demo label and both charged and original plan amounts', async () => {
  ensureBaseTestEnv();
  await withEnv(
    {
      RESEND_API_KEY: 're_demo_key',
      EMAIL_FROM: 'KapIT <no-reply@kapit.example>',
    },
    async () => {
      const requests: any[] = [];
      const originalFetch = global.fetch;
      global.fetch = (async (_url, options: any = {}) => {
        requests.push(JSON.parse(String(options.body || '{}')));
        return { ok: true, text: async () => '' };
      }) as any;

      try {
        const {
          sendUserPremiumPaymentEmail,
          sendCompanyJobPostPaymentEmail,
        } = require('../services/emailService');

        await sendUserPremiumPaymentEmail({
          to: 'demo-user@example.com',
          fullName: 'Demo User',
          planLabel: 'Premium',
          durationLabel: 'monthly',
          amount: 449,
          actualPaidAmount: 1,
          originalPlanAmount: 449,
          isDemoPayment: true,
          provider: 'paypal',
          paidAt: '2026-05-17T00:00:00Z',
        });

        await sendCompanyJobPostPaymentEmail({
          to: 'demo-company@example.com',
          companyName: 'Demo Company',
          jobTitle: 'Demo Job',
          planLabel: '1 Week',
          durationLabel: '1 week',
          amount: 699,
          actualPaidAmount: 1,
          originalPlanAmount: 699,
          isDemoPayment: true,
          provider: 'paypal',
          paidAt: '2026-05-17T00:00:00Z',
        });
      } finally {
        global.fetch = originalFetch;
      }

      assert.equal(requests.length, 2);
      requests.forEach((requestPayload) => {
        assert.match(String(requestPayload.subject || ''), /DEMO receipt/i);
        assert.match(String(requestPayload.text || ''), /DEMO PAYMENT/i);
        assert.match(String(requestPayload.text || ''), /Original plan amount:/i);
        assert.match(String(requestPayload.html || ''), /DEMO PAYMENT/i);
      });
    }
  );
});

test('user premium checkout surfaces actionable PayPal issue and debug id on 422 create-order failures', async () => {
  ensureBaseTestEnv();
  await withEnv(
    {
      PAYPAL_CLIENT_ID: 'paypal-client',
      PAYPAL_CLIENT_SECRET: 'paypal-secret',
      PAYPAL_ENV: 'sandbox',
      PAYMENT_DEMO_PRICING_ENABLED: 'true',
      PAYMENT_DEMO_AMOUNT_PHP: '1.00',
      PAYMENT_DEMO_PRICING_EXPIRES_AT: '2099-01-01T00:00:00Z',
    },
    async () => {
      const originalFetch = global.fetch;
      global.fetch = (async (_url) => {
        const url = String(_url || '');
        if (url.includes('/v1/oauth2/token')) {
          return { ok: true, json: async () => ({ access_token: 'token-1' }) };
        }
        if (url.includes('/v2/checkout/orders')) {
          return {
            ok: false,
            status: 422,
            json: async () => ({
              name: 'UNPROCESSABLE_ENTITY',
              message: 'The requested action could not be performed, semantically incorrect, or failed business validation.',
              debug_id: 'paypal-debug-422',
              details: [
                {
                  issue: 'PAYEE_ACCOUNT_NOT_VERIFIED',
                  description: 'Payee account is not verified for this payment.',
                },
              ],
            }),
          };
        }
        throw new Error('Unexpected fetch call');
      }) as any;

      try {
        const paymentService = require('../services/paymentService');
        const client = createMockClient();
        const req = createMockReq();

        await assert.rejects(
          async () => paymentService.startUserPremiumCheckout({
            client,
            req,
            userId: 'user-1',
            provider: 'paypal',
          }),
          (error) => {
            assert.equal((error as any)?.statusCode, 502);
            assert.match(String(error?.message || ''), /PAYEE_ACCOUNT_NOT_VERIFIED/);
            assert.match(String(error?.message || ''), /debug_id=paypal-debug-422/);
            return true;
          }
        );
      } finally {
        global.fetch = originalFetch;
      }
    }
  );
});
