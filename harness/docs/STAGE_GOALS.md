# Stage Goals

Per-step `/goal` condition text the human or the `stage-runner` subagent uses to
drive one workflow step to a verifiable finish. Use with the interactive
`/goal <condition>` command or headless `claude -p "/goal …"`.

**Authority:** `docs/WORKFLOW.md` step tables (Pre-Build 1.1–1.15 are
authoritative here). **Token grammar:** `docs/TRACE_SPEC.md` (`GAP-NNN → REQ-ID =
MODULE.AREA.NN → SC-NNN → TC-NNN`, `CR-NN` — never `US-NNN.REQ-MMM`).

**Substitute placeholders before pasting:**

- `{date}` → today, `YYYY-MM-DD`
- `{slug}` → project / change-request slug, kebab-case
- `{client}` → client name from the intake brief
- `{module}` → SRS module abbreviation (e.g. `IF`, `AUTH`, `PAY`)
- `{N}` → a turn cap appropriate to the step

**MANUAL_CHECKPOINT rule (every goal):** if the work needs offline human action
(signing, design tool, credentials, UAT), emit a `MANUAL_CHECKPOINT:` block per
`AGENTS.md` § Manual Checkpoint Signaling and stop the turn **without** satisfying
the goal. The next session resumes via `--resume` after the human returns. The
five client-paging gates are **PB-G2, PB-G3, PB-G4, ACCEPTANCE, HANDOVER**;
**PB-G1 is internal — it does NOT page the client.**

**Turn cap:** every goal ends with `Stop after {N} turns` so a mis-stated
condition cannot loop forever.

**Each entry below lists:** Goal · Inputs · Output path · Gate · Manual?

---

## Macro-Stage 1 — PRE-BUILD *(built fully)*

### Step 1.1 — Lead capture + intake raw files

- **Inputs:** client email / chat / dropped docs (PRD, screenshots, sheets).
- **Output path:** `docs/discovery/{date}-{slug}.{ext}` (append-only) + a Source Map.
- **Gate:** — (always required, even when self-initiated; no gate to clear).
- **Manual?** no.

Goal:
Every raw client input is filed under `docs/discovery/{date}-{slug}.{ext}` with
the date-prefix naming convention, append-only (no edits to prior inputs). A
Source Map lists each raw artifact, its type, and what it covers. No
interpretation or derivation yet. STAGE.md Snapshot shows Current = 1.2.
Stop after 8 turns.

### Step 1.2 — Intake brief go/no-go

- **Inputs:** `docs/discovery/*` raw inputs.
- **Output path:** `docs/intake/{date}-intake-brief.md` (`locale-vi/` fork for VN client).
- **Gate:** **PB-G1** intake go/no-go — *internal capture, does NOT page the client.*
- **Manual?** no.

Goal:
`docs/intake/{date}-intake-brief.md` exists with every section from the
client-intake-brief template filled from `docs/discovery/*`. A decision is
recorded: proceed / park / decline (PB-G1, internal — no client page). During
intake, the conditional probes are asked and recorded or marked N/A by decision:
compliance / data-residency / DPA, and brownfield (replacing a legacy system →
migration needed?). STAGE.md Snapshot shows Current = 1.3 if proceeding.
Stop after 10 turns.

### Step 1.3 — Discovery interview (5 persona × 3 mode)

- **Inputs:** intake brief + raw discovery inputs.
- **Output path:** `docs/intake/{date}-discovery-summary.md`.
- **Gate:** persona coverage / time-box.
- **Manual?** no.

Goal:
`docs/intake/{date}-discovery-summary.md` covers 5 personas (End User, BA, QA,
Developer, Operator) × 3 modes (Challenge, Guided, Explore) with a candidate
requirement list, a decisions log, and an open-questions section. Reads the
intake brief + raw inputs only — no new scope invented. STAGE.md Current = 1.4.
Stop after 12 turns.

### Step 1.4 — Gap analysis (As-Is / To-Be, MoSCoW)

