# BA Core Doc Bundle Playbook

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> The mandatory checklist that guarantees the **5 load-bearing BA artifacts**
> exist, are internally consistent, and pass the **RTM completeness gate** before
> Pre-Build leaves BLOCK B. This is the spine of the requirements contract — if
> any of the five is missing or the RTM has a broken link, the whole macro-stage
> is built on sand. Owns Pre-Build **step 1.7**.

**Macro-stage / step:** Pre-Build · 1.7 (between 1.6 validate-SRS and 1.8
scenarios). **Gate it clears:** RTM completeness (backward) — the precondition for
**PB-G2 (scope frozen)**.

## Why This Playbook Exists

No `ck-*` skill owns this bundle. The harness has skills that *produce* each
artifact in isolation (`ck-xre` writes the SRS, `ck-rri` runs discovery,
`tech-graph` draws diagrams), but nothing guarantees the **five exist together,
agree with each other, and trace cleanly**. Without this checklist:

- A feature ships to PB-G2 with no REQ-ID → it is in scope but un-specified → it
  re-opens at build time as a "surprise", blowing the fixed price.
- A REQ-ID exists in the SRS but never lands in a use case → nobody knows the
  actor, trigger, or acceptance path → QA cannot write a TC-NNN for it later.
- The GLOSSARY says "Học viên / Student" but the SRS says "User" and the use case
  says "Customer" → three names for one actor → permission bugs.
- A BPMN swimlane shows a handoff (Sale → Class Ops) that no REQ-ID covers → the
  process has a hole that surfaces as a production stall.

With it, the chain `business problem → GAP-NNN → REQ-ID → use-case + RTM row` is
provably unbroken at PB-G2, and every downstream artifact (scenarios,
feature-register, bao-gia, TC-NNN) has a verified anchor.

## Engine

- **No single ck-skill owns the bundle.** This checklist is the engine; it
  *orchestrates* per-artifact producers.
- **Per-artifact engine binding:**

  | Artifact | Primary engine | Role(s) | Fallback (bare agent) |
  |---|---|---|---|
  | `VISION_SCOPE.md` | `researcher` + `docs-manager` (synthesize from intake brief + SRS) | BA | agent writes from the `intake-brief` + `gap-analysis` |
  | `use-cases/USE_CASES.md` | `researcher` (derive per REQ-ID); `ck-xre` SRS feeds actors/flows | BA | agent walks each REQ-ID into an actor+trigger+flow |
  | `GLOSSARY.md` (bilingual) | `docs-manager` (curate terms across SRS + discovery) | BA | agent extracts every domain term, forks VN |
  | `BPMN_DIAGRAMS.md` | `mermaidjs-v11` (inline) or `tech-graph` (publish-grade SVG) | BA + Designer | agent hand-writes Mermaid `flowchart`/`sequenceDiagram` |
  | `traceability/RTM.md` | `docs-manager` (assemble matrix) | BA | agent builds the matrix table by hand |

- Per D1 (Independence Principle) every row's fallback must produce the **same
  artifact shape** the verify-gate reads. The skill is the fast path, not a hard
  requirement. If a file here mandates a `ck-*` skill, treat it as a defect.

## When To Run

- **Primary:** Pre-Build step 1.7, after the SRS (1.5) is written and BLOCKERs
  are resolved (1.6), before scenarios (1.8) and feature register (1.9).
- **Secondary:** mid-build, when an approved change request (CR-NN) mints new
  REQ-IDs — re-run the affected RTM rows + use cases + glossary terms only.

Skip **no part**. This bundle has no "tiny lane" — even a one-screen tool needs
a VISION_SCOPE one-pager, at least one use case, a glossary stub, one BPMN, and
an RTM with ≥1 row. The cost of skipping is a scope dispute at PB-G4.

## Inputs

| Input | From step | Why needed |
|---|---|---|
| `docs/intake/…-intake-brief.md` | 1.2 | business problem → VISION_SCOPE § Background/Objectives |
| `docs/requirements/gap-analysis.md` (GAP-NNN) | 1.4 | RTM backward link REQ-ID → GAP-NNN |
| `docs/requirements/srs/<module>.md` (REQ-IDs) | 1.5 | the REQ-ID set every other artifact traces |
| `docs/requirements/CLARIFICATIONS.md` | 1.6 | unresolved BLOCKERs gate the bundle |
| `docs/discovery/*` (raw) | 1.1 | actor names, process steps, domain terms |

