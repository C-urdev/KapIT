const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const { createNotification, ensureNotificationsTable } = require('./notificationsController');
const { ensureBaseUserSchemaReady, ensureHiringSchemaReady, ensureOnboardingSchemaReady } = require('../config/runtimeSchema');
const { withJobAvailability, closeExpiredJobs } = require('../services/jobAvailabilityService');
const { getPremiumStateForUser, requirePremiumApplicantFeature } = require('../services/planAccessService');
const { isAiConfigured, matchJobsForCandidate } = require('../services/aiService');
const {
  attachSessionCookies,
  clearSessionCookies,
  verifyRefreshTokenSession,
  revokeSessionById,
  revokeSessionByToken,
} = require('../services/authSessionService');
const { clearLoginRateLimit } = require('../middleware/security');
const isDev = process.env.NODE_ENV !== 'production';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const PASSWORD_HASHER = process.env.PASSWORD_HASHER || 'bcrypt';
const BCRYPT_HASH_PREFIX = /^\$2[aby]\$\d{2}\$/;
const buildDevErrorMeta = (error) => (
  isDev
    ? {
        errorDetail: error?.message || String(error),
        errorCode: error?.code || '',
      }
    : {}
);

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

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  type: user.user_type,
  role: user.role || user.user_type,
  accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
  isPremium: user.is_premium,
  profileCompleted: Boolean(user.profile_completed),

  bio: user.bio || '',
  socials: user.socials || '',
  profileImage: user.profile_image || '',
  phone: user.phone || '',
  address: user.address || '',

  name: user.name || '',
  education: user.education || '',
  vocationalCourse: user.vocational_course || '',
  desiredJob: user.desired_job || '',
  birthday: user.birthday ? new Date(user.birthday).toISOString().slice(0, 10) : '',
  age: user.age == null ? '' : String(user.age),
  sex: user.sex || '',

  companyName: user.company_name || '',
  industry: user.industry || '',
  companySize: user.company_size || '',
  website: user.website || '',
  hiringFor: user.hiring_for || '',
});

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
  const type = String(query.type || '').trim();
  const skill = String(query.skill || '').trim();
  const rawStatus = String(query.status || '').trim().toLowerCase();
  const allowedStatuses = new Set(['open', 'filled', 'closed']);

  return {
    keyword,
    location,
    type,
    skill,
    status: allowedStatuses.has(rawStatus) ? rawStatus : '',
  };
};

