const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const helmet = require('helmet');
const { logger } = require('../config/logger');
const { getAllowedOrigins, normalizeOrigin } = require('../config/origins');

const WINDOW_MS = 15 * 60 * 1000;
const AUTH_ATTEMPT_WINDOW_MS = Number(process.env.AUTH_ATTEMPT_RATE_LIMIT_WINDOW_MS || WINDOW_MS);
const AUTH_ATTEMPT_MAX = Number(process.env.AUTH_ATTEMPT_RATE_LIMIT_MAX || 5);
const MAX_LOGIN_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX || AUTH_ATTEMPT_MAX);
const GLOBAL_API_WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS || WINDOW_MS);
const GLOBAL_API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX || 600);
const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const devRateLimiterFailureKeys = new Set();
const localRateLimitBuckets = new Map();
const limiterDegradedModeLogState = new Map();
const limiterDegradedStartedAt = new Map();
const LIMITER_DEGRADED_LOG_COOLDOWN_MS = Number(process.env.RATE_LIMITER_DEGRADED_LOG_COOLDOWN_MS || 60000);
const LOCAL_RATE_LIMIT_MAX_BUCKETS = Number(process.env.RATE_LIMITER_LOCAL_MAX_BUCKETS || 20000);
const AUTH_LIMITER_FAIL_CLOSED_AFTER_MS = Math.max(0, Number(process.env.AUTH_LIMITER_FAIL_CLOSED_AFTER_MS || 0));
const RATE_LIMITER_ALERT_WEBHOOK_URL = String(process.env.RATE_LIMITER_ALERT_WEBHOOK_URL || '').trim();
const RATE_LIMITER_ALERT_TIMEOUT_MS = Math.max(250, Number(process.env.RATE_LIMITER_ALERT_TIMEOUT_MS || 2000));
const REFRESH_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'kapit_refresh_token';
const OAUTH_STATE_COOKIE_NAME = process.env.OAUTH_STATE_COOKIE_NAME || 'kapit_oauth_state';
const SOCIAL_SIGNUP_COOKIE_NAME = process.env.SOCIAL_SIGNUP_COOKIE_NAME || 'kapit_social_signup';
const highRiskAuthLimiterStores = new Set(['login-attempts', 'auth-attempts', 'forgot-password', 'reset-password']);

const normalizeKey = (value) => String(value || '').trim().toLowerCase();
const normalizeRoutePath = (value) => String(value || '').trim().toLowerCase().replace(/\/+/g, '/');
const fingerprintValue = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }

  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 24);
};
const getRouteAwareLimiterKeyPrefix = (req) => {
  const method = String(req.method || 'GET').toUpperCase();
  const basePath = normalizeRoutePath(req.baseUrl || '');
  const routePath = normalizeRoutePath(req.route?.path || req.path || '');
  return `${method}:${basePath}${routePath}`;
};
const getBearerToken = (req) => {
  const authHeader = String(req.get('authorization') || '').trim();
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return '';
  }
  return authHeader.slice('Bearer '.length).trim();
};
const buildAuthAttemptIdentity = (req) => {
  const userId = normalizeKey(req.user?.id);
  if (userId) {
    return `user:${userId}`;
  }

  const email = normalizeKey(req.body?.email);
  if (email) {
    return `email:${email}`;
  }

  const refreshTokenFingerprint = fingerprintValue(req.cookies?.[REFRESH_COOKIE_NAME]);
  if (refreshTokenFingerprint) {
    return `refresh:${refreshTokenFingerprint}`;
  }

  const bearerTokenFingerprint = fingerprintValue(getBearerToken(req));
  if (bearerTokenFingerprint) {
    return `bearer:${bearerTokenFingerprint}`;
  }

  const oauthStateFingerprint = fingerprintValue(req.body?.state || req.query?.state || req.cookies?.[OAUTH_STATE_COOKIE_NAME]);
  if (oauthStateFingerprint) {
    return `oauth:${oauthStateFingerprint}`;
  }

  const socialSessionFingerprint = fingerprintValue(req.body?.socialSignupToken || req.cookies?.[SOCIAL_SIGNUP_COOKIE_NAME]);
  if (socialSessionFingerprint) {
    return `social:${socialSessionFingerprint}`;
  }

  const ip = normalizeKey(req.ip || 'anonymous');
  return `ip:${ip || 'anonymous'}`;
};

