# Stage Goals

Per-step `/goal` condition text the human or the `stage-runner` subagent uses to
drive one workflow step to a verifiable finish. Use with the interactive
`/goal <condition>` command or headless `claude -p "/goal …"`.

**Authority:** `docs/process/WORKFLOW.md` step tables. **Token grammar:**
`docs/about/TRACE_SPEC.md` (`GAP-NNN → REQ-ID = MODULE.AREA.NN → SC-NNN → TC-NNN`,
`CR-NN` — never `US-NNN.REQ-MMM`). **Lanes:** `docs/process/WORKFLOW.md` § Lanes — in
the **Lite** lane the route is `1.1 → 1.2 → 1.5-lite → 1.9-lite → 1.10-lite →
1.11 → 1.12 → 1.13 → 2.1` (1.14/1.15 auto-N/A-by-decision); Macro 2 and 3 are
identical in both lanes.

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
**PB-G1 is internal — it does NOT page the client.** In the Lite lane the paging
gates page the **owner**; a one-line written ack clears them.

**Turn cap:** every goal ends with `Stop after {N} turns` so a mis-stated
condition cannot loop forever.

**Each entry below lists:** Goal · Inputs · Output path · Gate · Manual?

---

## Macro-Stage 1 — PRE-BUILD

### Step 1.1 — Lead capture + intake raw files

- **Inputs:** client email / chat / dropped docs (PRD, screenshots, sheets).
- **Output path:** `docs/discovery/{date}-{slug}.{ext}` (append-only) + the Source Map at `docs/discovery/README.md § Source Map`.
- **Gate:** — (always required, even when self-initiated; no gate to clear).
- **Manual?** no.

Goal:
Every raw client input is filed under `docs/discovery/{date}-{slug}.{ext}` with
the date-prefix naming convention, append-only (no edits to prior inputs). The
Source Map — a `## Source Map` section in `docs/discovery/README.md` — lists
each raw artifact, its type, and what it covers. No interpretation or
derivation yet. STAGE.md Snapshot shows Current = 1.2.
Stop after 8 turns.

### Step 1.2 — Intake brief go/no-go + Lane declaration

- **Inputs:** `docs/discovery/*` raw inputs.
- **Output path:** `docs/intake/{date}-intake-brief.md` (`locale-vi/` fork for VN client).
- **Gate:** **PB-G1** intake go/no-go — *internal capture, does NOT page the client.*
- **Manual?** no.

Goal:
`docs/intake/{date}-intake-brief.md` exists with every section from the
client-intake-brief template filled from `docs/discovery/*`. A decision is
recorded: proceed / park / decline (PB-G1, internal — no client page). The
**Lane** is declared (Full | Lite per `docs/process/WORKFLOW.md` § Lanes) and recorded
in the STAGE.md Snapshot. During intake, the conditional probes are asked and
recorded or marked N/A by decision: compliance / data-residency / DPA, and
brownfield (replacing a legacy system → migration needed?). STAGE.md Snapshot
shows Current = 1.3 (Full) or 1.5-lite (Lite) if proceeding.
Stop after 10 turns.

### Step 1.3 — Discovery interview (5 persona × 3 mode) *(Full lane)*

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

### Step 1.4 — Gap analysis (As-Is / To-Be, MoSCoW) *(Full lane)*

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

### Step 1.5 — SRS IEEE-830 per module + REQ-ID *(Full lane)*

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

### Step 1.5-lite — SRS-lite (modules + REQ-ID table) *(Lite lane)*

- **Inputs:** intake brief + raw discovery inputs.
- **Output path:** `docs/requirements/srs-lite.md` (template: `docs/mau-tai-lieu/srs-lite.md`).
- **Gate:** every requirement carries a **REQ-ID** `MODULE.AREA.NN`; high-risk reqs flagged.
- **Manual?** no.

Goal:
`docs/requirements/srs-lite.md` exists per the srs-lite template: module list,
ONE requirements table where every row carries a REQ-ID (`MODULE.AREA.NN`, full
grammar), a MoSCoW priority, a high-risk flag (money / auth / async /
destructive), and a one-line acceptance criterion; plus NFR one-liners and an
Open Questions section (replaces gap-analysis / CLARIFICATIONS / RTM — GAP-NNN
optional in Lite). For every REQ-ID flagged high-risk, either a 12-dimension
scenario decomposition exists under `docs/requirements/scenarios/*.md` (mints
**SC-NNN**) or a one-line skip is recorded in srs-lite. STAGE.md Current =
1.9-lite. Stop after 15 turns.

### Step 1.6 — Validate SRS + resolve BLOCKERs *(Full lane)*

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

### Step 1.7 — Vision / use-cases / glossary / BPMN / RTM *(Full lane)*

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

### Step 1.8 — Scenario edge-case (high-risk reqs only) *(Full lane)*

- **Inputs:** the high-risk REQ-IDs.
- **Output path:** `docs/requirements/scenarios/*.md` — mints **SC-NNN**.
- **Gate:** each high-risk req decomposed or a skip recorded.
- **Manual?** no.

Goal:
For every REQ-ID flagged high-risk, `docs/requirements/scenarios/*.md` has a
12-dimension decomposition minting **SC-NNN** ids, OR a recorded skip-declaration
naming the req and the reason. Low-risk reqs are deliberately not decomposed.
STAGE.md Current = 1.9. Stop after 12 turns.

### Step 1.9 — Feature register + scope baseline *(Full lane; CLIENT GATE)*

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

### Step 1.9-lite — Feature list freeze *(Lite lane; OWNER GATE)*

