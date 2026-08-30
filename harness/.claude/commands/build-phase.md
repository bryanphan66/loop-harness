---
description: Run ONE build-manifest phase (WORKFLOW step 2.6) via a scoped stage-runner invocation — the phase-loop driver that turns the frozen spec into a running app
allowed-tools: Read, Bash, Grep, Task
---

Goal: drive **one phase** of `docs/build-manifest.md` to done. This is the
execution engine of WORKFLOW step 2.6: the manifest (compiled at 2.3) is the
ordered build plan P0..PN; each `/build-phase` invocation implements exactly the
next incomplete phase in an isolated subagent context, verifies it, and commits
it. Repeat `/build-phase` until the manifest is exhausted, then `/stage-next`
continues at 2.7.

Do NOT implement the phase in the main session — orchestrate only.

## Steps

1. **Preconditions** (read, don't assume):
   - `STAGE.md` Snapshot → Current must be **2.6** (or 2.4/2.5 done and 2.6
     next). If Pre-Build gates are not cleared for this lane, STOP and run
     `/gate-check` — never build before the lane's hard line.
   - `docs/build-manifest.md` must exist with a phase table/blocks. If
     missing → tell the user to run step 2.3 first (`/stage-next`).

2. **Pick the phase:**
   - Default: the FIRST phase whose checkbox is not done, in manifest order
     (P0 first — though P0 is normally closed by steps 2.4/2.5).
   - `--phase <id>` argument overrides (e.g. `--phase P3`), but refuse to run a
     phase whose listed dependencies (earlier phases it names) are not done.
   - **Acceptance precondition (`docs/gates/phase-acceptance.md`):** refuse to
     start a phase while the PREVIOUS done phase's `Accepted` cell in the
     manifest Progress table is incomplete — missing `agent-pass`, verdict
     FAIL, or (`Verify-by: both`) missing `human-ok`. Fix / verify / get the
     operator's OK first; never build on an unverified phase.

3. **Assemble the MINIMAL context packet** for the subagent — ONLY:
   - The phase's own block from `docs/build-manifest.md` (verbatim).
   - `docs/system-architecture.md` (ERD section) — path reference.
   - The SRS module file path(s) covering the phase's REQ-IDs
     (`docs/requirements/srs/<module>.md` or `docs/requirements/srs-lite.md`).
   - The `docs/visuals/diagrams/screen-inventory.md` rows for the phase's
     screens (quote the rows).
   - The design-tokens path(s) + `src/components/README.md` (Tier-3 inventory).
   - Today's date, project slug, lane.

   Do NOT paste the whole manifest, the whole SRS, or any prior phase's diff.
   The phase block is the scope contract; the spine stays on disk.

4. **Spawn ONE stage-runner** (subagent_type: `stage-runner`; alternatively
   `fullstack-developer` if the user asked to skip orchestration — default
   stage-runner so gate + commit discipline is enforced). Registry caveat: a
   session started BEFORE the harness install has no `stage-runner` in its
   frozen agent registry — use the `fullstack-developer` fallback with the same
   packet for that session:

   ```
   Task({
     description: "Build phase <P-id>",
     subagent_type: "stage-runner",
     prompt: <packet — template below>
   })
   ```

   Prompt template:
   ```
   Run WORKFLOW step 2.6 for build-manifest phase <P-id> ONLY (one phase per
   invocation — docs/STAGE_GOALS.md ### Step 2.6).

   Phase block (scope contract — do not exceed it):
   <verbatim phase block>

   Read only: docs/system-architecture.md (ERD), <SRS module path(s)>,
   the screen-inventory rows below, the prototype export source files the
   phase block cites, <tokens path>, src/components/README.md.

   Screen-inventory rows for this phase:
   <quoted rows>

   Screens ADOPT their cited prototype export as code (bring the export's real
   tokens.css/components.css into the app; port kit components KEEPING their
   classNames so the CSS applies; rebuild each screen from its screens-*.jsx
   structure; wire only real data/routing/API) — do NOT re-implement the look in
   fresh Tailwind by reading the export. `rebuild (decision: <slug>)` (no export
   for the screen) is the only exception (docs/playbooks/build-execution.md §
   Prototype → Code Fidelity + prototype-export-adoption.md). Encode the phase
   block's per-screen fidelity contract (required elements + interactions) as
   Playwright assertions in a `<screen>-fidelity.spec.ts` and run them green.
   IMPLEMENT every screen through EXISTING shared components (grep components/ui/
   first; a grid MUST use DataGrid, never a re-drawn `<table>`; do NOT create a
   duplicate of an existing primitive — add a MISSING primitive to components/ui/
   as shared). Every mapped route in scripts/fidelity-map.json must pass
   `check-prototype-fidelity.mjs` (required components imported-from-shared + used,
   required sections present) — this is the adopt-via-existing-components HARD step
   (build-execution.md § Bước bắt buộc 2.6.b).
   Failed operations must surface their REAL cause to the UI — no generic
   error-swallow. A fix touching a systemic pattern (error handling, model/tier
   resolution, auth, quota) sweeps ALL grep'd call-sites, not just the reported
   one.

   Pipeline, in order: implement → validate:quick green → phase e2e smoke
   (the journeys the acceptance checks name) passes against the running app →
   add verification-register row(s) (TC-NNN, Result: pass) in
   docs/TEST_MATRIX.md → design-system floor self-check on touched screens
   (§4 floorplan / §7 actions / §8 modals, Tier-2 tokens only, Tier-3 reuse) →
   visual-fidelity: each screen's fidelity assertions GREEN (element
   completeness + interaction behaviour) + capture the running screenshot for
   the human glance — docs/gates/visual-fidelity.md; a RED assertion = fix
   before commit; do NOT self-certify "matches export" →
   ONE stage-boundary commit citing ≥1 token that also flips the phase
   checkbox in docs/build-manifest.md, adds the 2.6/<P-id> History row
   in STAGE.md, and updates docs/ROADMAP.md.

   A grid/form screen with no screen-inventory row is BLOCKED (Designer must
   classify) — never invent a floorplan. A screen with no export citation and
   no recorded rebuild decision is BLOCKED the same way. Do not bypass the
   verify-gate.

   Project context: Today <date> · Repo <basename> · Lane <lane>.
   Preview command/URL: <from the manifest header — leave the app runnable>.

   Return the final Status block (with phase id + verify results) as your last
   message. Implementation self-checks are NOT acceptance — an independent
   verifier runs after you; leave the preview bootable for it.
   ```

5. **ACCEPTANCE VERIFICATION** (`docs/gates/phase-acceptance.md`) — runs after
   the stage-runner returns `DONE`, BEFORE the phase counts as done:

   a. **Agent verifier — ALWAYS, every phase.** Spawn a SECOND, independent
      subagent (fresh context — `general-purpose` or `tester`; never the
      implementer) with ONLY: the phase block verbatim (its Acceptance checks
      are the contract), the preview command/URL from the manifest header, the
      phase's screen-inventory rows + export source paths, and
      `docs/gates/phase-acceptance.md`. It verifies against the RUNNING app:
      every functional AC as written, visual fidelity per shipped screen
      (**runs the screen's Playwright fidelity assertions** — element
      completeness + interaction behaviour — and captures the screenshot for the
      human glance; it does NOT LLM-compare two images), and the negative-path
      check (real cause surfaces, no generic message). It returns the gate's
      verdict block (PASS/FAIL + per-check results + evidence paths + reasons).
   b. **FAIL → fix in the SAME phase.** Dispatch a fix leg (same phase scope,
      the verifier's Reasons as input), re-run the verifier. Cap 3 rounds; then
      `BLOCKED` — page the human. Never start the next phase on a FAIL.
   c. **PASS → record it:** fill the phase's `Accepted` cell
      (`agent-pass <date>`) in the manifest Progress table + a TC-NNN
      acceptance row in `docs/TEST_MATRIX.md`, committed as one small
      `test(<scope>):` commit citing the TC token.
   d. **Human checkpoint — when the phase's `Verify-by` is `both`** (compiled
      from the manifest-header cadence knob; default `per-ui-phase`): emit the
      gate's `MANUAL_CHECKPOINT` block with the preview URL so the operator
      reviews THIS module on the running app. The next phase waits for the
      operator's OK (`human-ok <date>` in the Accepted cell); reported defects
      are fixed in this phase and re-verified from (a).

6. **Report back** — quote ONLY the returned Status block + the acceptance
   verdict line, then one line:
   - `DONE` + accepted + phases remain → "Phase <id> done + accepted, <k>
     remaining — run `/build-phase` again." (If waiting on a human checkpoint,
     say so — next phase starts only after the OK.)
   - `DONE` + manifest exhausted → "Manifest complete — run `/stage-next` for
     the 2.7 review." (If the manifest has >6 phases and roughly half are done,
     recommend the mid-point 2.7 review now — WORKFLOW § Gate rebalance.)
   - `BLOCKED` → relay the blocker + the unblock owner (e.g. unclassified
     screen → Designer/1.11; 3× verify FAIL → human). Never blind-retry the
     same phase; fix the input first.
   - `DONE_WITH_CONCERNS` → surface the concerns; decide address-now vs log,
     per the concern's correctness impact.

## Arguments

- `--phase <id>` → run a specific phase (dependencies must be done).
- `--turn-budget <N>` → override the default 25 turns.
- Free text → appended to the packet as extra context.

## Rules

- One invocation = one phase. Looping is the human's (or the calling
  session's) choice per invocation — this command never auto-runs the next
  phase.
- A phase is done only when its acceptance verdict is recorded — implement +
  self-check + commit without the independent verifier PASS is NOT done
  (`docs/gates/phase-acceptance.md`). The verifier is never the implementer.
- Never widen scope mid-phase: a discovered missing requirement goes to the
  manifest as a NEW phase (or a CR-NN if scope changed), not into this phase.
- Respect the verify-gate: a red gate on the phase commit means the phase is
  not done — no `--no-verify`.

Stay terse. The verbose work stays in the subagent + artifacts on disk.
