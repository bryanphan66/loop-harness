# Phase 2 — Walking-skeleton stack template (verified by real build)

**Output root:** `/Users/bryan/Desktop/Workspace/videcode-harness/harness/templates/stack-pnpm-nest-next/`
**Benchmark:** `plans/reports/hasi-hub-benchmark-260705.md` (shape source: `~/Desktop/Workspace/hasi-hub` — READ-ONLY, copy patterns not code).

## Deliverable
A generic, project-agnostic starter monorepo that `install-harness.sh` (or a `scaffold.sh` inside the template) copies into a fresh project at Build step 2.4. It MUST actually build and boot — verify locally before calling done.

### Contents
- Root: `package.json` (pnpm workspaces), `pnpm-workspace.yaml`, `eslint.config.js` + prettier, `.editorconfig`, `.gitignore`, `.env.example`, `docker-compose.yml` (Postgres 16 + api + web dev), `docker-compose.prod.yml`, husky pre-commit + lint-staged, `README.md` (run in 3 commands).
- `apps/api`: NestJS 11 + Prisma + Postgres. Modules: `auth` (JWT login/refresh, bcrypt), `users` (CRUD, RBAC roles admin|member, guard + decorator), `health` (health endpoint). Zod (or class-validator — pick one, document) validation at boundary, Swagger at `/docs`, config module reading env, global exception filter, request logging. `prisma/schema.prisma` (User, Role or enum, AuditLog minimal) + initial migration + `prisma/seed.ts` (admin user from env). Jest unit specs for auth service + users service; 1 supertest integration spec (login → me).
- `apps/web`: Next.js (latest stable App Router) + Tailwind v4 + shadcn-style `ui/` primitives (button, input, card, table, dialog, form) + CVA. Route groups `(public)` login page, `(app)` dashboard + users table page (guarded). `lib/api` typed fetch adapter with auth token handling; loading/empty/error states demonstrated on users table. Vitest 2 unit specs; Playwright 1 e2e: login with seeded admin → see dashboard.
- `packages/shared-types` (auth/user DTO types), `packages/tsconfig`.
- `.github/workflows/ci.yml`: lint → typecheck → unit → build; integration job with Postgres service (migrate+seed+supertest); keep runnable on github-hosted runners.
- `scripts/scaffold.sh` in template root: copies template into target dir, renames placeholder `__PROJECT_SLUG__` occurrences, git-adds. Placeholders kept minimal (name only).
- `TEMPLATE_VERSION` file: version + verify date + pinned major versions table.

### Verify (MANDATORY before done)
Copy template to a scratch dir (`/private/tmp/...` scratchpad), run scaffold.sh with slug `skeleton-check`, then:
1. `pnpm install` clean; 2. `pnpm -r lint && pnpm -r typecheck` green; 3. `pnpm -r test` green; 4. `pnpm -r build` green; 5. `docker compose up -d db` + migrate + seed + start api & web → login with seeded admin via Playwright e2e passes; 6. health endpoint 200. Record all outputs in the report. If docker unavailable, use local Postgres via docker CLI — do not skip boot verify; report BLOCKED if truly impossible.

## Constraints
- Generic domain only (auth/users/health) — zero business features; feature phases add domains later per build-manifest.
- Pin dependency majors; prefer boring stable versions (Next 15/16 stable, NestJS 11). No experimental flags.
- Files ≤200 LoC where practical; module-per-domain pattern exactly like benchmark §Feature patterns.
- Commit into videcode-harness repo, conventional commits, no AI references.

## Acceptance
1. Verify steps 1–6 all green, logged in `plans/reports/phase-02-stack-template-verify-report.md`.
2. Template contains no `hasi`/project-specific strings (`grep -ri hasi` → 0).
3. Works standalone: no dependency on harness docs to boot.
