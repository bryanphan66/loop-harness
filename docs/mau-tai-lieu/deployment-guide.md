<!--
TEMPLATE: Deployment Guide (project doc stub)
Used by: WORKFLOW step 2.4 (env/CI) seeds it; finalized at 2.13 (first release). Maintained continuously after.
Role: DevSecOps · Engine: devops · deploy
Output path: docs/deployment-guide.md  (this stub leaves docs/mau-tai-lieu/ and lands at the docs root)
Bilingual: INTERNAL — English only (no locale-vi fork) per D4.
Conditional gates (D2): observability/SLO (2.4) usually always-on; DR + RTO/RPO restore-drill (2.11) is CONDITIONAL — mark N/A-by-decision when not needed.
Shape-only scaffold. Replace <placeholders>.
-->

# Deployment Guide

> Stub. Seeded at env/CI setup (2.4), finalized before the first production
> deploy (2.13), maintained continuously after. Once filled, lives at
> `docs/deployment-guide.md`. Pairs with `release-note.md` (per-release) and the
> handover credentials doc.

## Environments

| Env | URL | Purpose | Auto-deploy from |
| --- | --- | --- | --- |
| dev | `<url>` | Active development | `<branch e.g. dev>` |
| staging | `<url>` | UAT + pre-release | `<branch e.g. main on tag>` |
| production | `<url>` | Live | `<tag pattern e.g. v*.*.*>` |

## Environment Variables

Reference: `.env.example` (committed) lists every required var with an empty
value. Real values live in `<secret vault — 1Password / Doppler / Vault>`.

| Var | Purpose | Source |
| --- | --- | --- |
| `<NAME>` | `<one-line>` | `<vault path>` |

Never commit a populated `.env`. The pre-commit hook blocks `.env*` except
`.env.example`.

## Build

```bash
<exact commands — e.g. pnpm install --frozen-lockfile && pnpm build>
```

Build output: `<path>`. Artifacts retained: `<duration>`.

## Deploy Steps

1. `<step — push to main → CI runs validate + integration tests>`
2. `<step — tag v*.*.* → CI runs full release tests + builds image>`
3. `<step — deploy via <provider> (Vercel / Fly.io / Cloud Run / k8s)>`
4. `<step — run post-deploy smoke per release-note.md § 8>`

## Pre-Deploy Checklist

Mirrors `release-note.md` § 7:

- [ ] All tests pass on the release commit.
- [ ] DB backup taken (production only).
- [ ] Feature flags configured per release plan.
- [ ] Env vars deployed to the target environment.
- [ ] Third-party services notified if behavior change is user-visible.
- [ ] Rollback tested in staging.
- [ ] On-call available for the deploy window.

## Post-Deploy Smoke

Mirrors `release-note.md` § 8. Manual checks:

- [ ] Homepage loads.
- [ ] Login works.
- [ ] Core journey of the release works.
- [ ] Error rate within budget (per monitoring).
- [ ] Alerts not firing.
- [ ] Payment flow (if part of the product).
- [ ] Background jobs ran on schedule.
- [ ] Logs show no panic.

## Rollback

```bash
<exact commands — rollback = one IMAGE_TAG line where possible>
```

Trigger when: `<criteria — e.g. error rate > X% within 10 min, or any S1 incident>`.

## Monitoring & Alerts (observability/SLO — 2.4, usually always-on)

| Signal | Threshold | Action |
| --- | --- | --- |
| HTTP 5xx rate | `<e.g. >1% over 5 min>` | `<page on-call>` |
| P95 latency | `<NFR budget>` | `<alert channel>` |
| Background job failure | `<>0 in 5 min>` | `<alert channel>` |
| Error budget burn | `<SLO burn-rate>` | `<alert channel>` |

Dashboards: `<links>`.

## DR + RTO/RPO (2.11 — CONDITIONAL)

Mark **N/A by decision** when not required. When required:

| Item | Target | Proof |
| --- | --- | --- |
| RTO (recovery time objective) | `<e.g. 4h>` | restore-drill date + result |
| RPO (recovery point objective) | `<e.g. 1h>` | backup frequency + last verified restore |

Separate from rollback: rollback reverts a bad release; DR recovers from data /
infra loss. Both must be exercised, not just documented.

## Runbook

Common incidents and first-response steps. Add entries as incidents occur.

| Symptom | First check | Likely cause | Mitigation |
| --- | --- | --- | --- |

## Cross-Reference

- Per-release notes: `docs/mau-tai-lieu/release-note.md`.
- Handover credentials (secrets rotated at handover, 3.1): `docs/handover/`.
- Conditional gates: `docs/process/WORKFLOW.md` § Conditional enterprise gates.