- **Inputs:** srs-lite.
- **Output path:** the feature table inside `docs/requirements/srs-lite.md` (or a short `docs/scope-baseline/feature-register.md`).
- **Gate:** **PB-G2 (owner ack) — scope frozen.**
- **Manual?** **yes** — pages the owner (one-line ack).

Goal:
The srs-lite feature table is complete (every feature → its REQ-IDs, MoSCoW,
in/out-of-scope mark) and every open question that blocks scope is answered or
explicitly deferred out of scope. Emit MANUAL_CHECKPOINT asking the owner to ack
the scope in writing (one line suffices); record the ack in srs-lite § Freeze.
STAGE.md Current = 1.10-lite only after the ack. Stop after 6 turns.

### Step 1.10 — Brand + design tokens (light/dark) *(Full lane)*

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

### Step 1.10-lite — Design tokens + Tier-1 pin only *(Lite lane)*

- **Inputs:** frozen srs-lite feature table.
- **Output path:** design tokens (light + dark) + `docs/design-guidelines.md` (§0 pin).
- **Gate:** Tier-1 version pinned; tokens exist.
- **Manual?** no.

Goal:
The Tier-2 design tokens exist (light + dark; colors, type scale, spacing,
density) and `docs/design-guidelines.md` §0 records the pinned
`docs/design-system/design-rules.md` version from `docs/design-system/VERSION`.
Brand book and Component Coverage Matrix are skipped (recorded as
N/A-by-decision — Lite). Floorplan classification at 1.11 remains mandatory.
STAGE.md Current = 1.11. Stop after 6 turns.

### Step 1.11 — Screen map / flows / RPM / status-flow / ERD draft

- **Inputs:** feature register (or srs-lite table) + use-cases.
- **Output path:** `docs/visuals/diagrams/*` (`role-permission-matrix.md`, `status-flow.md`, `business-workflow.md` + process-flagged user-flows in `locale-vi/`) + `docs/visuals/diagrams/screen-inventory.md`.
- **Gate:** RPM + status-flow coverage; every grid/form screen → one §4 floorplan (or CUSTOM).
- **Manual?** no.

Goal:
`docs/visuals/diagrams/` contains a sitemap / screen map, ≥1 user flow, a business
workflow, an ERD **draft** (frozen later by the SA at 2.1), a
`role-permission-matrix.md`, and a `status-flow.md` per stateful entity — the RPM
and status-flow with VN forks (Full lane; Lite may skip VN forks). Every actor in
the SRS appears in the RPM; every stateful entity has a status-flow. **Flag each
process-complex feature** (async / scheduled / state-machine / branching rules /
multi-actor); its business-workflow / status-flow / user-flow gets a `locale-vi/`
fork so it can join the **process annex** the client reviews at 1.13 (PB-G3) —
the prototype freezes screens, the annex freezes process logic.
**`docs/visuals/diagrams/screen-inventory.md` maps every screen containing a data
grid OR a create/edit form to exactly one §4 floorplan** (List Report / Object
Page / Worklist / Overview / Analytical List / Wizard) **or to CUSTOM per §4.7**
(one-line rationale + `docs/decisions/<slug>.md`) — mandatory all lanes. **Any
grid/form screen left unclassified is a freeze blocker.** STAGE.md Current =
1.12. Stop after 12 turns.

### Step 1.12 — Prototype all functions

- **Inputs:** screen map + tokens.
- **Tool:** an external visual-design tool — **Claude Design / Open Design /
  Google Stitch / Pencil.dev** — **or (TRIAL)** an in-repo board built with
  **Claude Code + a taste/anti-slop frontend skill** (BETA — swappable by name;
  see `playbooks/visual-and-behavioral-modeling.md`). The board path ships a
  single `board.html` (frames grouped by zone, pan/zoom, per-screen comments).
  Designer picks one engine per project and records it in
  `docs/visuals/prototype/README.md`.
- **Engine split (taste-skill path):** engage the taste skill only for the
  landing/auth (PUB) zone; product screens (dashboards / data tables / wizards /
  forms) stay governed by the repo design-system + §4 floorplan.
- **Output path:** `docs/visuals/prototype/` (exported screens) + a share URL —
  **or** `prototype/board.html` (+ `prototype/screens/*.html`).
- **Prompt convention (external tool):** attach the whole source repo to the
  tool as context; keep build instructions as **versioned files in the repo** —
  `docs/visuals/prototype/build-prompt-v<N>-*.md` (one per round) — and paste
  only a short pointer prompt in the tool's chat. Template:
  `docs/mau-tai-lieu/prototype-build-prompt-external.md`.
- **Gate:** each screen ≥1 sample-data state + ≥1 empty/error state; each export conforms to its floorplan + design-system-compliance gate passes.
- **Manual?** **yes** — the Designer builds the prototype in the external tool; emit MANUAL_CHECKPOINT.

Goal:
The Designer builds the prototype in **one external design tool** — or the TRIAL
Claude Code + taste-skill `board.html` (see Tool bullet).
`docs/visuals/prototype/README.md` records the chosen tool, share URL, version,
and date. One export per screen exists, each screen showing ≥1 sample-data state
and ≥1 empty/error state, covering every in-scope feature line. **Each screen
conforms to the §4 floorplan (or CUSTOM) it was assigned in
`screen-inventory.md`, and the design-system-compliance gate passes before
freeze** (no unclassified grid/form screen; no §4/§7/§8 violation). Emit
MANUAL_CHECKPOINT with the chosen tool + share URL + return condition, then
stop. STAGE.md Current = 1.13. Stop after 8 turns.

