# Repository Context & Domain Navigation Map

Instruction for AI Agents:
Read this file first when starting any session. Use this lookup table to load the right docs, skill definitions, and source directories fast. Do not read real `.env` values, secrets, keys, dumps, or credentials. Use `.env.example` for setup context only.

## Context Snapshot

- App type: full-stack hiring platform with Vite React frontend, Express API backend, PostgreSQL migrations, optional Redis, optional FastAPI AI service.
- Source-of-truth layout doc: `STRUCTURE.md`
- High-signal overview doc: `preview.md`
- Main setup doc: `README.md`
- Deployment anchor: `render.yaml`
- Local infra anchor: `docker-compose.yaml`
- Skill/router anchors: `.agents/AGENTS.md`, `.agents/skills/README.md`, `.agents/skills/SKILLS_OVERVIEW.md`, `CLAUDE.md`, `.github/copilot-instructions.md`

## Core Directory Tree

```text
.
|- frontend/
|  |- src/
|  |  |- pages/
|  |  |  |- desktop/
|  |  |  |- mobile/
|  |  |  `- shared/
|  |  `- App.jsx
|  |- modules/
|  |  |- shared/
|  |  |- user/
|  |  |- company/
|  |  |- desktop/
|  |  |- mobile/
|  |  |- assets/
|  |  `- hooks/
|  |- lib/
|  `- components/
|- backend/
|  |- api/
|  |  |- config/
|  |  |- controllers/
|  |  |- middleware/
|  |  |- routes/
|  |  |- services/
|  |  |- queues/
|  |  |- utils/
|  |  |- scripts/
|  |  |- uploads/
|  |  `- tests/
|  |- ai-fastapi/
|  |- serverless/
|  `- scripts/
|- database/
|  |- migrations/
|  |- reports/
|  `- examples/
|- scripts/
|- docs/
|- .agents/
|  |- skills/
|  `- gemini-skills/
|- .github/
|- .githooks/
|- README.md
|- STRUCTURE.md
|- preview.md
|- CLAUDE.md
`- CONTEXT_MAP.md
```

## 1. Master Index of Documentation (.md Files)

### Architecture & Layout

- `README.md`
- `STRUCTURE.md`
- `preview.md`
- `CLAUDE.md`
- `License.md`
- `.github/copilot-instructions.md`

### Security & Hardening

- `docs/security-secret-scan.md`
- `docs/repository-security-hardening.md`
- `database/reports/rls-policy-risk-report-2026-05-11.md`
- `database/reports/rls-production-verification-checklist-2026-05-11.md`

### Agent Skills, Rules & Prompt Context

#### Router / Registry / Skill Index

- `.agents/AGENTS.md`
- `.agents/gemini-skills/gemini-master-skill.md`
- `.agents/skills/README.md`
- `.agents/skills/SKILLS_OVERVIEW.md`

#### Design Skills

- `.agents/skills/design/brandkit/SKILL.md`
- `.agents/skills/design/design-taste-frontend/SKILL.md`
- `.agents/skills/design/design-taste-frontend-v1/SKILL.md`
- `.agents/skills/design/frontend-design-direction/SKILL.md`
- `.agents/skills/design/full-output-enforcement/SKILL.md`
- `.agents/skills/design/gpt-taste/SKILL.md`
- `.agents/skills/design/high-end-visual-design/SKILL.md`
- `.agents/skills/design/image-to-code/SKILL.md`
- `.agents/skills/design/imagegen-frontend-mobile/SKILL.md`
- `.agents/skills/design/imagegen-frontend-web/SKILL.md`
- `.agents/skills/design/industrial-brutalist-ui/SKILL.md`
- `.agents/skills/design/interface-kit/SKILL.md`
- `.agents/skills/design/interface-kit/references/accessibility-checklist.md`
- `.agents/skills/design/interface-kit/references/animation-playbook.md`
- `.agents/skills/design/interface-kit/references/component-patterns.md`
- `.agents/skills/design/interface-kit/references/review-checklist.md`
- `.agents/skills/design/make-interfaces-feel-better/SKILL.md`
- `.agents/skills/design/minimalist-ui/SKILL.md`
- `.agents/skills/design/redesign-existing-projects/SKILL.md`
- `.agents/skills/design/stitch-design-taste/SKILL.md`
- `.agents/skills/design/stitch-design-taste/DESIGN.md`

#### Development Skills

- `.agents/skills/development/finishing-a-development-branch/SKILL.md`
- `.agents/skills/development/junior-to-senior/SKILL.md`
- `.agents/skills/development/junior-to-senior/references/research-playbook.md`
- `.agents/skills/development/junior-to-senior/references/review-rubric.md`
- `.agents/skills/development/karpathy-guidelines/SKILL.md`
- `.agents/skills/development/last-20-percent/SKILL.md`
- `.agents/skills/development/last-20-percent/references/last-20-catalog.md`
- `.agents/skills/development/receiving-code-review/SKILL.md`
- `.agents/skills/development/requesting-code-review/SKILL.md`
- `.agents/skills/development/requesting-code-review/code-reviewer.md`
- `.agents/skills/development/subagent-driven-development/SKILL.md`
- `.agents/skills/development/subagent-driven-development/implementer-prompt.md`
- `.agents/skills/development/subagent-driven-development/task-reviewer-prompt.md`
- `.agents/skills/development/systematic-debugging/SKILL.md`
- `.agents/skills/development/systematic-debugging/CREATION-LOG.md`
- `.agents/skills/development/systematic-debugging/condition-based-waiting.md`
- `.agents/skills/development/systematic-debugging/defense-in-depth.md`
- `.agents/skills/development/systematic-debugging/root-cause-tracing.md`
- `.agents/skills/development/systematic-debugging/test-academic.md`
- `.agents/skills/development/systematic-debugging/test-pressure-1.md`
- `.agents/skills/development/systematic-debugging/test-pressure-2.md`
- `.agents/skills/development/systematic-debugging/test-pressure-3.md`
- `.agents/skills/development/writing-skills/SKILL.md`
- `.agents/skills/development/writing-skills/anthropic-best-practices.md`
- `.agents/skills/development/writing-skills/persuasion-principles.md`
- `.agents/skills/development/writing-skills/testing-skills-with-subagents.md`
- `.agents/skills/development/writing-skills/examples/CLAUDE_MD_TESTING.md`

#### Frontend Development Skills

- `.agents/skills/frontend-development/frontend-patterns/SKILL.md`
- `.agents/skills/frontend-development/react-patterns/SKILL.md`
- `.agents/skills/frontend-development/react-performance/SKILL.md`

#### Marketing Content Skills

- `.agents/skills/marketing-content/article-content/SKILL.md`
- `.agents/skills/marketing-content/copywriting/SKILL.md`
- `.agents/skills/marketing-content/fuck-slop/SKILL.md`
- `.agents/skills/marketing-content/fuck-slop/references/tells.md`
- `.agents/skills/marketing-content/fuck-slop/references/voices.md`
- `.agents/skills/marketing-content/podcast-marketing/SKILL.md`
- `.agents/skills/marketing-content/translation/SKILL.md`
- `.agents/skills/marketing-content/video-marketing/SKILL.md`
- `.agents/skills/marketing-content/visual-content/SKILL.md`

#### Marketing Platform Skills

- `.agents/skills/marketing-platforms/github/SKILL.md`
- `.agents/skills/marketing-platforms/grokipedia-recommendations/SKILL.md`
- `.agents/skills/marketing-platforms/linkedin-posts/SKILL.md`
- `.agents/skills/marketing-platforms/medium-posts/SKILL.md`
- `.agents/skills/marketing-platforms/pinterest-posts/SKILL.md`
- `.agents/skills/marketing-platforms/reddit-posts/SKILL.md`
- `.agents/skills/marketing-platforms/tiktok-captions/SKILL.md`
- `.agents/skills/marketing-platforms/twitter-x-posts/SKILL.md`
- `.agents/skills/marketing-platforms/youtube-seo/SKILL.md`

#### Marketing SEO Skills

- `.agents/skills/marketing-seo/analytics-tracking/SKILL.md`
- `.agents/skills/marketing-seo/entity-seo/SKILL.md`
- `.agents/skills/marketing-seo/local-seo/SKILL.md`
- `.agents/skills/marketing-seo/parasite-seo/SKILL.md`
- `.agents/skills/marketing-seo/programmatic-seo/SKILL.md`
- `.agents/skills/marketing-seo/seo/SKILL.md`

#### Planning / Context Skills

- `.agents/skills/planning-context/brainstorming/SKILL.md`
- `.agents/skills/planning-context/brainstorming/spec-document-reviewer-prompt.md`
- `.agents/skills/planning-context/brainstorming/visual-companion.md`
- `.agents/skills/planning-context/caveman/SKILL.md`
- `.agents/skills/planning-context/caveman/README.md`
- `.agents/skills/planning-context/context-canary/SKILL.md`
- `.agents/skills/planning-context/context-canary/references/research.md`
- `.agents/skills/planning-context/context-engineering/SKILL.md`
- `.agents/skills/planning-context/dispatching-parallel-agents/SKILL.md`
- `.agents/skills/planning-context/executing-plans/SKILL.md`
- `.agents/skills/planning-context/grill-me/SKILL.md`
- `.agents/skills/planning-context/loop-factory/SKILL.md`
- `.agents/skills/planning-context/loop-factory/references/autonomous.md`
- `.agents/skills/planning-context/loop-factory/references/commands.md`
- `.agents/skills/planning-context/loop-factory/references/install.md`
- `.agents/skills/planning-context/loop-factory/references/spec-authoring.md`
- `.agents/skills/planning-context/using-git-worktrees/SKILL.md`
- `.agents/skills/planning-context/writing-plans/SKILL.md`
- `.agents/skills/planning-context/writing-plans/plan-document-reviewer-prompt.md`

#### Testing Skills

- `.agents/skills/testing/e2e-testing/SKILL.md`
- `.agents/skills/testing/react-testing/SKILL.md`
- `.agents/skills/testing/test-driven-development/SKILL.md`
- `.agents/skills/testing/test-driven-development/testing-anti-patterns.md`
- `.agents/skills/testing/verification-before-completion/SKILL.md`
- `.agents/skills/testing/verification-loop/SKILL.md`

#### Video Skills

- `.agents/skills/video/remotion-best-practices/SKILL.md`
- `.agents/skills/video/remotion-best-practices/rules/3d.md`
- `.agents/skills/video/remotion-best-practices/rules/audio.md`
- `.agents/skills/video/remotion-best-practices/rules/audio-visualization.md`
- `.agents/skills/video/remotion-best-practices/rules/calculate-metadata.md`
- `.agents/skills/video/remotion-best-practices/rules/compositions.md`
- `.agents/skills/video/remotion-best-practices/rules/display-captions.md`
- `.agents/skills/video/remotion-best-practices/rules/effects.md`
- `.agents/skills/video/remotion-best-practices/rules/ffmpeg.md`
- `.agents/skills/video/remotion-best-practices/rules/get-audio-duration.md`
- `.agents/skills/video/remotion-best-practices/rules/get-video-dimensions.md`
- `.agents/skills/video/remotion-best-practices/rules/get-video-duration.md`
- `.agents/skills/video/remotion-best-practices/rules/gifs.md`
- `.agents/skills/video/remotion-best-practices/rules/google-fonts.md`
- `.agents/skills/video/remotion-best-practices/rules/html-in-canvas.md`
- `.agents/skills/video/remotion-best-practices/rules/images.md`
- `.agents/skills/video/remotion-best-practices/rules/import-srt-captions.md`
- `.agents/skills/video/remotion-best-practices/rules/light-leaks.md`
- `.agents/skills/video/remotion-best-practices/rules/local-fonts.md`
- `.agents/skills/video/remotion-best-practices/rules/lottie.md`
- `.agents/skills/video/remotion-best-practices/rules/maplibre.md`
- `.agents/skills/video/remotion-best-practices/rules/measuring-dom-nodes.md`
- `.agents/skills/video/remotion-best-practices/rules/measuring-text.md`
- `.agents/skills/video/remotion-best-practices/rules/parameters.md`
- `.agents/skills/video/remotion-best-practices/rules/sequencing.md`
- `.agents/skills/video/remotion-best-practices/rules/sfx.md`
- `.agents/skills/video/remotion-best-practices/rules/silence-detection.md`
- `.agents/skills/video/remotion-best-practices/rules/subtitles.md`
- `.agents/skills/video/remotion-best-practices/rules/tailwind.md`
- `.agents/skills/video/remotion-best-practices/rules/text-animations.md`
- `.agents/skills/video/remotion-best-practices/rules/timing.md`
- `.agents/skills/video/remotion-best-practices/rules/transcribe-captions.md`
- `.agents/skills/video/remotion-best-practices/rules/transitions.md`
- `.agents/skills/video/remotion-best-practices/rules/transparent-videos.md`
- `.agents/skills/video/remotion-best-practices/rules/trimming.md`
- `.agents/skills/video/remotion-best-practices/rules/video-layout.md`
- `.agents/skills/video/remotion-best-practices/rules/videos.md`
- `.agents/skills/video/remotion-best-practices/rules/voiceover.md`

### History & Workflow

- No repo-local `docs/prompt-history.md` or session-history markdown found in tracked working docs.
- External workflow note used in prior repo work: `Z:\Appdata\vaults\cdproj\Kapit prompt history\prompt-history 5.md`
  - Outside repo. Verify path before using.

### Setup, Database & Deployment Docs

- `README.md`
- `preview.md`
- `STRUCTURE.md`
- `database/reports/rls-policy-risk-report-2026-05-11.md`
- `database/reports/rls-production-verification-checklist-2026-05-11.md`

Related non-markdown setup anchors:

- `.env.example`
- `docker-compose.yaml`
- `render.yaml`
- `package.json`
- `backend/package.json`
- `frontend/package.json`
- `database/init.sql`
- `database/migrations/*.sql`

### Other Repository Docs

- `backend/ai-fastapi/.pytest_cache/README.md`

### Generated / Vendor Markdown Inside Local Virtual Environment

These were discovered in workspace but are not project-authored context docs. Treat them as vendor/license files, not repo guidance.

- `backend/ai-fastapi/.venv313/Lib/site-packages/httpcore-1.0.9.dist-info/licenses/LICENSE.md`
- `backend/ai-fastapi/.venv313/Lib/site-packages/httpx-0.28.1.dist-info/licenses/LICENSE.md`
- `backend/ai-fastapi/.venv313/Lib/site-packages/idna-3.15.dist-info/licenses/LICENSE.md`
- `backend/ai-fastapi/.venv313/Lib/site-packages/pip/_vendor/idna/LICENSE.md`
- `backend/ai-fastapi/.venv313/Lib/site-packages/pip-26.1.1.dist-info/licenses/src/pip/_vendor/idna/LICENSE.md`
- `backend/ai-fastapi/.venv313/Lib/site-packages/starlette-0.47.3.dist-info/licenses/LICENSE.md`
- `backend/ai-fastapi/.venv313/Lib/site-packages/uvicorn-0.35.0.dist-info/licenses/LICENSE.md`

## 2. Short Keyword Routing Rules

### `[backend]` / `[api]`

- Context docs: `STRUCTURE.md`, `preview.md`, `README.md`
- Target paths:
  - `backend/api/app.ts`
  - `backend/api/server.ts`
  - `backend/api/routes/`
  - `backend/api/controllers/`
  - `backend/api/services/`
  - `backend/api/middleware/`
  - `backend/api/config/`
  - `backend/api/tests/`

### `[frontend]` / `[ui]`

- Context docs: `STRUCTURE.md`, `preview.md`, `README.md`
- Target paths:
  - `frontend/src/App.jsx`
  - `frontend/src/pages/`
  - `frontend/src/pages/desktop/`
  - `frontend/src/pages/mobile/`
  - `frontend/src/pages/shared/`
  - `frontend/lib/`
  - `frontend/modules/shared/`
  - `frontend/modules/user/`
  - `frontend/modules/company/`
  - `frontend/modules/assets/`
  - `frontend/modules/hooks/`
  - `frontend/components/`
  - `frontend/tests/`

### `[security]` / `[hardening]`

- Context docs:
  - `docs/security-secret-scan.md`
  - `docs/repository-security-hardening.md`
  - `database/reports/rls-policy-risk-report-2026-05-11.md`
  - `database/reports/rls-production-verification-checklist-2026-05-11.md`
- Target paths:
  - `backend/api/middleware/security.ts`
  - `backend/api/middleware/inputSanitizer.ts`
  - `backend/api/middleware/bodySanitizerLimits.ts`
  - `backend/api/config/origins.ts`
  - `backend/api/config/securityEventLogger.ts`
  - `scripts/security-guard.ts`
  - `.gitleaks.toml`
- Rules:
  - Sanitize inputs
  - Enforce auth and authorization boundaries
  - Avoid exposing secrets
  - Prefer least privilege and deny-by-default

### `[local]` / `[dev]`

- Context docs: `README.md`, `preview.md`, `STRUCTURE.md`
- Target paths:
  - `.env.example`
  - `docker-compose.yaml`
  - `scripts/start-dev.ts`
  - `scripts/apply-db-migrations.ts`
  - `scripts/run-tests.ts`
  - `backend/package.json`
  - `frontend/package.json`
- Notes:
  - Use `.env.example` for variable names only
  - Do not print secret values from `.env` or `.env.local`

### `[database]` / `[db]` / `[schema]` / `[sql]`

- Context docs:
  - `database/reports/rls-policy-risk-report-2026-05-11.md`
  - `database/reports/rls-production-verification-checklist-2026-05-11.md`
- Target paths:
  - `database/init.sql`
  - `database/migrations/`
  - `database/examples/`
  - `backend/api/config/database.ts`
  - `backend/api/config/migrationTracker.ts`
  - `backend/api/config/ensureOnboardingSchema.ts`
  - `backend/api/config/ensureCompanySchema.ts`
  - `backend/api/config/ensureUsersProfileSchema.ts`
  - `backend/api/config/ensureResumeSchema.ts`
  - `backend/api/config/ensureMessagingConversationSchema.ts`

### `[payments]` / `[premium]`

- Context docs: `README.md`, `preview.md`
- Target paths:
  - `backend/api/controllers/userPaymentController.ts`
  - `backend/api/controllers/companyPaymentController.ts`
  - `backend/api/controllers/paymentWebhookController.ts`
  - `backend/api/routes/paymentWebhookRoutes.ts`
  - `backend/api/services/paymentService.ts`
  - `backend/api/services/planAccessService.ts`
  - `backend/api/services/jobPostingPlans.ts`
  - `backend/api/config/paymentEnv.ts`
  - `backend/api/config/paymentDemoPricing.ts`
  - `frontend/src/pages/PremiumPaymentPage.jsx`
  - `frontend/src/pages/EmployerPricingPage.jsx`
  - `frontend/src/pages/PricingPage.jsx`

### `[auth]` / `[oauth]` / `[session]`

- Context docs: `README.md`, `preview.md`
- Target paths:
  - `backend/api/routes/authRoutes.ts`
  - `backend/api/controllers/authController.ts`
  - `backend/api/controllers/oauthController.ts`
  - `backend/api/controllers/authRecoveryController.ts`
  - `backend/api/services/authService.ts`
  - `backend/api/services/authSessionService.ts`
  - `backend/api/middleware/auth.ts`
  - `frontend/src/pages/AuthPage.jsx`
  - `frontend/src/pages/SocialSignupPage.jsx`

### `[messaging]` / `[notifications]` / `[social]`

- Context docs: `preview.md`
- Target paths:
  - `backend/api/routes/messagesRoutes.ts`
  - `backend/api/routes/notificationsRoutes.ts`
  - `backend/api/controllers/messagesController.ts`
  - `backend/api/controllers/messagesDebugController.ts`
  - `backend/api/controllers/notificationsController.ts`
  - `backend/api/controllers/postsController.ts`
  - `backend/api/services/conversationService.ts`
  - `backend/api/services/messagingRolloutService.ts`
  - `backend/api/services/messagingMigrationMonitor.ts`

### `[resume]` / `[upload]` / `[ai]` / `[fastapi]`

- Context docs: `README.md`, `preview.md`, `backend/ai-fastapi/.pytest_cache/README.md`
- Target paths:
  - `backend/api/routes/resumeRoutes.ts`
  - `backend/api/routes/uploadRoutes.ts`
  - `backend/api/controllers/resumeController.ts`
  - `backend/api/controllers/uploadController.ts`
  - `backend/api/services/resumeService.ts`
  - `backend/api/services/resumeStorageService.ts`
  - `backend/api/services/resumeOptimizationService.ts`
  - `backend/api/services/resumeCleanupService.ts`
  - `backend/api/services/pdfConversionService.ts`
  - `backend/api/services/aiService.ts`
  - `backend/api/queues/resumeQueue.ts`
  - `backend/ai-fastapi/`

### `[testing]` / `[verification]`

- Context docs:
  - `.agents/skills/testing/e2e-testing/SKILL.md`
  - `.agents/skills/testing/react-testing/SKILL.md`
  - `.agents/skills/testing/test-driven-development/SKILL.md`
  - `.agents/skills/testing/verification-before-completion/SKILL.md`
  - `.agents/skills/testing/verification-loop/SKILL.md`
- Target paths:
  - `backend/api/tests/`
  - `frontend/tests/`
  - `scripts/run-tests.ts`
  - `package.json`
  - `backend/package.json`
  - `frontend/package.json`

### `[skills]` / `[agent-context]`

- Context docs:
  - `.agents/AGENTS.md`
  - `.agents/gemini-skills/gemini-master-skill.md`
  - `.agents/skills/README.md`
  - `.agents/skills/SKILLS_OVERVIEW.md`
  - relevant `.agents/skills/**/SKILL.md`
- Target paths:
  - `.agents/skills/design/`
  - `.agents/skills/development/`
  - `.agents/skills/frontend-development/`
  - `.agents/skills/marketing-content/`
  - `.agents/skills/marketing-platforms/`
  - `.agents/skills/marketing-seo/`
  - `.agents/skills/planning-context/`
  - `.agents/skills/testing/`
  - `.agents/skills/video/`

### `[structure]` / `[layout]`

- Context docs:
  - `STRUCTURE.md`
  - `preview.md`
  - `README.md`
- Target paths:
  - `frontend/modules/shared/`
  - `frontend/modules/user/`
  - `frontend/modules/company/`
  - `backend/api/`
  - `database/`
  - `scripts/`

### `[deploy]` / `[render]` / `[production]`

- Context docs: `README.md`, `preview.md`
- Target paths:
  - `render.yaml`
  - `backend/serverless/`
  - `frontend/vercel.json`
  - `frontend/vite.config.mjs`

### `[vault]` / `[external-notes]`

- External reference:
  - `Z:\Appdata\vaults\cdproj\Kapit prompt history\prompt-history 5.md`
- Rule:
  - Outside repo. Verify path and permissions before using.

## 3. Primary Code Anchors By Domain

### Backend Source Anchors

- Config: `backend/api/config/`
- Controllers: `backend/api/controllers/`
- Middleware: `backend/api/middleware/`
- Routes: `backend/api/routes/`
- Services: `backend/api/services/`
- Queues: `backend/api/queues/`
- Utils: `backend/api/utils/`
- Scripts: `backend/api/scripts/`
- Uploads: `backend/api/uploads/`
- Tests: `backend/api/tests/`

### Frontend Source Anchors

- Main router: `frontend/src/App.jsx`
- Page shells: `frontend/src/pages/` (viewport-dispatching wrappers)
  - Desktop variants: `frontend/src/pages/desktop/`
  - Mobile variants: `frontend/src/pages/mobile/`
  - Shared content: `frontend/src/pages/shared/`
- Shared domain: `frontend/modules/shared/`
- User domain: `frontend/modules/user/`
- Company domain: `frontend/modules/company/`
- Static assets: `frontend/modules/assets/`
- Top-level hooks: `frontend/modules/hooks/`
- Frontend lib utilities: `frontend/lib/`
- Legacy/shared component area: `frontend/components/`
- Frontend tests: `frontend/tests/`

### Database Anchors

- Bootstrap SQL: `database/init.sql`
- Migrations: `database/migrations/`
- Reports: `database/reports/`
- Example data: `database/examples/`

### Automation Anchors

- Dev startup: `scripts/start-dev.ts`
- DB migration runner: `scripts/apply-db-migrations.ts`
- Secret/security guard: `scripts/security-guard.ts`
- Skill sync: `scripts/sync-skills.ts`
- Hook install: `scripts/install-githooks.ts`

## 4. Operating Notes

- Read `STRUCTURE.md` first for placement decisions.
- Read `preview.md` first for repo walkthrough and feature ownership.
- Use `README.md` and `.env.example` for local setup context.
- Use security docs before touching auth, rate limits, CORS, secrets, uploads, payments, or database grants.
- Use database reports before changing RLS, grants, or public-data exposure.
- Use `.agents/AGENTS.md` plus relevant skill files before skill-router or agent-context changes.
- Ignore virtualenv license markdown for repo behavior decisions.
- No dedicated standalone API-contract markdown found. Use `backend/api/routes/`, `controllers/`, and `services/` as live contract source.
- No repo-local prompt-history markdown found in workspace. External vault note is outside repo.
