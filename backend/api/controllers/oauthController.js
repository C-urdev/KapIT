const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/database');
const { logger } = require('../config/logger');
const { attachSessionCookies } = require('../services/authSessionService');
const { serializeUser } = require('../utils/authUserSerializer');
const { generateUsername } = require('../utils/usernameGenerator');
const { assertLocalAuthBypassAllowed } = require('../config/localBypass');
const { getOrCreateCompanyForUserId } = require('../services/companyService');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const OAUTH_STATE_COOKIE_NAME = process.env.OAUTH_STATE_COOKIE_NAME || 'kapit_oauth_state';
const SOCIAL_SIGNUP_COOKIE_NAME = process.env.SOCIAL_SIGNUP_COOKIE_NAME || 'kapit_social_signup';
const parseTtlMs = (rawValue, fallbackMs, minimumMs) => {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackMs;
  }
  return Math.max(minimumMs, Math.floor(parsed));
};

const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const MIN_OAUTH_TTL_MS = isProduction ? 60_000 : 100;
const MIN_SOCIAL_SIGNUP_TTL_MS = isProduction ? 60_000 : 100;
const OAUTH_STATE_TTL_MS = parseTtlMs(process.env.OAUTH_STATE_TTL_MS, 10 * 60 * 1000, MIN_OAUTH_TTL_MS);
const SOCIAL_SIGNUP_TTL_MS = parseTtlMs(process.env.SOCIAL_SIGNUP_TTL_MS, 15 * 60 * 1000, MIN_SOCIAL_SIGNUP_TTL_MS);
const COOKIE_SECURE = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const COOKIE_SAME_SITE = String(process.env.AUTH_COOKIE_SAMESITE || 'lax').toLowerCase() === 'strict' ? 'strict' : 'lax';
const OAUTH_STATE_PURPOSE = 'oauth-state-store';
const SOCIAL_SIGNUP_PURPOSE = 'social-signup-pending-session';

const normalizeAccountType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'company') return 'company';
  if (normalized === 'developer' || normalized === 'employee' || normalized === 'user') return 'developer';
  return null;
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeOAuthMode = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'signup') return 'signup';
  return 'login';
};

const normalizeOAuthProvider = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'google' || normalized === 'github') {
    return normalized;
  }
  return '';
};

const getJwtSecretOrThrow = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('Missing JWT_SECRET');
  }
  return secret;
};

const getProviderField = (provider) => (provider === 'google' ? 'google_id' : 'github_id');
const getResolvedUserType = (accountType) => (accountType === 'company' ? 'company' : 'employee');
const getUserAccountType = (user) => (
  normalizeAccountType(user?.account_type) || normalizeAccountType(user?.user_type) || 'developer'
);

const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE,
  path: '/',
  // Express serializes Max-Age in whole seconds.
  // Keep at least 1 second so sub-second test TTLs do not become Max-Age=0.
  maxAge: Math.max(1000, Number(maxAgeMs) || 0),
});

const clearCookie = (res, cookieName) => {
  res.clearCookie(cookieName, {
    ...getCookieOptions(1),
    maxAge: undefined,
  });
};

const setSignedAuthCookie = (res, cookieName, purpose, payload, maxAgeMs) => {
  const token = jwt.sign(
    {
      purpose,
      payload,
    },
    getJwtSecretOrThrow(),
    {
      expiresIn: `${Math.max(60, Math.floor(maxAgeMs / 1000))}s`,
    }
  );

  res.cookie(cookieName, token, getCookieOptions(maxAgeMs));
};

const readSignedAuthCookie = (req, cookieName, expectedPurpose) => {
  const token = String(req.cookies?.[cookieName] || '').trim();
  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, getJwtSecretOrThrow());
  if (decoded?.purpose !== expectedPurpose || typeof decoded?.payload !== 'object' || decoded?.payload == null) {
    throw new Error('Invalid auth session payload.');
  }

  return decoded.payload;
};

const readOAuthStateStore = (req) => {
  try {
    const payload = readSignedAuthCookie(req, OAUTH_STATE_COOKIE_NAME, OAUTH_STATE_PURPOSE);
    const entries = Array.isArray(payload?.entries) ? payload.entries : [];
    const now = Date.now();

    return entries
      .map((entry) => ({
        state: String(entry?.state || '').trim(),
        provider: normalizeOAuthProvider(entry?.provider),
        mode: normalizeOAuthMode(entry?.mode),
        accountTypeHint: normalizeAccountType(entry?.accountTypeHint),
        expiresAt: Number(entry?.expiresAt || 0),
      }))
      .filter((entry) => entry.state && entry.provider && Number.isFinite(entry.expiresAt) && entry.expiresAt > now);
  } catch {
    return [];
  }
};

