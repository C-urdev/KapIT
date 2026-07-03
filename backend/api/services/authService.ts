const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { isDatabaseConnectivityError, summarizeDatabaseConnectivityError } = require('../config/database');
const { logger } = require('../config/logger');
const { canSendEmail, sendPasswordResetEmail, sendOtpEmail } = require('./emailService');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 15);
const CLEANUP_INTERVAL_MS = Number(process.env.PASSWORD_RESET_CLEANUP_INTERVAL_MS || 5 * 60 * 1000);
const CLEANUP_DB_WARN_COOLDOWN_MS = Number(process.env.PASSWORD_RESET_CLEANUP_DB_WARN_COOLDOWN_MS || 30000);
let lastCleanupDbWarningAt = 0;
const getOtpJwtSecretOrThrow = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('Missing JWT_SECRET');
  }
  return secret;
};

const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'If an account with that email exists, a password reset link has been sent.';
const RESET_PASSWORD_SUCCESS_MESSAGE = 'Password has been reset successfully. You can now log in.';
const RESET_PASSWORD_INVALID_MESSAGE = 'Invalid or expired password reset token.';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const EMAIL_NOT_CONFIGURED_MESSAGE =
  'Email service is not configured. Set EMAIL_FROM and RESEND_API_KEY in .env.local.';

const hashToken = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');
const digestForLogs = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

const resolveResetPasswordBaseUrl = () => {
  const configured = String(process.env.PASSWORD_RESET_URL_BASE || '').trim();
  const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  const fallback = 'https://yourdomain.com/reset-password';
  const siteDerived = siteUrl ? `${siteUrl.replace(/\/+$/, '')}/reset-password` : '';
  const rawUrl = configured || siteDerived || fallback;
  const parsed = new URL(rawUrl);
  parsed.protocol = 'https:';
  return parsed;
};

const buildPasswordResetLink = (rawToken) => {
  const url = resolveResetPasswordBaseUrl();
  url.searchParams.set('token', rawToken);
  return url.toString();
};

