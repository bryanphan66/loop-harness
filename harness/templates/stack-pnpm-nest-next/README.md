# __PROJECT_SLUG__

Walking-skeleton monorepo: NestJS 11 API (Prisma + Postgres, JWT auth, RBAC) + Next.js 15 web
(App Router, Tailwind v4, shadcn-style UI) + shared TypeScript types. Generic domain only
(auth / users / health) — add your product's domains as feature modules on top.

## Run it (3 commands)

```bash
pnpm install
docker compose up -d db && cp -n .env.example .env; pnpm db:migrate && pnpm db:seed
pnpm dev
```

Then open http://localhost:3000 and sign in with the seeded admin
(`admin@example.com` / `admin1234`, configurable via `SEED_ADMIN_*` in `.env`).
API Swagger docs: http://localhost:3001/docs — health: http://localhost:3001/health.

## Layout

| Path | What |
| --- | --- |
| `apps/api` | NestJS 11 · Prisma 6 · module-per-domain (`modules/auth`, `modules/users`, `modules/health`) |
| `apps/web` | Next.js 15 App Router · Tailwind v4 · `components/ui` primitives (CVA) · `lib/api` typed fetch adapter |
| `packages/shared-types` | Type-only DTO contracts shared by api + web (`import type` only) |
| `packages/tsconfig` | Shared tsconfig bases (`base`, `nest`, `nextjs`) |

## Conventions baked in

- **Validation at the boundary:** Zod schemas per endpoint via `ZodValidationPipe`
  (`apps/api/src/common/zod-validation.pipe.ts`). Runtime schemas live API-side; shared types are compile-time only.
- **Auth:** JWT access + refresh (separate secrets, rotation on refresh), bcryptjs hashing,
  `JwtAuthGuard` + `RolesGuard`/`@Roles('ADMIN')` for RBAC.
- **Errors/logging:** global `HttpExceptionFilter` + request `LoggingInterceptor`.
- **Web session:** tokens in cookies so the `(app)` server layout can gate routes; swap to httpOnly
  server sessions when hardening.
- **DB:** migrations under `apps/api/prisma/migrations`, idempotent seed (`prisma/seed.ts`).

## Commands

| Command | What |
| --- | --- |
| `pnpm dev` / `dev:api` / `dev:web` | Run both apps (or one) in watch mode |
| `pnpm lint` / `typecheck` / `test` / `build` | Full-repo quality gates (same as CI) |
| `pnpm db:migrate` / `db:seed` | Apply migrations / seed admin (needs db up) |
| `pnpm --filter ./apps/api db:migrate:dev` | Create a new migration after schema changes |
| `pnpm --filter ./apps/api test:e2e` | Supertest integration specs (needs migrated + seeded db) |
| `pnpm e2e` | Playwright login e2e (see below) |
| `scripts/secret-scan.sh` | Secret scan: gitleaks if installed, else a grep fallback over tracked files |

## End-to-end tests

Playwright drives the real stack. Start it first:

```bash
docker compose up -d db && pnpm db:migrate && pnpm db:seed
pnpm --filter ./apps/api dev &   # api on :3001
pnpm --filter ./apps/web dev &   # web on :3000
pnpm e2e
```

First run: `pnpm --filter ./apps/web exec playwright install chromium`.

**Do not run `pnpm build` while the dev servers are serving e2e.** The
production `next build` overwrites `apps/web/.next` under the running `next dev`,
breaking client hydration — every login e2e then fails with a native-form
fallback that looks like a real regression. Run the full build in a separate
step (stop the dev servers first, or run e2e against `next start` on the prod
build). If it happens: `rm -rf apps/web/.next` and restart `next dev`.

## Production

- `docker-compose.prod.yml` builds both images (context = repo root) and runs
  `prisma migrate deploy` before starting the API. Required env: `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `CORS_ORIGIN`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NEXT_PUBLIC_API_URL`.
- CI (`.github/workflows/ci.yml`): lint → typecheck → unit → build, plus an integration job
  against a Postgres service (migrate + seed + supertest).

## Notes

- Node ≥ 20, pnpm ≥ 9 (managed via `packageManager` + corepack).
- Native-module-free by design (bcryptjs, no node-gyp) so installs work everywhere.
- Commit `pnpm-lock.yaml` after your first install (`--frozen-lockfile` in CI expects it).
- DB image is `pgvector/pgvector:pg16` (postgres:16 superset + pgvector). Any
  postgres-16-compatible image works — swap in compose + CI if pulls are slow.
- Git hooks: under the videcode-harness, `.githooks/` owns `core.hooksPath`, but
  `pnpm install` runs `prepare: husky` which re-points it to `.husky/_`. The
  shipped `.husky/pre-commit` + `.husky/pre-push` therefore chain
  `scripts/harness-verify-gate.sh` FIRST, so the harness gate fires under either
  hooks path and an install can never silently disarm it.
