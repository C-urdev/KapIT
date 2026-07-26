# KapIT Codebase Preview

KapIT is a full-stack hiring platform with separate developer and company workflows. The repo contains a Vite React frontend, an Express API backend, PostgreSQL migrations, optional Redis support, and an optional FastAPI AI microservice for matching and resume analysis.

## System Overview

The application is split into a client app and API service.

- `frontend/` serves the Vite React web app.
- `backend/api/` serves the Express API under `/api/*`.
- `database/` stores SQL schema setup and migrations.
- `backend/ai-fastapi/` provides optional Python AI endpoints.
- `scripts/` contains local development, migration, test, security, and skill-sync orchestration.

At runtime, the frontend calls `/api/*`. In local development, Vite proxies those calls to the Express backend on port `5000` by default. The backend persists core platform data in PostgreSQL and can use Redis when configured.

## Repository Map

| Path | What It Is |
| --- | --- |
| `frontend/` | Vite React web application for public pages, developer dashboards, company dashboards, onboarding, jobs, payments, and account flows. |
| `frontend/src/App.jsx` | Main browser route table. It wires public routes, auth pages, dashboards, onboarding, job pages, payment pages, and fallback routing. |
| `frontend/modules/shared/` | Shared frontend UI, services, hooks, contexts, public pages, auth components, navigation, utilities, and reusable feature code. |
| `frontend/modules/user/` | Developer/user-only dashboard pages, features, navigation, profile, posts, jobs, messages, notifications, premium, settings, search, and calendar views. |
| `frontend/modules/company/` | Company-only pages, layouts, components, and feature code for employer workflows. |
| `frontend/modules/desktop/` | Desktop-specific public page and navigation variants. |
| `frontend/modules/mobile/` | Mobile-specific public page and navigation variants. |
| `frontend/components/` | Legacy/shared frontend component area still used by current lazy-loaded pages. |
| `frontend/tests/` | Frontend source and behavior checks. |
| `backend/api/` | Express API server. It owns routes, controllers, middleware, services, queues, validation, config, uploads, and backend tests. |
| `backend/api/app.ts` | Express application factory. It installs security headers, CORS, body parsing, validation, rate limits, route mounts, health checks, readiness checks, and error handling. |
| `backend/api/server.ts` | Backend runtime entrypoint. It starts Express, warms runtime schemas, starts cleanup jobs and resume workers, logs Redis status, handles port fallback in development, and performs graceful shutdown. |
| `backend/api/routes/` | API route modules for auth, company, developer, matching, messages, notifications, payments, public data, resume, and uploads. |
| `backend/api/controllers/` | Request handlers for auth, OAuth, recovery, company, developer, matching, messages, notifications, posts, payments, resumes, uploads, and public data. |
| `backend/api/services/` | Business logic and integrations for auth, sessions, jobs, matching, messaging, payments, email, AI, resume storage, resume cleanup, uploads, antivirus, and rollout/migration support. |
| `backend/api/middleware/` | Security, request validation, authentication, input sanitization, and request processing middleware. |
| `backend/api/config/` | Environment loading, database, Redis, origins/CORS, logging, runtime schema warming, payment config, R2 storage config, and security event logging. |
| `backend/api/queues/` | Background queue workers, currently used by resume-related processing. |
| `backend/api/tests/` | Backend tests using Node's test runner and `supertest`. |
| `backend/serverless/` | Serverless adapter area for Vercel-style deployment paths. |
| `backend/ai-fastapi/` | Optional Python FastAPI AI service with its own app, tests, virtual environment, and requirements. |
| `database/init.sql` | Local database initialization script used by Docker Compose. |
| `database/migrations/` | Versioned SQL migrations for users, companies, jobs, payments, onboarding, messaging, notifications, auth sessions, posts, resumes, indexes, constraints, RLS, and preference fields. |
| `scripts/` | Repo-level automation for starting dev services, applying migrations, running tests, installing hooks, scanning security rules, launching server UI helpers, and syncing agent skills. |
| `.agents/` | Repo-local agent skill registry and generated assistant routing files. |
| `.githooks/` | Git hook scripts installed by the repo prepare step. |
| `docs/` | Supporting documentation and screenshots. |
| `STRUCTURE.md` | Source of truth for repo layout and frontend placement rules. |
| `.env.example` | Environment variable template. Use this for setup documentation, not the real `.env` files. |
| `docker-compose.yaml` | Local PostgreSQL and Redis services. |
| `render.yaml` | Render backend deployment config. |

