---
description: Run the next 3-macro-stage WORKFLOW step via the stage-runner subagent so the main session stays small
allowed-tools: Read, Bash, Task
---

Goal: hand the next `docs/process/WORKFLOW.md` step to the `stage-runner` subagent, then
summarise the result to the user. Keep this turn focused on orchestration — do
NOT do the step work in the main session.

Step IDs are `MACRO.STEP`: Pre-Build `1.1`–`1.15` (Lite lane: `-lite` variants),
Build & Go-live `2.1`–`2.13`, Post-Build `3.1`–`3.6` (`docs/process/WORKFLOW.md`).

## Steps

1. Read `STAGE.md` at repo root to find:
   - Current step (Snapshot → Current stage)
   - Lane (Snapshot → Lane: Full | Lite)
   - Last completed step + any blockers

2. Determine the next step to run:
   - If Current points to a step that has NOT run yet → that IS the next step.
   - If Current is marked done in Snapshot but the pointer still names it →
     advance per the `docs/process/WORKFLOW.md` order.
     **Full lane:**
     `1.1 → 1.2 → … → 1.9 (PB-G2) → … → 1.13 (PB-G3) → 1.14 → 1.15 (PB-G4)`
     then `2.1 → 2.1b? → 2.2 → … → 2.12 (ACCEPTANCE) → 2.13`
     then `3.1 (HANDOVER) → 3.2 → … → 3.6`.
     **Lite lane (docs/process/WORKFLOW.md § Lanes):**
     `1.1 → 1.2 → 1.5-lite → 1.9-lite (PB-G2 owner ack) → 1.10-lite → 1.11 →
     1.12 → 1.13 (PB-G3 owner ack; records 1.14/1.15 N/A-by-decision)` then the
     same 2.x / 3.x route as Full.
   - **Conditional steps** (2.1b data-migration, NFR/load and DR at 2.11,
     compliance/WCAG) only run when in scope; if the project marked them
     **N/A by decision**, skip to the next applicable step.
   - **Step 2.6 routes to `/build-phase`, not here.** If the next step is 2.6
     (or 2.6 has incomplete manifest phases), do NOT spawn a single
     stage-runner for "2.6" — tell the user to run `/build-phase` (or invoke it
     yourself if asked to keep going). One `/build-phase` invocation = one
     manifest phase; repeat until the manifest is exhausted, then return here
     for 2.7.

3. Read the matching goal text for the next step:
   - Use the `### Step <id>` block in `docs/process/STAGE_GOALS.md` (every step in all
     three macro-stages has one; `-lite` ids have their own blocks).
   - If a block is genuinely missing, treat it as a harness defect: extract the
     step's row intent from `docs/process/WORKFLOW.md` (Role · Engine · Inputs · Output
     path · Gate), pass that as the goal, and flag the missing block to the
     user.

4. Substitute placeholders in the goal:
   - `{date}` → today's `YYYY-MM-DD` (use `date +%Y-%m-%d` via Bash)
   - `{slug}` → derive from repo basename or pass-through
   - `{client}` / `{module}` / `{run_id}` → only if the user provided them in
     the slash invocation arguments

5. Spawn the stage-runner via the Task tool:

   ```
   Task({
     description: "Run step <id>",
     subagent_type: "stage-runner",
     prompt: <built prompt — template below>
   })
   ```

   Prompt template:
   ```
   Run step <id> (<step name>) end-to-end per docs/process/WORKFLOW.md.

   Goal (verbatim, substitutions applied):
   <substituted goal body>

   Project context:
   - Today: <YYYY-MM-DD>
   - Repo: <basename>
   - Lane: <lane from STAGE.md>
   - <any extra context from user>

   Read STAGE.md, AGENTS.md, docs/process/WORKFLOW.md (your step row), docs/process/ROLE_MAP.md,
   docs/process/TRACE_SPEC.md, and your own agent definition first. Delegate to the
   row's Role + Engine; fall back to the global agent + playbook if the ck-skill
   is absent (Independence Principle). Stop at a MANUAL_CHECKPOINT (client-paging
   gate) or when the goal holds. Return the final Status block as your last
   message.
   ```

6. When stage-runner returns, do NOT repeat its full output. Quote ONLY the
   final Status block (lines `**Status:**` through `**Summary:**`). Add a
   one-line recommendation:
   - `Status: DONE` → "Ready for `/stage-next` again, or stop here for review."
     (If the step just completed was 2.3/2.4/2.5 and 2.6 is next → "Run
     `/build-phase` to start the phase loop.")
   - `Status: MANUAL_CHECKPOINT_PENDING` → "Waiting on offline work — see
     MANUAL_CHECKPOINT above. The paging gate clears when the human returns the
     stated condition."
   - `Status: BLOCKED` → relay the blocker; suggest the unblock action (more
     context / simpler scope / escalate — never blind-retry).
   - `Status: NEEDS_CONTEXT` → ask the user for the missing info; do NOT re-spawn
     until provided.

## Arguments

The user may pass extras after `/stage-next`. Honor these:
- `--step <id>` → override the auto-detected next step
- `--turn-budget <N>` → override default 25 turns in stage-runner
- Free text → append to "extra context" in the prompt

If no arguments, auto-pick from `STAGE.md`.

## Gate awareness

Before spawning, if the step you are about to run depends on an EARLIER gate
being GREEN (e.g. running 1.10 design before PB-G2 scope is frozen, or running
any 2.x build step before PB-G4 in the Full lane / the PB-G3 freeze + recorded
1.14/1.15 N/A in the Lite lane), STOP and run `/gate-check` first — never start
build code before the lane's hard line. Surface the missing gate to the user
instead of proceeding.

## Failure modes

- `STAGE.md` missing → tell the user to bootstrap first
  (`scripts/install-harness.sh`).
- Next step is 2.6 → route to `/build-phase` (see step 2 above).
- No next step (Current at 3.6, project closed) → congratulate; suggest
  archiving + a session-retrospective.

Stay terse. The harness keeps the verbose work in artifacts on disk.
