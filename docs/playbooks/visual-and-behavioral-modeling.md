# Visual & Behavioral Modeling Playbook

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Pre-Build BLOCK C. Runs after design tokens are set (1.10) and before the
> prototype freeze (1.12/1.13). Produces the **screen map, user flows, business
> workflows, ERD draft, role-permission matrix, and status-flow** diagrams —
> artifacts that serve TRIPLE duty: client review surface + AI code-generation
> handoff + ACCEPTANCE reference baseline. Owns Pre-Build **step 1.11**.

**Macro-stage / step:** Pre-Build · 1.11 (after 1.10 brand/tokens, before 1.12
prototype). **Feeds:** the prototype (1.12), the feature register (1.9 risk
notes), and — forward — the SA's ERD freeze (2.1).

## Engine

- **Fast path:** `ck-ux-design` (personas, screen map, user flows, RPM,
  status-flow; auto-generates user-flow / screen-map SVGs via `tech-graph`).
  The prototype (1.12) is built in an **external design tool** (Claude Design /
  Open Design / Google Stitch / Pencil.dev) — **or (TRIAL)** as an in-repo
  `board.html` via **Claude Code + a taste/anti-slop frontend skill** (default
  `design-taste-frontend`, BETA/swappable; engage the taste skill for the PUB
  landing/auth zone only, design-system for product screens). Board adds pan/zoom +
  per-screen comments. See `docs/mau-tai-lieu/prototype-build-prompt.md` + the 1.12 ADR
  amendment.
- **Diagram rendering:** `mermaidjs-v11` (inline) or `tech-graph` (publish-grade
  SVG for client surfaces).
- **Role:** Designer. **Bare-agent fallback:** the `ui-ux-designer` agent
  hand-writes the Mermaid diagrams + RPM/status-flow tables. Per D1 the skills are
  accelerators.

## Why This Stage Exists

Without it: clients give cosmetic feedback at ACCEPTANCE (late, expensive); AI
code generation drifts with no visual contract; permission + state-machine bugs
surface in production audit logs; scope disputes escalate because "what we agreed
to build" lives only in prose.

With it: one visual artifact is reviewed BEFORE code, after which "matches the
frozen prototype" is the ACCEPTANCE pass criterion; AI generation has a
pixel-anchored target; permission + state holes show up as matrix/status-flow gaps
instead of security incidents.

## When To Run

- Any project where a non-tech client accepts the product at ACCEPTANCE (2.12).
- Any project touching authorization (roles, permissions) OR stateful entities
  (orders, applications, tickets).
- Any project where AI-coding output quality depends on a visual reference.

Skip when: internal tool with one role and no state machines; pure refactor /
migration with no new surface; client is technically literate AND reads PRD-style
spec without visual loss.

## Output Folder

```text
docs/visuals/
├── diagrams/
│   ├── sitemap.md
│   ├── user-flow-<flow-name>.md
│   ├── business-workflow-<workflow-name>.md
│   ├── erd-draft.md
│   ├── role-permission-matrix.md        # locale-vi/ fork (client-facing, D4)
│   └── status-flow-<entity>.md          # locale-vi/ fork (client-facing, D4)
└── prototype/                            # filled at 1.12 (external design tool)
    ├── README.md
    ├── screens/
    └── flows/
```

> The **prototype** (sub-folder above) is built at **step 1.12** in an **external
> design tool** (Claude Design / Open Design / Google Stitch / Pencil.dev — **not**
> Claude Code) and frozen at **PB-G3** (1.13). This playbook owns the **diagrams**
> (1.11); it stops at the freeze gate hand-off.

## Sub-Step A — Design System Check

Confirm the design contract from 1.10 exists and is current. This is a CHECK, not
a rebuild.

Required: `docs/design-guidelines.md` exists, produced via
`ui-design-system-contract.md` § Style Intake. Gate before sub-step B: the
Component Coverage Matrix covers every component the prototype will use. Missing
components → stub the row (TODO) or generate the component first.

If the contract does NOT exist, stop and run `ui-design-system-contract.md`.
Skipping this gate guarantees prototype drift.

## Sub-Step B — Business Diagrams

The **screen inventory (C.0) is the FIRST mandatory artifact** here — produce it
before the six diagrams below. Each diagram then catches a different class of
defect.

