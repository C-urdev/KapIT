const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { createNotification, ensureNotificationsTable } = require('./notificationsController');
const { ensureBaseUserSchemaReady, ensureHiringSchemaReady, ensureOnboardingSchemaReady } = require('../config/runtimeSchema');
const { withJobAvailability, closeExpiredJobs } = require('../services/jobAvailabilityService');
const { getPremiumStateForUser, requirePremiumApplicantFeature } = require('../services/planAccessService');
const { isAiConfigured, matchJobsForCandidate } = require('../services/aiService');
const { appendSearchScopeFilterClause } = require('../services/accountSearchService');
const { logger } = require('../config/logger');
const { normalizeSocialsText } = require('../utils/socials');
const {
  CURRENT_MATCH_SCORING_VERSION,
  createProfileMatchSignature,
  createJobMatchSignature,
  isMatchCacheValid,
} = require('../utils/matchSignatures');
const {
  attachSessionCookies,
  clearSessionCookies,
  verifyRefreshTokenSession,
  revokeSessionById,
  revokeSessionByToken,
} = require('../services/authSessionService');
const { serializeUser } = require('../utils/authUserSerializer');
const { clearLoginRateLimit } = require('../middleware/security');
const { assertLocalAuthBypassAllowed } = require('../config/localBypass');
const { getOrCreateCompanyForUserId } = require('../services/companyService');
const isDev = process.env.NODE_ENV !== 'production';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const PASSWORD_HASHER = process.env.PASSWORD_HASHER || 'bcrypt';
const BCRYPT_HASH_PREFIX = /^\$2[aby]\$\d{2}\$/;
const DUMMY_BCRYPT_HASH =
  '$2b$12$0mNfQ9Y2r6wN.9J7R1v8VekA7u8Qq7Zy5M7xQm4W8Jw3xN6T7pXlK';
const FREE_JOB_FEED_DELAY_HOURS = Math.max(0, Number(process.env.FREE_JOB_FEED_DELAY_HOURS || 6));
const FREE_JOB_FEED_DELAY_MS = FREE_JOB_FEED_DELAY_HOURS * 60 * 60 * 1000;
const getJwtSecretOrThrow = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('Missing JWT_SECRET');
  }
  return secret;
};
const buildDevErrorMeta = (error) => (
  isDev
    ? {
        errorDetail: error?.message || String(error),
        errorCode: error?.code || '',
      }
    : {}
);
const PRIVILEGED_EMAIL_VIEW_ROLES = new Set(['admin', 'superadmin', 'support', 'security']);

const canViewUserEmail = ({ viewer, targetUserId }) => {
  const viewerId = String(viewer?.id || '').trim();
  const normalizedTargetId = String(targetUserId || '').trim();
  if (viewerId && normalizedTargetId && viewerId === normalizedTargetId) {
    return true;
  }

  const role = String(viewer?.role || viewer?.userType || viewer?.accountType || '').trim().toLowerCase();
  return PRIVILEGED_EMAIL_VIEW_ROLES.has(role);
};

const normalizeAccountType = (raw) => {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'developer' || value === 'company') {
    return value;
  }
  return '';
};

const deriveAccountTypeAndUserType = ({ accountType, userType }) => {
  const normalizedAccountType = normalizeAccountType(accountType);
  const normalizedUserType = String(userType || '').trim().toLowerCase();

  if (normalizedAccountType === 'developer') {
    return { accountType: 'developer', userType: 'employee' };
  }
  if (normalizedAccountType === 'company') {
    return { accountType: 'company', userType: 'company' };
  }
  if (normalizedUserType === 'employee') {
    return { accountType: 'developer', userType: 'employee' };
  }
  if (normalizedUserType === 'company') {
    return { accountType: 'company', userType: 'company' };
  }
  return { accountType: '', userType: '' };
};

const serializeSavedJobRow = (row) => ({
  id: row.job_id,
  title: row.title || 'Untitled job',
  description: row.description || '',
  salary: row.salary || '',
  location: row.location || '',
  type: row.type || '',
  skills: Array.isArray(row.skills) ? row.skills : [],
  status: row.status || 'open',
  createdAt: row.job_created_at || row.created_at,
  savedAt: row.saved_at || row.created_at,
  company: {
    name: row.company_name || 'Company',
    logo: row.company_logo || '',
  },
});

const normalizeJobFeedFilters = (query = {}) => {
  const keyword = String(query.q || '').trim();
  const location = String(query.location || '').trim();
  const rawJobType = String(query.jobType || query.type || '').trim();
  const rawWorkPreference = String(query.workPreference || '').trim().toLowerCase();
  const skill = String(query.skill || '').trim();
  const rawSalaryCurrency = String(query.salaryCurrency || '').trim().toUpperCase();
  const salaryRange = String(query.salaryRange || '').trim();
  const rawExperienceLevel = String(query.experienceLevel || '').trim().toLowerCase();
  const allowedJobTypes = new Set(['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']);
  const allowedWorkPreferences = new Set(['fully-remote', 'asynchronous-remote', 'on-site']);
  const allowedExperienceLevels = new Set(['intern', 'junior', 'mid', 'senior']);
  const allowedSalaryCurrencies = new Set(['PHP', 'USD', 'EUR']);

  return {
    keyword,
    location,
    jobType: allowedJobTypes.has(rawJobType) ? rawJobType : '',
    workPreference: allowedWorkPreferences.has(rawWorkPreference) ? rawWorkPreference : '',
    skill,
    salaryCurrency: allowedSalaryCurrencies.has(rawSalaryCurrency) ? rawSalaryCurrency : '',
    salaryRange,
    experienceLevel: allowedExperienceLevels.has(rawExperienceLevel) ? rawExperienceLevel : '',
  };
};

const isJobVisibleForPlan = (job, plan) => {
  if (plan?.isPremium || FREE_JOB_FEED_DELAY_MS <= 0) {
    return true;
  }

  const postedAtMs = new Date(job?.createdAt || '').getTime();
  if (!Number.isFinite(postedAtMs)) {
    return true;
  }

  return (Date.now() - postedAtMs) >= FREE_JOB_FEED_DELAY_MS;
};

