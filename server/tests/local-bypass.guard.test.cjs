const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isLocalAuthBypassEnabled,
  isLocalPaymentBypassEnabled,
  assertLocalAuthBypassAllowed,
  assertLocalPaymentBypassAllowed,
} = require('../config/localBypass');

const originalEnv = { ...process.env };

const makeReq = ({
  host = 'localhost:5001',
  origin = 'http://localhost:3000',
  referer = 'http://localhost:3000/auth/login',
  ip = '127.0.0.1',
} = {}) => ({
  hostname: 'localhost',
  ip,
  socket: { remoteAddress: ip },
  get: (name) => {
    const key = String(name || '').toLowerCase();
    if (key === 'host') return host;
    if (key === 'x-forwarded-host') return '';
    if (key === 'origin') return origin;
    if (key === 'referer') return referer;
    return '';
  },
});

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test('local auth bypass requires development mode and explicit flag', () => {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_LOCAL_AUTH_BYPASS = 'true';
  assert.equal(isLocalAuthBypassEnabled(), true);

  process.env.ENABLE_LOCAL_AUTH_BYPASS = 'false';
  assert.equal(isLocalAuthBypassEnabled(), false);

  process.env.NODE_ENV = 'production';
  process.env.ENABLE_LOCAL_AUTH_BYPASS = 'true';
  assert.equal(isLocalAuthBypassEnabled(), false);
});

test('local payment bypass requires development mode and explicit flag', () => {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_LOCAL_PAYMENT_BYPASS = 'true';
  assert.equal(isLocalPaymentBypassEnabled(), true);

  process.env.ENABLE_LOCAL_PAYMENT_BYPASS = 'false';
  assert.equal(isLocalPaymentBypassEnabled(), false);

  process.env.NODE_ENV = 'production';
  process.env.ENABLE_LOCAL_PAYMENT_BYPASS = 'true';
  assert.equal(isLocalPaymentBypassEnabled(), false);
});

test('local auth bypass guard allows localhost when enabled', () => {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_LOCAL_AUTH_BYPASS = 'true';

  assert.doesNotThrow(() => assertLocalAuthBypassAllowed(makeReq()));
});

test('local auth bypass guard denies non-localhost request', () => {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_LOCAL_AUTH_BYPASS = 'true';

  assert.throws(
    () => assertLocalAuthBypassAllowed(makeReq({ host: 'example.com', origin: 'https://example.com', referer: 'https://example.com/login', ip: '8.8.8.8' })),
    /only allowed from localhost/i
  );
});

test('local payment bypass guard denies when disabled', () => {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_LOCAL_PAYMENT_BYPASS = 'false';

  assert.throws(
    () => assertLocalPaymentBypassAllowed(makeReq()),
    /Local payment bypass is disabled/i
  );
});
