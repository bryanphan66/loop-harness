<!--
TEMPLATE: Spec Intake (internal technical intake)
Used by: WORKFLOW Build & Go-live entry (post PB-G4) — derives product/architecture questions from the signed BA spine. Also used when a raw user-provided spec is the input.
Role: BA + Tech Lead · Engine: ck-xre · researcher
Output path: docs/intake/YYYY-MM-DD-<slug>-spec-intake.md
Bilingual: INTERNAL — English only (no locale-vi fork) per D4.
Token grammar (D3): references REQ-ID (MODULE.AREA.NN) from the SRS; surfaces stack/data questions that feed the ERD-freeze (2.1) + stack-selection (2.2) decisions.
Shape-only scaffold. Replace <placeholders>.
-->

# Spec Intake — <project / slice name>

Date: YYYY-MM-DD

> Internal technical intake. Turns the signed BA spine (SRS + REQ-IDs + RTM) into
> the architecture + product questions that feed **ERD-freeze** (2.1) and
> **stack-selection** (2.2). Also the entry point when a raw user-provided spec
> is the starting material. English-only (D4).

## Source

- BA spine ref: `docs/requirements/srs/<module>.md` (REQ-IDs in scope)
- Signed scope: `docs/scope-baseline/feature-register.md` (frozen at PB-G2)
- User-provided spec / attachment: <path or "none">
- External reference: <link or "none">

## Project Summary

What product are we building, for whom, and why? One paragraph.

## REQ-IDs In This Slice

| REQ-ID | One-line | Module | Source GAP |
| --- | --- | --- | --- |
| `IF.AUTH.01` | <one-line> | infrastructure | GAP-001 |

## Architecture Questions

These answers become `docs/decisions/<slug>.md` records at 2.1 / 2.2.

- Runtime / language + version:
- Product surfaces (web / mobile / API / admin):
- Storage (primary DB + cache + object store):
- External providers (auth / payment / AI / email / storage / observability):
- Deployment target:
- Security model + authz strategy:

## Data Inventory (PII)

What personal data does this collect, on what lawful basis, kept how long?
Required when the product touches accounts, payments, or any identifiable
individual. If clearly zero PII, write `none — public/anonymous content only`.

| Field | Lawful basis | Retention | Deletion on request |
| --- | --- | --- | --- |
| `<e.g. email>` | `<contract / consent / legitimate interest>` | `<duration>` | `<yes / no — reason>` |
| `<e.g. payment last4>` | contract | 7 years (tax) | no (legal hold) |

Jurisdictions to consider: project country (e.g. VN → Nghị định 13/2023/NĐ-CP),
client country, end-user country (EU → GDPR).

## Conditional Enterprise Triggers

Carry forward from the intake brief § 8. Mark **N/A by decision** when not
applicable — these set up the conditional gates in Build & Go-live.

| Trigger | Applies? | Gate it drives |
| --- | --- | --- |
| Data migration / cutover (brownfield) | yes / N/A-by-decision | 2.1b |
| NFR / load test | yes / N/A-by-decision | 2.11 |
| DR + RTO/RPO restore-drill | yes / N/A-by-decision | 2.11 |
| Compliance / privacy / WCAG | yes / N/A-by-decision | conditional |
| Observability / SLO | yes (usually always-on) | 2.4 |

## Validation Shape

What proof will this eventually need? Each REQ-ID → ≥1 TC-NNN before ACCEPTANCE.

| Layer | Expected proof |
| --- | --- |
| Unit | |
| Integration | |
| E2E (TC-NNN) | |
| Platform | |
| Release | |

## Open Decisions

- Item → will land in `docs/decisions/<slug>.md`.

## First Story Candidates

FLAT `<module>-NN-<slug>.md` under `docs/stories/`.

- `auth-01-email-google-signin`
- `order-02-status-view`

## Harness Delta

What harness changes were made or should be proposed because of this spec?

---

**Pointers**

- BA spine: `docs/requirements/`.
- ERD-freeze decision: `docs/decisions/<slug>.md` (2.1, SA-owned).
- Stack-selection decision: `docs/decisions/<slug>.md` (2.2, Tech-Lead-owned).
- Token chain: `docs/process/TRACE_SPEC.md`.
