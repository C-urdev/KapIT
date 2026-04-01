# KapIT Database Deployment Readiness Review

Review date: 2026-04-02

## Final Verdict

Ready after listed fixes.

Reason:

- The current live schema already supports core auth, onboarding, jobs, applications, messaging, notifications, and job-post payments.
- The remaining gaps are mostly around production durability and operational completeness rather than core feature survival.
- The new migration set closes the highest-risk missing areas without breaking existing APIs or requiring immediate frontend rewrites.

## What Is Already Complete

- User accounts via `users`
- Company accounts via `companies`
- Developer onboarding via `developer_profiles`
- Company onboarding via `company_profiles`, `projects`, and `company_related_companies`
- Session persistence via `auth_refresh_sessions`
- Job posting and draft-to-paid publishing via `jobs` and `job_post_payments`
- Applications via `applications`
- Legacy and conversation messaging via `messages`, `conversations`, `conversation_participants`, `conversation_messages`, and `message_read_state`
- Notifications via `notifications`
- Runtime compatibility guard for migration-managed schema mode

## Full Deployment-Readiness Gap Analysis

### Required Before Deployment

- No database-backed email verification token model
- No database-backed password reset token model
- No durable user settings or profile-visibility model
- Saved jobs exist only in client-side storage, not in PostgreSQL
- Premium/subscription UI exists, but there is no canonical subscription or recurring billing schema
- No general audit log table for security and operational tracing
- No status-history tables for jobs and applications
- No support-request or moderation-report schema
- Duplicate prevention for applications is enforced in code but not by a database unique constraint
- Provider payment uniqueness for `job_post_payments.provider_payment_id` is not enforced in the database
- Search and heavier read paths are under-indexed for `ILIKE` and array membership workloads

### Recommended Soon After Deployment

- Start writing to `audit_logs` from auth, company, payment, and moderation flows
- Start writing to `job_status_history` and `application_status_history` inside status mutation endpoints
- Add backend endpoints for `saved_jobs`
- Move premium activation to `billing_subscriptions` plus `billing_subscription_payments` instead of relying only on `users.is_premium`
- Use `user_settings.profile_visibility` and `show_*` flags when serving public profile payloads

### Optional Later Optimizations

- File metadata or upload-object catalog once resume and asset uploads become first-class backend entities
- Materialized search or denormalized discovery tables if marketplace search volume grows
- Table partitioning or archival for `audit_logs`, `notifications`, and `conversation_messages` once row counts justify it
- Read models or counters for unread notifications and conversation summaries if query load grows sharply

## Remaining Critical Database Issues

- Account recovery and verification flows have no durable token tables
- Premium billing has no canonical subscription state
- Saved jobs are not durable across devices or sessions
- The system lacks auditable history for security-sensitive or workflow-sensitive mutations
- Some integrity guarantees rely on controller logic instead of the database

## Safe Migration Plan

Existing baseline:

1. `202604020001_enable_pgcrypto.sql`
2. `202604020002_users_and_legacy_messages.sql`
3. `202604020003_companies_jobs_payments.sql`
4. `202604020004_onboarding_profiles.sql`
5. `202604020005_notifications_and_auth_sessions.sql`
6. `202604020006_legacy_messages_identity_backfill.sql`
7. `202604020007_conversation_messaging.sql`

Remaining critical work:

8. `202604020008_enable_pg_trgm.sql`
9. `202604020009_account_security_and_preferences.sql`
10. `202604020010_saved_jobs_support_and_moderation.sql`
11. `202604020011_subscriptions_and_billing.sql`
12. `202604020012_status_history_and_audit.sql`
13. `202604020013_production_readiness_indexes_and_constraints.sql`

Dependency notes:

- `pg_trgm` should be enabled before trigram indexes are created
- `users`, `companies`, `jobs`, `applications`, `messages`, and `conversation_messages` must exist before the new security/support/billing/history tables
- The new uniqueness constraints were checked against the live database before being added

## Required Indexes And Constraints For Heavier Usage

