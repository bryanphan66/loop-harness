# Phase 1 — Harness v2 Docs + Control Plane — Build Report

Date: 2026-07-05 · Session: bg `00d983b6` · Plan: `plans/260705-1835-macro2-unblock-harness-v2/phase-01-harness-v2-docs.md`
Output root: `harness/` · Source studied (read-only): `~/Desktop/Workspace/auto-script`

## Result: DONE — all 5 acceptance criteria pass

| AC | Check | Result |
|---|---|---|
| 1 | `grep -rn "next increment" harness/` | **0 hits** |
| 2 | Every WORKFLOW 2.x/3.x row has a `### Step` goal block (2.1–2.13 incl. 2.1b, 3.1–3.6) | **all 20 present** (+ 1.5-lite/1.9-lite/1.10-lite) |
| 3 | `/build-phase` + build-manifest + srs-lite templates exist, cross-referenced | **yes** (WORKFLOW ↔ STAGE_GOALS ↔ dor-build ↔ command ↔ playbook ↔ template READMEs) |
| 4 | `install-harness.sh --dry-run --bootstrap <tmp>` | **exit 0, 110 files**; full `--bootstrap --spec` run also verified end-to-end (git init, spec drop, STAGE.md fill, baseline commit) |
| 5 | This report | here |

## What was built (deliverable → files)

**A. Macro-2/3 goals unstubbed**
- `harness/docs/process/STAGE_GOALS.md` (730 loc): full goal blocks 2.1–2.13 + 3.1–3.6 (3.1/3.6 full; 3.2–3.5 concise but executable), + Lite variants. Lookup convention updated (`stage-2.6-p3` → `### Step 2.6`).
- `harness/.claude/agents/stage-runner.md`: stub-BLOCKED behavior deleted; new "Build steps (2.x) — execution rules" (2.6 = ONE PHASE per invocation, delegate to `fullstack-developer`, pipeline implement→validate:quick→smoke→register→token commit; Status block now carries phase id + verify results). Kept `model: sonnet` for doc steps per phase spec.
- `harness/.claude/commands/stage-next.md`: stubbed-step failure mode deleted; 2.6 routes to `/build-phase`; Lite-lane route order added.

**B. Build Manifest**
- `harness/docs/mau-tai-lieu/build-manifest.md`: ordered P0..PN; per phase: REQ-IDs, entities, endpoints, screens+floorplan, runnable acceptance checks, verify commands, size S/M/L (S≤3/M≤6/L≤10 files; > L = split); coverage checklist (every in-scope REQ-ID exactly once) as DoR proof; CR-NN = new appended phase.
- `harness/docs/playbooks/build-manifest-compilation.md`: owns 2.3 manifest output; compile procedure (cluster by capability, order by dependency-then-risk, vertical slices) + anti-patterns (document phase, layer phase, kitchen-sink P1, re-reading the spine).
- `docs/gates/dor-build.md`: + manifest-complete line; `docs/gates/dod-build.md`: + manifest-exhausted line + gate-rebalance note.

**D. Phase loop driver**
- `harness/.claude/commands/build-phase.md` (new): picks next incomplete phase, assembles the MINIMAL context packet (phase block + ERD + SRS module file(s) + quoted screen-inventory rows + tokens paths), spawns one stage-runner, relays Status; one phase per invocation, never auto-loops, scope-widening → new phase/CR.

**E. Gate rebalance**
- `docs/process/WORKFLOW.md` note + `dod-build.md`: per-phase floor self-check (validate:quick + design-system floor + phase smoke) in 2.6; heavy 2.7/2.9/2.10 run once at manifest completion (+ mid-point 2.7 review if >6 phases).

**F. Macro-1 Lite lane**
- `docs/process/WORKFLOW.md` § Lanes: Full vs Lite; Lite route `1.1 → 1.2 → 1.5-lite → 1.9-lite → 1.10-lite → 1.11 → 1.12 (1 round) → 1.13 (owner ack; records 1.14/1.15 N/A) → 2.1`. Keeps REQ-ID grammar, floorplan classification, token chain (GAP-NNN optional — chain may start at REQ-ID).
- `docs/mau-tai-lieu/srs-lite.md` (new): modules + REQ-ID table + high-risk flags + feature table (= scope baseline) + NFR one-liners + freeze block.
- `docs/mau-tai-lieu/STAGE.md`: + `Lane:` + `Harness source:` Snapshot fields; Macro-2 pending rows renamed (walking skeleton, /build-phase loop); Lite-route note.

