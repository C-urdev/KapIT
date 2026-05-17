ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE companies c
SET user_id = u.id
FROM users u
WHERE c.user_id IS NULL
  AND (u.user_type = 'company' OR u.account_type = 'company')
  AND LOWER(TRIM(BOTH FROM COALESCE(c.name, ''))) = LOWER(
    TRIM(BOTH FROM COALESCE(NULLIF(u.company_name, ''), NULLIF(u.username, ''), 'Company'))
  )
  AND NOT EXISTS (
    SELECT 1
    FROM companies existing
    WHERE existing.user_id = u.id
  );

INSERT INTO companies (id, user_id, name, logo, description, location, website)
SELECT
  gen_random_uuid(),
  u.id,
  COALESCE(NULLIF(TRIM(BOTH FROM u.company_name), ''), NULLIF(TRIM(BOTH FROM u.username), ''), 'Company'),
  NULLIF(TRIM(BOTH FROM u.profile_image), ''),
  NULLIF(TRIM(BOTH FROM u.bio), ''),
  NULLIF(TRIM(BOTH FROM u.address), ''),
  NULLIF(TRIM(BOTH FROM u.website), '')
FROM users u
WHERE (u.user_type = 'company' OR u.account_type = 'company')
  AND NOT EXISTS (
    SELECT 1
    FROM companies c
    WHERE c.user_id = u.id
  );

UPDATE companies c
SET name = COALESCE(NULLIF(TRIM(BOTH FROM c.name), ''), NULLIF(TRIM(BOTH FROM u.company_name), ''), NULLIF(TRIM(BOTH FROM u.username), ''), 'Company'),
    logo = COALESCE(c.logo, NULLIF(TRIM(BOTH FROM u.profile_image), '')),
    description = COALESCE(c.description, NULLIF(TRIM(BOTH FROM u.bio), '')),
    location = COALESCE(c.location, NULLIF(TRIM(BOTH FROM u.address), '')),
    website = COALESCE(c.website, NULLIF(TRIM(BOTH FROM u.website), '')),
    updated_at = CASE
      WHEN (
        c.name IS NULL OR TRIM(BOTH FROM c.name) = ''
        OR (c.logo IS NULL AND NULLIF(TRIM(BOTH FROM u.profile_image), '') IS NOT NULL)
        OR (c.description IS NULL AND NULLIF(TRIM(BOTH FROM u.bio), '') IS NOT NULL)
        OR (c.location IS NULL AND NULLIF(TRIM(BOTH FROM u.address), '') IS NOT NULL)
        OR (c.website IS NULL AND NULLIF(TRIM(BOTH FROM u.website), '') IS NOT NULL)
      )
      THEN CURRENT_TIMESTAMP
      ELSE c.updated_at
    END
FROM users u
WHERE c.user_id = u.id
  AND (u.user_type = 'company' OR u.account_type = 'company');
