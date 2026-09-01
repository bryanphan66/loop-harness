<!--
TEMPLATE: Release Note
Used by: WORKFLOW step 2.13 (Release). Sits between ACCEPTANCE (2.12) and the client update.
Role: Release Manager · Engine: ship · deploy
Output path: docs/uat/release-note-<version>.md  (or docs/releases/)
Bilingual: client-facing → fork to docs/mau-tai-lieu/locale-vi/release-note.md (D4)
Token grammar (D3): every released feature row cites its REQ-ID (MODULE.AREA.NN) + the TC-NNN that proved it. Every released REQ-ID must appear here. Do NOT use US-NNN.REQ-MMM.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths EN even in the VN fork.
-->

# Release Note — <version or release name>

Date: YYYY-MM-DD · Environment: dev | staging | production
Build / commit: <git sha> · Previous release: <version or tag>

> Generated at each release (2.13). **Every released REQ-ID must appear in § 2 or
> § 3.** Pairs with the post-deploy smoke checklist and the client-update message.

## 1. Release Summary

One paragraph: what shipped and why. Tie to the SOW milestone (1.14) if
applicable.

## 2. New Features

| # | Feature | REQ-ID | Proved by | Story | Client-visible? |
| --- | --- | --- | --- | --- | --- |
| F1 | <feature> | `ORD.STATUS.01` | `TC-001` | `docs/stories/order-02-status-view.md` | yes |
| F2 | <feature> | `ORD.STATUS.02` | `TC-002` | `docs/stories/order-02-status-view.md` | yes |

## 3. Bug Fixes

| # | Issue | Severity | REQ-ID / CR | Story / commit |
| --- | --- | --- | --- | --- |
| B1 | <one-line bug> | S2 | CR-02 | `<story or commit>` |

## 4. Improvements (Non-Behavioral)

Codebase touches with no product-behavior change — performance, refactor,
dependency bump, docs.

- <improvement>

## 5. Breaking Changes

If any; otherwise "None".

| Change | Affects | Migration step |
| --- | --- | --- |
| API endpoint X moved to /v2 | client integration | update to /v2 by YYYY-MM-DD |

## 6. Known Issues

Issues accepted at ship. Link each to a backlog row or follow-up story / CR.

- <issue> — `docs/requirements/change-requests/change-request-log.md` (CR-NN) or `docs/stories/...`

## 7. Pre-Deploy Checklist

- [ ] All tests pass on the release commit (link to test run).
- [ ] DB migration tested on a staging clone of prod data.
- [ ] Backup of prod DB taken within the last 4 hours.
- [ ] Feature flags ready (default OFF for risky features).
- [ ] Env vars for new integrations added to the prod secret store.
- [ ] Third-party services notified (if integration changed).
- [ ] Deploy window communicated to client.
- [ ] Rollback path tested (§ 9).
- [ ] On-call / contact available during the window.

## 8. Post-Deploy Smoke Checklist

Run within 30 minutes. Each item must pass before declaring release green.

- [ ] Homepage loads (200, < 3s).
- [ ] Login works (test account, happy + invalid).
- [ ] Core journey of this release works end-to-end on prod (cite the journey).
- [ ] No new error-rate spike (compare to 1h pre-deploy baseline).
- [ ] No new alert-rule firing.
- [ ] Payment flow processes a real/sandbox transaction (e-commerce / SaaS only).
- [ ] Background job processes a sample event (queue / cron / webhook only).
- [ ] Logs from new code paths visible in monitoring.

## 9. Rollback Plan

Rollback = one `IMAGE_TAG` line where possible (per WORKFLOW 2.13).

| When to rollback | How |
| --- | --- |
| Post-deploy smoke fails on a critical item (login, payment, homepage) | `<rollback command / set IMAGE_TAG=<prev>>`. ETA: <N> min. |
| Error rate > <threshold> within 1 hour | Same. Notify client per § 11. |
| Data corruption detected | Stop writes (`<command>`), restore from backup (§ 7), root-cause before reapply. |

Steps:

1. <step>
2. <step>
3. Re-run smoke checklist (§ 8).
4. Notify client (§ 11).

## 10. Verification After Rollback

- [ ] Production points to the previous release (verify by version endpoint / git sha header).
- [ ] Smoke checklist (§ 8) passes on the rolled-back version.
- [ ] Post-incident note logged at `docs/incidents/YYYY-MM-DD-<slug>.md`.
- [ ] Follow-up story created for the failed release.

## 11. Client Update Message

Sent through the agreed channel within <N> hours of deploy.

```text
Subject: <project> release <version> deployed

Hi <client>,

We deployed <version> to production at <time>. This release includes:

- <one-line feature 1>
- <one-line feature 2>
- <count> bug fixes

Production URL: <url>
What you may want to verify: <client-action items>

Known issues (in the backlog, not blocking):
- <issue>

If you see anything unexpected, reply to this thread.

— <vendor name>
```

## 12. Sign-Offs

| Role | Name | Confirmed by |
| --- | --- | --- |
| Vendor — deployer | <name> | git sha + timestamp |
| Vendor — verifier | <name> | smoke checklist passed |
| Client (if pre-prod gate required) | <name> | ACCEPTANCE sign-off link |

---

**Pointers**

- ACCEPTANCE gate that gates this release: WORKFLOW 2.12.
- Released REQ-IDs trace forward to handover: `docs/handover/` (3.1).
- CRs that landed in this release: `change-request-log.md` (filter by release tag).
- Token chain: `docs/process/TRACE_SPEC.md`.
- Localization: forks to `docs/mau-tai-lieu/locale-vi/release-note.md` (D4).
