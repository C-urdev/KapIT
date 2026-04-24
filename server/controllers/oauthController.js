const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/database');
const { logger } = require('../config/logger');
const { attachSessionCookies } = require('../services/authSessionService');
const { serializeUser } = require('../utils/authUserSerializer');
const { generateUsername } = require('../utils/usernameGenerator');
const { assertLocalAuthBypassAllowed } = require('../config/localBypass');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const normalizeAccountType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'company') return 'company';
  if (normalized === 'developer' || normalized === 'employee' || normalized === 'user') return 'developer';
  return null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const handleSocialLogin = async ({ email, name, provider, providerId, accountTypeHint, req, res }) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const normalizedAccountTypeHint = normalizeAccountType(accountTypeHint);
  let pgClient;

  try {
    if (!normalizedEmail) {
      return { success: false, statusCode: 400, message: 'Social account email is missing.' };
    }

    pgClient = await pool.connect();
    
    // Check if user exists
    let userResult = await pgClient.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    let user = userResult.rows[0];

    if (user) {
      // Link account if they already exist but don't have this provider
      const providerField = provider === 'google' ? 'google_id' : 'github_id';
      if (!user[providerField]) {
        const linked = await pgClient.query(
          `UPDATE users
           SET ${providerField} = $1, auth_provider = $2
           WHERE id = $3
           RETURNING *`,
          [providerId, provider, user.id]
        );
        user = linked.rows[0] || user;
      }
    } else {
      // Create new user silently (no password needed)
      // Account type can be hinted from the signup flow; otherwise default to developer.
      const id = crypto.randomUUID();
      const username = await generateUsername(name || normalizedEmail.split('@')[0], pgClient);
      const resolvedAccountType = normalizedAccountTypeHint || 'developer';
      const resolvedUserType = resolvedAccountType === 'company' ? 'company' : 'employee';

      const providerField = provider === 'google' ? 'google_id' : 'github_id';
      
      const insertQuery = `
        INSERT INTO users (id, username, email, user_type, account_type, auth_provider, ${providerField}, name, profile_completed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
        RETURNING *
      `;
      const result = await pgClient.query(insertQuery, [
        id, username, normalizedEmail, resolvedUserType, resolvedAccountType, provider, providerId, name || ''
      ]);
      user = result.rows[0];
      logger.info({ userId: user.id, provider }, 'New user created via social login');
    }

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
  } finally {
    if (pgClient) pgClient.release();
  }
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

const googleLogin = async (req, res) => {
  const { credential, accountTypeHint } = req.body || {};
  const normalizedAccountTypeHint = normalizeAccountType(accountTypeHint);
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google token missing' });
  }

  // Developer bypass allowing local testing without real API keys
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
      req,
      res,
    });

    return res.status(outcome.statusCode).json(outcome);
  } catch (error) {
    logger.error({ err: error }, 'Google OAuth Verification Failed');
    return res.status(401).json({ success: false, message: 'Failed to authenticate with Google.' });
  }
};

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────

const githubLogin = async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ success: false, message: 'GitHub code missing' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    if (code.includes('mock-github-')) {
      try {
        assertLocalAuthBypassAllowed(req);
        logger.warn('GITHUB_CLIENT_ID missing; using local auth bypass for GitHub login.');
        const mockEmail = code.replace('mock-github-', '') + '@example.com';
        const outcome = await handleSocialLogin({
          email: mockEmail,
          name: 'Mock GitHub User',
          provider: 'github',
          providerId: 'mock-gh-' + Date.now(),
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
    // Exchange code for access token
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

    // Fetch GitHub user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userResponse.json();

    // Fetch GitHub emails (since email might be hidden)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emails = await emailResponse.json();
    
    // Find primary email
    const primaryEmailObj = Array.isArray(emails) && emails.find(e => e.primary && e.verified);
    const email = primaryEmailObj ? primaryEmailObj.email : (Array.isArray(emails) ? emails[0]?.email : null);

    if (!email) {
      return res.status(400).json({ success: false, message: 'GitHub account does not have a verified email accessible.' });
    }

    const outcome = await handleSocialLogin({
      email,
      name: userData.name || userData.login,
      provider: 'github',
      providerId: String(userData.id),
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
  googleLogin,
  githubLogin,
};

