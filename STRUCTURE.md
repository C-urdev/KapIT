# Project Structure

This file is the single source of truth for repository layout and frontend placement rules.

## Repository Layout

```text
kapIT/
|- apps/
|  `- web/                  # Next.js frontend
|- server/                  # Express API server
|  |- config/
|  |- controllers/
|  |- middleware/
|  |- routes/
|  |- services/
|  |- tests/
|  `- validation/
|- services/
|  `- ai-fastapi/           # Optional FastAPI AI microservice
|- database/
|  |- migrations/           # SQL migrations
|  `- init.sql
|- scripts/                 # Dev/build orchestration scripts
|- render.yaml              # Render backend config
`- .env.example             # Environment template
```

## Frontend Domain Layout

Use these domains for frontend code ownership:

- `apps/web/src/shared` for shared code used by both user and company flows.
- `apps/web/src/user` for user-only code.
- `apps/web/src/company` for company-only code.

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