const writeOAuthStateStore = (res, entries) => {
  const now = Date.now();
  const normalized = (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry && entry.state && entry.provider && Number(entry.expiresAt) > now)
    .slice(-12);

  if (!normalized.length) {
    clearCookie(res, OAUTH_STATE_COOKIE_NAME);
    return;
  }

  setSignedAuthCookie(
    res,
    OAUTH_STATE_COOKIE_NAME,
    OAUTH_STATE_PURPOSE,
    { entries: normalized },
    OAUTH_STATE_TTL_MS
  );
};

const consumeOAuthState = ({ req, res, provider, state }) => {
  const normalizedProvider = normalizeOAuthProvider(provider);
  const normalizedState = String(state || '').trim();
  if (!normalizedProvider || !normalizedState) {
    return { ok: false };
  }

  const entries = readOAuthStateStore(req);
  const match = entries.find((entry) => entry.provider === normalizedProvider && entry.state === normalizedState);
  if (!match) {
    writeOAuthStateStore(res, entries);
    return { ok: false };
  }

  const remaining = entries.filter((entry) => !(entry.provider === normalizedProvider && entry.state === normalizedState));
  writeOAuthStateStore(res, remaining);

  return {
    ok: true,
    mode: match.mode,
    accountTypeHint: match.accountTypeHint,
  };
};

const setSocialSignupSession = (res, payload) => {
  setSignedAuthCookie(
    res,
    SOCIAL_SIGNUP_COOKIE_NAME,
    SOCIAL_SIGNUP_PURPOSE,
    {
      ...payload,
      expiresAt: Date.now() + SOCIAL_SIGNUP_TTL_MS,
    },
    SOCIAL_SIGNUP_TTL_MS
  );
};

const readSocialSignupSession = (req) => {
  const payload = readSignedAuthCookie(req, SOCIAL_SIGNUP_COOKIE_NAME, SOCIAL_SIGNUP_PURPOSE);
  const expiresAt = Number(payload?.expiresAt || 0);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error('Social signup session is missing or expired. Please start again.');
  }
  const email = normalizeEmail(payload?.email);
  const provider = normalizeOAuthProvider(payload?.provider);
  const providerId = String(payload?.providerId || '').trim();
  if (!email || !provider || !providerId) {
    throw new Error('Invalid social signup session.');
  }

  return {
    email,
    name: String(payload?.name || ''),
    provider,
    providerId,
    accountTypeHint: normalizeAccountType(payload?.accountTypeHint),
  };
};

const clearSocialSignupSession = (res) => {
  clearCookie(res, SOCIAL_SIGNUP_COOKIE_NAME);
};

const buildSocialSignupToken = ({ email, name, provider, providerId, accountTypeHint }) =>
  jwt.sign(
    {
      purpose: 'social-signup-pending',
      email,
      name: String(name || ''),
      provider,
      providerId: String(providerId || ''),
      accountTypeHint: normalizeAccountType(accountTypeHint),
    },
    getJwtSecretOrThrow(),
    { expiresIn: '20m' }
  );

const verifySocialSignupToken = (token) => {
  const payload = jwt.verify(String(token || '').trim(), getJwtSecretOrThrow());
  if (payload?.purpose !== 'social-signup-pending') {
    throw new Error('Invalid social signup token.');
  }
  const email = normalizeEmail(payload?.email);
  const provider = String(payload?.provider || '').trim().toLowerCase();
  const providerId = String(payload?.providerId || '').trim();
  if (!email || !providerId || (provider !== 'google' && provider !== 'github')) {
    throw new Error('Invalid social signup token payload.');
  }
  return {
    email,
    name: String(payload?.name || ''),
    provider,
    providerId,
    accountTypeHint: normalizeAccountType(payload?.accountTypeHint),
  };
};

const verifyRegistrationToken = ({ verificationToken, email }) => {
  const payload = jwt.verify(String(verificationToken || '').trim(), getJwtSecretOrThrow());
  const tokenEmail = normalizeEmail(payload?.email);
  if (payload?.purpose !== 'registration-validated' || tokenEmail !== normalizeEmail(email)) {
    throw new Error('Invalid registration verification token.');
  }
};

