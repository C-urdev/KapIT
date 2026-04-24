[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](License.md)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Server-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-AI_Service-009688?logo=fastapi&logoColor=white)

# KapIT

KapIT is a full-stack hiring platform with separate developer and company workflows.
It includes authentication, onboarding, public/private job flows, applicant management, messaging, notifications, premium payment flows, and optional AI-powered matching and resume analysis.

## 🎬 Preview / Demo

- Screenshots:
  - `docs/screenshots/landing-page.png`
  - `docs/screenshots/user-dashboard.png`
  - `docs/screenshots/company-dashboard.png`

## 🧰 Tech Stack (Auto-Detected)

### 🌐 Frontend

- Next.js (App Router + Pages usage in `apps/web`)
- React
- Tailwind CSS
- PostCSS

### 🛠️ Backend

- Node.js
- Express
- FastAPI (optional AI service in `services/ai-fastapi`)

### 🗄️ Database

- PostgreSQL (`pg`, SQL migrations under `database/migrations`)
- Redis (optional, via `redis` package and `REDIS_URL`)

### 🔧 Tools / Libraries

- Authentication/Security: `jsonwebtoken`, `bcrypt`, `helmet`, `cors`, `cookie-parser`, `express-validator`, `zod`
- Logging/Config: `pino`, `dotenv`
- OAuth: `google-auth-library`, `@react-oauth/google`
- Payments/Email: PayPal env-configured flows, `resend` env provider pattern
- Testing: Node test runner + `supertest`, Python test files for FastAPI
- Secret scanning: `gitleaks`

## ✨ Features

- Account authentication
  - Register/login/logout/refresh
  - JWT-based session flow
  - Google and GitHub OAuth callbacks
- Recovery and verification flows
  - Password reset link flow
  - OTP flows for password reset and registration
  - Optional localhost bypass flags for local development
- Role-based application flows
  - Developer and company account handling
  - Separate onboarding pages for company and developer profiles
- Jobs and applications
  - Public job listings and job detail pages
  - Authenticated jobs feed
  - Save jobs, apply to jobs, company job posting and status management
- Company management
  - Company profile editing
  - Applicant list and applicant status updates
  - Analytics endpoints
- Messaging and notifications
  - Conversations and message thread endpoints
  - Read/unread notification management
  - Messaging debug/parity endpoints
- Social feed features
  - Posts feed, comments, reactions, shares, saved posts
- Payments
  - User premium and company checkout/payment flows
  - PayPal capture/cancel endpoints
- AI features (optional FastAPI service)
  - Job matching
  - Candidate ranking
  - Resume analysis

## 🔐 Environment Setup

Use `.env.example` as the single source of truth for environment variables.

1. Copy `.env.example` to `.env` (and to `apps/web/.env.local` if needed for frontend-only overrides).
2. Fill required secrets and URLs.
3. Keep production secrets in your hosting provider settings, not in Git.

## ⚙️ How It Works

1. The Next.js frontend (`apps/web`) serves pages and client flows.
2. Frontend API calls target `/api/*`, which are routed to the Express backend.
3. Express (`server`) handles auth, profiles, jobs, applications, messaging, notifications, posts, and payment-related flows.
4. Express persists core data in PostgreSQL and can use Redis if configured.
5. For AI-enabled endpoints, Express calls the FastAPI service (`services/ai-fastapi`) through `FASTAPI_URL`.
6. Public deployment is split:
   - Frontend: Netlify (`apps/web/netlify.toml`)
   - Backend: Render (`render.yaml`)

## 🗂️ Folder Structure

See [STRUCTURE.md](STRUCTURE.md) for the full project structure and placement rules.

## 🤝 Contributing

1. Create a feature branch.
2. Make focused changes with clear commit messages.
3. Run tests and relevant checks locally.
4. Open a pull request with a concise summary and validation notes.

## 📄 License

This project is licensed under the MIT License - see the [License.md](License.md) file for details.

## 👤 Author

- Name: `Cardino Christian`
- GitHub: `https://github.com/C-urdev/KapIT`
