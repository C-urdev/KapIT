# RLS Policy Risk Report

Date: 2026-05-11
Source snapshot: `database/reports/rls-audit-current-2026-05-11.json`

## Executive Summary

- Public objects reviewed: 37
- RLS-enabled base tables: 35
- RLS-enabled tables with zero policies: 35
- Objects granted to anon/authenticated: 37
- Granted views (RLS not applicable): 2

Risk note: No-policy RLS tables default to deny, but broad grants keep objects reachable and fragile to policy/grant drift.

## Current Status Per Public Object

| Object | Kind | RLS | Policy Count | anon/authenticated granted | Risk level |
|---|---|---:|---:|---:|---|
| applicant_ai_scores | table | on | 0 | yes | High |
| application_status_history | table | on | 0 | yes | High |
| applications | table | on | 0 | yes | High |
| audit_logs | table | on | 0 | yes | High |
| auth_refresh_sessions | table | on | 0 | yes | High |
| billing_subscription_events | table | on | 0 | yes | High |
| billing_subscription_payments | table | on | 0 | yes | High |
| billing_subscriptions | table | on | 0 | yes | High |
| companies | table | on | 0 | yes | High |
| company_profiles | table | on | 0 | yes | High |
| company_related_companies | table | on | 0 | yes | High |
| company_signup_accounts | view | n/a | 0 | yes | Critical |
| conversation_messages | table | on | 0 | yes | High |
| conversation_participants | table | on | 0 | yes | High |
| conversations | table | on | 0 | yes | High |
| developer_profiles | table | on | 0 | yes | High |
| developer_signup_accounts | view | n/a | 0 | yes | Critical |
| email_verification_tokens | table | on | 0 | yes | High |
| job_match_scores | table | on | 0 | yes | High |
| job_post_payments | table | on | 0 | yes | High |
| job_status_history | table | on | 0 | yes | High |
| jobs | table | on | 0 | yes | High |
| message_read_state | table | on | 0 | yes | High |
| messages | table | on | 0 | yes | High |
| moderation_reports | table | on | 0 | yes | High |
| notifications | table | on | 0 | yes | High |
| password_reset_otps | table | on | 0 | yes | High |
| password_reset_tokens | table | on | 0 | yes | High |
| projects | table | on | 0 | yes | High |
| registration_otps | table | on | 0 | yes | High |
| saved_jobs | table | on | 0 | yes | High |
| support_requests | table | on | 0 | yes | High |
| user_posts | table | on | 0 | yes | High |
| user_premium_payments | table | on | 0 | yes | High |
| user_saved_posts | table | on | 0 | yes | High |
| user_settings | table | on | 0 | yes | High |
| users | table | on | 0 | yes | High |

## Recommended Immediate Fix

- Apply `202605110005_rls_lockdown_public_data_api.sql` to revoke anon/authenticated grants across public schema.
- Keep backend/server access unchanged (postgres direct connection or service role).
- Use rollback script only for emergency recovery.
