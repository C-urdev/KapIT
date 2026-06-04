const pool = require('../config/database');
const { logger } = require('../config/logger');
const fsPromises = require('fs/promises');
const { ensureBaseUserSchemaReady, ensureOnboardingSchemaReady } = require('../config/runtimeSchema');
const { getPremiumStateForUser, requirePremiumApplicantFeature } = require('../services/planAccessService');
const { isAiConfigured, analyzeResumeProfile } = require('../services/aiService');
const {
  getResumeDownloadName,
  getStoredNameFromResumeUrl,
  getStoredResumePath,
  storeGeneratedResumeArtifact,
  storeResumeUpload,
} = require('../services/resumeStorageService');
const {
  parseResumeText,
  callGeminiForResume,
  buildDocxBuffer,
  buildGeneratedFileName,
} = require('../services/resumeOptimizationService');
const { convertDocxToPdf } = require('../services/pdfConversionService');
const { normalizeSocialsText } = require('../utils/socials');
const PROFILE_SYNC_DEBUG = process.env.DEBUG_PROFILE_SYNC === 'true';
const ALLOWED_RESUME_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
]);

const getMimeTypeForStoredName = (storedName) => {
  const normalized = String(storedName || '').toLowerCase();
  if (normalized.endsWith('.pdf')) return 'application/pdf';
  if (normalized.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (normalized.endsWith('.doc')) return 'application/msword';
  return 'application/octet-stream';
};
const PROFILE_SYNC_REDACTED_KEYS = new Set([
  'email',
  'phone',
  'phoneNumber',
  'fullName',
  'name',
  'resume',
  'resumeUrl',
  'resume_url',
  'profileImage',
  'profile_photo_url',
  'profilePhotoUrl',
  'github',
  'github_link',
  'portfolioWebsite',
  'portfolio_link',
  'linkedin',
  'linkedin_link',
  'otherLinks',
  'other_links',
  'socials',
  'body',
]);

const normalizeSkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 50);
  if (typeof skills === 'string')
    return skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50);
  return [];
};

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  type: user.user_type,
  accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
  isPremium: user.is_premium,
  profileCompleted: Boolean(user.profile_completed),

  bio: user.bio || '',
  socials: normalizeSocialsText(user.socials),
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

const buildDevErrorMeta = (error) => (
  process.env.NODE_ENV !== 'production'
    ? {
        errorDetail: error?.message || String(error),
        errorCode: error?.code || '',
      }
    : {}
);

const logProfileSync = (label, payload) => {
  if (!PROFILE_SYNC_DEBUG) {
    return;
  }
  const sanitize = (value, depth = 0) => {
    if (value == null) return value;
    if (depth > 3) return '[truncated]';
    if (Array.isArray(value)) {
      return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
    }
    if (typeof value === 'object') {
      return Object.entries(value).reduce((acc, [key, entryValue]) => {
        if (PROFILE_SYNC_REDACTED_KEYS.has(key)) {
          acc[key] = '[redacted]';
          return acc;
        }
        acc[key] = sanitize(entryValue, depth + 1);
        return acc;
      }, {});
    }
    return value;
  };
  logger.info({ label, payload: sanitize(payload) }, 'developer-profile-sync');
};

