ALTER TABLE developer_profiles
  ADD COLUMN IF NOT EXISTS preferred_it_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS other_links TEXT,
  ADD COLUMN IF NOT EXISTS work_preference VARCHAR(20),
  ADD COLUMN IF NOT EXISTS actively_looking BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS role_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS job_priorities TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS salary_expectation_min INTEGER,
  ADD COLUMN IF NOT EXISTS salary_expectation_max INTEGER,
  ADD COLUMN IF NOT EXISTS job_search_goal VARCHAR(80),
  ADD COLUMN IF NOT EXISTS experience_level VARCHAR(40),
  ADD COLUMN IF NOT EXISTS certifications TEXT,
  ADD COLUMN IF NOT EXISTS school_university TEXT;
