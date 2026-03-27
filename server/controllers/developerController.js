const pool = require('../config/database');
const { ensureBaseUserSchemaReady, ensureOnboardingSchemaReady } = require('../config/runtimeSchema');

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

const buildDevErrorMeta = (error) => (
  process.env.NODE_ENV !== 'production'
    ? {
        errorDetail: error?.message || String(error),
        errorCode: error?.code || '',
      }
    : {}
);

// GET /api/developer/profile
const getMyDeveloperProfile = async (req, res) => {
  let client;
  try {
    await ensureBaseUserSchemaReady();
    await ensureOnboardingSchemaReady();
    client = await pool.connect();
    const result = await client.query('SELECT * FROM developer_profiles WHERE user_id = $1', [req.user.id]);
    return res.json({ success: true, profile: result.rows[0] || null });
  } catch (error) {
    console.error('Get developer profile error:', error);
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
    const fullName = String(body.fullName || '').trim();
    const username = String(body.username || '').trim();
    const location = String(body.location || '').trim();
    const phoneNumber = String(body.phoneNumber || '').trim();
    const email = String(body.email || current.email || '').trim();
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

    const nextProfileImage = body.profileImage ? String(body.profileImage) : '';
    const resumeUrl = body.resume ? String(body.resume) : '';
    const workPreference = String(body.workPreference || '').trim().toLowerCase();

    await client.query(
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
        JSON.stringify(socialsPayload),
        req.user.id,
      ]
    );

    await client.query(
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
         resume_url = EXCLUDED.resume_url,
         profile_photo_url = EXCLUDED.profile_photo_url,
         other_links = EXCLUDED.other_links,
         work_preference = EXCLUDED.work_preference,
         certifications = EXCLUDED.certifications,
         school_university = EXCLUDED.school_university,
         updated_at = CURRENT_TIMESTAMP`,
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
        resumeUrl || null,
        nextProfileImage || null,
        otherLinks || null,
        workPreference || null,
        String(body.certifications || '').trim() || null,
        String(body.school || '').trim() || null,
      ]
    );

    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    await client.query('COMMIT');

    return res.json({ success: true, user: serializeUser(userResult.rows[0]) });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    if (String(error?.code) === '23505') {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    console.error('Upsert developer profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving profile' });
  } finally {
    client?.release();
  }
};

module.exports = {
  getMyDeveloperProfile,
  upsertMyDeveloperProfile,
};