If any input is missing, **pause and gather** — a bundle built on a partial SRS
produces an RTM with phantom rows. Open BLOCKERs in CLARIFICATIONS (1.6) must be
answered or explicitly deferred-with-decision before the RTM can be marked
complete.

## The 5 Load-Bearing Artifacts — Exact Output Paths

```text
docs/requirements/
├── VISION_SCOPE.md                 # 1. the "why + what + boundary" one-doc
├── use-cases/
│   └── USE_CASES.md                # 2. actor × trigger × flow per REQ-ID
├── GLOSSARY.md                     # 3. bilingual term table (EN authoritative,
│                                   #    + locale-vi/GLOSSARY.md client fork)
├── BPMN_DIAGRAMS.md                # 4. cross-role business process models
└── traceability/
    └── RTM.md                      # 5. the completeness matrix (the gate)
```

Paths are **fixed** — the verify-gate and `docs/WORKFLOW.md` step 1.7 read these
exact locations. Do not rename or relocate.

---

## Artifact 1 — `VISION_SCOPE.md`

**Owner:** BA · **Engine:** `researcher` + `docs-manager`. **Stays EN** (internal
technical artifact, D4) — but its scope statement is the source the VN
feature-register and bao-gia paraphrase.

Required sections:

1. **Background** — current state (As-Is), the systems being replaced, the pain.
2. **Objectives** — measurable business goals (mirror gap-analysis To-Be § 1).
3. **In Scope** — the high-level feature/module list that PB-G2 will freeze.
4. **Out of Scope** — explicit exclusions WITH REASON (defends the bao-gia later).
5. **Actors / Roles** — the actor list (must match GLOSSARY § Actors exactly).
6. **Tech Stack** *(draft — frozen later by Tech Lead at 2.2)*.
7. **Constraints & Assumptions** — deadline, budget, regulatory, brownfield.

**Done when:** every In-Scope line maps to ≥1 module that has REQ-IDs in the SRS;
every actor appears in the GLOSSARY; Out-of-Scope is non-empty (an empty
out-of-scope is a scope-dispute liability).

---

## Artifact 2 — `use-cases/USE_CASES.md`

**Owner:** BA · **Engine:** `researcher` (the SRS REQ-IDs feed actors + flows).
**Stays EN.**

Each use case carries this shape (port from the real elearning-crm USE_CASES):

```markdown
## UC-01 · <Use case name>

| Field | Value |
|---|---|
| **Actors** | <GLOSSARY actor codes, e.g. STU, SYS> |
| **Trigger** | <what starts it> |
| **Pre** | <preconditions> |
| **Post** | <postconditions / success state> |
| **Priority** | High / Medium / Low |
| **Frequency** | <how often> |

**Normal Flow** — numbered happy path.
**Alt Flows** — AF-1, AF-2 … branches.
**Exceptions** — EX-1, EX-2 … failure paths.

**Trace**: <comma-list of REQ-IDs this UC realizes, e.g. IF.AUTH.01, IF.RBAC.01>
```

**Done when:** the `**Trace**` line of the use cases collectively cites **every
REQ-ID** in the SRS at least once (the forward half of RTM backward-completeness).
A REQ-ID with no use case is an incomplete bundle — write the use case or record
an explicit "infra-only, no user-facing UC" note in the RTM.

---

## Artifact 3 — `GLOSSARY.md` (bilingual, D4)

**Owner:** BA · **Engine:** `docs-manager`. **Authoritative file is EN-structured;
ship a `docs/requirements/locale-vi/GLOSSARY.md` client fork** (D4 — glossary is
a client-facing surface). IDs/term-codes stay EN in both files.

Term-table shape (port from the real elearning-crm GLOSSARY):

```markdown
| Term | Vietnamese | English | Definition | Avoid Using |
|---|---|---|---|---|
| STU | Học viên | Student | End customer who buys + consumes courses | "User", "Customer" |
```

Group by: Organization · Actors/Roles · Domain Objects · Statuses/States ·
Processes · Acronyms.

