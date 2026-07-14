type RequestLike = import('express').Request;

interface LocalBypassAvailability {
  available: boolean;
  reason: string;
}

const toLower = (value: unknown): string => String(value || '').trim().toLowerCase();

const isLoopbackHostname = (raw: unknown): boolean => {
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

const isLoopbackIp = (raw: unknown): boolean => {
  const ip = toLower(raw);
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

const isDevelopmentRuntime = (): boolean => toLower(process.env.NODE_ENV) === 'development';

const isFeatureEnabled = (key: string): boolean => toLower(process.env[key]) === 'true';

const isLocalAuthBypassEnabled = () =>
  isDevelopmentRuntime() && isFeatureEnabled('ENABLE_LOCAL_AUTH_BYPASS');

const isLocalPaymentBypassEnabled = () =>
  isDevelopmentRuntime() && isFeatureEnabled('ENABLE_LOCAL_PAYMENT_BYPASS');

const isLoopbackRequest = (req: RequestLike): boolean => {
  const hostHeader = req.get('x-forwarded-host') || req.get('host') || req.hostname;
  const originHeader = req.get('origin');
  const refererHeader = req.get('referer');
  const requestIp = req.ip || req.socket?.remoteAddress || '';

  const hostAllowed = isLoopbackHostname(hostHeader);
  const originAllowed = !originHeader || isLoopbackHostname(originHeader);
  const refererAllowed = !refererHeader || isLoopbackHostname(refererHeader);
  const ipAllowed = isLoopbackIp(requestIp);

  return hostAllowed && originAllowed && refererAllowed && ipAllowed;
};

const assertLoopbackRequest = (req: RequestLike, label: string): void => {
  if (!isLoopbackRequest(req)) {
    throw new Error(`${label} is only allowed from localhost.`);
  }
};

const assertLocalAuthBypassAllowed = (req: RequestLike): void => {
  if (!isLocalAuthBypassEnabled()) {
    throw new Error('Local auth bypass is disabled. Enable NODE_ENV=development and ENABLE_LOCAL_AUTH_BYPASS=true.');
  }
  assertLoopbackRequest(req, 'Local auth bypass');
};

const assertLocalPaymentBypassAllowed = (req: RequestLike): void => {
  if (!isLocalPaymentBypassEnabled()) {
    throw new Error('Local payment bypass is disabled. Enable NODE_ENV=development and ENABLE_LOCAL_PAYMENT_BYPASS=true.');
  }
  assertLoopbackRequest(req, 'Local payment bypass');
};

const getLocalPaymentBypassAvailability = (req: RequestLike): LocalBypassAvailability => {
  if (!isLocalPaymentBypassEnabled()) {
    return {
      available: false,
      reason: 'Local payment bypass is disabled. Enable NODE_ENV=development and ENABLE_LOCAL_PAYMENT_BYPASS=true.',
    };
  }

  if (!isLoopbackRequest(req)) {
    return {
      available: false,
      reason: 'Local payment bypass is only allowed from localhost.',
    };
  }

  return {
    available: true,
    reason: '',
  };
};

module.exports = {
  isDevelopmentRuntime,
  isLocalAuthBypassEnabled,
  isLocalPaymentBypassEnabled,
  getLocalPaymentBypassAvailability,
  assertLocalAuthBypassAllowed,
  assertLocalPaymentBypassAllowed,
};