const issuePasswordResetToken = async ({ email, ipAddress, userAgent }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
  }

  let client;
  try {
    client = await pool.connect();
    const userResult = await client.query(
      `SELECT id, email
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    if (!userResult.rows.length) {
      logger.info(
        {
          emailDigest: digestForLogs(normalizedEmail),
          ipAddress: String(ipAddress || ''),
          outcome: 'user_not_found',
        },
        'Password reset requested.'
      );
      return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
    }

    const user = userResult.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const metadata = JSON.stringify({
      requestIp: String(ipAddress || ''),
      requestUserAgent: String(userAgent || ''),
      issuedAt: new Date().toISOString(),
    });

    await client.query('BEGIN');
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
    await client.query(
      `INSERT INTO password_reset_tokens (
         id,
         user_id,
         email,
         token_hash,
         status,
         requested_at,
         expires_at,
         metadata
       )
       VALUES (
         gen_random_uuid(),
         $1,
         $2,
         $3,
         'pending',
         NOW(),
         NOW() + ($4 * INTERVAL '1 minute'),
         $5::jsonb
       )`,
      [user.id, user.email, tokenHash, RESET_TOKEN_TTL_MINUTES, metadata]
    );
    await client.query('COMMIT');

    const resetLink = buildPasswordResetLink(rawToken);
    const emailDelivery = await sendPasswordResetEmail({
      to: user.email,
      resetLink,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    });

    logger.info(
      {
        userId: user.id,
        emailDigest: digestForLogs(user.email),
        ipAddress: String(ipAddress || ''),
        delivered: Boolean(emailDelivery?.delivered),
        skipped: Boolean(emailDelivery?.skipped),
      },
      'Password reset token issued.'
    );
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => null);
    }
    logger.error({ err: error }, 'Failed to issue password reset token.');
  } finally {
    if (client) {
      client.release();
    }
  }

  return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
};

const resetPasswordWithToken = async ({ token, newPassword, ipAddress, userAgent }) => {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) {
    return {
      success: false,
      statusCode: 400,
      message: RESET_PASSWORD_INVALID_MESSAGE,
    };
  }

  const tokenHash = hashToken(normalizedToken);
  let client;
  try {
    client = await pool.connect();
    const tokenResult = await client.query(
      `SELECT user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND status = 'pending'
         AND expires_at > NOW()
       ORDER BY requested_at DESC
       LIMIT 1`,
      [tokenHash]
    );

    if (!tokenResult.rows.length) {
      logger.warn(
        {
          tokenDigest: tokenHash,
          ipAddress: String(ipAddress || ''),
          outcome: 'invalid_or_expired',
        },
        'Password reset denied.'
      );
      return {
        success: false,
        statusCode: 400,
        message: RESET_PASSWORD_INVALID_MESSAGE,
      };
    }

    const userId = tokenResult.rows[0].user_id;
    const hashedPassword = await bcrypt.hash(String(newPassword || ''), SALT_ROUNDS);

    await client.query('BEGIN');
    await client.query(
      `UPDATE users
       SET password = $1
       WHERE id = $2`,
      [hashedPassword, userId]
    );
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    await client.query('COMMIT');

    logger.info(
      {
        userId,
        ipAddress: String(ipAddress || ''),
        hasUserAgent: Boolean(String(userAgent || '').trim()),
      },
      'Password reset succeeded.'
    );

    return {
      success: true,
      statusCode: 200,
      message: RESET_PASSWORD_SUCCESS_MESSAGE,
    };
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => null);
    }
    logger.error({ err: error }, 'Password reset failed.');
    return {
      success: false,
      statusCode: 500,
      message: 'Unable to reset password right now.',
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};

const cleanupExpiredPasswordResetTokens = async () => {
  const result = await pool.query(
    `DELETE FROM password_reset_tokens
     WHERE expires_at <= NOW()`
  );
  return Number(result.rowCount || 0);
};

const startPasswordResetCleanupJob = () => {
  if (!Number.isFinite(CLEANUP_INTERVAL_MS) || CLEANUP_INTERVAL_MS <= 0) {
    logger.warn('Password reset cleanup job disabled (invalid interval).');
    return () => {};
  }

  const runCleanup = async () => {
    try {
      const deletedCount = await cleanupExpiredPasswordResetTokens();
      if (deletedCount > 0) {
        logger.info({ deletedCount }, 'Deleted expired password reset tokens.');
      }
    } catch (error) {
      if (isDatabaseConnectivityError(error)) {
        const current = Date.now();
        if (current - lastCleanupDbWarningAt >= CLEANUP_DB_WARN_COOLDOWN_MS) {
          lastCleanupDbWarningAt = current;
          logger.warn(
            { reason: summarizeDatabaseConnectivityError(error) },
            'Password reset cleanup skipped because the database is temporarily unavailable.'
          );
        }
        return;
      }
      logger.error({ err: error }, 'Password reset token cleanup failed.');
    }
  };

  const timer = setInterval(() => {
    void runCleanup();
  }, CLEANUP_INTERVAL_MS);
  timer.unref?.();

  void runCleanup();

  return () => clearInterval(timer);
};

// â”€â”€â”€ OTP Flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_GENERIC_MESSAGE = 'If an account with that email exists, a verification code has been sent.';

const ensureOtpTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS password_reset_otps (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email        TEXT NOT NULL,
      code_hash    TEXT NOT NULL,
      expires_at   TIMESTAMPTZ NOT NULL,
      used         BOOLEAN NOT NULL DEFAULT false,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_prot_email ON password_reset_otps (email)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS registration_otps (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email        TEXT NOT NULL,
      code_hash    TEXT NOT NULL,
      expires_at   TIMESTAMPTZ NOT NULL,
      used         BOOLEAN NOT NULL DEFAULT false,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_regot_email ON registration_otps (email)
  `);
};