**Done when:** every actor in VISION_SCOPE § Actors and every entity referenced
in BPMN/use-cases has a glossary row; the `Avoid Using` column kills the
"three-names-for-one-thing" failure mode. The VN fork covers every client-visible
term.

---

## Artifact 4 — `BPMN_DIAGRAMS.md`

**Owner:** BA + Designer · **Engine:** `mermaidjs-v11` for inline doc diagrams;
`tech-graph` when a publish-grade SVG is needed for a client surface. **Diagram
file stays EN-structured; VN labels allowed inside diagrams that the client
reviews** (per D4 the labels are client-facing, the file/IDs are not).

For each cross-role business process (one per primary journey):

- A Mermaid `flowchart TD` or `sequenceDiagram` with **swimlanes per actor**
  (subgraph per role: e.g. `HỌC VIÊN`, `SEPAY`, `HỆ THỐNG`).
- Every handoff arrow between lanes must be backed by ≥1 REQ-ID (note it under
  the diagram).

**Done when:** every multi-role process in VISION_SCOPE has a diagram; every
inter-lane handoff cites a REQ-ID; no diagram shows a step with no covering
REQ-ID (an uncovered step is a process hole — open a GAP-NNN or a CLARIFICATION).

> Use `/mermaidjs-v11` skill for v11 syntax rules; use `tech-graph` only for
> client-facing publish-grade SVG. Both are accelerators — a bare agent can
> hand-write the Mermaid source.

---

## Artifact 5 — `traceability/RTM.md` — THE GATE

**Owner:** BA · **Engine:** `docs-manager`. **Stays EN.** This matrix is the
mechanical proof the chain is unbroken; the verify-gate
(`scripts/harness-verify-gate.sh`) reads it.

### Section 1 — Source Feature → REQ-ID → Use Case (backward chain)

```markdown
| # | Source Feature | SRS Requirement IDs | Use Case(s) | GAP |
|---|---|---|---|---|
| 1 | Authentication: JWT + Refresh + Google OAuth | IF.AUTH.01, IF.AUTH.02, IF.AUTH.03 | UC-01 | GAP-004 |
| 2 | RBAC phân quyền | IF.RBAC.01, IF.RBAC.02 | UC-01, UC-11 | GAP-005 |
```

### Section 2 — Forward Trace placeholder (filled in Build)

```markdown
| REQ-ID | Scenarios (SC-NNN) | Test Cases (TC-NNN) | Result |
|---|---|---|---|
| IF.AUTH.01 | SC-001 (high-risk) | (pending — minted at 2.8) | — |
```

Forward rows are stubbed at 1.7 and **completed at ACCEPTANCE** (2.12). Backward
rows are **frozen at PB-G2**.

### Section 3 — Coverage statistics

A per-module count: features, REQ-IDs, use-cases-covered, high-risk-reqs,
SC-NNN-covered. Surfaces gaps numerically.

---

## THE RTM COMPLETENESS GATE (runnable checklist)

Run this checklist before declaring step 1.7 done. **Every box must be ticked or
carry an explicit recorded exception** (a `docs/decisions/<slug>.md` or a
CLARIFICATIONS note). A single unchecked box with no exception = **incomplete
RTM** → the verify-gate blocks the stage-close commit.

### Backward completeness (frozen at PB-G2)

- [ ] **Every source feature has ≥1 REQ-ID.** No feature-register candidate line
  may exist with an empty `SRS Requirement IDs` column. (A feature with no REQ-ID
  is unspecified scope.)
