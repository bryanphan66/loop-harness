<!--
TEMPLATE: Change Request Log
Used by: WORKFLOW step 3.5 (change control, always-on ASYNC) — any post-PB-G4 client request. Powers SOW § 9.
Role: BA + PM · Engine: ck-xre CHANGE-REQUEST · audit-product-feature
Output path: docs/requirements/change-requests/change-request-log.md (one per project)
Bilingual: client-facing → fork to docs/templates/locale-vi/change-request-log.md (D4)
Token grammar (D3): MINTS CR-NN (global counter, CR-01..). An approved CR mints new REQ-IDs (MODULE.AREA.NN) that re-enter the chain at 1.5 (mid-build at 2.3/2.6). Do NOT use US-NNN.REQ-MMM.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths EN even in the VN fork.
-->

# Change Request Log — <project name>

> One file per project. Append-only. Every client-initiated change after **PB-G4**
> enters here — verbal asks, email tweaks, "small additions". No silent scope
> changes. This is the client-facing surface powering SOW § 9.
>
> Mints **CR-NN** (`CR-01`, `CR-02`, …). An approved CR mints **new REQ-IDs**
> (`MODULE.AREA.NN`) that re-enter the token chain at 1.5 (or mid-build at
> 2.3 / 2.6). Async by design — the notifier pings the human; it never blocks the
> session.

## How To Use

1. Client raises a request through any channel.
2. Log it as a new row immediately (§ Log Table). Status: `new`.
3. Classify within <N> business days (§ Classification).
4. In original scope → fix at no extra cost; status → `in-progress` → `done`.
5. Out of scope → effort estimate + price (§ Effort); status → `quoted`. Client
   approves → `accepted` → `in-progress`; declined/deferred → `rejected` / `deferred`.
6. Reply using a message template (§ Reply Templates).

## Classification

| Type | Meaning | Default route |
| --- | --- | --- |
| `bug` | Behavior deviates from accepted spec / AC | In scope. Fix under warranty. |
| `change-request` | Modify in-scope behavior that was accepted | Effort-based: minor = absorb, major = quote |
| `new-feature` | New behavior not in the frozen scope | Out of scope. Quote separately. Mints new REQ-IDs. |
| `ux-improvement` | UX tweak (copy, layout, polish) | Quote unless trivial (< 30 min) |
| `clarification` | Question about existing behavior | Free. Answer + link to spec. |

When ambiguous, lean to `change-request` / `new-feature` and let the client push
back. Logging more is safer than logging less.

## Severity (bugs only)

| | |
| --- | --- |
| S1 | Production unusable, data loss, payment broken |
| S2 | Core feature broken, workaround exists |
| S3 | Cosmetic, minor |

## Effort Estimate (non-bug)

| Tag | Hours | Typical work |
| --- | --- | --- |
| XS | < 1h | Copy change, color tweak |
| S | 1-4h | Single field, validation rule, minor UI |
| M | 4-16h | New screen using existing components |
| L | 16-40h | New flow with backend changes |
| XL | > 40h | Triggers a phase-2 SOW conversation, not a CR |

## Log Table

| CR ID | Date raised | Source | Description (one line) | Classification | Severity | In-scope? | Effort | New REQ-IDs | Status | Released in | Reply sent |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CR-01 | YYYY-MM-DD | email | <one-line> | `change-request` | — | no | S | — | quoted | — | YYYY-MM-DD |
| CR-02 | YYYY-MM-DD | call | <one-line> | `bug` | S2 | yes | — | — | done | v1.1 | YYYY-MM-DD |
| CR-03 | YYYY-MM-DD | chat | <one-line> | `new-feature` | — | no | M | `RPT.EXPORT.01` | deferred | phase-2 | YYYY-MM-DD |

Status values: `new` · `classified` · `quoted` · `accepted` · `in-progress` ·
`done` · `deferred` · `rejected`.

## Per-CR Detail (when L+ effort or disputed)

For any CR estimated L+, or where the client disagrees with the classification.
XS / S CRs can live as a single log row.

### CR-NN: <title>

- **Raised**: YYYY-MM-DD via <source>
- **Verbatim request**: > "<paste client's exact words>"
- **Classification**: <type> — <one-line reason>
- **In frozen scope**: yes / no (cite feature-register line if "yes")
- **Affected modules / stories**: `docs/stories/<module>-NN-<slug>.md`
- **New REQ-IDs minted (if approved)**: `<MODULE.AREA.NN>` …
- **Effort estimate**: <tag> (<hours> hours)
- **Price** (if out of scope): <amount>
- **Risk if accepted**: <impact on timeline / other features>
- **Recommendation**: do now / defer to phase 2 / decline
- **Decision date**: YYYY-MM-DD
- **Decided by**: <client name>
- **Released in**: <release tag>

## Reply Templates

Starting points; adjust tone to the relationship.

### Reply A — In-scope bug (will fix at no cost)

```text
Subject: Re: <client's wording> — confirmed bug, fixing

Hi <client>,

Logged as CR-NN. This deviates from the accepted spec, so it's a bug under
warranty. Targeting fix in <release tag, target date>. I'll update CR-NN
when the fix is on staging.

— <vendor>
```

### Reply B — Change request (out of scope, here's the quote)

```text
Subject: Re: <client's wording> — change request CR-NN

Hi <client>,

Happy to do this. It's outside the frozen scope, so the estimate:

- What changes: <one-line>
- Effort: <tag> (<hours> hours)
- Price: <amount>
- Earliest delivery: <date> (shifts <other deliverable> by <impact>)

Reply "approved" to start, or defer to a phase-2 batch (smaller per-CR
price when batched).

— <vendor>
```

### Reply C — New feature (defer to phase 2)

```text
Subject: Re: <client's wording> — recommend phase 2

Hi <client>,

This is a new feature, not a bug or tweak. Doing it now shifts M3 by about
<impact>, which we agreed to protect. Suggestion: park CR-NN for a phase-2
batch (post-launch); we decide together with user feedback in hand.

If it's revenue-critical or regulatory, reply and I'll re-estimate with the
timeline impact.

— <vendor>
```

### Reply D — Clarification (free, point to spec)

```text
Subject: Re: <client's wording> — clarification

Hi <client>,

Quick answer: <one-line>. This is the accepted behavior per <feature-register
line / story link>. Logged as CR-NN, status `done — clarification`. If you'd
like to change it, let me know and I'll re-classify.

— <vendor>
```

### Reply E — Severity 1 incident

```text
Subject: URGENT — <issue> — CR-NN

Hi <client>,

Acknowledged at <timestamp>. Investigating now.
Current impact: <user-facing impact, blast radius if known>
Workaround: <if any, else "none — investigating">
Next update: within <N> hours

— <vendor>
```

## Audit Rules

- Append-only. Never delete a row; if misclassified, add a follow-up row
  referencing the original.
- A CR is **closed** only when status is `done`, `deferred`, or `rejected` AND a
  reply was sent (timestamp in the last column).
- At each release, fill "Released in" for every `done` CR.
- At project closure (handover, 3.1), report open `deferred` CRs as phase-2
  candidates + feed `maintenance-proposal.md`.

---

**Pointers**

- SOW § 9 Change Request Policy: `docs/templates/proposal-sow.md`.
- Re-entry into the chain: `docs/TRACE_SPEC.md` § Change-request branch.
- Roadmap impact: `docs/ROADMAP.md` § Change Log Impact.
- Maintenance SLA windows: `docs/templates/maintenance-proposal.md` § 5.
- Localization: forks to `docs/templates/locale-vi/change-request-log.md` (D4).
