const { logger } = require('../config/logger');
const { fetchJobMatches } = require('../services/matchJobService');

const matchJobs = async (req, res) => {
  try {
    const payload = req.body || {};
    const matches = await fetchJobMatches({
      skills: payload.skills,
      experience: payload.experience,
    });

    return res.json({
      success: true,
      matches,
    });
  } catch (error) {
    logger.error({ err: error }, 'Match jobs error');

    const statusCode = Number(error?.statusCode || 500);
    const message = statusCode >= 500 ? 'Unable to match jobs right now.' : String(error?.message || 'Unable to match jobs right now.');

    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
};

module.exports = {
  matchJobs,
};
