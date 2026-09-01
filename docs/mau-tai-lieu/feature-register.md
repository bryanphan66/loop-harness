<!--
TEMPLATE: Feature Register (scope baseline)
Used by: WORKFLOW step 1.9 (Feature register + scope baseline) · Gate PB-G2 (CLIENT — scope frozen)
Role: BA + PM · Engine: ck-scope-package (feature register + scope baseline; the 1.12 prototype is built in an external design tool, not here)
Output path: docs/scope-baseline/feature-register.{md,xlsx} (the .md is the companion to the .xlsx)
Bilingual: client-facing → fork to docs/mau-tai-lieu/locale-vi/feature-register.md (D4); VN fork is the primary review surface
Token grammar (D3): each line carries a REQ-ID (MODULE.AREA.NN) + the GAP-NNN it answers + the use-case it realises. Frozen at PB-G2 = RTM backward-complete. Do NOT use US-NNN.REQ-MMM.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths EN even in the VN fork.
-->

# Feature Register — <project name>

Status: draft | reviewed-by-client | frozen · Last updated: YYYY-MM-DD

> The scope baseline. Companion to `feature-register.xlsx` (the client reviews
> the xlsx; this .md is the durable, diff-able source). **Frozen at PB-G2** —
> after which scope changes route through `change-request-log.md` (CR-NN) only.
>
> Every line carries a **REQ-ID** (`MODULE.AREA.NN`), the **GAP-NNN** it answers
> (or "no-gap — new feature"), and the **use-case** that realises it. Freezing
> this makes the RTM **backward-complete** (`docs/about/TRACE_SPEC.md` § RTM Rule).

## How To Review

1. Read each row. Confirm the scope group, module, and feature description.
2. Choose a disposition per row (§ Disposition values).
3. Answer every `needs-consult` question before freezing.
4. On agreement → set Status to `frozen`, sign § Sign-Off → **PB-G2** clears.

## Disposition Values

| Disposition | Meaning | Lands in |
| --- | --- | --- |
| `in-MVP` | Confirmed in the first delivery scope | SOW § 4 / bao-gia phase 1 |
| `defer` | Agreed valuable, scheduled to a later phase | ROADMAP later milestone / phase-2 |
| `needs-consult` | Open question blocks a decision | CLARIFICATIONS (BLOCKER) — resolve before PB-G2 |
| `out` | Explicitly excluded | SOW § 5 (scope-out) |

## Scope Groups

Used in the `Scope group` column to bucket lines for client readability.

- **Business feature** — a user-facing capability that delivers business value.
- **Security & permission** — authz, RBAC, audit, consent.
- **Non-functional** — performance, availability, accessibility (carries an NFR REQ-ID).
- **Support & acceptance** — seed data, migration, UAT-enabling, handover items.

## Feature Register

| # | Scope group | Module / Use-case | Feature (one line) | Disposition | REQ-ID | GAP ref |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Business feature | Auth (UC-01) | User signs in with email + Google OAuth | `in-MVP` | `IF.AUTH.01` | GAP-001 |
| 2 | Security & permission | RBAC (UC-02) | Admin assigns roles; staff scoped to own unit | `in-MVP` | `IF.RBAC.01` | GAP-040 |
| 3 | Business feature | Order status (UC-05) | Customer views live order status | `in-MVP` | `ORD.STATUS.01` | GAP-001 |
| 4 | Business feature | Order status (UC-05) | Staff updates order status from dashboard | `in-MVP` | `ORD.STATUS.02` | GAP-001 |
| 5 | Business feature | Inventory sync (UC-09) | Read-only inventory view (write deferred) | `defer` | `INV.SYNC.01` | GAP-020 |
| 6 | Non-functional | NFR (UC-NFR) | Order-status page p95 < 1.5s under 200 RPS | `needs-consult` | `IF.PERF.01` | GAP-001 |
| 7 | Support & acceptance | Migration (UC-MIG) | Migrate Excel order log → new schema | `needs-consult` | `INV.MIG.01` | GAP-020 |

> Counter rule (D3): `#` is the register line number. `REQ-ID` uses the
> `MODULE.AREA.NN` composite (local counter per `MODULE.AREA`). `GAP-NNN` uses a
> global counter. Multiple register lines may share one use-case.

## Open Questions (needs-consult)

Every `needs-consult` row needs a resolved answer before PB-G2. These become
CLARIFICATIONS BLOCKERs (1.6).

| # ref | Question | Owner | Blocks freeze? |
| --- | --- | --- | --- |
| 6 | What load target must the status page sustain? | Client | yes |
| 7 | Is the legacy Excel export complete + clean? | Client | yes |

## Scope Matrix (rollup)

A one-glance summary the client signs against.

| Scope group | in-MVP | defer | out | needs-consult |
| --- | --- | --- | --- | --- |
| Business feature | <N> | <N> | <N> | <N> |
| Security & permission | <N> | <N> | <N> | <N> |
| Non-functional | <N> | <N> | <N> | <N> |
| Support & acceptance | <N> | <N> | <N> | <N> |
| **Total** | <N> | <N> | <N> | <N> |

## RTM Backward-Completeness Check (before freeze)

- [ ] Every `in-MVP` / `defer` line has a `REQ-ID`.
- [ ] Every REQ-ID traces to ≥1 GAP-NNN (or an explicit "no-gap — new feature").
- [ ] Every line names a use-case (UC-NN) it realises.
- [ ] Zero `needs-consult` rows remain open.
- [ ] Scope matrix totals reconcile with the register line count.

## Change Log

Append-only after the first client review. Post-freeze changes need a CR-NN.

| Date | Change | Reason | CR ID |
| --- | --- | --- | --- |
| YYYY-MM-DD | Moved line #5 to `defer` | Budget for phase 1 | — (pre-freeze) |

## Sign-Off (PB-G2 — scope frozen)

| Stage | Date | Approver |
| --- | --- | --- |
| Vendor draft complete | YYYY-MM-DD | <vendor> |
| Client review | YYYY-MM-DD | <client name> |
| **Frozen (PB-G2)** | YYYY-MM-DD | <vendor + client> |

---

**Pointers**

- Upstream: gap analysis `docs/requirements/gap-analysis.md` (GAP-NNN), SRS
  `docs/requirements/srs/<module>.md` (REQ-ID), use-cases, scenarios (SC-NNN).
- RTM: `docs/requirements/traceability/RTM.md`.
- Forward: SOW § 4 (`proposal-sow.md`) + VN `docs/bao-gia/` — every line priced.
- Token chain + RTM rule: `docs/about/TRACE_SPEC.md`.
- Localization: forks to `docs/mau-tai-lieu/locale-vi/feature-register.md` (D4).
