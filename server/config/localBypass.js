const toLower = (value) => String(value || '').trim().toLowerCase();

const isLoopbackHostname = (raw) => {
  const value = toLower(raw);
  if (!value) {
    return false;
  }

  try {
    const parsed = value.includes('://') ? new URL(value) : new URL(`http://${value}`);
    const hostname = toLower(parsed.hostname);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
};

const isLoopbackIp = (raw) => {
  const ip = toLower(raw);
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

const isDevelopmentRuntime = () => toLower(process.env.NODE_ENV) === 'development';

const isFeatureEnabled = (key) => toLower(process.env[key]) === 'true';

const isLocalAuthBypassEnabled = () =>
  isDevelopmentRuntime() && isFeatureEnabled('ENABLE_LOCAL_AUTH_BYPASS');

const isLocalPaymentBypassEnabled = () =>
  isDevelopmentRuntime() && isFeatureEnabled('ENABLE_LOCAL_PAYMENT_BYPASS');

const assertLoopbackRequest = (req, label) => {
  const hostHeader = req.get('x-forwarded-host') || req.get('host') || req.hostname;
  const originHeader = req.get('origin');
  const refererHeader = req.get('referer');
  const requestIp = req.ip || req.socket?.remoteAddress || '';

  const hostAllowed = isLoopbackHostname(hostHeader);
  const originAllowed = !originHeader || isLoopbackHostname(originHeader);
  const refererAllowed = !refererHeader || isLoopbackHostname(refererHeader);
  const ipAllowed = isLoopbackIp(requestIp);

  if (!hostAllowed || !originAllowed || !refererAllowed || !ipAllowed) {
    throw new Error(`${label} is only allowed from localhost.`);
  }
};

const assertLocalAuthBypassAllowed = (req) => {
  if (!isLocalAuthBypassEnabled()) {
    throw new Error('Local auth bypass is disabled. Enable NODE_ENV=development and ENABLE_LOCAL_AUTH_BYPASS=true.');
  }
  assertLoopbackRequest(req, 'Local auth bypass');
};

const assertLocalPaymentBypassAllowed = (req) => {
  if (!isLocalPaymentBypassEnabled()) {
    throw new Error('Local payment bypass is disabled. Enable NODE_ENV=development and ENABLE_LOCAL_PAYMENT_BYPASS=true.');
  }
  assertLoopbackRequest(req, 'Local payment bypass');
};

module.exports = {
  isDevelopmentRuntime,
  isLocalAuthBypassEnabled,
  isLocalPaymentBypassEnabled,
  assertLocalAuthBypassAllowed,
  assertLocalPaymentBypassAllowed,
};
