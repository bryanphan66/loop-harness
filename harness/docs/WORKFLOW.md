# Workflow

The **3-macro-stage** delivery map for solo-dev paid-client work. Replaces the
older 13-stage flow by grouping it into **(1) Pre-Build**, **(2) Build &
Go-live**, **(3) Post-Build**, each driven by named SDLC roles.

**Authority:** `PROPOSAL.md` §2–§4 (approved step tables) + §8 (locked decisions
D1–D6). When this file disagrees with `PROPOSAL.md`, the proposal wins.

**Current stage:** read `STAGE.md` at repo root. Updated at every stage-boundary
commit.

**Build scope of this increment:** **Pre-Build is built FULLY** (templates,
playbooks, goals). **Build & Go-live + Post-Build are MAPPED here** (full step
tables) but their detailed templates/playbooks/goals are **stubbed** — marked
*"built in next macro-stage increment"*.

Each step table column: **# · Step · Role · Engine · Inputs · Output path · Gate
· Manual?**. *Engine* names the `ck-*` skill or global agent that performs the
step (the live engine — never vendored; see `docs/HARNESS.md` § Independence
Principle). *Manual?* = does the step page the client for offline action.

## TL;DR Flow

```text
MACRO 1 — PRE-BUILD  (no build code until PB-G4)
  A. PM Intake        1.1 capture → 1.2 intake brief ........ PB-G1 (internal)
  B. BA Core Docs     1.3 discovery → 1.9 feature register .. PB-G2 (CLIENT: scope frozen)
  C. Design Prototype 1.10 brand → 1.13 freeze ............... PB-G3 (CLIENT: prototype frozen)
  D. Freeze+Quote     1.14 bao-gia → 1.15 contract+deposit ... PB-G4 (CLIENT: hard line)
        │  invariant: PROTOTYPE-THEN-QUOTE — PB-G3 before 1.14
        ▼
MACRO 2 — BUILD & GO-LIVE   [next-increment detail]
  2.1 ERD freeze (SA) → 2.2 stack/threat-model (Tech Lead) → 2.3 DoR
  → 2.4 env/CI/obs → 2.5 seed → 2.6 code → 2.7 review → 2.8 E2E
  → 2.9 security sign-off → 2.10 QA (DoD) → 2.11 go-live readiness
  → 2.12 UAT + sign-off (ACCEPTANCE, CLIENT) → 2.13 release
        ▼
MACRO 3 — POST-BUILD        [next-increment detail]
  3.1 handover (HANDOVER, CLIENT) → 3.2 hypercare → 3.3 steady-state
  → 3.4 maintenance proposal → 3.5 change-control (always-on) → 3.6 retro
```

---

## Macro-Stage 1 — PRE-BUILD *(built fully)*

**Goal:** raw lead → frozen scope baseline + signed contract + full-function
prototype. **No build code** before the client signs (a) every BLOCKER
clarification, (b) the feature-register, (c) the prototype, (d) the bao-gia +
contract + deposit.

**Exit invariant (PROTOTYPE-THEN-QUOTE):** freeze prototype (PB-G3) **before**
the bao-gia (1.14), so the quote anchors to a frozen visual contract — the #1
defense against scope dispute.

### BLOCK A — PM Intake

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 1.1 | Lead capture + intake raw files | PM | `ck-intake-file` · `project-manager` | client email/chat/docs | `docs/discovery/YYYY-MM-DD-<slug>.{ext}` (append-only) + Source Map | — (required even when self-initiated) | no |
| 1.2 | Intake brief go/no-go | PM | `project-manager` | discovery raw | `docs/intake/…-intake-brief.md` (`locale-vi/`) | **PB-G1** intake go/no-go — *internal capture, does NOT page client* | no |