**Lite internal-product substitution (sanctioned):** when the product is
internal with no external client to show, the classified screen inventory
(1.11) + a written per-screen states contract (sample-data + empty/error states
described per screen) may substitute for the visual prototype. Record
`1.12 — N/A by decision (written screen specs substitute)` at the PB-G3 freeze;
floorplan classification and the design-system gate still apply
(`docs/process/WORKFLOW.md` § Lanes, item 5).

### Step 1.13 — Review loop + FREEZE *(CLIENT GATE; Lite: one round + owner ack)*

- **Inputs:** prototype + **process annex** (BPMN / status-flow / flagged user-flows for process-complex features) + client feedback.
- **Output path:** `docs/visuals/prototype/feedback-*.md` + `feedback-final.md`.
- **Gate:** **PB-G3 (CLIENT) — prototype frozen** in writing (>2 rounds = scope problem; Lite: 1 round, owner ack).
- **Manual?** **yes** — pages the client (Lite: the owner).

**Loop mechanics (one round):** **(a)** capture the client's feedback →
`feedback-NN.md`; **(b)** revise the prototype **in the same tool surface as
1.12**; **(c)** **re-run `design-system-compliance` + floorplan conformance on
the revised screens** before showing the client again; **(d)** re-share for
review. Cap = **2 rounds** (Lite: 1); a further round is a scope problem, not a
design problem → route to `CR-NN`.

**Feature-change rule:** the scope froze at **PB-G2**. A feedback item that
changes a *feature's behavior or description* (not just its visual) is **scope
drift** → mint a **`CR-NN`** (impact + re-estimate) — do **not** edit the
feature docs freely inside this loop. Visual-only refinements stay in the loop.

**Process-annex rule:** a clickable prototype freezes *screen states*, not
*process logic*. For each **process-complex** feature (flagged at 1.11) the
client review packet **also** includes the relevant BPMN / status-flow /
user-flow diagram (client-facing `locale-vi/` forks bundled as the process
annex). Walk the client through the flow on the diagram; record the client's
**process-logic confirmation** (not only screen approval) in `feedback-final.md`.

Goal:
`docs/visuals/prototype/feedback-*.md` capture each review round; any scope drift
is logged in the change-request-log, not silently absorbed. The PB-G3 checklist
(`docs/gates/pb-g3-prototype-frozen.md`) holds and `feedback-final.md` records the
written freeze. More than two review rounds is flagged as a scope problem. Emit
MANUAL_CHECKPOINT asking the client (Lite: owner) to confirm the freeze in
writing; do not advance STAGE.md until confirmed. **Lite lane:** on freeze, also
record `1.14 / 1.15 — N/A by decision (Lite lane)` in the STAGE.md Snapshot;
STAGE.md Current = 2.1 after the ack. **Full lane:** STAGE.md Current = 1.14
only after written freeze. Stop after 10 turns.

### Step 1.14 — Bao-gia + technical overview + contract draft *(Full lane)*

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

### Step 1.15 — Sign contract + deposit (EXIT Pre-Build) *(Full lane; CLIENT GATE)*

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

## Macro-Stage 2 — BUILD & GO-LIVE

> **Canonical process shape = `docs/process/macro-2.md`** (step → driver →
> gate → playbook → output → exit). That file is the SoT for the SHAPE; this
> file is the goal-prose each step runs against. As of 2026-09-01 three steps are
> **folded** to cut duplication (the goal text stays below, tagged): **2.5 → 2.4**
> (seed is part of the P0 milestone), **2.7 → 2.10** (6-dim review shares DoD's
> floor rules), **2.11 → 2.13** (go-live readiness is part of the release
> contract). Security is one VERIFY pass at 2.9 over the 2.2 threat-model + 2.6
> floor, not a 3rd from-scratch STRIDE.

> Same goals in both lanes. In the Lite lane, `docs/ROADMAP.md` is born at 2.3
> (with the plan) instead of 1.15.

### Step 2.1 — Solution/data architecture — freeze ERD (SA)

- **Inputs:** SRS(-lite) data-model + use-cases + `docs/visuals/diagrams/` (ERD draft, status-flows, screen inventory).
- **Output path:** `docs/system-architecture.md` (ERD section) + `docs/decisions/<domain>-data-model-freeze.md`.
- **Gate:** **ERD FROZEN** — entities, normalization, audit + tenant fields reviewed.
- **Manual?** no.

Goal:
`docs/system-architecture.md` contains the frozen ERD (Mermaid `erDiagram` or
equivalent) covering every entity the SRS(-lite) and screen inventory imply:
entities with fields + types, relations with cardinality, normalization
reviewed, **audit fields** (created/updated timestamps + actor) and
**tenant/organization scoping** decided per entity (single-tenant is a valid
recorded decision), soft-delete policy, and status enums matching each
status-flow diagram. Every in-scope REQ-ID maps to ≥1 entity or carries an
explicit "no data footprint" note. The ADR
`docs/decisions/<domain>-data-model-freeze.md` records the freeze and the
non-obvious modeling choices. STAGE.md Current = 2.1b (brownfield) or 2.2.
Stop after 15 turns.

### Step 2.1b — Data migration & cutover *(CONDITIONAL — brownfield only)*

- **Inputs:** legacy schema/dump + frozen ERD.
- **Output path:** migration plan + dry-run report under `plans/`.
- **Gate:** **CONDITIONAL — N/A by decision** for greenfield; else ETL mapped + dry-run cutover done + rollback-of-data plan + RTO/RPO stated.
- **Manual?** no.

Goal:
Either the project is greenfield and `2.1b — N/A by decision (greenfield)` is
recorded in STAGE.md Snapshot + `docs/gates/dod-build.md` toggles, OR a migration
plan exists mapping every legacy table/field to the frozen ERD (ETL steps,
validation queries, cutover order), a dry-run report proves the ETL on a copy,
and a rollback-of-data plan + RTO/RPO are stated. STAGE.md Current = 2.2.
Stop after 15 turns.

