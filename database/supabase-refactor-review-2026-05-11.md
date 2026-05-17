# Supabase Database Refactor Review

Date: 2026-05-11
Repo: `z:\VsCodeProjects\kapIT`

## Context Snapshot

- This project uses a Node/Express backend with PostgreSQL SQL queries.
- The database host is Supabase Postgres, but auth/session logic is app-managed in `users` plus JWT cookies.
- `SCHEMA_MANAGEMENT_MODE=runtime` is enabled in `.env`, so startup code still mutates schema.
- Goal is safety-first refactor planning, not immediate destructive cleanup.

## Scope and Method

I reviewed:

- `database/migrations/*.sql`
- `database/init.sql`
- runtime schema bootstraps in `backend/api/config/*.js`
- SQL usage in controllers/services/tests under `backend/api`

I checked for:

- tables, columns, foreign keys, indexes
- views, triggers, functions
- RLS policies and storage bucket usage
- code usage per table

## Key Findings

1. Account model today is intentionally split but identity stays in `users`.
- `users` stores all account identities, including company accounts.
- `companies` is a 1:1 profile/hiring entity linked by `companies.user_id`.
- This is valid and production-safe.

2. Company/user separation for visibility is now available through views.
- `company_accounts_overview`
- `developer_accounts_overview`

3. `auth.users` is not currently integrated.
- No code paths use Supabase Auth tables or Supabase JS auth client.
- Login/register/OAuth flows write directly to `public.users`.

4. RLS and storage bucket config are not managed in this repo.
- No `CREATE POLICY`, `ENABLE ROW LEVEL SECURITY`, or `storage` DDL found in migrations.
- If you use service-role backend access, app-layer auth is currently your primary enforcement boundary.

5. There is schema drift risk from runtime-created OTP tables.
- `password_reset_otps` and `registration_otps` are created on-demand in `authService.js`.
- These tables are active but not migration-managed today.

## Inventory Summary

### Core active tables

- `users`
- `companies`
- `developer_profiles`
- `company_profiles`
- `projects`
- `company_related_companies`
- `jobs`
- `applications`
- `job_post_payments`
- `saved_jobs`
- `job_match_scores`
- `applicant_ai_scores`
- `messages`
- `conversations`
- `conversation_participants`
- `conversation_messages`
- `message_read_state`
- `auth_refresh_sessions`
- `notifications`
- `password_reset_tokens`
- `user_posts`
- `user_saved_posts`
- runtime-only active: `password_reset_otps`, `registration_otps`

### Candidate future/underused tables

- `email_verification_tokens`
- `user_settings`
- `support_requests`
- `moderation_reports`
- `billing_subscription_events`
- `billing_subscription_payments`
- `job_status_history`
- `application_status_history`
- `audit_logs`

### Used indirectly

- `billing_subscriptions` is checked/read by `planAccessService`, but broader billing event/payment lifecycle is not yet wired.

## Table Usage Classification

Legend:
- `active`: direct SQL reads/writes in controllers/services
- `indirect`: existence checks or narrow reads only
- `future`: not used by runtime app flows yet

| Table | Status | Evidence (examples) | Purpose | Risk if changed now |
|---|---|---|---|---|
| users | active | `authController`, `oauthController`, `companyController` | identity/auth + shared profile fields | very high |
| companies | active | `companyService`, `companyController`, `publicController` | company account entity linked to users | very high |
| developer_profiles | active | `developerController`, `authController` | developer onboarding/profile details | high |
| company_profiles | active | `companyController`, `authController` | company onboarding details | high |
| projects | active | `companyController` | company onboarding project info | medium |
| company_related_companies | active | `companyController`, `authController` | related companies list | low-medium |
| jobs | active | many controllers/services | job lifecycle and listing | very high |
| applications | active | `companyController`, `developerController`, `authController` | candidate applications | very high |
| job_post_payments | active | `paymentService` | pay-per-post payment state | very high |
| saved_jobs | active | `authController` | persisted saved jobs | medium |
| job_match_scores | active | `authController` | cached AI match scores | medium |
| applicant_ai_scores | active | `companyController` | applicant AI score cache | medium |
| messages | active | `messagesController`, migration monitor | legacy messaging compatibility | high |
| conversations | active | `conversationService`, `messagesController` | new conversation model | high |
| conversation_participants | active | `conversationService` | conversation membership | high |
| conversation_messages | active | `conversationService` | conversation messages | high |
| message_read_state | active | `conversationService`, `messagesController` | read cursor state | medium |
| auth_refresh_sessions | active | `authSessionService` | refresh-session persistence | very high |
| notifications | active | `notificationsController` | user notifications | high |
| email_verification_tokens | future | no runtime usage found | durable email verification/change-email tokens | low now |
| password_reset_tokens | active | `authService` | password reset flow tokens | high |
| user_settings | future | no runtime usage found | privacy/notification preferences | low now |
| support_requests | future | no runtime usage found | support ticketing | low now |
| moderation_reports | future | no runtime usage found | trust/safety reports | low now |
| billing_subscriptions | indirect | `planAccessService` read checks | premium entitlement source | medium |
| billing_subscription_events | future | no runtime usage found | billing webhook/event ledger | low now |
| billing_subscription_payments | future | no runtime usage found | recurring payment ledger | low now |
| job_status_history | future | no runtime usage found | lifecycle audit trail | low now |
| application_status_history | future | no runtime usage found | status change audit trail | low now |
| audit_logs | future | no runtime usage found | security/ops audit trail | low now |
| user_posts | active | `postsController` | user feed posts | high |
| user_saved_posts | active | `postsController` | saved feed posts | medium |
| password_reset_otps | active (runtime-only) | `authService` | OTP password reset path | medium (schema drift risk) |
| registration_otps | active (runtime-only) | `authService` | OTP registration verify path | medium (schema drift risk) |