### BLOCK B — BA Core Docs *(load-bearing spine)*

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 1.3 | Discovery interview (5 persona × 3 mode) | BA | `ck-rri` + discovery-interview-playbook | intake brief + raw | `docs/intake/…-discovery-summary.md` | persona coverage / time-box | no |
| 1.4 | Gap analysis As-Is/To-Be MoSCoW | BA | `researcher` · gap-analysis-playbook | discovery summary | `docs/requirements/gap-analysis.md` (mints **GAP-NNN**) (`locale-vi/`) | review round → freeze (max 2 rounds) | no |
| 1.5 | SRS IEEE-830 per module + REQ-ID | BA | `ck-xre EXTRACT` | gap analysis + raw | `docs/requirements/srs/<module>.md` + `nfr/` + `permissions/` + `data-model.md` + README | every req has **REQ-ID** `MODULE.AREA.NN` | no |
| 1.6 | Validate SRS + resolve BLOCKERs | BA | `ck-xre VALIDATE→RESOLVE-PATCH` | SRS | `docs/requirements/CLARIFICATIONS.md` (BLOCKER/IMPORTANT/NICE) | *(rolled into PB-G2)* | no |
| 1.7 | Vision / use-cases / glossary / BPMN / RTM | BA | `researcher` + `docs-manager`; `tech-graph` (BPMN) | SRS + clarifications | `VISION_SCOPE.md`, `use-cases/USE_CASES.md`, `GLOSSARY.md` (bilingual), `BPMN_DIAGRAMS.md`, `traceability/RTM.md` | **RTM completeness**: every feature → ≥1 REQ-ID + ≥1 use case | no |
| 1.8 | Scenario edge-case (high-risk reqs only) | BA | `ck-scenario` (12 dims) | high-risk REQ-IDs | `docs/requirements/scenarios/*.md` (mints **SC-NNN**) | each high-risk req decomposed or skip recorded | no |
| 1.9 | Feature register + scope baseline | BA + PM | `ck-scope-package` *(register + scope baseline)* | RTM + SRS + scenarios | `docs/scope-baseline/feature-register.{md,xlsx}` + scope matrix (`locale-vi/`) | **PB-G2 (CLIENT) — scope frozen** = BLOCKERs answered (1.6) + feature-register frozen | **yes** |

### BLOCK C — Design Prototype

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 1.10 | **3-tier design system** — Tier-1 pin + Tier-2 tokens + Tier-3 inventory | Designer | `ck-brand-guidelines` → `ck-design-system` · `ui-styling` | scope baseline + SRS | `docs/design/brand-guidelines.md` + tokens + `design-guidelines.md` (§0 pins the `docs/design-system/design-rules.md` version) + `src/components/README.md` | **Component Coverage Matrix + Tier-1 version pinned** | no |
| 1.11 | Screen map / flows / RPM / status-flow / ERD draft | Designer | `ck-ux-design` + visual-and-behavioral-modeling | feature register + use-cases | `docs/visuals/diagrams/*` (`role-permission-matrix.md`, `status-flow.md`, `business-workflow.md` + **process-flagged** user-flows in `locale-vi/`) + `docs/visuals/diagrams/screen-inventory.md` | RPM + status-flow coverage; **flag process-complex features** (async / state-machine / branching / multi-actor) for the 1.13 client annex; **every grid/form screen → exactly one §4 floorplan (or CUSTOM per §4.7)** | no |
| 1.12 | **Prototype all functions** | Designer | **external design tool** — Claude Design / Open Design / Google Stitch / Pencil.dev · **or (TRIAL) Claude Code + taste skill → `board.html`** (default `design-taste-frontend`, BETA/swappable) | screen map + tokens; **repo attached** to tool, prompt = short pointer to `build-prompt-v<N>-*.md` | `docs/visuals/prototype/` + share URL · **or `prototype/board.html`** | each screen ≥1 sample-data + ≥1 empty/error; **prototype conforms to its assigned floorplan + design-system-compliance gate passes** | **yes** |
| 1.13 | Review loop (revise → **re-validate** → re-review) + **FREEZE** | Designer + PM | facilitation; **`CR-NN`** when feedback changes a feature (scope froze at PB-G2) | prototype + **process annex** (BPMN / status-flow / flagged user-flows) + client feedback | `docs/visuals/prototype/feedback-*.md` + `feedback-final.md` | **PB-G3 (CLIENT) — prototype frozen** in writing; **process-complex features confirmed vs their flow diagram** (process logic, not only screens); **each revised round re-passes design-system-compliance + floorplan conformance** before re-review; >2 rounds = scope problem | **yes** |

