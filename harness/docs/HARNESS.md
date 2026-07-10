# Harness

The **videcode-harness** is a reusable operating model that lets a solo dev (with
agents) turn a raw client lead into safe, validated, accepted, maintained
software across **3 macro-stages** — Pre-Build, Build & Go-live, Post-Build.

The app is what the client touches. The harness is what agents touch.

## Three-Layer Architecture

The harness is the **control plane** that drives an **engine** of artifact
producers, executed by **role players**.

| Layer | Role | Components |
|---|---|---|
| **Control plane** | decides *what runs next* + *did the gate pass* | `STAGE.md`, the canonical gates (`docs/WORKFLOW.md`), the verify-gate hook (`scripts/harness-verify-gate.sh`), stage-boundary commits, the `stage-runner` orchestrator + `/stage-next` |
| **Engine** | *produces* the artifact each step | the `ck-*` skills (live, **invoked** — never vendored) + `cook` / `ship` / `deploy` / `devops` |
| **Role players** | *execute* each SDLC role's work | the global agents (planner, researcher, fullstack-developer, code-reviewer, tester, debugger, ui-ux-designer, docs-manager, project-manager, git-manager, code-simplifier, journal-writer, brainstormer), orchestrated by `stage-runner` |

The control plane is portable and self-contained. The engine and role players are
**accelerators**: a bare agent reading the playbooks can play every role and
produce every artifact without any `ck-*` skill.

Full role → engine binding: `docs/ROLE_MAP.md`. Step-by-step map:
`docs/WORKFLOW.md`.

## Independence Principle

The harness must function with only:

- An agent that can read/write files and run shell commands (Claude Code,
  Cursor, Continue, or a human reading the docs).
- Git and bash (for `scripts/install-harness.sh`).

The `ck-*` skills are the **live engine** the harness invokes — but they are
**accelerators, not dependencies**. The harness must still be runnable on a bare
agent + git + bash.

Specifically:

- `AGENTS.md`, `STAGE.md`, `docs/WORKFLOW.md`, `docs/HARNESS.md`,
  `docs/TRACE_SPEC.md`, and `scripts/install-harness.sh` MUST NOT reference any
  `ck-*` skill as a **required** step.
- `install-harness.sh` **preflight-checks** that `~/.claude/skills` and
  `~/.claude/agents` exist and **WARNS if missing** — it never copies them into
  the project repo.
- Playbooks reference `ck-*` skills only in their **Engine** / **Related**
  sections as the fast path. Every playbook's core logic must be executable by a
  plain agent — the skill is enrichment, not gating.

When an agent finds a playbook, template, or plan that mandates a `ck-*` skill
before it can run, treat it as a **defect** — refactor the file or open a backlog
entry. Decision record: `docs/decisions/ck-skill-engine-not-vendored.md`.

## How ck-Skills Bind As Engine

For each step, `docs/WORKFLOW.md` names an **Engine** (a `ck-*` skill or a global
agent). At run time:

1. `install-harness.sh` already ran the preflight. If `~/.claude/skills`
   exists, the named `ck-*` skill is the **fast path**.
2. `stage-runner` invokes the skill to produce the step's artifact at the path in
   `docs/WORKFLOW.md`.
3. If the skill is **absent** (preflight warned), the role's global agent runs
   the playbook's core logic instead and produces the same artifact shape.

The skill never owns the contract — the **artifact path + shape** in
`docs/WORKFLOW.md` and the **token grammar** in `docs/TRACE_SPEC.md` are the
contract. The skill is one way to fill it.

## Source Hierarchy

```text
client lead / user-provided spec
  input material for Pre-Build

docs/requirements/*            (BA spine: SRS + REQ-ID + RTM + use-cases + glossary)
  the requirements contract

docs/scope-baseline/*          (feature-register + scope matrix)
  the frozen scope contract (PB-G2)

docs/visuals/prototype/*       (full-function prototype)
  the frozen visual contract (PB-G3)

docs/decisions/*               (ADR by stable slug)
  why the contract changed
```

Before build, these docs describe intent. After build, the same docs plus
executable tests (TC-NNN) become the living contract agents update as the system
evolves.

## Playbook Lifecycle

Every playbook carries a lifecycle status so readers know whether the guidance
was exercised on real work or is still a paper proposal. The status is a single
grep-able line near the top:

