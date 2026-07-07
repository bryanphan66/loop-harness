# Workflow

The **3-macro-stage** delivery map for solo-dev (agent-driven) product work:
**(1) Pre-Build**, **(2) Build & Go-live**, **(3) Post-Build**, each driven by
named SDLC roles. All three macro-stages are **built fully** — every step has a
goal block in `docs/STAGE_GOALS.md` and can be run by `/stage-next` (and, for
2.6, the `/build-phase` loop).

**Authority:** this file. Per-step goal text: `docs/STAGE_GOALS.md`. Current
stage: read `STAGE.md` at repo root — updated at every stage-boundary commit.

Each step table column: **# · Step · Role · Engine · Inputs · Output path · Gate
· Manual?**. *Engine* names the `ck-*` skill or global agent that performs the
step (the live engine — never vendored; see `docs/HARNESS.md` § Independence
Principle). *Manual?* = does the step page the client/owner for offline action.

---

## Lanes

Every project declares a **Lane** in `STAGE.md` Snapshot at intake. The lane
decides how heavy Macro 1 runs; Macro 2 and 3 are identical in both lanes.

| | **Full** (paid client) | **Lite** (internal / small) |
|---|---|---|
| Who | external paying client | your own product, internal tool, small trusted engagement |
| Macro-1 steps | 1.1–1.15 as tabled below | merged/reduced route below |
| Client-paging gates | PB-G1..G4 as tabled | collapse to **owner acks** (still recorded in writing) |
| Quote/contract (1.14/1.15) | required | **N/A-by-decision auto** — recorded, then straight to 2.1 |

**Lite route (replaces the Macro-1 table rows it names; all other invariants
hold):**

1. **1.1+1.2 merged intake** — raw inputs land append-only in `docs/discovery/`
   + ONE combined intake brief with the go/no-go decision (PB-G1, internal).
2. **1.5-lite SRS-lite** — `docs/requirements/srs-lite.md` from
   `docs/templates/srs-lite.md`: module list + one REQ-ID table
   (`MODULE.AREA.NN`, full grammar) + NFR one-liners. Scenarios (1.8) run **only
   for high-risk reqs** (money / auth / async / destructive); everything else is
   skipped with one recorded line. 1.3/1.4/1.6/1.7 fold into this step: open
   questions go in an "Open questions" section, no separate gap-analysis or RTM
   files (**GAP-NNN optional in Lite — the token chain may start at REQ-ID**).
3. **1.9-lite feature list** — the feature table inside srs-lite (or a short
   `docs/scope-baseline/feature-register.md`) frozen by **owner ack** = PB-G2.
4. **1.10-lite design tokens** — Tier-2 tokens + **Tier-1 pin only** (record the
   `docs/design-system/VERSION` pin); skip brand book + Component Coverage
   Matrix. Screen inventory + floorplan classification (1.11) stays
   **mandatory** for every grid/form screen.
5. **1.12 prototype, ONE round** — then **1.13 freeze by owner ack** = PB-G3.
   **Internal-product substitution:** a Lite internal product (no external
   client to show) may substitute the classified screen inventory (1.11) + a
   written per-screen states contract (sample-data + empty/error states
   described per screen) for the visual prototype — record
   `1.12 — N/A by decision (written screen specs substitute)` at the PB-G3
   freeze. Floorplan classification + the design-system gate still apply.
6. **1.14 / 1.15 skipped — N/A-by-decision auto** (record one line in STAGE.md
   Snapshot). Proceed to **2.1**.

**Lite keeps, non-negotiable:** REQ-ID grammar, screen-inventory floorplan
classification, the token chain (REQ-ID → TC-NNN minimum), stage-boundary
commits, the verify-gate, N/A-by-decision recording.

---

## TL;DR Flow

