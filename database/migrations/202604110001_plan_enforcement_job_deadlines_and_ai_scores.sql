ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline
ON jobs(application_deadline)
WHERE application_deadline IS NOT NULL;

CREATE TABLE IF NOT EXISTS job_match_scores (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_percentage INTEGER NOT NULL DEFAULT 0,
  ats_score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id),
  CHECK (match_percentage >= 0 AND match_percentage <= 100),
  CHECK (ats_score >= 0 AND ats_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_job_match_scores_job_updated
ON job_match_scores(job_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS applicant_ai_scores (
  application_id BIGINT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_percentage INTEGER NOT NULL DEFAULT 0,
  ats_score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (match_percentage >= 0 AND match_percentage <= 100),
  CHECK (ats_score >= 0 AND ats_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_applicant_ai_scores_job_updated
ON applicant_ai_scores(job_id, updated_at DESC);