const buildSocialNotRegisteredResponse = ({ email, name, provider, providerId, accountTypeHint }) => {
  const normalizedAccountTypeHint = normalizeAccountType(accountTypeHint);
  return {
    success: false,
    statusCode: 404,
    code: 'SOCIAL_ACCOUNT_NOT_REGISTERED',
    message: 'No account is registered for this social login yet.',
    error: 'No account is registered for this social login yet.',
    social: {
      email,
      name: String(name || ''),
      provider,
      accountTypeHint: normalizedAccountTypeHint,
    },
  };
};

const findExistingUserForSocialLogin = async ({ pgClient, email, provider, providerId }) => {
  const providerField = getProviderField(provider);
  const providerResult = await pgClient.query(
    `SELECT * FROM users WHERE ${providerField} = $1 LIMIT 1`,
    [providerId]
  );
  if (providerResult.rows.length) {
    return {
      user: providerResult.rows[0],
      matchType: 'provider',
    };
  }

  const emailResult = await pgClient.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [email]);
  if (emailResult.rows.length) {
    return {
      user: emailResult.rows[0],
      matchType: 'email',
    };
  }

  return {
    user: null,
    matchType: null,
  };
};

const linkProviderToExistingUser = async ({ pgClient, user, provider, providerId }) => {
  const providerField = getProviderField(provider);
  if (user[providerField]) {
    return user;
  }

  const linked = await pgClient.query(
    `UPDATE users
     SET ${providerField} = $1, auth_provider = $2
     WHERE id = $3
     RETURNING *`,
    [providerId, provider, user.id]
  );
  return linked.rows[0] || user;
};

const issueSessionForUser = async ({ user, req, res }) => {
  const session = await attachSessionCookies(res, user, req);
  return {
    success: true,
    statusCode: 200,
    message: 'Login successful',
    session: {
      strategy: 'cookie',
      accessTokenTtl: process.env.JWT_ACCESS_EXPIRE || '20m',
      refreshTokenTtlDays: Number(process.env.JWT_REFRESH_EXPIRE_DAYS || 14),
      csrfToken: session.csrfToken,
    },
    user: serializeUser(user),
  };
};

const handleSocialLogin = async ({ email, name, provider, providerId, accountTypeHint, oauthMode, req, res }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { success: false, statusCode: 400, message: 'Social account email is missing.' };
  }

  let pgClient;
  try {
    pgClient = await pool.connect();
    const existingLookup = await findExistingUserForSocialLogin({
      pgClient,
      email: normalizedEmail,
      provider,
      providerId,
    });
    const existingUser = existingLookup.user;
    const existingMatchType = existingLookup.matchType;

    if (!existingUser) {
      setSocialSignupSession(res, {
        email: normalizedEmail,
        name: String(name || ''),
        provider,
        providerId: String(providerId || ''),
        accountTypeHint: normalizeAccountType(accountTypeHint),
      });
      return buildSocialNotRegisteredResponse({
        email: normalizedEmail,
        name,
        provider,
        providerId,
        accountTypeHint,
      });
    }

    if (oauthMode === 'signup' && existingMatchType === 'email') {
      const existingAccountType = getUserAccountType(existingUser);
      const normalizedHint = normalizeAccountType(accountTypeHint);

      if (normalizedHint && normalizedHint !== existingAccountType) {
        return {
          success: false,
          statusCode: 409,
          code: 'SOCIAL_SIGNUP_ACCOUNT_TYPE_MISMATCH',
          message: 'This email is already used by an existing account with a different account type.',
          error: 'This email is already used by an existing account with a different account type.',
        };
      }

      return {
        success: false,
        statusCode: 409,
        code: 'SOCIAL_SIGNUP_EMAIL_ALREADY_USED',
        message: 'This email is already registered. Please sign in instead.',
        error: 'This email is already registered. Please sign in instead.',
      };
    }

    const linkedUser = await linkProviderToExistingUser({
      pgClient,
      user: existingUser,
      provider,
      providerId,
    });

    return issueSessionForUser({ user: linkedUser, req, res });
  } finally {
    if (pgClient) pgClient.release();
  }
};

