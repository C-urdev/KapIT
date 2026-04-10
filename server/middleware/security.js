const rateLimitStores = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX || 10);

const getStore = (storeName) => {
  if (!rateLimitStores.has(storeName)) {
    rateLimitStores.set(storeName, new Map());
  }

  return rateLimitStores.get(storeName);
};

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const getLoginRateLimitKey = (req) => {
  const email = normalizeKey(req.body?.email);
  return `${req.ip}:${email || 'anonymous'}`;
};

const cleanupExpiredEntries = (store) => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if ((entry?.resetAt || 0) <= now) {
      store.delete(key);
    }
  }
};

const getClientIdentity = (req) => normalizeKey(req.user?.id || req.ip || 'anonymous');
const isNonActionableRequest = (req) => ['HEAD', 'OPTIONS'].includes(String(req.method || '').toUpperCase());

const setRateLimitHeaders = (res, { max, remaining, resetAt }) => {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  res.setHeader('Retry-After', String(retryAfterSeconds));
};

const createRateLimiter = ({
  storeName,
  windowMs,
  max,
  message,
  keyGenerator = getClientIdentity,
  skip,
}) => {
  const store = getStore(storeName);

  return (req, res, next) => {
    if (typeof skip === 'function' && skip(req)) {
      return next();
    }

    cleanupExpiredEntries(store);

    const now = Date.now();
    const key = String(keyGenerator(req) || 'anonymous');
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      const nextEntry = {
        count: 1,
        resetAt: now + windowMs,
      };

      store.set(key, nextEntry);
      setRateLimitHeaders(res, {
        max,
        remaining: max - nextEntry.count,
        resetAt: nextEntry.resetAt,
      });
      return next();
    }

    if (existing.count >= max) {
      setRateLimitHeaders(res, {
        max,
        remaining: 0,
        resetAt: existing.resetAt,
      });
      return res.status(429).json({
        success: false,
        message,
      });
    }

    existing.count += 1;
    store.set(key, existing);
    setRateLimitHeaders(res, {
      max,
      remaining: max - existing.count,
      resetAt: existing.resetAt,
    });
    return next();
  };
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https: http:; font-src 'self' data: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  next();
};

const loginRateLimiter = (req, res, next) => {
  const store = getStore('login-attempts');
  cleanupExpiredEntries(store);
  const key = getLoginRateLimitKey(req);
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextEntry = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    store.set(key, nextEntry);
    setRateLimitHeaders(res, {
      max: MAX_LOGIN_ATTEMPTS,
      remaining: MAX_LOGIN_ATTEMPTS - nextEntry.count,
      resetAt: nextEntry.resetAt,
    });
    return next();
  }

  if (existing.count >= MAX_LOGIN_ATTEMPTS) {
    setRateLimitHeaders(res, {
      max: MAX_LOGIN_ATTEMPTS,
      remaining: 0,
      resetAt: existing.resetAt,
    });
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.',
    });
  }

  existing.count += 1;
  store.set(key, existing);
  setRateLimitHeaders(res, {
    max: MAX_LOGIN_ATTEMPTS,
    remaining: MAX_LOGIN_ATTEMPTS - existing.count,
    resetAt: existing.resetAt,
  });
  return next();
};

const clearLoginRateLimit = (req) => {
  getStore('login-attempts').delete(getLoginRateLimitKey(req));
};

const authApiRateLimiter = createRateLimiter({
  storeName: 'auth-api',
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_API_RATE_LIMIT_MAX || 120),
  message: 'Too many authentication requests. Please try again later.',
  skip: isNonActionableRequest,
});

const publicApiRateLimiter = createRateLimiter({
  storeName: 'public-api',
  windowMs: 60 * 1000,
  max: Number(process.env.PUBLIC_API_RATE_LIMIT_MAX || 180),
  message: 'Too many public requests. Please slow down and try again shortly.',
  skip: isNonActionableRequest,
});

const messagesReadRateLimiter = createRateLimiter({
  storeName: 'messages-read',
  windowMs: 60 * 1000,
  max: Number(process.env.MESSAGES_READ_RATE_LIMIT_MAX || 120),
  message: 'Too many messaging requests. Please try again shortly.',
  skip: (req) => req.method !== 'GET',
});

const messagesWriteRateLimiter = createRateLimiter({
  storeName: 'messages-write',
  windowMs: 60 * 1000,
  max: Number(process.env.MESSAGES_WRITE_RATE_LIMIT_MAX || 30),
  message: 'Too many messages sent. Please wait a moment before trying again.',
  skip: (req) => req.method === 'GET',
});

const notificationsRateLimiter = createRateLimiter({
  storeName: 'notifications-api',
  windowMs: 60 * 1000,
  max: Number(process.env.NOTIFICATIONS_RATE_LIMIT_MAX || 90),
  message: 'Too many notification requests. Please try again shortly.',
  skip: isNonActionableRequest,
});

const companyApiRateLimiter = createRateLimiter({
  storeName: 'company-api',
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.COMPANY_API_RATE_LIMIT_MAX || 180),
  message: 'Too many company requests. Please try again later.',
  skip: isNonActionableRequest,
});

const companyWriteRateLimiter = createRateLimiter({
  storeName: 'company-write',
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.COMPANY_WRITE_RATE_LIMIT_MAX || 45),
  message: 'Too many company updates. Please slow down and try again later.',
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
});

const developerApiRateLimiter = createRateLimiter({
  storeName: 'developer-api',
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.DEVELOPER_API_RATE_LIMIT_MAX || 90),
  message: 'Too many developer requests. Please try again later.',
  skip: isNonActionableRequest,
});

module.exports = {
  securityHeaders,
  authApiRateLimiter,
  publicApiRateLimiter,
  loginRateLimiter,
  messagesReadRateLimiter,
  messagesWriteRateLimiter,
  notificationsRateLimiter,
  companyApiRateLimiter,
  companyWriteRateLimiter,
  developerApiRateLimiter,
  clearLoginRateLimit,
};
