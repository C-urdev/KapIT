BEGIN;

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_type TEXT NOT NULL CHECK (resume_type IN ('original', 'ats_optimized')),
  source_resume_id UUID NULL REFERENCES resumes(id) ON DELETE SET NULL,
  original_filename TEXT NOT NULL DEFAULT '',
  storage_provider TEXT NOT NULL DEFAULT 'local',
  pdf_url TEXT,
  docx_url TEXT,
  extracted_text TEXT,
  ats_score INTEGER CHECK (ats_score BETWEEN 0 AND 100),
  ats_data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  visibility_scope TEXT NOT NULL DEFAULT 'private' CHECK (visibility_scope IN ('private', 'applications_only', 'public_profile')),
  processing_status TEXT NOT NULL DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'archived')),
  processing_error TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resume_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('ats_optimize')),
  current_step TEXT NOT NULL DEFAULT 'queued',
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  result_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_created ON resumes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_user_type ON resumes(user_id, resume_type);
CREATE INDEX IF NOT EXISTS idx_resumes_public ON resumes(is_public, visibility_scope) WHERE archived_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_resumes_user_primary_active ON resumes(user_id) WHERE is_primary = TRUE AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_resume_jobs_user_created ON resume_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_jobs_status ON resume_jobs(status, created_at DESC);

COMMIT;
