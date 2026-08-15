[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](License.md)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Backend-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_API-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-AI_Service-009688?logo=fastapi&logoColor=white)

# KapIT — Full-Stack Hiring Platform for Developers and Companies

KapIT is an open-source hiring platform that connects developers with companies through structured, role-based workflows. It covers the full hiring loop: authentication, onboarding, job posting, applications, applicant management, messaging, notifications, social feed, premium subscriptions, and optional AI-powered job matching and resume analysis.

> **Built with**: Vite + React (frontend) · Express + TypeScript (backend) · PostgreSQL · Redis (optional) · FastAPI (optional AI service)

## ✨ Features

### For Developers
- Register, log in via email, Google, or GitHub OAuth
- Complete a developer onboarding profile
- Browse public job listings and an authenticated job feed
- Apply to jobs, save jobs, and track application status
- Upload and manage a resume (with AI-powered optimization support)
- Access a social feed: posts, comments, reactions, shares
- Direct messaging and real-time notifications
- Premium subscription with PayPal payment flow

### For Companies
- Company registration and onboarding
- Post jobs, manage listings, and control job status
- View applicant lists and update applicant status
- Analytics-style data endpoints
- Company premium checkout and payment flow

### Platform Capabilities
- JWT session management with cookie-based refresh
- Google and GitHub OAuth callback handling
- OTP-backed password reset and email verification
- Role-based routing (developer vs company)
- Background queue workers (resume processing)
- R2 object storage for resume and file uploads
- Antivirus scanning middleware on uploads
- Demo-mode pricing override (backend-only, no code change needed)
- Optional FastAPI AI microservice: job matching, candidate ranking, resume analysis

## 🧰 Tech Stack

### Frontend
- **Vite 5** + **React** with TypeScript support
- **React Router** — viewport-aware page shells with desktop/mobile variants
- **Tailwind CSS** — utility-first styling
- **PostCSS**
- SEO helpers via `frontend/lib/seo.ts`

### Backend
- **Node.js** + **Express** (TypeScript) — `backend/api/`
- **FastAPI** (Python) — optional AI microservice, `backend/ai-fastapi/`
- **Serverless adapter** — Vercel-style entrypoint, `backend/serverless/`

### Database & Storage
- **PostgreSQL** — versioned SQL migrations in `database/migrations/`
- **Redis** — optional, activated via `REDIS_URL`
- **Cloudflare R2** — object storage for file uploads and resumes

### Auth & Security
- `jsonwebtoken` · `bcrypt` · `helmet` · `cors` · `cookie-parser`
- `express-validator` · `zod` — validation layers
- `gitleaks` — secret scanning pre-commit hook
- Idempotency key middleware, input sanitization, rate limiting

### Payments & Email
- **PayPal** — user premium and company checkout flows
- **Resend** — transactional email delivery

### Observability & Tooling
- `pino` — structured logging
- `dotenv` — environment config
- `google-auth-library` + `@react-oauth/google` — Google OAuth
- Node test runner + `supertest` — backend tests
- Python pytest — FastAPI service tests

## 🗂️ Repo Structure

```text
kapIT/
├── frontend/           # Vite React web app
│   ├── src/
│   │   ├── App.jsx     # Main browser route table
│   │   └── pages/      # Viewport-aware page shells (desktop / mobile / shared)
│   ├── modules/
│   │   ├── shared/     # Shared UI, services, hooks, contexts
│   │   ├── user/       # Developer-only features & pages
│   │   ├── company/    # Company-only features & pages
│   │   ├── desktop/    # Desktop-specific public page variants
│   │   └── mobile/     # Mobile-specific public page variants
│   ├── lib/            # Frontend utilities (seo.ts, etc.)
│   └── components/     # Legacy/shared component area
├── backend/
│   ├── api/            # Express TypeScript API server
│   │   ├── routes/     # Route modules (auth, company, developer, jobs, …)
│   │   ├── controllers/ # Request handlers
│   │   ├── services/   # Business logic & integrations
│   │   ├── middleware/ # Auth, security, validation, sanitization
│   │   ├── config/     # Env, DB, Redis, CORS, payment, R2, logging
│   │   └── queues/     # Background workers (resume processing)
│   ├── ai-fastapi/     # Optional Python FastAPI AI microservice
│   └── serverless/     # Serverless/Vercel adapter
├── database/
│   ├── migrations/     # Versioned SQL (users, jobs, payments, messaging, …)
│   └── init.sql        # Docker Compose bootstrap
├── scripts/            # Dev startup, migration runner, security guard
├── docker-compose.yaml # Local PostgreSQL + Redis
├── render.yaml         # Render backend deployment
└── .env.example        # Environment variable template
```

