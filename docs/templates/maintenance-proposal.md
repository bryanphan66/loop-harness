<!--
TEMPLATE: Maintenance & Support Proposal
Used by: WORKFLOW step 3.4 (Maintenance proposal — recurring revenue). Sent at/after HANDOVER (3.1).
Role: PM (Delivery Lead) · Engine: project-manager · ck-hypercare
Output path: docs/handover/maintenance-proposal.md
Bilingual: client-facing → fork to docs/templates/locale-vi/maintenance-proposal.md (D4)
Token grammar (D3): support requests route through change-request-log.md (CR-NN). SLA terms are GENERATED here (depended on by hypercare 3.2).
Shape-only scaffold. Replace <placeholders>; keep IDs/paths EN even in the VN fork.
-->

# Maintenance & Support Proposal — <project name>

Date: YYYY-MM-DD · Effective from: YYYY-MM-DD · Valid for: <NN> months

> Sent at or after handover (3.1). Converts a one-shot delivery into a recurring
> support relationship: the client gets predictable support, the vendor gets
> recurring revenue and bounded support liability. The SLA terms here are what
> hypercare (3.2) depends on.

## 1. Context

| | |
| --- | --- |
| Project | <name> |
| Production URL | <url> |
| Delivered on | YYYY-MM-DD (Milestone M4, SOW) |
| Bug warranty ends | YYYY-MM-DD |

## 2. Why Maintenance?

Without an active plan after warranty ends, every request becomes a one-off price
negotiation. With a plan, the client has a predictable monthly cost and the
vendor has reserved capacity.

## 3. In-Scope (All Tiers)

- Production uptime monitoring (vendor checks staging + prod weekly).
- Bug fixes for issues reproducible on the originally-delivered scope.
- Security patches for declared dependencies (libraries, OS-level if vendor-hosted).
- Backup verification (vendor confirms backups run; restore test per tier).
- Periodic dependency-update review (vendor reports; client approves application).

## 4. Out-of-Scope (All Tiers)

These route through `change-request-log.md` (CR-NN) and are priced separately:

- New features or new screens (mint new REQ-IDs).
- Visual redesign or rebranding.
- Bugs caused by client modifications to code or infra.
- Third-party service issues (vendor coordinates, does not own the fix).
- Migration to a new stack or hosting provider.
- Data recovery from client-side accidental deletion (vendor restores from backup; client pays effort).
- Training new staff beyond the original handover sessions.

## 5. Tier Comparison

| Item | Basic | Standard | Premium |
| --- | --- | --- | --- |
| Monthly fee | <amount> | <amount> | <amount> |
| Support hours / month (rollover capped at 1 month) | 2 | 6 | 16 |
| Response — S1 (production down) | 8 business hours | 4 business hours | 2 business hours |
| Response — S2 (feature broken) | 2 business days | 1 business day | 4 business hours |
| Response — S3 (cosmetic / minor) | 5 business days | 3 business days | 1 business day |
| Channel | Email | Email + Telegram/Slack | Email + Telegram/Slack + scheduled call |
| Monthly status report | — | yes (summary) | yes (detailed + roadmap) |
| Quarterly review meeting | — | — | yes |
| Backup verification | quarterly | monthly | monthly + restore drill |
| Dependency-update batch | annually | quarterly | quarterly |
| Emergency after-hours support | — | $/incident | included up to 2/month |
| Discount on Change Requests | — | 10% | 20% |

Support hours are dedicated capacity; unused hours rollover one month then expire.

## 6. Severity Definitions

| Severity | Definition | Example |
| --- | --- | --- |
| S1 | Production unusable, data-loss risk, or payment broken | site 500s for all users, checkout fails |
| S2 | A core feature is broken but workarounds exist | search returns wrong results, one role can't log in |
| S3 | Cosmetic, minor, or non-blocking | misaligned button, typo, slow non-critical page |

## 7. How To Request Support

1. Client opens an entry in `change-request-log.md` (or sends to the agreed
   channel — vendor logs it as a CR-NN).
2. Vendor acknowledges within the tier's response window.
3. Vendor classifies (per `change-request-log.md` § Classification).
4. Bug in scope → fixed within the tier budget. Change request → estimated;
   client approves before work.

## 8. SLA Exclusions

The response-time SLA does not apply when:

- A third-party service is down (payment provider, cloud outage) — clock pauses.
- The client cannot grant required access within 1 business day of request.
- The issue is caused by client modification or an unauthorized third party with client credentials.
- A scheduled maintenance window is in effect (announced ≥48h ahead).

## 9. Term & Renewal

- Term: <3 / 6 / 12 months>.
- Auto-renews unless either party gives <30 / 60> days notice.
- Tier upgradable any month; downgrade at term end only.
- Either party may terminate with <30 / 60> days notice. Vendor refunds unused
  prepayment minus hours consumed at the hourly rate (§ 11).

## 10. Termination Hand-Off

If maintenance ends:

- Vendor hands over current codebase state with patch notes for the period.
- Vendor revokes its access to client infra within <N> days (secrets rotated at
  handover; this confirms revocation).
- Vendor delivers a final report: open issues, deferred CRs, recommended next steps.

## 11. Pricing Detail

| Item | Rate |
| --- | --- |
| Hourly rate beyond tier budget | <amount/hour> |
| Emergency after-hours rate (Basic + Standard) | <amount/incident> |
| Change Request rate | <amount/hour or per-feature> |
| Yearly prepay discount | NN% (pay 12 months upfront) |

## 12. Recommendation Per Project Stage

| Stage | Recommended tier |
| --- | --- |
| Just launched, < 100 daily users | Basic |
| Growing, 100-1000 daily users, no critical commerce | Standard |
| Revenue-critical (e-commerce, SaaS billing) or > 1000 daily users | Premium |

## 13. Acceptance

| Party | Name | Title | Signature | Date |
| --- | --- | --- | --- | --- |
| Client | | | | |
| Vendor | | | | |

---

**Pointers**

- Severity escalation log: `docs/incidents/` (project repo).
- Change Request log: `docs/requirements/change-requests/change-request-log.md`.
- Handover (sent alongside): `docs/handover/` (3.1).
- Localization: forks to `docs/templates/locale-vi/maintenance-proposal.md` (D4).