const getLoginRateLimitKey = (req) => {
  const email = normalizeKey(req.body?.email);
  return `${req.ip}:${email || 'anonymous'}`;
};
const getPasswordResetRequestKey = (req) => {
  const email = normalizeKey(req.body?.email);
  return `${req.ip}:${email || 'anonymous'}`;
};
const getPasswordResetSubmitKey = (req) => {
  const tokenFingerprint = fingerprintValue(req.body?.token || req.body?.resetToken || req.body?.code);
  return `${normalizeKey(req.ip)}:reset-submit:${tokenFingerprint || 'anonymous'}`;
};
const getAuthAttemptKey = (req) => {
  const routePrefix = getRouteAwareLimiterKeyPrefix(req);
  const identity = buildAuthAttemptIdentity(req);
  return `${routePrefix}:${identity}`;
};

const getClientIdentity = (req) => normalizeKey(req.user?.id || req.ip || 'anonymous');
const isNonActionableRequest = (req) => ['HEAD', 'OPTIONS'].includes(String(req.method || '').toUpperCase());
const isLocalhostIp = (ip) => {
  const normalized = String(ip || '').trim().toLowerCase();
  return normalized === '127.0.0.1' || normalized === '::1' || normalized === '::ffff:127.0.0.1';
};
const shouldSkipAuthApiRateLimit = (req) => {
  if (isNonActionableRequest(req)) {
    return true;
  }

  // Prevent local development OAuth retries from getting rate-limited.
  if (!isProduction && isLocalhostIp(req.ip)) {
    return true;
  }

  return false;
};

const logRateLimiterFailure = (label, error) => {
  const detail = error?.message || error;

  if (!isProduction) {
    const dedupeKey = `${label}:${detail}`;
    if (devRateLimiterFailureKeys.has(dedupeKey)) {
      return;
    }
    devRateLimiterFailureKeys.add(dedupeKey);
    logger.debug(`${label} fallback in development (fail-open):`, detail);
    return;
  }

  logger.error(`${label} failed:`, detail);
};

const setRateLimitHeaders = (res, { max, remaining, resetAt }) => {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  res.setHeader('Retry-After', String(retryAfterSeconds));
};

const getLimiterBucket = ({ storeName, key }) => `rl:${storeName}:${key}`;

const splitCsv = (raw) =>
  String(raw || '')
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);

const isHttpsOrigin = (origin) => /^https:\/\//i.test(origin);
const isLocalHttpOrigin = (origin) => /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);

const buildConnectSrcDirective = () => {
  const explicit = splitCsv(process.env.CSP_CONNECT_SRC_ORIGINS || process.env.CSP_CONNECT_SRC_HTTPS_ORIGINS);
  const corsOrigins = getAllowedOrigins().map(normalizeOrigin);
  const values = new Set(["'self'"]);

  for (const origin of [...explicit, ...corsOrigins]) {
    if (isHttpsOrigin(origin) || (!isProduction && isLocalHttpOrigin(origin))) {
      values.add(origin);
    }
  }

  return Array.from(values);
};

const pruneExpiredLocalBuckets = (now = Date.now()) => {
  for (const [bucket, state] of localRateLimitBuckets.entries()) {
    if (!state || state.resetAt <= now) {
      localRateLimitBuckets.delete(bucket);
    }
  }
};

const touchLocalRateLimitBucket = ({ storeName, key, windowMs }) => {
  const now = Date.now();
  if (localRateLimitBuckets.size >= LOCAL_RATE_LIMIT_MAX_BUCKETS) {
    pruneExpiredLocalBuckets(now);
  }
  if (localRateLimitBuckets.size >= LOCAL_RATE_LIMIT_MAX_BUCKETS) {
    const oldest = localRateLimitBuckets.keys().next().value;
    if (oldest) {
      localRateLimitBuckets.delete(oldest);
    }
  }

  const bucket = getLimiterBucket({ storeName, key });
  const existing = localRateLimitBuckets.get(bucket);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    const nextState = { count: 1, resetAt };
    localRateLimitBuckets.set(bucket, nextState);
    return nextState;
  }

  const nextState = {
    count: Number(existing.count || 0) + 1,
    resetAt: existing.resetAt,
  };
  localRateLimitBuckets.set(bucket, nextState);
  return nextState;
};

