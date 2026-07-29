# Proof-run (Step 4) — fresh sample, walking skeleton RUNS

Date 2026-07-29. Target: a from-scratch sample ("bookmarks", Lite lane) through the slimmed harness. Goal: prove "run the harness -> a running, hasi-hub-shaped, deployable app".

## What ran (all from a spec, by script — no hand-derivation)
1. `install-harness.sh --bootstrap --spec proof-spec.md <dir>` -> project skeleton (AGENTS/STAGE/docs/.claude/.githooks) + embedded stack-template + git baseline + spec in docs/discovery. ✓
2. `scaffold.sh <dir> bookmarks` -> walking skeleton materialized: `apps/{api,web,worker}` + packages + docker-compose, slug replaced. ✓
3. `pnpm install` ✓ · `docker compose up db` (remapped 5432->5439, host 5432 was taken) ✓ · `db:migrate` (migration applied) ✓ · `db:seed` (admin@example.com created) ✓
4. Boot API (Nest, :3001) ✓ · `GET /health` -> `{"status":"ok","db":"up"}` ✓ · **`POST /auth/login` admin@example.com/admin1234 -> HTTP 200 + JWT (role ADMIN)** ✓

## Benchmark vs hasi-hub (structural)
pnpm monorepo ✓ · NestJS API ✓ · Prisma (migrate+seed ran) ✓ · Next.js web + App Router ✓ · docker-compose Postgres ✓ · CI (`ci.yml`) ✓ · Playwright e2e (`login-flow.spec.ts`) ✓ · husky hooks ✓ · `.env.example` ✓ · api+web Dockerfiles ✓. All present.

## Verdict
**Proven:** the harness, from a spec, produces a **running hasi-hub-shaped app** — build-able, boots, DB-connected, working seeded-admin login. "build duoc, chay duoc" = YES at the walking-skeleton level; "deploy duoc" = structurally present (Dockerfiles, docker-compose.prod/dokploy) but not actually deployed here.

## Build-phase (feature) — PROVEN
Ran one Macro-2 build-phase (a dispatched coder executing the /build-phase logic) to code the **bookmarks** feature on the skeleton:
- Prisma `Bookmark` model + migration; NestJS `bookmarks` module (JWT-guarded CRUD, ownership guards); Next.js `/bookmarks` page; Zod DTOs; shared-types.
- **Live curl proof:** login 200 -> GET `[]` -> POST 201 -> GET `[1 item]` -> DELETE 204 -> GET `[]` -> no-token 401. Unit tests 5/5 (incl. 404 unknown-id + 403 other-user).
- **`pnpm validate` GREEN**; committed `d88b6ef feat(bookmarks)` through the `.githooks` verify gate live (no --no-verify).
=> the harness does not just scaffold a skeleton; it codes a real, running, gated feature from a spec.

### Harness bug found + FIXED by this proof-run (the point of a proof-run)
The stack-template's `pnpm validate` was RED out of the box: `apps/web/e2e-ui/_universal.fidelity.ts` imports `@axe-core/playwright`, undeclared in `apps/web/package.json`; `tsconfig` globs `**/*.ts` so a fresh clone's `tsc --noEmit` fails, blocking the FIRST commit gate. **Fixed in template v0.2.3:** added `@axe-core/playwright ^4.12.1` to apps/web devDeps + gitignored `next-env.d.ts`.

## Deploy — PROVEN (prod docker images)
Built the prod images and ran the prod compose stack (`docker-compose.prod.yml`, prod Dockerfiles) on the host:
- `docker compose -f docker-compose.prod.yml up -d --build` -> db (healthy) + api + web up; api migrates on boot.
- **Verify-at-source through the prod containers:** api `GET /health` -> `{status:ok,db:up}`; **`POST /auth/login` -> HTTP 200 + JWT** (prod-built container, not dev); web serves `<title>bookmarks</title>`.
=> "deploy duoc" = YES (the harness output builds + runs as prod containers + serves + auth works).

### Three template DEPLOY bugs found + FIXED (template v0.2.3 -> v0.2.4)
Only surfaced by actually building/running the deploy artifacts (the template CI never did a docker prod build):
1. **@axe-core/playwright undeclared** (v0.2.3) — the fidelity fixture's dep; blocked the first `pnpm validate`/commit gate on a fresh clone.
2. **prisma postinstall in Docker** (v0.2.4) — `postinstall: prisma generate` fired in the deps-only install layer before the schema is copied -> build failed; guarded to skip when no schema.
3. **compose.prod command vs Dockerfile WORKDIR** (v0.2.4) — command used cwd=/repo paths but the runtime WORKDIR is /repo/apps/api -> doubled paths -> crash-loop; corrected to WORKDIR-relative.

## Cleanup note
Prod stack torn down after verify (`docker compose down -v`); ports freed.

## Cleanup
`docker compose down -v` (port/db freed). Sample lives in the session scratchpad (throwaway).

## Unresolved
- Run the `/build-phase` loop for the bookmarks feature in a build session to prove feature-completeness (the full DONE bar).
- host port 5432 conflict (autocontent-postgres) required a 5439 remap — a fresh-machine install would not hit this.