const createJobMatchScoreMetadata = ({ match, profileSignature, jobSignature }) => ({
  matchedSkills: match?.matched_skills || [],
  missingSkills: match?.missing_skills || [],
  strengths: match?.strengths || [],
  concerns: match?.concerns || [],
  keywordOverlap: match?.keyword_overlap || [],
  fitLabel: String(match?.fit_label || ''),
  confidenceScore: Number(match?.confidence_score || 0),
  confidenceLabel: String(match?.confidence_label || ''),
  roleRelevance: Number(match?.role_relevance || 0),
  reasoningSummary: String(match?.reasoning_summary || ''),
  matchSource: String(match?.source || 'ai'),
  insufficientData: Boolean(match?.insufficient_data),
  profileSignature: String(profileSignature || ''),
  jobSignature: String(jobSignature || ''),
  scoringVersion: CURRENT_MATCH_SCORING_VERSION,
});

const upsertJobMatchScores = async (client, { userId, rows }) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  await client.query(
    `INSERT INTO job_match_scores (
       user_id,
       job_id,
       match_percentage,
       ats_score,
       metadata,
       updated_at
     )
     SELECT
       $1::uuid,
       payload.job_id,
       payload.match_percentage,
       payload.ats_score,
       payload.metadata,
       CURRENT_TIMESTAMP
     FROM jsonb_to_recordset($2::jsonb) AS payload(
       job_id bigint,
       match_percentage integer,
       ats_score integer,
       metadata jsonb
     )
     ON CONFLICT (user_id, job_id) DO UPDATE SET
       match_percentage = EXCLUDED.match_percentage,
       ats_score = EXCLUDED.ats_score,
       metadata = EXCLUDED.metadata,
       updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      JSON.stringify(rows),
    ]
  );
};

const loadCachedJobMatchScores = async (client, { userId, jobs, profileSignature }) => {
  const normalizedJobs = Array.isArray(jobs)
    ? jobs.filter((job) => Number.isInteger(Number(job?.id)) && Number(job.id) > 0)
    : [];
  const normalizedJobIds = normalizedJobs.map((job) => Number(job.id));

  if (!normalizedJobIds.length) {
    return new Map();
  }

  const result = await client.query(
    `SELECT job_id,
            match_percentage,
            ats_score,
            metadata
     FROM job_match_scores
     WHERE user_id = $1
       AND job_id = ANY($2::bigint[])`,
    [userId, normalizedJobIds]
  );

  const map = new Map();
  const jobById = new Map(normalizedJobs.map((job) => [Number(job.id), job]));
  for (const row of result.rows) {
    const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
    const jobForRow = jobById.get(Number(row.job_id));
    const expectedJobSignature = createJobMatchSignature(jobForRow);
    if (!isMatchCacheValid({ metadata, profileSignature, jobSignature: expectedJobSignature })) {
      continue;
    }

    map.set(Number(row.job_id), {
      matchPercentage: Number(row.match_percentage || 0),
      atsScore: Number(row.ats_score || 0),
      matchConfidenceScore: Number(metadata.confidenceScore || 0),
      matchConfidenceLabel: String(metadata.confidenceLabel || ''),
      matchFitLabel: String(metadata.fitLabel || ''),
      matchSource: String(metadata.matchSource || 'ai'),
      matchReasoningSummary: String(metadata.reasoningSummary || ''),
      matchRoleRelevance: Number(metadata.roleRelevance || 0),
      matchInsufficientData: Boolean(metadata.insufficientData),
      matchDetails: {
        matchedSkills: Array.isArray(metadata.matchedSkills) ? metadata.matchedSkills : [],
        missingSkills: Array.isArray(metadata.missingSkills) ? metadata.missingSkills : [],
        strengths: Array.isArray(metadata.strengths) ? metadata.strengths : [],
        concerns: Array.isArray(metadata.concerns) ? metadata.concerns : [],
        roleRelevance: Number(metadata.roleRelevance || 0),
        keywordOverlap: Array.isArray(metadata.keywordOverlap) ? metadata.keywordOverlap : [],
      },
    });
  }

  return map;
};

const matchJobsForCandidateWithBudget = async ({ candidate, jobs }) => {
  const timeoutMs = Math.max(500, Number(process.env.JOB_FEED_AI_TIMEOUT_MS || 1800));
  return Promise.race([
    matchJobsForCandidate({ candidate, jobs }),
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
};

const computeProfileCompleted = (userType, merged, accountType) => {
  const resolvedAccountType = String(accountType || merged?.account_type || '').trim().toLowerCase();

  if (resolvedAccountType === 'company' || userType === 'company') {
    return Boolean(
      String(merged.company_name || '').trim() &&
        String(merged.address || '').trim() &&
        String(merged.industry || '').trim() &&
        String(merged.company_size || '').trim() &&
        String(merged.email || '').trim()
    );
  }

  return Boolean(
    String(merged.name || '').trim() &&
      String(merged.username || '').trim() &&
      String(merged.address || '').trim() &&
      String(merged.education || '').trim() &&
      String(merged.desired_job || '').trim() &&
      String(merged.phone || '').trim() &&
      String(merged.email || '').trim()
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { email, password, username, userType, accountType, verificationToken, termsAccepted } = req.body;

  // Validate inputs
  // Accept either accountType or userType for backward compatibility.
  if (!email || !password || !username || (!userType && !accountType)) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Developer mock bypass
  let isValidated = false;
  if (!verificationToken && email.includes('mock-')) {
    try {
      assertLocalAuthBypassAllowed(req);
      isValidated = true;
    } catch (error) {
      return res.status(403).json({ message: error.message });
    }
  } else if (verificationToken) {
    try {
      const decoded = jwt.verify(verificationToken, getJwtSecretOrThrow());
      if (decoded.purpose === 'registration-validated' && decoded.email.toLowerCase() === email.toLowerCase()) {
        isValidated = true;
      }
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired email verification token.' });
    }
  }

  if (!isValidated) {
    return res.status(403).json({ message: 'Email has not been verified.' });
  }

  let client;
  
  try {
    client = await pool.connect();
    const derived = deriveAccountTypeAndUserType({ accountType, userType });
    if (!derived.userType || !derived.accountType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type',
      });
    }

    // Check if user already exists
    const userExists = await client.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      const existingUser = userExists.rows[0];
      if (existingUser.email === email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken' 
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user
    const hasAcceptedTerms = termsAccepted === true;
    const result = await client.query(
      `INSERT INTO users (id, username, email, password, user_type, account_type, terms_accepted, terms_accepted_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 THEN CURRENT_TIMESTAMP ELSE NULL END) 
       RETURNING *`,
      [crypto.randomUUID(), username, email, hashedPassword, derived.userType, derived.accountType, hasAcceptedTerms]
    );

    const user = result.rows[0];
    if (derived.accountType === 'company') {
      await getOrCreateCompanyForUserId(client, user.id);
    }

    const session = await attachSessionCookies(res, user, req);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      session: {
        strategy: 'cookie',
        accessTokenTtl: process.env.JWT_ACCESS_EXPIRE || '20m',
        refreshTokenTtlDays: Number(process.env.JWT_REFRESH_EXPIRE_DAYS || 14),
        passwordHasher: PASSWORD_HASHER,
        csrfToken: session.csrfToken,
      },
      user: serializeUser(user),
    });
  } catch (error) {
    logger.error({ err: error }, 'Registration error');
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const verifyPasswordSecurely = async (plainPassword, storedPassword) => {
  const normalizedStoredPassword = String(storedPassword || '');
  const normalizedPlainPassword = String(plainPassword || '');

  if (!normalizedStoredPassword) {
    return false;
  }

  if (!BCRYPT_HASH_PREFIX.test(normalizedStoredPassword)) {
    return false;
  }

  return bcrypt.compare(normalizedPlainPassword, normalizedStoredPassword);
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    const { email, password } = req.body;

    const result = await client.query(
      `SELECT *
       FROM users
       WHERE email = $1 OR username = $1
       LIMIT 1`,
      [email]
    );

    const genericFailure = () =>
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });

    if (result.rows.length === 0) {
      await verifyPasswordSecurely(password, DUMMY_BCRYPT_HASH).catch(() => false);
      return genericFailure();
    }

    const user = result.rows[0];

    const isPasswordValid = await verifyPasswordSecurely(password, user.password);

    if (!isPasswordValid) {
      return genericFailure();
    }

    const computedProfileCompleted = computeProfileCompleted(user.user_type, user, user.account_type);
    if (computedProfileCompleted !== Boolean(user.profile_completed)) {
      try {
        await client.query('UPDATE users SET profile_completed = $1 WHERE id = $2', [computedProfileCompleted, user.id]);
        user.profile_completed = computedProfileCompleted;
      } catch (error) {
        logger.error('Failed to persist profile_completed on login:', error);
      }
    }

    clearLoginRateLimit(req);
    const session = await attachSessionCookies(res, user, req);

    res.json({
      success: true,
      message: 'Login successful',
      session: {
        strategy: 'cookie',
        accessTokenTtl: process.env.JWT_ACCESS_EXPIRE || '20m',
        refreshTokenTtlDays: Number(process.env.JWT_REFRESH_EXPIRE_DAYS || 14),
        passwordHasher: PASSWORD_HASHER,
        csrfToken: session.csrfToken,
      },
      user: serializeUser(user),
    });
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const refreshSession = async (req, res) => {
  try {
    const refreshCookieName = process.env.REFRESH_TOKEN_COOKIE_NAME || 'kapit_refresh_token';
    const refreshToken = String(req.cookies?.[refreshCookieName] || '').trim();

    if (!refreshToken) {
      clearSessionCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing.',
      });
    }

    const { user, session } = await verifyRefreshTokenSession(refreshToken);
    const refreshed = await attachSessionCookies(res, user, req, session.id);

    return res.json({
      success: true,
      message: 'Session refreshed.',
      session: {
        strategy: 'cookie',
        accessTokenTtl: process.env.JWT_ACCESS_EXPIRE || '20m',
        refreshTokenTtlDays: Number(process.env.JWT_REFRESH_EXPIRE_DAYS || 14),
        passwordHasher: PASSWORD_HASHER,
        csrfToken: refreshed.csrfToken,
      },
      user: serializeUser(user),
    });
  } catch (error) {
    clearSessionCookies(res);
    return res.status(401).json({
      success: false,
      message: 'Unable to refresh session.',
      ...buildDevErrorMeta(error),
    });
  }
};

// @desc    Logout current session
// @route   POST /api/auth/logout
// @access  Private or public with cookie
const logout = async (req, res) => {
  try {
    const refreshCookieName = process.env.REFRESH_TOKEN_COOKIE_NAME || 'kapit_refresh_token';
    const refreshToken = String(req.cookies?.[refreshCookieName] || '').trim();

    if (refreshToken) {
      try {
        const { session } = await verifyRefreshTokenSession(refreshToken);
        await revokeSessionById(session.id);
      } catch {
        await revokeSessionByToken(refreshToken);
      }
    }
  } catch (error) {
    logger.warn('Logout session cleanup warning:', error?.message || error);
  }

  clearSessionCookies(res);
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = result.rows[0];
    const computedProfileCompleted = computeProfileCompleted(user.user_type, user, user.account_type);
    if (computedProfileCompleted !== Boolean(user.profile_completed)) {
      try {
        const updated = await client.query('UPDATE users SET profile_completed = $1 WHERE id = $2 RETURNING *', [
          computedProfileCompleted,
          req.user.id,
        ]);
        if (updated.rows.length) {
          return res.json({
            success: true,
            user: serializeUser(updated.rows[0]),
          });
        }
      } catch (error) {
        logger.error('Failed to persist profile_completed on /me:', error);
      }
    }

    res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    logger.error({ err: error }, 'Get user error');
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Get public profile by user id
// @route   GET /api/auth/profile/:id
// @access  Private
const getPublicProfile = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    const { id } = req.params;

    const result = await client.query(
      `SELECT id, username, email, user_type, is_premium, created_at,
              profile_completed, bio, socials, profile_image, address,
              education, desired_job, company_name, industry, company_size, website, hiring_for
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];
    let jobListings = [];
    let relatedCompanies = [];
    let companyShortDescription = user.bio || '';
    let companyDescription = user.bio || '';
    let companyWebsite = user.website || '';
    let companyLocation = user.address || '';
    let companyLogo = user.profile_image || '';

    if (user.user_type === 'company') {
      const companyResult = await client.query(
        `SELECT c.id, c.name, c.logo, c.short_description, c.description, c.location, c.website
         FROM companies c
         WHERE c.user_id = $1
         LIMIT 1`,
        [id]
      );

      const company = companyResult.rows[0] || null;

      if (company?.id) {
        companyShortDescription = company.short_description || company.description || user.bio || '';
        companyDescription = company.description || user.bio || '';
        companyWebsite = company.website || user.website || '';
        companyLocation = company.location || user.address || '';
        companyLogo = company.logo || user.profile_image || '';

        const jobsResult = await client.query(
          `SELECT j.id, j.title, j.location, j.type, j.status, j.created_at
           FROM jobs j
           WHERE j.company_id = $1
             AND COALESCE(j.posting_payment_status, 'paid') = 'paid'
           ORDER BY
             CASE j.status
               WHEN 'open' THEN 0
               WHEN 'filled' THEN 1
               WHEN 'closed' THEN 2
               ELSE 3
             END,
             j.created_at DESC`,
          [company.id]
        );

        const relatedResult = await client.query(
          `SELECT rc.id, rc.name, rc.short_description, rc.website
           FROM company_related_companies rc
           WHERE rc.company_id = $1
           ORDER BY rc.created_at DESC, rc.name ASC`,
          [company.id]
        );

        jobListings = jobsResult.rows.map((row) => ({
          id: row.id,
          title: row.title,
          location: row.location || '',
          type: row.type || '',
          status: row.status || 'open',
          createdAt: row.created_at,
        }));

        relatedCompanies = relatedResult.rows.map((row) => ({
          id: row.id,
          name: row.name,
          shortDescription: row.short_description || '',
          website: row.website || '',
        }));
      }
    }

    if (req.user?.id && req.user.id !== user.id) {
      const viewerResult = await client.query(
        `SELECT id, username, email, company_name
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [req.user.id]
      );

      if (viewerResult.rows.length) {
        const viewerLabel =
          viewerResult.rows[0].company_name ||
          viewerResult.rows[0].username ||
          viewerResult.rows[0].email ||
          'Someone';

        await ensureNotificationsTable(client);
        await createNotification(client, {
          userId: user.id,
          actorUserId: req.user.id,
          type: 'profile_view',
          title: 'Profile viewed',
          message: 'A user viewed your company profile.',
          metadata: {
            actorLabel: viewerLabel,
            viewerUserId: req.user.id,
            eventAt: new Date().toISOString(),
          },
        });
      }
    }

    return res.json({
      success: true,
      profile: {
        id: user.id,
        username: user.username,
        email: canViewUserEmail({ viewer: req.user, targetUserId: user.id }) ? user.email : '',
        type: user.user_type,
        isPremium: user.is_premium,
        profileCompleted: Boolean(user.profile_completed),
        bio: user.bio || '',
        socials: normalizeSocialsText(user.socials),
        profileImage: companyLogo,
        address: companyLocation,
        education: user.education || '',
        desiredJob: user.desired_job || '',
        companyName: user.company_name || '',
        industry: user.industry || '',
        companySize: user.company_size || '',
        website: companyWebsite,
        hiringFor: user.hiring_for || '',
        shortDescription: companyShortDescription,
        bio: companyDescription,
        jobListings,
        relatedCompanies,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    logger.error('Get public profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Search users and companies
// @route   GET /api/auth/search?q=...
// @access  Private
const searchUsers = async (req, res) => {
  let client;

  try {
    const query = String(req.query.q || '').trim();
    const scope = String(req.query.scope || 'all').trim().toLowerCase();
    if (!query) {
      return res.json({ success: true, results: [] });
    }

    client = await pool.connect();
    const searchPattern = `%${query}%`;
    const values = [searchPattern, req.user.id, `${query}%`];
    const scopeFilterSql = appendSearchScopeFilterClause({ values, scope });

    const result = await client.query(
      `SELECT id, username, email, name, user_type, company_name, is_premium, profile_completed, profile_image
       FROM users
       WHERE (username ILIKE $1 OR email ILIKE $1 OR company_name ILIKE $1 OR name ILIKE $1)
         AND id <> $2${scopeFilterSql}
       ORDER BY
         CASE
            WHEN company_name ILIKE $3 THEN 0
            WHEN username ILIKE $3 THEN 1
            WHEN name ILIKE $3 THEN 2
            WHEN email ILIKE $3 THEN 3
            ELSE 4
          END,
          COALESCE(NULLIF(username, ''), NULLIF(name, ''), email) ASC
       LIMIT 12`,
      values
    );

    const results = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: canViewUserEmail({ viewer: req.user, targetUserId: row.id }) ? row.email : '',
      fullName: row.name || '',
      type: row.user_type,
      companyName: row.company_name || '',
      isPremium: row.is_premium,
      profileCompleted: Boolean(row.profile_completed),
      profileImage: row.profile_image || '',
    }));

    return res.json({ success: true, results });
  } catch (error) {
    logger.error('Search users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during search',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Update current user's profile
// @route   PATCH /api/auth/profile
// @access  Private
const updateMyProfile = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const currentResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const current = currentResult.rows[0];
    const updates = req.body || {};
    if (Object.prototype.hasOwnProperty.call(updates, 'isPremium')) {
      return res.status(400).json({
        success: false,
        error: 'Forbidden profile field.',
        details: [
          {
            path: 'isPremium',
            code: 'field_not_writable',
            message: 'isPremium can only be changed by verified subscription flows.',
          },
        ],
      });
    }

    const fieldMap = {
      username: 'username',
      bio: 'bio',
      socials: 'socials',
      profileImage: 'profile_image',
      phone: 'phone',
      address: 'address',

      name: 'name',
      education: 'education',
      vocationalCourse: 'vocational_course',
      desiredJob: 'desired_job',
      birthday: 'birthday',
      age: 'age',
      sex: 'sex',

      companyName: 'company_name',
      industry: 'industry',
      companySize: 'company_size',
      website: 'website',
      hiringFor: 'hiring_for',
    };

    const sanitized = {};
    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        sanitized[column] = updates[key];
      }
    }

    const merged = { ...current, ...sanitized };
    if (Object.prototype.hasOwnProperty.call(sanitized, 'socials')) {
      sanitized.socials = normalizeSocialsText(sanitized.socials);
    }
    const profileCompleted = computeProfileCompleted(current.user_type, merged, current.account_type);
    sanitized.profile_completed = profileCompleted;

    const columns = Object.keys(sanitized);
    if (columns.length === 0) {
      return res.json({ success: true, user: serializeUser(current) });
    }

    const sets = columns.map((col, idx) => `${col} = $${idx + 1}`).join(', ');
    const values = columns.map((col) => sanitized[col]);

    const ageIndex = columns.indexOf('age');
    if (ageIndex >= 0) {
      const rawAge = sanitized.age;
      if (rawAge == null || rawAge === '') {
        sanitized.age = null;
      } else {
        const age = Number(rawAge);
        if (!Number.isFinite(age)) {
          return res.status(400).json({
            success: false,
            message: 'Age must be a valid number',
          });
        }
        if (age < 0 || age > 120) {
          return res.status(400).json({
            success: false,
            message: 'Age must be between 0 and 120',
          });
        }
        sanitized.age = Math.trunc(age);
      }
      values[ageIndex] = sanitized.age;
    }

    const birthdayIndex = columns.indexOf('birthday');
    if (birthdayIndex >= 0) {
      const b = sanitized.birthday;
      values[birthdayIndex] = b ? b : null;
    }

    const result = await client.query(
      `UPDATE users SET ${sets} WHERE id = $${columns.length + 1} RETURNING *`,
      [...values, req.user.id]
    );

    return res.json({ success: true, user: serializeUser(result.rows[0]) });
  } catch (error) {
    if (String(error?.code) === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Username already taken',
      });
    }

    logger.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Companies appear here after they record a hire on KapIT (`jobs.hired_at`).
// Newer employers (by `companies.created_at`) are ordered first among those with recent hires.
const clampInt = (raw, fallback, min, max) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(n)));
};

const FEATURED_COMPANY_RECENT_HIRE_DAYS = clampInt(process.env.FEATURED_COMPANY_RECENT_HIRE_DAYS, 60, 7, 365);
const FEATURED_COMPANY_NEW_DAYS = clampInt(process.env.FEATURED_COMPANY_NEW_DAYS, 180, 7, 730);
const FEATURED_COMPANY_LIMIT = clampInt(process.env.FEATURED_COMPANY_LIMIT, 3, 1, 25);

// @desc    Companies with recent hires (for employee home sidebar)
// @route   GET /api/auth/featured-companies
// @access  Private
const getFeaturedCompaniesByRecentHires = async (req, res) => {
  let client;

  try {
    await ensureOnboardingSchemaReady();
    client = await pool.connect();

    const result = await client.query(
      `SELECT
         c.id::text AS company_id,
         COALESCE(NULLIF(TRIM(BOTH FROM c.name), ''), NULLIF(TRIM(BOTH FROM u.company_name), ''), u.username, 'Company') AS name,
         COALESCE(
           NULLIF(TRIM(BOTH FROM cp.industry), ''),
           NULLIF(TRIM(BOTH FROM u.industry), ''),
           NULLIF(TRIM(BOTH FROM c.short_description), ''),
           'Recently hired on KapIT'
         ) AS subtitle,
         MAX(j.hired_at) AS last_hire_at,
         COUNT(*)::int AS recent_hire_count,
         (c.created_at >= CURRENT_TIMESTAMP - ($2 * INTERVAL '1 day')) AS is_new_company
       FROM companies c
       INNER JOIN jobs j ON j.company_id = c.id
         AND j.hired_at IS NOT NULL
         AND j.hired_at >= CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')
       LEFT JOIN users u ON u.id = c.user_id
       LEFT JOIN company_profiles cp ON cp.user_id = c.user_id
       GROUP BY c.id, c.name, c.created_at, c.short_description, u.company_name, u.username, u.industry, cp.industry
       ORDER BY
         COUNT(*) DESC,
         MAX(j.hired_at) DESC,
         (c.created_at >= CURRENT_TIMESTAMP - ($2 * INTERVAL '1 day')) DESC NULLS LAST,
         c.created_at DESC
       LIMIT $3`,
      [FEATURED_COMPANY_RECENT_HIRE_DAYS, FEATURED_COMPANY_NEW_DAYS, FEATURED_COMPANY_LIMIT]
    );

    const companies = result.rows.map((row) => ({
      id: row.company_id,
      name: row.name,
      subtitle: row.subtitle,
      lastHireAt: row.last_hire_at ? new Date(row.last_hire_at).toISOString() : null,
      recentHireCount: Number(row.recent_hire_count || 0),
      isNewCompany: Boolean(row.is_new_company),
    }));

    return res.json({ success: true, companies });
  } catch (error) {
    logger.error('Featured companies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not load featured companies',
      ...(isDev ? buildDevErrorMeta(error) : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Get available jobs for authenticated users
// @route   GET /api/auth/jobs
// @access  Private
const getJobsFeed = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await closeExpiredJobs(client);
    const plan = await getPremiumStateForUser(client, req.user.id);
    const filters = normalizeJobFeedFilters(req.query);
    const values = [req.user.id];
    const conditions = [
      `COALESCE(j.posting_payment_status, 'paid') = 'paid'`,
      `j.status = 'open'`,
    ];

    if (filters.location) {
      values.push(`%${filters.location}%`);
      conditions.push(`COALESCE(j.location, '') ILIKE $${values.length}`);
    }

    if (filters.jobType) {
      values.push(filters.jobType);
      conditions.push(`COALESCE(j.type, '') ILIKE $${values.length}`);
    }

    if (filters.workPreference === 'fully-remote') {
      conditions.push(
        `(COALESCE(j.work_preference, '') = 'fully-remote'
          OR COALESCE(j.location, '') ILIKE '%remote%'
          OR COALESCE(j.type, '') ILIKE '%remote%'
          OR COALESCE(j.description, '') ILIKE '%fully remote%')`
      );
    }

    if (filters.workPreference === 'asynchronous-remote') {
      conditions.push(
        `(COALESCE(j.work_preference, '') = 'asynchronous-remote'
          OR COALESCE(j.location, '') ILIKE '%asynchronous%'
          OR COALESCE(j.type, '') ILIKE '%asynchronous%'
          OR COALESCE(j.description, '') ILIKE '%asynchronous%'
          OR COALESCE(j.description, '') ILIKE '%async remote%')`
      );
    }

    if (filters.workPreference === 'on-site') {
      conditions.push(
        `(COALESCE(j.work_preference, '') = 'on-site'
          OR COALESCE(j.location, '') ILIKE '%on-site%'
          OR COALESCE(j.location, '') ILIKE '%on site%'
          OR COALESCE(j.location, '') ILIKE '%onsite%'
          OR COALESCE(j.type, '') ILIKE '%on-site%'
          OR COALESCE(j.type, '') ILIKE '%on site%'
          OR COALESCE(j.type, '') ILIKE '%onsite%'
          OR COALESCE(j.description, '') ILIKE '%on-site%'
          OR COALESCE(j.description, '') ILIKE '%on site%'
          OR COALESCE(j.description, '') ILIKE '%onsite%')`
      );
    }

    if (filters.skill) {
      values.push(`%${filters.skill}%`);
      conditions.push(
        `EXISTS (
           SELECT 1
           FROM unnest(COALESCE(j.skills, ARRAY[]::text[])) AS skill_name
           WHERE skill_name ILIKE $${values.length}
         )`
      );
    }

    if (filters.keyword) {
      values.push(`%${filters.keyword}%`);
      const keywordParam = `$${values.length}`;
      conditions.push(
        `(
          COALESCE(j.title, '') ILIKE ${keywordParam}
          OR COALESCE(j.description, '') ILIKE ${keywordParam}
          OR COALESCE(j.location, '') ILIKE ${keywordParam}
          OR COALESCE(j.type, '') ILIKE ${keywordParam}
          OR COALESCE(c.name, u.company_name, u.username, '') ILIKE ${keywordParam}
          OR EXISTS (
            SELECT 1
            FROM unnest(COALESCE(j.skills, ARRAY[]::text[])) AS keyword_skill
            WHERE keyword_skill ILIKE ${keywordParam}
          )
        )`
      );
    }

    if (filters.salaryRange) {
      values.push(`%${filters.salaryRange}%`);
      conditions.push(`COALESCE(j.salary, '') ILIKE $${values.length}`);
    } else if (filters.salaryCurrency) {
      values.push(`${filters.salaryCurrency}%`);
      conditions.push(`COALESCE(j.salary, '') ILIKE $${values.length}`);
    }

    if (filters.experienceLevel === 'intern') {
      conditions.push(
        `(COALESCE(j.experience_level, '') = 'intern'
          OR COALESCE(j.title, '') ILIKE '%intern%'
          OR COALESCE(j.description, '') ILIKE '%intern%'
          OR COALESCE(j.description, '') ILIKE '%entry level%'
          OR COALESCE(j.description, '') ILIKE '%entry-level%')`
      );
    }

    if (filters.experienceLevel === 'junior') {
      conditions.push(
        `(COALESCE(j.experience_level, '') = 'junior'
          OR COALESCE(j.title, '') ILIKE '%junior%'
          OR COALESCE(j.description, '') ILIKE '%junior%'
          OR COALESCE(j.description, '') ILIKE '%entry level%'
          OR COALESCE(j.description, '') ILIKE '%entry-level%')`
      );
    }

    if (filters.experienceLevel === 'mid') {
      conditions.push(
        `(COALESCE(j.experience_level, '') = 'mid'
          OR COALESCE(j.title, '') ILIKE '%mid%'
          OR COALESCE(j.description, '') ILIKE '%mid%'
          OR COALESCE(j.description, '') ILIKE '%mid-level%'
          OR COALESCE(j.description, '') ILIKE '%intermediate%')`
      );
    }

    if (filters.experienceLevel === 'senior') {
      conditions.push(
        `(COALESCE(j.experience_level, '') = 'senior'
          OR COALESCE(j.title, '') ILIKE '%senior%'
          OR COALESCE(j.description, '') ILIKE '%senior%'
          OR COALESCE(j.title, '') ILIKE '%lead%'
          OR COALESCE(j.description, '') ILIKE '%lead%')`
      );
    }

    const result = await client.query(
      `SELECT j.id,
              j.title,
              j.description,
              j.salary,
              j.location,
              j.type,
              j.experience_level,
              j.work_preference,
              j.skills,
              j.status,
              j.active_until,
              j.application_deadline,
              j.created_at,
              c.id AS company_id,
              c.user_id AS company_user_id,
              EXISTS (
                SELECT 1
                FROM applications a
                WHERE a.job_id = j.id AND a.user_id = $1
              ) AS has_applied,
              COALESCE(c.name, u.company_name, u.username, 'Company') AS company_name,
              COALESCE(c.logo, u.profile_image, '') AS company_logo
       FROM jobs j
       LEFT JOIN companies c ON c.id = j.company_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE ${conditions.join('\n         AND ')}
       ORDER BY
         CASE j.status
           WHEN 'open' THEN 0
           WHEN 'filled' THEN 1
           WHEN 'closed' THEN 2
           ELSE 3
         END,
         j.created_at DESC`,
      values
    );

    let jobs = result.rows
      .map((row) => withJobAvailability({
        id: row.id,
        title: row.title,
        description: row.description || '',
        salary: row.salary || '',
        location: row.location || '',
        type: row.type || '',
        experienceLevel: row.experience_level || '',
        workPreference: row.work_preference || '',
        skills: Array.isArray(row.skills) ? row.skills : [],
        status: row.status || 'open',
        active_until: row.active_until,
        application_deadline: row.application_deadline,
        createdAt: row.created_at,
        hasApplied: Boolean(row.has_applied),
        company: {
          companyId: row.company_id || null,
          userId: row.company_user_id || null,
          name: row.company_name || 'Company',
          logo: row.company_logo || '',
        },
      }))
      .filter((job) => job.status === 'open' && job.acceptsApplications !== false)
      .filter((job) => isJobVisibleForPlan(job, plan));

    let profile = null;
    let profileSignature = '';
    if (isAiConfigured()) {
      const profileResult = await client.query(
        `SELECT dp.user_id,
                COALESCE(dp.full_name, u.name, u.username) AS full_name,
                COALESCE(dp.preferred_it_role, u.desired_job, dp.job_title) AS preferred_role,
                COALESCE(dp.job_title, '') AS job_title,
                COALESCE(dp.bio, u.bio, '') AS bio,
                COALESCE(dp.resume_url, '') AS resume_url,
                COALESCE(dp.skills, ARRAY[]::text[]) AS skills,
                COALESCE(dp.location, u.address, '') AS location,
                COALESCE(dp.experience_years, 0) AS experience_years,
                COALESCE(dp.education, u.education, '') AS education,
                COALESCE(dp.certifications, '') AS certifications,
                COALESCE(dp.school_university, '') AS school_university,
                COALESCE(dp.work_preference, '') AS work_preference
         FROM users u
         LEFT JOIN developer_profiles dp ON dp.user_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [req.user.id]
      );

      profile = profileResult.rows[0] || null;
      if (profile) {
        profileSignature = createProfileMatchSignature(profile);
      }
    }

    let cachedMatchMap = new Map();
    if (jobs.length) {
      cachedMatchMap = await loadCachedJobMatchScores(client, {
        userId: req.user.id,
        jobs,
        profileSignature,
      }).catch(() => new Map());

        jobs = jobs.map((job) => {
          const cached = cachedMatchMap.get(Number(job.id));
          if (!cached) {
            return job;
          }

          return {
            ...job,
            matchPercentage: cached.matchPercentage,
            atsScore: cached.atsScore,
            matchConfidenceScore: cached.matchConfidenceScore,
            matchConfidenceLabel: cached.matchConfidenceLabel,
            matchFitLabel: cached.matchFitLabel,
            matchSource: cached.matchSource,
            matchReasoningSummary: cached.matchReasoningSummary,
            matchInsufficientData: cached.matchInsufficientData,
            matchDetails: cached.matchDetails,
          };
        });
      }

    if (isAiConfigured()) {
      const jobsNeedingScores = jobs.filter((job) => !cachedMatchMap.has(Number(job.id)));
      if (profile && jobsNeedingScores.length) {
        const resumeText = [
          String(profile.bio || '').trim(),
          String(profile.education || '').trim(),
          String(profile.certifications || '').trim(),
          String(profile.school_university || '').trim(),
        ]
          .filter(Boolean)
          .join('\n');

        const aiResult = await matchJobsForCandidateWithBudget({
          candidate: {
            id: req.user.id,
            fullName: profile.full_name,
            preferredRole: profile.preferred_role,
            jobTitle: profile.job_title,
            bio: profile.bio,
            resumeText,
            skills: profile.skills,
            location: profile.location,
            workPreference: profile.work_preference,
            yearsOfExperience: profile.experience_years,
            education: profile.education,
            certifications: profile.certifications,
          },
          jobs: jobsNeedingScores,
        }).catch(() => null);

        const matchMap = new Map((aiResult?.matches || []).map((item) => [Number(item.job_id), item]));
        const scoreRows = [];
        jobs = jobs.map((job) => {
          const match = matchMap.get(Number(job.id));
          if (!match) {
            return job;
          }

          const matchPercentage = Number(match.fit_score ?? match.match_percentage ?? 0);
          const atsScore = Number(match.ats_score || 0);
          scoreRows.push({
            job_id: Number(job.id),
            match_percentage: matchPercentage,
            ats_score: atsScore,
            metadata: createJobMatchScoreMetadata({
              match,
              profileSignature,
              jobSignature: createJobMatchSignature(job),
            }),
          });

          return {
            ...job,
            matchPercentage,
            atsScore,
            matchConfidenceScore: Number(match.confidence_score || 0),
            matchConfidenceLabel: String(match.confidence_label || ''),
            matchFitLabel: String(match.fit_label || ''),
            matchSource: String(match.source || 'ai'),
            matchReasoningSummary: String(match.reasoning_summary || ''),
            matchInsufficientData: Boolean(match.insufficient_data),
            matchDetails: {
              matchedSkills: match.matched_skills || [],
              missingSkills: match.missing_skills || [],
              strengths: match.strengths || [],
              concerns: match.concerns || [],
              roleRelevance: Number(match.role_relevance || 0),
              keywordOverlap: match.keyword_overlap || [],
            },
          };
        });

        await upsertJobMatchScores(client, {
          userId: req.user.id,
          rows: scoreRows,
        }).catch(() => null);
      }
    }

    return res.json({
      success: true,
      jobs,
      plan: {
        isPremium: plan.isPremium,
        delayedJobWindowHours: plan.isPremium ? 0 : FREE_JOB_FEED_DELAY_HOURS,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Get jobs feed error');
    return res.json({
      success: true,
      jobs: [],
      warning: 'Jobs feed is temporarily unavailable.',
      ...buildDevErrorMeta(error),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Get saved jobs
// @route   GET /api/auth/saved-jobs
// @access  Private
const getSavedJobs = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await closeExpiredJobs(client);

    const result = await client.query(
      `SELECT sj.job_id,
              sj.created_at AS saved_at,
              j.title,
              j.description,
              j.salary,
              j.location,
              j.type,
              j.skills,
              j.status,
              j.active_until,
              j.application_deadline,
              j.created_at AS job_created_at,
              COALESCE(c.name, u.company_name, u.username, 'Company') AS company_name,
              COALESCE(c.logo, u.profile_image, '') AS company_logo
       FROM saved_jobs sj
       JOIN jobs j ON j.id = sj.job_id
       LEFT JOIN companies c ON c.id = j.company_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE sj.user_id = $1
       ORDER BY sj.created_at DESC`,
      [req.user.id]
    );

    const savedJobs = result.rows.map((row) => withJobAvailability(serializeSavedJobRow(row)));
    return res.json({ success: true, savedJobs });
  } catch (error) {
    logger.error('Get saved jobs error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching saved jobs.' });
  } finally {
    client?.release();
  }
};

// @desc    Save a job
// @route   POST /api/auth/saved-jobs
// @access  Private
const saveJob = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    const jobId = Number(req.body?.jobId);

    if (!Number.isInteger(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid job id.' });
    }

    const visibleJobResult = await client.query(
      `SELECT id
       FROM jobs
       WHERE id = $1
         AND COALESCE(posting_payment_status, 'paid') = 'paid'
       LIMIT 1`,
      [jobId]
    );

    if (!visibleJobResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    await client.query(
      `INSERT INTO saved_jobs (user_id, job_id, source, metadata)
       VALUES ($1, $2, 'manual', '{}'::jsonb)
       ON CONFLICT (user_id, job_id) DO NOTHING`,
      [req.user.id, jobId]
    );

    return res.status(201).json({ success: true, saved: true, jobId });
  } catch (error) {
    logger.error('Save job error:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving job.' });
  } finally {
    client?.release();
  }
};

// @desc    Remove a saved job
// @route   DELETE /api/auth/saved-jobs/:jobId
// @access  Private
const removeSavedJob = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    const jobId = Number(req.params.jobId);

    if (!Number.isInteger(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid job id.' });
    }

    await client.query(
      `DELETE FROM saved_jobs
       WHERE user_id = $1
         AND job_id = $2`,
      [req.user.id, jobId]
    );

    return res.json({ success: true, removed: true, jobId });
  } catch (error) {
    logger.error('Remove saved job error:', error);
    return res.status(500).json({ success: false, message: 'Server error while removing saved job.' });
  } finally {
    client?.release();
  }
};

