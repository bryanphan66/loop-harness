<!--
Template: project-closure-story/01-handover-docs.md
Macro-stage: 3 Post-Build · Step 3.1 Handover package
Role: Support/SRE + PM · Engine: ck-handover
Gate: HANDOVER ACCEPTANCE (client, countersigned)
Bilingual: EN canonical base — VN fork at locale-vi/project-closure-story/01-handover-docs.md
Tokens: REQ-ID MODULE.AREA.NN · SC-NNN (docs/process/TRACE_SPEC.md)
-->

# Handover Docs Index — <project name>

## Read In This Order

1. `README.md` — project overview, run commands, quick start.
2. `docs/about/HARNESS.md` — operating model (if the project is harnessed).
3. `docs/requirements/` — SRS, RTM, GLOSSARY: the product contract.
4. `docs/decisions/*` — why important choices were made (by slug).
5. `docs/stories/` — recent + open story packets (`<module>-NN-<slug>.md`).
6. `docs/system-architecture.md` — ERD + topology.
7. `docs/runbook/` — release procedure, escalation, failover SOPs.
8. `docs/about/TEST_MATRIX.md` — proof status (provably covered vs not).

## Key Decisions Still In Force

| Decision (slug) | Why it matters today |
| --- | --- |
| `docs/decisions/stack-selection.md` | Locks runtime stack; deviating needs a superseding decision. |
| `docs/decisions/<data-model-slug>.md` | <one-line consequence the incoming owner must know> |

Cite each decision still constraining current work; skip superseded ones.

## Open Stories at Handover

| Story | Status | Tokens in flight | New owner |
| --- | --- | --- | --- |
| `docs/stories/<module>-NN-<slug>.md` | in-progress / blocked / awaiting-review | `AUTH.LOGIN.02`, `SC-003` | <name> |

Block HANDOVER on any unassigned in-flight token.

## Maintenance Surfaces

- Dependencies last updated: YYYY-MM-DD · next review due: YYYY-MM-DD.
- Known tech-debt entries: links to backlog rows.
- Recurring playbooks consulted: `docs/playbooks/<name>.md` × N uses.
- Monitoring / alerting dashboards: `<links>` · SLOs: `docs/runbook/`.

## External Integrations

| Integration | Purpose | Credential reference | Contact |
| --- | --- | --- | --- |
| <provider> | <what it does> | `02-credentials-handover.md` → `<row>` | <vendor contact> |

Credential VALUES live in the secret store, not here — this points to
the reference row in `02-credentials-handover.md`.
