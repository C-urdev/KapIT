const pool = require('./database');

const ensureUsersProfileSchema = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        auth_provider VARCHAR(50) DEFAULT 'local',
        google_id VARCHAR(255) UNIQUE,
        github_id VARCHAR(255) UNIQUE,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employee', 'company')),
        account_type VARCHAR(20) NOT NULL DEFAULT 'developer' CHECK (account_type IN ('developer', 'company')),
        is_premium BOOLEAN DEFAULT false,
        terms_accepted BOOLEAN DEFAULT false,
        terms_accepted_at TIMESTAMP,
        profile_completed BOOLEAN DEFAULT false,
        bio TEXT,
        socials TEXT,
        profile_image TEXT,
        phone VARCHAR(40),
        address TEXT,
        name VARCHAR(120),
        education VARCHAR(120),
        vocational_course VARCHAR(160),
        desired_job VARCHAR(120),
        birthday DATE,
        age INTEGER,
        sex VARCHAR(12),
        company_name VARCHAR(160),
        industry VARCHAR(160),
        company_size VARCHAR(40),
        website TEXT,
        hiring_for TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
        ADD COLUMN IF NOT EXISTS hiring_for TEXT,
        ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local',
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS github_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await client.query(`
      ALTER TABLE users
        ALTER COLUMN password DROP NOT NULL;
    `);

    await client.query(`
      ALTER TABLE users
        ALTER COLUMN account_type SET DEFAULT 'developer';
    `);

    await client.query(`
      UPDATE users
      SET account_type = CASE WHEN user_type = 'company' THEN 'company' ELSE 'developer' END
      WHERE account_type IS NULL;
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'update_users_updated_at'
        ) THEN
          CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);');

    await client.query(`
      CREATE OR REPLACE VIEW developer_signup_accounts AS
      SELECT
        id,
        username,
        email,
        user_type,
        account_type,
        is_premium,
        profile_completed,
        name,
        education,
        desired_job,
        phone,
        address,
        created_at,
        updated_at
      FROM users
      WHERE account_type = 'developer' OR user_type = 'employee';
    `);

    await client.query(`
      CREATE OR REPLACE VIEW company_signup_accounts AS
      SELECT
        id,
        username,
        email,
        user_type,
        account_type,
        is_premium,
        profile_completed,
        company_name,
        industry,
        company_size,
        website,
        hiring_for,
        phone,
        address,
        created_at,
        updated_at
      FROM users
      WHERE account_type = 'company' OR user_type = 'company';
    `);

    await client.query(`
      CREATE OR REPLACE VIEW company_accounts_overview AS
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        u.user_type,
        u.account_type,
        u.created_at AS user_created_at,
        c.id AS company_id,
        c.name AS company_record_name,
        c.created_at AS company_created_at
      FROM users u
      LEFT JOIN companies c ON c.user_id = u.id
      WHERE u.account_type = 'company' OR u.user_type = 'company'
      ORDER BY u.created_at DESC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW developer_accounts_overview AS
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        u.user_type,
        u.account_type,
        u.created_at AS user_created_at
      FROM users u
      WHERE u.account_type = 'developer' OR u.user_type = 'employee'
      ORDER BY u.created_at DESC;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contact_name VARCHAR(120) NOT NULL,
        sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('me', 'them')),
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_user_contact_time
      ON messages(user_id, contact_name, created_at);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_premium_payments (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(20) NOT NULL,
        payment_context VARCHAR(40) NOT NULL DEFAULT 'user_premium',
        currency VARCHAR(8) NOT NULL DEFAULT 'PHP',
        amount INTEGER NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'pending',
        plan_id VARCHAR(40) NOT NULL,
        plan_label VARCHAR(80) NOT NULL,
        plan_duration VARCHAR(60) NOT NULL,
        plan_duration_days INTEGER NOT NULL,
        provider_checkout_id VARCHAR(255),
        provider_payment_id VARCHAR(255),
        payer_email VARCHAR(255),
        provider_payload JSONB,
        paid_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_user_premium_payments_user_created ON user_premium_payments(user_id, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_premium_payments_status_created ON user_premium_payments(status, created_at DESC);');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_premium_payments_provider_checkout ON user_premium_payments(provider, provider_checkout_id) WHERE provider_checkout_id IS NOT NULL;');

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
