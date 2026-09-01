<!--
TEMPLATE: Proposal & Statement of Work (SOW)
Used by: WORKFLOW step 1.14 (Bao-gia + SOW) → 1.15 contract+deposit · Gate PB-G4 (CLIENT, hardest)
Role: PM (Delivery Lead) · Engine: project-manager
Output path: docs/bao-gia/*.md (EN SOW pairs with the VN bao-gia set)
Bilingual: client-facing → fork to docs/templates/locale-vi/proposal-sow.md (D4); the VN bao-gia/ is the primary commercial surface
Token grammar (D3): every § 4 SOW line ↔ exactly 1 feature-register line ↔ ≥1 REQ-ID (MODULE.AREA.NN). PROTOTYPE-THEN-QUOTE: PB-G3 frozen before this.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths EN even in the VN fork.
-->

# Proposal & Statement of Work — <project name>

Date: YYYY-MM-DD · Validity: <NN> days · Version: v0.1

> Client-facing SOW. Priced from the **frozen feature-register** (1.9) and the
> **frozen prototype** (PB-G3) — the PROTOTYPE-THEN-QUOTE invariant: never price
> before the visual contract is frozen. Signing + deposit is **PB-G4**, the hard
> "no build code before this" line.
>
> Every § 4 in-scope line maps to exactly **one feature-register line**, which in
> turn traces to **≥1 REQ-ID** (`MODULE.AREA.NN`). Read alongside the VN
> `docs/bao-gia/` set and `feature-register.md`.

## 1. Client & Vendor

| | |
| --- | --- |
| Client | <client legal name + contact> |
| Vendor | <vendor / solo-dev name + contact> |
| Effective date | YYYY-MM-DD |
| Estimated start | YYYY-MM-DD (after PB-G4) |
| Estimated delivery | YYYY-MM-DD |

## 2. Project Summary

One paragraph: what we are building, for whom, and why. Link the frozen
prototype URL (PB-G3).

## 3. Goals & Success Criteria

- Business goal 1.
- Business goal 2.

Success metric (how the client judges "done worked"):

- <metric>

## 4. Scope — In

Every line maps to one feature-register line + ≥1 REQ-ID. Group by module/phase
if more than ~8 items.

| Line | Deliverable | Feature-register ref | REQ-ID(s) |
| --- | --- | --- | --- |
| S1 | <feature> | feature-register #NN | `ORD.STATUS.01` |
| S2 | <feature> | feature-register #NN | `ORD.NOTIF.01`, `ORD.NOTIF.02` |

## 5. Scope — Out (Explicitly Excluded)

Listing exclusions up-front prevents disputes. Any request for these routes via
the Change Request process (§ 9 → `change-request-log.md`).

- <excluded item>
- <excluded item>

## 6. Deliverables

| # | Deliverable | Format | When |
| --- | --- | --- | --- |
| D1 | Source code repo access | Git invite | At kickoff |
| D2 | Staging URL | Hosted link | Milestone M2 |
| D3 | Production deployment | Hosted link | Milestone M4 |
| D4 | Handover package | `docs/handover/*` | Milestone M5 |
| D5 | Admin credentials (rotated at handover) | Vault reference | Milestone M5 |

## 7. Milestones & Timeline

Source of truth for committed dates; `ROADMAP.md` mirrors these.

| M# | Name | Output | Target date | Payment trigger |
| --- | --- | --- | --- | --- |
| M0 | Kickoff (PB-G4) | Signed contract + deposit | <date> | 30% deposit |
| M1 | Build start (DoR) | ERD frozen + stack chosen + plan | <date> | — |
| M2 | Staging build | Core features on staging | <date> | 30% progress |
| M3 | UAT | ACCEPTANCE sign-off | <date> | — |
| M4 | Production | Production deploy + release-note | <date> | 30% release |
| M5 | Handover | HANDOVER package complete | <date> | 10% retention |

Adjust the split per project size. Retention protects the client during early
production usage and forces a clean handover.

## 8. Payment Terms

| Stage | Amount | Trigger |
| --- | --- | --- |
| Deposit | NN% | Contract signed (PB-G4) |
| Progress | NN% | M2 staging accepted |
| Release | NN% | M4 production deployed |
| Retention | NN% | M5 handover complete |

- Currency: <e.g. VND, USD>
- Invoice cycle: <upon trigger / monthly>
- Late-payment grace: <N> days. After grace, work pauses until cleared.
- Payment instrument: <bank transfer / SePay / Stripe>

## 9. Change Request Policy

Any request outside § 4 enters `change-request-log.md` (mints **CR-NN**):

1. Vendor classifies (bug / change / new-feature / UX / clarification).
2. If in original scope → handled at no extra cost.
3. If out of scope → effort estimate + price within <N> business days.
4. Client approves (or defers to a phase-2 SOW) **before** work starts.
5. No verbal changes — every CR enters the log.

## 10. Acceptance Conditions

The client accepts at the **ACCEPTANCE** gate (Build 2.12) when:

- § 6 deliverables for the milestone exist and are accessible.
- Critical-journey UAT cases pass (every released REQ-ID → ≥1 passing TC-NNN).
- The build matches the frozen prototype (PB-G3).
- Open bugs are logged + severity-assigned; S1 blockers fixed before sign-off.
- Sign-off recorded (`docs/uat/*`, VN fork).

Client has <N> business days from delivery notification to accept or report
issues. Silence past the window = deemed accepted.

## 11. Risks & Assumptions

| Type | Item | Mitigation |
| --- | --- | --- |
| Assumption | Client provides content/copy by M1 | Vendor uses placeholder; client accepts placeholder at staging |
| Assumption | Client provides domain + DNS by M3 | Deliver to vendor subdomain until access arrives |
| Risk | Third-party API rate limits / downtime | Retry + fallback; SLA excludes third-party outage |
| Risk | Scope creep > 10% of estimate | Each CR re-estimated; cumulative > 10% triggers phase-2 conversation |

## 12. Client Responsibilities

- Provide a single decision-maker (or named escalation chain).
- Provide brand assets (logo, fonts, colors) by M1.
- Provide content/copy by M1 (or accept placeholder).
- Respond to questions within <N> business days. Delays shift the timeline 1:1.
- Provide third-party credentials (domain, email, payment) per the handover.

## 13. Warranty & Post-Delivery Support

- Bug warranty: <N> days from M4. Bugs reproducible on production within the
  original scope are fixed at no extra cost.
- Out of warranty: change requests (§ 9), feature additions, client-caused bugs.
- Optional ongoing support: `maintenance-proposal.md`.

## 14. Intellectual Property

- On final payment: <vendor transfers all source + assets / vendor retains
  reusable-component rights, client gets perpetual license>.
- Portfolio showcase: <anonymized / with client approval — choose one>.
- Third-party libraries retain their original licenses.

## 15. Termination

Either party may terminate with <N> days notice. On termination:

- Vendor delivers all work-in-progress as-is.
- Client pays for work completed through the termination date (pro-rated by milestone).
- IP transfer applies to delivered work only.

## 16. Sign-Off (PB-G4)

| Party | Name | Title | Signature | Date |
| --- | --- | --- | --- | --- |
| Client | | | | |
| Vendor | | | | |

---

**Pointers**

- Frozen scope source: `docs/scope-baseline/feature-register.md` (1.9, PB-G2).
- VN commercial set: `docs/bao-gia/` (quote + warranty + technical overview + contract).
- Change requests: `docs/templates/change-request-log.md`.
- Maintenance after delivery: `docs/templates/maintenance-proposal.md`.
- Token chain: `docs/process/TRACE_SPEC.md`.
- Localization: forks to `docs/templates/locale-vi/proposal-sow.md` (D4).
