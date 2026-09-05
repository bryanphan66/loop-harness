# Playbook — Steady-state issue-pipeline (Mode B)

**When To Run:** after go-live — running the perpetual issue loop (Mode B: discover → dispatch → verify → recover → persist → decide-next). **Skip when:** the project is still in Mode A (pre-go-live build).

**Lifecycle:** verified · **First use:** elearning steady-state (2026-07) · **Verified by:** elearning issue-pipeline (R2/R3 dogfooded)

**Macro-stage / step:** Post-Build (Macro 3) — 3.3 steady-state + 3.5 change-control (the loop). **Gate it serves:** verify-at-source + QC-vs-AC on every issue.

## Engine
- **Fast path:** control session dispatches one async coder per issue (own worktree) + the `steady-state/scripts/*` kit.
- **Bare-agent fallback:** the global agent runs the loop by hand (discover -> dispatch -> verify -> recover -> persist -> decide-next).

How the harness runs a project **after go-live**. This operationalizes `WORKFLOW.md` Macro 3 steps **3.3 steady-state** + **3.5 change-control**. Model + when-to-switch: `../OPERATING-MODES.md`.

## Install (once, at graduation to Mode B)
From `scaffolds/steady-state/`, copy into the project:
- `scripts/issue-state.mjs` — set an issue's State (resolves the org Issue Field by name, re-sends other field values so nothing is wiped, `gh` only). **Enforces the legal transitions below** — the 10 states are a barrier, not paint on the floor.
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
| Control session | dispatch one async coder per issue (own worktree); after code, merge, run `ship-and-verify.sh` (auto-sets Deploying + Ready for Test). **Bracket every dispatch with `run-log.mjs start` / `end`** — that log is the only evidence a harness change helped. |
| Coder (bg) | **first action: `node .harness/steady-state/scripts/issue-state.mjs <N> "In Dev" --advance`** (binds In Dev to the coder actually starting — no operator memory needed); then code to AC, run the verify gate, attach QC checklist (`qc-checklist.mjs`), open a **draft PR** to the integration branch. |
| QC (hybrid) | **agent-QC does the OBJECTIVE half** — assert on staging (API/DB/RBAC 403/email via Mailpit/business-rule/status-code) + **tick DoD-13**, and **flag visual/UX for human** (never fake-tick "looks right"). Control sets `QC Testing` at QC-dispatch (bind state to the action, don't rely on the worker). pass-objective -> Ready for UAT (human does the visual/final check at UAT); AC-fail -> In Dev (golden rule); out-of-AC bug -> sub-issue (Refs parent); teardown test data. **Verify = 2 INDEPENDENT passes, 2nd ADVERSARIAL (prompt to REFUTE)** — a single pass missed ~50% false-PASS in dogfood 260902; only advance when both agree. |
| Customer | UAT -> Done. |

Set state: `node .harness/steady-state/scripts/issue-state.mjs <N> "<state>"`.

### States are auto-set by the action, not by memory
The loop used to rely on the operator *remembering* to run `issue-state.mjs` at each
step — so issues silently sat at their old state (e.g. a coder working while the issue
was still unset / Backlog). State is now **bound to the action that defines it**:

| Transition | Bound to | Mechanism |
|---|---|---|
| ... -> **In Dev** | coder starts | first line of the coder dispatch prompt runs `issue-state.mjs <N> "In Dev" --advance` (walks unset/Backlog/Ready-for-Dev -> In Dev in one idempotent call) |
| In Dev -> **Deploying** | merge + deploy | `ship-and-verify.sh` sets it before polling the deploy |
| Deploying -> **Ready for Test** | verify-at-source PASS | `ship-and-verify.sh` sets it only after the running artifact carries the shipped commit (fail-closed: no verify, no advance) |
| Ready for Test -> **QC Testing** | QC starts | control sets it at QC-dispatch (agent-QC hybrid or human) — bind state to action |
| QC Testing -> **Ready for UAT** | objective QC pass | agent-QC advances after 2-pass adversarial verify + DoD tick; **UAT + Done stay human** (visual/final on staging). `--advance` still refuses to auto-jump past In Dev |

Issues entering via Plane-sync / manual `gh` land at `(chua co)` (unset); `--advance`
handles that start. Issues created via `new-issue.mjs` start at `Backlog` automatically.

### The transitions are enforced, not documented

The state list used to live only in prose, so nothing stopped an issue jumping
`Backlog → Done` — shipped without ever passing QC, silently. `issue-state.mjs`
now carries the edge table and **blocks any move that is not on it** (fail-closed:
an unrecognised state name is refused too, so an org renaming its options can't
quietly disarm the guard).

```text
(unset) → Backlog | Ready for Dev
Backlog → Ready for Dev                In Dev        → Deploying | Ready for Dev
Ready for Dev → In Dev | Backlog       Deploying     → Ready for Test | In Dev
Ready for Test → QC Testing | In Dev   QC Testing    → Ready for UAT | In Dev
Ready for UAT → UAT Testing | In Dev   UAT Testing   → Done | In Dev
Done → ∅ (terminal)                    Cancelled     → Backlog
every non-terminal state → Cancelled
```

The backward edges are exactly the **golden rule**: a QC/UAT failure inside the
issue's AC returns it to `In Dev`; a failure outside its AC becomes a new issue.
`Done` has no outgoing edge on purpose — a defect found after Done is always a
new issue, never a reopened one (rule 3 below).

Verify the table without touching GitHub: `node .harness/steady-state/scripts/issue-state.mjs --self-test`
(20 transition cases + table integrity; exits non-zero on any mismatch — safe to
wire into CI).

**Bypass is for humans only:** `--force "<reason>"` — the reason is mandatory and
gets logged, same policy as the verify-gate. An agent that hits the guard must
fix the sequence, not force past it.

## The rules that bite (bake into every dispatch prompt)
1. **Golden rule on QC fail:** fail *within* the issue's AC (happy or edge) -> **back to In Dev on the same issue**; fail *outside* its AC -> **a new issue** (the current one proceeds independently). Not "happy vs edge".
2. **Close only at Done.** Reference issues with `Refs #N` / `Part of #N` in **both the PR body AND every commit message** — never `Closes/Fixes/Resolves` (squash-merge inherits the commit keyword and auto-closes early).
3. **Every QC defect = a NEW issue** (Backlog), never a silent back-transition of an already-passed feature. Parent it to the right feature at creation.
4. **Verify-at-source** after each deploy: the running artifact carries the shipped commit (container tag / health version), never trust CI-green or HTTP-200.
5. **Progress is the board, not `STAGE.md`.** In Mode B `STAGE.md` holds only "Steady-state since <date>; board = <link>".

## Bug vs UAT vs CR — where each lands (source-of-truth discipline)

The board holds bugs/changes; the **feature-register** holds features; the **SRS**
holds requirement detail. Which artifact a finding touches depends on what it is:

- **Bug (QC or UAT):** a new GitHub issue, parented to the feature. It does **NOT**
  go into the feature-register (it is a defect, not a feature). Its DoD **does**
  require updating the SRS/docs **if the bug revealed a rule the SRS states
  wrongly or omits** (not for a pure code defect). "Bug UAT" == "Bug QC".
- **CR — small / free** (owner absorbs it, no re-quote): treat like a bug — a child
  issue + update the docs it touches. No bao-gia.
- **CR — large / billable** (new feature, costs time/money): mint a **`CR-NN`** via
  change-control (STAGE_GOALS 3.5) — impact + re-estimate + client approval
  BEFORE code — then it re-enters at 2.3 as a **new manifest phase**, and the new
  feature IS added to the feature-register (so the contract appendix regenerates).
- **The test for "does it go in the register":** is it a new FEATURE (a scope line
  a client would pay for)? Yes -> register (+ CR-NN if post-freeze). No (a defect
  or a clarification) -> issue only.

A QC/UAT finding that turns out to be a **missing feature** (not a bug) is a CR,
not a bug — route it to the register, not just the board.

## Recover — self-healing (Frontier 1, design)
`verify` catches failure; **recover** acts on it automatically so the loop doesn't stall on a human. **Invariant: bounded retry, then fail-closed to a human. Never retry unboundedly, never swallow a real error, and verify-at-source stays the final arbiter.**

Three recover points, one per place the loop actually broke (see `lessons-log.md`):

- **R1 — dispatch (`BLOCKED` / `NEEDS_CONTEXT`).** The control session auto-escalates instead of asking the human each time: **+context -> narrow scope -> stronger model -> human**. Cap **3 escalations**, then hand to a human with the trail. (Behavioural — bake into the dispatch loop, no script.)
- **R2 — gate (flaky pre-push).** The flake bites at **`git push`** (the pre-push gate runs the full suite), not at merge (merge is server-side). **Retry the push <=2x** on the flaky signature only (real failures like `rejected` never retry), then fail-closed. Script: `push-retry.sh`.
- **R3 — deploy (verify-at-source mismatch).** After merge, if the running container SHA != the shipped commit, or health != ok: **re-trigger the deploy 1x**; still wrong -> **open a follow-up issue + flag** (prod -> auto-rollback per the deploy standard). Script: `ship-and-verify.sh`.

### Script contracts (in `scaffolds/steady-state/scripts/`, config-driven; dogfooded on elearning-platform)
- **`push-retry.sh [<git push args>]`** — `git push`, retried <=2x ONLY on the flaky-integration signature (redis/BullMQ/timeout); a deterministic failure (rejected/network) exits immediately; fail-closed after the cap. Used at push time (e.g. in the coder's dispatch).
- **`ship-and-verify.sh <issue> [<commit>]`** — after merge: poll the deploy run -> **verify-at-source** (SSH the running web container's git SHA == `<commit>`) -> on mismatch re-trigger deploy once -> on 2nd mismatch `gh issue create` a "deploy-drift" follow-up `Refs #<issue>` and exit non-zero. Repo from `gh repo view`; deploy target/branch via env (`DEPLOY_SSH`/`DEPLOY_BRANCH`/`DEPLOY_WORKFLOW`).

**Do NOT:** infinite retry; auto-retry a *deterministic* failure (only flaky/transient); close the issue while recover is unresolved; make R1 autonomous before R2/R3 are proven (a fragile loop must not self-drive).

## Regression + automation
Before a large deploy, run `docs/qc/regression-checklist.md`. After QC-ing a flow by hand, have a coder add an e2e test so the checklist shrinks over time.
