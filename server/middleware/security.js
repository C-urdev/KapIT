const loginAttempts = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX || 10);

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const getRateLimitKey = (req) => {
  const email = normalizeKey(req.body?.email);
  return `${req.ip}:${email || 'anonymous'}`;
};

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    if ((entry?.resetAt || 0) <= now) {
      loginAttempts.delete(key);
    }
  }
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
  cleanupExpiredEntries();
  const key = getRateLimitKey(req);
  const now = Date.now();
  const existing = loginAttempts.get(key);

  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return next();
  }

  if (existing.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.',
    });
  }

  existing.count += 1;
  loginAttempts.set(key, existing);
  return next();
};

const clearLoginRateLimit = (req) => {
  loginAttempts.delete(getRateLimitKey(req));
};

module.exports = {
  securityHeaders,
  loginRateLimiter,
  clearLoginRateLimit,
};
