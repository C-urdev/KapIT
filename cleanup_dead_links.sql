-- kapIT Database Cleanup Script
-- This script removes dead local file paths and massive Base64 strings from the database
-- before transitioning to Cloudflare R2 object storage.

BEGIN;

-- 1. Remove dead local resume paths from the 'resumes' table
-- Since local files are lost on server restart in staging, we clear them out.
UPDATE resumes 
SET pdf_url = NULL, 
    docx_url = NULL,
    processing_status = 'archived',
    archived_at = CURRENT_TIMESTAMP
WHERE storage_provider = 'local' 
  AND archived_at IS NULL;

-- 2. Remove Base64 profile images from 'users' table
-- Base64 strings start with 'data:image/' and bloat the database.
UPDATE users 
SET profile_image = '' 
WHERE profile_image LIKE 'data:image/%';

-- 3. Remove Base64 profile images from 'developer_profiles' table
UPDATE developer_profiles
SET profile_photo_url = ''
WHERE profile_photo_url LIKE 'data:image/%';

-- 4. Remove Base64 profile images from 'companies' table
UPDATE companies
SET logo = ''
WHERE logo LIKE 'data:image/%';

COMMIT;
