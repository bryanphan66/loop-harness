# Playbook — Steady-state issue-pipeline (Mode B)

How the harness runs a project **after go-live**. This operationalizes `WORKFLOW.md` Macro 3 steps **3.3 steady-state** + **3.5 change-control**. Model + when-to-switch: `../OPERATING-MODES.md`.

## Install (once, at graduation to Mode B)
From `harness/templates/steady-state/`, copy into the project:
- `scripts/issue-state.mjs` — set an issue's State (resolves the org Issue Field by name, re-sends other field values so nothing is wiped, `gh` only).
- `scripts/qc-checklist.mjs` — generate a QC checklist from an issue's Acceptance Criteria (happy path + 6 slices), post it as a comment (idempotent).
- `.github/ISSUE_TEMPLATE/bug-report.md` — the bug form (repro / expected / actual / severity / evidence + env).
- `docs/qc/regression-checklist.md` — fill with THIS project's core flows.

Config: `git config deploy.stagingurl https://<staging>`. The State model lives as an **org-level GitHub Issue Field** named `States` (single-select) — see the state list below; create it once per org.

## The unit: one issue, one lifecycle
Every bug/change = **one GitHub Issue** (source of truth). It moves through 10 states:

`Backlog -> Ready for Dev -> In Dev -> Deploying -> Ready for Test -> QC Testing -> Ready for UAT -> UAT Testing -> Done` (+ `Cancelled`).

| Who | Does |
|---|---|
| CS + Tech Lead (upstream) | **BA-validate BEFORE creating the issue** — classify business risk (price/order/permission/data-integrity held for a human). The pipeline does not re-validate. |
| PM | triage Backlog -> Ready for Dev (AC + Module + Priority present). |
| Control session | dispatch one async coder per issue (own worktree), set In Dev; after code, merge, deploy, verify-at-source, set states. |
| Coder (bg) | code to AC, run the verify gate, attach QC checklist (`qc-checklist.mjs`), open a **draft PR** to the integration branch. |
| QC (human) | test on staging via the issue's checklist; pass -> Ready for UAT, fail -> keep + file bug. |
| Customer | UAT -> Done. |

Set state: `node scripts/issue-state.mjs <N> "<state>"`.

## The rules that bite (bake into every dispatch prompt)
1. **Golden rule on QC fail:** fail *within* the issue's AC (happy or edge) -> **back to In Dev on the same issue**; fail *outside* its AC -> **a new issue** (the current one proceeds independently). Not "happy vs edge".
2. **Close only at Done.** Reference issues with `Refs #N` / `Part of #N` in **both the PR body AND every commit message** — never `Closes/Fixes/Resolves` (squash-merge inherits the commit keyword and auto-closes early).
3. **Every QC defect = a NEW issue** (Backlog), never a silent back-transition of an already-passed feature. Parent it to the right feature at creation.
4. **Verify-at-source** after each deploy: the running artifact carries the shipped commit (container tag / health version), never trust CI-green or HTTP-200.
5. **Progress is the board, not `STAGE.md`.** In Mode B `STAGE.md` holds only "Steady-state since <date>; board = <link>".

## Regression + automation
Before a large deploy, run `docs/qc/regression-checklist.md`. After QC-ing a flow by hand, have a coder add an e2e test so the checklist shrinks over time.