const issueOtp = async ({ email, ipAddress }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { success: false, statusCode: 400, message: 'Please provide a valid email address.' };
  }

  if (!canSendEmail()) {
    logger.warn({ ipAddress: String(ipAddress || '') }, 'OTP email request rejected because email provider is not configured.');
    return { success: false, statusCode: 503, message: EMAIL_NOT_CONFIGURED_MESSAGE };
  }

  let client;
  try {
    client = await pool.connect();
    await ensureOtpTable(client);

    const userResult = await client.query(
      `SELECT id, email FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );
    if (!userResult.rows.length) {
      logger.info({ emailDigest: digestForLogs(normalizedEmail), ipAddress }, 'OTP requested for unknown email.');
      return { success: false, statusCode: 404, message: 'No account found with this email address.' };
    }

    // Generate 6-digit code
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);

    await client.query(`DELETE FROM password_reset_otps WHERE email = $1`, [normalizedEmail]);
    await client.query(
      `INSERT INTO password_reset_otps (email, code_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))`,
      [normalizedEmail, codeHash, OTP_TTL_MINUTES]
    );

    const emailDelivery = await sendOtpEmail({
      to: userResult.rows[0].email,
      code,
      expiresInMinutes: OTP_TTL_MINUTES,
    });

    // Intentionally avoid logging OTP values or issuance metadata to stdout.
  } catch (error) {
    logger.error({ err: error }, 'Failed to issue OTP.');
  } finally {
    if (client) client.release();
  }

  return { success: true, statusCode: 200, message: OTP_GENERIC_MESSAGE };
};

const verifyOtp = async ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);
  const INVALID = { success: false, statusCode: 400, message: 'Invalid or expired verification code.' };

  if (!normalizedEmail || !code) return INVALID;

  let client;
  try {
    client = await pool.connect();
    await ensureOtpTable(client);

    const result = await client.query(
      `SELECT id, code_hash, expires_at, used
       FROM password_reset_otps
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedEmail]
    );

    if (!result.rows.length) return INVALID;

    const row = result.rows[0];
    if (row.used) return INVALID;
    if (new Date(row.expires_at) < new Date()) return { success: false, statusCode: 400, message: 'Verification code has expired. Please request a new one.' };

    const codeMatch = await bcrypt.compare(String(code || ''), row.code_hash);
    if (!codeMatch) return INVALID;

    // Mark as used
    await client.query(`UPDATE password_reset_otps SET used = true WHERE id = $1`, [row.id]);

    // Issue short-lived reset token (15 min)
    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: 'otp-password-reset' },
      getOtpJwtSecretOrThrow(),
      { expiresIn: '15m' }
    );

    return { success: true, statusCode: 200, resetToken };
  } catch (error) {
    logger.error({ err: error }, 'OTP verification failed.');
    return { success: false, statusCode: 500, message: 'Unable to verify code right now.' };
  } finally {
    if (client) client.release();
  }
};

