# Gate DoD — Definition of Done (Exit Build)

> **Type:** internal exit gate to Macro-Stage 2, immediately before the client
> **ACCEPTANCE** gate (step 2.12). **Step:** 2.10 (`docs/WORKFLOW.md`).
> This checklist also holds the conditional enterprise gate toggles in one
> place so none is silently dropped.
>
> **Gate rebalance (WORKFLOW § Macro-Stage 2):** during 2.6 every phase runs the
> light floor self-check (`validate:quick` + design-system floor rules + phase
> e2e smoke). The heavy gates below — 2.7 review, 2.9 security, 2.10 QA — run
> **once when the build-manifest is complete** (plus a mid-point 2.7 review when
> the manifest has >6 phases). This checklist is filled at that completion pass.

DoD confirms the build is provably finished before it is shown to the client for
acceptance. The verify-gate (`scripts/harness-verify-gate.sh`) is the mechanical
half; this checklist is the judgment half.

## Core Checklist

- [ ] **Build manifest exhausted** — every phase in `docs/build/build-manifest.md` checked done, each closed by a token-citing stage-boundary commit.
- [ ] **Code review** (6-dim) passed — score ≥7, no dimension = 0 (step 2.7; mid-point review done if manifest >6 phases).
- [ ] **Design-System Compliance** — every grid/form screen classified to one §4 floorplan (`docs/visuals/diagrams/screen-inventory.md`) + `docs/gates/design-system-compliance.md` green per screen; no hardcoded tokens; components reused.
- [ ] **E2E from BA docs** — every REQ-ID has ≥1 passing E2E test with a **TC-NNN** row (step 2.8).
- [ ] **RTM forward-complete** (`docs/TRACE_SPEC.md`): every REQ-ID → ≥1 TC-NNN with `Result: pass` in the verification register.
- [ ] **Security sign-off** — STRIDE+OWASP, **red-team required**; 0 Critical/High open (step 2.9).
- [ ] **QA evidence** — real-browser QA with video; human approval recorded (step 2.10).
- [ ] **User manual** — field-by-field + video produced.
- [ ] **Verification register green** — no `Result: fail`, no `never-run` on the stage-close commit.

## Conditional Enterprise Gate Toggles

Each row is **either** cleared **or** marked **N/A by decision — `<reason> (<date>)`**.
Per D2, none may be silently dropped.

| Conditional gate | Step | Status (check one) |
|---|---|---|
| Data-migration / cutover (ETL + dry-run + rollback-of-data + RTO/RPO) | 2.1b | [ ] cleared  ·  [ ] N/A by decision — `<reason> (<date>)` |
| NFR / load test (k6 p95 + Lighthouse) | 2.11 | [ ] cleared  ·  [ ] N/A by decision — `<reason> (<date>)` |
| DR + RTO/RPO restore-drill (separate from rollback) | 2.11 | [ ] cleared  ·  [ ] N/A by decision — `<reason> (<date>)` |
| Compliance / Privacy / WCAG | cross | [ ] cleared  ·  [ ] N/A by decision — `<reason> (<date>)` |
| Observability / SLO + alerting + error-budget live | 2.4 | [ ] cleared  ·  [ ] N/A by decision — `<reason> (<date>)` |

> Observability/SLO is **usually always-on** — marking it N/A should be rare and
> well-justified. The other four are commonly N/A for small greenfield builds; the
> point of the toggle is that the decision is **recorded**, not assumed.

## Sign-Off

```text
DoD — build done, ready for client ACCEPTANCE
Confirmed by (Tech Lead reviewer): <name>   on  YYYY-MM-DD
Confirmed by (QC/QA):              <name>   on  YYYY-MM-DD
Design-System Compliance:          docs/gates/design-system-compliance.md   all grid/form screens classified + green: YES
Security sign-off:                 <report path>   0 Critical/High: YES
Verification register:             docs/TEST_MATRIX.md  (all pass / reasons recorded)
Conditional toggles:               all rows above checked or N/A-by-decision
```

> Only after DoD is filled does the client **ACCEPTANCE** gate (2.12, UAT +
> sign-off) run — its clearing conditions live in the WORKFLOW Canonical Gate
> List and the 2.12 goal block; the HANDOVER gate's in 3.1.
