# Database Runtime Schema Audit And Migration Plan

Audit date: 2026-04-02

Live baseline verified against the configured Supabase database:

- Tables confirmed present: `users`, `companies`, `developer_profiles`, `company_profiles`, `jobs`, `applications`, `job_post_payments`, `messages`, `notifications`, `auth_refresh_sessions`, `conversations`, `conversation_participants`, `conversation_messages`, `message_read_state`, `projects`, `company_related_companies`
- Views confirmed present: `developer_signup_accounts`, `company_signup_accounts`
- Trigger confirmed present: `update_users_updated_at`

## Runtime Schema Audit Summary

### Auth and accounts

Current runtime mutation paths:

- `server/config/ensureUsersProfileSchema.js`
- `server/services/authSessionService.js`

Runtime mutations:

- Creates `users`
- Adds profile/account columns to `users`
- Sets `users.account_type` default to `'developer'`
- Backfills `users.account_type` from `users.user_type`
- Creates `update_updated_at_column()` trigger function
- Creates `update_users_updated_at` trigger on `users`
- Creates indexes on `users.email`, `users.username`, `users.user_type`, `users.account_type`, `users.profile_completed`
- Creates views `developer_signup_accounts` and `company_signup_accounts`
- Creates `auth_refresh_sessions`
- Creates refresh-session indexes on `user_id` and `expires_at`

Still necessary:

- All `users` and `auth_refresh_sessions` schema creation
- `account_type` default and null backfill
- user views and user update trigger

Legacy or transitional:

- Runtime creation itself should become migration-managed

### Developer profiles

Current runtime mutation path:

- `server/config/ensureOnboardingSchema.js`

Runtime mutations:

- Creates `developer_profiles`
- Creates indexes on `developer_profiles.experience_years` and `developer_profiles.location`

Still necessary:

- Table and indexes

Legacy or transitional:

- Runtime creation once migrations are applied

### Company profiles

Current runtime mutation paths:

- `server/config/ensureCompanySchema.js`
- `server/config/ensureOnboardingSchema.js`

Runtime mutations:

- Creates `companies`
- Adds `companies.short_description`
- Creates `company_profiles`
- Creates `company_related_companies`
- Creates indexes on `companies.user_id`, `company_profiles.industry`, `company_related_companies(company_id, created_at desc)`

Still necessary:

- Tables, `short_description`, and indexes

Legacy or transitional:

- Runtime creation once migrations are applied

### Onboarding

Current runtime mutation path:

- `server/config/ensureOnboardingSchema.js`

Runtime mutations:

- Creates `projects`
- Creates indexes for `projects(company_id, created_at desc)`

Still necessary:

- Table and index

Legacy or transitional:

- Runtime creation once migrations are applied

### Jobs, applications, and payments

Current runtime mutation path:

- `server/config/ensureCompanySchema.js`

Runtime mutations:

- Creates `jobs`
- Creates `job_post_payments`
- Creates `applications`
- Adds `jobs.status`
- Adds `jobs.closed_reason`
- Adds `jobs.pay_per_use_fee`
- Adds `jobs.pay_per_use_status`
- Adds `jobs.reopened_from_job_id`
- Adds `jobs.filled_application_id`
- Adds `jobs.filled_candidate_user_id`
- Adds `jobs.posting_payment_status`
- Adds `jobs.posting_payment_id`
- Adds `jobs.posting_plan_id`
- Adds `jobs.posting_plan_duration`
- Adds `jobs.posting_plan_duration_days`
- Adds `jobs.posting_plan_price`
- Adds `jobs.published_at`
- Adds `jobs.active_until`
- Adds `jobs.closed_at`
- Adds `jobs.hired_at`
- Adds `applications.updated_at`
- Creates indexes for jobs, applications, and job-post payments
- Creates partial unique index `idx_job_post_payments_provider_checkout`

Still necessary:

- All additive columns and indexes

Legacy or transitional:

- Runtime creation once migrations are applied

### Messaging

Current runtime mutation paths:

- `server/config/ensureUsersProfileSchema.js`
- `server/config/ensureMessagingConversationSchema.js`
- `server/controllers/messagesController.js`

Runtime mutations:

- Creates legacy `messages`
- Adds `messages.sender_user_id`
- Adds `messages.recipient_user_id`
- Adds `messages.contact_user_id`
- Creates message indexes on legacy lookup paths
- Backfills `messages.contact_user_id` from sender and recipient ids
- Deletes duplicate legacy message rows during maintenance
- Inserts missing mirror rows for recipient-side legacy threads
- Creates `conversations`
- Creates `conversation_participants`
- Creates `conversation_messages`
- Creates `message_read_state`
- Adds conversation columns if missing
- Creates indexes for conversation reads and rollout parity

Still necessary:

- Schema for legacy and conversation-based messaging
- `contact_user_id` backfill
- mirror-row backfill for legacy read compatibility until legacy reads are fully retired

Legacy or transitional:

- Runtime duplicate cleanup in `messagesController` is data maintenance, not schema management
- Runtime table creation and column patching should become migration-managed
- Backfill from legacy `messages` into `conversation_*` tables remains a separate verified data-migration script, not a startup schema concern

