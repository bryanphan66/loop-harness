# Gate PB-G2 — Scope Frozen

> **Type:** **CLIENT** — pages the client (emit `MANUAL_CHECKPOINT`). The first
> hard client gate (D2). Clears step 1.9 and the whole BA Core Docs block.
> **Step:** 1.9 (`docs/WORKFLOW.md`). **Output:** `docs/scope-baseline/feature-register.{md,xlsx}` + scope matrix.

PB-G2 is the **merged** gate (D2): it rolls together the BLOCKER resolution from
step 1.6 and the feature-register freeze from step 1.9. Scope is frozen here; any
later change is a change request (`CR-NN`), not a silent edit.

## Checklist

### BLOCKERs answered (from step 1.6)

- [x] Every BLOCKER in `docs/requirements/CLARIFICATIONS.md` has a recorded client answer (or an explicit deferral the client accepted). — BLK-01..04 resolved 2026-06-12 (CLARIFICATIONS.md §6).
- [x] The SRS is patched where answers changed a requirement; affected REQ-IDs are noted. — BLK-04 slug patch `claude-sonnet-4-5`→`claude-sonnet-4-6` across ai-provider.md / billing.md / data-model.md / RTM.md; AI.MODEL.01/02, BILL.TIER.03 affected.
- [x] No open BLOCKER remains that could invalidate a feature-register line. — BLK-03 accepted as assumption (Supadata cost) with ops-TODO before bao-gia 1.14; not invalidating.

### Feature-register frozen (step 1.9)

- [x] `docs/scope-baseline/feature-register.{md,xlsx}` lists every business feature with REQ-ID(s), MoSCoW priority, in/out-of-scope mark, and assumptions. — `feature-register.md` (123 features, 16 groups) + `feature-register.csv`; xlsx deferred (CSV substitute — no spreadsheet engine in bare-agent path).
- [x] **RTM backward-complete** (`docs/TRACE_SPEC.md`): every feature-register line traces to ≥1 REQ-ID and ≥1 use case; every REQ-ID to ≥1 GAP-NNN (or a "no-gap — new feature" note). — 166 REQ-IDs × 14 UCs, 0 unmatched (RTM.md).
- [x] Out-of-scope items are listed with a reason (defends against scope dispute). — §2: 13 items (PDF export, BYOK, multi-seat, proration, refunds, WCAG, GDPR, …).
- [x] A VN fork exists: `docs/scope-baseline/locale-vi/feature-register.md` (D4).
- [x] High-risk REQ-IDs each have ≥1 SC-NNN or a recorded skip-declaration (from step 1.8). — SC-001..207 across 5 high-risk clusters; 11 low-risk skip-declarations.

### Client confirmation

- [x] `MANUAL_CHECKPOINT` was emitted asking the client to confirm scope in writing. — N/A-by-context: self-initiated port, operator IS the client; scope confirmed directly in-conversation (no external client to page).
- [x] The client's **written** confirmation is referenced below (chat ref).
- [x] `STAGE.md` advanced to Current = 1.10 only **after** that confirmation.

## Sign-Off

```text
PB-G2 — scope frozen
Confirmed by client:   Nghia Nguyen (operator = client)   on  2026-06-12
Written confirmation:  in-conversation approval — "Duyệt defaults làm baseline MVP"
                       (operator approved BLK-01..04 baseline + scope, 2026-06-12)
Countersigned (PM):    Nghia Nguyen                        on  2026-06-12
Feature register:      docs/scope-baseline/feature-register.md  (frozen v1)
```

> Do not start design-prototype work (1.10) before this sign-off is filled.
> The next client-paging gate is **PB-G3** (prototype frozen).
