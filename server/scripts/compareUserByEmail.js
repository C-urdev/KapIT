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

const summarizeUser = (row) => {
  if (!row) return null;

  const password = String(row.password || '');
  return {
    id: row.id || null,
    username: row.username || '',
    email: row.email || '',
    user_type: row.user_type || '',
    account_type: row.account_type || '',
    profile_completed: Boolean(row.profile_completed),
    is_premium: Boolean(row.is_premium),
    password_prefix: password.slice(0, 12),
    password_length: password.length,
    password_kind: /^\$2[aby]\$\d{2}\$/.test(password) ? 'bcrypt' : password ? 'legacy-or-plain' : 'empty',
  };
};

const findUserByEmail = async (pool, email) => {
  const columns = await getExistingColumns(pool, 'users');
  const optionalColumns = ['id', 'account_type', 'profile_completed', 'is_premium'];
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

const main = async () => {
  const email = String(process.argv[2] || '').trim();
  if (!email) {
    throw new Error('Usage: node server/scripts/compareUserByEmail.js <email>');
  }

  const legacyUrl = process.env.LEGACY_DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL;

  if (!legacyUrl) throw new Error('Missing LEGACY_DATABASE_URL in .env');
  if (!targetUrl) throw new Error('Missing DATABASE_URL in .env');

  const sourcePool = createPoolFromUrl(legacyUrl, process.env.LEGACY_DB_SSL !== 'false');
  const targetPool = createPoolFromUrl(targetUrl, process.env.DB_SSL !== 'false');

  try {
    const [legacyUser, targetUser] = await Promise.all([
      findUserByEmail(sourcePool, email),
      findUserByEmail(targetPool, email),
    ]);

    console.log(
      JSON.stringify(
        {
          email,
          legacy: summarizeUser(legacyUser),
          supabase: summarizeUser(targetUser),
          diagnosis: {
            exists_only_in_legacy: Boolean(legacyUser && !targetUser),
            exists_only_in_supabase: Boolean(!legacyUser && targetUser),
            missing_in_both: Boolean(!legacyUser && !targetUser),
            password_differs:
              Boolean(legacyUser && targetUser) && String(legacyUser.password || '') !== String(targetUser.password || ''),
          },
        },
        null,
        2
      )
    );
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});