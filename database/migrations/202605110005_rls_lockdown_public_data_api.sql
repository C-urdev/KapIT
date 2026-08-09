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
  browser_roles text;
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

  SELECT string_agg(quote_ident(rolname), ', ')
  INTO browser_roles
  FROM pg_roles
  WHERE rolname IN ('anon', 'authenticated');

  IF browser_roles IS NOT NULL THEN
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %s', browser_roles);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM %s', browser_roles);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM %s', browser_roles);

    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM %s',
      browser_roles
    );
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE USAGE, SELECT, UPDATE ON SEQUENCES FROM %s',
      browser_roles
    );
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM %s',
      browser_roles
    );
  END IF;
END
$$;

COMMIT;
