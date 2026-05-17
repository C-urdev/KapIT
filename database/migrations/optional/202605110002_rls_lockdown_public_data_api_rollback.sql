-- Emergency rollback for:
-- 202605110005_rls_lockdown_public_data_api.sql
--
-- WARNING:
-- This restores broad anon/authenticated grants in public schema.
-- It should only be used as a temporary recovery step.

BEGIN;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE
  ON SEQUENCES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE
  ON FUNCTIONS TO anon, authenticated;

COMMIT;
