<!--
Template: project-closure-story/02-credentials-handover.md
Macro-stage: 3 Post-Build · Step 3.1 Handover package
Role: DevSecOps + Support/SRE · Engine: ck-handover
Gate: HANDOVER ACCEPTANCE (client) — every row access-verified + rotated
Bilingual: EN canonical base (internal/ops; VN fork optional per D4)
-->

# Credentials Handover — <project name>

> **NO RAW SECRETS IN THIS FILE.** Each row points to where the secret
> lives (vault path / provider console). Values are transferred through
> the secret store, never pasted here or in chat.

## Rotate-On-Handover Rule

Every credential the delivery side held MUST be rotated as part of
handover so the outgoing operator no longer holds live access. Mark each
row rotated + access-verified by the incoming owner before HANDOVER closes.

## Credential Register

| # | System | What it unlocks | Vault path / console | Rotated | Access-verified by | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | <provider> | <scope> | <vault://path> or <console URL> | yes/no | <incoming owner> | YYYY-MM-DD |
| 2 | DB (prod) | read/write app schema | <vault path> | | | |
| 3 | Domain / DNS | DNS + SSL | <registrar console> | | | |
| 4 | CI/CD | deploy pipeline | <secret store> | | | |
| 5 | Monitoring / alerting | dashboards + alert routing | <console> | | | |

## Break-Glass

- Emergency access procedure: docs/runbook/escalation/.
- Who to contact + how, when normal access fails.

## Sign-off

- All rows rotated: yes / no
- All rows access-verified by incoming owner: yes / no
- Outgoing operator confirms no residual live access: <name> · YYYY-MM-DD
