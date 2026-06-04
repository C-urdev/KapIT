const jwt = require('jsonwebtoken');
const { normalizeOrigin, isKapitPreviewOrigin, getAllowedOrigins, isLoopbackOrigin } = require('../config/origins');
const {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  signAccessToken,
  verifyRefreshTokenSession,
} = require('../services/authSessionService');

const normalizeDecodedUser = (decoded) => {
  const normalizedUserType = String(decoded?.userType || decoded?.type || '').trim().toLowerCase();
  const normalizedAccountType = String(
    decoded?.accountType || (normalizedUserType === 'company' ? 'company' : normalizedUserType === 'employee' ? 'developer' : '')
  )
    .trim()
    .toLowerCase();

  return {
    ...decoded,
    userType: normalizedUserType,
    role: String(decoded?.role || normalizedUserType || '').trim().toLowerCase(),
    accountType: normalizedAccountType,
  };
};

const readBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return '';
  }
  return authHeader.slice('Bearer '.length).trim();
};

const readAccessToken = (req) => readBearerToken(req) || String(req.cookies?.[ACCESS_COOKIE_NAME] || '').trim();

const verifyAccessToken = (token) => normalizeDecodedUser(jwt.verify(token, process.env.JWT_SECRET));

const refreshAccessTokenIfPossible = async (req, res) => {
  const refreshToken = String(req.cookies?.[REFRESH_COOKIE_NAME] || '').trim();
  if (!refreshToken) {
    return null;
  }

  const { user } = await verifyRefreshTokenSession(refreshToken);
  const accessToken = signAccessToken(user);
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 20 * 60 * 1000,
  });

  return normalizeDecodedUser({
    ...user,
    userType: user.user_type,
    accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
    role: user.role || user.user_type,
  });
};

const verifyToken = async (req, res, next) => {
  try {
    const token = readAccessToken(req);
    if (token) {
      req.user = verifyAccessToken(token);
      return next();
    }

    const refreshedUser = await refreshAccessTokenIfPossible(req, res);
    if (refreshedUser) {
      req.user = refreshedUser;
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'No session found. Access denied.',
    });
  } catch (error) {
    if (error.name !== 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Access denied.',
      });
    }

    try {
      const refreshedUser = await refreshAccessTokenIfPossible(req, res);
      if (refreshedUser) {
        req.user = refreshedUser;
        return next();
      }
    } catch {
      // fall through to 401
    }

    return res.status(401).json({
      success: false,
      message: 'Session expired. Please login again.',
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = readAccessToken(req);
    if (token) {
      req.user = verifyAccessToken(token);
      return next();
    }
  } catch {
    // Continue as anonymous user.
  }
  req.user = null;
  return next();
};

const requireRoles = (...roles) => {
  const allowed = roles.map((role) => String(role || '').trim().toLowerCase()).filter(Boolean);

  return (req, res, next) => {
    const role = String(req.user?.role || req.user?.userType || '').trim().toLowerCase();
    const accountType = String(req.user?.accountType || '').trim().toLowerCase();

    if (allowed.includes(role) || allowed.includes(accountType)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource.',
    });
  };
};

const requireCsrfForCookieAuth = (req, res, next) => {
  const hasBearerToken = Boolean(readBearerToken(req));
  if (hasBearerToken) {
    return next();
  }

  const method = String(req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  const cookieToken = String(req.cookies?.[CSRF_COOKIE_NAME] || '').trim();
  const headerToken = String(req.get('x-csrf-token') || '').trim();
  const origin = String(req.get('origin') || '').trim();
  const normalizedOrigin = normalizeOrigin(origin);
  const allowedOrigins = getAllowedOrigins();

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed.',
    });
  }

  const isDevLoopback = String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production' && isLoopbackOrigin(normalizedOrigin);

  if (normalizedOrigin && !allowedOrigins.includes(normalizedOrigin) && !isKapitPreviewOrigin(normalizedOrigin) && !isDevLoopback) {
    return res.status(403).json({
      success: false,
      message: 'Origin validation failed.',
    });
  }

  return next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireRoles,
  requireCsrfForCookieAuth,
};