- **Inputs:** discovery summary.
- **Output path:** `docs/requirements/gap-analysis.md` — mints **GAP-NNN** (`locale-vi/` fork).
- **Gate:** review round → freeze (max 2 rounds).
- **Manual?** no.

Goal:
`docs/requirements/gap-analysis.md` has the four-column BA layout (To-Be / As-Is /
Gap / Plan of Action with MoSCoW) and mints **GAP-NNN** ids for each gap. For a
greenfield project the As-Is column carries a one-line "greenfield, no As-Is"
note; To-Be and Plan of Action are still filled. A VN fork exists at
`docs/requirements/locale-vi/gap-analysis.md`. STAGE.md Current = 1.5.
Stop after 10 turns.

### Step 1.5 — SRS IEEE-830 per module + REQ-ID

- **Inputs:** gap analysis + raw inputs.
- **Output path:** `docs/requirements/srs/{module}.md` + `nfr.md` + `permissions.md` + `data-model.md` + `srs/README.md`.
- **Gate:** every requirement carries a **REQ-ID** `MODULE.AREA.NN`.
- **Manual?** no.

Goal:
`docs/requirements/srs/{module}.md` exists per module with IEEE-830 `**shall**`
statements, and **every** requirement carries a REQ-ID in `MODULE.AREA.NN` form
(e.g. `IF.AUTH.01`). Cross-cutting files `nfr.md`, `permissions.md`,
`data-model.md` and an `srs/README.md` module registry exist. Each REQ-ID cites
≥1 GAP-NNN (or an explicit "no-gap — new feature" note). STAGE.md Current = 1.6.
Stop after 20 turns.

### Step 1.6 — Validate SRS + resolve BLOCKERs

- **Inputs:** SRS.
- **Output path:** `docs/requirements/CLARIFICATIONS.md` (BLOCKER / IMPORTANT / NICE).
- **Gate:** *(rolled into PB-G2 — see 1.9).*
- **Manual?** no (the answers are gathered for PB-G2; this step does not page).

Goal:
`docs/requirements/CLARIFICATIONS.md` lists every ambiguity / gap /
inconsistency / edge case / missing NFR found by per-actor SRS walkthrough,
classified BLOCKER / IMPORTANT / NICE. Each BLOCKER has a clear question + the
SRS req it threatens. The SRS is patched where answers already exist; remaining
BLOCKERs are queued for the PB-G2 client confirmation. STAGE.md Current = 1.7.
Stop after 12 turns.

### Step 1.7 — Vision / use-cases / glossary / BPMN / RTM

- **Inputs:** SRS + clarifications.
- **Output path:** `VISION_SCOPE.md`, `use-cases/USE_CASES.md`, `GLOSSARY.md` (bilingual), `BPMN_DIAGRAMS.md`, `traceability/RTM.md`.
- **Gate:** **RTM completeness** — every feature → ≥1 REQ-ID + ≥1 use case.
- **Manual?** no.

Goal:
`docs/requirements/VISION_SCOPE.md`, `use-cases/USE_CASES.md`, `GLOSSARY.md`
(bilingual), `BPMN_DIAGRAMS.md`, and `traceability/RTM.md` all exist. The RTM is
**backward-complete**: every feature traces to ≥1 REQ-ID and ≥1 use case, every
REQ-ID to ≥1 GAP-NNN (or a no-gap note). STAGE.md Current = 1.8.
Stop after 15 turns.

### Step 1.8 — Scenario edge-case (high-risk reqs only)

- **Inputs:** the high-risk REQ-IDs.
- **Output path:** `docs/requirements/scenarios/*.md` — mints **SC-NNN**.
- **Gate:** each high-risk req decomposed or a skip recorded.
- **Manual?** no.

Goal:
For every REQ-ID flagged high-risk, `docs/requirements/scenarios/*.md` has a
12-dimension decomposition minting **SC-NNN** ids, OR a recorded skip-declaration
naming the req and the reason. Low-risk reqs are deliberately not decomposed.
STAGE.md Current = 1.9. Stop after 12 turns.

