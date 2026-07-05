# Phase 2 — stack-pnpm-nest-next template: verify report

Date: 2026-07-05 · Machine: darwin (Node 26.0.0, pnpm 11.1.2, Docker 29.4.3)
Template: `harness/templates/stack-pnpm-nest-next/` (91 files, TEMPLATE_VERSION 0.1.0)
Verify target: fresh scaffold via `scripts/scaffold.sh /private/tmp/videcode-scaffold-verify/skeleton-check skeleton-check`

## Verdict: ALL GREEN ✅

Scaffolded copy passed every mandatory gate end-to-end. Template contains 0 `hasi` refs, 0 leftover slug refs, no `.env`/lockfile/node_modules shipped.

## Gate results (scaffolded copy, not the dev tree)

| # | Gate | Result | Evidence |
|---|------|--------|----------|
| 0 | scaffold.sh (copy + rename + .env + git init + add) | ✅ | `residue: 0`, names → `skeleton-check` / `@skeleton-check/*` |
| 1 | `pnpm install` | ✅ | `Done in 9.2s using pnpm v11.1.2` |
| 2 | `pnpm -r lint` (eslint 9 flat + prettier) | ✅ | api/web/shared-types all `Done` |
| 2 | `pnpm -r typecheck` (tsc strict) | ✅ | all `Done` |
| 3 | `pnpm -r test` | ✅ | api Jest: 2 suites / **8 passed**; web Vitest: 2 files / **5 passed** |
| 4 | `pnpm -r build` | ✅ | `nest build` Done; `next build` Done (Next 15.5.20, 7 routes) |
| 5 | db boot + `pnpm db:migrate` + `pnpm db:seed` | ✅ | shipped migration `20260705122518_init` → "All migrations have been successfully applied"; `Seeded admin user: admin@example.com (95887253-…)` |
| 5 | API integration (supertest) `test:e2e` | ✅ | 1 suite / **3 passed** (health db-up; login→me; 401 paths) |
| 6 | Boot built api+web, health endpoint | ✅ | `GET /health` → 200 `{"status":"ok","db":"up",…}`; Nest "listening on :3001"; Next "Ready in 242ms" |
| 6 | Playwright e2e (chromium) | ✅ | **2 passed (719ms)**: guarded-route redirect → /login; seeded-admin login → dashboard → users table shows admin row |

Key log lines:

```
Done in 9.2s using pnpm v11.1.2                       # install
apps/api test:  Tests: 8 passed, 8 total              # jest unit
apps/web test:  Tests  5 passed (5)                   # vitest unit
apps/api build: Done · apps/web build: Done           # nest+next build
All migrations have been successfully applied.        # prisma migrate deploy
Seeded admin user: admin@example.com                  # seed
Tests: 3 passed, 3 total                              # supertest e2e
{"status":"ok","db":"up","uptime":6,...}              # GET /health 200
2 passed (719ms)                                      # playwright e2e
```

Full logs: `~/.claude/jobs/e1969c2a/tmp/verify-logs/` (1-install … 12-playwright).

## Template contents (delivered)

- Root: pnpm workspaces + `allowBuilds`, eslint 9 flat config + prettier, husky pre-commit + lint-staged, `.editorconfig`, `.gitignore`, `.env.example`, `docker-compose.yml` (db default; api+web behind `--profile app`), `docker-compose.prod.yml` (migrate-then-start), README (run-in-3-commands), `TEMPLATE_VERSION` (pins + verified versions), `scripts/scaffold.sh`, `.github/workflows/ci.yml` (quality job + Postgres-service integration job).
- `apps/api` — NestJS 11.1.27 · Prisma 6.19.3 · Zod 4 at boundary (`ZodValidationPipe`), JWT access+refresh (separate secrets, rotation), bcryptjs, `RolesGuard`/`@Roles('ADMIN')`, audit log on user CRUD, health w/ db check, Swagger `/docs`, global exception filter + request logging; schema + init migration + idempotent seed; 2 unit spec files + 1 supertest spec.
- `apps/web` — Next 15.5.20 App Router · Tailwind v4 · route groups `(public)/login`, `(app)/dashboard|users` (server-side cookie gate); `components/ui/` primitives (button/input/card/table/dialog/form-field, CVA); `lib/api` typed fetch adapter with 401→refresh→retry; users table demonstrates loading/error/empty/data states + create-user dialog; 2 vitest specs + 1 Playwright spec (2 tests).
- `packages/shared-types` (type-only DTO contracts), `packages/tsconfig` (base/nest/nextjs).

## Decisions (documented in TEMPLATE_VERSION/README)

- **Zod over class-validator** — runtime schemas api-side, shared-types stays type-only (no runtime coupling).
- **bcryptjs over bcrypt** — zero native builds; installs everywhere.
- **No lockfile shipped** — scaffolded project generates + commits its own; CI uses `--frozen-lockfile`.
- Placeholder = `__PROJECT_SLUG__` (name only, per phase spec); scaffold.sh fails loudly if rename incomplete.

## Issues found & fixed during verify

1. `grep -rlZ` on macOS BSD grep = *decompress*, not NUL-output → scaffold rename silently no-oped. Fixed to portable newline pipe + post-rename assertion in `scaffold.sh`.
2. tsconfig base lacked `moduleResolution` → TS5070 in shared-types. Added `module: ESNext` + `moduleResolution: bundler` to `base.json`.
3. `@nestjs/jwt` `expiresIn` needs ms-branded type → cast via `JwtSignOptions['expiresIn']`.
4. Playwright strict-mode violation ("Users" matched 2 links) → `exact: true`.

## Deviations / caveats

- **DB image**: `docker pull postgres:16-alpine` stalled indefinitely through Docker Desktop's proxy on this machine (registry reachable, pull hung >20min). Boot verify ran on locally-cached `pgvector/pgvector:pg16` (Postgres 16) via a local `docker-compose.override.yml` **not shipped in the template**. Compose file still pins `postgres:16-alpine`; functionally equivalent PG16 verified.
- CI workflow authored to hasi-hub pattern but not executed on GitHub runners (repo has no remote); integration job mirrors the locally-green migrate+seed+supertest sequence.
- Prod Dockerfiles (`apps/api`, `apps/web`) written but not image-built locally (phase verify steps 1–6 don't require it; noting for honesty).

## Unresolved questions

- None blocking. Optional follow-up: pre-pull `postgres:16-alpine` on team machines or pin a mirror registry in harness docs.
