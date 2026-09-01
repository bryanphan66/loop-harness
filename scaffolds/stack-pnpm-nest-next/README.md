# __PROJECT_SLUG__

> `__PROJECT_SLUG__` is a placeholder — the installer replaces it with your project name.

**What this is:** a small app that already runs, so you build features on top instead
of from zero. It has a backend (NestJS + Postgres database, login + roles), a website
(Next.js), and shared types between them — plus tests and Docker set up.

**What's NOT here:** any real feature. It only knows about login / users / a health
check. You add your product's screens and data on top as new modules.

**Try it:** `docker compose up` → the app boots → open the site → the seeded admin
account logs in. If that works, the plumbing (database → API → website → deploy) is
proven, and any later bug is in your feature code, not the setup.

*(Below: the full tech stack + how each folder is laid out.)*

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
| `apps/worker` | Tier-2, opt-in: BullMQ worker process, ships a real ffmpeg HLS-transcode job |
| `packages/shared-types` | Type-only DTO contracts shared by api + web (`import type` only) |
| `packages/queue-core` | Tier-2, opt-in: BullMQ queue/worker factory + enqueue/status helpers, shared by api + worker |
| `packages/storage-core` | Tier-2, opt-in: `StorageAdapter` interface + s3/r2 and local-dev drivers, shared by api + worker |
| `packages/tsconfig` | Shared tsconfig bases (`base`, `nest`, `nextjs`) |

## Tier-2 (opt-in): queue + object storage + worker

Not wired into `AppModule` by default — the walking skeleton stays db+api+web. Adopt it
when a project has an async-job / media-pipeline / storage / external-integration phase:

- `docker compose --profile tier2 up -d` starts `redis` + `minio` (+ `minio-mc`, a
  one-shot that creates the `STORAGE_S3_BUCKET` bucket then exits) + `worker`, which
  builds `apps/worker/Dockerfile` and needs ffmpeg for the sample `transcode` job —
  already baked into that image. MinIO console: http://localhost:9001.
- Import `QueueModule` (`apps/api/src/common/queue`) and/or `StorageModule`
  (`apps/api/src/common/storage`) into a feature module to get `QueueService`
  (`enqueue`/`status`) and `StorageService` (`put`/`signedGetUrl`/`signedPutUrl`/`delete`)
  via Nest DI.
- `pnpm dev:worker` runs the worker locally in watch mode (needs `REDIS_URL` reachable).
- Switch `STORAGE_DRIVER=s3` (see `.env.example`) to exercise the real signed-URL path
  against the tier2 MinIO container — swap the same driver's endpoint/credentials for
  Cloudflare R2 or AWS S3 in staging/prod, no code change. The `local` driver (default)
  stays filesystem-only, zero dependencies, with stubbed (non-expiring) signed URLs.

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
| `pnpm dev:worker` | Tier-2, opt-in: run the worker in watch mode (needs Redis reachable) |
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
- **Dokploy:** point the app's compose path at `docker-compose.dokploy.yml`, not
  `docker-compose.yml` or `docker-compose.prod.yml` — it's a self-contained overlay
  (Dokploy doesn't expand compose `include:`) with the `dokploy-network` wiring a
  domain'd `api` needs to keep reaching `db`/`redis` (see that file's header comment).
- CI (`.github/workflows/ci.yml`): lint → typecheck → unit → build, plus an integration job
  against a Postgres service (migrate + seed + supertest).

## Notes

- Node ≥ 20, pnpm ≥ 9 (managed via `packageManager` + corepack).
- Native-module-free by design (bcryptjs, no node-gyp) so installs work everywhere.
- Commit `pnpm-lock.yaml` after your first install (`--frozen-lockfile` in CI expects it).
- DB image is `pgvector/pgvector:pg16` (postgres:16 superset + pgvector). Any
  postgres-16-compatible image works — swap in compose + CI if pulls are slow.
- Git hooks: under the loop-harness, `.githooks/` owns `core.hooksPath`, but
  `pnpm install` runs `prepare: husky` which re-points it to `.husky/_`. The
  shipped `.husky/pre-commit` + `.husky/pre-push` therefore chain
  `scripts/harness-verify-gate.sh` FIRST, so the harness gate fires under either
  hooks path and an install can never silently disarm it.
