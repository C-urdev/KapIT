const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { useMigrationManagedSchema } = require('../config/schemaManagementMode');

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRE || '20m';
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.JWT_REFRESH_EXPIRE_DAYS || 14);
const ACCESS_COOKIE_NAME = process.env.ACCESS_TOKEN_COOKIE_NAME || 'kapit_access_token';
const REFRESH_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'kapit_refresh_token';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'kapit_csrf_token';
const isProduction = process.env.NODE_ENV === 'production';

const getRefreshTokenSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const parseDurationToMs = (value, fallbackMs) => {
  const normalized = String(value || '').trim().toLowerCase();
  const match = normalized.match(/^(\d+)([smhd])$/);
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const unitMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * (unitMs[unit] || fallbackMs);
};

const ACCESS_COOKIE_MAX_AGE_MS = parseDurationToMs(ACCESS_TOKEN_TTL, 20 * 60 * 1000);
const REFRESH_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

const getTokenPayload = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  userType: user.user_type,
  role: user.role || user.user_type,
  accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
});

const signAccessToken = (user) =>
  jwt.sign(getTokenPayload(user), process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const signRefreshToken = (user, sessionId) =>
  jwt.sign(
    {
      sub: user.id,
      sessionId,
      tokenVersion: 1,
    },
    getRefreshTokenSecret(),
    { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` }
  );

const hashToken = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

const ensureRefreshSessionsTable = async () => {
  if (useMigrationManagedSchema) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_refresh_sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ NULL,
      user_agent TEXT NULL,
      ip_address TEXT NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS auth_refresh_sessions_user_id_idx
    ON auth_refresh_sessions(user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS auth_refresh_sessions_expires_at_idx
    ON auth_refresh_sessions(expires_at);
  `);
};

const createSessionRecord = async ({ user, refreshToken, userAgent, ipAddress }) => {
  await ensureRefreshSessionsTable();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_MS);

  await pool.query(
    `INSERT INTO auth_refresh_sessions (id, user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, user.id, hashToken(refreshToken), expiresAt, userAgent || null, ipAddress || null]
  );

  return {
    sessionId,
    expiresAt,
  };
};

const rotateSessionRecord = async ({ sessionId, refreshToken, userAgent, ipAddress }) => {
  await ensureRefreshSessionsTable();
  const expiresAt = new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_MS);

  const result = await pool.query(
    `UPDATE auth_refresh_sessions
     SET token_hash = $1,
         expires_at = $2,
         revoked_at = NULL,
         user_agent = $3,
         ip_address = $4
     WHERE id = $5
       AND revoked_at IS NULL
     RETURNING id`,
    [hashToken(refreshToken), expiresAt, userAgent || null, ipAddress || null, sessionId]
  );

  return result.rows[0] || null;
};

const revokeSessionById = async (sessionId) => {
  if (!sessionId) {
    return;
  }

  await ensureRefreshSessionsTable();
  await pool.query(
    `UPDATE auth_refresh_sessions
     SET revoked_at = NOW()
     WHERE id = $1
       AND revoked_at IS NULL`,
    [sessionId]
  );
};

const revokeSessionByToken = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshTokenSecret());
    await revokeSessionById(decoded?.sessionId);
  } catch {
    // Ignore invalid refresh tokens during logout.
  }
};

const getUserById = async (userId) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
  return result.rows[0] || null;
};

const verifyRefreshTokenSession = async (refreshToken) => {
  await ensureRefreshSessionsTable();
  const decoded = jwt.verify(refreshToken, getRefreshTokenSecret());
  const sessionId = decoded?.sessionId;
  const userId = decoded?.sub;

  if (!sessionId || !userId) {
    throw new Error('Invalid refresh token payload');
  }

  const result = await pool.query(
    `SELECT *
     FROM auth_refresh_sessions
     WHERE id = $1
       AND user_id = $2
       AND revoked_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [sessionId, userId]
  );

  const session = result.rows[0];
  if (!session) {
    throw new Error('Refresh session not found');
  }

  if (session.token_hash !== hashToken(refreshToken)) {
    await revokeSessionById(sessionId);
    throw new Error('Refresh token mismatch');
  }

  const user = await getUserById(userId);
  if (!user) {
    await revokeSessionById(sessionId);
    throw new Error('User not found');
  }

  return { user, session };
};

const buildCsrfToken = () => crypto.randomBytes(24).toString('hex');

const attachSessionCookies = async (res, user, req, existingSessionId = null) => {
  const accessToken = signAccessToken(user);
  const csrfToken = buildCsrfToken();
  let sessionId = existingSessionId;
  let refreshToken = '';

  if (!sessionId) {
    const created = await createSessionRecord({
      user,
      refreshToken: signRefreshToken(user, crypto.randomUUID()),
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });
    sessionId = created.sessionId;
  }

  refreshToken = signRefreshToken(user, sessionId);
  const rotated = await rotateSessionRecord({
    sessionId,
    refreshToken,
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  });

  if (!rotated) {
    throw new Error('Unable to persist refresh session');
  }

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });

  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });

  return {
    accessToken,
    csrfToken,
    refreshTokenCookieName: REFRESH_COOKIE_NAME,
    accessTokenCookieName: ACCESS_COOKIE_NAME,
  };
};

const clearSessionCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, { ...baseCookieOptions });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...baseCookieOptions });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getTokenPayload,
  signAccessToken,
  attachSessionCookies,
  clearSessionCookies,
  verifyRefreshTokenSession,
  revokeSessionById,
  revokeSessionByToken,
};