const shouldFailClosedForStore = (storeName) => {
  const forceFailClosed = String(process.env.AUTH_LIMITER_FAIL_CLOSED_FORCE || '').trim().toLowerCase() === 'true';
  if ((!isProduction && !forceFailClosed) || AUTH_LIMITER_FAIL_CLOSED_AFTER_MS <= 0) {
    return false;
  }
  if (!highRiskAuthLimiterStores.has(String(storeName || '').trim())) {
    return false;
  }

  const degradedSince = Number(limiterDegradedStartedAt.get(storeName) || 0);
  if (!degradedSince) {
    return false;
  }

  return (Date.now() - degradedSince) >= AUTH_LIMITER_FAIL_CLOSED_AFTER_MS;
};

const emitRateLimiterAlert = (payload) => {
  if (!RATE_LIMITER_ALERT_WEBHOOK_URL || typeof fetch !== 'function') {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RATE_LIMITER_ALERT_TIMEOUT_MS);
  timeout.unref?.();

  fetch(RATE_LIMITER_ALERT_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).catch(() => null).finally(() => {
    clearTimeout(timeout);
  });
};

const logLimiterDegradedMode = (storeName, error) => {
  if (!limiterDegradedStartedAt.has(storeName)) {
    limiterDegradedStartedAt.set(storeName, Date.now());
  }
  const now = Date.now();
  const lastLogAt = Number(limiterDegradedModeLogState.get(storeName) || 0);
  if (now - lastLogAt < LIMITER_DEGRADED_LOG_COOLDOWN_MS) {
    return;
  }
  limiterDegradedModeLogState.set(storeName, now);

  logger.warn(
    {
      limiter: storeName,
      mode: 'in-memory-fallback',
      reason: error?.code ? String(error.code) : 'redis_unavailable',
    },
    'Rate limiter store degraded; using in-memory fallback.'
  );
  emitRateLimiterAlert({
    type: 'rate_limiter_degraded',
    limiter: storeName,
    mode: 'in-memory-fallback',
    reason: error?.code ? String(error.code) : 'redis_unavailable',
    degradedSince: limiterDegradedStartedAt.get(storeName),
    failClosedAfterMs: AUTH_LIMITER_FAIL_CLOSED_AFTER_MS,
    at: new Date().toISOString(),
  });
};

const touchRateLimitBucket = async ({ storeName, key, windowMs }) => {
  try {
    const redis = await getRedisClient();
    if (!redis) {
      logLimiterDegradedMode(storeName);
      if (shouldFailClosedForStore(storeName)) {
        return {
          failClosed: true,
          resetAt: Date.now() + windowMs,
          count: 0,
        };
      }
      return touchLocalRateLimitBucket({ storeName, key, windowMs });
    }
    limiterDegradedStartedAt.delete(storeName);

    const bucket = getLimiterBucket({ storeName, key });
    const count = await redis.incr(bucket);
    if (count === 1) {
      await redis.pExpire(bucket, windowMs);
    }

    let ttlMs = await redis.pTTL(bucket);
    if (ttlMs < 0) {
      await redis.pExpire(bucket, windowMs);
      ttlMs = windowMs;
    }

    return {
      count,
      resetAt: Date.now() + ttlMs,
    };
  } catch (error) {
    logLimiterDegradedMode(storeName, error);
    if (shouldFailClosedForStore(storeName)) {
      return {
        failClosed: true,
        resetAt: Date.now() + windowMs,
        count: 0,
      };
    }
    return touchLocalRateLimitBucket({ storeName, key, windowMs });
  }
};

const createRateLimiter = ({
  storeName,
  windowMs,
  max,
  message,
  keyGenerator = getClientIdentity,
  skip,
}) => {
  return (req, res, next) => {
    if (typeof skip === 'function' && skip(req)) {
      return next();
    }

    const key = String(keyGenerator(req) || 'anonymous');

    touchRateLimitBucket({ storeName, key, windowMs })
      .then((result) => {
        if (result?.failClosed) {
          return res.status(503).json({
            success: false,
            error: 'Authentication is temporarily unavailable. Please retry shortly.',
          });
        }

        setRateLimitHeaders(res, {
          max,
          remaining: max - result.count,
          resetAt: result.resetAt,
        });

        if (result.count > max) {
          return res.status(429).json({
            success: false,
            message,
          });
        }

        return next();
      })
      .catch((error) => {
        logRateLimiterFailure(`Rate limiter "${storeName}"`, error);
        return next();
      });
  };
};

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: buildConnectSrcDirective(),
      fontSrc: ["'self'", 'data:', 'https:'],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: isProduction
    ? {
        maxAge: Number(process.env.HSTS_MAX_AGE || 31536000),
        includeSubDomains: true,
        preload: true,
      }
    : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  xPoweredBy: true,
});

