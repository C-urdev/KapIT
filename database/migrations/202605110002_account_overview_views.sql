CREATE OR REPLACE VIEW company_accounts_overview AS
SELECT
  u.id AS user_id,
  u.username,
  u.email,
  u.user_type,
  u.account_type,
  u.created_at AS user_created_at,
  c.id AS company_id,
  c.name AS company_record_name,
  c.created_at AS company_created_at
FROM users u
LEFT JOIN companies c ON c.user_id = u.id
WHERE u.account_type = 'company' OR u.user_type = 'company'
ORDER BY u.created_at DESC;

CREATE OR REPLACE VIEW developer_accounts_overview AS
SELECT
  u.id AS user_id,
  u.username,
  u.email,
  u.user_type,
  u.account_type,
  u.created_at AS user_created_at
FROM users u
WHERE u.account_type = 'developer' OR u.user_type = 'employee'
ORDER BY u.created_at DESC;
