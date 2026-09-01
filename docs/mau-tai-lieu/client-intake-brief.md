<!--
TEMPLATE: Client Intake Brief
Used by: WORKFLOW step 1.2 (Intake brief go/no-go) · Gate PB-G1 (internal capture — does NOT page client)
Role: PM (Delivery Lead) · Engine: project-manager · ck-intake-file
Output path: docs/intake/YYYY-MM-DD-<slug>-intake-brief.md
Bilingual: client-facing → fork to docs/mau-tai-lieu/locale-vi/client-intake-brief.md (D4)
Token grammar (D3): business problems captured here are analysed into GAP-NNN at 1.4. No REQ-ID yet.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths EN even in the VN fork.
-->

# Client Intake Brief — <client / project working title>

Date: YYYY-MM-DD · Status: review | accepted | parked | declined

> First pass after the initial conversation with a prospective client. A
> vendor-internal one-pager that decides **PB-G1**: proceed to discovery + scope,
> park, or decline. This is an **internal capture** — it does NOT page the client.
>
> Comes BEFORE `spec-intake.md` (technical intake, after signing) and BEFORE
> `proposal-sow.md` / `bao-gia/` (need the scope clarity this brief surfaces).
> The business problems captured here become **GAP-NNN** at gap analysis (1.4).

## 1. Client

| | |
| --- | --- |
| Name | <person + company> |
| Channel | <referral / inbound / cold> |
| Decision-maker present? | yes / no — name |
| Existing vendor relationship? | none / past project: <ref> |

## 2. Stated Need (One Paragraph)

What the client said they want, in their own words (paraphrase if VN/EN mixed,
but stay faithful).

## 3. Business Problem Behind The Need

The real problem the client is trying to solve. If only the "solution" was
stated, mark it as a question for discovery (1.3). Each distinct problem here is
a future **GAP-NNN** candidate.

## 4. Target Users

| Role | Count estimate | Primary task |
| --- | --- | --- |
| <role> | <NN> | <task> |

## 5. Requested Features (Raw)

Bullet list, exactly as expressed. Do not refine — refining is discovery's job.

- <feature>
- <feature>

## 6. Project Type

Tick one. Drives template depth.

- [ ] Landing / marketing site
- [ ] Web app (single-purpose)
- [ ] SaaS MVP (multi-tenant)
- [ ] Internal tool / admin panel
- [ ] Automation / workflow tool
- [ ] AI app (LLM-backed UX)
- [ ] E-commerce
- [ ] Dashboard / analytics
- [ ] Mobile app
- [ ] Other: ____

## 7. Complexity Estimate

Tick one. Informs how heavy Build & Go-live conditional gates will be.

- [ ] Low — single role, no payment, no integration beyond auth + email
- [ ] Medium — multi-role, simple payment OR 1-2 integrations, basic admin
- [ ] High — multi-tenant OR role-permissions OR checkout OR 3+ integrations OR data-sensitive (PII, finance, health)
- [ ] Very high — regulated industry, real-time / streaming, mobile + web parity, > 10 integrations

## 8. Conditional Enterprise Probes

Catch these early to avoid rework after signing. Mark **N/A by decision** when
clearly not applicable (never silently drop) — they drive conditional gates in
Build & Go-live.

- [ ] **Brownfield** — replacing a legacy system → data migration + cutover needed? (Build 2.1b)
- [ ] **Compliance / data-residency / DPA** — regulated PII, jurisdiction constraints?
- [ ] **NFR / load** — declared performance / concurrency targets?
- [ ] **DR / RTO-RPO** — uptime + recovery commitments?
- [ ] **Accessibility (WCAG)** — required conformance level?

## 9. Timeline

| Item | Value |
| --- | --- |
| Stated deadline | YYYY-MM-DD |
| Reason behind deadline | <event / funding / season / arbitrary> |
| Feasibility read | realistic / tight / unrealistic |

## 10. Budget

| Item | Value |
| --- | --- |
| Stated budget range | <amount range, currency> |
| Read vs scope | adequate / underfunded / generous |
| Payment instrument confirmed | yes / no |

If "no stated budget", flag in § 13 — proceeding without a range usually wastes
both sides' time.

## 11. Red Flags

Tick all that apply. 2+ usually means decline or heavily renegotiate.

- [ ] Decision-maker not in the conversation
- [ ] Wants fixed price for unclear scope
- [ ] "Should be easy to copy <much larger product>"
- [ ] Multiple previous vendors ("the last guy quit")
- [ ] Budget < 30% of normal range for this type
- [ ] Deadline impossible regardless of budget
- [ ] Asks to skip contract / "just trust me"
- [ ] Wants to own vendor's reusable components
- [ ] Cannot articulate the business problem, only the solution
- [ ] Insists on a stack the vendor cannot maintain

## 12. Green Flags

- [ ] Clear business outcome metric
- [ ] Open to scope tradeoffs to fit budget/timeline
- [ ] Existing assets ready (brand, content, sample data)
- [ ] Past project went well
- [ ] Willing to sign + pay deposit before build (PB-G4)
- [ ] Names a single decision-maker

## 13. Open Questions For Discovery

Questions to resolve BEFORE the scope baseline. Group by topic to speed the
discovery call (1.3, `discovery-interview-playbook`).

- Business goal: <q>
- User & role: <q>
- Data: <q>
- Workflow: <q>
- Admin / permission: <q>
- Payment / billing: <q>
- Content / media: <q>
- Third-party integration: <q>
- Deadline / budget: <q>
- Success criteria: <q>

## 14. Initial Risk Read

| Risk | Likelihood | Impact | Mitigation if proceeding |
| --- | --- | --- | --- |
| Scope creep | <low/med/high> | <low/med/high> | Frozen scope at PB-G2 + change-request-log |
| Payment delay | | | Milestone-gated payment in bao-gia / SOW |
| Content delays | | | Client responsibilities clause |
| Tech risk (unknown integration) | | | Spike during discovery before pricing |

## 15. Recommendation (PB-G1)

Tick one. This is the internal go/no-go — it does **not** page the client.

- [ ] **Proceed to discovery** — run `discovery-interview-playbook` (1.3) → gap analysis (1.4).
- [ ] **Proceed with conditions** — resolve <items> first (budget range, decision-maker presence).
- [ ] **Park** — fit/timing wrong. Follow-up date: YYYY-MM-DD.
- [ ] **Decline** — fails red-flag / budget / feasibility gate.

Reason (one paragraph):

<text>

## 16. Decline / Park Reply (if applicable)

```text
Subject: <project> — appreciate the conversation

Hi <client>,

Thanks for the detailed brief. After thinking about it, I'm <not the right
fit / not able to take this on this quarter> because <one specific reason —
capacity / scope mismatch / domain fit>.

<If parking: I'd be glad to revisit after <date>. I'll reach out then.>
<If declining: a couple of options that might fit better: <referral>.>

Wishing the project well.

— <vendor>
```

---

**Pointers**

- Discovery interview: `docs/playbooks/discovery-interview-playbook.md` (5 personas × 3 modes).
- Next (BA spine): gap analysis `docs/mau-tai-lieu/gap-analysis.md` (mints GAP-NNN).
- Token chain: `docs/about/TRACE_SPEC.md`.
- Localization: forks to `docs/mau-tai-lieu/locale-vi/client-intake-brief.md` (D4).
