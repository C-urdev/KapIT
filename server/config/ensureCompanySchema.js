const pool = require('./database');

const ensureCompanySchema = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(160) NOT NULL,
        logo TEXT,
        description TEXT,
        location TEXT,
        website TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id BIGSERIAL PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        salary VARCHAR(120),
        location VARCHAR(200),
        type VARCHAR(60),
        skills TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id BIGSERIAL PRIMARY KEY,
        job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(40) DEFAULT 'pending',
        resume_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_company_id_created ON jobs(company_id, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_apps_job_id_created ON applications(job_id, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_apps_user_id_created ON applications(user_id, created_at DESC);');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Company schema bootstrap failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { ensureCompanySchema };

