<!--
TEMPLATE: Gap Analysis (As-Is / To-Be / GAP-NNN / MoSCoW)
Used by: WORKFLOW step 1.4 (Gap analysis) · feeds PB-G2 (scope frozen)
Role: BA (Requirements Engineer) · Engine: researcher · gap-analysis-playbook
Output path: docs/requirements/gap-analysis.md
Bilingual: client-facing → fork to docs/templates/locale-vi/gap-analysis.md (D4)
Token grammar (D3): MINTS GAP-NNN (global counter). Each GAP traces forward to a
  REQ-ID (MODULE.AREA.NN) at SRS (1.5). Do NOT use US-NNN.REQ-MMM.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths EN even in the VN fork.
-->

# Gap Analysis — <project name>

Date: YYYY-MM-DD · Status: draft | reviewed-by-client | accepted · Round: 1

> Vendor-produced brief comparing the client's current state (As-Is) to the
> desired future state (To-Be) and structuring the gaps + solutions. Frozen
> before the feature-register baseline at **PB-G2** (max 2 review rounds).
>
> Produced by `gap-analysis-playbook` after `discovery-interview-playbook`
> surfaces the need list. Each gap mints a **GAP-NNN** token that traces forward
> to a **REQ-ID** (`MODULE.AREA.NN`) in the SRS (1.5).

## 1. To-Be (Future State)

What the world looks like once the project ships.

### Business goals

- Goal 1 (one-line, measurable if possible).
- Goal 2.

### Success metrics

| Metric | Today (baseline) | Target | Measure by |
| --- | --- | --- | --- |
| <e.g. order fulfillment time> | <e.g. 24h avg> | <e.g. < 4h avg> | <e.g. 30 days post-launch> |

### Target users × target actions

| Role | What they will be able to do (To-Be) |
| --- | --- |
| Customer | Self-service order status 24/7 on mobile |
| Staff | Receive order notifications + update status from dashboard |

### Constraints

- Deadline: <date>
- Budget envelope: <range>
- Regulatory: <e.g. PCI-DSS, GDPR, Nghị định 13/2023/NĐ-CP, none>
- Existing systems that must keep running: <list>

## 2. As-Is (Current State)

What the client does today. From discovery (1.3), source docs, and
`docs/discovery/` raw inputs.

### Existing process map

Numbered steps, who does what, where pain shows. The formal As-Is BPMN lands at
1.7 (`docs/requirements/BPMN_DIAGRAMS.md`); text is enough here.

1. <Actor X> does <action> via <channel> → result.
2. <Actor Y> does <action> → handoff to <Actor Z>.

### Existing systems

| System | Purpose | Owned by | Integrates with | Pain |
| --- | --- | --- | --- | --- |
| <e.g. Excel order log> | Manual tracking | Sales staff | None — manual entry | Duplicate entries, lost orders |

### Pain points (verbatim where possible)

Cite source: `docs/discovery/2026-06-03-kickoff-notes.md § 4`.

- Pain 1: <one-line>. Cited: <source>.
- Pain 2: <one-line>. Cited: <source>.

### Workarounds users invent

- <e.g. customer calls hotline repeatedly because no tracking page exists>.

### Stakeholders in As-Is

| Role | Current responsibility | Affected by change? |
| --- | --- | --- |
| Customer service rep | Handles status-check calls | yes — workload drops with self-service |

## 3. The Gap

Categorized. Each row mints a **GAP-NNN** (global zero-padded counter). The gap
token traces forward to ≥1 **REQ-ID** when the SRS is written (1.5).

### Functional gaps (features missing)

| GAP ID | Description | Severity | As-Is touch | To-Be touch |
| --- | --- | --- | --- | --- |
| GAP-001 | No customer-facing order status surface | High | Customer calls hotline | Customer opens app, sees status |
| GAP-002 | No real-time order notification to staff | Medium | Staff polls email | Push notification on phone |

### Process gaps (workflows missing or broken)

| GAP ID | Description | Severity | Plan-of-action linkage |
| --- | --- | --- | --- |
| GAP-010 | Order intake has no validation step before warehouse handoff | High | Add validation step in workflow + UI gate |

### Technology gaps (systems not integrated)

| GAP ID | Description | Severity | Plan-of-action linkage |
| --- | --- | --- | --- |
| GAP-020 | Excel order log not connected to inventory system | High | Replace Excel + integrate inventory API |

### Data gaps (data not captured / not accessible)

| GAP ID | Description | Severity | Plan-of-action linkage |
| --- | --- | --- | --- |
| GAP-030 | Customer satisfaction not tracked anywhere | Medium | Add post-fulfillment NPS survey |

