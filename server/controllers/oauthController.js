const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/database');
const { logger } = require('../config/logger');
const { generateSessionTokens, storeSession } = require('../services/authSessionService');
const { generateUsername } = require('../utils/usernameGenerator');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const handleSocialLogin = async ({ email, name, provider, providerId, ipAddress, userAgent }) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  let pgClient;

  try {
    pgClient = await pool.connect();
    
    // Check if user exists
    let userResult = await pgClient.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    let user = userResult.rows[0];

    if (user) {
      // Link account if they already exist but don't have this provider
      const providerField = provider === 'google' ? 'google_id' : 'github_id';
      if (!user[providerField]) {
        await pgClient.query(`UPDATE users SET ${providerField} = $1, auth_provider = $2 WHERE id = $3`, 
          [providerId, provider, user.id]);
      }
    } else {
      // Create new user silently (no password needed)
      // We set default account type to developer, they will be sent to complete profile
      const id = crypto.randomUUID();
      const username = await generateUsername(name || normalizedEmail.split('@')[0], pgClient);
      
      const providerField = provider === 'google' ? 'google_id' : 'github_id';
      
      const insertQuery = `
        INSERT INTO users (id, username, email, user_type, account_type, auth_provider, ${providerField}, name, profile_completed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
        RETURNING *
      `;
      const result = await pgClient.query(insertQuery, [
        id, username, normalizedEmail, 'employee', 'developer', provider, providerId, name || ''
      ]);
      user = result.rows[0];
      logger.info({ userId: user.id, provider }, 'New user created via social login');
    }

    // Always generate login session identical to normal login
    const tokens = generateSessionTokens({
      userId: user.id,
      userType: user.user_type,
      accountType: user.account_type,
      profileCompleted: user.profile_completed,
      email: user.email,
    });

    await storeSession(user.id, tokens.refreshToken, {
      userAgent,
      ipAddress,
      deviceContext: provider + ' Auth',
    });

    return {
      success: true,
      statusCode: 200,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        account_type: user.account_type,
        profile_completed: user.profile_completed,
        profileCompleted: user.profile_completed,
        is_premium: user.is_premium,
        termsAccepted: Boolean(user.terms_accepted),
        termsAcceptedAt: user.terms_accepted_at ? new Date(user.terms_accepted_at).toISOString() : null,
      },
      ...tokens,
    };
  } finally {
    if (pgClient) pgClient.release();
  }
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

const googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google token missing' });
  }

  // Developer bypass allowing local testing without real API keys
  if (!GOOGLE_CLIENT_ID && process.env.NODE_ENV !== 'production') {
    logger.warn('GOOGLE_CLIENT_ID missing; using Developer Mock for Google Login.');
    // Simulated credential data sent from frontend bypass
    if (typeof credential === 'string' && credential.includes('mock-google-')) {
      const mockEmail = credential.replace('mock-google-', '') + '@example.com';
      const outcome = await handleSocialLogin({
        email: mockEmail,
        name: 'Mock Google User',
        provider: 'google',
        providerId: 'mock-' + Date.now(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
      });
      return res.status(outcome.statusCode).json(outcome);
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

    const outcome = await handleSocialLogin({
      email: payload.email,
      name: payload.name,
      provider: 'google',
      providerId: payload.sub,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || '',
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
    // Developer bypass allowing local testing without real API keys
    if (process.env.NODE_ENV !== 'production' && code.includes('mock-github-')) {
      logger.warn('GITHUB_CLIENT_ID missing; using Developer Mock for GitHub Login.');
      const mockEmail = code.replace('mock-github-', '') + '@example.com';
      const outcome = await handleSocialLogin({
        email: mockEmail,
        name: 'Mock GitHub User',
        provider: 'github',
        providerId: 'mock-gh-' + Date.now(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
      });
      return res.status(outcome.statusCode).json(outcome);
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
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || '',
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
