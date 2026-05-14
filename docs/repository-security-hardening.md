# Repository Security Hardening

## Purpose

This repository must never store production or staging data exports in git.

## Safe Defaults Added

- `database/reports/*.sql` and common dump/backup formats are ignored in `.gitignore`.
- A staged-file guard blocks commits that include:
  - `.env` files
  - SQL dump/backup paths
  - known secret/token patterns
- Local git hook path is configured by `npm run prepare`.
- If auto-config fails due permissions, run:

```bash
git config core.hooksPath .githooks
```
- You can run a full repository scan with:

```bash
npm run security:secrets
```

## One-Time Git History Cleanup (if sensitive dumps were committed earlier)

Use one of the commands below on a safe clone, then force-push after team coordination.

Option A (`git filter-repo`, recommended):

```bash
git filter-repo --path-glob 'database/reports/*.sql' --invert-paths
```

Option B (BFG Repo-Cleaner):

```bash
bfg --delete-files '*.sql' --no-blob-protection
```

After rewriting history:

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Secret Rotation Checklist

If real data/secrets were ever committed:

1. Rotate database credentials (`DATABASE_URL` and provider password/user).
2. Rotate JWT secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`).
3. Rotate OAuth secrets (`GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`).
4. Rotate payment credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, webhook secret/id).
5. Revoke old refresh sessions and force re-login.
6. Verify auth, OAuth, and payment flows in staging before production rollout.
