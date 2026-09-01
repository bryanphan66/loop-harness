# Phase 1 — Harness v2 docs + control plane

**Output root:** `/Users/bryan/Desktop/Workspace/videcode-harness/harness/`
**Source to copy-then-improve (READ-ONLY):** `/Users/bryan/Desktop/Workspace/auto-script` — files: `STAGE.md` (template form), `AGENTS.md`, `docs/{WORKFLOW,STAGE_GOALS,HARNESS,TRACE_SPEC,ROLE_MAP,CONTEXT_RULES,TEST_MATRIX}.md`, `docs/gates/`, `docs/playbooks/`, `docs/mau-tai-lieu/`, `docs/design-system/`, `.claude/{agents,commands,hooks}/`, `scripts/{install-harness.sh,harness-verify-gate.sh}`, `.githooks/`. Do NOT copy project-specific content (auto-script requirements/design/discovery/etc.) — harness must be project-agnostic; STAGE.md ships as the blank template from `docs/mau-tai-lieu/STAGE.md`.

## Deliverables (fix-design items A, B, D, E, F, G)

### A. Build Macro-2 (and minimal Macro-3) goal text
- `docs/process/STAGE_GOALS.md`: write full `### Step 2.1 … 2.13` goal blocks (same format as 1.x blocks: goal, inputs, outputs, gate checklist, engine, done-means). Macro-3: full text for 3.1, 3.6; keep 3.2–3.5 concise but executable (no `[next increment]` markers anywhere).
- `.claude/agents/stage-runner.md`: delete stub-BLOCKED behavior; add 2.x execution rules (below). Consider `model: sonnet` → keep for doc steps but instruct 2.6 phases to delegate to `fullstack-developer`.
- `.claude/commands/stage-next.md`: delete the "stubbed step" failure mode; add routing: step 2.6 → `/build-phase` loop instead of single stage-runner call.

### B. Build Manifest artifact
- New template `docs/mau-tai-lieu/build-manifest.md` + new playbook `docs/playbooks/build-manifest-compilation.md` (owns step 2.3 output).
- Manifest = ordered phases P0..PN. P0 = walking skeleton (from template, phase 2 of this plan). Each phase: id, name, REQ-IDs covered, entities touched, API endpoints, screens (+floorplan class), acceptance checks (concrete, runnable), verify commands, est. size (S/M/L). Rule: a phase must be completable in one agent session (≤~10 files touched); split otherwise.
- 2.3 gate (DoR) now additionally requires: build-manifest complete, every in-scope REQ-ID appears in exactly one phase, P0 defined.

### D. Phase loop driver
- New command `.claude/commands/build-phase.md`: reads build-manifest + STAGE.md, picks next incomplete phase, spawns ONE stage-runner (or fullstack-developer) invocation scoped to that phase with ONLY: the manifest phase block, ERD, relevant SRS module file(s), screen-inventory rows, design tokens paths. Phase = implement → `validate:quick` → e2e smoke for the phase's journeys → verification-register row(s) → one stage-boundary commit citing ≥1 token → mark phase done in manifest.
- stage-runner 2.6 rule: one PHASE per invocation (not one step); returns Status block incl. phase id + verify results.

### E. Gate rebalance
- `docs/process/WORKFLOW.md` 2.7/2.9/2.10 notes: per-phase floor self-check (design-system floor rules + validate:quick) during 2.6; full 6-dim review + security + QA run once when manifest complete (and mid-point if >6 phases). Update gates/dod-build.md accordingly.

### F. Macro-1 Lite lane
- `docs/process/WORKFLOW.md` new § Lanes: **Full** (paid client, current flow) vs **Lite** (internal/small): 1.1+1.2 merged intake → 1.5-lite (SRS-lite: modules + REQ-IDs table only, scenarios ONLY for high-risk money/auth/async reqs) → 1.9-lite feature list (scope freeze = owner ack) → 1.10-lite (tokens + Tier-1 pin only) → 1.12 prototype ONE round → 1.13 freeze (owner ack) → skip 1.14/1.15 (N/A-by-decision auto) → 2.1. Lite keeps: REQ-ID grammar, screen-inventory floorplan classification, token chain (GAP optional in Lite — chain may start at REQ-ID).
- New template `docs/mau-tai-lieu/srs-lite.md`. STAGE.md template gets a `Lane:` field (Full|Lite).

### G. Packaging
- Adapt `scripts/install-harness.sh` paths for new home (`harness/` as source root); keep Independence Principle (no ck-* hard deps; preflight warns only).
- Root `README.md` (at videcode-harness/): what the harness is, install into fresh project, run loop (`/stage-next` → gates → `/build-phase`), lane choice, success bar = `plans/reports/hasi-hub-benchmark-260705.md` checklist.

## Constraints
- Keep all v1 invariants: token chain, stage-boundary commits, verify-gate no-bypass, MANUAL_CHECKPOINT convention, N/A-by-decision, Independence Principle.
- English-only internal docs; concise > exhaustive (docs.maxLoc 800 per file).
- git: repo already initialized; conventional commits, no AI references, several focused commits.

## Acceptance
1. `grep -rn "next increment" harness/` → 0 hits.
2. Every WORKFLOW 2.x/3.x row has a matching full `### Step` goal block.
3. `/build-phase` + build-manifest template + srs-lite template exist and cross-reference correctly.
4. install-harness.sh dry-runs clean from `harness/` into a temp dir (test it).
5. Report → `plans/reports/phase-01-harness-v2-docs-build-report.md`.
