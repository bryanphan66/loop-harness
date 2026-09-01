# loop-harness docs — START HERE (the map)

This repo IS a reusable delivery harness: run it and a project comes out to a
fixed standard. Everything is organised by **what you need right now**.

## What are you trying to do?

| I want to… | Go to |
|---|---|
| **Understand how the harness runs** (the process) | `process/WORKFLOW.md` (the step map) + `process/macro-2.pipeline.yaml` (Build phase as a machine-readable spec) |
| **Run the next step** | the `/stage-next` command (reads `process/WORKFLOW.md` + `STAGE.md`) |
| **Look up a recipe for a step** (how to actually DO it) | `playbooks/` (one file per reusable task/domain) |
| **Know what a step must pass** (the checks) | `gates/` (checklists) + `docs/gates/lint-gates-registry.md` (the scripts) |
| **Fill in a project document** (blank forms) | `mau-tai-lieu/` (build-manifest, feature-register, SOW, prototype-prompt, …) |
| **Scaffold the actual app code** | `../scaffolds/` (stack-pnpm-nest-next monorepo, steady-state scripts, ops-board) |
| **Understand the harness itself** (design, glossary) | `about/` (HARNESS.md, STRUCTURE.md, KEYWORD-MAP.md, …) |

## The four kinds of thing (don't confuse them)

- **process/** — the PROCESS: the ordered steps (Pre-Build 1.x, Build 2.x, Post 3.x)
  and their spec. This is *how the harness runs*.
- **playbooks/** — RECIPES used AT a step (e.g. "how to compile the build-manifest",
  "how to author an issue"). A step points to its playbook(s).
- **gates/** — CHECKS a step must pass before the next may start.
- **mau-tai-lieu/** — blank DOCUMENT forms a project fills (Markdown). NOT code.
- **`../scaffolds/`** (repo root, one level up) — the CODE scaffolds copied into a
  new project's filesystem. This is the *only* "templates that are code"; the doc
  forms live in `mau-tai-lieu/` here. Two different things, two different names.

## How the Build phase (Macro-2) is wired

`process/macro-2.pipeline.yaml` is the single machine-readable spec: for **each
step** it lists `driver · inputs · gates · playbooks · output · exit_when`. Read
that one file to see, e.g., "step 2.6 uses `/build-phase`, gates
`check-prototype-fidelity` + `check-ac-coverage`, playbooks `build-execution` +
`prototype-export-adoption`". `process/WORKFLOW.md` is the human table; the yaml
is what `/stage-next` and the RTM dashboard read.

## Maturity — what to TRUST (read before relying on anything)

Not everything here is equally real. Every capability is tagged in
`about/UNDERSTANDING-loop-harness.md` (the honest scorecard):

- **PROVEN** — run for real on a project (elearning / hasi-hub). Trust it. (Most of
  the spine: build-manifest, walking-skeleton, `/build-phase`, the Mode-A gates,
  the Mode-B 10-state loop, verify-at-source, R2/R3 recover.)
- **PATCHED** — born from one real failure, turned into a rule. Correct but may be
  heavy/specific (e.g. REQ-ID token chain, Full-vs-Lite lanes).
- **ASPIRATIONAL** — designed, **NOT built**. Do not assume it works. Currently:
  **R1 auto re-dispatch on BLOCKED**, **ops-board** (experimental, never run on
  real data), **graph/incremental-preview** (OPERATING-MODES admits no executable
  graph yet), Mode-B auto-QC (frontier, not formalized).

If a doc describes a mechanism, check its tag before trusting it exists.

## Folder index

- `process/` — WORKFLOW, STAGE_GOALS, macro-2.pipeline.yaml, OPERATING-MODES, TRACE_SPEC (token grammar), ROLE_MAP, CONTEXT_RULES
- `about/` — HARNESS (3-layer model), STRUCTURE (this repo's map), KEYWORD-MAP (term → owner file), UNDERSTANDING (narrative + honest scorecard), DOC-STANDARD, TEST_MATRIX, HARNESS_CHANGELOG
- `playbooks/` — reusable recipes (`playbooks/README.md` indexes them)
- `gates/` — gate checklists + `lint-gates-registry.md` (the mechanical checks)
- `mau-tai-lieu/` — blank doc forms (`locale-vi/` = VN bilingual fork)
- `decisions/` — ADRs · `design-system/` — 3-tier UI contract