### C.0 — Screen Inventory + Floorplan Classification

The mandatory first artifact of screen mapping. List **every screen** and, for
each one **containing a data grid OR a create/edit form**, assign exactly one §4
floorplan from `docs/design-system/design-rules.md` (or `CUSTOM` + a one-line
rationale per §4.7 → `docs/decisions/<slug>.md`), plus its table / message /
modal / create behaviors. Write it to
`docs/visuals/diagrams/screen-inventory.md` (template:
`docs/mau-tai-lieu/screen-inventory.md`).

Classification is **MANDATORY for any grid/form screen REGARDLESS of lane** —
including Tiny / internal. The drift this prevents is born in fast internal
modules, so they are not exempt. Only a genuinely trivial single-screen tool with
**neither a grid nor a form** may skip a floorplan row.

A grid/form screen left unclassified (empty Floorplan cell, or a `<...>` / `TODO`
/ `?` placeholder) is a **freeze blocker**, mirrored mechanically by the
verify-gate, which blocks on any empty/placeholder Floorplan cell once this file
exists. This is the input `build-execution.md` reads before coding a screen and
`code-review-scoring.md` enforces as a merge floor.

### C.1 — Sitemap
Flat list of every page/screen, grouped by role (guest, customer, staff, admin).
`docs/visuals/diagrams/sitemap.md`. Catches "we forgot the staff dashboard".

### C.2 — User Flow (per primary journey)
Step-by-step path for one job-to-be-done; one file per major flow. Mermaid
flowchart + numbered steps. `user-flow-<flow-name>.md`. Catches dead-ends before
AI generates one.

### C.3 — Business Workflow
Cross-role process model (who hands off to whom) for any multi-role process.
Mermaid `sequenceDiagram` or swimlane. `business-workflow-<workflow-name>.md`.
Catches "staff has no way to escalate to admin". **Aligns with the BPMN diagrams
from 1.7** — reconcile; do not contradict the BA bundle.

### C.4 — ERD Draft
Entity-relationship diagram, draft level (no field detail). Mermaid `erDiagram`.
`erd-draft.md`. Catches "we modeled order as belongs-to-user but the spec needs
guest orders". **This draft is the input the SA freezes at step 2.1** (the ERD
FROZEN gate) — it is a draft here, authoritative there.

### C.5 — Role-Permission Matrix (RPM)
Who-can-do-what grid: roles × resources × CRUD with conditional codes +
**REQ-ID citations** (`MODULE.AREA.NN`). `role-permission-matrix.md` (`locale-vi/`
fork — client-facing, D4). Catches "staff was supposed to refund but no REQ-ID
granted refund permission".

### C.6 — Status Flow (per stateful entity)
State machine per entity with workflow states. Mermaid `stateDiagram-v2` +
transition table (role / pre-condition / side-effect columns).
`status-flow-<entity>.md` (`locale-vi/` fork — client-facing, D4). One file per
entity. Catches "user stuck in 'in-review' because no transition leads back to
'pending'".

#### Strict Rule (high-risk lane)

Every stateful entity MUST have a status-flow file — no exceptions short of a
`docs/decisions/<slug>.md` documenting the skip. An entity is **stateful** when
ANY holds:

- Its ERD row has a `status` / `state` / `phase` enum column.
- It has ≥2 distinct states that gate downstream behavior.
- Different roles take different actions depending on state.
- Its state is recorded in an audit log on transition.

Stateful examples: `order`, `payment`, `subscription`, `user`, `kyc_application`,
`support_ticket`, `invoice`, `refund`, `dispute`. NOT stateful (skip): read-only
entities (`country`, `currency`), join tables (`order_items`), append-only audit
rows. If unsure: write the file.

##### Coverage check before freeze

```text
For each entity in docs/visuals/diagrams/erd-draft.md:
  If entity has a status/state column OR ≥2 states OR is in the stateful list:
    → status-flow-<entity>.md MUST exist
    → MUST be referenced from a story or the RTM
```

Surface any miss as a freeze blocker — the prototype freeze (1.13) cannot pass
until the gap is closed (file exists OR a decision records the explicit skip).

## Freeze Gate For Diagrams

Before the prototype freeze (1.13):

- [ ] **Screen inventory (C.0) complete** — every grid/form screen classified to
  one §4 floorplan (or `CUSTOM` + rationale). **Any unclassified grid/form screen
  = freeze blocker.**