> **Applicability (stays a real numbered step, NOT an appendix).** This step is
> **N/A-by-decision for a greenfield Lite/internal** build (record the one line
> and move on), and **APPLICABLE only for brownfield** — replacing a legacy
> system that carries real data (real use: nhatnghe.net Phase-1.5 + the Phase-2
> migration). Keeping it inline means a brownfield project cannot skip it by
> forgetting it exists.

### Step 2.2 — Technical design + stack decision (TDR) + threat-model (Tech Lead)

- **Inputs:** NFR + frozen ERD + screen inventory.
- **Output path:** `docs/decisions/<project>-stack-selection.md` + `docs/decisions/<project>-threat-model.md` + API contract (`docs/api-contract.md` or OpenAPI file).
- **Gate:** stack justified vs NFR; API contract complete; authz model stated; STRIDE threat-model done (red-team required).
- **Manual?** no.

Goal:
`docs/decisions/<project>-stack-selection.md` records the stack **vs the NFRs**.
**Default = the harness walking-skeleton stack template** (pnpm workspaces
monorepo; NestJS + Prisma + PostgreSQL API; Next.js App Router + Tailwind web;
shared-types package — `scaffolds/stack-pnpm-nest-next/` in the harness source);
choosing it needs one paragraph, deviating needs explicit NFR-based reasons. The
API contract lists every endpoint per module (path, method, auth, roles,
request/response shape) covering every in-scope REQ-ID that has an API surface.
The authz model (roles, guard strategy, resource ownership rules) is stated.
`docs/decisions/<project>-threat-model.md` holds a STRIDE table over the main
assets/flows with a red-team pass (attacker personas: external, authenticated
abuser, insider) and each threat mapped to a mitigation or an accepted-risk
note. **When any in-scope REQ-ID is async / media / storage / integration** (grep
the NFR + SRS for transcode/HLS/upload/queue/webhook/signed-url/storage/PDF-render/
email-blast), the stack decision **surfaces the opt-in tier-2 primitives** — Redis
queue (`apps/api/src/common/queue/`), object-storage adapter
(`apps/api/src/common/storage/`), worker app (`apps/worker/`) — and names the
matching playbook per capability; a CRUD-only project leaves tier-2 off (YAGNI).
STAGE.md Current = 2.3. Stop after 15 turns.

### Step 2.3 — Implementation plan + BUILD MANIFEST + DoR

- **Inputs:** TDR + scope baseline (or srs-lite) + frozen ERD + screen inventory + API contract.
- **Output path:** `plans/<YYMMDD-HHMM>-<slug>/` (plan.md) + **`docs/build-manifest.md`**.
- **Gate:** **DoR** (`docs/gates/dor-build.md`, SoT) — incl. build-manifest complete (manifest-completeness rule).
- **Manual?** no.

Goal:
`docs/build-manifest.md` exists per `docs/mau-tai-lieu/build-manifest.md`,
compiled per `docs/playbooks/build-manifest-compilation.md`: ordered phases
**P0..PN** where **P0 = walking skeleton** (stack-template scaffold + boot +
seed-admin login) and each later phase block lists: id, name, REQ-IDs covered,
entities touched, API endpoints, screens (+floorplan class from
screen-inventory, + each screen's **prototype export source file** and its
fidelity strategy `port from export` | `rebuild (decision: <slug>)` — port is
the default per `playbooks/build-execution.md` § Prototype → Code Fidelity),
**concrete runnable acceptance checks**, verify commands, and
size (S/M/L), plus a **`Phase-type`** (`crud` default | `async-job` |
`media-pipeline` | `external-integration` | `storage`) — every REQ-ID citing an
async/media/storage/integration signal routes to its non-CRUD phase-type carrying
that type's acceptance categories (`build-manifest-compilation.md` step 4b; folding
it into a CRUD phase is a 2.3 defect). **Every in-scope REQ-ID appears in exactly
one phase** (manifest-completeness rule — SoT `docs/gates/dor-build.md`; the
manifest ends with the coverage checklist proving it); any phase
estimated
beyond one agent session (~10 files touched) is split; any PUB product-shot
capture phase depends on the APP screen phases it depicts. A thin
`plans/<YYMMDD-HHMM>-<slug>/plan.md` records ordering rationale + risks (the
manifest is the executable source, the plan is the why). The DoR checklist
(`docs/gates/dor-build.md`) is filled and green. In the Lite lane
`docs/ROADMAP.md` is born here from the template. STAGE.md Current = 2.4.
Stop after 15 turns.

### Step 2.4 — Walking skeleton (manifest P0) + env + CI/CD + observability

