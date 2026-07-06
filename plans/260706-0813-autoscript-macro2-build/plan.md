# auto-script — Build & Go-live campaign (Macro 2 full run)

**Decision (Trung, 2026-07-06):** run auto-script straight through Macro 2 (no DoR pause) using harness v2. Work on branch `macro2-build` in `~/Desktop/Workspace/auto-script` — never commit to main directly. Also decided: videcode-harness pushed to `bryanphan66/videcode-harness` (private).

**Scale:** 232 REQ-IDs, 30 screens, 16 feature groups, Full lane. Expect a MULTI-SESSION relay: each bg session advances STAGE.md as far as it safely can, commits at stage/phase boundaries, exits cleanly; control session re-dispatches a continuation session reading STAGE.md. This resumability is by harness design.

## Relay protocol (control session = me)

1. Dispatch bg session (Fable 5, auto) with the standing prompt (below in §Dispatch).
2. Poll; when session ends: check `STAGE.md` on `macro2-build` + last commits.
   - Advanced + clean exit → dispatch continuation.
   - MANUAL_CHECKPOINT (2.12 UAT ACCEPTANCE is a genuine CLIENT/operator gate) → page Trung, wait.
   - BLOCKED → read blocker, fix context or harness, re-dispatch narrower.
3. Log each relay leg in this file (§Relay log).

## Standing constraints for every leg

- Branch `macro2-build` (create worktree if session forces isolation; fast-forward the branch at leg end).
- Harness upgrade first (leg 1 only): replace harness-generic files (docs/WORKFLOW, STAGE_GOALS, gates/, playbooks/, templates/, .claude/, scripts/, AGENTS.md harness sections) from `~/Desktop/Workspace/videcode-harness/harness/`, KEEP all project content (STAGE.md history — reconcile pointer + Lane=Full, docs/requirements|design|visuals|discovery|decisions, plans/). One `chore(harness): upgrade embedded harness v1→v2` commit listing replacements.
- Ports 3200 (web) / 3201 (api) / 5434 (db), compose project `autoscript`.
- Secrets: NEVER commit real keys. External services (YouTube Data API, AI providers, OAuth, email) → env-driven adapters + mock/fake implementations for tests per SRS; maintain `docs/build-needs-credentials.md` listing every var the operator must supply before go-live.
- PUB zone ports prototype export (`docs/visuals/prototype/exports/claude-design-v3/`) per build-execution playbook; APP/ADM rebuild via design system.
- Follow auto-script's own AGENTS.md + STAGE.md + token chain; verify-gate no bypass.

## Relay log

| Leg | Session | Start stage | End stage | Notes |
|---|---|---|---|---|
| 1 | 1f8bcf7a | Build 2.1 | (running) | harness v2 upgrade `5724415` → 2.1 ERD FROZEN 21 entities `15cd1b4` → 2.2 TDR `20aa100` → 2.3 manifest **P0..P22, 240 REQ-IDs** DoR GREEN `4bcc592` → 2.4 skeleton boots `63ebbbc` → 2.5 seed P0 done `e8bd499` → 2.6 loop entered at P1 (Auth) |

**Scale confirmed at DoR:** 23 phases (P0 done + P1..P22 feature phases). Design-drift check 2026-07-06: live Claude Design board `674d5340…` = frozen v3 bundle, file-for-file — no post-freeze changes; 100+ artboards = state variants of the 30 logical screens.
