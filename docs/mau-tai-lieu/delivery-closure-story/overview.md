<!--
Template: delivery-closure-story/overview.md
Macro-stage: 2 Build & Go-live · Steps 2.12 UAT → 2.13 Sign-off / release
Role: BA + Release Manager + Client · Engine: ck-uat → ck-signoff
Gate: ACCEPTANCE (client, countersigned) — see docs/gates/dod-build.md + WORKFLOW §2
Bilingual: EN canonical base — VN fork at locale-vi/delivery-closure-story/
Tokens: REQ-ID MODULE.AREA.NN · SC-NNN · TC-NNN (docs/process/TRACE_SPEC.md)
-->

# Delivery Closure — <project / release id>

Wrapper for the acceptance packet. The three files below are the proof
that the release behaves and the client accepted it.

## Packet

| File | Purpose | Gate |
| --- | --- | --- |
| `01-uat-plan.md` | UAT journeys + test-case table (≤ 40), each cites a `TC-NNN` ← `SC-NNN` ← REQ-ID | feeds ACCEPTANCE |
| `02-signoff.md` | client + delivery counter-signature, REQ coverage, exclusions, conditions | **ACCEPTANCE** |
| `03-client-update.md` | the message announcing UAT-ready / accepted (no secrets, no PII) | comms |

## Acceptance Summary

- Release / commit: `<git sha or tag>`
- REQ in scope this release: `<n>` · passed: `<n>` · excluded (with decision): `<n>`
- Live product matches frozen stage-1 prototype: yes / no (drift → change-request)
- Sign-off date: YYYY-MM-DD

## Open Follow-Ups

Any failed `TC-NNN`, conditional acceptance, or deferred REQ lands here
with an owner + tracking link. ACCEPTANCE cannot close with an
unassigned in-flight token.

| Item | Token | Owner | Tracking | Status |
| --- | --- | --- | --- | --- |
| <follow-up> | `SC-003` / `TC-007` | <name> | `docs/requirements/change-requests/CR-01-*/` | open |