### BLOCK D — Freeze + Quote + Contract

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 1.14 | Bao-gia + technical overview + contract draft | PM | `project-manager` | frozen feature register + prototype | `docs/bao-gia/{01..05}.md` + PDF + `hop-dong-mau.docx` (`locale-vi/`) | every price line ↔ 1 feature-register row | no |
| 1.15 | **Sign contract + deposit (EXIT Pre-Build)** | PM + Release Mgr | `project-manager` · `git-manager` | signed bao-gia | signed contract + deposit; `docs/ROADMAP.md` skeleton | **PB-G4 (CLIENT, hardest) — contract + deposit: NO build code before this** | **yes** |

> **Conditional intake probes (mark N/A by decision if not applicable):** during
> discovery (1.3 / 1.6) also ask **compliance / data-residency / DPA** and
> **brownfield (replacing a legacy system → migration needed?)**. Catching these
> early avoids rework after signing.

---

## Macro-Stage 2 — BUILD & GO-LIVE *(mapped; detail in next increment)*

> **Detailed templates / playbooks / goal text for steps 2.1–2.13 are built in
> the next macro-stage increment.** The step table below is authoritative for
> the map, gates, and roles.

**Entry:** PB-G4 passed (contract + deposit). **DoR:** requirements baselined,
scope signed, prototype frozen.
**Exit:** signed sign-off + go-live readiness PASS + every released REQ-ID in the
release note → production release. *(payment milestones attach here)*

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 2.1 | Solution/data arch — **freeze ERD** | **SA** | `ck-tech-design` (databases) + `tech-graph` | SRS data-model + use-cases | `docs/decisions/<slug>.md` + `docs/system-architecture.md` (ERD) | ERD review: entities, normalization, audit + tenant fields; **ERD FROZEN** | no |
| 2.1b | Data migration & cutover (brownfield) | SA + DevSecOps | `databases` + `devops` | legacy schema + ERD | migration plan + dry-run report | **CONDITIONAL — N/A by decision** (greenfield); else ETL + dry-run cutover + rollback-of-data + RTO/RPO | no |
| 2.2 | Technical design + choose stack (TDR) | **Tech Lead** | `ck-tech-design` + `ck-predict` | NFR + ERD | `docs/decisions/<slug>.md` (stack) + API contract | stack justified vs NFR, API contract complete, authz; **STRIDE threat-model here** | no |
| 2.3 | Implementation plan + DoR | Tech Lead + PM | `ck-plan` | TDR + scope baseline | `plans/<YYMMDD-HHMM>-<slug>/` | **DoR GATE**: baselined + signed + ERD frozen + design approved + acceptance criteria + NFR | no |
| 2.4 | Env + IaC + CI/CD + **observability/SLO** | DevSecOps | `devops` + `deploy` + `git` | plan | infra repo + pipeline | pipeline green, secret scan clean, env isolation, **alerting + SLO/error-budget live**, backup verified | no |
| 2.5 | Seed + foundation data | DevSecOps + Dev | `ck-seed` | ERD + RBAC | seed scripts | app boots with RBAC + admin; FK-valid | no |
| 2.6 | Code feature by phase | Fullstack Dev | `cook` → `fullstack-developer` → `code-simplifier` | plan + ERD + tokens | code commits + verification register rows | phase compiles/runs, verify-gate pass, commit cites ≥1 token; **floorplan classified (screen-inventory row) before coding any grid/form screen — all lanes**; **PUB ports the prototype export, APP/ADM rebuilds via design-system** (`playbooks/build-execution.md` § Prototype → Code Fidelity) | no |
| 2.7 | Code review (6-dim) | Tech Lead (reviewer) | `ck-code-review` | diff | review record | score ≥7, no dimension = 0; **+ Design-System Compliance FLOOR rule** (see note below) | no |
| 2.8 | E2E from BA docs + user manual | QC/QA | `ck-e2e-flow` (+ `ck-scenario`) | acceptance criteria | E2E tests + **TC-NNN** rows | every REQ-ID ≥1 E2E pass + TC row | no |
| 2.9 | Independent security review | DevSecOps (sec hat) | `ck-security` (STRIDE+OWASP, **red-team required**) | code + threat-model | security report | **SECURITY SIGN-OFF**: 0 Critical/High open | no |
| 2.10 | QA real-browser + video | QC/QA | `ck-qa` | running build | QA evidence | **DoD GATE**: review + E2E + security + QA evidence + user-manual + **design-system-compliance green per screen** | no |
| 2.11 | Go-live readiness | DevSecOps + PM | `ck-prod-readiness` (CI release-gate = source) | build + infra | readiness checklist | readiness green; **rollback rehearsed**; **DR restore-drill + RTO/RPO (CONDITIONAL — N/A by decision)**; **NFR/load test (CONDITIONAL — N/A by decision)** | no |
| 2.12 | **UAT + sign-off (one client session)** | BA + Release Mgr + Client | `ck-uat` → `ck-signoff` | running build + prototype | `docs/uat/*` + signed sign-off (`locale-vi/`) | **ACCEPTANCE (CLIENT)**: critical journeys pass + matches prototype + sign-off signed | **yes** |
| 2.13 | Release | Release Manager | `ship` + `deploy` | accepted build | release note + tag | release-note (every released REQ) + smoke pass; rollback = one `IMAGE_TAG` line | no |

