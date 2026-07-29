# Operating Modes & the Loop

How this harness runs a project — framed with the **Loop Engineering** maturity ladder (`prompt → context → harness → loop`; the shift from prompting an agent turn-by-turn to designing a *system that discovers work, dispatches it, verifies, recovers, persists state, and decides the next action until a goal is met*).

## The three engineering layers (the harness's vocabulary)
| Layer | What it designs | Where this harness embodies it |
|---|---|---|
| **Context engineering** | which instructions/data/tools reach the model, minimizing excess | slim `~/.claude/rules` (950→188) + on-demand skills + progressive disclosure; the repo's own `CLAUDE.md` (control role + gotchas), auto-loaded by cwd |
| **Harness engineering** | the executable environment around the model (files, git, gates, memory, feedback) | the non-bypassable `harness-verify-gate.sh`, the pnpm stack template, `STAGE.md`, gates (PB-G/DoR/DoD), per-repo `scripts/release.sh` + the project's CI/CD, auto-memory |
| **Loop engineering** | how the system repeatedly **observe → act → verify → recover → persist → decide-next**, on a schedule or until a goal | **Mode B** (below) is the loop; the control session running `task → poll → ship`; verify-at-source; cron routines |

These are additive layers, not alternatives — the harness needs all three. Today's work has been mostly context (the slim) + loop (this doc).

## Two modes
The harness runs a project in **two distinct modes** with different drivers, trackers, and gates. Conflating them is what let elearning's `STAGE.md` fossilize (it kept naming a "current step 1.13" for a project already live and moved to a queue).

```text
   Mode A — BUILD (finite, convergent)          Mode B — STEADY-STATE (perpetual = THE LOOP)
   Macro 1 -> Macro 2 ................ GO-LIVE .............. Macro 3
   driver: /stage-next (stage stepper)  ^switch^     driver: issue-pipeline loop (event-driven)
   tracker: STAGE.md "current step"                 tracker: the issue board (states)
   layers: context + harness            layers: context + harness + LOOP
```

## Mode A — Build (Macro 1 -> 2)
Finite, one-directional: raw spec -> frozen scope + prototype -> ERD -> walking skeleton -> phase loop -> review/security/QA -> UAT -> **release**. Driven by **`/stage-next`** stepping through `WORKFLOW.md` (1.1 .. 2.13). Progress = one moving "current step" in `STAGE.md`. Gates = PB-G1..G4, DoR, DoD, phase-acceptance.

Mode A is **convergent** (get to done once) so it is mostly a linear stepper, NOT a loop — the one genuine loop inside it is the **`/build-phase`** cycle at step 2.6 (code a phase → verify its acceptance → next phase). This is what the harness already does well.

## Mode B — Steady-state (Macro 3) = THE LOOP
Begins the moment Macro 2 ships a running app to a persistent env (**go-live = the graduation point**). From here the project is **built**; the job is to keep it healthy while it evolves — a perpetual, divergent loop, NOT a linear stage-loop. There is no single "current step"; there is a **queue of change items in parallel states**.

Macro 3's one-time ceremonies (**3.1 handover, 3.2 hypercare kickoff, 3.6 retro**) still run once via `/stage-next`. But **3.3 steady-state + 3.5 change-control are CONTINUOUS** — they ARE the loop, run as the **issue-pipeline**, not stage steps.

### The loop, primitive by primitive
| Loop primitive | Mechanism in this harness | Maturity |
|---|---|---|
| **discover** work | a bug report / change request becomes **one GitHub Issue** (source of truth) | strong |
| **dispatch** to a sub-agent | control session dispatches one async coder per issue (own worktree); `In Dev` | strong |
| **verify** | **verify-at-source** after deploy (running artifact carries the shipped commit) + fail-closed gates + QC checklist vs Acceptance Criteria | strong (self-correcting) |
| **recover** | auto-rollback on health-fail (deploy standard) + retry flaky push; NOT yet auto-re-dispatch on `BLOCKED` | **frontier — thin** |
| **persist state** | the **issue board** (10-state field) + comments (QC checklist, decisions) + `STAGE.md` one-liner | strong |
| **decide next** | control session picks the next issue; QC pass -> advance, fail -> golden rule | strong (human-in-loop) |