const completeSocialSignup = async (req, res) => {
  const socialSignupToken = String(req.body?.socialSignupToken || '').trim();
  const verificationToken = String(req.body?.verificationToken || '').trim();
  const password = String(req.body?.password || '');
  const accountType = normalizeAccountType(req.body?.accountType);

  if (!verificationToken || !password || !accountType) {
    return res.status(400).json({ success: false, message: 'Missing required social signup fields.' });
  }

  let socialPayload;
  try {
    socialPayload = readSocialSignupSession(req);
  } catch {
    try {
      socialPayload = verifySocialSignupToken(socialSignupToken);
    } catch (error) {
      clearSocialSignupSession(res);
      return res.status(400).json({ success: false, message: error.message || 'Invalid social signup token.' });
    }
  }

  try {
    verifyRegistrationToken({ verificationToken, email: socialPayload.email });
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid or expired email verification token.' });
  }

  let pgClient;
  try {
    pgClient = await pool.connect();

    const existingByEmail = await pgClient.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [socialPayload.email]);
    if (existingByEmail.rows.length) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const providerField = getProviderField(socialPayload.provider);
    const existingByProvider = await pgClient.query(`SELECT id FROM users WHERE ${providerField} = $1 LIMIT 1`, [socialPayload.providerId]);
    if (existingByProvider.rows.length) {
      return res.status(409).json({ success: false, message: 'This social account is already linked to an existing account.' });
    }

    const userId = crypto.randomUUID();
    const username = await generateUsername(
      socialPayload.name || socialPayload.email.split('@')[0] || 'user',
      pgClient
    );
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const userType = getResolvedUserType(accountType);

    const insertQuery = `
      INSERT INTO users (
        id,
        username,
        email,
        password,
        user_type,
        account_type,
        auth_provider,
        ${providerField},
        name,
        profile_completed,
        terms_accepted,
        terms_accepted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, true, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const created = await pgClient.query(insertQuery, [
      userId,
      username,
      socialPayload.email,
      hashedPassword,
      userType,
      accountType,
      socialPayload.provider,
      socialPayload.providerId,
      socialPayload.name || '',
    ]);

    logger.info(
      {
        userId,
        provider: socialPayload.provider,
        accountType,
      },
      'Created account via social signup completion.'
    );

    const user = created.rows[0];
    if (accountType === 'company') {
      await getOrCreateCompanyForUserId(pgClient, user.id);
    }
    const outcome = await issueSessionForUser({ user, req, res });
    clearSocialSignupSession(res);
    return res.status(outcome.statusCode).json(outcome);
  } catch (error) {
    logger.error({ err: error }, 'Social signup completion failed');
    return res.status(500).json({ success: false, message: 'Unable to complete social signup right now.' });
  } finally {
    if (pgClient) pgClient.release();
  }
};

const createOAuthStateSession = async (req, res) => {
  const provider = normalizeOAuthProvider(req.body?.provider);
  if (!provider) {
    return res.status(400).json({ success: false, message: 'Invalid OAuth provider.' });
  }

  const mode = normalizeOAuthMode(req.body?.mode);
  const accountTypeHint = normalizeAccountType(req.body?.accountTypeHint);
  const entries = readOAuthStateStore(req);
  const state = crypto.randomUUID();
  const expiresAt = Date.now() + OAUTH_STATE_TTL_MS;

  entries.push({
    state,
    provider,
    mode,
    accountTypeHint: mode === 'signup' ? accountTypeHint : null,
    expiresAt,
  });
  writeOAuthStateStore(res, entries);

  return res.status(201).json({
    success: true,
    state,
    expiresAt,
  });
};

const getSocialSignupSession = async (req, res) => {
  try {
    const session = readSocialSignupSession(req);
    return res.json({
      success: true,
      social: {
        email: session.email,
        name: session.name,
        provider: session.provider,
        accountTypeHint: session.accountTypeHint,
      },
    });
  } catch {
    clearSocialSignupSession(res);
    return res.status(404).json({
      success: false,
      code: 'SOCIAL_SIGNUP_SESSION_MISSING',
      message: 'Social signup session is missing or expired. Please start again.',
      error: 'Social signup session is missing or expired. Please start again.',
    });
  }
};

const googleLogin = async (req, res) => {
  const { credential, state } = req.body || {};
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google token missing' });
  }

  const stateCheck = consumeOAuthState({ req, res, provider: 'google', state });
  if (!stateCheck.ok) {
    return res.status(400).json({
      success: false,
      code: 'OAUTH_STATE_INVALID',
      message: 'Unable to verify sign-in request. Please try again.',
      error: 'Unable to verify sign-in request. Please try again.',
    });
  }
  const normalizedAccountTypeHint = stateCheck.mode === 'signup' ? stateCheck.accountTypeHint : null;

  if (!GOOGLE_CLIENT_ID && typeof credential === 'string' && credential.includes('mock-google-')) {
    try {
      assertLocalAuthBypassAllowed(req);
      logger.warn('GOOGLE_CLIENT_ID missing; using local auth bypass for Google login.');
      const mockEmail = credential.replace('mock-google-', '') + '@example.com';
      const outcome = await handleSocialLogin({
        email: mockEmail,
        name: 'Mock Google User',
        provider: 'google',
        providerId: 'mock-' + Date.now(),
        accountTypeHint: normalizedAccountTypeHint,
        oauthMode: stateCheck.mode,
        req,
        res,
      });
      return res.status(outcome.statusCode).json(outcome);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified && payload.email) {
      return res.status(400).json({ success: false, message: 'Google email is not verified.' });
    }
    if (!payload.email) {
      return res.status(400).json({ success: false, message: 'Google account email is unavailable.' });
    }

    const outcome = await handleSocialLogin({
      email: payload.email,
      name: payload.name,
      provider: 'google',
      providerId: payload.sub,
      accountTypeHint: normalizedAccountTypeHint,
      oauthMode: stateCheck.mode,
      req,
      res,
    });

    return res.status(outcome.statusCode).json(outcome);
  } catch (error) {
    logger.error({ err: error }, 'Google OAuth Verification Failed');
    return res.status(401).json({ success: false, message: 'Failed to authenticate with Google.' });
  }
};

const githubLogin = async (req, res) => {
  const { code, state } = req.body || {};
  if (!code) {
    return res.status(400).json({ success: false, message: 'GitHub code missing' });
  }

  const stateCheck = consumeOAuthState({ req, res, provider: 'github', state });
  if (!stateCheck.ok) {
    return res.status(400).json({
      success: false,
      code: 'OAUTH_STATE_INVALID',
      message: 'Unable to verify sign-in request. Please try again.',
      error: 'Unable to verify sign-in request. Please try again.',
    });
  }
  const normalizedAccountTypeHint = stateCheck.mode === 'signup' ? stateCheck.accountTypeHint : null;

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    if (String(code).includes('mock-github-')) {
      try {
        assertLocalAuthBypassAllowed(req);
        logger.warn('GITHUB_CLIENT_ID missing; using local auth bypass for GitHub login.');
        const mockEmail = String(code).replace('mock-github-', '') + '@example.com';
        const outcome = await handleSocialLogin({
          email: mockEmail,
          name: 'Mock GitHub User',
          provider: 'github',
          providerId: 'mock-gh-' + Date.now(),
          accountTypeHint: normalizedAccountTypeHint,
          oauthMode: stateCheck.mode,
          req,
          res,
        });
        return res.status(outcome.statusCode).json(outcome);
      } catch (error) {
        return res.status(403).json({ success: false, message: error.message });
      }
    }
    return res.status(500).json({ success: false, message: 'GitHub login is not fully configured.' });
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return res.status(401).json({ success: false, message: 'Invalid GitHub code.' });
    }

    const accessToken = tokenData.access_token;
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userResponse.json();

    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emails = await emailResponse.json();
    const primaryEmailObj = Array.isArray(emails) && emails.find((entry) => entry.primary && entry.verified);
    const email = primaryEmailObj ? primaryEmailObj.email : (Array.isArray(emails) ? emails[0]?.email : null);

    if (!email) {
      return res.status(400).json({ success: false, message: 'GitHub account does not have a verified email accessible.' });
    }

    const outcome = await handleSocialLogin({
      email,
      name: userData.name || userData.login,
      provider: 'github',
      providerId: String(userData.id),
      accountTypeHint: normalizedAccountTypeHint,
      oauthMode: stateCheck.mode,
      req,
      res,
    });

    return res.status(outcome.statusCode).json(outcome);
  } catch (error) {
    logger.error({ err: error }, 'GitHub OAuth Verification Failed');
    return res.status(401).json({ success: false, message: 'Failed to authenticate with GitHub.' });
  }
};

module.exports = {
  createOAuthStateSession,
  getSocialSignupSession,
  googleLogin,
  githubLogin,
  completeSocialSignup,
};