```markdown
**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none
```

| State | Meaning |
|---|---|
| `experimental` | Shipped but not yet exercised on a real step. Treat as proposal. |
| `verified` | Used on ≥1 real step with no Variant amendment required. Safe to follow as-is. |
| `deprecated` | Superseded by a newer playbook, or accumulated 2+ Variant amendments without convergence. Do not start new work from it. |

Promotion / demotion:

- `experimental` → `verified`: 1 step used it successfully without a Variant
  section, OR 2 steps used it (minor Variant sections allowed).
- `verified` → `deprecated`: superseded by a newer file, OR 2+ Variant sections
  point to systemic issues.

Update the `First use` and `Verified by` fields on promotion. Keep the line as a
single sentence so `grep -l "experimental" docs/playbooks/` returns the current
candidate set.

## Coverage

All three macro-stages are **built fully**: step tables + gates
(`docs/WORKFLOW.md`), per-step goal text (`docs/STAGE_GOALS.md`), templates and
playbooks. Macro 2 executes through the **build-manifest** (compiled at 2.3
from the frozen spec) and the **`/build-phase` loop** (one manifest phase per
isolated invocation) on top of the **walking-skeleton stack template**
(`templates/stack-pnpm-nest-next/` in the harness source, scaffolded at 2.4).
Macro-1 weight is lane-scaled (`docs/WORKFLOW.md` § Lanes: Full vs Lite).

Conditional enterprise gates (data-migration/cutover, NFR/load, DR + RTO/RPO,
compliance/privacy/WCAG, observability/SLO) live mostly in Build & Go-live and
Post-Build. Each must be explicitly marked **N/A by decision** when not needed —
never silently dropped.

## Locked Decisions

Shorthand labels cited across the docs (`D1`…`D6`). These are settled — an
audit or refactor does not silently reverse them:

| # | Decision |
|---|---|
| **D1** | Independence Principle — `ck-*` skills are accelerators, never dependencies; the harness runs on a bare agent + git + bash. |
| **D2** | Balanced process — enterprise gates are **conditional**: cleared or explicitly `N/A by decision`, never silently dropped. |
| **D3** | Token scheme — `GAP-NNN → REQ-ID (MODULE.AREA.NN) → SC-NNN → TC-NNN`, `CR-NN`; `US-NNN.REQ-MMM` is not used. |
| **D4** | Bilingual split — client-facing surfaces fork to `locale-vi/`; internal technical artifacts stay English; IDs/paths/code stay EN everywhere. |
| **D5** | SA and Tech Lead are separate named roles (ERD freeze vs stack/API/threat-model). |
| **D6** | Engine is preflight-checked, never vendored — `install-harness.sh` warns about missing skills/agents but never copies them. |

## Growth Rule

The harness grows from friction. When an agent is confused, repeats manual
reasoning, finds a missing rule, or hits a recurring failure, it must improve the
harness directly or record the friction. The capture mechanism is the **Friction**
field in every session trace (`docs/TRACE_SPEC.md`); friction that should become
work graduates into a plan or a decision. Harness-version changes are logged in
`docs/HARNESS_CHANGELOG.md` (one entry per hardening round, naming the failures
it closes) — latest **v5** (non-CRUD delivery capability: manifest `Phase-type` +
the async-job / object-storage / media-pipeline / external-integration playbooks +
opt-in tier-2 stack primitives, so a media/async/storage/integration REQ-ID is
routed and acceptance-verified instead of improvised into a CRUD phase).

## Traceability Tokens

Pointer only — the full grammar, chain, and RTM completeness rule live in
`docs/TRACE_SPEC.md`. In short: `GAP-NNN → REQ-ID (MODULE.AREA.NN) → use-case +
RTM row → SC-NNN → feature-register line → SOW line → TC-NNN`, with `CR-NN` for
change requests. **`US-NNN.REQ-MMM` is not used** in this harness.

## Project Doc Mapping

The harness organizes information into process-folders (discovery, intake,
requirements, scope-baseline, visuals, design, stories, decisions). The
global-`CLAUDE.md` convention expects a fixed set of doc names. The crosswalk —
which harness folder backs each expected doc, and which is a living contract vs a
derived view — lives in `docs/README.md`. When in doubt, the harness layout wins.