State model (the `States` org Issue Field): `Backlog -> Ready for Dev -> In Dev -> Deploying -> Ready for Test -> QC Testing -> Ready for UAT -> UAT Testing -> Done` (+ `Cancelled`).

### Mode B rules (the ones that bit us — see `lessons-log.md`)
- **Golden rule on QC fail:** fail *within* an issue's Acceptance Criteria -> back to `In Dev` on the same issue; fail *outside* its AC -> a new issue (the current one proceeds independently). Not "happy vs edge".
- **Close only at Done.** Reference issues with `Refs #N` / `Part of #N` in **both the PR body AND every commit message** (squash-merge inherits commit keywords -> `Closes` there auto-closes wrongly).
- **BA-validate is upstream** (CS + Tech Lead before the issue exists); the loop doesn't re-validate. Business-sensitive items (price/order/permission/data-integrity) are held for a human.
- **Verify-at-source** after every deploy; never trust CI-green / HTTP-200 alone.

## The graduation (Mode A -> Mode B)
At go-live (release 2.13, or the first persistent-env deploy that becomes the working environment):
1. `STAGE.md` Macro-stage flips to **Steady-state (Macro 3)**; drop the "current step" field (meaningless now) and replace with **"Steady-state since <date>; board = <issues link>"**.
2. `/stage-next` stops being the driver; the **loop (issue-pipeline)** takes over.
3. New work enters as **issues**, not stage steps.

A finite "current step" tracker in a live product is the smell that a project graduated but nobody flipped the mode.

## Loop maturity — where we are, where to grow
The loop is strong on **discover / dispatch / verify / persist / decide**. Two frontiers make it a *fuller* loop (the two steps Loop Engineering emphasizes that the harness is thinnest on):

**Frontier 1 — Recover (self-healing).** Verify catches failure; recover should act on it automatically:
- auto **re-dispatch on `BLOCKED`/`NEEDS_CONTEXT`** (more context -> simpler task -> stronger model) instead of waiting for a human.
- auto **retry flaky gates** (pre-push integration flake) a bounded number of times before flagging.
- auto **open a follow-up issue** when verify-at-source finds a deployed-but-wrong artifact.

**Frontier 2 — Autonomy (until-goal, less human-per-turn).** Today a human sits in the QC seat and prompts dispatch. To run more autonomously while keeping the human as the *business* gate only:
- auto-**triage** a new technical issue (Backlog -> Ready for Dev) when it is clearly non-business-sensitive (the BA-validate split already exists to decide this).
- auto-**dispatch** Ready-for-Dev technical issues on a schedule (cron routine), not on a human prompt.
- auto-**generate the QC checklist** on `Ready for Test` (already scripted: `qc-checklist.mjs`) and, where an e2e test exists, **auto-run it** so human QC is reserved for genuinely new/visual behaviour.
- keep the human as the **business gate**: BA-sensitive issues, UAT sign-off, prod releases.

These are development directions, not yet built — do them under Frontier 1 first (a self-healing loop is safer to make autonomous than a fragile one).

## Reference implementation + packaged kit
Proven on **elearning-platform**: `docs/WORKFLOW.md § Quy trình code issue` (state model + rules), `scripts/issue-state.mjs`, `scripts/qc-checklist.mjs`, `.github/ISSUE_TEMPLATE/bug-report.md`, `docs/qc/regression-checklist.md`. Human playbook: `videcode-harness/docs/team-playbook-human-agent.md`.

**Packaged into the harness (reusable):** the project-agnostic Mode-B kit lives at **`harness/templates/steady-state/`** + the operating manual **`harness/docs/playbooks/steady-state-issue-pipeline.md`**. Copy it in at graduation and set `git config deploy.stagingurl`; the scripts resolve the repo dynamically (`gh repo view`) so they are not project-bound.