See [STRUCTURE.md](STRUCTURE.md) for full placement rules.

## ⚙️ How It Works

1. Browser loads the Vite React app from `frontend/`.
2. `frontend/src/App.jsx` resolves routes — public, auth, developer, company, onboarding, payment, fallback.
3. Frontend API calls hit `/api/*`. In local dev, Vite proxies to Express on port `5000`.
4. Express (`backend/api/`) handles all business logic: auth, profiles, jobs, applications, messaging, notifications, posts, payments, resume uploads.
5. PostgreSQL stores core data. Redis (optional) handles caching and session support.
6. Queue workers in `backend/api/queues/` process resume jobs in the background.
7. When `FASTAPI_URL` is set, Express delegates AI-related endpoints to the FastAPI service.

## 🔐 Environment Setup

Use `.env.example` as the single source of truth for all environment variables.

```bash
# 1. Copy template
cp .env.example .env

# 2. For frontend-only overrides
cp .env.example frontend/.env.local

# 3. Fill required secrets and URLs
# 4. Keep production secrets in your hosting provider — never in Git
```

### Demo Pricing Override

Control demo pricing entirely from backend env vars — no code changes required:

| Variable | Purpose |
|---|---|
| `PAYMENT_DEMO_PRICING_ENABLED` | Enable demo pricing mode |
| `PAYMENT_DEMO_AMOUNT_PHP` | Override PayPal charge amount for demos |
| `PAYMENT_DEMO_PRICING_EXPIRES_AT` | Auto-expire demo pricing at a timestamp |

Real plan prices, plan IDs, and entitlements remain unchanged in internal records.

## 🚀 Local Development

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for local PostgreSQL + Redis)
- Python 3.11+ (only if using the FastAPI AI service)

### Start Everything

```bash
# Start PostgreSQL + Redis
docker compose up -d

# Install all dependencies
pnpm install

# Start frontend + backend concurrently
pnpm start
```

### Individual Commands

```bash
# Frontend
pnpm run frontend:dev
pnpm --dir frontend run typecheck
pnpm --dir frontend run lint

# Backend
pnpm run backend:start
pnpm --dir backend run watch
pnpm --dir backend run typecheck

# Database
pnpm run db:migrate:dry

# Tests
pnpm run test
pnpm --dir backend run test

# FastAPI AI service (optional)
pnpm --dir backend run fastapi:dev

# Security audit
pnpm run audit
```

## 🌐 Deployment

| Service | Config | Notes |
|---|---|---|
| **Backend** | `render.yaml` | Express server on Render; health check at `/api/health` |
| **Frontend** | `frontend/vercel.json` + `frontend/vite.config.mjs` | Deploy to Vercel |

Production secrets go in the hosting provider settings — not in `.env` or Git.

## 🤝 Contributing

1. Create a feature branch.
2. Make focused changes with clear commit messages (`feat:` / `fix:` / `chore:`).
3. Run `pnpm run test` and `pnpm run lint` locally.
4. Open a pull request with a summary and validation notes.

## 📄 License

MIT — see [License.md](License.md).

## 👤 Author

**Cardino Christian** · [github.com/C-urdev/KapIT](https://github.com/C-urdev/KapIT)
