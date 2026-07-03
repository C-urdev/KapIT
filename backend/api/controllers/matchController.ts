// @ts-nocheck
const { logger } = require('../config/logger');
const pool = require('../config/database');
const { ensureBaseUserSchemaReady, ensureOnboardingSchemaReady } = require('../config/runtimeSchema');
const { fetchJobMatches } = require('../services/matchJobService');

const normalizeSkills = (skills) => (
  Array.from(
    new Set(
      (Array.isArray(skills) ? skills : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 80)
    )
  )
);

const matchJobs = async (req, res) => {
  let client;
  try {
    const payload = req.body || {};
    let profile = {};
    try {
      await ensureBaseUserSchemaReady();
      await ensureOnboardingSchemaReady();
      client = await pool.connect();
      const profileResult = await client.query(
        `SELECT u.id,
                u.account_type,
                COALESCE(dp.full_name, u.name, u.username) AS full_name,
                COALESCE(dp.preferred_it_role, u.desired_job, dp.job_title, '') AS preferred_role,
                COALESCE(dp.job_title, '') AS job_title,
                COALESCE(dp.bio, u.bio, '') AS bio,
                COALESCE(dp.education, u.education, '') AS education,
                COALESCE(dp.certifications, '') AS certifications,
                COALESCE(dp.skills, ARRAY[]::text[]) AS skills,
                COALESCE(dp.location, u.address, '') AS location,
                COALESCE(dp.work_preference, '') AS work_preference,
                COALESCE(dp.experience_years, 0) AS experience_years
         FROM users u
         LEFT JOIN developer_profiles dp ON dp.user_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [req.user.id]
      );
      profile = profileResult.rows[0] || {};
    } catch (profileError) {
      logger.warn({ err: profileError }, 'Match jobs profile enrichment unavailable; using request payload only.');
    }
    const requestSkills = normalizeSkills(payload.skills);
    const profileSkills = normalizeSkills(profile.skills);
    const mergedSkills = Array.from(new Set([...profileSkills, ...requestSkills])).slice(0, 80);
    const resumeText = [
      String(payload.resumeText || '').trim(),
      String(profile.bio || '').trim(),
      String(profile.education || '').trim(),
      String(profile.certifications || '').trim(),
    ]
      .filter(Boolean)
      .join('\n');

    const matches = await fetchJobMatches({
      userId: req.user.id,
      skills: mergedSkills,
      experience: payload.experience,
      candidate: {
        id: profile.id || req.user.id,
        accountType: profile.account_type || '',
        fullName: profile.full_name || '',
        preferredRole: String(payload.desiredRole || '').trim() || profile.preferred_role || profile.job_title || '',
        bio: String(payload.summary || '').trim() || profile.bio || '',
        resumeText,
        skills: mergedSkills,
        location: profile.location || '',
        workPreference: profile.work_preference || '',
        yearsOfExperience: Number(profile.experience_years || 0),
        certifications: String(payload.certifications || '').trim() || profile.certifications || '',
        education: String(payload.education || '').trim() || profile.education || '',
        projects: Array.isArray(payload.projects) ? payload.projects : [],
        preferredCategories: Array.isArray(payload.preferredCategories) ? payload.preferredCategories : [],
        techStack: Array.isArray(payload.techStack) ? payload.techStack : [],
      },
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
  } finally {
    client?.release();
  }
};

module.exports = {
  matchJobs,
};