**G. Packaging**
- `harness/scripts/install-harness.sh`: source root = `harness/`; remote tarball resolves `<top>/harness`; HARNESS_REPO now REQUIRED in remote mode (no stale default); bootstrap fills Lane + Harness-source in STAGE.md (2.4 scaffolds stack template from there); baseline commit msg renamed; final banner teaches /stage-next + /build-phase + lanes. Verified: dry-run exit 0; real `--bootstrap --spec` into temp dir → 110 files, git init, verify-gate active, STAGE.md filled, baseline commit created.
- Root `README.md` (videcode-harness/): what/install/run-loop/lane-choice/success-bar (= hasi-hub benchmark checklist)/key docs.

**New Macro-2 design decisions (recorded here since not in phase file verbatim)**
1. **Manifest P0 = walking skeleton, executed by steps 2.4+2.5** (not /build-phase): 2.4 scaffolds template + env/CI + WALKING SKELETON gate; 2.5 extends seed + verifies seeded-admin login + flips P0. /build-phase then drives P1..PN.
2. **New canonical gate WALKING SKELETON** (install/build green, compose boots, health 200, seeded admin login, CI-equivalent local green) — added to WORKFLOW gate list + gate-check (`--gate WALKING-SKELETON`) + gates/README (mechanical, no file).
3. **Stack template location contract**: template stays in the harness source (never copied at install); installed projects find it via STAGE.md Snapshot `Harness source:` (filled by installer with local path or repo@ref). Avoids bloating every project with a starter monorepo.
4. **2.2 stack default** = the shipped stack template; deviation needs NFR-based ADR reasons.
5. **2.6 phase commits are stage-boundary commits**: STAGE.md stays Current=2.6 but History gains `2.6/P<N>` rows; manifest checkbox + ROADMAP progress flip in the same commit (satisfies verify-gate atomicity).
6. **Decision labels D1–D6** (formerly PROPOSAL.md refs) now defined in `docs/about/HARNESS.md` § Locked Decisions; all PROPOSAL.md references removed.

**Genericization**
- AGENTS.md project intro → bootstrap placeholder; all auto-script/YouTube/PROPOSAL.md/vibecode strings removed (`grep -rniE 'auto.script|youtube|PROPOSAL\.md|vibecode' harness/` → 0). CONTEXT_RULES got full Macro-2/3 reading tables incl. the phase-loop read discipline (phase block + named files ONLY; whole spine = Skip-by-design).

**Bugfixes found while testing the installer (pre-existing v1 bugs, macOS)**
- `set -e` abort after the copy summary (trailing `[ ... ] && log` false test) — bootstrap extras never ran on a fresh install.
- GNU-only sed expression in the design-system VERSION banner aborts on BSD sed → replaced with portable awk.

## Commits (this session, main)

`68044b7` import v1 skeleton · `2257702` WORKFLOW v2 · `46ed044` STAGE_GOALS full · `df4df9d` control-plane (/build-phase, stage-runner 2.x) · `0e979e1` manifest/srs-lite templates + gates · `86c4691` docs genericization · `1fcbbbe` installer fixes · (final) root README + report.

## Not done / for later phases

- `harness/templates/stack-pnpm-nest-next/` — Phase 2, other session (untouched per boundary; STAGE_GOALS 2.4 + README reference it by path).
- No proof run yet (Phase 3): /build-phase + manifest are untested on a real project.
- `.claude/settings.json` + `settings.local.json` at repo root created (bg-isolation off for this shared-checkout workflow) — left untracked deliberately.

## Unresolved questions

1. Remote-install repo: HARNESS_REPO left mandatory (no default) — set a real default once the team repo has a canonical GitHub home.
2. Should installed projects also get a copy of the stack template for offline scaffolds (vs. harness-source lookup)? Current choice: lookup only (KISS); revisit if 2.4 friction shows in the Phase-3 proof run.
3. hooks (`notify.sh`/`stage-deliver.sh` Telegram env) copied as-is — unverified on this machine; Phase 3 should confirm they no-op cleanly without `.claude/.env`.
