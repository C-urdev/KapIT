-- Optional cleanup script.
-- This file is intentionally NOT part of the default migration chain.
-- Review, backup, and validate in staging before enabling any DROP statements.

-- Preflight: inspect row counts for candidate future/unused tables.
SELECT 'email_verification_tokens' AS table_name, COUNT(*) AS row_count FROM email_verification_tokens
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings
UNION ALL
SELECT 'support_requests', COUNT(*) FROM support_requests
UNION ALL
SELECT 'moderation_reports', COUNT(*) FROM moderation_reports
UNION ALL
SELECT 'billing_subscription_events', COUNT(*) FROM billing_subscription_events
UNION ALL
SELECT 'billing_subscription_payments', COUNT(*) FROM billing_subscription_payments
UNION ALL
SELECT 'job_status_history', COUNT(*) FROM job_status_history
UNION ALL
SELECT 'application_status_history', COUNT(*) FROM application_status_history
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;

-- Preflight: identify dependent views/rules/triggers before cleanup.
SELECT
  n.nspname AS schema_name,
  c.relname AS dependent_object,
  c.relkind AS dependent_kind,
  t.relname AS referenced_table
FROM pg_depend d
JOIN pg_class c ON c.oid = d.objid
JOIN pg_class t ON t.oid = d.refobjid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE t.relname IN (
  'email_verification_tokens',
  'user_settings',
  'support_requests',
  'moderation_reports',
  'billing_subscription_events',
  'billing_subscription_payments',
  'job_status_history',
  'application_status_history',
  'audit_logs'
)
ORDER BY referenced_table, schema_name, dependent_object;

-- Optional destructive cleanup template (keep commented until approved):
-- BEGIN;
-- DROP TABLE IF EXISTS email_verification_tokens;
-- DROP TABLE IF EXISTS user_settings;
-- DROP TABLE IF EXISTS support_requests;
-- DROP TABLE IF EXISTS moderation_reports;
-- DROP TABLE IF EXISTS billing_subscription_events;
-- DROP TABLE IF EXISTS billing_subscription_payments;
-- DROP TABLE IF EXISTS job_status_history;
-- DROP TABLE IF EXISTS application_status_history;
-- DROP TABLE IF EXISTS audit_logs;
-- COMMIT;