- [ ] **Every source feature has ≥1 use case** (or an explicit "infra/setup — no
  user-facing UC" note). The `Use Case(s)` column is non-empty for every row.
- [ ] **Every REQ-ID traces to ≥1 GAP-NNN** OR carries an explicit "no-gap — new
  feature" note (greenfield reqs that no As-Is pain produced).
- [ ] **Every REQ-ID in the SRS appears in ≥1 use case `**Trace**` line.** No
  orphan REQ-IDs.
- [ ] **Every VISION_SCOPE In-Scope line maps to ≥1 RTM row.**
- [ ] **Every BPMN inter-lane handoff cites a covering REQ-ID.**

### Consistency completeness (frozen at PB-G2)

- [ ] **Actor names agree across VISION_SCOPE § Actors, GLOSSARY § Actors, and
  every use case `Actors` field.** One name per actor.
- [ ] **Every entity in BPMN + use-cases has a GLOSSARY row.**
- [ ] **No open BLOCKER in CLARIFICATIONS** touches a REQ-ID that the RTM marks
  complete. (BLOCKERs are answered or deferred-with-decision.)
- [ ] **VN `locale-vi/GLOSSARY.md` covers every client-visible term** (D4).

### Forward completeness (stubbed at 1.7, frozen at ACCEPTANCE — do NOT block 1.7)

- [ ] RTM Section 2 has a row per REQ-ID with a `Scenarios` + `Test Cases`
  column, even if pending. (Forward rows are *placeholders* at 1.7.)
- [ ] Every high-risk REQ-ID (flagged for 1.8) has a stubbed SC-NNN cell.

> **The mechanical rule** (from `docs/TRACE_SPEC.md` § RTM Completeness): *a
> feature-register line with no REQ-ID, a REQ-ID with no TC-NNN at ACCEPTANCE, or
> a high-risk REQ-ID with no SC-NNN and no skip note is an incomplete RTM.* The
> 1.7 gate enforces only the **backward + consistency** halves; the forward half
> is enforced later at ACCEPTANCE.

## Hand-Off

- **To 1.8 (scenarios):** the high-risk REQ-IDs flagged in RTM Section 2 are the
  decomposition input for `scenario-taxonomy-playbook.md` (mints SC-NNN).
- **To 1.9 (feature register):** every feature-register line MUST cite the RTM
  row's REQ-IDs — the register is the client-facing projection of RTM Section 1.
- **To PB-G2:** the backward-complete RTM is the evidence that "scope is frozen
  and fully specified" — the client signs against a register where every line has
  a traced REQ-ID.
- **To Build (2.8):** QA fills RTM Section 2 forward cells with TC-NNN as tests
  land; ACCEPTANCE checks forward completeness.

## Anti-Patterns

- **Writing the RTM last, as a formality.** The RTM is the *driver*, not the
  scribe — build it as you write use cases so orphans surface immediately.
- **An empty Out-of-Scope in VISION_SCOPE.** Guarantees a scope dispute at PB-G4.
- **Glossary drift.** "User" in the SRS, "Student" in the UC, "Customer" in the
  BPMN — the `Avoid Using` column exists precisely to forbid this.
- **BPMN as decoration.** A diagram with a handoff no REQ-ID covers is hiding a
  process hole — it must trigger a GAP or CLARIFICATION, not be ignored.
- **Marking forward completeness done at 1.7.** TC-NNN do not exist yet — forward
  cells are placeholders until 2.8/ACCEPTANCE.
- **Skipping a "tiny" artifact.** Even a one-screen tool needs all five (a
  one-pager VISION_SCOPE, one UC, a glossary stub, one BPMN, a 1-row RTM).

## Per-Tier Application

| Lane | Application |
|---|---|
| Tiny | All five required at minimum shape (one-pager vision, ≥1 UC, glossary stub, 1 BPMN, ≥1 RTM row). The bundle has no skip. |
| Normal | All five full; backward + consistency completeness gate enforced. |
| High-risk | All five full + RTM Section 2 high-risk SC stubs for every flagged REQ-ID + stakeholder validation round on VISION_SCOPE. |

## Variant Section

(Append a Variant block here when this checklist fails or partially works — e.g. a
recurring orphan pattern the completeness gate missed. Do not delete the original
5-artifact shape or the gate.)

## Related

- `docs/WORKFLOW.md` § 1.7 — the step this playbook owns.
- `docs/TRACE_SPEC.md` § RTM Completeness Rule — the mechanical gate this enforces.
- `gap-analysis.md` — produces GAP-NNN (RTM backward link).
- `scenario-taxonomy-playbook.md` — consumes high-risk REQ-IDs (mints SC-NNN).
- `bilingual-delivery-template-pattern.md` — the GLOSSARY VN fork pattern (D4).
- `solo-dev-client-delivery.md` § 1.7 — the meta-playbook that calls this.
- `docs/ROLE_MAP.md` — BA role binding for each artifact's engine.