- **Inputs:** stack decision + manifest P0 + the stack template — **primary:** the embedded copy at `.harness/stack-template/` (placed by `install-harness.sh` at install time; see `STAGE.md` Snapshot § Harness source); **fallback only** (embed missing/stale): the harness source itself — local clone or repo tarball (`scaffolds/stack-pnpm-nest-next/`; see the template README).
- **Output path:** scaffolded monorepo at repo root + `.github/workflows/ci.yml` + `docker-compose.yml` + `.env.example`.
- **Gate:** **WALKING SKELETON** — install/build green, compose boots, health OK, CI(-equivalent local) green, secret scan clean (gitleaks, or the template's `scripts/secret-scan.sh` grep fallback).
- **Manual?** no.

Goal:
The project root contains the scaffolded monorepo produced by
`.harness/stack-template/scripts/scaffold.sh <target> <slug>` (project slug
substituted) — the embedded, proven copy is the PRIMARY scaffold path so the
walking skeleton reuses the shipped, red-teamed tier-2 primitives
(`packages/queue-core`, `packages/storage-core`) instead of re-deriving them.
Only when `.harness/stack-template/` is missing does scaffold fall back to
cloning/fetching the harness source directly (re-run `install-harness.sh` to
repair the embed first). A hand-built equivalent scaffold is a LAST RESORT —
only when the ADR (2.2) explicitly chose a different stack — and it MUST be
recorded as a decision (`docs/decisions/<slug>.md`); silently hand-rolling an
equivalent because the template "wasn't reachable" is the exact defect this
step exists to prevent. Then: (1) `pnpm install` (or stack
equivalent) completes clean; (2) lint + typecheck + unit + build all green
locally (the CI-equivalent run); (3) `docker compose up` boots db + api + web;
(4) the health endpoint returns 200; (5) the CI workflow file runs those same
jobs; (6) `.env.example` lists every required var and no secret is committed
(secret scan clean — gitleaks or `scripts/secret-scan.sh`). **Offline caveat:**
if the base-image pull is network-blocked, follow the shared **Offline boot
caveat** (§ below) — substitute cached-db / prod-command boot evidence + record
the caveat; do not block the gate on the network.
Observability is decided: structured logging on by
default; alerting/SLO configured or recorded `N/A by decision` in the
dod-build toggles. STAGE.md Current = 2.5. Stop after 25 turns.

### Step 2.5 — Seed + foundation data  *(FOLDED into 2.4 — same P0 milestone; see macro-2.md)*

- **Inputs:** frozen ERD + RBAC (permissions doc / RPM).
- **Output path:** seed script(s) under the API app (extends the template's admin seed).
- **Gate:** app boots with RBAC + seeded admin login works; FK-valid; P0 marked done in the manifest.
- **Manual?** no.

Goal:
The seed script extends the stack template's admin seed with the domain
foundation data the frozen ERD requires: roles/permissions, status/reference
tables, and at least one FK-valid sample row per core entity. The seed is
re-runnable (idempotent upserts or reset-then-seed). Against the running app:
migrations apply clean, the seed completes, and **logging in with the seeded
admin succeeds** (verified via the e2e smoke or an HTTP check). The manifest's
P0 checkbox is flipped done in the same stage-boundary commit. STAGE.md
Current = 2.6. Stop after 12 turns.

### Step 2.6 — Code feature by phase (`/build-phase` loop)

- **Inputs:** `docs/build-manifest.md` (next incomplete phase block) + frozen ERD + the SRS module file(s) the phase names + the screen-inventory rows for its screens + design tokens.
- **Output path:** code + tests + verification-register rows (`docs/about/TEST_MATRIX.md`) + manifest progress (incl. the `Accepted` cell).
- **Gate:** per phase — compiles/runs, `validate:quick` green, phase e2e smoke passes, design-system floor self-check clean, commit cites ≥1 token, manifest checkbox flipped, **+ PHASE ACCEPTANCE** (`docs/gates/phase-acceptance.md`): independent agent verifier PASS on the phase's Acceptance checks against the running preview; human checkpoint per the manifest cadence when `Verify-by: both`.
- **Manual?** **cadence-driven** — phases with `Verify-by: both` emit a MANUAL_CHECKPOINT (internal, pages the operator — not the client).

**Execution model:** this step is a **loop driven by `/build-phase`** — one
invocation implements exactly ONE manifest phase in an isolated context. Do not
run "all of 2.6" in one invocation, and do not hand a build agent the whole BA
spine — only the phase block + the files it names.

Goal (one phase, P<N>):
The next incomplete manifest phase is implemented: entities/migrations, API
endpoints, and screens named in the phase block, with loading/empty/error states
on every screen and input validation at the boundary. Before coding any
grid/form screen its screen-inventory floorplan row is confirmed (missing row =
blocker — escalate, never invent a floorplan), and its **prototype export source
file** (cited in the phase block) is opened — screens **adopt the export as
code** (NOT re-drawn in fresh Tailwind) following the method in
`docs/gates/visual-fidelity.md` + `playbooks/build-execution.md` § Prototype →
Code Fidelity + `prototype-export-adoption.md` (SoT) — unless the phase
block records `rebuild (decision: <slug>)` (no export for that screen).
Failed operations surface their real cause to the UI (no generic error-swallow);
a fix touching a systemic pattern sweeps ALL its call-sites. Then, in order:
`validate:quick` green; the phase's e2e smoke (the journeys its acceptance
checks name) passes against the running app; a verification-register row
(TC-NNN) is added per acceptance check with `Result: pass`; the design-system
floor self-check is clean for touched screens (§4 floorplan / §7 actions / §8
modals, Tier-2 tokens only, Tier-3 reuse); the **visual-fidelity check**
(`docs/gates/visual-fidelity.md`) passes — each screen's **Playwright fidelity
assertions** (element completeness + interaction behaviour) are green and its
screenshot is captured for the human side-by-side glance (no self-certified
"matches export"). One stage-boundary commit closes the
phase: it cites ≥1
token (REQ-ID / SC-NNN / TC-NNN), flips the phase checkbox in
`docs/build-manifest.md`, adds a `2.6/P<N>` History row in STAGE.md, and
updates `docs/ROADMAP.md` progress — all in the same commit. **Then the phase
must be ACCEPTED before the next phase starts**
(`docs/gates/phase-acceptance.md`): an INDEPENDENT agent verifier (never the
implementer) re-runs the phase's Acceptance checks against the running preview
(functional + visual-fidelity per shipped screen + negative-path) and returns
PASS/FAIL; FAIL is fixed inside the same phase and re-verified (cap 3 rounds,
then BLOCKED). PASS fills the manifest's `Accepted` cell + a TC-NNN acceptance
row. When the phase's `Verify-by` is `both` (manifest cadence knob, default
`per-ui-phase`), emit the gate's MANUAL_CHECKPOINT with the preview URL and
wait for the operator's OK before the next phase. STAGE.md Current stays 2.6
while phases remain; when the last phase closes AND is accepted, Current = 2.7.
Stop after 25 turns.

