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

## Deploy target (operator decision 2026-07-07 08:48)

UAT/staging review = **Dokploy on VPS 160.250.134.226**, domain `autoscript.160.250.134.226.sslip.io`. Compatible with TDR (platform-agnostic, Docker image + IMAGE_TAG rollback, platform secret store). Flow: 2.11 readiness → deploy staging to Dokploy → 2.12 UAT on that URL vs prototype v3 → sign-off → 2.13 release. Operator must supply before UAT: Dokploy access (panel/API token) + real secrets per `docs/build-needs-credentials.md` (Google OAuth w/ sslip.io callback, YouTube API, AI provider, SePay, SMTP); features lacking real keys run mocked and are flagged in the UAT checklist.

## Relay log

| Leg | Session | Start stage | End stage | Notes |
|---|---|---|---|---|
| 1 | 1f8bcf7a (Fable 5) | Build 2.1 | 2.6 mid-P7 (paused 13:32) | harness v2 upgrade `5724415` → 2.1 ERD `15cd1b4` → 2.2 TDR `20aa100` → 2.3 manifest **P0..P22, 240 REQ-IDs** DoR GREEN `4bcc592` → 2.4 skeleton `63ebbbc` → 2.5 seed `e8bd499` → P1 `c1baefb` P2 `5555432` P3 `418a5f5` P4 `852f259` P5 `28f969c` P6 `2f5a8d9`; P7 uncommitted at pause |
| 2a | 1e577ebf (Opus 4.8) | 2.6 P7 reconcile | stopped 21:33 after ~6 min | operator reversed: **full Fable 5 for all legs** (21:33) — no commits made by 2a |
| 2b | 123ab211 (Fable 5) | 2.6 P7 reconcile | 2.9 DONE, halted pre-2.10 | 11h run: P7..P22 ALL done (manifest exhausted `b83e924`) + 2.7 review 9.5/10 `e950527` + 2.8 RTM 240/240 `5122d2f` + 2.9 security PASS 0 Crit/High `27346e4`. Halted deliberately: parallel orchestrator (root-Workspace session 97bc20ff) dispatched a duplicate 2.9 stage-runner onto the worktree — race detected + reconciled by both agents, tree clean. Handoff `macro2-leg-02-handoff.md` |
| 3 | 2f942a4e (Fable 5) | 2.10 QA/DoD | (running) | sole owner confirmed (operator approved stopping 97bc20ff, 08:56). Scope: 2.10 → 2.11 + Dokploy staging prep → STOP at 2.12 MANUAL_CHECKPOINT for operator UAT |

**Scale confirmed at DoR:** 23 phases (P0 done + P1..P22 feature phases). Design-drift check 2026-07-06: live Claude Design board `674d5340…` = frozen v3 bundle, file-for-file — no post-freeze changes; 100+ artboards = state variants of the 30 logical screens.

## ⏸️ PAUSED 2026-07-06 13:32 (operator: token budget needed elsewhere; resume ~21:00 tonight)

**State at pause:** leg-1 session `1f8bcf7a` soft-stopped (`claude stop` — worktree + job state retained; `claude rm` NOT run). Progress: **P0..P6 DONE (7/23), committed through `2f5a8d9`**. **P7 (Outlier Scoring Engine, core IP, golden tests) IN PROGRESS — UNCOMMITTED work sits in the worktree** `~/Desktop/Workspace/auto-script/.claude/worktrees/macro2-build`: modified schema.prisma, scans module/worker, scan-engine e2e, TEST_MATRIX + untracked `scoring/` dir, `scan-scoring.service.ts`, migration `20260706160000_add_scan_video_results`. My poller `bkp57lw2w` will self-exit on next tick (session no longer working) — ignore its notification.

**RESUME RUNBOOK (~21:00) — thực hiện Y NHƯ TRƯỚC:**
1. Dispatch leg-2 bg session: `cd ~/Desktop/Workspace/auto-script && claude --bg --dangerously-skip-permissions --model claude-fable-5 '<leg-2 prompt>'`. Leg-2 prompt = same hard rules as §Standing constraints + §Dispatch pattern of this plan (KHÔNG hỏi giữa chừng; secrets → env+mock, ghi docs/build-needs-credentials.md; ports 3200/3201/5434 compose project autoscript; PUB port từ export v3, APP/ADM theo design system; verify-gate no bypass; token chain; dừng sạch ở boundary khi cạn context + handoff report) **PLUS leg-2 specific**: "Work IN the existing worktree `.claude/worktrees/macro2-build` (branch macro2-build — do NOT create a new worktree/branch; if session isolation forces one, base it on macro2-build). FIRST: reconcile the in-progress P7 — read git status/diff, finish or redo P7 cleanly (golden tests must pass), commit, THEN continue the /build-phase loop P8→P22."
2. Re-arm poller (same script as before, id pattern of new session), report milestones to operator, relay legs 3+ the same way when a session ends cleanly.
3. Mandatory operator stop remains **2.12 UAT (ACCEPTANCE)** — page operator, do not self-clear.
4. After 2.13 release: final report vs benchmark + friction log → fold new frictions into harness (like phase-4 did).
