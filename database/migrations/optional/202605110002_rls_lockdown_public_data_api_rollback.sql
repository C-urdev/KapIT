-- Emergency rollback for:
-- 202605110005_rls_lockdown_public_data_api.sql
--
-- WARNING:
-- This restores broad anon/authenticated grants in public schema.
-- It should only be used as a temporary recovery step.

BEGIN;

DO $$
DECLARE
  browser_roles text;
BEGIN
  SELECT string_agg(quote_ident(rolname), ', ')
  INTO browser_roles
  FROM pg_roles
  WHERE rolname IN ('anon', 'authenticated');

  IF browser_roles IS NOT NULL THEN
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %s', browser_roles);
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %s', browser_roles);
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO %s', browser_roles);

    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES TO %s',
      browser_roles
    );
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO %s',
      browser_roles
    );
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO %s',
      browser_roles
    );
  END IF;
END
$$;

COMMIT;