### Step 1.9 — Feature register + scope baseline *(CLIENT GATE)*

- **Inputs:** RTM + SRS + scenarios.
- **Output path:** `docs/scope-baseline/feature-register.{md,xlsx}` + scope matrix (`locale-vi/` fork).
- **Gate:** **PB-G2 (CLIENT) — scope frozen** = BLOCKERs answered (1.6) + feature-register frozen.
- **Manual?** **yes** — pages the client.

Goal:
`docs/scope-baseline/feature-register.{md,xlsx}` lists every business feature
with its REQ-ID(s), MoSCoW priority, in/out-of-scope mark, and assumptions, with
a VN fork. The PB-G2 checklist (`docs/gates/pb-g2-scope-frozen.md`) holds: every
open BLOCKER from 1.6 is answered, and the register is frozen. Emit
MANUAL_CHECKPOINT asking the client to confirm scope in writing; do **not**
satisfy the goal or advance STAGE.md until the client confirms. STAGE.md
Current = 1.10 only after written scope confirmation. Stop after 10 turns.

### Step 1.10 — Brand + design tokens (light/dark)

- **Inputs:** scope baseline + SRS.
- **Output path:** `docs/design/brand-guidelines.md` + design tokens + `docs/design-guidelines.md` + `src/components/README.md`.
- **Gate:** Component Coverage Matrix + Tier-1 version pinned.
- **Manual?** no.

Goal:
`docs/design/brand-guidelines.md`, the design tokens (light + dark), and
`docs/design-guidelines.md` exist; the Component Coverage Matrix lists every
component the planned screens will use (stubs allowed, no missing rows).
`docs/design-guidelines.md` **§0 records the pinned `docs/design-system/design-rules.md`
version** read from `docs/design-system/VERSION` (Tier-1 pin), and the Tier-3
component inventory `src/components/README.md` exists. STAGE.md Current = 1.11.
Stop after 10 turns.

### Step 1.11 — Screen map / flows / RPM / status-flow / ERD draft

- **Inputs:** feature register + use-cases.
- **Output path:** `docs/visuals/diagrams/*` (`role-permission-matrix.md`, `status-flow.md`, `business-workflow.md` + process-flagged user-flows in `locale-vi/`) + `docs/visuals/diagrams/screen-inventory.md`.
- **Gate:** RPM + status-flow coverage; every grid/form screen → one §4 floorplan (or CUSTOM).
- **Manual?** no.

Goal:
`docs/visuals/diagrams/` contains a sitemap / screen map, ≥1 user flow, a business
workflow, an ERD **draft** (frozen later by the SA at 2.1), a
`role-permission-matrix.md`, and a `status-flow.md` per stateful entity — the RPM
and status-flow with VN forks. Every actor in the SRS appears in the RPM; every
stateful entity has a status-flow. **Flag each process-complex feature** (async /
scheduled / state-machine / branching rules / multi-actor); its business-workflow /
status-flow / user-flow gets a `locale-vi/` fork so it can join the **process
annex** the client reviews at 1.13 (PB-G3) — the prototype freezes screens, the
annex freezes process logic. **`docs/visuals/diagrams/screen-inventory.md`
maps every screen containing a data grid OR a create/edit form to exactly one §4
floorplan** (List Report / Object Page / Worklist / Overview / Analytical List /
Wizard) **or to CUSTOM per §4.7** (one-line rationale + `docs/decisions/<slug>.md`)
— mandatory all lanes. **Any grid/form screen left unclassified is a freeze
blocker.** STAGE.md Current = 1.12. Stop after 12 turns.

### Step 1.12 — Prototype all functions

