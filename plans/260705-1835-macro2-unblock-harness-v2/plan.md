# Macro-2 Unblock — Videcode Harness v2

**Goal:** reusable harness at `videcode-harness/harness/` that, when run on a project, produces a real app at hasi-hub quality (pnpm monorepo, NestJS+Prisma+Postgres API, Next.js web, CI green, docker compose up, seeded, e2e). Proof = one sample project driven through Macro 2 end-to-end.

**Source of truth studied:** embedded harness in `~/Desktop/Workspace/auto-script` (STAGE.md, AGENTS.md, docs/process/WORKFLOW.md, STAGE_GOALS.md, playbooks/, gates/, .claude/, scripts/) + hasi-hub structural benchmark (see `plans/reports/hasi-hub-benchmark-260705.md`).

## Diagnosis — why Macro 2 never produced an app

| # | Root cause | Evidence |
|---|---|---|
| 1 | Macro-2 detail deliberately stubbed; runner refuses | STAGE_GOALS.md §2.x all `[next increment]`; stage-runner.md: "return BLOCKED if the detail is genuinely not built"; stage-next.md failure mode says wait for next increment |
| 2 | No spec→code conversion layer | nothing compresses SRS (232 REQ-IDs) + 207 SC + 29 screens into ordered executable build phases |
| 3 | No scaffold / walking-skeleton step | 2.4 env/CI + 2.5 seed assume a codebase exists; no stack template, no boot gate |
| 4 | Execution model wrong for build | one-step-per-invocation, 25-turn budget; 2.6 explicitly "BLOCKED — build must be invoked per phase" but no phase driver exists |
| 5 | Macro 1 over-produces, no Lite lane | 232 REQ-ID / 207 SC / v1→v3 prototype rounds for an internal product |

## Fix design (harness v2 increment)

- **A. Macro-2 goals built**: full `### Step 2.x` goal text in STAGE_GOALS; delete BLOCKED-on-stub behavior from stage-runner + stage-next.
- **B. Build Manifest** (new 2.3 output, `docs/build/build-manifest.md`): ordered phases P0..PN. P0 = walking skeleton. Each phase: REQ-IDs, entities, endpoints, screens (+floorplan), acceptance checks, verify commands. Single file a dev agent reads instead of the whole spine.
- **C. Walking-skeleton stack template** `harness/templates/stack-pnpm-nest-next/`: hasi-hub-shaped starter (pnpm workspaces; apps/api NestJS 11+Prisma+Postgres, JWT auth, RBAC, health; apps/web Next.js App Router+Tailwind v4+shadcn-style; packages/shared-types+tsconfig; docker-compose dev; .github/workflows/ci.yml lint+typecheck+unit+build; husky+lint-staged; seed script; .env.example). Gate **WALKING SKELETON**: `pnpm install && pnpm build && docker compose up` → login with seeded admin, health OK, CI-equivalent local run green.
- **D. Phase loop driver**: new `/build-phase` command + stage-runner 2.6 rules — one phase per invocation: implement → `validate:quick` → e2e smoke → verification-register row → stage-boundary commit citing tokens. Loop until manifest exhausted.
- **E. Gate rebalance**: per-phase light review (self-check floor rules); heavy 2.7 6-dim review, 2.9 security, 2.10 QA run once near the end (plus mid-point if >6 phases).
- **F. Macro-1 Lite lane** (internal/small): 1.2 intake → 1.5-lite SRS-lite + feature list (high-risk scenarios only) → 1.10-lite tokens → 1.12 prototype 1 round → freeze. Client-paging gates collapse to owner sign-offs.
- **G. Packaging**: `harness/` installable via `install-harness.sh`; root README for team.

## Phases

| Phase | What | Runner | Status |
|---|---|---|---|
| 1 | Harness v2 docs+control-plane (`harness/` — A,B,D,E,F,G) | bg task | done 2026-07-05 — commits 68044b7..0d40859; report `phase-01-harness-v2-docs-build-report.md` (5/5 acceptance) |
| 2 | Stack template built + verified boot (C) | bg task | done 2026-07-05 — commit 2d2e66d; verify ALL GREEN on fresh scaffold (`phase-02-stack-template-verify-report.md`) |
| 3 | Proof run: sample project through Lite Pre-Build → Macro 2 → running app | bg task(s) | done 2026-07-06 — 9/9 benchmark green; v0.1.0 tagged; 52 api unit + 5 web unit + 8 Playwright e2e; STAGE trail full 1.1→2.13; report `phase-03-proof-run-report.md` (friction log F1..F18) |
| 4 | Patch harness from friction log F1..F18; re-verify template; README polish | control + bg | done 2026-07-06 — all 18 items dispositioned (17 fixed, F14 folded into F18); template v0.1.1 full re-verify green incl. worktree-scaffold guard + husky-chained gate block; report `phase-04-harness-hardening-report.md` |

Detail: `phase-01-harness-v2-docs.md`, `phase-02-stack-template.md`, `phase-03-proof-run.md`.

## Success criteria (DONE)

1. Fresh dir + install-harness.sh + sample spec → agent runs `/stage-next` loop → app builds, boots via docker compose, seeded login works, CI green, e2e pass.
2. Structure matches hasi-hub benchmark shape (monorepo, module-per-domain API, App Router web, migrations+seed, CI jobs, env templates, docs/).
3. No step returns BLOCKED-on-stub anywhere in Macro 2.
4. auto-script can resume at 2.1 using this harness (not executed now; harness must support it).

## Risks

- Template rot (pinned versions) → pin + record verify date; template verified by actual build in Phase 2.
- Proof project too big → keep sample to 3-4 entities, 2 roles, 6-8 screens.
- bg sessions stall → control session polls, kills + re-dispatches with narrower scope.
