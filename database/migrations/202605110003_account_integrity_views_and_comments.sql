COMMENT ON TABLE users IS 'Primary identity/account table for both developer and company accounts.';
COMMENT ON TABLE companies IS 'Company entity linked 1:1 to users via companies.user_id.';
COMMENT ON TABLE company_profiles IS 'Extended onboarding profile details for company accounts.';
COMMENT ON TABLE developer_profiles IS 'Extended onboarding profile details for developer accounts.';
COMMENT ON TABLE jobs IS 'Company job posts and publish lifecycle status.';
COMMENT ON TABLE applications IS 'Developer applications submitted to jobs.';
COMMENT ON TABLE job_post_payments IS 'Payment records for paid job posting flows.';
COMMENT ON TABLE billing_subscriptions IS 'Entitlement/subscription state for user or company premium plans.';
COMMENT ON TABLE messages IS 'Legacy direct-message table kept for rollout compatibility.';
COMMENT ON TABLE conversations IS 'Primary conversation container for new messaging model.';
COMMENT ON TABLE conversation_messages IS 'Primary message records for new conversation model.';

CREATE OR REPLACE VIEW company_account_integrity_overview AS
SELECT
  u.id AS user_id,
  u.username,
  u.email,
  u.account_type,
  u.user_type,
  c.id AS company_id,
  c.name AS company_name,
  cp.user_id AS company_profile_user_id,
  (c.id IS NOT NULL) AS has_company_row,
  (cp.user_id IS NOT NULL) AS has_company_profile_row,
  (c.user_id IS NULL OR c.user_id = u.id) AS company_user_link_valid
FROM users u
LEFT JOIN companies c ON c.user_id = u.id
LEFT JOIN company_profiles cp ON cp.user_id = u.id
WHERE u.account_type = 'company' OR u.user_type = 'company'
ORDER BY u.created_at DESC;

COMMENT ON VIEW company_account_integrity_overview IS
'Audits company account linkage across users, companies, and company_profiles.';

CREATE OR REPLACE VIEW orphan_companies_overview AS
SELECT
  c.id AS company_id,
  c.user_id,
  c.name,
  c.created_at,
  c.updated_at
FROM companies c
LEFT JOIN users u ON u.id = c.user_id
WHERE c.user_id IS NULL OR u.id IS NULL
ORDER BY c.created_at DESC;

COMMENT ON VIEW orphan_companies_overview IS
'Shows company rows without a valid owning users row.';