const getResumeAccessState = async (client, { requester, resumeUrl }) => {
  const normalizedResumeUrl = String(resumeUrl || '').trim();
  if (!normalizedResumeUrl) {
    return { allowed: false };
  }

  const ownerResult = await client.query(
    `SELECT user_id
     FROM developer_profiles
     WHERE resume_url = $1
        OR optimized_resume_docx_url = $1
        OR optimized_resume_pdf_url = $1
     LIMIT 1`,
    [normalizedResumeUrl]
  );

  const ownerUserId = ownerResult.rows[0]?.user_id || null;
  if (ownerUserId && ownerUserId === requester.id) {
    return { allowed: true, ownerUserId };
  }

  const ownApplicationResult = await client.query(
    `SELECT a.user_id
     FROM applications a
     WHERE a.resume_url = $1
       AND a.user_id = $2
     LIMIT 1`,
    [normalizedResumeUrl, requester.id]
  );

  if (ownApplicationResult.rows.length) {
    return { allowed: true, ownerUserId: ownApplicationResult.rows[0].user_id };
  }

  if (requester.accountType === 'company' || requester.userType === 'company') {
    const companyResult = await client.query(
      `SELECT c.id
       FROM companies c
       WHERE c.user_id = $1
       LIMIT 1`,
      [requester.id]
    );

    const companyId = companyResult.rows[0]?.id || null;
    if (!companyId) {
      return { allowed: false };
    }

    const applicantResult = await client.query(
      `SELECT a.user_id
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.resume_url = $1
         AND j.company_id = $2
       LIMIT 1`,
      [normalizedResumeUrl, companyId]
    );

    if (applicantResult.rows.length) {
      return { allowed: true, ownerUserId: applicantResult.rows[0].user_id };
    }
  }

  return { allowed: false, ownerUserId };
};