- **Inputs:** screen map + tokens.
- **Tool:** an external visual-design tool — **Claude Design / Open Design /
  Google Stitch / Pencil.dev** — **or (TRIAL)** an in-repo board built with
  **Claude Code + a taste/anti-slop frontend skill** (default `design-taste-frontend`,
  BETA — swappable by name; see `playbooks/visual-and-behavioral-modeling.md`). The
  legacy "do NOT generate inside Claude Code" rule is relaxed *only* for this board
  path, which ships a single `board.html` (frames grouped by zone, pan/zoom,
  per-screen comments) — not the low-fidelity wireframe folder the ADR rejected.
  Designer picks one engine per project and records it in
  `docs/visuals/prototype/README.md`.
- **Engine split (taste-skill path):** engage the taste skill only for the
  landing/auth (PUB) zone (its declared scope); product screens (dashboards / data
  tables / wizards / forms) stay governed by the repo design-system + §4 floorplan
  (anti-slop discipline only, no layout variance).
- **Output path:** `docs/visuals/prototype/` (exported screens) + a share URL —
  **or** `prototype/board.html` (+ `prototype/screens/*.html`) for the taste-skill board.
- **Prompt convention (external tool):** **attach the whole source repo** to Claude
  Design / Open Design as context — it carries the full build spec (`prototype-brief.md`,
  `screen-inventory.md`, tokens, diagrams). Keep build instructions as **versioned,
  self-contained files in the repo** — `docs/visuals/prototype/build-prompt-v<N>-*.md`
  (one per round: v1, v2, v3 …; plus `build-prompt-v<N>-process-annex.md` for the
  process-review zone) — and paste only a **short pointer prompt** in the tool's chat:
  *"Đọc `<file>` trong repo đính kèm và thực hiện đúng khối lệnh, tiếp tục board hiện
  tại, KHÔNG tạo project mới."* The detail lives in the repo and evolves with it; the
  chat stays one line so it never drifts from the docs. Template:
  `docs/templates/prototype-build-prompt-external.md`. Ready prompts per project:
  `docs/visuals/prototype/README.md` § Build Prompts.
- **Gate:** each screen ≥1 sample-data state + ≥1 empty/error state; each export conforms to its floorplan + design-system-compliance gate passes.
- **Manual?** **yes** — the Designer builds the prototype in the external tool; emit MANUAL_CHECKPOINT.

Goal:
The Designer builds the prototype in **one external design tool** (Claude Design /
Open Design / Google Stitch / Pencil.dev) — **or the TRIAL Claude Code +
taste-skill `board.html`** (see Tool bullet). `docs/visuals/prototype/README.md` records the chosen tool, share URL,
version, and date. One export per screen exists, each screen showing ≥1
sample-data state and ≥1 empty/error state, covering every in-scope
feature-register line. **Each screen conforms to the §4 floorplan (or CUSTOM) it
was assigned in `screen-inventory.md`, and the design-system-compliance gate
passes before freeze** (no unclassified grid/form screen; no §4/§7/§8 violation).
Emit MANUAL_CHECKPOINT with the chosen tool + share URL + return condition, then
stop. STAGE.md Current = 1.13. Stop after 8 turns.

### Step 1.13 — Review loop + FREEZE *(CLIENT GATE)*

- **Inputs:** prototype + **process annex** (BPMN / status-flow / flagged user-flows for process-complex features) + client feedback.
- **Output path:** `docs/visuals/prototype/feedback-*.md` + `feedback-final.md`.
- **Gate:** **PB-G3 (CLIENT) — prototype frozen** in writing (>2 rounds = scope problem).
- **Manual?** **yes** — pages the client.