```text
MACRO 1 — PRE-BUILD  (Full lane: no build code until PB-G4; Lite: until PB-G3-lite)
  A. PM Intake        1.1 capture → 1.2 intake brief ........ PB-G1 (internal)
  B. BA Core Docs     1.3 discovery → 1.9 feature register .. PB-G2 (CLIENT: scope frozen)
  C. Design Prototype 1.10 brand → 1.13 freeze ............... PB-G3 (CLIENT: prototype frozen)
  D. Freeze+Quote     1.14 bao-gia → 1.15 contract+deposit ... PB-G4 (CLIENT: hard line)
        │  invariant: PROTOTYPE-THEN-QUOTE — PB-G3 before 1.14
        │  (Lite lane: A+B merged, D skipped N/A-by-decision)
        ▼
MACRO 2 — BUILD & GO-LIVE
  2.1 ERD freeze (SA) → 2.2 stack/threat-model (Tech Lead)
  → 2.3 plan + BUILD MANIFEST + DoR → 2.4 walking skeleton + env/CI (P0)
  → 2.5 seed → 2.6 /build-phase loop P1..PN (per-phase verify)
  → 2.7 review (manifest-complete) → 2.8 E2E → 2.9 security sign-off
  → 2.10 QA (DoD) → 2.11 go-live readiness
  → 2.12 UAT + sign-off (ACCEPTANCE, CLIENT) → 2.13 release
        ▼
MACRO 3 — POST-BUILD
  3.1 handover (HANDOVER, CLIENT) → 3.2 hypercare → 3.3 steady-state
  → 3.4 maintenance proposal → 3.5 change-control (always-on) → 3.6 retro
```

---

## Macro-Stage 1 — PRE-BUILD

**Goal:** raw lead → frozen scope baseline + frozen full-function prototype
(+ signed contract in the Full lane). **No build code** before the freeze gates
clear.

**Exit invariant (PROTOTYPE-THEN-QUOTE, Full lane):** freeze prototype (PB-G3)
**before** the bao-gia (1.14), so the quote anchors to a frozen visual contract
— the #1 defense against scope dispute.

### BLOCK A — PM Intake

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 1.1 | Lead capture + intake raw files | PM | `ck-intake-file` · `project-manager` | client email/chat/docs | `docs/discovery/YYYY-MM-DD-<slug>.{ext}` (append-only) + Source Map (`docs/discovery/README.md § Source Map`) | — (required even when self-initiated) | no |
| 1.2 | Intake brief go/no-go **+ Lane declaration** | PM | `project-manager` | discovery raw | `docs/intake/…-intake-brief.md` (`locale-vi/`) | **PB-G1** intake go/no-go — *internal capture, does NOT page client*; Lane recorded in STAGE.md | no |

### BLOCK B — BA Core Docs *(load-bearing spine; Lite lane: replaced by 1.5-lite + 1.9-lite)*

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 1.3 | Discovery interview (5 persona × 3 mode) | BA | `ck-rri` + discovery-interview-playbook | intake brief + raw | `docs/intake/…-discovery-summary.md` | persona coverage / time-box | no |
| 1.4 | Gap analysis As-Is/To-Be MoSCoW | BA | `researcher` · gap-analysis-playbook | discovery summary | `docs/requirements/gap-analysis.md` (mints **GAP-NNN**) (`locale-vi/`) | review round → freeze (max 2 rounds) | no |
| 1.5 | SRS IEEE-830 per module + REQ-ID | BA | `ck-xre EXTRACT` | gap analysis + raw | `docs/requirements/srs/<module>.md` + `nfr/` + `permissions/` + `data-model.md` + README | every req has **REQ-ID** `MODULE.AREA.NN` | no |
| 1.6 | Validate SRS + resolve BLOCKERs | BA | `ck-xre VALIDATE→RESOLVE-PATCH` | SRS | `docs/requirements/CLARIFICATIONS.md` (BLOCKER/IMPORTANT/NICE) | *(rolled into PB-G2)* | no |
| 1.7 | Vision / use-cases / glossary / BPMN / RTM | BA | `researcher` + `docs-manager`; `tech-graph` (BPMN) | SRS + clarifications | `VISION_SCOPE.md`, `use-cases/USE_CASES.md`, `GLOSSARY.md` (bilingual), `BPMN_DIAGRAMS.md`, `traceability/RTM.md` | **RTM completeness**: every feature → ≥1 REQ-ID + ≥1 use case | no |
| 1.8 | Scenario edge-case (high-risk reqs only) | BA | `ck-scenario` (12 dims) | high-risk REQ-IDs | `docs/requirements/scenarios/*.md` (mints **SC-NNN**) | each high-risk req decomposed or skip recorded | no |
| 1.9 | Feature register + scope baseline | BA + PM | `ck-scope-package` | RTM + SRS + scenarios | `docs/scope-baseline/feature-register.{md,xlsx}` + scope matrix (`locale-vi/`) | **PB-G2 (CLIENT) — scope frozen** = BLOCKERs answered (1.6) + feature-register frozen | **yes** |

