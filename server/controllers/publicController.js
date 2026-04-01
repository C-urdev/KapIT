const pool = require('../config/database');
const { ensureBaseUserSchemaReady, ensureHiringSchemaReady } = require('../config/runtimeSchema');

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const serializePublicJob = (row) => ({
  id: row.id,
  slug: `${row.id}-${slugify(row.title || 'job')}`,
  title: row.title || 'Untitled job',
  description: row.description || '',
  salary: row.salary || '',
  location: row.location || '',
  type: row.type || '',
  skills: Array.isArray(row.skills) ? row.skills : [],
  status: row.status || 'open',
  createdAt: row.created_at,
  company: {
    id: row.company_user_id || row.company_id,
    name: row.company_name || 'Company',
    logo: row.company_logo || '',
    description: row.company_description || '',
    location: row.company_location || '',
    website: row.company_website || '',
  },
});

const serializePublicCompany = (row) => ({
  id: row.user_id,
  companyId: row.company_id,
  username: row.username || '',
  email: '',
  type: 'company',
  accountType: 'company',
  isPremium: Boolean(row.is_premium),
  profileCompleted: true,
  profileImage: row.logo || row.profile_image || '',
  address: row.location || row.address || '',
  website: row.website || '',
  companyName: row.name || row.company_name || 'Company',
  shortDescription: row.short_description || '',
  bio: row.description || row.bio || '',
  relatedCompanies: [],
  jobListings: [],
});

const listPublicJobs = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();

    const result = await client.query(
      `SELECT j.id,
              j.company_id,
              j.title,
              j.description,
              j.salary,
              j.location,
              j.type,
              j.skills,
              j.status,
              j.created_at,
              c.user_id AS company_user_id,
              COALESCE(c.name, u.company_name, u.username, 'Company') AS company_name,
              COALESCE(c.logo, u.profile_image, '') AS company_logo,
              COALESCE(c.description, u.bio, '') AS company_description,
              COALESCE(c.location, u.address, '') AS company_location,
              COALESCE(c.website, u.website, '') AS company_website
       FROM jobs j
       LEFT JOIN companies c ON c.id = j.company_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE j.status = 'open'
         AND COALESCE(j.posting_payment_status, 'paid') = 'paid'
       ORDER BY j.created_at DESC
       LIMIT 100`
    );

    return res.json({
      success: true,
      jobs: result.rows.map(serializePublicJob),
    });
  } catch (error) {
    console.error('Public jobs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching public jobs.',
    });
  } finally {
    client?.release();
  }
};

const getPublicJobBySlug = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();

    const slug = String(req.params.slug || '').trim();
    const jobId = Number(slug.split('-')[0]);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid job slug.' });
    }

    const result = await client.query(
      `SELECT j.id,
              j.company_id,
              j.title,
              j.description,
              j.salary,
              j.location,
              j.type,
              j.skills,
              j.status,
              j.created_at,
              c.user_id AS company_user_id,
              COALESCE(c.name, u.company_name, u.username, 'Company') AS company_name,
              COALESCE(c.logo, u.profile_image, '') AS company_logo,
              COALESCE(c.description, u.bio, '') AS company_description,
              COALESCE(c.location, u.address, '') AS company_location,
              COALESCE(c.website, u.website, '') AS company_website
       FROM jobs j
       LEFT JOIN companies c ON c.id = j.company_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE j.id = $1
         AND j.status = 'open'
         AND COALESCE(j.posting_payment_status, 'paid') = 'paid'
       LIMIT 1`,
      [jobId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    return res.json({
      success: true,
      job: serializePublicJob(result.rows[0]),
    });
  } catch (error) {
    console.error('Public job detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching the job.',
    });
  } finally {
    client?.release();
  }
};

const getPublicCompanyProfile = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();

    const companyUserId = String(req.params.companyId || '').trim();
    const companyResult = await client.query(
      `SELECT c.id AS company_id,
              c.user_id,
              c.name,
              c.logo,
              c.short_description,
              c.description,
              c.location,
              c.website,
              u.username,
              u.company_name,
              u.profile_image,
              u.address,
              u.bio,
              u.is_premium
       FROM companies c
       JOIN users u ON u.id = c.user_id
       WHERE c.user_id = $1
       LIMIT 1`,
      [companyUserId]
    );

    if (!companyResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const company = serializePublicCompany(companyResult.rows[0]);

    const jobsResult = await client.query(
      `SELECT id, title, location, type, status, created_at
       FROM jobs
       WHERE company_id = $1
         AND COALESCE(posting_payment_status, 'paid') = 'paid'
       ORDER BY created_at DESC
       LIMIT 20`,
      [company.companyId]
    );

    company.jobListings = jobsResult.rows.map((row) => ({
      id: row.id,
      slug: `${row.id}-${slugify(row.title || 'job')}`,
      title: row.title || 'Untitled job',
      location: row.location || '',
      type: row.type || '',
      status: row.status || 'open',
      createdAt: row.created_at,
    }));

    return res.json({
      success: true,
      profile: company,
    });
  } catch (error) {
    console.error('Public company profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching the company profile.',
    });
  } finally {
    client?.release();
  }
};

module.exports = {
  listPublicJobs,
  getPublicJobBySlug,
  getPublicCompanyProfile,
};
