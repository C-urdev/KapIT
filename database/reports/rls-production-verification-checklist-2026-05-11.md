# RLS Production Verification Checklist

Date: 2026-05-11

Use this after applying:

- `database/migrations/202605110005_rls_lockdown_public_data_api.sql`

## 1) Pre-deploy safety

1. Confirm a fresh backup exists in Supabase.
2. Confirm migration is first applied in staging/shadow.
3. Confirm backend `.env` still uses direct DB connection for app APIs.

## 2) SQL verification (run in Supabase SQL editor)

```sql
-- A. Public objects still have RLS enabled (tables)
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname = 'public'
order by c.relname;

-- B. No browser-role grants on public objects
select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- C. Default privileges are revoked for anon/authenticated
select
  defaclnamespace::regnamespace as schema_name,
  defaclobjtype,
  defaclacl
from pg_default_acl
where defaclnamespace::regnamespace::text = 'public';
```

Expected:

- A: `rls_enabled = true` for all base tables.
- B: zero rows.
- C: no default ACL entries granting anon/authenticated access to public tables/functions/sequences.

## 3) Role simulation tests

Run each query in a transaction and rollback.

### Guest (`anon`)

```sql
begin;
set local role anon;
select count(*) from public.users; -- expect permission denied
rollback;
```

### Normal user (`authenticated`)

```sql
begin;
set local role authenticated;
select count(*) from public.users; -- expect permission denied
rollback;
```

### Company account (`authenticated`)

Because this project does not use `auth.uid()`-based row policies, company users should also be blocked from direct Data API table reads unless explicit grants/policies are added.

```sql
begin;
set local role authenticated;
select count(*) from public.jobs; -- expect permission denied
rollback;
```

### Admin/server role

Use your backend runtime tests (not browser role simulation):

1. `npm test` in repo root should pass.
2. Start app and verify:
   - login/register
   - OAuth
   - company profile update
   - job create/list/apply
   - saved jobs
   - payments

## 4) Feature checklist (production smoke)

1. Login/register succeeds.
2. OAuth callback + social signup succeeds.
3. Company dashboard loads jobs/applicants.
4. Developer home/jobs feed loads.
5. Save/unsave job works.
6. Payment checkout and callback work.
7. Notifications and messaging endpoints still respond.

## 5) Emergency rollback

If Data API clients break unexpectedly, apply:

- `database/migrations/optional/202605110002_rls_lockdown_public_data_api_rollback.sql`

Then rerun the SQL verification block to confirm grants were restored.
