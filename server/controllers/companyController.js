const pool = require('../config/database');

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

const getOrCreateCompanyForUserId = async (client, userId) => {
  const existing = await client.query('SELECT * FROM companies WHERE user_id = $1', [userId]);
  if (existing.rows.length) {
    return existing.rows[0];
  }

  const userResult = await client.query('SELECT id, username, company_name, profile_image, bio, address, website FROM users WHERE id = $1', [
    userId,
  ]);
  if (!userResult.rows.length) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];
  const name = user.company_name || user.username || 'Company';

  const created = await client.query(
    `INSERT INTO companies (user_id, name, logo, description, location, website)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, name, user.profile_image || null, user.bio || null, user.address || null, user.website || null]
  );

  return created.rows[0];
};

const normalizeSkills = (skills) => {
  if (!skills) {
    return [];
  }
  if (Array.isArray(skills)) {
    return skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 30);
  }
  if (typeof skills === 'string') {
    return skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30);
  }
  return [];
};

// POST /api/company/jobs
const createJob = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const { title, description, salary, location, type, skills } = req.body || {};

    if (!String(title || '').trim() || !String(description || '').trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const normalizedSkills = normalizeSkills(skills);

    const result = await client.query(
      `INSERT INTO jobs (company_id, title, description, salary, location, type, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        company.id,
        String(title).trim(),
        String(description).trim(),
        salary ? String(salary).trim() : null,
        location ? String(location).trim() : null,
        type ? String(type).trim() : null,
        normalizedSkills,
      ]
    );

    await client.query('COMMIT');
    return res.status(201).json({ success: true, job: result.rows[0] });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Create job error:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating job' });
  } finally {
    client?.release();
  }
};

// GET /api/company/jobs
const getJobs = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const company = await getOrCreateCompanyForUserId(client, req.user.id);

    const result = await client.query(
      `SELECT j.*,
              COALESCE(app_counts.applicant_count, 0) AS applicant_count
       FROM jobs j
       LEFT JOIN (
         SELECT job_id, COUNT(*) AS applicant_count
         FROM applications
         GROUP BY job_id
       ) app_counts
       ON app_counts.job_id = j.id
       WHERE j.company_id = $1
       ORDER BY j.created_at DESC`,
      [company.id]
    );

    return res.json({ success: true, jobs: result.rows });
  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching jobs' });
  } finally {
    client?.release();
  }
};

// GET /api/company/applicants
const getApplicants = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const company = await getOrCreateCompanyForUserId(client, req.user.id);

    const result = await client.query(
      `SELECT a.id,
              a.status,
              a.resume_url,
              a.created_at,
              j.id AS job_id,
              j.title AS job_title,
              u.id AS user_id,
              u.username,
              u.email,
              u.desired_job,
              u.address,
              u.profile_image
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = a.user_id
       WHERE j.company_id = $1
       ORDER BY a.created_at DESC
       LIMIT 200`,
      [company.id]
    );

    const applicants = result.rows.map((row) => ({
      id: row.id,
      status: row.status,
      resumeUrl: row.resume_url || '',
      createdAt: row.created_at,
      job: { id: row.job_id, title: row.job_title },
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        desiredJob: row.desired_job || '',
        address: row.address || '',
        profileImage: row.profile_image || '',
      },
    }));

    return res.json({ success: true, applicants });
  } catch (error) {
    console.error('Get applicants error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching applicants' });
  } finally {
    client?.release();
  }
};