## Feature Areas

### Public Web

The public web experience includes the landing page, employer landing page, employer pricing, user pricing, public job listings, job detail pages, company detail pages, privacy policy, and public resume viewing.

Main route owners:

- `frontend/src/App.jsx`
- `frontend/components/LandingPageClient.jsx`
- `frontend/components/EmployerLandingPageClient.jsx`
- `frontend/src/pages/JobsPage.jsx`
- `frontend/src/pages/JobDetailPage.jsx`
- `frontend/src/pages/CompanyDetails.jsx`
- `frontend/src/pages/PricingPage.jsx`
- `frontend/src/pages/EmployerPricingPage.jsx`

### Authentication And Account Access

The app supports register, login, logout, refresh/session flows, Google OAuth, GitHub OAuth, password reset, OTP-backed recovery, registration terms, and role-based dashboard routing.

Main backend owners:

- `backend/api/routes/authRoutes.ts`
- `backend/api/controllers/authController.ts`
- `backend/api/controllers/oauthController.ts`
- `backend/api/controllers/authRecoveryController.ts`
- `backend/api/services/authService.ts`
- `backend/api/services/authSessionService.ts`

### Developer/User Workspace

The developer side includes onboarding, profile state, dashboard navigation, job discovery, applications, saved jobs, posts, messages, notifications, calendar, projects, premium, settings, search, feedback, and help surfaces.

Main frontend owners:

- `frontend/modules/user/`
- `frontend/src/pages/UserDashboardPage.jsx`
- `frontend/src/pages/DeveloperOnboardingPage.jsx`
- `frontend/src/pages/JobMatchPage.jsx`
- `frontend/src/pages/PremiumPaymentPage.jsx`

Main backend owners:

- `backend/api/routes/developerRoutes.ts`
- `backend/api/routes/matchRoutes.ts`
- `backend/api/routes/resumeRoutes.ts`
- `backend/api/routes/uploadRoutes.ts`
- `backend/api/controllers/developerController.ts`
- `backend/api/controllers/matchController.ts`
- `backend/api/controllers/resumeController.ts`
- `backend/api/controllers/uploadController.ts`

### Company Workspace

The company side includes company onboarding, company dashboard routing, company profile data, job posting and status management, applicant management, analytics-style endpoints, and company payment flows.

Main frontend owners:

- `frontend/modules/company/`
- `frontend/src/pages/CompanyAppPage.jsx`
- `frontend/src/pages/CompanyOnboardingPage.jsx`

Main backend owners:

- `backend/api/routes/companyRoutes.ts`
- `backend/api/controllers/companyController.ts`
- `backend/api/controllers/companyPaymentController.ts`
- `backend/api/services/companyService.ts`
- `backend/api/services/jobService.ts`

### Messaging, Notifications, And Social Feed

Messaging and notifications are API-backed. Social feed behavior includes posts, comments, reactions, shares, and saved posts.

Main backend owners:

- `backend/api/routes/messagesRoutes.ts`
- `backend/api/routes/notificationsRoutes.ts`
- `backend/api/controllers/messagesController.ts`
- `backend/api/controllers/messagesDebugController.ts`
- `backend/api/controllers/notificationsController.ts`
- `backend/api/controllers/postsController.ts`
- `backend/api/services/conversationService.ts`
- `backend/api/services/messagingRolloutService.ts`
- `backend/api/services/messagingMigrationMonitor.ts`

### Payments And Premium

Payment-related flows include user premium, company checkout, PayPal capture/cancel behavior, webhooks, plan access, and temporary backend-controlled demo pricing.