**Loop mechanics (one round):** **(a)** capture the client's feedback →
`feedback-NN.md`; **(b)** revise the prototype **in the external design tool**
(re-entering step 1.12's surface — never generated in Claude Code); **(c)**
**re-run `design-system-compliance` + floorplan conformance on the revised
screens** before showing the client again (not only once at freeze); **(d)**
re-share for review. Cap = **2 rounds**; a 3rd round is a scope problem, not a
design problem → route to `CR-NN`.

**Feature-change rule:** the feature-register froze at **PB-G2**. A feedback item
that changes a *feature's behavior or description* (not just its visual) is
**scope drift** → mint a **`CR-NN`** (impact + re-estimate) — do **not** edit the
feature docs freely inside this loop. Visual-only refinements stay in the loop.

**Process-annex rule:** a clickable prototype freezes *screen states*, not
*process logic*. For each **process-complex** feature — async / scheduled
behavior, a non-trivial state machine, branching business rules, or multi-actor
handoff (flagged at 1.11) — the client review packet **also** includes the
relevant **BPMN / status-flow / user-flow** diagram (client-facing `locale-vi/`
forks bundled as the process annex). **Walk the client through the flow on the
diagram**; do not hand over raw swimlanes to read alone. Record the client's
**process-logic confirmation** (not only screen approval) in `feedback-final.md`.
This closes the PROTOTYPE-THEN-QUOTE gap: logic that screens cannot show
otherwise escapes the frozen visual contract and surfaces as a dispute at UAT —
after the price is set.

**Annex delivery:** present it either as rendered SVG/PNG walked through on a
call, or as **presentation-only flow screens embedded in the prototype board** so
the client reviews + comments in one surface. Either way the `locale-vi/` Mermaid
source stays canonical — if the annex is mirrored onto the board, the board
screens must **match the source at freeze**; a flow change goes into the `.md`
source first, then re-mirrors (never let the board drift as a second source). On
the board, the flow screens are **CUSTOM presentation** (no grid/form → exempt
from §4 floorplan classification).

Goal:
`docs/visuals/prototype/feedback-*.md` capture each review round; any scope drift
is logged in the change-request-log, not silently absorbed. The PB-G3 checklist
(`docs/gates/pb-g3-prototype-frozen.md`) holds and `feedback-final.md` records the
written freeze. More than two review rounds is flagged as a scope problem. Emit
MANUAL_CHECKPOINT asking the client to confirm the freeze in writing; do not
advance STAGE.md until confirmed. STAGE.md Current = 1.14 only after written
freeze. Stop after 10 turns.

### Step 1.14 — Bao-gia + technical overview + contract draft

- **Inputs:** frozen feature register + frozen prototype.
- **Output path:** `docs/bao-gia/{01..05}.md` + PDF + `hop-dong-mau.docx` (`locale-vi/`).
- **Gate:** every price line ↔ exactly one feature-register row.
- **Manual?** no.

Goal:
`docs/bao-gia/{01..05}.md` (+ PDF + a contract draft) exist, priced **only** from
the frozen feature register and the frozen prototype (PROTOTYPE-THEN-QUOTE: PB-G3
must already be cleared). Every price line maps to exactly one feature-register
row; out-of-scope items are listed with reasons. The contract draft *generates*
real terms (acceptance, IP / source ownership, liability, SLA — 3.2 depends on
the SLA terms), not an empty template. STAGE.md Current = 1.15. Stop after 8 turns.

### Step 1.15 — Sign contract + deposit (EXIT Pre-Build) *(CLIENT GATE)*

- **Inputs:** signed bao-gia.
- **Output path:** signed contract + deposit record; `docs/ROADMAP.md` skeleton.
- **Gate:** **PB-G4 (CLIENT, hardest) — contract + deposit: NO build code before this.**
- **Manual?** **yes** — pages the client.

Goal:
The PB-G4 checklist (`docs/gates/pb-g4-contract-deposit.md`) holds: contract
signed + deposit received. `docs/ROADMAP.md` is born from the skeleton, mapping
each module to its milestone. Emit MANUAL_CHECKPOINT asking the client to sign
and pay the deposit; do **not** satisfy the goal, advance STAGE.md, or allow any
build code before both are confirmed. STAGE.md Current = Build / 2.1 only after
contract + deposit confirmed. Stop after 8 turns.

---

## Macro-Stage 2 — BUILD & GO-LIVE *(high-level lines; detailed goal text built in next increment)*

> The step map, roles, and gates below are authoritative (`docs/WORKFLOW.md`).
> The full `/goal` text per step is **built in the next macro-stage increment**.

- **2.1 ERD freeze (SA)** — freeze the ERD: entities, normalization, audit + tenant fields → `docs/system-architecture.md` + a decision slug. Gate: **ERD FROZEN**. *[next increment]*
- **2.1b Data migration & cutover** — CONDITIONAL: N/A by decision for greenfield; else ETL + dry-run cutover + rollback-of-data + RTO/RPO. *[next increment]*
- **2.2 Stack + threat-model (Tech Lead)** — choose stack vs NFR, complete the API contract, STRIDE threat-model (red-team required). Gate: stack justified. *[next increment]*
- **2.3 Implementation plan + DoR** — plan under `plans/<YYMMDD-HHMM>-<slug>/`. Gate: **DoR** (`docs/gates/dor-build.md`). *[next increment]*
- **2.4 Env + IaC + CI/CD + observability/SLO** — pipeline green, secret scan clean, alerting + SLO live, backup verified. *[next increment]*
- **2.5 Seed + foundation data** — app boots with RBAC + admin; FK-valid. *[next increment]*
- **2.6 Code feature by phase** — compiles/runs, verify-gate pass, commit cites ≥1 token. **Fidelity by zone:** PUB (landing/pricing/marketing/auth) **ports** the prototype export pixel-faithful; APP/ADM **rebuilds** via design-system (`playbooks/build-execution.md` § Prototype → Code Fidelity). *[next increment]*
- **2.7 Code review (6-dim)** — score ≥7, no dimension = 0. *[next increment]*
- **2.8 E2E from BA docs + user manual** — every REQ-ID ≥1 E2E pass + a TC-NNN row. *[next increment]*
- **2.9 Independent security review** — STRIDE+OWASP, red-team required. Gate: **SECURITY SIGN-OFF** (0 Critical/High). *[next increment]*
- **2.10 QA real-browser + video** — Gate: **DoD** (`docs/gates/dod-build.md`). *[next increment]*
- **2.11 Go-live readiness** — readiness green; rollback rehearsed; DR + RTO/RPO and NFR/load both CONDITIONAL (N/A by decision). *[next increment]*
- **2.12 UAT + sign-off (one client session)** — Gate: **ACCEPTANCE (CLIENT)** — matches prototype + sign-off signed. *[next increment]*
- **2.13 Release** — release-note (every released REQ) + smoke pass; rollback = one `IMAGE_TAG` line. *[next increment]*

---

## Macro-Stage 3 — POST-BUILD *(high-level lines; detailed goal text built in next increment)*

> Step map / roles / gates authoritative in `docs/WORKFLOW.md`; full `/goal` text
> **built in the next macro-stage increment**.

- **3.1 Handover package** — Gate: **HANDOVER (CLIENT)** — docs/credentials/training/source-IP received + verified + **secrets rotated**. *[next increment]*
- **3.2 Hypercare + SLA window** — window closed, P1/P2 within SLA, 0 Critical open. *[next increment]*
- **3.3 Maintenance / monitoring / backup steady-state** — uptime within SLA, backup verified, patches applied. *[next increment]*
- **3.4 Maintenance proposal (recurring revenue)** — tier proposed; client decides. *[next increment]*
- **3.5 Change control (always-on, ASYNC)** — mint CR-NN; impact + re-estimate + approval **before** code; push-notify, never block the session. *[next increment]*
- **3.6 Retro + journal + agent memory** — lessons captured; memory persisted. *[next increment]*

---

## Lookup convention for tooling

The `stage-runner` and the `.claude/hooks/stage-deliver.sh` notifier pick the
correct goal by matching the H3 heading whose step id follows `### Step ` against
the step token parsed from the latest stage-boundary commit subject (e.g.
`stage-1.5` matches `### Step 1.5`). Build & Post-Build entries are high-level
until the next increment fills their full goal text.