### Step 2.7 — Code review (6-dim) — at manifest completion (+ mid-point if >6 phases)  *(FOLDED into 2.10 — shares DoD floor rules; see macro-2.md)*

- **Inputs:** the full diff since P0 (or since the last 2.7 review).
- **Output path:** review record → `plans/reports/code-review-<date>-<slug>.md`.
- **Gate:** score ≥7, no dimension = 0; Design-System Compliance floor rule; blocking findings fixed.
- **Manual?** no.

Goal:
A 6-dimension review record exists per `playbooks/code-review-scoring.md` over
the diff since P0 (or since the previous mid-point review): overall score ≥7
with no dimension at 0, and the floor rules verified — **Design-System
Compliance** per screen (any unclassified or rule-violating grid/form screen =
automatic block), **Visual Fidelity** per screen (any APP/ADM screen divergent
from its prototype export render, or lacking both an export citation and a
recorded rebuild decision, = automatic block — `docs/gates/visual-fidelity.md`),
and **no generic error-swallow** (any user-facing failure surfacing a generic
message instead of its real cause = automatic block). The systemic-pattern
sweep rule is applied: any fix of a systemic pattern is checked against all
grep'd call-sites, siblings left broken = finding.
Blocking findings are fixed and re-verified in this step; non-blocking findings
are logged with a disposition. If this is the mid-point review (manifest >6
phases, roughly half done), STAGE.md Current returns to 2.6; otherwise
Current = 2.8. Stop after 15 turns.

### Step 2.8 — E2E from BA docs + user manual

- **Inputs:** BA acceptance criteria (SRS/srs-lite + scenarios) — not the code.
- **Output path:** E2E test suite + **TC-NNN** rows in `docs/about/TEST_MATRIX.md` + user manual under `docs/`.
- **Gate:** every in-scope REQ-ID ≥1 passing E2E + TC row.
- **Manual?** no.

Goal:
An E2E suite written **from the BA acceptance criteria** (never reverse-derived
from the code) covers every in-scope REQ-ID with ≥1 passing test, each recorded
as a TC-NNN row in the verification register (2.6 phase smokes count where they
map 1:1 to a REQ-ID — the register row is what matters). The **Mandatory
Coverage Rules** (`playbooks/canonical-e2e-flow-playbook.md`) hold: (1) every
user-facing operation that can fail — AI/generation, tier/quota-gated, payment,
provider-dependent, permission-gated — has ≥1 **negative-path** e2e that
triggers the failure and asserts the REAL cause surfaces in the UI (asserting a
generic error message = fail); (2) **every auth method** has an e2e that logs in
AND loads real authenticated data (data calls 200 + rendered values — route
reached is not proof), plus one switch-auth-method-on-same-browser
cookie-hygiene case. The RTM is forward-progressing: no in-scope REQ-ID without
a TC-NNN. A field-by-field user manual exists for every screen (per the e2e-qa
playbook), ready to hand to UAT. STAGE.md Current = 2.9. Stop after 25 turns.

### Step 2.9 — Independent security review

- **Inputs:** the codebase + `docs/decisions/<project>-threat-model.md`.
- **Output path:** security report → `plans/reports/security-review-<date>-<slug>.md`.
- **Gate:** **SECURITY SIGN-OFF** — 0 Critical/High open (red-team required).
- **Manual?** no.

Goal:
A security report exists covering STRIDE + OWASP Top-10 over the real code
(authn/authz on every endpoint, input validation, secrets handling, dependency
audit, injection/XSS/CSRF, rate limiting), including a **red-team pass** from
≥2 attacker personas, checked against the 2.2 threat-model (every threat's
mitigation verified or re-opened). Zero Critical/High findings remain open —
each is fixed and re-verified, or downgraded with evidence; Medium/Low have
recorded dispositions. The sign-off line is filled. STAGE.md Current = 2.10.
Stop after 20 turns.

### Step 2.10 — QA real-browser + video (DoD)

- **Inputs:** the running build + user manual + E2E results + the frozen prototype export bundle.
- **Output path:** QA evidence under `plans/reports/` + filled `docs/gates/visual-fidelity.md` + filled `docs/gates/dod-build.md`.
- **Gate:** **DoD** — review + E2E + security + QA evidence + user-manual + design-system-compliance green per screen; verification register all pass.
- **Manual?** no.

Goal:
Real-browser QA covers every critical journey with recorded evidence
(video/screenshots under `plans/reports/`), field-by-field against the user
manual. The **visual-fidelity evidence pass** is done: for each key APP/ADM
screen, a screenshot of the running app placed side-by-side with the render of
its prototype export, recorded as a `pass`/`divergent` row in
`docs/gates/visual-fidelity.md` — every row `pass` (divergent = fix or a
recorded rebuild decision, then re-check). PUB product-shot images (landing
hero/feature captures of the product) were captured AFTER the APP screens they
depict passed fidelity — stale early-UI captures are re-taken now. The DoD
checklist (`docs/gates/dod-build.md`) is filled: every core line
checked, every conditional enterprise toggle either cleared or marked N/A by
decision with reason + date, and the verification register has no `fail` /
`never-run` rows. Sequencing hazard: do NOT run the production build
(`pnpm build`) while the e2e dev server is serving — it clobbers the running
`.next` and fakes a login regression (template README § End-to-end tests);
build and browser-QA in separate steps. STAGE.md Current = 2.11. Stop after
15 turns.

