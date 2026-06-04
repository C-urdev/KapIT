BEGIN;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_applications_resume_id ON applications(resume_id);

COMMIT;
