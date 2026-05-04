const pool = require('./database');

const ensureCompanySchema = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY,
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(160) NOT NULL,
        logo TEXT,
        short_description VARCHAR(220),
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
        experience_level VARCHAR(20),
        work_preference VARCHAR(40),
        skills TEXT[] DEFAULT ARRAY[]::TEXT[],
        status VARCHAR(40) NOT NULL DEFAULT 'open',
        closed_reason VARCHAR(80),
        pay_per_use_fee INTEGER NOT NULL DEFAULT 1599,
        pay_per_use_status VARCHAR(40) NOT NULL DEFAULT 'not_due',
        reopened_from_job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
        filled_application_id BIGINT,
        filled_candidate_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        posting_payment_status VARCHAR(40) NOT NULL DEFAULT 'paid',
        posting_plan_id VARCHAR(40),
        posting_plan_duration VARCHAR(60),
        posting_plan_duration_days INTEGER,
        posting_plan_price INTEGER NOT NULL DEFAULT 1599,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        active_until TIMESTAMP,
        application_deadline TIMESTAMPTZ,
        hires_needed INTEGER NOT NULL DEFAULT 1,
        closed_at TIMESTAMP,
        hired_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS job_post_payments (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
        provider VARCHAR(20) NOT NULL,
        payment_context VARCHAR(40) NOT NULL DEFAULT 'job_post',
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
        draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        provider_payload JSONB,
        paid_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id BIGSERIAL PRIMARY KEY,
        job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(40) DEFAULT 'pending',
        resume_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_jobs (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        source VARCHAR(30) NOT NULL DEFAULT 'manual',
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, job_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS job_match_scores (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        match_percentage INTEGER NOT NULL DEFAULT 0,
        ats_score INTEGER NOT NULL DEFAULT 0,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, job_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applicant_ai_scores (
        application_id BIGINT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
        job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        match_percentage INTEGER NOT NULL DEFAULT 0,
        ats_score INTEGER NOT NULL DEFAULT 0,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query("ALTER TABLE companies ADD COLUMN IF NOT EXISTS short_description VARCHAR(220);");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'open';");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS closed_reason VARCHAR(80);");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pay_per_use_fee INTEGER NOT NULL DEFAULT 1599;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20);");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_preference VARCHAR(40);");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pay_per_use_status VARCHAR(40) NOT NULL DEFAULT 'not_due';");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS reopened_from_job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS filled_application_id BIGINT;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS filled_candidate_user_id UUID REFERENCES users(id) ON DELETE SET NULL;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posting_payment_status VARCHAR(40) NOT NULL DEFAULT 'paid';");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posting_payment_id UUID REFERENCES job_post_payments(id) ON DELETE SET NULL;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posting_plan_id VARCHAR(40);");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posting_plan_duration VARCHAR(60);");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posting_plan_duration_days INTEGER;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posting_plan_price INTEGER NOT NULL DEFAULT 1599;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS active_until TIMESTAMP;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hires_needed INTEGER NOT NULL DEFAULT 1;");
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'jobs_hires_needed_check'
        ) THEN
          ALTER TABLE jobs
          ADD CONSTRAINT jobs_hires_needed_check
          CHECK (hires_needed >= 1 AND hires_needed <= 50);
        END IF;
      END$$;
    `);
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;");
    await client.query("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hired_at TIMESTAMP;");
    await client.query("ALTER TABLE applications ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'pending';");
    await client.query("ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_url TEXT;");
    await client.query("ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");

    await client.query('CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_company_id_created ON jobs(company_id, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_company_id_status_created ON jobs(company_id, status, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_payment_status_created ON jobs(posting_payment_status, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_active_until ON jobs(active_until) WHERE active_until IS NOT NULL;');
    await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline ON jobs(application_deadline) WHERE application_deadline IS NOT NULL;');
    await client.query('CREATE INDEX IF NOT EXISTS idx_job_post_payments_company_created ON job_post_payments(company_id, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_job_post_payments_status_created ON job_post_payments(status, created_at DESC);');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_job_post_payments_provider_checkout ON job_post_payments(provider, provider_checkout_id) WHERE provider_checkout_id IS NOT NULL;');
    await client.query('CREATE INDEX IF NOT EXISTS idx_apps_job_id_created ON applications(job_id, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_apps_user_id_created ON applications(user_id, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_created ON saved_jobs(job_id, created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_job_match_scores_job_updated ON job_match_scores(job_id, updated_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_applicant_ai_scores_job_updated ON applicant_ai_scores(job_id, updated_at DESC);');

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



