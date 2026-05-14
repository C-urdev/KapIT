-- Sanitized example only.
-- This file intentionally uses fake values and must never contain production or staging data.

BEGIN;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  username text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  user_type text NOT NULL,
  account_type text NOT NULL
);

COPY public.users (id, username, email, password, user_type, account_type) FROM stdin;
00000000-0000-4000-8000-000000000001	demo_company	company-demo@example.test	fake-hash-for-docs-only	company	company
00000000-0000-4000-8000-000000000002	demo_developer	developer-demo@example.test	fake-hash-for-docs-only	employee	developer
\.

COMMIT;
