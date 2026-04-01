CREATE TABLE IF NOT EXISTS job_status_history (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  from_status VARCHAR(40),
  to_status VARCHAR(40) NOT NULL,
  reason VARCHAR(80),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS job_status_history_job_created_idx
ON job_status_history(job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS job_status_history_actor_created_idx
ON job_status_history(changed_by_user_id, created_at DESC);

INSERT INTO job_status_history (job_id, from_status, to_status, reason, metadata)
SELECT
  j.id,
  NULL,
  COALESCE(j.status, 'draft'),
  'baseline',
  jsonb_build_object('source', 'migration_202604020012')
FROM jobs j
WHERE NOT EXISTS (
  SELECT 1
  FROM job_status_history jsh
  WHERE jsh.job_id = j.id
);

CREATE TABLE IF NOT EXISTS application_status_history (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  from_status VARCHAR(40),
  to_status VARCHAR(40) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS application_status_history_application_created_idx
ON application_status_history(application_id, created_at DESC);

CREATE INDEX IF NOT EXISTS application_status_history_job_created_idx
ON application_status_history(job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS application_status_history_candidate_created_idx
ON application_status_history(candidate_user_id, created_at DESC);

INSERT INTO application_status_history (
  application_id,
  job_id,
  candidate_user_id,
  from_status,
  to_status,
  metadata
)
SELECT
  a.id,
  a.job_id,
  a.user_id,
  NULL,
  COALESCE(a.status, 'pending'),
  jsonb_build_object('source', 'migration_202604020012')
FROM applications a
WHERE NOT EXISTS (
  SELECT 1
  FROM application_status_history ash
  WHERE ash.application_id = a.id
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id TEXT NOT NULL,
  action VARCHAR(60) NOT NULL,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx
ON audit_logs(actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_entity_created_idx
ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_company_created_idx
ON audit_logs(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_request_id_idx
ON audit_logs(request_id)
WHERE request_id IS NOT NULL;
