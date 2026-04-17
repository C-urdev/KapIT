const { getRedisClient } = require('../config/redis');
const helmet = require('helmet');
const { logger } = require('../config/logger');

const WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX || 10);
const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

// Rate limiting strategy: fail-open.
// Availability is prioritized when Redis is degraded/unreachable so auth/API traffic
// does not become a single-point outage. Monitor Redis health and alert on failures.

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const getLoginRateLimitKey = (req) => {
  const email = normalizeKey(req.body?.email);
  return `${req.ip}:${email || 'anonymous'}`;
};
const getPasswordResetRequestKey = (req) => {
  const email = normalizeKey(req.body?.email);
  return `${req.ip}:${email || 'anonymous'}`;
};
const getPasswordResetSubmitKey = (req) => `${req.ip}:reset-submit`;

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

const setRateLimitHeaders = (res, { max, remaining, resetAt }) => {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  res.setHeader('Retry-After', String(retryAfterSeconds));
};

const getLimiterBucket = ({ storeName, key }) => `rl:${storeName}:${key}`;

const touchRateLimitBucket = async ({ storeName, key, windowMs }) => {
  const redis = await getRedisClient();
  if (!redis) {
    return null;
  }

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
        if (!result) {
          // Redis unavailable: fail open to preserve API reliability.
          return next();
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
        logger.error(`Rate limiter "${storeName}" failed:`, error?.message || error);
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
      connectSrc: ["'self'", 'https:', 'http:'],
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
  touchRateLimitBucket({ storeName: 'login-attempts', key, windowMs: WINDOW_MS })
    .then((result) => {
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
      logger.error('Login rate limiter failed:', error?.message || error);
      return next();
    });
};

const clearLoginRateLimit = (req) => {
  const key = getLoginRateLimitKey(req);
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

const forgotPasswordRateLimiter = createRateLimiter({
  storeName: 'forgot-password',
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX || 3),
  message: 'Too many password reset requests. Please try again later.',
  keyGenerator: getPasswordResetRequestKey,
  skip: isNonActionableRequest,
});

const resetPasswordRateLimiter = createRateLimiter({
  storeName: 'reset-password',
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RESET_PASSWORD_RATE_LIMIT_MAX || 3),
  message: 'Too many password reset attempts. Please try again later.',
  keyGenerator: getPasswordResetSubmitKey,
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
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
  clearLoginRateLimit,
};
