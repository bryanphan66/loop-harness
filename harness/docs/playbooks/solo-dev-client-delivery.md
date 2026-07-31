# Solo-Dev Client Delivery Playbook

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Meta-playbook for a solo dev (with agents) delivering paid client work through
> the harness's **3 macro-stages** — Pre-Build, Build & Go-live, Post-Build. Maps
> each commercial step to an existing harness artifact + the playbook that
> produces it. **Pointers only — no new mechanics.** Honors
> `playbook-composition-pattern.md`: this composes, it never duplicates.

**Authority:** `docs/WORKFLOW.md` (step tables) + the locked decisions D1–D6
(`docs/HARNESS.md` § Locked Decisions). The map below is a commercial wrapper
around `docs/WORKFLOW.md`; when this file disagrees with it, `WORKFLOW.md` wins.

## Engine

The harness invokes `ck-*` skills as the **live engine** per macro-step (see the
Engine column in `docs/WORKFLOW.md`). This meta-playbook names no single engine;
it routes to per-step engines: `ck-intake-file` (1.1), `ck-rri` (1.3),
`ck-xre` (1.5/1.6), `ck-scenario` (1.8), `ck-scope-package` (1.9),
`ck-design-system` (1.10), `ck-ux-design` (1.11). The 1.12 prototype is built in
an external design tool (Claude Design / Open Design / Google Stitch / Pencil.dev),
not in Claude Code. Per D1 the skills are
**accelerators, not dependencies** — on a bare agent + git + bash the global
agents play every role from the playbook core logic.

## When To Run

- First time using the harness for a paid client project.
- Re-orienting mid-project ("where am I in the 3-macro flow, what do I owe next?").
- Onboarding a collaborator into the commercial side of a project.

Skip when the project is mid-flight with a working cadence — do not retrofit
ceremony.

**Internal / OSS / personal projects:** still run all three macro-stages with the
human playing the client at every client-paging gate (PB-G2, PB-G3, PB-G4,
ACCEPTANCE, HANDOVER). Commercial artifacts (priced bao-gia, signed contract)
become lightweight self-SOWs: scope + deadlines + done-when, no price.

## The Flow — 3 Macro-Stages

The full step-by-step 3-macro flow (steps + gates + the PROTOTYPE-THEN-QUOTE invariant) is in `WORKFLOW.md` § TL;DR Flow — not repeated here. This playbook only maps the **commercial** steps (bao-gia / contract / deposit / client-paging) onto that flow.

## Macro-Stage 1 — Pre-Build *(built fully)*

### 1.1–1.2 — Capture + Intake Brief (BLOCK A)

- **Artifacts:** raw input under `docs/discovery/YYYY-MM-DD-<slug>.{ext}`
  (append-only) + Source Map; vendor brief at `docs/intake/…-intake-brief.md`
  (`locale-vi/` fork — client-facing).
- **Engine:** `ck-intake-file` · `project-manager`.
- **Gate:** **PB-G1** intake go/no-go — *internal capture, does NOT page the
  client* (proceed / park / decline). Required even when self-initiated.

### 1.3–1.6 — Discovery → Gap → SRS → Validate (BLOCK B start)

- **1.3 Discovery interview:** `discovery-interview-playbook.md` (5 personas ×
  3 modes) → `docs/intake/…-discovery-summary.md`. Engine `ck-rri`.
- **1.4 Gap analysis:** `gap-analysis.md` (As-Is/To-Be MoSCoW) →
  `docs/requirements/gap-analysis.md`, mints **GAP-NNN** (`locale-vi/` fork).
- **1.5 SRS IEEE-830:** `ck-xre EXTRACT` → `docs/requirements/srs/<module>.md` +
  `nfr/` + `permissions/` + `data-model.md` + README. Every req gets a **REQ-ID**
  `MODULE.AREA.NN`.