- [ ] All 6 diagram files exist.
- [ ] Sitemap covers every prototype screen.
- [ ] Every primary user flow has a User Flow doc.
- [ ] ERD-draft entities match RPM resources.
- [ ] Business workflows reconcile with the 1.7 BPMN diagrams.
- [ ] RPM Coverage Check passes — every grid cell cites a REQ-ID.
- [ ] Status Flow Coverage Check passes (each stateful entity).

## Cross-Stage Hand-Off Rules

| Going INTO 1.11 | Required |
|---|---|
| from 1.10 (brand/tokens) | `docs/design-guidelines.md` exists; Component Coverage Matrix populated. |

| Going OUT OF 1.11 | Required |
|---|---|
| to 1.12 (prototype) | All 6 diagrams frozen; RPM REQ-IDs cited; **screen-inventory.md classified** (every grid/form screen → one §4 floorplan or CUSTOM). |
| to 2.6 (build) | Screen-inventory row per grid/form screen is the floorplan a Fullstack Dev confirms before coding (`build-execution.md`). |
| to 2.1 (SA ERD freeze) | ERD-draft is the input the SA promotes to FROZEN. |
| to 2.12 (ACCEPTANCE) | Prototype URL still accessible; UAT cites prototype as visual pass criterion. |
| to 3.1 (handover) | Prototype + diagrams ship in the handover package. |

## Anti-Patterns

- **Skipping when client is non-tech.** That is the exact case where this pays
  for itself. Do not skip.
- **Generating prototype before design tokens.** Drift is guaranteed. Run
  sub-step A first.
- **Iteration > 2 rounds without freeze.** Either scope is wrong or the client is
  using the prototype as a discovery surface — escalate via change-request log.
- **One huge diagram file.** Split per flow / per entity. File-level grep is the
  audit mechanism.
- **Diagram + prototype disagree.** Two views of one fact: prototype wins for UI,
  diagrams win for behavior. Reconcile within 1 working day.
- **Business workflow contradicts the 1.7 BPMN.** They model the same processes —
  one source of truth. Reconcile against the BA bundle.
- **Treating these as one-time outputs.** Living until ACCEPTANCE freeze; update
  via change-request.

## Per-Tier Application

| Lane | Application |
|---|---|
| Tiny | Skip whole stage. |
| Normal | Sub-step A + sitemap + ≥1 user flow + 1 prototype screen per client-visible surface. RPM + Status Flow optional. |
| High-risk | All sub-steps. RPM + Status Flow **strict** — every stateful entity per § C.6 has a file, or a decision documents the skip. |

> **Floorplan classification (C.0) overrides the lane skips above.** It is
> MANDATORY for **any screen with a data grid OR a create/edit form, REGARDLESS
> of lane** — including the Tiny lane and internal modules, which is exactly where
> the drift starts. Only a genuinely trivial single-screen tool with neither a
> grid nor a form may skip a floorplan row; everything with a grid or form gets a
> §4 floorplan (or `CUSTOM` + rationale) in `screen-inventory.md`.

## Variant Section

(Append a Variant block here when this playbook fails or partially works. Do not
delete the original shape.)

## Related

- `docs/process/WORKFLOW.md` § 1.11 — the step this playbook owns; § 2.1 — ERD freeze.
- `solo-dev-client-delivery.md` § 1.10–1.13 — caller.
- `ui-design-system-contract.md` — sub-step A source (1.10).
- `docs/design-system/design-rules.md` — Tier-1 §4 floorplans + behavior the C.0
  classification assigns; §4.7 CUSTOM escape hatch.
- `docs/mau-tai-lieu/screen-inventory.md` — the C.0 screen-inventory template.
- `design-system-3-tier.md` — cross-stage 3-tier enforcement (owns the 1.11
  screen-inventory as part of the chain).
- `ba-core-doc-bundle.md` — the 1.7 BPMN diagrams the workflows reconcile with.
- `mermaidjs-v11` (skill) — diagram syntax; `tech-graph` — publish-grade SVG.
- `bilingual-delivery-template-pattern.md` — RPM + status-flow `locale-vi/` forks.
- `docs/process/ROLE_MAP.md` — Designer role + `ck-ux-design` engine binding.