### Step 2.11 — Go-live readiness  *(FOLDED into 2.13 — part of the release contract; see macro-2.md)*

- **Inputs:** accepted-candidate build + infra (compose/prod variant, CI).
- **Output path:** readiness checklist → `plans/reports/go-live-readiness-<date>-<slug>.md`.
- **Gate:** readiness green; rollback rehearsed; DR + NFR/load each cleared or N/A-by-decision.
- **Manual?** no.

Goal:
The readiness checklist is green: production build variant (Dockerfiles +
prod compose or deploy target) boots from a clean pull. **Offline caveat:** if
the base-image pull is network-blocked locally, follow the shared **Offline boot
caveat** (§ below) — accept prod-command boot on built artifacts + config-valid +
CI-delegated build, record the caveat, and prove the containerized boot in
CI/deploy before the 2.13 release. Environments isolated
with `.env.<env>.example` complete; backups configured and a restore verified;
**rollback rehearsed** (deploy previous `IMAGE_TAG`, one-line procedure
recorded); monitoring/alerting live. DR restore-drill + RTO/RPO and NFR/load
test (k6/Lighthouse) each either done or explicitly `N/A by decision` in the
dod-build toggles. STAGE.md Current = 2.12. Stop after 15 turns.

### Step 2.12 — UAT + sign-off *(CLIENT GATE; Lite: owner)*

- **Inputs:** running build + frozen prototype + UAT plan (delivery-closure-story templates).
- **Output path:** `docs/uat/*` + signed sign-off (`locale-vi/` for VN client).
- **Gate:** **ACCEPTANCE (CLIENT)** — critical journeys pass + matches prototype + sign-off signed.
- **Manual?** **yes** — pages the client (Lite: the owner).

Goal:
A UAT plan exists (`docs/uat/`, from the delivery-closure-story templates)
walking the client through every critical journey against the frozen prototype.
Emit MANUAL_CHECKPOINT inviting the client (Lite: owner) to run the UAT session;
record results per journey. The ACCEPTANCE gate clears only when the client's
written sign-off is recorded and the RTM is **forward-complete** (every in-scope
REQ-ID → ≥1 passing TC-NNN). Do not advance STAGE.md before the written
sign-off. STAGE.md Current = 2.13 only after sign-off. Stop after 10 turns.

### Step 2.13 — Release

- **Inputs:** accepted build + sign-off.
- **Output path:** release note (template `docs/mau-tai-lieu/release-note.md`, `locale-vi/` fork) + git tag + deployed production.
- **Gate:** release-note lists every released REQ-ID; **verify-at-source PASS** (not a smoke-200) + rollback = one `IMAGE_TAG` line — the 5 release rules + Post-Deploy Checklist are the SoT in `docs/playbooks/go-live-deploy-verify.md`.
- **Manual?** **MANUAL_CHECKPOINT** — the prod deploy is a named-endpoint human decision (`go-live-deploy-verify.md` Rule 5).

Goal:
The release is tagged and deployed to production. The release note (EN + VN fork
for a VN client) lists **every released REQ-ID**, the version, and the one-line
rollback (`IMAGE_TAG` of the previous release).

**Verify-at-source, fail-closed (closes L1 / FC6 — a green CI run and an HTTP-200
are liars for "the new build is live").** Apply the 5 rules in
`docs/playbooks/go-live-deploy-verify.md` (SoT) and fill its **Post-Deploy
Checklist** before declaring the release done:
1. health `.status==ok` (+ db/redis where applicable) AND a **build-specific
   content marker** observed in the served artifact — never CI-green / HTTP-200 /
   a version string (Rule 2);
2. build-time-inlined env (`NEXT_PUBLIC_*`, sitemap/OG/json-ld) baked via build
   ARG on a **real rebuild**, not a cached redeploy (Rule 1);
3. money / identity / legal secrets carry **real deploy-env values**, placeholder
   defaults rejected in prod, fail-closed proven at source (Rules 3-4);
4. the deploy is fired against a **named endpoint with human go-ahead** — emit
   `MANUAL_CHECKPOINT` naming the target host; never auto-fire a prod deploy
   (Rule 5).

**Then flip Mode A → Mode B (graduation — `docs/about/OPERATING-MODES.md` § The
graduation).** Go-live is the graduation point; in the SAME close edit `STAGE.md`:
its Macro-stage flips to **Steady-state (Macro 3)**, the **"current step" field is
dropped** (meaningless now) and replaced with **"Steady-state since {date}; board
= <issues link>"**, and it records that `/stage-next` is no longer the driver — the
**loop (issue-pipeline)** takes over and new work enters as **issues**, not stage
steps. A live product still naming a finite "current step" is the smell that it
graduated but nobody flipped the mode. STAGE.md Current = Post-Build / 3.1 (the
one-time 3.1 handover / 3.2 hypercare-kickoff / 3.6 retro ceremonies still run via
`/stage-next`; 3.3 + 3.5 are the continuous loop). Stop after 12 turns.

---

## Macro-Stage 3 — POST-BUILD

### Step 3.1 — Handover package *(CLIENT GATE; Lite: owner note)*

- **Inputs:** production release + all docs.
- **Output path:** `docs/handover/*` (`locale-vi/` for VN client), from the project-closure-story templates.
- **Gate:** **HANDOVER (CLIENT)** — docs/credentials/training/source-IP received + verified + **secrets rotated**.
- **Manual?** **yes** — pages the client (Lite: the owner).

