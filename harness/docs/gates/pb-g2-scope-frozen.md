# Gate PB-G2 — Scope Frozen

> **Type:** **CLIENT** — pages the client (emit `MANUAL_CHECKPOINT`). The first
> hard client gate (D2). Clears step 1.9 and the whole BA Core Docs block.
> **Step:** 1.9 (`docs/WORKFLOW.md`). **Output:** `docs/scope-baseline/feature-register.{md,xlsx}` + scope matrix.

PB-G2 is the **merged** gate (D2): it rolls together the BLOCKER resolution from
step 1.6 and the feature-register freeze from step 1.9. Scope is frozen here; any
later change is a change request (`CR-NN`), not a silent edit.

> Blank template. Fill per project; do NOT commit a specific project's answers
> into this harness file (they belong in the project repo's own gate record).

## Checklist

### BLOCKERs answered (from step 1.6)

- [ ] Every BLOCKER in `docs/requirements/CLARIFICATIONS.md` has a recorded client answer (or an explicit deferral the client accepted).
- [ ] The SRS is patched where answers changed a requirement; affected REQ-IDs are noted.
- [ ] No open BLOCKER remains that could invalidate a feature-register line.

### Feature-register frozen (step 1.9)

- [ ] `docs/scope-baseline/feature-register.{md,xlsx}` lists every business feature with REQ-ID(s), MoSCoW priority, in/out-of-scope mark, and assumptions.
- [ ] **RTM backward-complete** (`docs/TRACE_SPEC.md`): every feature-register line traces to ≥1 REQ-ID and ≥1 use case; every REQ-ID to ≥1 GAP-NNN (or a "no-gap — new feature" note).
- [ ] Out-of-scope items are listed with a reason (defends against scope dispute).
- [ ] A VN fork exists: `docs/scope-baseline/locale-vi/feature-register.md` (D4).
- [ ] High-risk REQ-IDs each have ≥1 SC-NNN or a recorded skip-declaration (from step 1.8).

### Client confirmation

- [ ] `MANUAL_CHECKPOINT` was emitted asking the client to confirm scope in writing.
- [ ] The client's **written** confirmation is referenced below (chat ref).
- [ ] `STAGE.md` advanced to Current = 1.10 only **after** that confirmation.

## Sign-Off

```text
PB-G2 — scope frozen
Confirmed by client:   <name>                on  <YYYY-MM-DD>
Written confirmation:  <ref / quote>
Countersigned (PM):    <name>                on  <YYYY-MM-DD>
Feature register:      docs/scope-baseline/feature-register.md  (frozen v1)
```

> Do not start design-prototype work (1.10) before this sign-off is filled.
> The next client-paging gate is **PB-G3** (prototype frozen).
