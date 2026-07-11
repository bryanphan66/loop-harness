# Gate DoR — Definition of Ready (Enter Build)

> **Type:** internal. The entry gate to Macro-Stage 2 (Build & Go-live).
> **Step:** 2.3 (`docs/WORKFLOW.md`). Cannot be reached before **PB-G4** (Full
> lane) / the PB-G3 freeze + recorded 1.14/1.15 N/A-by-decision (Lite lane).

DoR confirms the project is genuinely ready to build — not just signed. Every item
below must hold before the first build phase starts.

## Checklist

- [ ] **PB-G4 cleared** — contract signed + deposit received (`docs/gates/pb-g4-contract-deposit.md`). **Lite lane:** PB-G3 frozen + `1.14/1.15 — N/A by decision` recorded in STAGE.md.
- [ ] Requirements **baselined** — SRS + REQ-IDs frozen at PB-G2; the RTM is backward-complete (Lite: srs-lite table frozen).
- [ ] Scope **signed** — feature-register frozen and client-confirmed (PB-G2; Lite: owner ack recorded).
- [ ] Prototype **frozen** — PB-G3 cleared; the build target matches the frozen visual contract.
- [ ] **ERD FROZEN** (step 2.1, SA) — entities, normalization, audit + tenant fields reviewed; decision recorded by slug.
- [ ] **Design approved** — design tokens + Component Coverage Matrix complete (1.10).
- [ ] **Acceptance criteria** exist per in-scope feature (from the SRS `**shall**` statements).
- [ ] **NFR** captured — `docs/requirements/srs/nfr.md` present (Lite lane: the § NFR one-liners in `docs/requirements/srs-lite.md` suffice); load / DR / compliance toggles decided (in-scope or N/A by decision).
- [ ] Implementation plan exists at `plans/<YYMMDD-HHMM>-<slug>/` (step 2.3).
- [ ] **Build manifest complete** — `docs/build-manifest.md` exists per `docs/templates/build-manifest.md`: **P0 (walking skeleton) defined**, every phase ≤ one agent session (≤~10 files), and the coverage checklist proves **every in-scope REQ-ID appears in exactly one phase**.
- [ ] **Fidelity strategy per screen** — every phase's screens cite their prototype export source + `adopt from export` (default — adopt the export as code) or `rebuild (decision: <slug>)` (no export for the screen) with the decision recorded, AND each UI screen lists its **fidelity contract as executable assertions** (required elements + interactions — `docs/gates/visual-fidelity.md`); any PUB product-shot capture phase sequenced after the APP screen phases it depicts.
- [ ] **Per-phase acceptance ready** (`docs/gates/phase-acceptance.md`) — every phase has runnable acceptance checks covering **functional + negative-path + visual-fidelity** (or `n/a — no screens`) and a `Verify-by` value (`agent` | `both`); the manifest header declares the **human checkpoint cadence** and the **preview command**. A phase whose AC an independent verifier could not execute is not ready.
- [ ] **Phase-types routed** — every phase declares a **`Phase-type`**; every REQ-ID citing an async/media/storage/integration signal sits in a **non-CRUD** phase-type carrying its type-specific acceptance categories (`docs/playbooks/build-manifest-compilation.md` step 4b) — none folded into a CRUD phase. When a non-CRUD phase-type exists, the stack ADR (2.2) surfaced the tier-2 primitives (queue / storage / worker).
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
Build manifest:           docs/build-manifest.md  (coverage checklist green)
```

> A failed line means Build does not start. Do not "start coding to find out" —
> that breaks the PB-G4 no-code-before-contract invariant and the token chain.