Goal:
`docs/handover/` holds the closure package per the project-closure-story
templates: (1) handover docs — architecture, deployment guide, runbook, user
manual, released REQ-ID index; (2) credentials handover — every credential
listed, transferred via a secure channel (never committed), access **verified by
the receiver**, and **rotated at handover** so no pre-handover secret stays
live; (3) knowledge transfer — walkthrough recorded or session held. Emit
MANUAL_CHECKPOINT for the client's written receipt confirmation. In the Lite
lane a short internal handover note (where things run, credentials location,
runbook pointer) + owner ack suffices. STAGE.md Current = 3.2 only after the
confirmation. Stop after 12 turns.

### Step 3.2 — Hypercare + SLA window

- **Inputs:** production + the SLA terms (contract, Full lane) or an owner-set window (Lite).
- **Output path:** hypercare log under `docs/handover/` or `plans/reports/`.
- **Gate:** window closed, P1/P2 within SLA, 0 Critical open.
- **Manual?** no.

Goal:
The hypercare window (length + SLA from the contract, or owner-declared in Lite)
is logged: every incident with severity, response time, resolution; monitoring
checked daily. The window closes only with 0 Critical open and P1/P2 handled
within SLA; the close is recorded in the log + STAGE.md. STAGE.md Current = 3.3.
Stop after 10 turns.

### Step 3.3 — Steady-state maintenance / monitoring / backup

- **Inputs:** production.
- **Output path:** ops records (runbook updates, backup verification notes).
- **Gate:** uptime within SLA, backup restore verified, patches applied.
- **Manual?** no.

Goal:
Steady-state is documented in the runbook: monitoring dashboards/alerts listed,
backup schedule running with a **restore actually verified** (not assumed),
dependency/security patch cadence stated and applied. Recurring checks recorded.
STAGE.md Current = 3.4 (or 3.6 if no maintenance proposal will be made).
Stop after 10 turns.

### Step 3.4 — Maintenance proposal

- **Inputs:** hypercare results.
- **Output path:** `docs/handover/maintenance-proposal.md` (template + `locale-vi/` fork).
- **Gate:** tier proposed; client decides (Lite: N/A-by-decision allowed).
- **Manual?** no.

Goal:
`docs/handover/maintenance-proposal.md` proposes SLA tiers (from the template)
priced from real hypercare data; sent to the client and their decision recorded
— or, in the Lite lane, `3.4 — N/A by decision` recorded in STAGE.md. STAGE.md
Current = 3.6 (3.5 is always-on, not a queue step). Stop after 8 turns.

### Step 3.5 — Change control *(always-on, ASYNC — not a queue step)*

- **Inputs:** any post-freeze client/owner change request.
- **Output path:** `docs/requirements/change-requests/` — mints **CR-NN** (`locale-vi/` log fork).
- **Gate:** impact + re-estimate + approval **before** code.
- **Manual?** **yes** — push-notifies the human; never blocks the session.
- **Small vs large:** this full flow is for a **billable / new-feature** CR. A
  small free CR (owner absorbs it) skips the bao-gia and is handled like a bug —
  child issue + docs update. The bug/UAT/CR routing table lives in
  `playbooks/steady-state-issue-pipeline.md` (§ Bug vs UAT vs CR).

Goal (per request):
The request is logged as `CR-NN` in the change-request log with: impact analysis
(which REQ-IDs / entities / screens it touches), re-estimate, and price/schedule
delta (Full lane). Emit MANUAL_CHECKPOINT for the client/owner approval. Only
after written approval: mint the new REQ-ID(s), re-enter the pipeline at 2.3 —
the build-manifest gains a **new phase** (never an in-place stretch of a done
phase) — and proceed via 2.6. STAGE.md is not advanced by a CR; the CR log +
manifest carry it. Stop after 8 turns.

### Step 3.6 — Retro + journal + agent memory

- **Inputs:** session history + git log + STAGE.md History.
- **Output path:** `plans/reports/retro-<date>-<slug>.md` + changelog note.
- **Gate:** lessons captured; memory persisted.
- **Manual?** no.

Goal:
`plans/reports/retro-<date>-<slug>.md` exists per the session-retrospective
playbook: what worked, what hurt (Friction entries from session traces
aggregated), playbook lifecycle promotions/demotions applied
(experimental→verified where earned), and harness-improvement candidates listed.
Durable lessons are persisted to agent memory / decision records. The project
changelog gains a closing entry. STAGE.md marks the project closed (or
maintenance-mode). Stop after 10 turns.

---

## Offline boot caveat (shared — steps 2.4 & 2.11)

When a base-image pull is network-blocked locally, do **not** block the boot gate
on the network — accept substitute evidence and record the caveat in the register
row:

- a locally-cached postgres-16-compatible image may stand in for the db;
- app / prod-container boot is proven by running the **exact prod commands** on
  the built artifacts (`node dist/main.js`, `next start`);
- at 2.11 additionally accept "prod compose config valid + Dockerfiles present +
  image build delegated to CI".

The **containerized boot must then be proven in CI/deploy before the 2.13
release** — the offline substitution defers the container proof, it does not
waive it.

## Lookup convention for tooling

The `stage-runner` and the `.claude/hooks/stage-deliver.sh` notifier pick the
correct goal by matching the H3 heading whose step id follows `### Step ` against
the step token parsed from the latest stage-boundary commit subject (e.g.
`stage-1.5` matches `### Step 1.5`; `stage-2.6-p3` matches `### Step 2.6`).
Lite-lane variants use the `-lite` suffix (`### Step 1.5-lite`). Every step in
all three macro-stages has full goal text — a missing block is a harness defect,
not an expected state.
