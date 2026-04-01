const { Pool } = require('pg');
require('dotenv').config();

const createPoolFromUrl = (connectionString, sslEnabled = true) =>
  new Pool({
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  });

const getEmails = async (pool) => {
  const result = await pool.query(`
    SELECT LOWER(email) AS email, username, user_type
    FROM users
    WHERE email IS NOT NULL AND TRIM(email) <> ''
    ORDER BY LOWER(email) ASC
  `);

  return result.rows;
};

const main = async () => {
  const legacyUrl = process.env.LEGACY_DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL;

  if (!legacyUrl) throw new Error('Missing LEGACY_DATABASE_URL in .env');
  if (!targetUrl) throw new Error('Missing DATABASE_URL in .env');

  const sourcePool = createPoolFromUrl(legacyUrl, process.env.LEGACY_DB_SSL !== 'false');
  const targetPool = createPoolFromUrl(targetUrl, process.env.DB_SSL !== 'false');

  try {
    const [legacyRows, targetRows] = await Promise.all([
      getEmails(sourcePool),
      getEmails(targetPool),
    ]);

    const legacyMap = new Map(legacyRows.map((row) => [row.email, row]));
    const targetMap = new Map(targetRows.map((row) => [row.email, row]));

    const missingInSupabase = legacyRows.filter((row) => !targetMap.has(row.email));
    const onlyInSupabase = targetRows.filter((row) => !legacyMap.has(row.email));
    const inBoth = targetRows.filter((row) => legacyMap.has(row.email));

    console.log(
      JSON.stringify(
        {
          summary: {
            legacy_total: legacyRows.length,
            supabase_total: targetRows.length,
            shared_accounts: inBoth.length,
            missing_in_supabase: missingInSupabase.length,
            only_in_supabase: onlyInSupabase.length,
          },
          missingInSupabase,
          onlyInSupabase,
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