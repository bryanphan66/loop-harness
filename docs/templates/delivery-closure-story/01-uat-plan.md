<!--
Template: delivery-closure-story/01-uat-plan.md
Macro-stage: 2 Build & Go-live · Step 2.12 UAT / client acceptance
Role: BA + Client · Engine: ck-uat · Gate: ACCEPTANCE (client, countersigned)
Bilingual: EN canonical base — VN fork at locale-vi/delivery-closure-story/01-uat-plan.md
Tokens: REQ-ID MODULE.AREA.NN · SC-NNN · TC-NNN (docs/TRACE_SPEC.md)
-->

# UAT Plan — <release / module id>

## Scope

REQ-IDs covered: `AUTH.LOGIN.01`, `AUTH.LOGIN.02`, ...
SC scenarios covered: `SC-001`, `SC-002`, ...

REQ-IDs explicitly NOT covered this pass: list with reason
(e.g. "deferred to release N+1, see `02-signoff.md` § Exclusions").

## Journey

Numbered end-to-end user journey through the surface being accepted, so
each test case can cite step numbers. Mirror the frozen prototype flow.

1. Actor logs in as <role>.
2. Actor navigates to <screen>.
3. Actor performs <action>.
4. Actor verifies <expected result>.
5. ...

## Test Cases

| TC ID | Path | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| `TC-001` | Happy (covers `AUTH.LOGIN.01`) | 1-5 | <expected> | pass |
| `TC-002` | Edge — empty input (covers `SC-001`) | 1-3 | reject with 400 | pass |
| `TC-003` | Edge — unauthorized actor (covers `SC-003`) | 1-2 | reject with 403 | fail |

Each test cites its `SC-NNN` (and the REQ-ID it proves) in the Path
column. Failures must link to a follow-up row in `overview.md`
§ Open Follow-Ups. Every `TC-NNN` here mirrors a row in
`docs/TEST_MATRIX.md` § Verification Register.

## Cap

Recommended ≤ 40 test cases per UAT pass. If more is needed, split into
multiple passes (one per epic / phase) rather than ballooning the table.

## Environment

| Item | Value |
| --- | --- |
| Build / commit | <git sha or release tag> |
| Environment | staging / pre-prod / prod-like (NOT raw prod with real data) |
| Test data source | <fixture set, masked prod dump, fresh `ck-seed` run> |
| Observers | <names / roles witnessing the pass> |
