<!--
Template: delivery-closure-story/02-signoff.md
Macro-stage: 2 Build & Go-live · Step 2.13 Sign-off (nghiệm thu) + release
Role: Release Manager + PM + Client · Engine: ck-signoff
Gate: ACCEPTANCE (client, countersigned) — the billable milestone
Bilingual: EN canonical base — VN fork at locale-vi/delivery-closure-story/02-signoff-nghiem-thu.md
Tokens: REQ-ID MODULE.AREA.NN · SC-NNN · TC-NNN (docs/TRACE_SPEC.md)
-->

# Sign-off — <release / project id>

## Approver — Client Side

- Name: <name>
- Role: <role>
- Date: YYYY-MM-DD
- Signature mechanism: <email approval / e-signature / written reply>

## Approver — Delivery Side

- Name: <name>
- Role: <role>
- Date: YYYY-MM-DD

## REQ Coverage

| REQ-ID | One-line description | Evidence link |
| --- | --- | --- |
| `AUTH.LOGIN.01` | <one-line> | `01-uat-plan.md` → `TC-001` |
| `AUTH.LOGIN.02` | <one-line> | `01-uat-plan.md` → `TC-003` |

Every in-scope REQ-ID must have ≥ 1 evidence link to a passing `TC-NNN`.
Open evidence gaps block ACCEPTANCE.

## Exclusions

REQ-IDs explicitly OUT of this sign-off (deferred to a later release).
Each cites the decision that defers it.

| Excluded REQ-ID | Reason | Deferred to | Decision link |
| --- | --- | --- | --- |
| `RPT.EXPORT.04` | Out of scope this release | <release tag> | `docs/decisions/<slug>.md` |

## Conditions

Conditional acceptance ("accepted pending fix of X by date Y"). Empty
if unconditional. Tracked to closure in `overview.md` § Open Follow-Ups.

| Condition | Owner | Deadline | Tracking link |
| --- | --- | --- | --- |
