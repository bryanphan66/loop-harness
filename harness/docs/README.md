# Documentation Map — Crosswalk

This directory holds the harness operating model plus the project contract a
bootstrapped project derives across the 3 macro-stages. This file is the
**crosswalk**: it maps the harness **process-folders** to the global-`CLAUDE.md`
expected doc names, and states which are a **LIVING CONTRACT** (agents update as
the source of truth) vs a **DERIVED VIEW** (generated on demand, never hand-kept
in sync).

This is a **reference table, not a sync chore**. When a tool or rule asks for one
of the expected paths and the harness equivalent is enough, the harness layout
wins — create a one-line redirect rather than duplicating content.

## Core Operating Docs

| File | Purpose |
|---|---|
| `HARNESS.md` | 3-layer architecture, Independence Principle, Playbook Lifecycle, ck-skills-as-engine. |
| `WORKFLOW.md` | The 3-macro-stage map — per-step tables, canonical gates, token chain. |
| `ROLE_MAP.md` | Role → agent + skill engine binding; SA vs Tech Lead (D5). |
| `TRACE_SPEC.md` | Token grammar (`GAP→REQ→SC→TC`, `CR`), RTM completeness rule. |
| `README.md` | This crosswalk. |

## Process-Folder → Expected-Doc Crosswalk

| Harness process-folder | Backs expected doc (global `CLAUDE.md`) | Kind | Notes |
|---|---|---|---|
| `discovery/` (raw, append-only) + `intake/` (vendor briefs) | `project-overview-pdr.md` | **LIVING CONTRACT** | Together with `requirements/VISION_SCOPE.md` they ARE the PDR — background, objectives, scope. |
| `requirements/` (SRS + REQ-ID + RTM + use-cases + GLOSSARY + CLARIFICATIONS + BPMN) | `project-overview-pdr.md` (requirements half) | **LIVING CONTRACT** | The BA spine. The RTM is the traceability backbone (`TRACE_SPEC.md`). |
| `scope-baseline/` (feature-register + scope matrix) | `project-roadmap.md` (scope half) | **LIVING CONTRACT** | Frozen at PB-G2. Every line traces to ≥1 REQ-ID. |
| `decisions/` (ADR by stable **slug**) | `system-architecture.md` | **LIVING CONTRACT** | Architecture/stack/ERD decisions by slug, never by number. SA owns ERD-freeze; Tech Lead owns stack. |
| `system-architecture.md` (root of docs/) | `system-architecture.md` | **LIVING CONTRACT** | Same name — written at step 2.1 (ERD) / 2.2 (stack). Born in Build & Go-live increment. |
| `design-system/` (Tier-1 `design-rules.md` — floorplans + screen behavior) | — (doctrine, no per-project equivalent) | **SHARED DOCTRINE** | Tier-1 UI doctrine — identical across projects, version-pinned. Ships with the harness like a playbook; CONSUMED by the per-project design contract, never per-project-authored. Distinct from `design/` + `design-guidelines.md` below. |
| `design/` + `design-guidelines.md` + `visuals/` (diagrams + prototype) | `design-guidelines.md` | **LIVING CONTRACT** | Tokens + RPM + status-flow + frozen prototype (PB-G3). Per-project; CONSUMES Tier-1 `design-system/design-rules.md`. Same name as the expected doc. |
| `stories/` (FLAT `<module>-NN-<slug>.md`) | `project-roadmap.md` (delivery half) | **LIVING CONTRACT** | Story queue = the delivery order. Born in Build & Go-live increment. |
| `ROADMAP.md` (module / milestone / timeline / %) | `project-roadmap.md` | **LIVING CONTRACT** | Skeleton born at PB-G4 (1.15); enriched + advanced in Build & Go-live. |
| `bao-gia/` (VN quote + contract + technical overview) | — (commercial, no global equivalent) | **LIVING CONTRACT** | Priced from frozen feature-register; PROTOTYPE-THEN-QUOTE invariant. |
| `git log` + `decisions/` | `project-changelog.md` | **DERIVED VIEW** | Reconstruct from commit history + dated decisions. Generate on demand. |
| generated on demand (e.g. `docs` skill) | `codebase-summary.md` | **DERIVED VIEW** | Skip until an agent asks; never hand-kept. |
| `templates/code-standards.md` → `code-standards.md` | `code-standards.md` | **DERIVED VIEW** | Stub ships in templates; project fills after stack-selection (2.2). |
| `templates/deployment-guide.md` → `deployment-guide.md` | `deployment-guide.md` | **DERIVED VIEW** | Stub ships in templates; project fills at first release (2.13). |

## Living Contract vs Derived View

- **LIVING CONTRACT** — agents must keep current as the source of truth. Drift
  here silently invalidates downstream work (a feature with no REQ-ID, a frozen
  prototype that no longer matches the build). The verify-gate and RTM
  completeness rule guard these.
- **DERIVED VIEW** — regenerated from a contract on demand. Never hand-maintained
  in sync; if it is stale, regenerate it rather than patch it. Treating a derived
  view as a contract is the sync-chore anti-pattern this crosswalk avoids.
- **SHARED DOCTRINE** — ships with the harness identically to every project (like
  a playbook), version-pinned, and CONSUMED by per-project contracts rather than
  authored per project. `design-system/design-rules.md` (Tier-1 UI doctrine) is
  the one such folder; the per-project Tier-2/Tier-3 contract pins its version.

## Folder Reference (target structure)

```text
docs/
├── HARNESS.md  WORKFLOW.md  ROLE_MAP.md  TRACE_SPEC.md  README.md
├── decisions/            # ADR by stable slug (not number)
├── design-system/        # Tier-1 UI doctrine (design-rules.md) — SHARED, version-pinned
├── playbooks/            # reusable recipes (experimental | verified | deprecated)
├── templates/            # scaffolds + locale-vi/ (client-facing forks) + STAGE.md (per-project)
├── discovery/  intake/   # raw append-only / vendor briefs
├── requirements/         # BA spine: srs/ + VISION_SCOPE + GLOSSARY + CLARIFICATIONS
│                         #   + BPMN + use-cases/ + traceability/RTM + scenarios/ + change-requests/
├── scope-baseline/       # feature-register.{md,xlsx} + diagrams/
├── design/  design-guidelines.md  visuals/{diagrams,prototype}/
├── stories/              # FLAT <module>-NN-<slug>.md
├── bao-gia/  uat/  runbook/  handover/  journals/
└── system-architecture.md  project-changelog.md   # shared names with global convention
```

## Bilingual Surfaces (D4)

`locale-vi/` forks exist for **all client-facing surfaces**: intake-brief,
gap-analysis, feature-register, bao-gia, change-request-log, release-note,
maintenance-proposal, role-permission-matrix, status-flow, plus handover docs and
user-guide. Internal technical artifacts stay **English**: SRS, ADR/decisions,
code, stories, spec-intake, validation, playbooks, `AGENTS.md`, `WORKFLOW.md`,
`TRACE_SPEC.md`. IDs/paths/code stay EN even inside VN files.
