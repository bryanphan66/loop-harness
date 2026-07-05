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

## Macro-Stage 2 — BUILD & GO-LIVE

### Design steps (2.1–2.3)

| Source | Tiny | Normal | High-risk |
|---|---|---|---|
| SRS(-lite) `data-model.md` + use-cases + status-flows (at 2.1) | Must | Must | Must |
| `docs/decisions/*` (prior ADRs) | Should | Must | Must |
| `docs/requirements/srs/nfr.md` (at 2.2) | Should | Must | Must |
| `docs/visuals/diagrams/screen-inventory.md` (at 2.3) | Must | Must | Must |
| `docs/gates/dor-build.md` (at 2.3) | Must | Must | Must |
| `docs/templates/build-manifest.md` + `playbooks/build-manifest-compilation.md` (at 2.3) | Must | Must | Must |

### Walking skeleton + seed (2.4–2.5)

| Source | Tiny | Normal | High-risk |
|---|---|---|---|
| Stack-template README + `scaffold.sh` (harness source, per STAGE.md § Harness source) | Must | Must | Must |
| Manifest P0 block | Must | Must | Must |
| Frozen ERD (`docs/system-architecture.md`) + RPM (at 2.5) | Must | Must | Must |
| `playbooks/seed-data-pattern.md` | Skip | Must | Must |

### Phase loop (2.6) — **the ONLY reads per phase**

| Source | Every phase |
|---|---|
| The phase's own block in `docs/build/build-manifest.md` | Must |
| `docs/system-architecture.md` (ERD — the phase's entities) | Must |
| The SRS module file(s) the phase's REQ-IDs live in (or `srs-lite.md`) | Must |
| The screen-inventory rows for the phase's screens | Must |
| Tier-2 tokens + Tier-3 `src/components/README.md` (UI phases) | Must |
| Tier-1 `docs/design-system/design-rules.md` — the assigned floorplan's §§ only | Must (UI) |
| `playbooks/build-execution.md` (first phase; skim after) | Should |
| The whole manifest, whole SRS, prior phases' diffs, gap-analysis, scenarios not cited by the phase | **Skip — by design** |

### Verification + release (2.7–2.13)

| Source | Tiny | Normal | High-risk |
|---|---|---|---|
| `playbooks/code-review-scoring.md` (2.7) · `canonical-e2e-flow-playbook.md` (2.8) · `e2e-qa-field-by-field-verify-with-report.md` (2.10) | Must at their step | Must | Must |
| `docs/decisions/<project>-threat-model.md` (2.9) | Must | Must | Must |
| `docs/TEST_MATRIX.md` (register — every 2.x close) | Must | Must | Must |
| `docs/gates/dod-build.md` (2.10) + conditional toggles | Must | Must | Must |
| Frozen prototype + `docs/uat/` templates (2.12) | Skip | Must | Must |

## Macro-Stage 3 — POST-BUILD

| Source | When |
|---|---|
| `docs/templates/project-closure-story/*` + `docs/runbook/*` | 3.1 handover |
| SLA terms (contract §, Full lane) or owner-declared window | 3.2 hypercare |
| `docs/templates/maintenance-proposal.md` | 3.4 |
| `docs/requirements/change-requests/*` + `docs/build/build-manifest.md` (CR → new phase) | 3.5 any CR-NN |
| `playbooks/session-retrospective.md` + session traces | 3.6 retro |
| `docs/TRACE_SPEC.md` — every released REQ-ID in the handover; every `CR-NN` resolved | 3.1–3.6 |

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
