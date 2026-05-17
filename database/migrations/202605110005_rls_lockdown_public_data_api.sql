-- Purpose:
-- Lock down Supabase Data API access for projects that use app-managed auth
-- and server-side database access (backend-owned authorization).
--
-- Safety model:
-- - Keep RLS enabled.
-- - Remove anon/authenticated object grants in public schema.
-- - Do not grant broad public policies.
-- - Keep service_role grants untouched to avoid breaking server-side integrations.
--
-- This migration is intentionally conservative: it does not drop tables/data.

BEGIN;

-- Ensure RLS remains enabled on every base table in public schema.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', rec.schema_name, rec.table_name);
  END LOOP;
END
$$;

-- Revoke Data API access for browser roles.
-- "ALL TABLES" includes tables and views.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Prevent future objects from being auto-exposed to anon/authenticated.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT, UPDATE
  ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE
  ON FUNCTIONS FROM anon, authenticated;

COMMIT;