const loginRateLimiter = (req, res, next) => {
  const key = getLoginRateLimitKey(req);
  touchRateLimitBucket({ storeName: 'login-attempts', key, windowMs: AUTH_ATTEMPT_WINDOW_MS })
    .then((result) => {
      if (result?.failClosed) {
        return res.status(503).json({
          success: false,
          error: 'Authentication is temporarily unavailable. Please retry shortly.',
        });
      }

      if (!result) {
        return next();
      }

      setRateLimitHeaders(res, {
        max: MAX_LOGIN_ATTEMPTS,
        remaining: MAX_LOGIN_ATTEMPTS - result.count,
        resetAt: result.resetAt,
      });

      if (result.count > MAX_LOGIN_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: 'Too many login attempts. Please try again later.',
        });
      }

      return next();
    })
    .catch((error) => {
      logRateLimiterFailure('Login rate limiter', error);
      return next();
    });
};

const clearLoginRateLimit = (req) => {
  const key = getLoginRateLimitKey(req);
  localRateLimitBuckets.delete(getLimiterBucket({ storeName: 'login-attempts', key }));
  getRedisClient()
    .then((redis) => {
      if (!redis) {
        return;
      }
      return redis.del(getLimiterBucket({ storeName: 'login-attempts', key }));
    })
    .catch((error) => {
      logger.warn('Failed to clear login rate limiter state:', error?.message || error);
    });
};

const authApiRateLimiter = createRateLimiter({
  storeName: 'auth-api',
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_API_RATE_LIMIT_MAX || 120),
  message: 'Too many authentication requests. Please try again later.',
  skip: shouldSkipAuthApiRateLimit,
});

const apiRateLimiter = createRateLimiter({
  storeName: 'api-all',
  windowMs: GLOBAL_API_WINDOW_MS,
  max: GLOBAL_API_RATE_LIMIT_MAX,
  message: 'Too many API requests. Please try again later.',
  skip: isNonActionableRequest,
});

const authAttemptRateLimiter = createRateLimiter({
  storeName: 'auth-attempts',
  windowMs: AUTH_ATTEMPT_WINDOW_MS,
  max: AUTH_ATTEMPT_MAX,
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: getAuthAttemptKey,
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

const resumeOptimizeRateLimiter = createRateLimiter({
  storeName: 'resume-optimize',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: Number(process.env.RESUME_OPTIMIZE_RATE_LIMIT_MAX || 10),
  message: 'Too many optimization requests. Please try again later.',
  skip: isNonActionableRequest,
});

const forgotPasswordRateLimiter = createRateLimiter({
  storeName: 'forgot-password',
  windowMs: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS || AUTH_ATTEMPT_WINDOW_MS),
  max: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX || AUTH_ATTEMPT_MAX),
  message: 'Too many password reset requests. Please try again later.',
  keyGenerator: getPasswordResetRequestKey,
  skip: isNonActionableRequest,
});

const resetPasswordRateLimiter = createRateLimiter({
  storeName: 'reset-password',
  windowMs: Number(process.env.RESET_PASSWORD_RATE_LIMIT_WINDOW_MS || AUTH_ATTEMPT_WINDOW_MS),
  max: Number(process.env.RESET_PASSWORD_RATE_LIMIT_MAX || AUTH_ATTEMPT_MAX),
  message: 'Too many password reset attempts. Please try again later.',
  keyGenerator: getPasswordResetSubmitKey,
  skip: isNonActionableRequest,
});

const __resetRateLimitFallbackForTests = () => {
  localRateLimitBuckets.clear();
  limiterDegradedModeLogState.clear();
  limiterDegradedStartedAt.clear();
};

module.exports = {
  securityHeaders,
  apiRateLimiter,
  authApiRateLimiter,
  authAttemptRateLimiter,
  publicApiRateLimiter,
  loginRateLimiter,
  messagesReadRateLimiter,
  messagesWriteRateLimiter,
  notificationsRateLimiter,
  companyApiRateLimiter,
  companyWriteRateLimiter,
  developerApiRateLimiter,
  resumeOptimizeRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
  clearLoginRateLimit,
  __resetRateLimitFallbackForTests,
};
