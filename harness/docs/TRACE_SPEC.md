# Trace Specification

The **token grammar** that ties a business problem to the code that satisfies it
and the test that proves it. This is the **canonical scheme (D3) — the ONLY
scheme**. Do **not** use `US-NNN.REQ-MMM` anywhere.

Referenced by the verify-gate (`scripts/harness-verify-gate.sh`) and by the BA
playbooks (gap-analysis, scenario-taxonomy). The RTM completeness rule below is
the mechanical "is the chain unbroken?" check.

## Token Types

| Token | Form | Minted at | Cited in | Owner role |
|---|---|---|---|---|
| **GAP-NNN** | `GAP-001` | gap analysis (1.4) | SRS req rationale, feature-register | BA |
| **REQ-ID** | `MODULE.AREA.NN` (e.g. `IF.AUTH.01`) | SRS IEEE-830 (1.5) | use-cases, RTM, feature-register, SOW line, TC rows, release-note, handover | BA |
| **SC-NNN** | `SC-001` | scenario decomposition (1.8) | scenario files, RTM, TC rows | BA |
| **TC-NNN** | `TC-001` | E2E / QA (2.8) | test file names, verification register, UAT plan | QC/QA |
| **CR-NN** | `CR-01` | change-request (3.5) | change-request log; mints new REQ-IDs when approved | BA + PM |

**REQ-ID grammar** — `MODULE.AREA.NN`:
- `MODULE` = SRS module abbreviation, e.g. `IF` (infrastructure), `AUTH`,
  `CRS` (course), `PAY` (payment).
- `AREA` = sub-area within the module, e.g. `AUTH`, `LOGIN`, `RBAC`.
- `NN` = 2-digit local counter within `MODULE.AREA`.
- Examples: `IF.AUTH.01`, `PAY.WEBHOOK.03`, `CRS.LESSON.07`.

> All other tokens use a **global** zero-padded counter within the project
> (`GAP-001`, `SC-001`, `TC-001`, `CR-01`). REQ-ID is the only composite form,
> and its counter is **local** to `MODULE.AREA` so modules renumber
> independently.

## The Full Chain

```text
business problem            (1.2 intake brief)
    ↓ analysed by gap analysis
GAP-NNN                     (1.4  docs/requirements/gap-analysis.md)
    ↓ becomes a requirement
REQ-ID = MODULE.AREA.NN     (1.5  docs/requirements/srs/<module>.md)
    ↓ realised + traced
use case + RTM row          (1.7  use-cases/USE_CASES.md + traceability/RTM.md)
    ↓ decomposed (high-risk reqs only)
SC-NNN                      (1.8  docs/requirements/scenarios/*.md)
    ↓ confirmed in scope
feature-register line       (1.9  docs/scope-baseline/feature-register.{md,xlsx})
    ↓ priced
SOW / bao-gia line          (1.14 docs/bao-gia/*.md)
    ↓ ── PB-G4: contract signed, build begins ──
    ↓ proven
TC-NNN                      (2.8  E2E tests + verification register)
    ↓ validated
UAT (2.12) → release-note (2.13) → handover (3.1)
```

**Change-request branch:** a post-PB-G4 client request mints `CR-NN` (3.5). When
approved it mints **new REQ-IDs** that re-enter the chain at 1.5 (or, mid-build,
at 2.3 / 2.6). The CR-NN log row links to every REQ-ID it spawned.

## RTM Completeness Rule

The Requirements Traceability Matrix (`docs/requirements/traceability/RTM.md`)
is the mechanical proof the chain is unbroken. Completeness means:

1. **Backward (frozen at PB-G2):** every **feature-register line** traces to
   ≥1 REQ-ID and ≥1 use case. Every REQ-ID traces to ≥1 GAP-NNN (or an explicit
   "no-gap — new feature" note).
2. **Forward (frozen at ACCEPTANCE):** every REQ-ID traces to ≥1 TC-NNN, and
   every TC-NNN has a `Result: pass` (or a recorded reason) in the verification
   register before the ACCEPTANCE gate.
3. **High-risk coverage:** every REQ-ID flagged high-risk (1.8) has ≥1 SC-NNN or
   a recorded skip-declaration.

A feature-register line with no REQ-ID, a REQ-ID with no TC-NNN at ACCEPTANCE, or
a high-risk REQ-ID with no SC-NNN and no skip note is an **incomplete RTM** — the
verify-gate blocks the stage-close commit until it is resolved.

## Per-Macro-Stage Application

| Macro-stage | Tokens minted | Tokens cited | Completeness checkpoint |
|---|---|---|---|
| **Pre-Build** | GAP-NNN (1.4), REQ-ID (1.5), SC-NNN (1.8) | GAP→REQ→use-case→RTM→feature-register→SOW | RTM **backward** complete at PB-G2 (scope frozen) |
| **Build & Go-live** | TC-NNN (2.8) | REQ-ID + SC-NNN in tests; REQ-ID in release-note | RTM **forward** complete at ACCEPTANCE (every REQ-ID → passing TC) |
| **Post-Build** | CR-NN (3.5) → new REQ-IDs | REQ-IDs in handover index; CR-NN in change log | every released REQ-ID in handover; every CR-NN resolved (done/deferred/rejected) |

## Trace Block (recorded per task)

Append this where the trace lands (final response for a single task, or the
session-retrospective report for a multi-task session):

```markdown
### Trace — <one-line outcome>

- **Outcome:** completed | partial | blocked | failed
- **Macro-stage / step:** <Pre-Build / 1.5> etc.
- **Tokens:** cites <GAP-NNN / REQ-ID / SC-NNN / TC-NNN / CR-NN or n/a>
- **Files read:** path, path, command …
- **Files changed:** path, path …   (omit only if nothing changed)
- **Decisions:** scope calls, gate results, N/A-by-decision marks, non-goals
- **Verify:** <command run + pass/fail>  or  <why no command exists>
- **Friction:** concrete pain / missing rule / stale doc — or `none` (after checking)
```

`Verify` ties to the verification register the verify-gate reads. `Decisions`
must name any conditional enterprise gate marked **N/A by decision**.

## Where Traces Live

| Situation | Trace lands in |
|---|---|
| Single focused task | Final response message (inline block). |
| Multi-task session (3+ commits, or spanning intake items) | `plans/reports/retro-<date>-<slug>.md` § Trace. |
| Stage-boundary delivery | The `stage-runner` summary carries the trace fields; the commit + `STAGE.md` History row is the durable record. |

## Detailed Trace ≠ Decision Record

The `Decisions` field summarizes what was decided; it does **not** replace a
durable decision record. If the work changed behavior, architecture, authz, data
ownership, API shape, or validation rules, also add `docs/decisions/<slug>.md`
(stable slug, never a number). The trace is evidence; the decision log is the
contract.