// GET /api/company/developers?q=...
const getDevelopers = async (req, res) => {
  let client;

  try {
    const q = String(req.query.q || '').trim();
    const skill = String(req.query.skill || '').trim();
    const location = String(req.query.location || '').trim();
    const minExperienceRaw = String(req.query.minExperience || '').trim();
    const minExperience = minExperienceRaw === '' ? null : Number(minExperienceRaw);

    client = await pool.connect();

    const conditions = [`u.user_type = 'employee'`, `u.profile_completed = true`];
    const values = [];

    if (q) {
      values.push(`%${q}%`);
      const idx = values.length;
      conditions.push(
        `(u.username ILIKE $${idx} OR u.email ILIKE $${idx} OR u.desired_job ILIKE $${idx} OR u.education ILIKE $${idx} OR u.address ILIKE $${idx} OR dp.full_name ILIKE $${idx} OR dp.job_title ILIKE $${idx} OR dp.preferred_it_role ILIKE $${idx})`
      );
    }

    if (location) {
      values.push(`%${location}%`);
      const idx = values.length;
      conditions.push(`(u.address ILIKE $${idx} OR dp.location ILIKE $${idx})`);
    }

    if (Number.isFinite(minExperience)) {
      values.push(Math.max(0, Math.trunc(minExperience)));
      const idx = values.length;
      conditions.push(`COALESCE(dp.experience_years, 0) >= $${idx}`);
    }

    if (skill) {
      values.push(`%${skill}%`);
      const idx = values.length;
      conditions.push(
        `EXISTS (SELECT 1 FROM unnest(COALESCE(dp.skills, ARRAY[]::TEXT[])) AS s WHERE s ILIKE $${idx})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await client.query(
      `SELECT u.id,
              u.username,
              u.email,
              u.desired_job,
              u.education,
              u.address,
              u.socials,
              u.profile_image,
              u.is_premium,
              dp.experience_years,
              dp.skills,
              COALESCE(dp.location, u.address) AS profile_location
       FROM users u
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       ${where}
       ORDER BY u.is_premium DESC, u.username ASC
       LIMIT 36`,
      values
    );

    const developers = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      desiredJob: row.desired_job || '',
      education: row.education || '',
      address: row.profile_location || row.address || '',
      socials: row.socials || '',
      profileImage: row.profile_image || '',
      isPremium: row.is_premium,
      experienceYears: row.experience_years == null ? null : row.experience_years,
      skills: Array.isArray(row.skills) ? row.skills : [],
    }));

    return res.json({ success: true, developers });
  } catch (error) {
    console.error('Get developers error:', error);
    return res.status(500).json({ success: false, message: 'Server error while searching developers' });
  } finally {
    client?.release();
  }
};

// GET /api/company/analytics
const getAnalytics = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const company = await getOrCreateCompanyForUserId(client, req.user.id);

    const jobsResult = await client.query('SELECT COUNT(*)::int AS count FROM jobs WHERE company_id = $1', [company.id]);
    const appsResult = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE j.company_id = $1`,
      [company.id]
    );

    const statusResult = await client.query(
      `SELECT a.status, COUNT(*)::int AS count
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE j.company_id = $1
       GROUP BY a.status`,
      [company.id]
    );

    const byStatus = {};
    statusResult.rows.forEach((row) => {
      byStatus[row.status] = row.count;
    });

    return res.json({
      success: true,
      analytics: {
        totalJobs: jobsResult.rows[0]?.count || 0,
        totalApplicants: appsResult.rows[0]?.count || 0,
        applicantsByStatus: byStatus,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching analytics' });
  } finally {
    client?.release();
  }
};

// PUT /api/company/profile
const updateCompanyProfile = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const { name, logo, description, location, website } = req.body || {};

    const nextName = String(name || '').trim();
    if (!nextName) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    const result = await client.query(
      `UPDATE companies
       SET name = $1,
           logo = $2,
           description = $3,
           location = $4,
           website = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        nextName,
        logo ? String(logo) : null,
        description ? String(description) : null,
        location ? String(location) : null,
        website ? String(website) : null,
        company.id,
      ]
    );

    // Mirror key fields into users table for public profile compatibility.
    await client.query(
      `UPDATE users
       SET company_name = $1,
           profile_image = COALESCE($2, profile_image),
           bio = COALESCE($3, bio),
           address = COALESCE($4, address),
           website = COALESCE($5, website)
       WHERE id = $6`,
      [nextName, logo ? String(logo) : null, description ? String(description) : null, location ? String(location) : null, website ? String(website) : null, req.user.id]
    );

    await client.query('COMMIT');
    return res.json({ success: true, company: result.rows[0] });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Update company profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating profile' });
  } finally {
    client?.release();
  }
};

// PUT /api/company/onboarding/profile
const updateCompanyOnboardingProfile = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const currentResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!currentResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const body = req.body || {};
    const companyName = String(body.companyName || '').trim();
    const industry = String(body.industry || '').trim();
    const companySize = String(body.companySize || '').trim();
    const location = String(body.location || '').trim();
    const website = String(body.website || '').trim();
    const description = String(body.description || '').trim();
    const logoUrl = body.logoUrl ? String(body.logoUrl) : '';
    const phoneNumber = String(body.phoneNumber || '').trim();

    if (!companyName || !industry || !companySize || !location) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Please fill in the required fields.' });
    }

    const company = await getOrCreateCompanyForUserId(client, req.user.id);

    const companyResult = await client.query(
      `UPDATE companies
       SET name = $1,
           logo = CASE WHEN $2 = '' THEN logo ELSE $2 END,
           description = $3,
           location = $4,
           website = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [companyName, logoUrl, description || null, location || null, website || null, company.id]
    );

    await client.query(
      `INSERT INTO company_profiles (
         user_id,
         company_name,
         industry,
         company_size,
         website,
         description,
         location,
         logo_url,
         updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         industry = EXCLUDED.industry,
         company_size = EXCLUDED.company_size,
         website = EXCLUDED.website,
         description = EXCLUDED.description,
         location = EXCLUDED.location,
         logo_url = EXCLUDED.logo_url,
         updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, companyName, industry, companySize, website || null, description || null, location || null, logoUrl || null]
    );

    const servicesNeeded = Array.isArray(body.servicesNeeded) ? body.servicesNeeded.map((s) => String(s).trim()).filter(Boolean).slice(0, 20) : [];

    await client.query(
      `UPDATE users
       SET company_name = $1,
           industry = $2,
           company_size = $3,
           website = $4,
           bio = $5,
           address = $6,
           profile_image = CASE WHEN $7 = '' THEN profile_image ELSE $7 END,
           phone = $8,
           hiring_for = $9,
           account_type = COALESCE(account_type, 'company'),
           profile_completed = true
       WHERE id = $10`,
      [
        companyName,
        industry,
        companySize,
        website || null,
        description || null,
        location || null,
        logoUrl,
        phoneNumber || null,
        servicesNeeded.join(', '),
        req.user.id,
      ]
    );

    const projectTitle = String(body.projectTitle || '').trim();
    const projectDescription = String(body.projectDescription || '').trim();
    const budgetRange = String(body.budgetRange || '').trim();
    const timeline = String(body.timeline || '').trim();

    let project = null;
    if (projectTitle && projectDescription) {
      const projectResult = await client.query(
        `INSERT INTO projects (company_id, title, description, budget, timeline, status)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [company.id, projectTitle, projectDescription, budgetRange || null, timeline || null, 'open']
      );
      project = projectResult.rows[0];
    }

    const nextUserResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

    await client.query('COMMIT');
    return res.json({
      success: true,
      user: serializeUser(nextUserResult.rows[0]),
      company: companyResult.rows[0],
      project,
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Update company onboarding profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving profile' });
  } finally {
    client?.release();
  }
};

module.exports = {
  createJob,
  getJobs,
  getApplicants,
  getDevelopers,
  getAnalytics,
  updateCompanyProfile,
  updateCompanyOnboardingProfile,
};