## Relationship Review

Current key relationships are mostly clean:

- `companies.user_id -> users.id` (1:1 intent)
- `jobs.company_id -> companies.id`
- `applications.job_id -> jobs.id`
- `applications.user_id -> users.id`
- messaging tables link correctly back to `users` and each other

Main cleanup need:

- Ensure every `company` account in `users` has a linked `companies` row.
- Keep `companies.user_id` populated and unique.

## RLS, Policies, Triggers, Functions, Storage

### RLS and policies

- No RLS/policy DDL found in repo migrations.
- If not configured manually in Supabase dashboard, tables may rely only on server-side API auth.

### Triggers/functions found

- Function: `update_updated_at_column()`
- Triggers:
  - `update_users_updated_at`
  - `update_user_settings_updated_at`
  - `update_support_requests_updated_at`
  - `update_moderation_reports_updated_at`
  - `update_billing_subscriptions_updated_at`
  - `update_billing_subscription_payments_updated_at`

### Storage buckets

- No bucket DDL or Supabase Storage API usage found in codebase.
- Resume/file handling appears app-side, not Supabase Storage-managed in this repo.

## Proposed Clean Target Schema (Production-Safe)

Keep identity split simple:

1. Identity/Auth layer
- `users` (or future `profiles` if migrating to Supabase Auth)
- `auth_refresh_sessions`
- `password_reset_tokens`
- OTP tables migrated into SQL migrations

2. Company layer
- `companies` (1:1 with company users)
- `company_profiles`
- `company_related_companies`
- `projects`

3. Marketplace layer
- `jobs`
- `applications`
- `saved_jobs`
- `job_match_scores`
- `applicant_ai_scores`

4. Payments/subscriptions
- `job_post_payments`
- `billing_subscriptions` (entitlements)
- optional future: `billing_subscription_events`, `billing_subscription_payments` when fully wired

5. Messaging/notifications
- `conversations`
- `conversation_participants`
- `conversation_messages`
- `message_read_state`
- `messages` (legacy bridge until retired)
- `notifications`

6. Social/content
- `user_posts`
- `user_saved_posts`

## Refactor Plan (Safe, Phased)

### Phase 0: Safety gates and backup

- Take Supabase backup and snapshot row counts per table.
- Enable staging/shadow apply for all SQL migrations before production.
- Freeze destructive DDL until usage review signoff.

### Phase 1: Non-destructive hardening

- Keep `users` + `companies` dual-model.
- Keep and use account overview views for easy auditing.
- Add integrity views for company-user linkage.
- Move OTP tables into migration-managed SQL (stop runtime schema drift).

### Phase 2: Security hardening

- Decide on RLS strategy:
  - if API remains only access path, lock direct DB access and service-role exposure.
  - if client direct DB access is needed, add RLS + policies per table before exposing.
- Rotate any leaked secrets immediately and avoid committing real secrets.

### Phase 3: Optional consolidation

- Option A (lowest risk): keep custom auth (`users`) and improve table boundaries only.
- Option B (higher risk): migrate identity to `auth.users` + `public.profiles` in a dedicated multi-step migration with dual-write and cutover.

### Phase 4: Optional cleanup

- Cleanup candidate tables only after:
  - code search still shows no usage,
  - table row counts are zero or archived,
  - rollback snapshot exists.

## Safe Changes Applied In This Review

Already added in repo:

- `database/migrations/202605110002_account_overview_views.sql`
  - `company_accounts_overview`
  - `developer_accounts_overview`

Added in this review:

- `database/migrations/202605110003_account_integrity_views_and_comments.sql`
  - read-only integrity views
  - table/view comments for easier DB navigation
- `database/migrations/202605110004_auth_otp_tables.sql`
  - migration-managed OTP tables used by auth service
  - removes schema drift risk from runtime-only creation

Optional cleanup file added:

- `database/migrations/optional/202605110001_optional_cleanup_candidates.sql`
  - preflight checks and commented drop templates
  - no destructive action by default

## Exact Live Checks To Run In Supabase SQL Editor

Run these before any destructive change:

```sql
-- 1) company users missing company rows
SELECT u.id, u.email, u.username
FROM users u
LEFT JOIN companies c ON c.user_id = u.id
WHERE (u.account_type = 'company' OR u.user_type = 'company')
  AND c.id IS NULL;

-- 2) orphan companies
SELECT c.*
FROM companies c
LEFT JOIN users u ON u.id = c.user_id
WHERE c.user_id IS NULL OR u.id IS NULL;

-- 3) current policies (RLS visibility)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4) RLS status
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5) storage buckets (if using Supabase Storage)
SELECT *
FROM storage.buckets
ORDER BY id;
```

## Risks To Avoid

- Do not remove `users` company rows. That would break auth/session ownership.
- Do not drop `messages` until conversation rollout is fully complete and legacy reads are gone.
- Do not enforce strict new constraints until orphan/null legacy rows are cleaned.
- Do not switch to `auth.users` in one step. Use staged migration with backfill and dual-write.