- **1.6 Validate + resolve BLOCKERs:** `ck-xre VALIDATE→RESOLVE-PATCH` →
  `docs/requirements/CLARIFICATIONS.md` (BLOCKER / IMPORTANT / NICE). Rolled into
  PB-G2.
- **Conditional intake probes:** during 1.3/1.6 ask **compliance /
  data-residency / DPA** and **brownfield (replacing a legacy system →
  migration?)**. Mark **N/A by decision** if not applicable — never silently drop.

### 1.7 — BA Core Doc Bundle (BLOCK B spine)

- **Playbook:** `ba-core-doc-bundle.md` — the mandatory 5-artifact checklist:
  `VISION_SCOPE.md`, `use-cases/USE_CASES.md`, `GLOSSARY.md` (bilingual),
  `BPMN_DIAGRAMS.md`, `traceability/RTM.md`.
- **Gate:** **RTM completeness (backward)** — every feature → ≥1 REQ-ID + ≥1 use
  case. This is the load-bearing checkpoint of the whole macro-stage.

### 1.8–1.9 — Scenarios + Feature Register (BLOCK B end)

- **1.8 Scenarios:** `scenario-taxonomy-playbook.md` (12 dims) →
  `docs/requirements/scenarios/*.md`, mints **SC-NNN**. High-risk reqs only;
  record skips.
- **1.9 Feature register + scope baseline:** `ck-scope-package` →
  `docs/scope-baseline/feature-register.{md,xlsx}` + scope matrix (`locale-vi/`).
- **Gate:** **PB-G2 (CLIENT) — scope frozen** = BLOCKERs answered (1.6) +
  feature-register frozen. *Pages the client.*

### 1.10–1.13 — Design Prototype (BLOCK C)

- **1.10 Brand + tokens:** `ui-design-system-contract.md` →
  `ck-brand-guidelines` → `ck-design-system`. Output `docs/design-guidelines.md`
  + tokens. Gate: Component Coverage Matrix.
- **1.11 Screen map / flows / RPM / status-flow / ERD draft:**
  `visual-and-behavioral-modeling.md` → `docs/visuals/diagrams/*`
  (`role-permission-matrix.md`, `status-flow.md` in `locale-vi/`). Engine
  `ck-ux-design`.
- **1.12 Prototype all functions:** **external design tool** — Claude Design /
  Open Design / Google Stitch / Pencil.dev (**not** generated in Claude Code) →
  `docs/visuals/prototype/` + share URL. Each screen ≥1 sample-data + ≥1
  empty/error state. *Manual — pages the Designer (MANUAL_CHECKPOINT).*
- **1.13 Review loop + FREEZE:** `docs/visuals/prototype/feedback-*.md` +
  `feedback-final.md`. **Gate: PB-G3 (CLIENT) — prototype frozen** in writing.
  >2 rounds = scope problem → change-request-log. *Pages the client.*

### 1.14–1.15 — Freeze + Quote + Contract (BLOCK D)

- **1.14 Bao-gia + technical overview + contract draft:**
  `docs/bao-gia/{01..05}.md` + PDF + `hop-dong-mau.docx` (`locale-vi/`). Every
  price line ↔ 1 feature-register row.
- **1.15 Sign contract + deposit:** signed contract + deposit; `docs/ROADMAP.md`
  skeleton born. **Gate: PB-G4 (CLIENT, hardest) — contract + deposit: NO build
  code before this.** *Pages the client.*

> **PROTOTYPE-THEN-QUOTE invariant:** freeze prototype (PB-G3) **before** the
> bao-gia (1.14), so the quote anchors to a frozen visual contract — the #1
> defense against scope dispute.

## Macro-Stage 2 — Build & Go-live

Entry PB-G4. The step table in `docs/WORKFLOW.md` §2.1–2.13 is authoritative.
Key playbooks:
`build-execution.md` (2.6), `code-review-scoring.md` (2.7),
`canonical-e2e-flow-playbook.md` + `e2e-qa-field-by-field-verify-with-report.md`
(2.8), `seed-data-pattern.md` (2.5), `payment-integration.md` (2.6 if money is in
scope). SA freezes the ERD (2.1); Tech Lead chooses stack + threat-model (2.2) —
two separate roles (D5). ACCEPTANCE (2.12) is the client gate.