const upsertJobMatchScore = async (client, { userId, jobId, match }) => {
  await client.query(
    `INSERT INTO job_match_scores (
       user_id,
       job_id,
       match_percentage,
       ats_score,
       metadata,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, job_id) DO UPDATE SET
       match_percentage = EXCLUDED.match_percentage,
       ats_score = EXCLUDED.ats_score,
       metadata = EXCLUDED.metadata,
       updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      jobId,
      Number(match?.match_percentage || 0),
      Number(match?.ats_score || 0),
      JSON.stringify({
        matchedSkills: match?.matched_skills || [],
        missingSkills: match?.missing_skills || [],
        strengths: match?.strengths || [],
        concerns: match?.concerns || [],
        keywordOverlap: match?.keyword_overlap || [],
      }),
    ]
  );
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
  let client;
  
  try {
    client = await pool.connect();
    const { username, email, password, userType, accountType } = req.body;
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
    const result = await client.query(
      `INSERT INTO users (id, username, email, password, user_type, account_type) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [crypto.randomUUID(), username, email, hashedPassword, derived.userType, derived.accountType]
    );

    const user = result.rows[0];

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
    console.error('Registration error:', error);
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

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await verifyPasswordSecurely(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password',
      });
    }

    const computedProfileCompleted = computeProfileCompleted(user.user_type, user, user.account_type);
    if (computedProfileCompleted !== Boolean(user.profile_completed)) {
      try {
        await client.query('UPDATE users SET profile_completed = $1 WHERE id = $2', [computedProfileCompleted, user.id]);
        user.profile_completed = computedProfileCompleted;
      } catch (error) {
        console.error('Failed to persist profile_completed on login:', error);
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
    console.error('Login error:', error);
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
    console.warn('Logout session cleanup warning:', error?.message || error);
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
        console.error('Failed to persist profile_completed on /me:', error);
      }
    }

    res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Get user error:', error);
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
        email: user.email,
        type: user.user_type,
        isPremium: user.is_premium,
        profileCompleted: Boolean(user.profile_completed),
        bio: user.bio || '',
        socials: user.socials || '',
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
    console.error('Get public profile error:', error);
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
    if (!query) {
      return res.json({ success: true, results: [] });
    }

    client = await pool.connect();
    const searchPattern = `%${query}%`;

    const result = await client.query(
      `SELECT id, username, email, user_type, company_name, is_premium, profile_completed, profile_image
       FROM users
       WHERE (username ILIKE $1 OR email ILIKE $1 OR company_name ILIKE $1)
         AND id <> $2
       ORDER BY
         CASE
           WHEN company_name ILIKE $3 THEN 0
           WHEN username ILIKE $3 THEN 1
           WHEN email ILIKE $3 THEN 2
           ELSE 3
         END,
         username ASC
       LIMIT 12`,
      [searchPattern, req.user.id, `${query}%`]
    );

    const results = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      type: row.user_type,
      companyName: row.company_name || '',
      isPremium: row.is_premium,
      profileCompleted: Boolean(row.profile_completed),
      profileImage: row.profile_image || '',
    }));

    return res.json({ success: true, results });
  } catch (error) {
    console.error('Search users error:', error);
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

    const fieldMap = {
      isPremium: 'is_premium',
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
    const profileCompleted = computeProfileCompleted(current.user_type, merged, current.account_type);
    sanitized.profile_completed = profileCompleted;

    const columns = Object.keys(sanitized);
    if (columns.length === 0) {
      return res.json({ success: true, user: serializeUser(current) });
    }

    const sets = columns.map((col, idx) => `${col} = $${idx + 1}`).join(', ');
    const values = columns.map((col) => sanitized[col]);

    if (sanitized.age != null && sanitized.age !== '') {
      const age = Number(sanitized.age);
      sanitized.age = Number.isFinite(age) ? Math.trunc(age) : null;
      values[columns.indexOf('age')] = sanitized.age;
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

    console.error('Update profile error:', error);
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
const FEATURED_COMPANY_LIMIT = clampInt(process.env.FEATURED_COMPANY_LIMIT, 10, 1, 25);

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
         (c.created_at >= CURRENT_TIMESTAMP - ($2 * INTERVAL '1 day')) AS is_new_company
       FROM companies c
       INNER JOIN jobs j ON j.company_id = c.id
         AND j.hired_at IS NOT NULL
         AND j.hired_at >= CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')
       LEFT JOIN users u ON u.id = c.user_id
       LEFT JOIN company_profiles cp ON cp.user_id = c.user_id
       GROUP BY c.id, c.name, c.created_at, c.short_description, u.company_name, u.username, u.industry, cp.industry
       ORDER BY
         (c.created_at >= CURRENT_TIMESTAMP - ($2 * INTERVAL '1 day')) DESC NULLS LAST,
         MAX(j.hired_at) DESC
       LIMIT $3`,
      [FEATURED_COMPANY_RECENT_HIRE_DAYS, FEATURED_COMPANY_NEW_DAYS, FEATURED_COMPANY_LIMIT]
    );

    const companies = result.rows.map((row) => ({
      id: row.company_id,
      name: row.name,
      subtitle: row.subtitle,
      lastHireAt: row.last_hire_at ? new Date(row.last_hire_at).toISOString() : null,
      isNewCompany: Boolean(row.is_new_company),
    }));

    return res.json({ success: true, companies });
  } catch (error) {
    console.error('Featured companies error:', error);
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
    const conditions = [`COALESCE(j.posting_payment_status, 'paid') = 'paid'`];

    if (filters.status) {
      values.push(filters.status);
      conditions.push(`j.status = $${values.length}`);
    }

    if (filters.location) {
      values.push(`%${filters.location}%`);
      conditions.push(`COALESCE(j.location, '') ILIKE $${values.length}`);
    }

    if (filters.type) {
      values.push(filters.type);
      conditions.push(`COALESCE(j.type, '') ILIKE $${values.length}`);
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

    const result = await client.query(
      `SELECT j.id,
              j.title,
              j.description,
              j.salary,
              j.location,
              j.type,
              j.skills,
              j.status,
              j.active_until,
              j.application_deadline,
              j.created_at,
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
        skills: Array.isArray(row.skills) ? row.skills : [],
        status: row.status || 'open',
        active_until: row.active_until,
        application_deadline: row.application_deadline,
        createdAt: row.created_at,
        hasApplied: Boolean(row.has_applied),
        company: {
          name: row.company_name || 'Company',
          logo: row.company_logo || '',
        },
      }))
      .filter((job) => job.status !== 'draft');

    if (plan.isPremium && isAiConfigured()) {
      const profileResult = await client.query(
        `SELECT dp.user_id,
                COALESCE(dp.full_name, u.name, u.username) AS full_name,
                COALESCE(dp.preferred_it_role, u.desired_job, dp.job_title) AS preferred_role,
                COALESCE(dp.bio, u.bio, '') AS bio,
                COALESCE(dp.resume_url, '') AS resume_url,
                COALESCE(dp.skills, ARRAY[]::text[]) AS skills,
                COALESCE(dp.location, u.address, '') AS location,
                COALESCE(dp.experience_years, 0) AS experience_years
         FROM users u
         LEFT JOIN developer_profiles dp ON dp.user_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [req.user.id]
      );

      const profile = profileResult.rows[0];
      if (profile && jobs.length) {
        const aiResult = await matchJobsForCandidate({
          candidate: {
            id: req.user.id,
            fullName: profile.full_name,
            preferredRole: profile.preferred_role,
            bio: profile.bio,
            resume: profile.resume_url,
            skills: profile.skills,
            location: profile.location,
            yearsOfExperience: profile.experience_years,
          },
          jobs,
        }).catch(() => null);

        const matchMap = new Map((aiResult?.matches || []).map((item) => [Number(item.job_id), item]));
        jobs = await Promise.all(
          jobs.map(async (job) => {
            const match = matchMap.get(Number(job.id));
            if (!match) {
              return job;
            }

            await upsertJobMatchScore(client, {
              userId: req.user.id,
              jobId: job.id,
              match,
            }).catch(() => null);

            return {
              ...job,
              matchPercentage: Number(match.match_percentage || 0),
              atsScore: Number(match.ats_score || 0),
              matchDetails: {
                matchedSkills: match.matched_skills || [],
                missingSkills: match.missing_skills || [],
                strengths: match.strengths || [],
                concerns: match.concerns || [],
              },
            };
          })
        );
      }
    }

    return res.json({
      success: true,
      jobs,
      plan: {
        isPremium: plan.isPremium,
      },
    });
  } catch (error) {
    console.error('Get jobs feed error:', error);
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
    console.error('Get saved jobs error:', error);
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
    console.error('Save job error:', error);
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
    console.error('Remove saved job error:', error);
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
    console.error('Get my applications error:', error);
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
       FROM jobs
       LEFT JOIN companies c ON c.id = j.company_id
       WHERE id = $1
         AND COALESCE(posting_payment_status, 'paid') = 'paid'
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
    console.error('Apply to job error:', error);
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

