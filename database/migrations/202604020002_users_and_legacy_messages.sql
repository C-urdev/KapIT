CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employee', 'company')),
  account_type VARCHAR(20) NOT NULL DEFAULT 'developer' CHECK (account_type IN ('developer', 'company')),
  is_premium BOOLEAN DEFAULT FALSE,
  profile_completed BOOLEAN DEFAULT FALSE,
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

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
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
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users
  ALTER COLUMN account_type SET DEFAULT 'developer';

UPDATE users
SET account_type = CASE
  WHEN user_type = 'company' THEN 'company'
  ELSE 'developer'
END
WHERE account_type IS NULL;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);

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

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(120) NOT NULL,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('me', 'them')),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_user_contact_time
ON messages(user_id, contact_name, created_at);
