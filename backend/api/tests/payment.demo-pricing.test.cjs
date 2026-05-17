const test = require('node:test');
const assert = require('node:assert/strict');

const trackedEnvKeys = [
  'NODE_ENV',
  'SKIP_ENV_FILE_LOAD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
  'FASTAPI_INTERNAL_SERVICE_TOKEN',
  'INTERNAL_SERVICE_TOKEN',
  'PAYMENT_DEMO_PRICING_ENABLED',
  'PAYMENT_DEMO_AMOUNT_PHP',
  'PAYMENT_DEMO_PRICING_EXPIRES_AT',
];

const clearModuleCache = () => {
  delete require.cache[require.resolve('../config/paymentDemoPricing')];
  delete require.cache[require.resolve('../config/paymentEnv')];
  delete require.cache[require.resolve('../config/env')];
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
    clearModuleCache();
    return await run();
  } finally {
    trackedEnvKeys.forEach((key) => {
      if (snapshot[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = snapshot[key];
      }
    });
    clearModuleCache();
  }
};

test('demo pricing resolver: enabled and not expired uses demo amount', async () => {
  await withEnv(
    {
      PAYMENT_DEMO_PRICING_ENABLED: 'true',
      PAYMENT_DEMO_AMOUNT_PHP: '1.00',
      PAYMENT_DEMO_PRICING_EXPIRES_AT: '2099-01-01T00:00:00Z',
    },
    async () => {
      const { resolveDemoPricingForAmount } = require('../config/paymentDemoPricing');
      const result = resolveDemoPricingForAmount(449, { now: new Date('2026-05-17T00:00:00Z') });
      assert.equal(result.isDemoActive, true);
      assert.equal(result.providerPayableAmount, 1);
      assert.equal(result.paypalValue, '1.00');
    }
  );
});

test('demo pricing resolver: expired auto-disables demo and uses real amount', async () => {
  await withEnv(
    {
      PAYMENT_DEMO_PRICING_ENABLED: 'true',
      PAYMENT_DEMO_AMOUNT_PHP: '1.00',
      PAYMENT_DEMO_PRICING_EXPIRES_AT: '2026-05-01T00:00:00Z',
    },
    async () => {
      const { resolveDemoPricingForAmount } = require('../config/paymentDemoPricing');
      const result = resolveDemoPricingForAmount(449, { now: new Date('2026-05-17T00:00:00Z') });
      assert.equal(result.isExpired, true);
      assert.equal(result.isDemoActive, false);
      assert.equal(result.providerPayableAmount, 449);
      assert.equal(result.paypalValue, '449.00');
    }
  );
});

test('demo pricing resolver: invalid config fails safe to real amount', async () => {
  await withEnv(
    {
      PAYMENT_DEMO_PRICING_ENABLED: 'true',
      PAYMENT_DEMO_AMOUNT_PHP: 'abc',
      PAYMENT_DEMO_PRICING_EXPIRES_AT: 'not-a-date',
    },
    async () => {
      const { resolveDemoPricingForAmount } = require('../config/paymentDemoPricing');
      const result = resolveDemoPricingForAmount(699, { now: new Date('2026-05-17T00:00:00Z') });
      assert.equal(result.isDemoActive, false);
      assert.equal(result.providerPayableAmount, 699);
      assert.equal(result.paypalValue, '699.00');
    }
  );
});

test('startup guard logs loud warning when demo pricing is active', async () => {
  await withEnv(
    {
      NODE_ENV: 'test',
      SKIP_ENV_FILE_LOAD: 'true',
      JWT_SECRET: 'dev-jwt-secret-abcdefghijklmnopqrstuvwxyz-1234',
      JWT_REFRESH_SECRET: 'dev-refresh-secret-abcdefghijklmnopqrstuvwxyz-1234',
      DATABASE_URL: 'postgresql://dev_user:dev_pass@localhost:5432/dev',
      FASTAPI_INTERNAL_SERVICE_TOKEN: 'fastapi-token-abcdefghijklmnopqrstuvwxyz-1234',
      PAYMENT_DEMO_PRICING_ENABLED: 'true',
      PAYMENT_DEMO_AMOUNT_PHP: '1.00',
      PAYMENT_DEMO_PRICING_EXPIRES_AT: '2099-01-01T00:00:00Z',
    },
    async () => {
      const warns = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warns.push(args.map(String).join(' '));
      try {
        const { initEnvironment } = require('../config/env');
        initEnvironment();
      } finally {
        console.warn = originalWarn;
      }

      assert.ok(warns.some((line) => line.includes('DEMO PRICING WARNING')));
    }
  );
});

test('startup guard logs auto-disable notice when demo pricing is expired', async () => {
  await withEnv(
    {
      NODE_ENV: 'test',
      SKIP_ENV_FILE_LOAD: 'true',
      JWT_SECRET: 'dev-jwt-secret-abcdefghijklmnopqrstuvwxyz-1234',
      JWT_REFRESH_SECRET: 'dev-refresh-secret-abcdefghijklmnopqrstuvwxyz-1234',
      DATABASE_URL: 'postgresql://dev_user:dev_pass@localhost:5432/dev',
      FASTAPI_INTERNAL_SERVICE_TOKEN: 'fastapi-token-abcdefghijklmnopqrstuvwxyz-1234',
      PAYMENT_DEMO_PRICING_ENABLED: 'true',
      PAYMENT_DEMO_AMOUNT_PHP: '1.00',
      PAYMENT_DEMO_PRICING_EXPIRES_AT: '2026-01-01T00:00:00Z',
    },
    async () => {
      const warns = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warns.push(args.map(String).join(' '));
      try {
        const { initEnvironment } = require('../config/env');
        initEnvironment();
      } finally {
        console.warn = originalWarn;
      }

      assert.ok(warns.some((line) => line.includes('AUTO-DISABLED')));
    }
  );
});