## Macro-Stage 3 — Post-Build

Entry production deployed + sign-off signed. `docs/WORKFLOW.md` §3.1–3.6.
HANDOVER (3.1) is the client gate; change-control (3.5) runs always-on and
re-enters the pipeline at 2.3/2.6. `session-retrospective.md` closes every
multi-task session (3.6).

## Always-On Layers

- **Change request:** any post-PB-G4 client request → `ck-xre CHANGE-REQUEST` →
  `docs/requirements/change-requests/` (mints **CR-NN**, `locale-vi/`). Impact +
  re-estimate + approval **before** code. Async — push-notifies, never blocks.
- **Audit trail:** every released REQ-ID → ≥1 TC-NNN; every architecture/behavior
  choice → `docs/decisions/<slug>.md` (stable slug, never a number); every
  multi-task session end → `session-retrospective.md`.

## When This Playbook Conflicts With The Harness

The harness wins. Specifically you may **not**:

- Skip the BA Core Doc Bundle RTM completeness gate (1.7) under timeline pressure.
- Skip stack-selection / threat-model (2.2) before the first implementation step.
- Skip `code-review-scoring.md` for any non-trivial step.
- Replace the verification register (TC-NNN) with "UAT will catch it" — UAT TCs
  cite register rows; the register is the source of truth.
- Regenerate the frozen prototype post-PB-G3 to "match the code" — drift goes
  through `change-request-log.md` + a documented decision, never a silent
  re-render.
- Bypass a failing verify-gate to close a stage.

## Variant Section

(Append a Variant block here when this playbook fails or partially works. Do not
delete the original shape.)

## Related

- `docs/WORKFLOW.md` — the authoritative 3-macro step map this composes.
- `docs/TRACE_SPEC.md` — token grammar (`GAP→REQ→SC→TC`, `CR`).
- `docs/ROLE_MAP.md` — role → agent + skill engine binding (SA vs Tech Lead, D5).
- `playbook-composition-pattern.md` — composition rules this honors.
- `bilingual-delivery-template-pattern.md` — locale fork pattern (D4).
- `ba-core-doc-bundle.md` — step 1.7 (the load-bearing BA spine).
- `discovery-interview-playbook.md` · `gap-analysis.md` ·
  `scenario-taxonomy-playbook.md` — BLOCK B playbooks.
- `ui-design-system-contract.md` · `visual-and-behavioral-modeling.md` — BLOCK C.
- `code-review-scoring.md` · `build-execution.md` ·
  `canonical-e2e-flow-playbook.md` · `seed-data-pattern.md` ·
  `payment-integration.md` — Build & Go-live (next-increment detail).
- `session-retrospective.md` — end-of-session capture.
- `docs/decisions/ck-skill-engine-not-vendored.md` — D1 rationale.

## Addendum (2026-07-22) — client-deliverable pitfalls

- **Confirm the artifact TYPE before building it.** "UAT checklist" can mean an XLSX
  file, a PM-tool page (wiki), or per-feature tracker issues — these are different
  artifacts. Ask/confirm the format first; building the wrong one is pure rework.
- **The client-facing acceptance content comes from the per-AC user-guide (HDSD)
  blocks** (each AC's operator steps + expected result + deep-link anchor + demo),
  not just the feature-register's one-line AC text. The guide is the richer source.
- **Plan client authentication on staging up front.** A passwordless-OTP app on
  staging routes all mail to an internal catcher (Mailpit) with no public route — the
  client cannot self-receive an OTP for a demo account. Decide the access path
  BEFORE handing over: social login (e.g. Google) for the self-serve role, an
  auth-protected public webmail for OTP retrieval, or operator-supplied OTPs.
