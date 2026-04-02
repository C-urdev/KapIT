# Migration Plan

## Target structure

```text
apps/
  web-next/
    app/
      (public)/
      auth/
      company/
      dashboard/
      jobs/
    components/
    lib/
server/
  controllers/
  middleware/
  routes/
  services/
services/
  ai-fastapi/
    app/
      routers/
database/
  init.sql
apps/
  web-next/
    src/
      shared/
      user/
      company/
```

## Step-by-step migration

1. Keep the current Express API running and harden auth first.
2. Move token transport from browser storage to HTTP-only cookies with refresh tokens.
3. Keep session user data in sessionStorage only as UI cache, not as a credential store.
4. Add CSRF validation for cookie-authenticated write requests.
5. Introduce the Next.js app in `apps/web-next` and reuse existing React components through path aliases.
6. Migrate public SEO pages first: landing page, jobs, company profiles.
7. Move private dashboards to Next route entrypoints while keeping existing React components.
8. Move page-level metadata into Next route segments with `generateMetadata`.
9. Keep Express as the system of record for auth, users, jobs, payments, messages, and notifications.
10. Add FastAPI only for AI and heavy processing workloads.
11. Keep Supabase Postgres unchanged; add RLS policies after the API role model is stable.

## Auth upgrade summary

- Access token: short-lived cookie, default `20m`
- Refresh token: rotating cookie-backed session, default `14d`
- Cookies: `HttpOnly`, `Secure` in production, `SameSite=Lax`
- CSRF: double-submit token via `X-CSRF-Token` for mutating cookie-auth requests
- Rate limit: in-memory login limiter as a safe baseline
- Password hashing: bcrypt remains in place, configurable for later Argon2 migration via `PASSWORD_HASHER`

## SEO rules for migration

- Public job and company profile pages should render on the server.
- Dashboard routes should stay dynamic and blocked from indexing.
- Use one H1 per page and descend headings normally.
- Keep slug-based routes for discoverability, e.g. `/jobs/frontend-developer`.
- Add metadata per route instead of one global title.
- Prefer static generation for stable marketing pages and SSR for frequently changing listings.

## Security rules for migration

- Never put access or refresh tokens in `localStorage`.
- Keep the refresh-token table separate from existing user schema changes.
- Validate all inputs at the route boundary.
- Enforce role checks in middleware, not only in controllers.
- Add origin validation plus CSRF tokens for write endpoints.
- Prepare RLS by carrying `role` and `accountType` consistently in API auth context.

## Local development commands

- `npm start`: start Express on `5000` and Next on `3000`
- `npm run dev`: same as `npm start`
- `npm run build`: build the Next frontend
- `npm run fastapi:dev`: start the optional FastAPI service on `8000`

## Notes

- Your database remains Supabase-hosted. `npm start` uses the configured database connection; it does not boot a local PostgreSQL server.

## Suggested rollout order

1. Deploy the Express auth hardening.
2. Verify login, refresh, logout, profile edits, messaging, and company actions.
3. Run Next locally with Express using `npm start`.
4. Move landing page and public profiles into Next.
5. Move job listing SEO routes into Next.
6. Move private dashboard entrypoints into Next.
7. Add FastAPI endpoints behind internal or versioned routes.
8. Add Supabase RLS after the app uses consistent user roles.
