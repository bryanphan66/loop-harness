# Context Rules

What context to load per macro-stage / step, when to read it, and when to stop.
Additive to the stable `AGENTS.md` reading order — `AGENTS.md` lists the
entrypoints every task reads; this file says what to retrieve *after* that, based
on the WORKFLOW step.

The goal is not maximum context. It is putting the right information in the model
for the current step at the lowest token cost.

> **Pairs with `.claude/hooks/context-monitor.sh`:** the hook tells you **how
> much** context you have spent (40/60/80/95% warnings); this file tells you
> **what** is worth spending it on. When the hook warns at 80%, stop reading
> anything marked `Skip` for your step and move to producing the artifact.

> **Delegate heavy reads:** the `stage-runner` subagent runs a step in its own
> context (`/stage-next`), so a step's 10-30k tokens of reading never lands in the
> main session (`AGENTS.md` § Stage Orchestration).

## Always Loaded (every task)

| Source | Why |
|---|---|
| `STAGE.md` | Where is this project at? Read first, always. |
| `AGENTS.md` | Task loop + gate rules + verify-gate no-bypass. |
| `docs/WORKFLOW.md` (current step row) | The step's Role · Engine · Output · Gate. |
| `docs/TRACE_SPEC.md` (at the end) | Record the session trace; keep the token chain unbroken. |

## Macro-Stage 1 — PRE-BUILD

### Block A — PM Intake (1.1–1.2)

| Source | Tiny | Normal | High-risk |
|---|---|---|---|
| `docs/discovery/*` (raw client inputs) | Should | Must | Must |
| `docs/intake/*` (prior briefs this project) | Skip | Must | Must |
| `docs/templates/client-intake-brief.md` (+ `locale-vi/`) | Skip | Must | Must |
| `docs/gates/pb-g1-intake.md` | Skip | Must | Must |
| Conditional-probe checklist (compliance / brownfield) | Should | Must | Must |

### Block B — BA Core Docs (1.3–1.9)

| Source | Tiny | Normal | High-risk |
|---|---|---|---|
| `docs/intake/*` (intake brief + discovery summary) | Skip | Must | Must |
| `docs/requirements/*` for the touched module | Must | Must | Must |
| Stage playbook (gap-analysis, scenario-taxonomy, discovery-interview) | Skip | Must | Must |
| `docs/TRACE_SPEC.md` (REQ-ID grammar + RTM rule) | Should | Must | Must |
| `docs/requirements/traceability/RTM.md` (existing chain) | Should | Must | Must |
| `docs/gates/pb-g2-scope-frozen.md` (at 1.9) | Skip | Must at 1.9 | Must at 1.9 |

### Block C — Design Prototype (1.10–1.13)

| Source | Tiny | Normal | High-risk |
|---|---|---|---|
| `docs/scope-baseline/feature-register.*` (frozen, PB-G2) | Skip | Must | Must |
| `docs/design/*` + `docs/design-guidelines.md` | Skip | Must (UI) | Must (UI) |
| `docs/visuals/diagrams/*` (RPM, status-flow, screen map) | Skip | Must | Must |
| `docs/requirements/use-cases/USE_CASES.md` | Skip | Must | Must |
| `docs/gates/pb-g3-prototype-frozen.md` (at 1.13) | Skip | Must at 1.13 | Must at 1.13 |

### Block D — Freeze + Quote + Contract (1.14–1.15)

| Source | Tiny | Normal | High-risk |
|---|---|---|---|
| `docs/scope-baseline/feature-register.*` (frozen) | Skip | Must | Must |
| `docs/visuals/prototype/feedback-final.md` (frozen, PB-G3) | Skip | Must | Must |
| `docs/templates/locale-vi/bao-gia/*` (+ contract / SOW) | Skip | Must | Must |
| `docs/gates/pb-g4-contract-deposit.md` | Skip | Must | Must |
| `docs/ROADMAP.md` (skeleton, born here) | Skip | Must at 1.15 | Must at 1.15 |

## Macro-Stage 2 — BUILD & GO-LIVE *(detailed reading tables in next increment)*

Until the next increment fills detail, load the WORKFLOW step row + these anchors:

- `docs/gates/dor-build.md` (entry, 2.3) and `docs/gates/dod-build.md` (exit, 2.10).
- `docs/system-architecture.md` (ERD freeze, 2.1) + the stack decision slug (2.2).
- The files being changed + `docs/TEST_MATRIX.md` (existing proof + register).
- `docs/TRACE_SPEC.md` — cite ≥1 token per commit; keep RTM forward-complete.
- For any conditional enterprise gate touched, the matching toggle in `dod-build.md`.

## Macro-Stage 3 — POST-BUILD *(detailed reading tables in next increment)*

- `docs/handover/*` + `docs/runbook/*` at handover (3.1).
- `docs/requirements/change-requests/*` for any `CR-NN` flow (3.5).
- `docs/TRACE_SPEC.md` — every released REQ-ID in the handover; every `CR-NN` resolved.

## Retrieval Triggers

Fire these regardless of step when the condition appears:

| Trigger | Action |
|---|---|
| Task changes architecture, auth, data ownership, API shape, or validation rules | Treat as high-risk. Read prior `docs/decisions/*` before implementing; write `docs/decisions/<slug>.md` (stable slug, never a number) before closing. |
| First implementation of a new buildout | Confirm a stack-selection decision exists (2.2); if not, do not code. |
| Work touches a UI / visual surface | Read `docs/design-guidelines.md` + the Component Coverage Matrix. |
| A client-paging gate is next (PB-G2/G3/G4, ACCEPTANCE, HANDOVER) | Load the matching `docs/gates/*` file; plan the `MANUAL_CHECKPOINT`. |
| A conditional enterprise gate is in play | Mark it cleared **or** N/A by decision in `dod-build.md` — never silently drop (D2). |
| Hitting a familiar tooling / environment symptom | Scan `docs/playbooks/README.md` for a recipe before re-deriving. |
| Repeated confusion, stale doc, or missing proof | Record friction per `docs/TRACE_SPEC.md`. |
| Preparing the final response | Re-read validation evidence + `git status --short` + `docs/TRACE_SPEC.md` trace block. |

## Token Budget Guidance

| Read shape | Target harness context |
|---|---|
| Tiny | ~2K tokens — `STAGE.md`, the WORKFLOW step row, the exact file changed. |
| Normal | ~5K tokens — the step's block table above + touched requirements/scope docs + `TEST_MATRIX` + trace at the end. |
| High-risk | ~10K tokens — full block table + decisions + architecture + the relevant gate file + trace. |

Budget rules:

- Prefer targeted `rg`/`grep` over bulk file reads.
- Read the smallest section that answers the current step's question.
- When `context-monitor.sh` warns at 80%, stop reading `Skip`-marked sources and produce the artifact.
- Delegate the step to `stage-runner` so heavy reading never lands in the main session.

## Review Checklist

Before producing a step artifact:

- `STAGE.md` Current matches the step you intend to run.
- The step's block reading column has been satisfied.
- Any high-risk trigger has been handled.

Before final response:

- Validation evidence read; the Verify command run if the behavior carries one.
- `docs/TRACE_SPEC.md` consulted for the session trace.
