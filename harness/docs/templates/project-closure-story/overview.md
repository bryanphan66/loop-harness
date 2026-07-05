<!--
Template: project-closure-story/overview.md
Macro-stage: 3 Post-Build · Step 3.1 Handover package
Role: Support/SRE + PM · Engine: ck-handover
Gate: HANDOVER ACCEPTANCE (client, countersigned)
Bilingual: EN canonical base — VN fork at locale-vi/project-closure-story/
Tokens: REQ-ID MODULE.AREA.NN (docs/TRACE_SPEC.md)
-->

# Project Closure — <project name>

Wrapper for the handover packet: the documents, credentials, and
knowledge that transfer operational ownership to the client.

## Packet

| File | Purpose | Gate |
| --- | --- | --- |
| `01-handover-docs.md` | read-this-order index + decisions in force + open items | feeds HANDOVER |
| `02-credentials-handover.md` | vault-pointer checklist (NO raw secrets) + rotate-on-handover | **HANDOVER** |
| `03-knowledge-transfer.md` | KT session log + walkthroughs delivered | feeds HANDOVER |

Stage-1 artifacts also ship with this packet: prototype URL, frozen
diagrams (RPM, status-flows, ERD), and the bilingual user guide.

## Closure Summary

- Production URL: `<url>` · deployed: YYYY-MM-DD (`<release tag>`)
- Signed acceptance: `delivery-closure-story/02-signoff.md` (YYYY-MM-DD)
- Credentials access-verified by incoming owner: yes / no
- KT sessions logged: `<n>`
- Maintenance proposal sent: `docs/handover/maintenance-proposal.md` (tier: Basic / Standard / Premium)

## Open Items at Handover

| Item | Owner | Tracking | Status |
| --- | --- | --- | --- |
| <residual> | <name> | `docs/runbook/...` | open |