### Notifications

Current runtime mutation path:

- `server/controllers/notificationsController.js`

Runtime mutations:

- Creates `notifications`
- Creates indexes on `notifications(user_id, created_at desc)` and `notifications(user_id, is_read, created_at desc)`

Still necessary:

- Table and indexes

Legacy or transitional:

- Runtime creation once migrations are applied

## Runtime Schema Mutations Happening Today

### Startup-wide mutation entrypoint

- `server/app.js` and `server/server.js` call `server/config/runtimeSchema.js`
- `warmRuntimeSchemas()` eagerly runs base users, hiring, onboarding, and messaging schema tasks on startup and again per request through the app middleware

### Request-path mutations still embedded in handlers and services

- `server/services/authSessionService.js` creates `auth_refresh_sessions` lazily during login, refresh, logout, and verification flows
- `server/controllers/notificationsController.js` creates `notifications` lazily when notification APIs or notification-producing flows run
- `server/controllers/messagesController.js` creates and patches `messages`, then performs legacy-message maintenance updates and inserts

## Recommended Migration File Order

1. `202604020001_enable_pgcrypto.sql`
2. `202604020002_users_and_legacy_messages.sql`
3. `202604020003_companies_jobs_payments.sql`
4. `202604020004_onboarding_profiles.sql`
5. `202604020005_notifications_and_auth_sessions.sql`
6. `202604020006_legacy_messages_identity_backfill.sql`
7. `202604020007_conversation_messaging.sql`

Dependency notes:

- `users` must exist before all other feature tables
- `companies` must exist before `jobs`, `job_post_payments`, `projects`, and `company_related_companies`
- legacy `messages` must exist before `conversation_messages.legacy_message_id`
- the legacy message identity-column backfill should run before conversation migrations if rollout scripts still use sender and recipient ids for parity checks
- `job_post_payments` should exist before adding `jobs.posting_payment_id` foreign-key enforcement

## Migration Contents

The SQL files in `database/migrations` contain the production-safe migration equivalents for the runtime bootstrap logic.

Notes:

- Every schema change is additive and idempotent
- No table drops are included
- No destructive data cleanup is included
- The one runtime delete operation for duplicate messages was intentionally not converted into a migration because it is not schema management and would be risky as an automatic production migration

## Compatibility Notes

### Login, auth, and sessions

- Preserved by `users`, signup-account views, `update_users_updated_at`, and `auth_refresh_sessions`
- Existing JWT, refresh-session, and cookie flows continue to use the same tables and columns

### Developer onboarding

- Preserved by `users` profile fields plus `developer_profiles`
- Existing onboarding saves remain compatible with current controller writes

### Company onboarding and public profile reads

- Preserved by `users`, `companies`, `company_profiles`, `company_related_companies`, and `projects`
- Public reads that join `users` and company tables remain supported

### Jobs and applications

- Preserved by `jobs`, `applications`, and job indexes used by dashboard and public listings

### Payments and job-post flows

- Preserved by `job_post_payments` and `jobs.posting_*` columns and indexes

### Messaging

- Preserved by keeping both legacy `messages` and newer `conversation_*` tables
- The migration set keeps legacy read compatibility and conversation dual-write compatibility

### Notifications

- Preserved by `notifications` and its unread/list indexes

## Safe Rollout Plan

1. Apply the SQL migrations to a staging or shadow copy of the current Supabase project.
2. Verify the resulting schema matches production expectations for tables, columns, views, trigger, indexes, and foreign keys.
3. Run existing application smoke tests for auth, onboarding, company actions, jobs, payments, messaging, and notifications.
4. In production, apply the migrations during a low-traffic window.
5. Keep all runtime schema helpers enabled immediately after migration deployment.
6. Confirm startup logs, login, onboarding saves, messaging reads and writes, notification generation, and payment/job-post writes behave normally.
7. Run explicit messaging verification checks after deploy if you want rollout confidence.
8. After migration success is confirmed, set `SCHEMA_MANAGEMENT_MODE=migrations` to disable runtime schema mutation without changing app behavior.
9. Leave the runtime files in place for one or two successful release cycles as guarded no-ops.
10. Remove fully deprecated runtime schema code only after production has run stably in migration-managed mode.

## Runtime File Deprecation Recommendation

Can become no-op immediately after migrations are applied and validated:

- `server/config/ensureUsersProfileSchema.js`
- `server/config/ensureCompanySchema.js`
- `server/config/ensureOnboardingSchema.js`
- `server/config/ensureMessagingConversationSchema.js`
- `server/config/runtimeSchema.js`
- `server/services/authSessionService.js` table-creation path
- `server/controllers/notificationsController.js` table-creation path
- `server/controllers/messagesController.js` table and column creation path

Should remain temporarily even in no-op mode:

- `server/controllers/messagesController.js` wrapper itself, because the controller still serves live messaging traffic

Should be removed later, after stable migration-managed releases:

- Runtime schema warmup middleware in `server/app.js`
- Startup warmup call in `server/server.js`
- The duplicate-message delete block in `messagesController` if it is no longer needed after the messaging rollout is fully complete and audited
