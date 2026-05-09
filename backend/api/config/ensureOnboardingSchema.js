const pool = require('./database');

const ensureOnboardingSchema = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS developer_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(160),
        username VARCHAR(50),
        location TEXT,
        phone_number VARCHAR(40),
        email VARCHAR(255),
        job_title VARCHAR(160),
        experience_years INTEGER,
        skills TEXT[] DEFAULT ARRAY[]::TEXT[],
        preferred_it_role VARCHAR(160),
        education TEXT,
        bio TEXT,
        github_link TEXT,
        portfolio_link TEXT,
        linkedin_link TEXT,
        resume_url TEXT,
        profile_photo_url TEXT,
        other_links TEXT,
        work_preference VARCHAR(20),
        certifications TEXT,
        school_university TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS company_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(160),
        industry VARCHAR(160),
        company_size VARCHAR(40),
        website TEXT,
        description TEXT,
        location TEXT,
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        project_id BIGSERIAL PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        budget VARCHAR(120),
        timeline VARCHAR(120),
        status VARCHAR(40) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS company_related_companies (
        id BIGSERIAL PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(160) NOT NULL,
        short_description VARCHAR(220),
        website TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_dev_profiles_experience ON developer_profiles(experience_years);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_dev_profiles_location ON developer_profiles(location);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_company_profiles_industry ON company_profiles(industry);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_projects_company_id_created ON projects(company_id, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_company_related_company_id_created ON company_related_companies(company_id, created_at DESC);');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Onboarding schema bootstrap failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { ensureOnboardingSchema };
