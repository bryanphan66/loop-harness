# hasi-hub — Structural Quality Benchmark (surveyed 2026-07-05)

Reference standard for "a finished harness-produced project". Source: `~/Desktop/Workspace/hasi-hub` (READ-ONLY — never modify).

## Tech stack
- pnpm workspaces monorepo (`pnpm@9.15.9`, Node ≥20).
- `apps/api` — NestJS v11, Prisma 5.22, PostgreSQL (pgvector/pg16), Passport-JWT, Zod v4, Swagger, Throttler, Sentry. Jest.
- `apps/web` — Next.js 16 App Router, React 19, Tailwind v4, Radix + CVA (shadcn-style), next-intl, react-hook-form+Zod. Vitest + Playwright.
- `packages/shared-types`, `packages/tsconfig`.

## Repo shape
- `apps/api/prisma/`: schema.prisma, migrations (105), `seed/` multi-stage, `scripts/`.
- Web routes in `apps/web/src/app/` with route groups `(public)` etc.; components grouped by feature; shared `lib/`, `hooks/`, `i18n/`, `theme/`.
- `infra/` (Caddy, monitoring, systemd, backup), `scripts/`, `docs/`, `plans/`.

## Quality infra
- CI `.github/workflows/ci.yml`: lint/typecheck/build (+i18n check), unit (Jest+Vitest), integration (Postgres+Mailpit services, migrate+seed), prod-build-smoke (health check), SCA (`pnpm audit` blocks critical), secrets-scan (gitleaks). Heavy jobs (perf, Lighthouse) manual-dispatch. PR latency <15min.
- Also: `deploy.yml` (tag-routed GitOps → ghcr.io, cosign signing, SLSA/SBOM), `release-gate.yml`, `semgrep.yml`.
- Tests: ~163 api unit specs, ~78 api integration/e2e, ~13 web unit, ~225 Playwright e2e.
- Husky pre-commit + lint-staged; eslint type-aware + prettier; lighthouse budgets.

## Deployment
- Dockerfile per app; docker-compose per env (dev/staging/prod/test); `.env.<env>.example` templates; systemd gitops-deploy + backup timers.

## Docs
- `docs/`: system-architecture, deployment-guide, code-standards, PDR, route-sitemap, runbook/ (DR, failover), requirements/ (SRS, use-cases, RTM, glossary). Root CLAUDE.md + AGENTS.md.

## Feature patterns
- API: module-per-domain `modules/<domain>/{module.ts,controllers/,services/,dto/,guards/}` + colocated specs; cross-cutting `common/` (audit, guards, logging, security, throttle). ~40 modules.
- Web: feature-foldered components mirroring route groups; `ui/` primitives; `lib/api` adapters; colocated `__tests__`.

## Minimum bar for harness-produced project (audit checklist)
1. pnpm monorepo: apps/api + apps/web + packages/shared-types + packages/tsconfig
2. API: NestJS module-per-domain, Prisma schema + ≥1 migration, JWT auth + RBAC guard, health endpoint, Swagger, Zod validation at boundary
3. Web: App Router, route groups, shadcn-style ui/ primitives, api adapter layer, loading/empty/error states
4. DB: docker-compose Postgres; seed script → admin login works
5. CI: lint + typecheck + unit + build (+ integration w/ Postgres service) green
6. Tests: unit both apps + ≥1 Playwright e2e per critical journey
7. Hooks: husky pre-commit lint-staged; .env.example complete; no secrets committed
8. Docs: system-architecture, deployment-guide, code-standards; README run-in-3-commands
9. Deployable: Dockerfile per app + compose prod variant boots
