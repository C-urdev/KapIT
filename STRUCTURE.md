# Project Structure

This file is the single source of truth for repository layout and frontend placement rules.

## Repository Layout

```text
kapIT/
|- frontend/                # Vite React frontend
|  |- src/
|  |  |- pages/             # Viewport-aware page shells
|  |  |  |- desktop/        # Desktop page variants (auth/company/public/user)
|  |  |  |- mobile/         # Mobile page variants (auth/company/public/user)
|  |  |  `- shared/         # Shared page content components
|  |  `- App.jsx
|  |- modules/
|  |  |- shared/            # Shared UI, services, hooks, contexts
|  |  |- user/              # Developer/user-only features & pages
|  |  |- company/           # Company-only features & pages
|  |  |- desktop/           # Desktop navigation & public page variants
|  |  |- mobile/            # Mobile navigation & public page variants
|  |  |- assets/            # Static assets (SVGs, logos)
|  |  `- hooks/             # Top-level shared hooks
|  |- lib/                  # Utility libraries (e.g. seo.ts)
|  `- components/           # Legacy/shared component area
|- backend/
|  |- api/                  # Express API server
|  |  |- config/            # Env, DB, Redis, CORS, logging, schema warmers
|  |  |- controllers/       # Request handlers
|  |  |- middleware/        # Auth, security, validation, sanitization
|  |  |- routes/            # Route modules
|  |  |- services/          # Business logic & integrations
|  |  |- queues/            # Background queue workers
|  |  |- utils/             # Shared backend utilities
|  |  |- scripts/           # Backend-local scripts
|  |  |- uploads/           # Local upload staging area
|  |  `- tests/
|  |- serverless/           # Serverless adapter (Vercel-style)
|  `- ai-fastapi/           # Optional FastAPI AI microservice
|- database/
|  |- migrations/           # SQL migrations
|  |- reports/              # RLS & schema audit reports
|  |- examples/             # Example data / seed helpers
|  `- init.sql
|- scripts/                 # Dev/build orchestration scripts
|- render.yaml              # Render backend config
`- .env.example             # Environment template
```

## Frontend Domain Layout

Use these domains for frontend code ownership:

- `frontend/modules/shared` for shared code used by both user and company flows.
- `frontend/modules/user` for user-only code.
- `frontend/modules/company` for company-only code.

## Runtime Notes

- The frontend runtime is Vite React, not Next.js.
- Keep the remaining plain JavaScript holdouts only when they are intentional runtime, config, or script exceptions during the migration.

## Placement Rules

- Put reusable UI and shared logic in `shared/components`, `shared/services`, or `shared/utils`.
- Put user-specific features in `user/features`, `user/pages`, and `user/components`.
- Put company-specific features in `company/features`, `company/pages`, and `company/components`.
- For navigation and shell components, keep desktop and mobile variants separated when layouts differ.

## Naming Rules

- Use `User` prefix for user-only components when it improves clarity.
- Use `Company` prefix for company-only components when it improves clarity.
- Keep shared components neutral (for example, `SearchableSelect`).

## Responsive Requirement

For new user/company features:

- Provide both desktop and mobile UI coverage.
- Shared logic can be reused, but UI structure should still be tuned per screen size.