const resetPasswordWithOtp = async ({ resetToken, newPassword, ipAddress }) => {
  const INVALID = { success: false, statusCode: 400, message: 'Invalid or expired session. Please restart the password reset process.' };

  if (!resetToken || !newPassword) return INVALID;

  let payload;
  try {
    payload = jwt.verify(String(resetToken || '').trim(), getOtpJwtSecretOrThrow());
  } catch {
    return INVALID;
  }

  if (payload?.purpose !== 'otp-password-reset' || !payload?.email) return INVALID;

  const normalizedEmail = normalizeEmail(payload.email);

  let client;
  try {
    client = await pool.connect();
    const userResult = await client.query(
      `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );
    if (!userResult.rows.length) return INVALID;

    const hashedPassword = await bcrypt.hash(String(newPassword || ''), SALT_ROUNDS);
    await client.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedPassword, userResult.rows[0].id]);
    // Clean up OTP rows for this email
    await client.query(`DELETE FROM password_reset_otps WHERE email = $1`, [normalizedEmail]);

    return { success: true, statusCode: 200, message: 'Password has been reset successfully. You can now sign in.' };
  } catch (error) {
    logger.error({ err: error }, 'OTP password reset failed.');
    return { success: false, statusCode: 500, message: 'Unable to reset password right now.' };
  } finally {
    if (client) client.release();
  }
};

// â”€â”€â”€ Registration OTP Flow â”€â”€â”€

const issueRegistrationOtp = async ({ email, ipAddress }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { success: false, statusCode: 400, message: 'Invalid email address provided.' };
  }

  if (!canSendEmail()) {
    logger.warn(
      { emailDigest: digestForLogs(normalizedEmail), ipAddress: String(ipAddress || '') },
      'Registration OTP request rejected because email provider is not configured.'
    );
    return { success: false, statusCode: 503, message: EMAIL_NOT_CONFIGURED_MESSAGE };
  }

  let client;
  try {
    client = await pool.connect();
    await ensureOtpTable(client);

    const checkResult = await client.query('SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalizedEmail]);
    if (checkResult.rowCount > 0) {
      return { success: false, statusCode: 409, message: 'An account with this email already exists.' };
    }

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);

    await client.query(`DELETE FROM registration_otps WHERE email = $1`, [normalizedEmail]);
    await client.query(
      `INSERT INTO registration_otps (email, code_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))`,
      [normalizedEmail, codeHash, OTP_TTL_MINUTES]
    );

    const emailDelivery = await sendOtpEmail({
      to: normalizedEmail,
      code,
      expiresInMinutes: OTP_TTL_MINUTES,
    });

    // Intentionally avoid logging registration OTP values or issuance metadata to stdout.
    return { success: true, statusCode: 200, message: 'Verification code sent.' };
  } catch (error) {
    logger.error({ err: error }, 'Failed to issue Registration OTP.');
    return { success: false, statusCode: 500, message: 'Failed to issue code right now.' };
  } finally {
    if (client) client.release();
  }
};

const verifyRegistrationOtp = async ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);
  const INVALID = { success: false, statusCode: 400, message: 'Invalid or expired verification code.' };

  if (!normalizedEmail || !code) return INVALID;

  let client;
  try {
    client = await pool.connect();
    await ensureOtpTable(client);

    const result = await client.query(
      `SELECT id, code_hash, expires_at, used
       FROM registration_otps
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedEmail]
    );

    if (!result.rows.length) return INVALID;

    const row = result.rows[0];
    if (row.used) return INVALID;
    if (new Date(row.expires_at) < new Date()) return { success: false, statusCode: 400, message: 'Verification code has expired. Please request a new one.' };

    const codeMatch = await bcrypt.compare(String(code || ''), row.code_hash);
    if (!codeMatch) return INVALID;

    // Issue short-lived validation token to be passed onto standard registration route
    const verificationToken = jwt.sign(
      { email: normalizedEmail, purpose: 'registration-validated' },
      getOtpJwtSecretOrThrow(),
      { expiresIn: '15m' }
    );

    // Mark as used
    await client.query(`UPDATE registration_otps SET used = true WHERE id = $1`, [row.id]);

    return { success: true, statusCode: 200, verificationToken };
  } catch (error) {
    logger.error({ err: error }, 'Registration OTP verification failed.');
    return { success: false, statusCode: 500, message: 'Unable to verify registration code.' };
  } finally {
    if (client) client.release();
  }
};

const issueLocalPasswordResetBypassToken = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { success: false, statusCode: 400, message: 'Invalid email address provided.' };
  }

  let client;
  try {
    client = await pool.connect();
    const userResult = await client.query(
      `SELECT id
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    if (!userResult.rows.length) {
      return { success: false, statusCode: 404, message: 'No account found for this email.' };
    }

    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: 'otp-password-reset' },
      getOtpJwtSecretOrThrow(),
      { expiresIn: '15m' }
    );

    return { success: true, statusCode: 200, resetToken };
  } catch (error) {
    logger.error({ err: error }, 'Failed to issue localhost password reset bypass token.');
    return { success: false, statusCode: 500, message: 'Unable to create bypass token right now.' };
  } finally {
    if (client) client.release();
  }
};

const issueLocalRegistrationBypassToken = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { success: false, statusCode: 400, message: 'Invalid email address provided.' };
  }

  let client;
  try {
    client = await pool.connect();
    await ensureOtpTable(client);

    const checkResult = await client.query('SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalizedEmail]);
    if (checkResult.rowCount > 0) {
      return { success: false, statusCode: 409, message: 'An account with this email already exists.' };
    }

    const verificationToken = jwt.sign(
      { email: normalizedEmail, purpose: 'registration-validated' },
      getOtpJwtSecretOrThrow(),
      { expiresIn: '15m' }
    );

    return { success: true, statusCode: 200, verificationToken };
  } catch (error) {
    logger.error({ err: error }, 'Failed to issue localhost registration bypass token.');
    return { success: false, statusCode: 500, message: 'Unable to create bypass token right now.' };
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  issuePasswordResetToken,
  resetPasswordWithToken,
  cleanupExpiredPasswordResetTokens,
  startPasswordResetCleanupJob,
  issueOtp,
  verifyOtp,
  resetPasswordWithOtp,
  issueRegistrationOtp,
  verifyRegistrationOtp,
  issueLocalRegistrationBypassToken,
  issueLocalPasswordResetBypassToken,
};
