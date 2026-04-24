# KapIT

KapIT is a full-stack hiring platform with separate developer and company workflows.
It includes authentication, onboarding, public/private job flows, applicant management, messaging, notifications, premium payment flows, and optional AI-powered matching and resume analysis.

## Preview / Demo

- Demo URL: `https://your-demo-link-here.com`
- Screenshots:
  - `docs/screenshots/landing-page.png`
  - `docs/screenshots/user-dashboard.png`
  - `docs/screenshots/company-dashboard.png`
  - `docs/screenshots/job-match.png`

## Tech Stack (Auto-Detected)

### Frontend

- Next.js (App Router + Pages usage in `apps/web`)
- React
- Tailwind CSS
- PostCSS

### Backend

- Node.js
- Express
- FastAPI (optional AI service in `services/ai-fastapi`)

### Database

- PostgreSQL (`pg`, SQL migrations under `database/migrations`)
- Redis (optional, via `redis` package and `REDIS_URL`)

### Tools / Libraries

- Authentication/Security: `jsonwebtoken`, `bcrypt`, `helmet`, `cors`, `cookie-parser`, `express-validator`, `zod`
- Logging/Config: `pino`, `dotenv`
- OAuth: `google-auth-library`, `@react-oauth/google`
- Payments/Email: PayPal env-configured flows, `resend`/`sendgrid`/`mailgun` env provider pattern
- Testing: Node test runner + `supertest`, Python test files for FastAPI
- Secret scanning: `gitleaks`

## Features

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

## Installation / Setup

### 1. Clone

```bash
git clone https://github.com/your-username/kapit.git
cd kapit
```

### 2. Install dependencies

```bash
npm install
```

For optional FastAPI service:

```bash
cd services/ai-fastapi
pip install -r requirements.txt
cd ../..
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill required values in `.env.local`.

### 4. Run locally

```bash
npm run dev
```

Other useful scripts:

```bash
npm run server
npm run next:dev
npm run build
npm run test
npm run fastapi:dev
```

## Environment Variables

The full template is in `.env.example`.
Key groups used by this codebase:

### Core server/runtime

- `PORT`
- `HOST`
- `NODE_ENV`
- `QUIET_STARTUP`
- `SHUTDOWN_TIMEOUT_MS`
- `LOG_LEVEL`

### Frontend runtime

- `NEXTJS_HOST`
- `NEXTJS_PORT`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_EXPRESS_API_URL`
- `NEXT_PUBLIC_FASTAPI_URL`
- `NEXT_PUBLIC_CSRF_COOKIE_NAME`

### Database

- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`
- `DB_POOL_MAX`
- `DB_IDLE_TIMEOUT_MS`
- `DB_CONNECTION_TIMEOUT_MS`
- `DB_SSL_REJECT_UNAUTHORIZED`

### Auth/security

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRE`
- `JWT_REFRESH_EXPIRE_DAYS`
- `ACCESS_TOKEN_COOKIE_NAME`
- `REFRESH_TOKEN_COOKIE_NAME`
- `CSRF_COOKIE_NAME`
- `CORS_ALLOWED_ORIGINS`
- `ALLOW_KAPIT_NETLIFY_PREVIEW`

### Recovery/OTP/email

- `PASSWORD_RESET_TOKEN_TTL_MINUTES`
- `PASSWORD_RESET_URL_BASE`
- `PASSWORD_RESET_CLEANUP_INTERVAL_MS`
- `OTP_TTL_MINUTES`
- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `SENDGRID_API_KEY`
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`

### Payments

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV`
- `PAYMENT_API_TIMEOUT_MS`
- `PAYMENT_API_RETRY_MAX`
- `PAYMENT_API_RETRY_BASE_MS`
- `PAYMENT_IDEMPOTENCY_TTL_SECONDS`

### AI/optional service routing

- `FASTAPI_URL`
- `FASTAPI_URL_PRODUCTION`
- `NEXT_PUBLIC_FASTAPI_URL`
- `NEXT_PUBLIC_FASTAPI_URL_PRODUCTION`
- `FASTAPI_TIMEOUT_MS`

### Optional Redis

- `REDIS_URL`
- `LOG_REDIS_STATUS`
- `REDIS_CONNECT_TIMEOUT_MS`
- `REDIS_FAILOPEN_COOLDOWN_MS`

## How It Works

1. The Next.js frontend (`apps/web`) serves pages and client flows.
2. Frontend API calls target `/api/*`, which are routed to the Express backend.
3. Express (`server`) handles auth, profiles, jobs, applications, messaging, notifications, posts, and payment-related flows.
4. Express persists core data in PostgreSQL and can use Redis if configured.
5. For AI-enabled endpoints, Express calls the FastAPI service (`services/ai-fastapi`) through `FASTAPI_URL`.
6. Public deployment is split:
   - Frontend: Netlify (`apps/web/netlify.toml`)
   - Backend: Render (`render.yaml`)

## Testing

Run backend tests:

```bash
npm test
```

Run FastAPI tests (if Python test tooling is installed in your environment):

```bash
python -m pytest services/ai-fastapi/tests
```

## Folder Structure

See [STRUCTURE.md](STRUCTURE.md) for the full project structure and placement rules.

## Contributing

1. Create a feature branch.
2. Make focused changes with clear commit messages.
3. Run tests and relevant checks locally.
4. Open a pull request with a concise summary and validation notes.

## License

MIT License

## Author

- Name: `Your Name`
- GitHub: `https://github.com/your-username`