Main backend owners:

- `backend/api/routes/paymentWebhookRoutes.ts`
- `backend/api/controllers/userPaymentController.ts`
- `backend/api/controllers/companyPaymentController.ts`
- `backend/api/controllers/paymentWebhookController.ts`
- `backend/api/services/paymentService.ts`
- `backend/api/services/planAccessService.ts`
- `backend/api/services/jobPostingPlans.ts`
- `backend/api/config/paymentEnv.ts`
- `backend/api/config/paymentDemoPricing.ts`

### Resume And AI

Resume-related features include uploads, storage, cleanup, parsing/conversion support, optimization, and queue-backed processing. AI matching can run through the optional FastAPI service when configured.

Main backend owners:

- `backend/api/services/resumeService.ts`
- `backend/api/services/resumeStorageService.ts`
- `backend/api/services/resumeOptimizationService.ts`
- `backend/api/services/resumeCleanupService.ts`
- `backend/api/services/pdfConversionService.ts`
- `backend/api/queues/`
- `backend/ai-fastapi/`

## Data And Storage

PostgreSQL is the main database. SQL migration files under `database/migrations/` define and evolve the schema for users, companies, jobs, payments, onboarding profiles, messages, conversations, notifications, auth sessions, security preferences, subscriptions, posts, resumes, indexes, constraints, and public-data RLS hardening.

Redis is optional and used when `REDIS_URL` is configured. Local development can start PostgreSQL and Redis with `docker-compose.yaml`.

Uploads and resume storage can use local upload paths and configured object storage integrations. R2 configuration lives in `backend/api/config/r2.ts`, and upload-related logic lives under `backend/api/services/r2UploadService.ts`, `backend/api/services/resumeStorageService.ts`, and `backend/api/routes/uploadRoutes.ts`.

## Runtime Flow

1. The browser loads the Vite React app from `frontend/`.
2. React Router in `frontend/src/App.jsx` resolves public, auth, user, company, onboarding, payment, and fallback routes.
3. Browser API calls go to `/api/*`.
4. Vite proxies local `/api/*` calls to Express at `127.0.0.1:5000` by default.
5. Express installs CORS, security headers, rate limits, validation, sanitization, route handlers, health checks, and readiness checks.
6. Express reads and writes PostgreSQL through the backend database layer.
7. Optional Redis, queue workers, email, payments, object storage, and FastAPI integrations run when their environment variables are configured.

## Local Commands

Common repo-level commands:

```bash
pnpm start
pnpm run frontend:dev
pnpm run backend:start
pnpm run build
pnpm run lint
pnpm run test
pnpm run audit
pnpm run db:migrate:dry
```

Frontend-specific commands:

```bash
pnpm --dir frontend run dev
pnpm --dir frontend run typecheck
pnpm --dir frontend run lint
pnpm --dir frontend run build
```

Backend-specific commands:

```bash
pnpm --dir backend run start
pnpm --dir backend run watch
pnpm --dir backend run typecheck
pnpm --dir backend run test
pnpm --dir backend run fastapi:dev
```

## Deployment Notes

The backend deployment config lives in `render.yaml`. It runs the backend from `backend/`, installs with pnpm, starts with `pnpm run start`, and exposes `/api/health` as the health check path.

The frontend includes Vite/Vercel config files in `frontend/`, including `frontend/vercel.json` and `frontend/vite.config.mjs`.

Production secrets should live in the hosting provider settings. Keep `.env.example` as the documentation source for required variables, and do not document values from `.env` or `.env.local`.

## Verification And Safety Notes

- `STRUCTURE.md` is the source of truth for file placement.
- Keep shared frontend code in `frontend/modules/shared`.
- Keep developer-only frontend code in `frontend/modules/user`.
- Keep company-only frontend code in `frontend/modules/company`.
- Keep desktop and mobile frontend variants separated when their layouts differ.
- Run targeted frontend and backend checks after changes.
- Use `.env.example` for setup references and avoid exposing local secrets.
