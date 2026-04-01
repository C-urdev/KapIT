CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id),
  CHECK (source IN ('manual', 'recommendation', 'imported'))
);

CREATE INDEX IF NOT EXISTS saved_jobs_job_id_created_idx
ON saved_jobs(job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'general',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  subject VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  contact_email VARCHAR(255),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CHECK (category IN ('general', 'account', 'billing', 'job_posting', 'application', 'messaging', 'report')),
  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX IF NOT EXISTS support_requests_status_created_idx
ON support_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS support_requests_requester_created_idx
ON support_requests(requester_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS support_requests_company_created_idx
ON support_requests(related_company_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_support_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_support_requests_updated_at
    BEFORE UPDATE ON support_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  subject_job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  subject_conversation_message_id BIGINT REFERENCES conversation_messages(id) ON DELETE SET NULL,
  subject_legacy_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
  reason VARCHAR(40) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CHECK (reason IN ('spam', 'harassment', 'fraud', 'impersonation', 'inappropriate_content', 'other')),
  CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  CHECK (num_nonnulls(subject_user_id, subject_company_id, subject_job_id, subject_conversation_message_id, subject_legacy_message_id) >= 1)
);

CREATE INDEX IF NOT EXISTS moderation_reports_status_created_idx
ON moderation_reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_reports_reporter_created_idx
ON moderation_reports(reporter_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_reports_subject_user_created_idx
ON moderation_reports(subject_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_reports_subject_company_created_idx
ON moderation_reports(subject_company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_reports_subject_job_created_idx
ON moderation_reports(subject_job_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_moderation_reports_updated_at'
  ) THEN
    CREATE TRIGGER update_moderation_reports_updated_at
    BEFORE UPDATE ON moderation_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