// GET /api/developer/profile
const getMyDeveloperProfile = async (req, res) => {
  let client;
  try {
    await ensureBaseUserSchemaReady();
    await ensureOnboardingSchemaReady();
    client = await pool.connect();
    const result = await client.query(
      `SELECT u.id AS user_id,
              COALESCE(dp.full_name, u.name, u.username, '') AS full_name,
              COALESCE(dp.username, u.username, '') AS username,
              COALESCE(dp.location, u.address, '') AS location,
              COALESCE(dp.phone_number, u.phone, '') AS phone_number,
              COALESCE(dp.email, u.email, '') AS email,
              COALESCE(dp.job_title, '') AS job_title,
              dp.experience_years,
              COALESCE(dp.skills, ARRAY[]::text[]) AS skills,
              COALESCE(dp.preferred_it_role, u.desired_job, '') AS preferred_it_role,
              COALESCE(dp.education, u.education, '') AS education,
              COALESCE(dp.bio, u.bio, '') AS bio,
              COALESCE(dp.github_link, '') AS github_link,
              COALESCE(dp.portfolio_link, '') AS portfolio_link,
              COALESCE(dp.linkedin_link, '') AS linkedin_link,
              COALESCE(dp.resume_url, '') AS resume_url,
              COALESCE(dp.optimized_resume_docx_url, '') AS optimized_resume_docx_url,
              COALESCE(dp.optimized_resume_pdf_url, '') AS optimized_resume_pdf_url,
              COALESCE(dp.optimized_resume_json, '{}'::jsonb) AS optimized_resume_json,
              COALESCE(dp.profile_photo_url, u.profile_image, '') AS profile_photo_url,
              COALESCE(dp.other_links, '') AS other_links,
              COALESCE(dp.work_preference, '') AS work_preference,
              COALESCE(dp.certifications, '') AS certifications,
              COALESCE(dp.school_university, '') AS school_university,
              COALESCE(dp.created_at, CURRENT_TIMESTAMP) AS created_at,
              COALESCE(dp.updated_at, CURRENT_TIMESTAMP) AS updated_at
       FROM users u
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [req.user.id]
    );
    logProfileSync('settings-fetch-profile-response', {
      userId: req.user.id,
      profile: result.rows[0] || null,
    });
    return res.json({ success: true, profile: result.rows[0] || null });
  } catch (error) {
    logger.error('Get developer profile error:', error);
    return res.json({
      success: true,
      profile: null,
      warning: 'Developer profile is temporarily unavailable.',
      ...buildDevErrorMeta(error),
    });
  } finally {
    client?.release();
  }
};

// PUT /api/developer/profile
const upsertMyDeveloperProfile = async (req, res) => {
  let client;
  try {
    await ensureBaseUserSchemaReady();
    await ensureOnboardingSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const currentResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!currentResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const current = currentResult.rows[0];
    if (current.user_type !== 'employee') {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Developer account required' });
    }

    const body = req.body || {};
    logProfileSync('settings-save-request-body', {
      userId: req.user.id,
      body,
    });
    const requestedFullName = String(body.fullName || '').trim();
    const requestedUsername = String(body.username || '').trim();
    const location = String(body.location || '').trim();
    const requestedPhoneNumber = String(body.phoneNumber || '').trim();
    const requestedEmail = String(body.email || '').trim();
    const identityLocked = Boolean(
      String(current.name || '').trim() &&
      String(current.phone || '').trim() &&
      String(current.email || '').trim()
    );
    const fullName = identityLocked ? String(current.name || requestedFullName || '').trim() : requestedFullName;
    const username = identityLocked ? String(current.username || requestedUsername || '').trim() : requestedUsername;
    const phoneNumber = identityLocked ? String(current.phone || requestedPhoneNumber || '').trim() : requestedPhoneNumber;
    const email = identityLocked
      ? String(current.email || requestedEmail || '').trim()
      : String(requestedEmail || current.email || '').trim();
    const jobTitle = String(body.jobTitle || '').trim();
    const preferredRole = String(body.preferredRole || '').trim();
    const educationAttainment = String(body.educationAttainment || '').trim();
    const aboutMe = String(body.aboutMe || '').trim();

    if (!fullName || !username || !location || !phoneNumber || !email || !jobTitle || !preferredRole || !educationAttainment || !aboutMe) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Please fill in the required fields.' });
    }

    const years = body.yearsOfExperience == null || body.yearsOfExperience === '' ? null : Number(body.yearsOfExperience);
    const yearsOfExperience = Number.isFinite(years) ? Math.max(0, Math.trunc(years)) : null;
    const skills = normalizeSkills(body.skills);

    const github = String(body.github || '').trim();
    const portfolioWebsite = String(body.portfolioWebsite || '').trim();
    const linkedin = String(body.linkedin || '').trim();
    const otherLinks = String(body.otherLinks || '').trim();

    const socialsPayload = {
      github,
      portfolio: portfolioWebsite,
      linkedin,
      other: otherLinks,
    };
    const hasSocialLinks = Object.values(socialsPayload).some((value) => String(value || '').trim().length > 0);

    const nextProfileImage = body.profileImage ? String(body.profileImage) : '';
    const workPreference = String(body.workPreference || '').trim().toLowerCase();

    const userUpdateResult = await client.query(
      `UPDATE users
       SET username = $1,
           name = $2,
           address = $3,
           phone = $4,
           profile_image = CASE WHEN $5 = '' THEN profile_image ELSE $5 END,
           desired_job = $6,
           education = $7,
           bio = $8,
           socials = $9,
           account_type = COALESCE(account_type, 'developer'),
           profile_completed = true
       WHERE id = $10`,
      [
        username,
        fullName,
        location,
        phoneNumber,
        nextProfileImage,
        preferredRole || jobTitle,
        educationAttainment,
        aboutMe,
        hasSocialLinks ? JSON.stringify(socialsPayload) : '',
        req.user.id,
      ]
    );
    logProfileSync('settings-save-users-update-result', {
      rowCount: userUpdateResult.rowCount,
    });

    const profileUpsertResult = await client.query(
      `INSERT INTO developer_profiles (
         user_id,
         full_name,
         username,
         location,
         phone_number,
         email,
         job_title,
         experience_years,
         skills,
         preferred_it_role,
         education,
         bio,
         github_link,
         portfolio_link,
         linkedin_link,
         resume_url,
         profile_photo_url,
         other_links,
         work_preference,
         certifications,
         school_university,
         updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         username = EXCLUDED.username,
         location = EXCLUDED.location,
         phone_number = EXCLUDED.phone_number,
         email = EXCLUDED.email,
         job_title = EXCLUDED.job_title,
         experience_years = EXCLUDED.experience_years,
         skills = EXCLUDED.skills,
         preferred_it_role = EXCLUDED.preferred_it_role,
         education = EXCLUDED.education,
         bio = EXCLUDED.bio,
         github_link = EXCLUDED.github_link,
         portfolio_link = EXCLUDED.portfolio_link,
         linkedin_link = EXCLUDED.linkedin_link,
         resume_url = COALESCE(EXCLUDED.resume_url, developer_profiles.resume_url),
         profile_photo_url = EXCLUDED.profile_photo_url,
         other_links = EXCLUDED.other_links,
         work_preference = EXCLUDED.work_preference,
         certifications = EXCLUDED.certifications,
         school_university = EXCLUDED.school_university,
         updated_at = CURRENT_TIMESTAMP
       RETURNING user_id, full_name, username, location, phone_number, email, job_title, experience_years, skills, preferred_it_role, education, bio, github_link, portfolio_link, linkedin_link, resume_url, profile_photo_url, other_links, work_preference, certifications, school_university, created_at, updated_at`,
      [
        req.user.id,
        fullName,
        username,
        location,
        phoneNumber,
        email,
        jobTitle,
        yearsOfExperience,
        skills,
        preferredRole,
        educationAttainment,
        aboutMe,
        github || null,
        portfolioWebsite || null,
        linkedin || null,
        Object.prototype.hasOwnProperty.call(body, 'resume') ? (body.resume ? String(body.resume) : '') : null,
        nextProfileImage || null,
        otherLinks || null,
        workPreference || null,
        String(body.certifications || '').trim() || null,
        String(body.school || '').trim() || null,
      ]
    );
    logProfileSync('settings-save-developer-profiles-upsert-result', {
      rowCount: profileUpsertResult.rowCount,
      profile: profileUpsertResult.rows[0] || null,
    });

    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const savedProfile = profileUpsertResult.rows[0] || null;
    await client.query('COMMIT');
    logProfileSync('settings-save-response-user', {
      userId: req.user.id,
      user: serializeUser(userResult.rows[0]),
      profile: savedProfile,
    });

    return res.json({ success: true, user: serializeUser(userResult.rows[0]), profile: savedProfile });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    if (String(error?.code) === '23505') {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    logger.error('Upsert developer profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving profile' });
  } finally {
    client?.release();
  }
};

// POST /api/developer/resume
const uploadMyResume = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureOnboardingSchemaReady();

    const contentType = String(req.get('content-type') || '').toLowerCase().split(';')[0].trim();
    if (!ALLOWED_RESUME_CONTENT_TYPES.has(contentType)) {
      return res.status(400).json({ success: false, message: 'Resume upload must be a PDF, DOC, or DOCX file.' });
    }

    const originalName = String(req.get('x-upload-filename') || 'resume.pdf').trim();
    const stored = await storeResumeUpload({
      buffer: req.body,
      originalName,
      contentType,
    });
    const extractedText = await parseResumeText({
      absolutePath: stored.absolutePath,
      fileName: stored.originalName,
    }).catch(() => '');

    client = await pool.connect();
    const profileResult = await client.query(
      `SELECT resume_url
       FROM developer_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (profileResult.rows.length) {
      await client.query(
        `UPDATE developer_profiles
         SET resume_url = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [stored.url, req.user.id]
      );
    } else {
      await client.query(
        `INSERT INTO developer_profiles (user_id, resume_url, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           resume_url = EXCLUDED.resume_url,
           updated_at = CURRENT_TIMESTAMP`,
        [req.user.id, stored.url]
      );
    }

    return res.status(201).json({
      success: true,
      resumeUrl: stored.url,
      fileName: stored.originalName,
      size: stored.size,
      extractedTextPreview: String(extractedText || '').slice(0, 12000),
    });
  } catch (error) {
    logger.error('Upload resume error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error?.message || 'Server error while uploading resume.',
    });
  } finally {
    client?.release();
  }
};

// GET /api/developer/resumes/:storedName
const downloadResume = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureOnboardingSchemaReady();

    const storedName = String(req.params.storedName || '').trim();
    const absolutePath = getStoredResumePath(storedName);
    if (!absolutePath) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const resumeUrl = `/api/developer/resumes/${encodeURIComponent(storedName)}`;
    client = await pool.connect();
    const access = await getResumeAccessState(client, { requester: req.user, resumeUrl });

    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this resume.' });
    }

    await fsPromises.access(absolutePath);

    res.setHeader('Content-Type', getMimeTypeForStoredName(storedName));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Disposition', `inline; filename="${getResumeDownloadName(storedName)}"`);
    return res.sendFile(absolutePath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return res.status(404).json({ success: false, message: 'Resume file is no longer available.' });
    }

    logger.error('Download resume error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error?.message || 'Server error while downloading resume.',
    });
  } finally {
    client?.release();
  }
};

// POST /api/developer/ai/resume-analysis
const analyzeMyResume = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureOnboardingSchemaReady();
    client = await pool.connect();
    const plan = await getPremiumStateForUser(client, req.user.id);
    requirePremiumApplicantFeature(plan, 'ATS resume analysis');

    if (!isAiConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }

    const profileResult = await client.query(
      `SELECT u.id,
              COALESCE(dp.full_name, u.name, u.username) AS full_name,
              COALESCE(dp.preferred_it_role, u.desired_job, dp.job_title) AS preferred_role,
              COALESCE(dp.job_title, '') AS job_title,
              COALESCE(dp.bio, u.bio, '') AS bio,
              COALESCE(dp.resume_url, '') AS resume_url,
              COALESCE(dp.skills, ARRAY[]::text[]) AS skills,
              COALESCE(dp.location, u.address, '') AS location,
              COALESCE(dp.experience_years, 0) AS experience_years,
              COALESCE(dp.education, u.education, '') AS education,
              COALESCE(dp.certifications, '') AS certifications
       FROM users u
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (!profileResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Developer profile not found.' });
    }

    const profile = profileResult.rows[0];
    const analysis = await analyzeResumeProfile({
      id: profile.id,
      fullName: profile.full_name,
      preferredRole: profile.preferred_role,
      jobTitle: profile.job_title,
      bio: profile.bio,
      resumeText: [profile.bio, profile.education, profile.certifications].filter(Boolean).join('\n'),
      skills: profile.skills,
      location: profile.location,
      yearsOfExperience: profile.experience_years,
      education: profile.education,
      certifications: profile.certifications,
    });

    return res.json({ success: true, analysis: analysis.analysis || analysis });
  } catch (error) {
    logger.error('Analyze resume error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error?.message || 'Server error while analyzing resume.',
    });
  } finally {
    client?.release();
  }
};

// POST /api/developer/ai/resume-optimize
const optimizeMyResume = async (req, res) => {
  let client;
  try {
    await ensureBaseUserSchemaReady();
    await ensureOnboardingSchemaReady();
    client = await pool.connect();
    
    // Phase 5: Premium gating for AI optimization
    const plan = await getPremiumStateForUser(client, req.user.id);
    requirePremiumApplicantFeature(plan, 'ATS resume optimization');

    const profileResult = await client.query(
      `SELECT u.id,
              COALESCE(dp.full_name, u.name, u.username) AS full_name,
              COALESCE(dp.preferred_it_role, u.desired_job, dp.job_title) AS preferred_role,
              COALESCE(dp.resume_url, '') AS resume_url
       FROM users u
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [req.user.id]
    );
    if (!profileResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Developer profile not found.' });
    }

    const profile = profileResult.rows[0];
    const storedName = getStoredNameFromResumeUrl(profile.resume_url);
    if (!storedName) {
      return res.status(400).json({ success: false, message: 'Please upload your resume first.' });
    }
    const absolutePath = getStoredResumePath(storedName);
    if (!absolutePath) {
      return res.status(404).json({ success: false, message: 'Uploaded resume file was not found.' });
    }

    const resumeText = await parseResumeText({
      absolutePath,
      fileName: getResumeDownloadName(storedName),
    });
    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Resume text could not be extracted.' });
    }

    const optimized = await callGeminiForResume({
      resumeText,
      preferredRole: profile.preferred_role,
    });
    const docxBuffer = await buildDocxBuffer({
      fullName: profile.full_name,
      role: profile.preferred_role,
      structured: optimized,
    });
    const docxStored = await storeGeneratedResumeArtifact({
      buffer: docxBuffer,
      fileName: buildGeneratedFileName('ats-resume', '.docx'),
    });
    const converted = await convertDocxToPdf({
      docxAbsolutePath: docxStored.absolutePath,
      context: { userId: req.user.id, flow: 'developer_optimize' },
    });
    let pdfStored = null;
    let pdfSource = '';
    let warning = '';
    if (converted.ok && converted.buffer) {
      pdfStored = await storeGeneratedResumeArtifact({
        buffer: converted.buffer,
        fileName: buildGeneratedFileName('ats-resume', '.pdf'),
      });
      pdfSource = converted.provider || 'ilovepdf';
    } else {
      warning = 'ATS PDF conversion is currently unavailable. DOCX output was generated successfully.';
    }

    await client.query(
      `UPDATE developer_profiles
       SET optimized_resume_docx_url = $1,
           optimized_resume_pdf_url = $2,
           optimized_resume_json = $3::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4`,
      [docxStored.url, pdfStored?.url || null, JSON.stringify(optimized), req.user.id]
    );

    return res.json({
      success: true,
      optimized,
      optimizedDocxUrl: docxStored.url,
      optimizedPdfUrl: pdfStored?.url || '',
      pdfSource,
      warning,
      sourceResumeText: resumeText,
    });
  } catch (error) {
    logger.error('Optimize resume error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error?.message || 'Server error while optimizing resume.',
    });
  } finally {
    client?.release();
  }
};

// POST /api/developer/ai/resume-use-optimized
const useOptimizedResumeAsPrimary = async (req, res) => {
  let client;
  try {
    await ensureBaseUserSchemaReady();
    await ensureOnboardingSchemaReady();
    client = await pool.connect();

    const result = await client.query(
      `UPDATE developer_profiles
       SET resume_url = COALESCE(NULLIF(optimized_resume_pdf_url, ''), optimized_resume_docx_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
         AND (COALESCE(optimized_resume_pdf_url, '') <> '' OR COALESCE(optimized_resume_docx_url, '') <> '')
       RETURNING
         COALESCE(resume_url, '') AS resume_url,
         COALESCE(optimized_resume_pdf_url, '') AS optimized_resume_pdf_url,
         COALESCE(optimized_resume_docx_url, '') AS optimized_resume_docx_url`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Optimized ATS resume is not available yet. Please optimize your resume first.',
      });
    }

    return res.json({
      success: true,
      resumeUrl: String(result.rows[0]?.resume_url || ''),
      optimizedPdfUrl: String(result.rows[0]?.optimized_resume_pdf_url || ''),
      optimizedDocxUrl: String(result.rows[0]?.optimized_resume_docx_url || ''),
    });
  } catch (error) {
    logger.error('Use optimized resume error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error?.message || 'Server error while selecting optimized resume.',
    });
  } finally {
    client?.release();
  }
};

module.exports = {
  getMyDeveloperProfile,
  upsertMyDeveloperProfile,
  uploadMyResume,
  downloadResume,
  analyzeMyResume,
  optimizeMyResume,
  useOptimizedResumeAsPrimary,
};