Added in migration `202604020013_production_readiness_indexes_and_constraints.sql`:

- Unique `applications(job_id, user_id)`
- Unique `auth_refresh_sessions(token_hash)`
- Unique partial `job_post_payments(provider, provider_payment_id)`
- Feed index for paid/open job listing reads
- Status-aware indexes for applications
- Notification aggregation index on `(user_id, actor_user_id, type, created_at desc)`
- GIN indexes for `jobs.skills` and `developer_profiles.skills`
- Trigram indexes for `users.username`, `users.email`, `users.company_name`, `users.desired_job`, `developer_profiles.full_name`, `developer_profiles.job_title`, `developer_profiles.preferred_it_role`, `companies.name`, and `jobs.title`
- Check constraints for job status, application status, payment status, messaging type, and conversation type

## Backend Compatibility Mapping Notes

### Existing APIs remain compatible

- No existing table or column was removed
- No current API payload shape needs to change
- Runtime compatibility layers can remain enabled during rollout

### New canonical tables and how they map

- `email_verification_tokens`
  Use for future `/verify-email` and email-change confirmation flows. No existing payloads are affected.

- `password_reset_tokens`
  Use for future forgot-password and reset-password flows. Current login and refresh flows continue unchanged.

- `user_settings`
  Maps to current account-settings UI concepts and future profile-visibility enforcement. Existing reads can continue using `users` until the backend is updated to consult this table.

- `saved_jobs`
  Replaces client-only saved-job persistence with durable server storage when endpoints are added. Existing frontend local storage can remain as a fallback during rollout.

- `billing_subscriptions`, `billing_subscription_events`, `billing_subscription_payments`
  These become the canonical premium/subscription source of truth. `users.is_premium` can remain as the compatibility flag during transition and later be derived from or synchronized with active subscription state.

- `job_status_history`, `application_status_history`
  Add write-side observability without changing job or application response payloads.

- `audit_logs`
  Purely additive operational and security logging layer.

- `support_requests` and `moderation_reports`
  Add production support and trust/safety readiness without touching current public API flows until routes are introduced.

## Frontend Compatibility Notes

- Registration, login, session refresh, onboarding, messaging, notifications, jobs, applications, and job-post payment flows can continue unchanged
- Saved jobs currently live in client storage; the new `saved_jobs` table is a backend readiness layer, not a breaking change
- Premium UI can remain unchanged initially; when backend billing is wired in, keep the existing `isPremium` field in frontend payloads by syncing it from `billing_subscriptions`
- Account settings screens can continue using current payloads until the backend starts reading and writing `user_settings`
- Public profile forms and onboarding payloads do not need to change for these migrations

## Performance And Heavier-Usage Recommendations

- Prefer keyset or cursor pagination over offset pagination for messages, notifications, jobs, and applicants once row counts grow
- Keep `conversation_messages` and `notifications` ordered by `(created_at, id)` for stable paging
- Use derived unread counts only if needed later; current schema is good enough for direct queries plus indexes
- Keep counters derived from source-of-truth rows until volume proves a need for cached counters
- Consider materialized search or denormalized discovery only after trigram and GIN indexes are no longer sufficient
- `audit_logs`, `notifications`, and `conversation_messages` are the most monitoring-sensitive growth tables
- `users`, `auth_refresh_sessions`, `job_post_payments`, `billing_subscriptions`, and token tables are the most backup-sensitive security and billing tables

## Final Completeness Review

### Complete enough today

- Core marketplace and messaging data model
- Basic payment-backed job posting
- Current onboarding and profile storage
- Session rotation and conversation migration baseline

### Fixed by this migration set

- Recovery and verification token durability
- Durable user settings and visibility controls
- Durable saved jobs model
- Subscription and subscription-event readiness
- Audit and workflow history coverage
- Production-grade uniqueness and search/index improvements
- Support and moderation schema readiness

### Can wait until after deployment if necessary

- Backend routes that actively use every new table
- File-asset catalog normalization
- Archival and partitioning
- RLS and Supabase policy hardening if the app still uses the server as the main trust boundary
