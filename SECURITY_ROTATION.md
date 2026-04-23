# Security Rotation Checklist

This project previously had `.env` committed in git history. Because of that, treat any real secret that was ever stored there as potentially exposed and rotate it.

This guide is written to minimize breakage while rotating credentials.

## Scope

Rotate these secrets if they were ever real values:

- `JWT_SECRET`
- `DATABASE_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`

## Before You Start

1. Make a temporary local-only backup of your current `.env`.
2. Do not commit real secrets to git.
3. Make sure `.env` and `.env.local` stay ignored.
4. Be ready to restart the backend after each change.
5. Rotate one credential group at a time.

## Files That Depend On These Secrets

- JWT auth:
  [server/middleware/auth.js](z:\VsCodeProjects\found it\server\middleware\auth.js)
- Auth session/token flows:
  [server/services/authSessionService.js](z:\VsCodeProjects\found it\server\services\authSessionService.js)
- Database connection:
  [server/config/database.js](z:\VsCodeProjects\found it\server\config\database.js)
- Payments:
  [server/services/paymentService.js](z:\VsCodeProjects\found it\server\services\paymentService.js)
- Server app boot:
  [server/app.js](z:\VsCodeProjects\found it\server\app.js)

## Lowest-Risk Rotation Order

1. `JWT_SECRET`
2. `DATABASE_URL`
3. `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` together

## 1. Rotate JWT Secret

Expected impact:

- Existing access tokens become invalid.
- Existing sessions may require users to log in again.
- Frontend should still work after re-authentication.

Steps:

1. Generate a new strong random secret.
2. Replace `JWT_SECRET` in `.env`.
3. Restart the backend.
4. Test login and protected routes.

Verify:

1. Log in successfully.
2. Open the user dashboard.
3. Open the company dashboard if applicable.
4. Save a protected change such as profile or project edits.

Rollback:

- Restore the previous `JWT_SECRET` only if you must recover quickly.
- If the old secret may be exposed, treat rollback as temporary only.

## 2. Rotate Database URL

Expected impact:

- If incorrect, backend API routes that hit the database will fail.
- Frontend pages depending on API data may show errors or empty states.

Steps:

1. Create or obtain the new database connection string from your provider.
2. Replace `DATABASE_URL` in `.env`.
3. Keep SSL settings aligned with the new provider if needed.
4. Restart the backend.

Verify:

1. Check `/api/health`.
2. Log in.
3. Load jobs or dashboard data.
4. Save a profile change.
5. Save a project change.

Rollback:

- Restore the old `DATABASE_URL` only if the new one is incorrect and you need fast recovery.

## 3. Rotate PayPal Credentials

Rotate these together:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`

Expected impact:

- PayPal order creation or capture will fail if only one value is updated or if the pair is mismatched.

Steps:

1. Generate or copy the new PayPal sandbox or production credentials.
2. Replace both values in `.env`.
3. Confirm `PAYPAL_ENV` is still correct.
4. Restart the backend.

Verify:

1. Open the PayPal checkout flow.
2. Create an order.
3. Capture the payment successfully.

Rollback:

- Restore the previous pair only if necessary for fast recovery.

## Suggested Test Script After Every Rotation

Run these checks after each credential change:

1. Backend starts without crashing.
2. Login works.
3. Authenticated API requests succeed.
4. Dashboard data loads.
5. A write action succeeds.
6. If payment credentials changed, the payment flow succeeds.

## Recommended Operational Practice

- Rotate in a low-traffic window if this is shared or deployed.
- Update env values first, then restart, then test immediately.
- Revoke old provider credentials only after confirming the new ones work.
- If this repo was ever pushed publicly, rotate all real secrets, not just the one you suspect.

## What Not To Do

- Do not commit real secrets into `.env.example`.
- Do not rotate multiple external providers at the same time.
- Do not delete the old secret in the provider dashboard before verifying the replacement works.
- Do not assume removing `.env` from the current repo state erased it from history.

## Optional Next Step

After rotation is done, consider:

- Scrubbing git history if this repository was publicly shared
- Moving secrets to deployment environment variables instead of local files
- Using separate development and production credentials

## Secret Scanning Guardrails

Run local secret scanning before push:

1. Install gitleaks (https://github.com/gitleaks/gitleaks).
2. Run `npm run security:secrets` from repo root.

GitHub recommendations:

1. Enable Secret Scanning in repository security settings.
2. Enable Push Protection to block committing newly detected secrets.
