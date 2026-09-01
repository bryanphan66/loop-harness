# Gate PB-G1 — Intake Go/No-Go

> **Type:** internal capture — **does NOT page the client.** PB-G1 is a recorded
> go/no-go decision, not a client-paging checkpoint (D2). Clears step 1.2.
> **Step:** 1.2 (`docs/process/WORKFLOW.md`). **Output:** `docs/intake/{date}-intake-brief.md`.

This gate decides whether to take the engagement at all. It is captured for the
audit trail; it never blocks on offline client action.

## Checklist

- [ ] Every raw input from step 1.1 is filed under `docs/discovery/` (append-only) and listed in the intake brief's Source Map.
- [ ] The intake brief fills every section of `docs/mau-tai-lieu/client-intake-brief.md` (VN client → `locale-vi/` fork).
- [ ] The client's core business problem is stated in one paragraph (becomes the head of the token chain — `docs/process/TRACE_SPEC.md`).
- [ ] Rough scope, budget band, and timeline expectation are captured (even if approximate).
- [ ] Red flags / risks are listed (unclear scope, no budget, hostile timeline, tech mismatch).
- [ ] **Conditional probe — compliance / data-residency / DPA:** asked and recorded, or `N/A by decision — <reason> (<date>)`.
- [ ] **Conditional probe — brownfield (replacing a legacy system → migration?):** asked and recorded, or `N/A by decision — <reason> (<date>)`.
- [ ] A decision is recorded: **proceed** / **park** / **decline** (+ one-line rationale).
- [ ] If `proceed`: `STAGE.md` Snapshot advanced to Current = 1.3.
- [ ] If `park` / `decline`: rationale recorded; no further Pre-Build steps run.

## Sign-Off

```text
PB-G1 decision: proceed | park | decline
Decided by:     <name / role>
Date:           YYYY-MM-DD
Rationale:      <one line>
Intake brief:   docs/intake/<date>-intake-brief.md
```

> PB-G1 is **internal** — no `MANUAL_CHECKPOINT` is emitted, no client signature
> is required. The next client-paging gate is **PB-G2** (scope frozen).