// @desc    Get current user's submitted applications
// @route   GET /api/auth/applications
// @access  Private
const getMyApplications = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();

    const result = await client.query(
      `SELECT a.id,
              a.status,
              a.resume_url,
              a.created_at,
              a.updated_at,
              j.id AS job_id,
              j.title AS job_title,
              j.location AS job_location,
              j.type AS job_type,
              j.salary AS job_salary,
              COALESCE(c.name, u.company_name, u.username, 'Company') AS company_name,
              COALESCE(c.logo, u.profile_image, '') AS company_logo
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       LEFT JOIN companies c ON c.id = j.company_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT 200`,
      [req.user.id]
    );

    const applications = result.rows.map((row) => ({
      id: row.id,
      jobId: row.job_id,
      title: row.job_title || 'Untitled job',
      location: row.job_location || '',
      type: row.job_type || '',
      salary: row.job_salary || '',
      status: row.status || 'pending',
      resumeUrl: row.resume_url || '',
      appliedAt: row.created_at,
      updatedAt: row.updated_at,
      company: {
        name: row.company_name || 'Company',
        logo: row.company_logo || '',
      },
    }));

    return res.json({ success: true, applications });
  } catch (error) {
    logger.error({ err: error }, 'Get my applications error');
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your applications',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Apply to a job
// @route   POST /api/auth/jobs/:id/apply
// @access  Private
const applyToJob = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    await ensureOnboardingSchemaReady();
    if (req.user?.userType !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Only developer accounts can apply to jobs.',
      });
    }

    const jobId = Number(req.params.id);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job id.',
      });
    }

    client = await pool.connect();
    await client.query('BEGIN');
    await closeExpiredJobs(client);

    const jobResult = await client.query(
      `SELECT j.id,
              j.company_id,
              j.status,
              j.title,
              j.active_until,
              j.application_deadline,
              c.user_id AS company_user_id
       FROM jobs j
       LEFT JOIN companies c ON c.id = j.company_id
       WHERE j.id = $1
         AND COALESCE(j.posting_payment_status, 'paid') = 'paid'
       LIMIT 1`,
      [jobId]
    );

    if (!jobResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Job not found.',
      });
    }

    const job = jobResult.rows[0];
    const availability = withJobAvailability(job);
    const status = String(job.status || '').toLowerCase();
    if (status !== 'open' || !availability.acceptsApplications) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: availability.availabilityLabel || 'This job is no longer accepting applications.',
      });
    }

    const userResult = await client.query(
      `SELECT id, user_type
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (!userResult.rows.length || userResult.rows[0].user_type !== 'employee') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Only developer accounts can apply to jobs.',
      });
    }

    const existingApplication = await client.query(
      `SELECT id
       FROM applications
       WHERE job_id = $1 AND user_id = $2
       LIMIT 1`,
      [jobId, req.user.id]
    );

    if (existingApplication.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You already applied to this job.',
      });
    }

    const developerProfile = await client.query(
      `SELECT resume_url
       FROM developer_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [req.user.id]
    );

    const resumeUrl = developerProfile.rows[0]?.resume_url || null;

    const applicationResult = await client.query(
      `INSERT INTO applications (job_id, user_id, status, resume_url)
       VALUES ($1, $2, 'pending', $3)
       RETURNING id, status, resume_url, created_at, updated_at`,
      [jobId, req.user.id, resumeUrl]
    );

    if (job.company_user_id) {
      await ensureNotificationsTable(client);
      await createNotification(client, {
        userId: job.company_user_id,
        actorUserId: req.user.id,
        type: 'job_application',
        title: 'New applicant',
        message: 'A user applied to your job listing.',
        metadata: {
          actorLabel: 'A user',
          applicantUserId: req.user.id,
          jobId: job.id,
          jobTitle: job.title || 'Job listing',
          eventAt: new Date().toISOString(),
        },
      });
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      application: {
        id: applicationResult.rows[0].id,
        status: applicationResult.rows[0].status,
        resumeUrl: applicationResult.rows[0].resume_url || '',
        createdAt: applicationResult.rows[0].created_at,
        updatedAt: applicationResult.rows[0].updated_at,
      },
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error({ err: error }, 'Apply to job error');
    return res.status(500).json({
      success: false,
      message: 'Server error while applying to job',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  register,
  login,
  refreshSession,
  logout,
  getCurrentUser,
  searchUsers,
  getPublicProfile,
  updateMyProfile,
  getJobsFeed,
  getFeaturedCompaniesByRecentHires,
  getSavedJobs,
  saveJob,
  removeSavedJob,
  getMyApplications,
  applyToJob,
};
