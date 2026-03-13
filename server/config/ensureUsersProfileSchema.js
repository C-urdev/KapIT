const pool = require('./database');

const ensureUsersProfileSchema = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS account_type VARCHAR(20),
        ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS socials TEXT,
        ADD COLUMN IF NOT EXISTS profile_image TEXT,
        ADD COLUMN IF NOT EXISTS phone VARCHAR(40),
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS name VARCHAR(120),
        ADD COLUMN IF NOT EXISTS education VARCHAR(120),
        ADD COLUMN IF NOT EXISTS vocational_course VARCHAR(160),
        ADD COLUMN IF NOT EXISTS desired_job VARCHAR(120),
        ADD COLUMN IF NOT EXISTS birthday DATE,
        ADD COLUMN IF NOT EXISTS age INTEGER,
        ADD COLUMN IF NOT EXISTS sex VARCHAR(12),
        ADD COLUMN IF NOT EXISTS company_name VARCHAR(160),
        ADD COLUMN IF NOT EXISTS industry VARCHAR(160),
        ADD COLUMN IF NOT EXISTS company_size VARCHAR(40),
        ADD COLUMN IF NOT EXISTS website TEXT,
        ADD COLUMN IF NOT EXISTS hiring_for TEXT;
    `);

    await client.query(`
      UPDATE users
      SET account_type = CASE WHEN user_type = 'company' THEN 'company' ELSE 'developer' END
      WHERE account_type IS NULL;
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Schema bootstrap failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { ensureUsersProfileSchema };