### BLOCK C — Design Prototype *(Lite lane: 1.10-lite, 1.12 one round)*

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 1.10 | **3-tier design system** — Tier-1 pin + Tier-2 tokens + Tier-3 inventory | Designer | `ck-brand-guidelines` → `ck-design-system` · `ui-styling` | scope baseline + SRS | `docs/design/brand-guidelines.md` + tokens + `design-guidelines.md` (§0 pins the `docs/design-system/design-rules.md` version) + `src/components/README.md` | **Component Coverage Matrix + Tier-1 version pinned** | no |
| 1.11 | Screen map / flows / RPM / status-flow / ERD draft | Designer | `ck-ux-design` + visual-and-behavioral-modeling | feature register + use-cases | `docs/visuals/diagrams/*` (RPM, status-flow, business-workflow + process-flagged user-flows in `locale-vi/`) + `docs/visuals/diagrams/screen-inventory.md` | RPM + status-flow coverage; **every grid/form screen → exactly one §4 floorplan (or CUSTOM per §4.7)** — all lanes | no |
| 1.12 | **Prototype all functions** | Designer | external design tool (Claude Design / Open Design / Google Stitch / Pencil.dev) · or (TRIAL) Claude Code + taste skill → `board.html` | screen map + tokens; repo attached to tool, prompt = short pointer to `build-prompt-v<N>-*.md` | `docs/visuals/prototype/` + share URL · or `prototype/board.html` | each screen ≥1 sample-data + ≥1 empty/error; conforms to its floorplan + design-system-compliance gate passes | **yes** |
| 1.13 | Review loop (revise → re-validate → re-review) + **FREEZE** | Designer + PM | facilitation; **`CR-NN`** when feedback changes a feature | prototype + process annex + client feedback | `docs/visuals/prototype/feedback-*.md` + `feedback-final.md` | **PB-G3 (CLIENT) — prototype frozen** in writing; process-complex features confirmed vs their flow diagram; >2 rounds = scope problem (Lite: 1 round, owner ack) | **yes** |

### BLOCK D — Freeze + Quote + Contract *(Full lane only — Lite marks both N/A-by-decision and jumps to 2.1)*

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 1.14 | Bao-gia + technical overview + contract draft | PM | `project-manager` | frozen feature register + prototype | `docs/bao-gia/{01..05}.md` + PDF + contract draft (`locale-vi/`) | every price line ↔ 1 feature-register row | no |
| 1.15 | **Sign contract + deposit (EXIT Pre-Build)** | PM + Release Mgr | `project-manager` · `git-manager` | signed bao-gia | signed contract + deposit; `docs/ROADMAP.md` skeleton | **PB-G4 (CLIENT, hardest) — contract + deposit: NO build code before this** | **yes** |

> **Conditional intake probes (mark N/A by decision if not applicable):** during
> discovery also ask **compliance / data-residency / DPA** and **brownfield
> (replacing a legacy system → migration needed?)**.

---

## Macro-Stage 2 — BUILD & GO-LIVE

