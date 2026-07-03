const pool = require('../config/database');
const { logger } = require('../config/logger');
const { serializeUser } = require('../utils/authUserSerializer');

const isDev = process.env.NODE_ENV !== 'production';
const buildDevErrorMeta = (error) => (
  isDev
    ? {
        errorDetail: error?.message || String(error),
        errorCode: error?.code || '',
      }
    : {}
);

// @desc    Accept terms and conditions for current user
// @route   PATCH /api/auth/terms-consent
// @access  Private
const acceptTermsConsent = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const { agreed } = req.body || {};

    if (agreed !== true) {
      return res.status(400).json({
        success: false,
        message: 'Terms consent requires agreed=true.',
      });
    }

    const result = await client.query(
      `UPDATE users
       SET terms_accepted = true,
           terms_accepted_at = COALESCE(terms_accepted_at, CURRENT_TIMESTAMP)
       WHERE id = $1
       RETURNING *`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user: serializeUser(result.rows[0]),
    });
  } catch (error) {
    logger.error('Accept terms consent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while saving terms consent',
      ...buildDevErrorMeta(error),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  acceptTermsConsent,
};
