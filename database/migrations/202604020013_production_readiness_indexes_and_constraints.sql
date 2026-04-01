DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_filled_application_id_fkey'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_filled_application_id_fkey
      FOREIGN KEY (filled_application_id) REFERENCES applications(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_status_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_status_check
      CHECK (status IN ('draft', 'open', 'filled', 'closed')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_status_check'
  ) THEN
    ALTER TABLE applications
      ADD CONSTRAINT applications_status_check
      CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected', 'withdrawn')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_post_payments_status_check'
  ) THEN
    ALTER TABLE job_post_payments
      ADD CONSTRAINT job_post_payments_status_check
      CHECK (status IN ('pending', 'processing', 'paid', 'cancelled', 'failed', 'refunded')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_pay_per_use_status_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_pay_per_use_status_check
      CHECK (pay_per_use_status IN ('not_due', 'due', 'paid', 'waived')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_posting_payment_status_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_posting_payment_status_check
      CHECK (posting_payment_status IN ('pending', 'paid', 'waived', 'refunded', 'failed', 'cancelled')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversations_type_check'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_type_check
      CHECK (conversation_type IN ('direct', 'group', 'support')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversation_messages_type_check'
  ) THEN
    ALTER TABLE conversation_messages
      ADD CONSTRAINT conversation_messages_type_check
      CHECK (message_type IN ('text', 'system', 'attachment')) NOT VALID;
  END IF;
END
$$;

ALTER TABLE jobs VALIDATE CONSTRAINT jobs_status_check;
ALTER TABLE applications VALIDATE CONSTRAINT applications_status_check;
ALTER TABLE job_post_payments VALIDATE CONSTRAINT job_post_payments_status_check;
ALTER TABLE jobs VALIDATE CONSTRAINT jobs_pay_per_use_status_check;
ALTER TABLE jobs VALIDATE CONSTRAINT jobs_posting_payment_status_check;
ALTER TABLE conversations VALIDATE CONSTRAINT conversations_type_check;
ALTER TABLE conversation_messages VALIDATE CONSTRAINT conversation_messages_type_check;

CREATE UNIQUE INDEX IF NOT EXISTS applications_job_id_user_id_key
ON applications(job_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS auth_refresh_sessions_token_hash_key
ON auth_refresh_sessions(token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_post_payments_provider_payment
ON job_post_payments(provider, provider_payment_id)
WHERE provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_public_feed
ON jobs(posting_payment_status, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_job_status_created
ON applications(job_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_user_status_created
ON applications(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_actor_type_created
ON notifications(user_id, actor_user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_active_until
ON jobs(active_until)
WHERE active_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_skills_gin
ON jobs USING GIN (skills);

CREATE INDEX IF NOT EXISTS idx_developer_profiles_skills_gin
ON developer_profiles USING GIN (skills);

CREATE INDEX IF NOT EXISTS idx_users_username_trgm
ON users USING GIN (username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_email_trgm
ON users USING GIN (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_company_name_trgm
ON users USING GIN (company_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_desired_job_trgm
ON users USING GIN (desired_job gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_developer_profiles_full_name_trgm
ON developer_profiles USING GIN (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_developer_profiles_job_title_trgm
ON developer_profiles USING GIN (job_title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_developer_profiles_preferred_role_trgm
ON developer_profiles USING GIN (preferred_it_role gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_companies_name_trgm
ON companies USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm
ON jobs USING GIN (title gin_trgm_ops);