### Role / skill gaps (people lack access or training)

| GAP ID | Description | Severity | Plan-of-action linkage |
| --- | --- | --- | --- |
| GAP-040 | Staff has no admin account — only owner has access | Low | Add staff role + training at handover |

### Compliance gaps (regulation not met)

| GAP ID | Description | Severity | Plan-of-action linkage |
| --- | --- | --- | --- |
| GAP-050 | No PII consent capture for marketing emails | High (legal) | Add consent checkbox + retention policy |

Severity scale: **High** = blocks To-Be / regulatory risk · **Medium** = blocks
goal but workaround exists · **Low** = nice-to-have.

## 4. Plan of Action

Each gap gets a solution row. MoSCoW priority directly informs the
feature-register in-scope decisions (1.9). The `REQ-ID candidate` column is the
forward link to the SRS — the actual REQ-ID is minted at 1.5.

| GAP ID | Solution shape | Owner | Effort | Priority (MoSCoW) | REQ-ID candidate | In MVP? |
| --- | --- | --- | --- | --- | --- | --- |
| GAP-001 | "Order Status" page + status API | Vendor | L (16-40h) | **Must** | `ORD.STATUS.01` | yes |
| GAP-002 | Push notification to staff via FCM | Vendor | M (4-16h) | **Should** | `ORD.NOTIF.01` | yes |
| GAP-010 | Validation step in order-intake workflow | Vendor | M | **Must** | `ORD.INTAKE.01` | yes |
| GAP-020 | New inventory API + migrate Excel data | Vendor | XL (> 40h) | **Should** | `INV.SYNC.01` | partial — read-only MVP, write later |
| GAP-030 | NPS survey post-fulfillment | Vendor | S (1-4h) | **Could** | `ORD.NPS.01` | no — defer |
| GAP-040 | Staff role + training session | Both | S | **Must** | `IF.RBAC.01` | yes (handover scope) |
| GAP-050 | Consent capture + retention policy | Vendor | M | **Must** | `IF.CONSENT.01` | yes |

MoSCoW key:

- **Must** — blocks the To-Be vision OR regulatory. Must be in MVP scope.
- **Should** — significant value, not blocking. In MVP if budget allows.
- **Could** — nice-to-have. Default to defer / phase-2.
- **Won't** — explicitly out of this project. Record why in `docs/decisions/<slug>.md`.

## Out-of-Scope From This Brief

Gaps the client mentioned but the team chose not to address now. Each cites a
reason and disposition.

| GAP ID | Description | Why out | Disposition |
| --- | --- | --- | --- |
| GAP-099 | Multi-language UI (5 languages) | Beyond MVP budget | Phase-2 (post-launch) |

## Risks Identified

Conditions that could derail closing the gap (distinct from the gaps themselves).

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Excel data quality worse than stated | Med | High | Spike week 1 — sample 100 rows, report |
| Staff training resistance | Low | Med | Handover includes 2 sessions + written guide |

## Open Questions

Questions the gap analysis could NOT resolve. Either answered before PB-G2, or
logged as a CLARIFICATIONS BLOCKER (1.6).

- Q1: Does the existing PIM have an export API or will we scrape?
- Q2: What retention period do regulators require for order data?

## Sign-Off

| Stage | Date | Approver | Notes |
| --- | --- | --- | --- |
| Vendor draft complete | YYYY-MM-DD | <vendor> | Round 1 |
| Client review | YYYY-MM-DD | <client name> | Round 1 — accepted with edits to GAP-020 priority |
| Frozen (feeds PB-G2) | YYYY-MM-DD | <vendor + client> | Final |

Once frozen, gap changes route through `change-request-log.md` (mints CR-NN). Do
not edit in place — annotate with a pointer to the CR.

## Cross-References

- Discovery output: `docs/intake/YYYY-MM-DD-discovery-summary.md` (need-list source).
- Intake brief: `docs/intake/YYYY-MM-DD-intake-brief.md` (business-problem source).
- Raw inputs cited: `docs/discovery/YYYY-MM-DD-<slug>.{ext}`.
- Forward: SRS `docs/requirements/srs/<module>.md` (GAP → REQ-ID, 1.5).
- Forward: feature-register `docs/scope-baseline/feature-register.md` (1.9).
- Token chain: `docs/process/TRACE_SPEC.md`.

---

**Localization**

Forks to `docs/templates/locale-vi/gap-analysis.md` (D4). Tokens (`GAP-NNN`,
`REQ-ID`), file paths, and code fences stay English in both locales.
