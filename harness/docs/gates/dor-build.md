# Gate DoR — Definition of Ready (Enter Build)

> **Type:** internal. The entry gate to Macro-Stage 2 (Build & Go-live).
> **Step:** 2.3 (`docs/WORKFLOW.md`). Cannot be reached before **PB-G4**.
> *Detailed Build goal text is built in the next macro-stage increment; this gate
> checklist ships now so the Pre-Build → Build boundary is enforceable.*

DoR confirms the project is genuinely ready to build — not just signed. Every item
below must hold before the first build phase starts.

## Checklist

- [ ] **PB-G4 cleared** — contract signed + deposit received (`docs/gates/pb-g4-contract-deposit.md`).
- [ ] Requirements **baselined** — SRS + REQ-IDs frozen at PB-G2; the RTM is backward-complete.
- [ ] Scope **signed** — feature-register frozen and client-confirmed (PB-G2).
- [ ] Prototype **frozen** — PB-G3 cleared; the build target matches the frozen visual contract.
- [ ] **ERD FROZEN** (step 2.1, SA) — entities, normalization, audit + tenant fields reviewed; decision recorded by slug.
- [ ] **Design approved** — design tokens + Component Coverage Matrix complete (1.10).
- [ ] **Acceptance criteria** exist per in-scope feature (from the SRS `**shall**` statements).
- [ ] **NFR** captured — `docs/requirements/srs/nfr.md` present; load / DR / compliance toggles decided (in-scope or N/A by decision).
- [ ] Implementation plan exists at `plans/<YYMMDD-HHMM>-<slug>/` (step 2.3).
- [ ] Stack decision recorded by slug (step 2.2, Tech Lead) — SA's ERD-freeze and Tech Lead's stack are **separate** decisions (D5).
- [ ] STRIDE threat-model done at 2.2 (red-team required).

## Sign-Off

```text
DoR — ready to build
Confirmed by (Tech Lead): <name>   on  YYYY-MM-DD
Confirmed by (PM):        <name>   on  YYYY-MM-DD
ERD freeze decision:      docs/decisions/<slug>.md
Stack decision:           docs/decisions/<slug>.md
Plan:                     plans/<YYMMDD-HHMM>-<slug>/
```

> A failed line means Build does not start. Do not "start coding to find out" —
> that breaks the PB-G4 no-code-before-contract invariant and the token chain.
