# Phase 4 — Harness hardening from proof-run friction log (F1..F18)

Status: **COMPLETE** — all 18 friction items dispositioned (17 fixed, 1 fixed-with-changed-approach, 0 wontfix), template re-verified green end-to-end, TEMPLATE_VERSION → **0.1.1** (verified 2026-07-06).

- Date: 2026-07-06 · Runner: phase-4 hardening session (bg)
- Input: `plans/reports/phase-03-proof-run-report.md` § Friction log
- Scope: `harness/` docs + control plane + `harness/templates/stack-pnpm-nest-next/`

## Per-F disposition

| # | Disposition | What was done | Where |
|---|---|---|---|
| F1 | **fixed** | Commit-SHA back-fill convention documented: write `— (this commit)`, back-fill previous row's SHA in the next boundary commit; `git log --grep 'step X'` stays source of truth | `docs/templates/STAGE.md` § History |
| F2 | **fixed** | Skeleton now ships committed `.claude/settings.json` with `"worktree": {"bgIsolation": "none"}` (copied by installer automatically — key shape verified against a live project). AGENTS.md adds the fallback rule for sessions already fenced: run the WHOLE flow in one worktree, fast-forward main at the end, never scaffold/git-init inside a worktree | `harness/.claude/settings.json` (new) + `AGENTS.md` § Stage Orchestration |
| F3 | **fixed** | Agent-registry caveat documented: `stage-runner` resolves only in sessions started after install; same-session runs use `fullstack-developer` fallback | `AGENTS.md` § Stage Orchestration + `.claude/commands/build-phase.md` step 4 |
| F4 | **fixed** | DB image → `pgvector/pgvector:pg16` in dev compose, prod compose, CI service (postgres:16 superset, matches hasi-hub benchmark, cached on team machines); "any postgres-16-compatible image works" noted in compose comment + README | template `docker-compose.yml`, `docker-compose.prod.yml`, `.github/workflows/ci.yml`, `README.md`, `TEMPLATE_VERSION` |
| F5 | **fixed** | `scripts/secret-scan.sh` shipped in template: gitleaks when installed, else narrow grep fallback over tracked files (private-key blocks, AKIA, xox, sk-, gh tokens, tracked `.env`); wired into WALKING SKELETON gate text | template `scripts/secret-scan.sh` (new) + README + `docs/process/STAGE_GOALS.md` 2.4 |
| F6 | **fixed** | DoR NFR line gains Lite path: "(Lite lane: the § NFR one-liners in `docs/requirements/srs-lite.md` suffice)" | `docs/gates/dor-build.md` |
| F7 | **fixed** | Sanctioned Lite internal-product substitution at 1.12: classified screen inventory + written per-screen states contract may replace the visual prototype, recorded `1.12 — N/A by decision (written screen specs substitute)` at PB-G3; floorplan + design-system gate still apply | `docs/process/WORKFLOW.md` § Lanes item 5 + `docs/process/STAGE_GOALS.md` 1.12 |
| F8 | **fixed** | Source Map output named: `docs/discovery/README.md § Source Map` | `docs/process/STAGE_GOALS.md` 1.1 + `docs/process/WORKFLOW.md` row 1.1 |
| F9 | **fixed** | Manifest path renamed `docs/build/build-manifest.md` → **`docs/build-manifest.md`** (single file, no dir — avoids build-artifact deny-pattern collisions). All ~20 cross-refs updated (AGENTS, WORKFLOW, STAGE_GOALS, stage-runner, build-phase, gate-check, CONTEXT_RULES, gates, playbooks, template header, root README). Grep pass: zero `docs/build/` refs remain (one intentional rationale comment) | repo-wide |
| F10 | **fixed (better-minimal than proposed)** | Instead of hacking lint-staged globs: template ships `.prettierignore` listing control-plane files (STAGE.md, docs/ROADMAP.md, docs/about/TEST_MATRIX.md, docs/build-manifest.md, screen-inventory.md) — prettier CLI skips ignored files even when named explicitly, so lint-staged config stays untouched. Proven: `prettier --write STAGE.md` left a misformatted table byte-identical | template `.prettierignore` (new) |
| F11 | **fixed (documented, gate unchanged)** | Judged scoping the never-run check to Build-macro closes as overkill (weakens the gate). Documented the convention instead: planned work stays `planned` in the proof matrix; register rows are added only when the verify command first runs | `docs/about/TEST_MATRIX.md` § Rules |
| F12 | **fixed (CRITICAL)** | (a) rsync already excluded `.git` (fixed pre-proof-run, kept); (b) `git init` guard changed from `[[ ! -d .git ]]` (breaks in worktrees where `.git` is a pointer FILE) to a `git rev-parse --git-dir` probe — skips init whenever the target is inside any repo/worktree; (c) verify gate gained a hooksPath self-check (see F18). **Empirically verified:** scaffolding into a real `git worktree` preserved the 84-byte gitfile and staged onto the worktree branch | template `scripts/scaffold.sh` + `harness/scripts/harness-verify-gate.sh` |
| F13 | **fixed (documented, gate unchanged)** | mtime/no-op-staging heuristics rejected (fragile, weaker gate). Convention documented in the gate's own block message + WORKFLOW: a no-progress stage close refreshes ROADMAP's `Updated:` line — an honest real diff | `harness-verify-gate.sh` Gate 3 message + `docs/process/WORKFLOW.md` § Always-On |
| F14 | **fixed** (with F18) | Husky kept (lint-staged is valuable, dropping it breaks standalone template use); the two hook systems no longer fight — see F18 | template `.husky/*` |
| F15 | **fixed** | Documented in template README § End-to-end tests (never `pnpm build` while dev serves e2e; recovery: `rm -rf apps/web/.next` + restart) and as a sequencing-hazard line in the 2.10 DoD goal. Playwright `webServer` auto-boot judged out of scope for a patch release (would change the verified e2e contract) | template `README.md` + `docs/process/STAGE_GOALS.md` 2.10 |
| F16 | **fixed** | DoD core rows "QA evidence (video + human approval)" and "User manual video" gained first-class `[ ] cleared · [ ] N/A by decision — <reason> (<date>)` Lite affordances; written field-by-field manual explicitly NOT waivable; UAT already has the Lite owner-ack path at 2.12 | `docs/gates/dod-build.md` |
| F17 | **fixed** | (a) scaffold post-message tip: pre-pull `pgvector/pgvector:pg16` + `node:22-alpine` on slow networks; (b) WALKING SKELETON (2.4) and go-live (2.11) goals gained an explicit offline-caveat evidence path: cached-image substitute / prod-artifact boot via exact prod commands + image build delegated to CI, caveat recorded, containerized boot proven in CI before 2.13 | template `scripts/scaffold.sh` + `docs/process/STAGE_GOALS.md` 2.4, 2.11 |
| F18 | **fixed (CRITICAL — option b, pre-chained husky)** | Template `.husky/pre-commit` now runs `scripts/harness-verify-gate.sh pre-commit \|\| exit 1` BEFORE lint-staged; new `.husky/pre-push` mirrors the pre-push gate. Any `pnpm install` husky re-arm now leaves the gate live under either hooks path. Plus a gate self-check: warns loudly when `core.hooksPath ≠ .githooks` (husky-owned vs fully disarmed, with the restore command). Neutering `prepare` rejected (breaks standalone template installs); dropping husky rejected (loses lint-staged) | template `.husky/pre-commit`, `.husky/pre-push` (new) + `harness-verify-gate.sh` self-check |

