BEGIN;

DROP INDEX IF EXISTS uq_resumes_user_primary_active;

WITH ranked_primary_resumes AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, resume_type
           ORDER BY updated_at DESC, created_at DESC, id DESC
         ) AS primary_rank
  FROM resumes
  WHERE is_primary = TRUE
    AND archived_at IS NULL
)
UPDATE resumes r
SET is_primary = FALSE,
    updated_at = CURRENT_TIMESTAMP
FROM ranked_primary_resumes ranked
WHERE r.id = ranked.id
  AND ranked.primary_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_resumes_user_type_primary_active
ON resumes(user_id, resume_type)
WHERE is_primary = TRUE AND archived_at IS NULL;

COMMIT;
