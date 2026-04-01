const { Pool } = require('pg');
require('dotenv').config();

const createPoolFromUrl = (connectionString, sslEnabled = true) =>
  new Pool({
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  });

const getExistingColumns = async (pool, tableName) => {
  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );

  return new Set(result.rows.map((row) => row.column_name));
};

const normalizeUser = (row) => ({
  username: row.username,
  email: row.email,
  password: row.password,
  user_type: row.user_type || 'employee',
  account_type: row.account_type || (row.user_type === 'company' ? 'company' : 'developer'),
  is_premium: row.is_premium ?? false,
  profile_completed: row.profile_completed ?? false,
  bio: row.bio || null,
  socials: row.socials || null,
  profile_image: row.profile_image || null,
  phone: row.phone || null,
  address: row.address || null,
  name: row.name || null,
  education: row.education || null,
  vocational_course: row.vocational_course || null,
  desired_job: row.desired_job || null,
  birthday: row.birthday || null,
  age: row.age ?? null,
  sex: row.sex || null,
  company_name: row.company_name || null,
  industry: row.industry || null,
  company_size: row.company_size || null,
  website: row.website || null,
  hiring_for: row.hiring_for || null,
});

const findUserByEmail = async (pool, email) => {
  const columns = await getExistingColumns(pool, 'users');
  const optionalColumns = [
    'account_type',
    'profile_completed',
    'is_premium',
    'bio',
    'socials',
    'profile_image',
    'phone',
    'address',
    'name',
    'education',
    'vocational_course',
    'desired_job',
    'birthday',
    'age',
    'sex',
    'company_name',
    'industry',
    'company_size',
    'website',
    'hiring_for'
  ];
  const selectedColumns = ['username', 'email', 'password', 'user_type'];

  for (const column of optionalColumns) {
    if (columns.has(column)) {
      selectedColumns.push(column);
    }
  }

  const result = await pool.query(
    `SELECT ${selectedColumns.join(', ')}
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email]
  );

  return result.rows[0] || null;
};

const upsertUser = async (pool, user) => {
  await pool.query(
    `INSERT INTO users (
      username, email, password, user_type, account_type, is_premium, profile_completed,
      bio, socials, profile_image, phone, address, name, education, vocational_course,
      desired_job, birthday, age, sex, company_name, industry, company_size, website, hiring_for
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
    )
    ON CONFLICT (email) DO UPDATE SET
      username = EXCLUDED.username,
      password = EXCLUDED.password,
      user_type = EXCLUDED.user_type,
      account_type = EXCLUDED.account_type,
      is_premium = EXCLUDED.is_premium,
      profile_completed = EXCLUDED.profile_completed,
      bio = EXCLUDED.bio,
      socials = EXCLUDED.socials,
      profile_image = EXCLUDED.profile_image,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      name = EXCLUDED.name,
      education = EXCLUDED.education,
      vocational_course = EXCLUDED.vocational_course,
      desired_job = EXCLUDED.desired_job,
      birthday = EXCLUDED.birthday,
      age = EXCLUDED.age,
      sex = EXCLUDED.sex,
      company_name = EXCLUDED.company_name,
      industry = EXCLUDED.industry,
      company_size = EXCLUDED.company_size,
      website = EXCLUDED.website,
      hiring_for = EXCLUDED.hiring_for`,
    [
      user.username,
      user.email,
      user.password,
      user.user_type,
      user.account_type,
      user.is_premium,
      user.profile_completed,
      user.bio,
      user.socials,
      user.profile_image,
      user.phone,
      user.address,
      user.name,
      user.education,
      user.vocational_course,
      user.desired_job,
      user.birthday,
      user.age,
      user.sex,
      user.company_name,
      user.industry,
      user.company_size,
      user.website,
      user.hiring_for,
    ]
  );
};

const main = async () => {
  const email = String(process.argv[2] || '').trim();
  if (!email) {
    throw new Error('Usage: node server/scripts/migrateOneLegacyUser.js <email>');
  }

  const legacyUrl = process.env.LEGACY_DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL;

  if (!legacyUrl) throw new Error('Missing LEGACY_DATABASE_URL in .env');
  if (!targetUrl) throw new Error('Missing DATABASE_URL in .env');

  const sourcePool = createPoolFromUrl(legacyUrl, process.env.LEGACY_DB_SSL !== 'false');
  const targetPool = createPoolFromUrl(targetUrl, process.env.DB_SSL !== 'false');

  try {
    const legacyUser = await findUserByEmail(sourcePool, email);
    if (!legacyUser) {
      throw new Error(`No legacy user found for ${email}`);
    }

    await upsertUser(targetPool, normalizeUser(legacyUser));
    console.log(`Migrated ${email} from legacy database to Supabase.`);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});