Extra (not in log): untracked 190KB `apps/web/tsconfig.tsbuildinfo` build artifact deleted from the template dir + `*.tsbuildinfo` added to scaffold rsync excludes.

## Template re-verify (fresh scaffold → scratch, 2026-07-06)

| Check | Result |
|---|---|
| `scaffold.sh` → scratch dir (git init path) | ✅ scaffolds, inits, stages |
| `scaffold.sh` → inside a real git **worktree** | ✅ "skipping git init", gitfile pointer intact, files staged on worktree branch |
| `pnpm install` | ✅ 11.2s clean |
| `pnpm lint` / `typecheck` / `test` (unit) / `build` | ✅ all green (8 api unit + web unit; both apps build) |
| `docker compose up -d db` (**pgvector/pgvector:pg16**) | ✅ healthy |
| `pnpm db:migrate` + `db:seed` | ✅ migrations applied, admin seeded |
| `pnpm --filter ./apps/api test:e2e` (supertest) | ✅ 3 passed |
| Playwright login e2e (`pnpm e2e` vs live dev stack) | ✅ 2 passed |
| **F18 chain**: commit with `Result: fail` register row under `core.hooksPath=.husky/_` | ✅ **BLOCKED** by the harness gate via husky ("husky - pre-commit script failed"); commit did not land |
| **F10**: `prettier --write STAGE.md` with `.prettierignore` | ✅ misformatted control-plane table left untouched |
| **F12b self-check**: gate run with hooksPath=`.husky/_` + `.githooks/` present | ✅ warning emitted with restore command |
| `scripts/secret-scan.sh` (grep fallback, gitleaks absent) | ✅ clean, exit 0 |

Scratch stack torn down (compose down -v, dev servers killed).

## Docs/consistency pass

- `docs/build/` refs: 0 remaining (1 intentional rationale comment in the manifest template header).
- `16-alpine` refs: 0 remaining.
- `bash -n` / `sh -n` on all touched scripts + hooks: clean.
- Root README: template row notes v0.1.1 + verify date; TEMPLATE_VERSION carries a History section.

## Unresolved questions

1. Playwright `webServer` auto-boot (F15's "ideal" fix) deferred — worth a template 0.2.0 item so `pnpm e2e` is self-contained.
2. `docs/discovery/README.md` Source Map has a named home but no template file; add one to `docs/templates/` if 1.1 runs prove the section shape unstable.