> **Conditional enterprise gates (each marked N/A by decision if not needed —
> never silently dropped):** 2.1b data-migration/cutover · 2.11 NFR/load (k6 p95
> + Lighthouse) · 2.11 DR + RTO/RPO restore-drill (separate from rollback) ·
> Compliance/Privacy/WCAG (decide in-scope or N/A) · Contract/SLA terms *generated*
> (acceptance, IP/source ownership, liability, SLA — 3.2 depends on these).
> Red-team is **required** at the 3 high-risk gates: 2.2 (threat-model), 2.9
> (security), 2.10 (DoD).

> **Design-System Compliance is a code-review FLOOR rule (2.7).** It reuses the
> existing "any dimension scoring 0 is an automatic block" mechanic — it does
> **NOT** change the 6-dimension scoring or the **≥7** threshold. The floor:
> *a screen with no floorplan classification OR that violates its assigned §4
> floorplan / §7 action-placement / §8 modal rules = automatic merge block.*
> A missing `screen-inventory.md` classification for any grid/form screen is
> itself a block. Authority: Tier-1 `docs/design-system/design-rules.md`.

---

## Macro-Stage 3 — POST-BUILD *(mapped; detail in next increment)*

> **Detailed templates / playbooks / goal text for steps 3.1–3.6 are built in
> the next macro-stage increment.** The step table below is authoritative for
> the map, gates, and roles.

**Entry:** production deployed + sign-off signed. **Exit:** signed handover +
hypercare window closed within SLA (0 Critical open) → move to maintenance/SLA.
Change-control runs continuously, re-entering the pipeline at 2.3 / 2.6.

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 3.1 | Handover package | Support/SRE + PM | `ck-handover` | release + docs | `docs/handover/*` (`locale-vi/`) | **HANDOVER (CLIENT)**: receive docs/credentials/training/source-IP; every credential access-verified; **rotate secrets at handover** | **yes** |
| 3.2 | Hypercare + SLA window | Support/SRE | `ck-hypercare` + runbook | production | hypercare log | window closed, P1/P2 within SLA, 0 Critical open | no |
| 3.3 | Maintenance / monitoring / backup steady-state | DevSecOps | `ck-hypercare`, `ck-security` (periodic) | production | ops records | uptime within SLA, backup verified, patches applied | no |
| 3.4 | Maintenance proposal (recurring revenue) | PM | `maintenance-proposal.md` (`locale-vi/`) | hypercare results | `docs/handover/maintenance-proposal.md` | tier proposed; client decides | no |
| 3.5 | **Change control (always-on, ASYNC)** | BA + PM | `ck-xre CHANGE-REQUEST` + `audit-product-feature` | client request | `docs/requirements/change-requests/` (mints **CR-NN**) (`locale-vi/`) | impact + re-estimate + approval **before** code; *push notifier, does NOT block session* | **yes** |
| 3.6 | Retro + journal + agent memory | Docs/Audit | `retro` + `journal` | session history | `plans/reports/retro-<date>-<slug>.md` + changelog | lessons captured; memory persisted | no |

---

## Canonical Gate List