**Entry:** PB-G4 passed (Full lane) or PB-G3-lite frozen + 1.14/1.15 marked
N/A-by-decision (Lite lane).
**Exit:** signed sign-off + go-live readiness PASS + every released REQ-ID in the
release note → production release. *(payment milestones attach here in Full)*

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 2.1 | Solution/data arch — **freeze ERD** | **SA** | `ck-tech-design` (databases) + `tech-graph` | SRS(-lite) data-model + use-cases + screen inventory | `docs/decisions/<slug>.md` + `docs/system-architecture.md` (ERD) | ERD review: entities, normalization, audit + tenant fields; **ERD FROZEN** | no |
| 2.1b | Data migration & cutover (brownfield) | SA + DevSecOps | `databases` + `devops` | legacy schema + ERD | migration plan + dry-run report | **CONDITIONAL — N/A by decision** (greenfield); else ETL + dry-run cutover + rollback-of-data + RTO/RPO | no |
| 2.2 | Technical design + choose stack (TDR) | **Tech Lead** | `ck-tech-design` + `ck-predict` | NFR + ERD | `docs/decisions/<slug>.md` (stack) + API contract | stack justified vs NFR (**default = the shipped walking-skeleton stack template**; deviations need the ADR to say why), API contract complete, authz; **STRIDE threat-model here** | no |
| 2.3 | Implementation plan + **BUILD MANIFEST** + DoR | Tech Lead + PM | `ck-plan` + build-manifest-compilation playbook | TDR + scope baseline + ERD + screen inventory | `plans/<YYMMDD-HHMM>-<slug>/` + **`docs/build-manifest.md`** | **DoR GATE** (`docs/gates/dor-build.md`): baselined + ERD frozen + design approved + acceptance criteria + NFR **+ build-manifest complete: every in-scope REQ-ID in exactly one phase, P0 defined** | no |
| 2.4 | **Walking skeleton** (manifest **P0**) + env + CI/CD + observability | DevSecOps | stack template `scaffold.sh` + `devops` + `deploy` | stack decision + manifest P0 | scaffolded monorepo + pipeline + compose | **WALKING SKELETON**: `install && build` green, `docker compose up` boots, health OK, CI(-equivalent local) green, secret scan clean; alerting/SLO live or N/A-by-decision | no |
| 2.5 | Seed + foundation data | DevSecOps + Dev | `ck-seed` + seed-data-pattern | ERD + RBAC | seed scripts (extends the template's admin seed to the domain) | app boots with RBAC + **seeded admin login works**; FK-valid; P0 marked done in manifest | no |
| 2.6 | **Code feature by phase — `/build-phase` loop P1..PN** | Fullstack Dev | `/build-phase` → `fullstack-developer` (·`cook`) | build-manifest + ERD + SRS module file(s) + screen-inventory rows + **prototype export files** + tokens | code commits + verification-register rows + manifest progress | per phase: compiles/runs, `validate:quick` green, e2e smoke for the phase's journeys, **floor self-check** (design-system floor rules + **visual-fidelity self-check** — screens ported from the export per `build-execution.md` § Prototype → Code Fidelity), commit cites ≥1 token, phase marked done in manifest | no |
| 2.7 | Code review (6-dim) — **once at manifest completion** (+ mid-point if >6 phases) | Tech Lead (reviewer) | `ck-code-review` | full diff since P0 | review record | score ≥7, no dimension = 0; **+ FLOOR rules: Design-System Compliance · Visual Fidelity · no generic error-swallow** (note below) + systemic-pattern sweep | no |
| 2.8 | E2E from BA docs + user manual | QC/QA | `ck-e2e-flow` (+ `ck-scenario`) | acceptance criteria | E2E tests + **TC-NNN** rows | every REQ-ID ≥1 E2E pass + TC row (phase smokes from 2.6 count when they map to a REQ-ID); **+ Mandatory Coverage Rules** (canonical-e2e playbook): negative-path e2e for every failable op asserting the REAL cause surfaces; every auth method login→data-load (200) + cookie-hygiene switch case | no |
| 2.9 | Independent security review — **once, after manifest complete** | DevSecOps (sec hat) | `ck-security` (STRIDE+OWASP, **red-team required**) | code + threat-model | security report | **SECURITY SIGN-OFF**: 0 Critical/High open | no |
| 2.10 | QA real-browser + video | QC/QA | `ck-qa` | running build + prototype exports | QA evidence + filled `docs/gates/visual-fidelity.md` | **DoD GATE** (`docs/gates/dod-build.md`): review + E2E + security + QA evidence + user-manual + design-system-compliance green per screen + **visual-fidelity pass per key screen** (app screenshot vs export render side-by-side); PUB product-shots captured after the APP screens they depict | no |
| 2.11 | Go-live readiness | DevSecOps + PM | `ck-prod-readiness` | build + infra | readiness checklist | readiness green; **rollback rehearsed**; **DR restore-drill + RTO/RPO (CONDITIONAL — N/A by decision)**; **NFR/load test (CONDITIONAL — N/A by decision)** | no |
| 2.12 | **UAT + sign-off (one client session)** | BA + Release Mgr + Client | `ck-uat` → `ck-signoff` | running build + prototype | `docs/uat/*` + signed sign-off (`locale-vi/`) | **ACCEPTANCE (CLIENT)**: critical journeys pass + matches prototype + sign-off signed (Lite: owner runs UAT + ack) | **yes** |
| 2.13 | Release | Release Manager | `ship` + `deploy` | accepted build | release note + tag | release-note (every released REQ) + smoke pass; rollback = one `IMAGE_TAG` line | no |

> **Build Manifest (step 2.3 output — the spec→code conversion layer).** ONE
> file, `docs/build-manifest.md` (template:
> `docs/templates/build-manifest.md`, playbook:
> `docs/playbooks/build-manifest-compilation.md`), compressing the whole BA
> spine into ordered executable phases **P0..PN**. P0 = walking skeleton
> (scaffolded from the stack template). Each later phase: REQ-IDs covered,
> entities, endpoints, screens (+floorplan class), concrete acceptance checks,
> verify commands, size S/M/L. **A phase must be completable in one agent
> session (≤~10 files touched) — split it otherwise.** A build agent reads its
> phase block + the files that block names — never the whole spine.

> **Gate rebalance (per-phase vs once).** During 2.6, every phase runs the
> **light floor self-check**: `validate:quick` + the design-system floor rules
> (§4 floorplan / §7 actions / §8 modals for touched screens) + the phase's e2e
> smoke. The **heavy** gates — 2.7 six-dimension review, 2.9 security review,
> 2.10 full QA — run **once when the manifest is complete**, plus one mid-point
> 2.7 review if the manifest has more than 6 phases. Do not page a full review
> per phase; do not skip the floor self-check on any phase.

> **Conditional enterprise gates (each marked N/A by decision if not needed —
> never silently dropped):** 2.1b data-migration/cutover · 2.11 NFR/load (k6 p95
> + Lighthouse) · 2.11 DR + RTO/RPO restore-drill (separate from rollback) ·
> Compliance/Privacy/WCAG · Contract/SLA terms generated (Full lane).
> Red-team is **required** at the 3 high-risk gates: 2.2 (threat-model), 2.9
> (security), 2.10 (DoD).

> **Design-System Compliance is a code-review FLOOR rule (2.7) and a per-phase
> self-check rule (2.6).** It reuses the "any dimension scoring 0 is an
> automatic block" mechanic — it does **NOT** change the 6-dimension scoring or
> the **≥7** threshold. The floor: *a screen with no floorplan classification OR
> that violates its assigned §4 floorplan / §7 action-placement / §8 modal rules
> = automatic merge block.* A missing `screen-inventory.md` classification for
> any grid/form screen is itself a block. Authority: Tier-1
> `docs/design-system/design-rules.md`.

> **Two more floor rules ride the same mechanic (2.6 self-check + 2.7 block +
> a DoD line):** **Visual Fidelity** — an APP/ADM screen structurally/visually
> divergent from its prototype export render, or lacking both an export-source
> citation and a recorded `rebuild (decision: <slug>)` marker, = automatic block
> (`docs/gates/visual-fidelity.md`; port-first default:
> `docs/playbooks/build-execution.md` § Prototype → Code Fidelity). **No generic
> error-swallow** — a user-facing failure surfacing a generic message instead of
> its real cause = automatic block (`docs/playbooks/code-review-scoring.md`);
> 2.8 proves the surfacing with negative-path e2e.

---

## Macro-Stage 3 — POST-BUILD

**Entry:** production deployed + sign-off signed. **Exit:** signed handover +
hypercare window closed within SLA (0 Critical open) → move to maintenance/SLA.
Change-control runs continuously, re-entering the pipeline at 2.3 / 2.6.

| # | Step | Role | Engine | Inputs | Output path | Gate | Manual? |
|---|---|---|---|---|---|---|---|
| 3.1 | Handover package | Support/SRE + PM | `ck-handover` | release + docs | `docs/handover/*` (`locale-vi/`) | **HANDOVER (CLIENT)**: receive docs/credentials/training/source-IP; every credential access-verified; **rotate secrets at handover** (Lite: internal handover note; gate = owner ack) | **yes** |
| 3.2 | Hypercare + SLA window | Support/SRE | `ck-hypercare` + runbook | production | hypercare log | window closed, P1/P2 within SLA, 0 Critical open | no |
| 3.3 | Maintenance / monitoring / backup steady-state | DevSecOps | `ck-hypercare`, `ck-security` (periodic) | production | ops records | uptime within SLA, backup verified, patches applied | no |
| 3.4 | Maintenance proposal (recurring revenue) | PM | `maintenance-proposal.md` (`locale-vi/`) | hypercare results | `docs/handover/maintenance-proposal.md` | tier proposed; client decides (Lite: N/A-by-decision allowed) | no |
| 3.5 | **Change control (always-on, ASYNC)** | BA + PM | `ck-xre CHANGE-REQUEST` | client request | `docs/requirements/change-requests/` (mints **CR-NN**) (`locale-vi/`) | impact + re-estimate + approval **before** code; *push notifier, does NOT block session* | **yes** |
| 3.6 | Retro + journal + agent memory | Docs/Audit | `retro` + `journal` | session history | `plans/reports/retro-<date>-<slug>.md` + changelog | lessons captured; memory persisted | no |

---

## Canonical Gate List

| Gate | Macro | Type | Clears when |
|---|---|---|---|
| **PB-G1** | Pre-Build | internal capture (no client page) | intake go/no-go decided (proceed / park / decline) + Lane declared |
| **PB-G2** | Pre-Build | **CLIENT** (Lite: owner ack) | scope frozen — BLOCKERs answered + feature-register (or Lite feature list) frozen |
| **PB-G3** | Pre-Build | **CLIENT** (Lite: owner ack) | prototype frozen in writing |
| **PB-G4** | Pre-Build | **CLIENT** (hardest; Lite: N/A-by-decision auto) | contract signed + deposit received — *no build code before this (Full lane)* |
| **DoR** | Build | internal | baselined + ERD frozen + design approved + acceptance criteria + NFR + **build-manifest complete (every in-scope REQ-ID in exactly one phase, P0 defined)** |
| **ERD FROZEN** | Build | internal | entities / normalization / audit+tenant fields reviewed |
| **WALKING SKELETON** | Build | internal | scaffolded app installs, builds, boots via compose, health OK, seeded admin login works, CI(-equivalent local) green |
| **SECURITY SIGN-OFF** | Build | internal | 0 Critical/High open (red-team required) |
| **DoD** | Build | internal | review + E2E (incl. negative-path + auth-to-data coverage) + security + QA evidence + user-manual + design-system-compliance + visual-fidelity green per screen |
| **Design-System Compliance** | Build | internal (floor-rule auto-block) | every grid/form screen classified to one §4 floorplan (or CUSTOM) + obeys §4/§7/§8 rules — per-phase self-check (2.6) + 2.7 floor rule + a DoD line |
| **Visual Fidelity** | Build | internal (floor-rule auto-block) | every key APP/ADM screen matches its prototype export render (screenshot side-by-side), or carries a recorded rebuild decision — per-phase self-check (2.6) + 2.7 floor rule + 2.10 evidence pass + a DoD line (`docs/gates/visual-fidelity.md`) |
| **ACCEPTANCE** | Build | **CLIENT** (Lite: owner ack) | critical journeys pass + matches prototype + sign-off signed |
| **HANDOVER** | Post-Build | **CLIENT** (Lite: owner ack) | docs/credentials/training/source-IP received + verified + secrets rotated |

**Conditional enterprise gates** — each must be explicitly marked **N/A by
decision** when not applicable, never silently dropped: data-migration/cutover
(2.1b), NFR/load test (2.11), DR + RTO/RPO (2.11), compliance/privacy/WCAG,
observability/SLO (2.4 — usually always-on). **Lite lane auto-N/A:** 1.14, 1.15,
optionally 3.4 — still recorded.

> **Client-paging gates** (page the human via `MANUAL_CHECKPOINT`): PB-G2,
> PB-G3, PB-G4, ACCEPTANCE, HANDOVER. PB-G1 is internal — it does **not** page.
> In the **Lite lane** these page the **owner** instead of a client; a one-line
> written ack clears them.

---

## Always-On Layer

Independent of macro-stage, running across all three:

- **Change-control (async)** — any post-freeze client/owner request → CR-NN log;
  impact + re-estimate + approval **before** code; push-notifies the human,
  never blocks the session (step 3.5; re-enters at 2.3 / 2.6 — the manifest
  gains a new phase, never an in-place scope stretch).
- **Audit trail** — every architecture/behavior choice → `docs/decisions/<slug>.md`
  (stable slug, never a number); every released REQ-ID → ≥1 TC-NNN; every
  multi-task session end → session-retrospective.
- **Stage-boundary commits** — each step that produces a repo artifact = one
  bundled commit at the step boundary. The same commit updates `STAGE.md`
  (current-stage pointer + History row) and `docs/ROADMAP.md` (module progress).
  Never split into a follow-up commit. In 2.6, **each completed phase** is a
  stage-boundary commit (STAGE.md stays on 2.6 but its History gains a
  `2.6/P<N>` row; the manifest checkbox flips in the same commit). A
  stage-boundary commit that changes no module progress (doc-only or repair)
  still stages `docs/ROADMAP.md` — refresh its `Updated:` line so the file is
  honestly current; the verify-gate's atomicity check requires both staged.

---

## Token Chain

End-to-end traceability (full spec: `docs/TRACE_SPEC.md`). The canonical scheme
— **the only scheme; do NOT use `US-NNN.REQ-MMM`**:

```text
business problem            (1.2 intake brief)
    ↓ analysed by gap analysis (1.4; Lite lane: optional — chain may start at REQ-ID)
GAP-NNN                     (docs/requirements/gap-analysis.md)
    ↓ becomes requirement
REQ-ID = MODULE.AREA.NN     (1.5 SRS / 1.5-lite srs-lite, e.g. IF.AUTH.01)
    ↓ realised + traced
use case + RTM row          (1.7; Lite: the srs-lite table row)
    ↓ decomposed (high-risk reqs)
SC-NNN                      (1.8 scenarios)
    ↓ confirmed in scope
feature-register line       (1.9 / 1.9-lite)
    ↓ priced (Full lane)
SOW / bao-gia line          (1.14)
    ↓ compiled to build order
build-manifest phase        (2.3 — every in-scope REQ-ID in exactly one phase)
    ↓ proven (Build)
TC-NNN                      (2.6 phase smoke / 2.8 E2E + verification register)
    ↓ validated (Build)
UAT (2.12) → release-note (2.13) → handover (3.1)
```

**Change requests** mint `CR-NN` (3.5) and, when approved, mint new REQ-IDs that
re-enter the chain at 1.5 (mid-build: at 2.3 as a new manifest phase).

**RTM completeness rule:** every feature-register line traces back to ≥1 REQ-ID
and ≥1 use case, and forward to ≥1 TC-NNN before ACCEPTANCE. **Manifest
completeness rule (2.3):** every in-scope REQ-ID appears in exactly one manifest
phase. The verify-gate reads the RTM rule; the DoR gate reads the manifest rule.

---

## Quick Links

- **Per-step goal text:** `docs/STAGE_GOALS.md`
- **Operating model:** `docs/HARNESS.md`
- **Roles:** `docs/ROLE_MAP.md`
- **Token grammar:** `docs/TRACE_SPEC.md`
- **Build manifest:** template `docs/templates/build-manifest.md` · playbook `docs/playbooks/build-manifest-compilation.md`
- **SRS-lite (Lite lane):** `docs/templates/srs-lite.md`
- **Docs crosswalk:** `docs/README.md`
- **Per-project stage tracker:** `docs/templates/STAGE.md`
