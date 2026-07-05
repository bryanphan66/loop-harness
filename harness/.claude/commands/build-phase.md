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
   the screen-inventory rows below, <tokens path>, src/components/README.md.

   Screen-inventory rows for this phase:
   <quoted rows>

   Pipeline, in order: implement → validate:quick green → phase e2e smoke
   (the journeys the acceptance checks name) passes against the running app →
   add verification-register row(s) (TC-NNN, Result: pass) in
   docs/TEST_MATRIX.md → design-system floor self-check on touched screens
   (§4 floorplan / §7 actions / §8 modals, Tier-2 tokens only, Tier-3 reuse) →
   ONE stage-boundary commit citing ≥1 token that also flips the phase
   checkbox in docs/build-manifest.md, adds the 2.6/<P-id> History row
   in STAGE.md, and updates docs/ROADMAP.md.

   A grid/form screen with no screen-inventory row is BLOCKED (Designer must
   classify) — never invent a floorplan. Do not bypass the verify-gate.

   Project context: Today <date> · Repo <basename> · Lane <lane>.

   Return the final Status block (with phase id + verify results) as your last
   message.
   ```

5. **Report back** — quote ONLY the returned Status block, then one line:
   - `DONE` + phases remain → "Phase <id> done, <k> remaining — run
     `/build-phase` again."
   - `DONE` + manifest exhausted → "Manifest complete — run `/stage-next` for
     the 2.7 review." (If the manifest has >6 phases and roughly half are done,
     recommend the mid-point 2.7 review now — WORKFLOW § Gate rebalance.)
   - `BLOCKED` → relay the blocker + the unblock owner (e.g. unclassified
     screen → Designer/1.11). Never blind-retry the same phase; fix the input
     first.
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
- Never widen scope mid-phase: a discovered missing requirement goes to the
  manifest as a NEW phase (or a CR-NN if scope changed), not into this phase.
- Respect the verify-gate: a red gate on the phase commit means the phase is
  not done — no `--no-verify`.

Stay terse. The verbose work stays in the subagent + artifacts on disk.