| Gate | Macro | Type | Clears when |
|---|---|---|---|
| **PB-G1** | Pre-Build | internal capture (no client page) | intake go/no-go decided (proceed / park / decline) |
| **PB-G2** | Pre-Build | **CLIENT** | scope frozen — BLOCKERs answered + feature-register frozen |
| **PB-G3** | Pre-Build | **CLIENT** | prototype frozen in writing |
| **PB-G4** | Pre-Build | **CLIENT** (hardest) | contract signed + deposit received — *no build code before this* |
| **DoR** | Build | internal | baselined + signed + ERD frozen + design approved + acceptance criteria + NFR |
| **ERD FROZEN** | Build | internal | entities / normalization / audit+tenant fields reviewed |
| **SECURITY SIGN-OFF** | Build | internal | 0 Critical/High open (red-team required) |
| **DoD** | Build | internal | review + E2E + security + QA evidence + user-manual + design-system-compliance green per screen |
| **Design-System Compliance** | Build | internal (floor-rule auto-block) | every grid/form screen classified to one §4 floorplan (or CUSTOM) + obeys §4/§7/§8 rules — enforced as a 2.7 code-review floor rule + a DoD line; missing classification or a §4/§7/§8 violation = automatic merge block |
| **ACCEPTANCE** | Build | **CLIENT** | critical journeys pass + matches prototype + sign-off signed |
| **HANDOVER** | Post-Build | **CLIENT** | docs/credentials/training/source-IP received + verified + secrets rotated |

**Conditional enterprise gates** (Build/Post-Build) — each must be explicitly
marked **N/A by decision** when not applicable, never silently dropped:
data-migration/cutover (2.1b), NFR/load test (2.11), DR + RTO/RPO (2.11),
compliance/privacy/WCAG, observability/SLO (2.4 — usually always-on).

> **Client-paging gates** (page the human via `MANUAL_CHECKPOINT`): PB-G2,
> PB-G3, PB-G4, ACCEPTANCE, HANDOVER. PB-G1 is internal — it does **not** page.

---

## Always-On Layer

Independent of macro-stage, running across all three:

- **Change-control (async)** — any post-PB-G4 client request → CR-NN log; impact
  + re-estimate + approval **before** code; push-notifies the human, never
  blocks the session (step 3.5; re-enters at 2.3 / 2.6).
- **Audit trail** — every architecture/behavior choice → `docs/decisions/<slug>.md`
  (stable slug, never a number); every released REQ-ID → ≥1 TC-NNN; every
  multi-task session end → session-retrospective.
- **Stage-boundary commits** — each step that produces a repo artifact = one
  bundled commit at the step boundary. The same commit updates `STAGE.md`
  (current-stage pointer + History row) and `docs/ROADMAP.md` (module progress).
  Never split into a follow-up commit.

---

## Token Chain

End-to-end traceability (full spec: `docs/TRACE_SPEC.md`). The canonical scheme
(D3) — **the only scheme; do NOT use `US-NNN.REQ-MMM`**:

```text
business problem            (1.2 intake brief)
    ↓ analysed by gap analysis (1.4)
GAP-NNN                     (docs/requirements/gap-analysis.md)
    ↓ becomes requirement
REQ-ID = MODULE.AREA.NN     (1.5 SRS, e.g. IF.AUTH.01)
    ↓ realised + traced
use case + RTM row          (1.7 use-cases + traceability/RTM.md)
    ↓ decomposed (high-risk reqs)
SC-NNN                      (1.8 scenarios)
    ↓ confirmed in scope
feature-register line       (1.9 feature-register.{md,xlsx})
    ↓ priced
SOW / bao-gia line          (1.14 bao-gia)
    ↓ proven (Build)
TC-NNN                      (2.8 E2E + verification register)
    ↓ validated (Build)
UAT (2.12) → release-note (2.13) → handover (3.1)
```

**Change requests** mint `CR-NN` (3.5) and, when approved, mint new REQ-IDs that
re-enter the chain at 1.5 (mid-build: at 2.3/2.6).

**RTM completeness rule:** every feature-register line traces back to ≥1 REQ-ID
and ≥1 use case, and forward to ≥1 TC-NNN before ACCEPTANCE. The verify-gate
reads this rule.

---

## Quick Links

- **Authority:** `PROPOSAL.md` §2–§4, §8
- **Operating model:** `docs/HARNESS.md`
- **Roles:** `docs/ROLE_MAP.md`
- **Token grammar:** `docs/TRACE_SPEC.md`
- **Docs crosswalk:** `docs/README.md`
- **Per-project stage tracker:** `docs/templates/STAGE.md`
