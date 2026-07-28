# Operating Modes — Build vs Steady-state

The harness runs a project in **two distinct modes**. They use different drivers, different trackers, and different gates. Conflating them is what let elearning's `STAGE.md` fossilize (it kept naming a "current step 1.13" for a project that had already gone live and moved to a queue).

```text
   Mode A — BUILD (finite, convergent)          Mode B — STEADY-STATE (perpetual, divergent)
   Macro 1 -> Macro 2 ................ GO-LIVE .............. Macro 3
   driver: /stage-next (stage-loop)     ^switch^     driver: issue-pipeline (event-driven)
   tracker: STAGE.md "current step"                 tracker: the issue board (states)
```

## Mode A — Build (Macro 1 -> 2)
Finite, one-directional: raw spec -> frozen scope + prototype -> ERD -> walking skeleton -> phase loop -> review/security/QA -> UAT -> **release**. Driven by **`/stage-next`** stepping through `WORKFLOW.md` (1.1 .. 2.13). Progress = one moving "current step" in `STAGE.md`. Gates = PB-G1..G4, DoR, DoD, phase-acceptance. This is what the harness already does well.

## Mode B — Steady-state (Macro 3)
Begins the moment Macro 2 ships a running app to a persistent env (**go-live = the graduation point**). From here the project is **built**; the job is to keep it healthy while it evolves. This is **NOT** a linear stage-loop — there is no single "current step", there is a **queue of change items in parallel states**.

Macro 3's one-time ceremonies (**3.1 handover, 3.2 hypercare kickoff, 3.6 retro**) still run once via `/stage-next`. But **3.3 steady-state + 3.5 change-control are CONTINUOUS** and run as the **issue-pipeline**, not stage steps:

- Every bug report / change request = **one GitHub Issue** (source of truth), moving through a **state model** (Backlog -> Ready for Dev -> In Dev -> Deploying -> Ready for Test -> QC Testing -> Ready for UAT -> UAT Testing -> Done; + Cancelled).
- Each item is **dispatched async** to a coder (own worktree), merged, **deployed, verified-at-source**, QC'd against its Acceptance Criteria, and **closed only at Done**.
- Driver = the **control session** giving `task -> poll -> ship`. Tracker = the **issue board**, not `STAGE.md`.

### Mode B rules (the ones that bit us — see `lessons-log.md`)
- **Golden rule on QC fail:** fail *within* an issue's AC -> back to In Dev on the same issue; fail *outside* its AC -> a new issue (the current one proceeds independently). Not "happy vs edge".
- **Close only at Done.** Reference issues with `Refs #N` / `Part of #N` in **both the PR body and every commit message** (squash-merge inherits commit keywords -> `Closes` there auto-closes wrongly).
- **BA-validate is upstream** (CS + Tech Lead before the issue exists); the pipeline doesn't re-validate. Business-sensitive items (price/order/permission/data-integrity) are held for a human.
- **Verify-at-source** after every deploy (the running artifact carries the shipped commit); never trust CI-green / HTTP-200.

## The graduation (Mode A -> Mode B)
At go-live (release 2.13, or the first persistent-env deploy that becomes the working environment):
1. `STAGE.md` Macro-stage flips to **Steady-state (Macro 3)**; drop the "current step" field (meaningless now) and replace with **"Steady-state since <date>; board = <issues link>"**.
2. `/stage-next` stops being the driver; the **issue-pipeline** takes over.
3. New work enters as **issues**, not stage steps.

A finite "current step" tracker in a live product is the smell that a project graduated but nobody flipped the mode.

## Reference implementation
The issue-pipeline was proven on **elearning-platform**: `docs/WORKFLOW.md § Quy trình code issue` (state model + rules), `scripts/issue-state.mjs` (set state), `scripts/qc-checklist.mjs` (QC checklist from AC), `.github/ISSUE_TEMPLATE/bug-report.md`, `docs/qc/regression-checklist.md`. Human-facing playbook: `videcode-harness/docs/team-playbook-human-agent.md`.

**Packaged into the harness (DONE):** the reusable, project-agnostic Mode-B kit lives at **`harness/templates/steady-state/`** (`scripts/issue-state.mjs`, `scripts/qc-checklist.mjs`, `.github/ISSUE_TEMPLATE/bug-report.md`, `docs/qc/regression-checklist.md` template) + the operating manual **`harness/docs/playbooks/steady-state-issue-pipeline.md`**. Copy it into a project at graduation and set `git config deploy.stagingurl`. The scripts resolve the repo dynamically (`gh repo view`) so they are not project-bound.
