# Gate DoD — Definition of Done (Exit Build)

> **Type:** internal exit gate to Macro-Stage 2, immediately before the client
> **ACCEPTANCE** gate (step 2.12). **Step:** 2.10 (`docs/WORKFLOW.md`).
> This checklist also holds the conditional enterprise gate toggles in one
> place so none is silently dropped.
>
> **Gate rebalance (WORKFLOW § Macro-Stage 2):** during 2.6 every phase runs the
> light floor self-check (`validate:quick` + design-system floor rules + phase
> e2e smoke) **and the per-phase acceptance verification**
> (`docs/gates/phase-acceptance.md`). The heavy gates below — 2.7 review, 2.9
> security, 2.10 QA — run **once when the build-manifest is complete** (plus a
> mid-point 2.7 review when the manifest has >6 phases), as aggregation and
> cross-phase confirmation — not the first place a per-phase defect is caught
> (token-curve rationale → `docs/gates/phase-acceptance.md` § Why this gate exists, SoT).
> This checklist is filled at that completion pass.

DoD confirms the build is provably finished before it is shown to the client for
acceptance. The verify-gate (`scripts/harness-verify-gate.sh`) is the mechanical
half; this checklist is the judgment half.

## Core Checklist

- [ ] **Build manifest exhausted** — every phase in `docs/build-manifest.md` checked done, each closed by a token-citing stage-boundary commit.
- [ ] **Per-phase acceptance record complete** — every phase's `Accepted` cell filled per `docs/gates/phase-acceptance.md`: `agent-pass` on all phases, `human-ok` on every `Verify-by: both` phase, and a TC-NNN acceptance row per phase in the verification register. The record is per-phase evidence — a missing cell is a DoD block, not retroactively fillable. **Non-CRUD phases** additionally recorded their type-specific categories PASS (async idempotency/dead-letter · storage signed-URL/entitlement/cleanup · media multi-bitrate/streaming-NFR · integration webhook-verify/idempotency) at their own phase, not deferred here.
- [ ] **Code review** (6-dim) passed — score ≥7, no dimension = 0 (step 2.7; mid-point review done if manifest >6 phases).
- [ ] **Design-System Compliance** — every grid/form screen classified to one §4 floorplan (`docs/visuals/diagrams/screen-inventory.md`) + `docs/gates/design-system-compliance.md` green per screen; no hardcoded tokens; components reused.
- [ ] **Config-driven business identity** (`docs/playbooks/config-driven-identity.md`) — no brand / company legal entity / tax code / contact / canonical URL / SEO provider / copyright hardcoded in any generated document (cert from admin template, invoice seller block), transactional email, json-ld, or page chrome; the go-live grep sweep is clean and a staging Settings value was flipped and confirmed to reflect. Marketing social-proof numbers are either wired to a real count or kept by recorded owner decision — not silently downgraded.
- [ ] **Go-live deploy verified at source** (`docs/playbooks/go-live-deploy-verify.md`) — the staging/prod box the client will UAT runs THIS build, proven by health `.status==ok` + a content marker for this build (not CI-green / HTTP-200 / a version string); build-time-inlined env (`NEXT_PUBLIC_*`) baked via build ARG on a real rebuild (not a cached redeploy); money/identity/legal secrets carry real deploy-env values with fail-closed proven (no placeholder default that passes the presence check).
- [ ] **Visual Fidelity** — `docs/gates/visual-fidelity.md` filled per key UI screen: each screen's Playwright fidelity assertions green (element completeness + interaction behaviour) AND its human side-by-side glance recorded (built screenshot vs prototype image), every screen `pass` (RED-assertion screens fixed or covered by a recorded rebuild decision); PUB product-shots captured AFTER the APP screens they depict were fidelity-checked.
- [ ] **E2E from BA docs** — every REQ-ID has ≥1 passing E2E test with a **TC-NNN** row (step 2.8), **including the negative-path + auth-to-data-load coverage rules** (`docs/playbooks/canonical-e2e-flow-playbook.md` § Mandatory Coverage Rules).
- [ ] **RTM forward-complete** (`docs/TRACE_SPEC.md`): every REQ-ID → ≥1 TC-NNN with `Result: pass` in the verification register.
- [ ] **Security sign-off** — STRIDE+OWASP, **red-team required**; 0 Critical/High open (step 2.9).
- [ ] **QA evidence** — real-browser QA with video; human approval recorded (step 2.10). *Lite/internal:* [ ] cleared · [ ] N/A by decision — `<reason> (<date>)` (scripted real-browser evidence — Playwright traces/screenshots + register rows — substitutes for video + human approval).
- [ ] **User manual** — field-by-field + video produced. *Lite/internal:* video portion [ ] cleared · [ ] N/A by decision — `<reason> (<date>)`; the written field-by-field manual is NOT waivable.
- [ ] **Boot smoke green** — `validate:quick` boots the real AppModule (`Test.createTestingModule({imports:[AppModule]}).compile()` or a `--dry-run` bootstrap), so a DI/wiring or fail-closed-config error fails the gate, not the deploy; every optional-collaborator constructor param carries `@Optional()`. Confirmed at source after deploy: `curl API/health` == `{status:ok}`.
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
Visual Fidelity:                   docs/gates/visual-fidelity.md   all key screens pass vs prototype export: YES
Security sign-off:                 <report path>   0 Critical/High: YES
Verification register:             docs/TEST_MATRIX.md  (all pass / reasons recorded)
Conditional toggles:               all rows above checked or N/A-by-decision
```

> Only after DoD is filled does the client **ACCEPTANCE** gate (2.12, UAT +
> sign-off) run — its clearing conditions live in the WORKFLOW Canonical Gate
> List and the 2.12 goal block; the HANDOVER gate's in 3.1.
