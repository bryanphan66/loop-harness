# loop-harness

> A loop-engineering delivery harness. Repo slug `loop-harness` (renamed from `videcode-harness` 2026-07-31; GitHub auto-redirects the old slug, so old clones keep working).

A reusable **agent-driven delivery harness**: it takes a project from a spec to a
**running, deployable app** (pnpm monorepo, NestJS + Prisma + Postgres, Next.js,
CI, e2e), then runs the **loop** that keeps it evolving. Value converges in the
loop, not the paperwork — so the linear build stays a lean on-ramp.

It runs on a bare **agent + git + bash**; `ck-*` skills only accelerate it
(Independence Principle, `docs/about/HARNESS.md`).

## The single spine: two modes, split at go-live

```text
   MODE A — BUILD (finite)                    │  MODE B — THE LOOP (perpetual)
   spec -> running, deployable app            │  keep the live app healthy as it evolves
   unit of work: a PHASE                       │  unit of work: an ISSUE (with AC)
   driver: /stage-next, /build-phase           │  driver: the issue-pipeline loop
   tracker: STAGE.md "current step"            │  tracker: the issue board (10 states)
   ─────────────────────────── GO-LIVE ───────────────────────────
```

Two older framings are kept but **subordinate**: the *3 macro-stages* (Pre/Build/Post)
are just the step-grouping inside the modes (`docs/process/WORKFLOW.md`), and
*Loop Engineering* (`prompt -> context -> harness -> loop`) is a diagnostic lens, not a
third model. Full detail + honest scorecard: **`docs/about/UNDERSTANDING-loop-harness.md`**.

**Visual concept map (Vietnamese)** — every repo term mapped to its 2026 industry name,
badged *real / in-progress / not-yet* (from the `KEYWORD-MAP.md § H` audit):
[`plans/visuals/loop-harness-industry-map.html`](plans/visuals/loop-harness-industry-map.html)
· hosted: <https://claude.ai/code/artifact/44acda68-210d-4e7b-8ed1-1a5ea1f6a526> (private link).

## Repo layout

**The repo root IS the harness** (flattened 2026-09-01 — no more `harness/` subdir).
The product/workshop boundary is `SKELETON_PATHS` in `scripts/install-harness.sh`
(what gets copied into a project), not a directory.

| Path | What | Installed into a project? |
|---|---|---|
| `AGENTS.md` · `docs/` · `.claude/` · `scripts/` · `.githooks/` | **The product** — operating guide, all knowledge (`docs/process`, `docs/about`, `playbooks`, `gates`, `mau-tai-lieu` doc-forms), the `/stage-next` etc. commands, the install + non-bypassable verify gate. | **yes** |
| `scaffolds/` | **The product** — ready-made CODE copied in (app skeleton, steady-state kit). | **yes** (via installer) |
| `plans/` | Workshop: harness-development plans + reports + the harness's own lessons-log. | no |
| `CLAUDE.md` | Workshop: control-session brief (role, auto-loaded by cwd). | no |
| `.claude/` runtime (`worktrees/`, `agent-memory/`, `settings.local.json`) | Workshop, dev-local — **gitignored**, never committed. | no |

Full file-by-file map: **`docs/about/STRUCTURE.md`** or the visual map artifact.

### Where everything lives — the one rule (stop hunting)

Files sit by **mechanism**, and a manifest relates them — you don't browse folders:

| Kind of thing | Lives in | Why there |
|---|---|---|
| A **slash command** (`/stage-next`) an agent invokes | `.claude/commands/` | Claude Code loads it as a command |
| A **subagent** / Claude Code **hook** / **skill** | `.claude/agents` · `.claude/hooks` · `.claude/skills` | Claude Code loads/fires these |
| A **terminal CLI tool** (`install-harness.sh`, `run-log.mjs`) | `scripts/` | plain `bash`/`node`, not a Claude command — wrap as a skill only if an agent must call it |
| A **git hook** (pre-commit/pre-push) | `.githooks/` | git's mechanism, not Claude's |
| The **app's own gate scripts** (`check-*.mjs`) | `scaffolds/stack-.../scripts/` | they belong to the scaffolded app |
| A **recipe** (how to do a step) | `docs/playbooks/` | one per reusable task/domain |
| A **check** (gate) | `docs/gates/` | one per gate |
| A **blank doc form** to fill | `docs/mau-tai-lieu/` | Markdown forms (NOT code) |

**The manifest that relates a step to its files = the macro spine** (below).

### The whole process in one place (the spine)

Don't read 7 docs to understand a step. Open the **spine** — one table where each
step maps to its playbook + gate + form + script:

- **Macro-1 (Pre-Build):** [`docs/process/macro-1.md`](docs/process/macro-1.md)
- **Macro-2 (Build & Go-live):** [`docs/process/macro-2.md`](docs/process/macro-2.md)
- **Macro-3 (Post-Build / the loop):** [`docs/process/macro-3.md`](docs/process/macro-3.md)
- **The Loop (Mode B, perpetual) — the primary half:** [`docs/process/loop.md`](docs/process/loop.md)

Full step-order + lane detail (all 3 macros, authoritative): [`docs/process/WORKFLOW.md`](docs/process/WORKFLOW.md).

Drill into a `playbooks/` or `gates/` file only when you need the depth of ONE step.

## Install into a fresh project

```bash
# from a local clone of this repo
scripts/install-harness.sh --bootstrap --spec ./your-spec.md ./my-project

# remote (no clone): set HARNESS_REPO explicitly
curl -fsSL https://raw.githubusercontent.com/<owner>/loop-harness/main/scripts/install-harness.sh \
  | HARNESS_REPO=<owner>/loop-harness bash -s -- --bootstrap --spec ./your-spec.md ./my-project
```

Bootstrap copies the skeleton, drops your spec into `docs/discovery/`, initializes
git with the verify gate active (`core.hooksPath=.githooks`), fills `STAGE.md`, and
commits the baseline. It never touches your global `~/.claude`.

## Run — Mode A (Build)

Open Claude Code in the project and repeat:

1. **`/stage-next`** — runs the next `docs/process/WORKFLOW.md` step via the `stage-runner`
   subagent (isolated context), enforces the step's gate, updates `STAGE.md`, lands
   one stage-boundary commit.
2. **Gates** — internal gates assert with evidence; client/owner-paging gates
   (PB-G2/G3/G4, ACCEPTANCE, HANDOVER) emit a `MANUAL_CHECKPOINT` and wait for your
   written ack. `/gate-check` verifies any gate on demand.
3. **`/build-phase`** (step 2.6) — the phase loop. Step 2.3 compiles the frozen spec
   into `docs/build-manifest.md` (ordered phases P0..PN); step 2.4 scaffolds the
   **walking skeleton** from the stack template and boots it; then each `/build-phase`
   run implements ONE phase: code -> `validate:quick` -> e2e smoke -> verification-register
   row -> token-citing commit -> **phase acceptance**. Repeat until the manifest is done.

`cat STAGE.md` answers "where is this project?" at any time.

## Run — Mode B (the loop), after go-live

Copy `scaffolds/steady-state/` into the project and work the issue board:
**discover -> dispatch -> verify -> recover -> persist -> decide-next** — spine: `docs/process/loop.md`. Operating manual:
`docs/playbooks/steady-state-issue-pipeline.md`. Issue-authoring contract:
`docs/playbooks/github-issue-standard.md`.

## Lane choice (declare at intake, step 1.2)

| | **Full** | **Lite** (default) |
|---|---|---|
| For | paid client work | internal tools, own products, small builds |
| Macro 1 | full BA spine: discovery -> gap -> SRS + RTM -> feature register -> prototype rounds -> quote -> contract | merged intake -> one-file `srs-lite` -> tokens + Tier-1 pin -> prototype ONE round -> freeze by owner ack; quote/contract N/A |
| Gates | client-paging | owner acks (still written) |
| Macro 2-3 | identical in both lanes | identical in both lanes |

Both lanes keep the non-negotiables: REQ-ID grammar, floorplan classification for every
grid/form screen, the token chain, stage-boundary commits, and the verify gate.

## Success bar

A harness-produced project must meet the structural checklist in
`plans/reports/hasi-hub-benchmark-260705.md` (pnpm monorepo, module-per-domain NestJS
API with Prisma migrations + seed, Next.js App Router web with ui/ primitives and
loading/empty/error states, docker-compose Postgres with working seeded-admin login,
green CI with unit + integration + build, Playwright e2e per critical journey, husky
hooks, complete `.env.example`, docs, deployable Dockerfiles). That checklist is the
acceptance test for the harness itself.

## Understand it fast — you don't need to read everything

This README + the **spine** (above) is the entry. Everything else is drill-down,
opened only when you need one thing:

- **The map** (what every file is): `docs/about/STRUCTURE.md` or the visual artifact.
- **The narrative + honest maturity scorecard** (what's proven vs not-built): `docs/about/UNDERSTANDING-loop-harness.md`.
- **A term you don't know:** `docs/about/KEYWORD-MAP.md` (glossary → owner file).
- **The design + locked decisions:** `docs/about/HARNESS.md`.
- **A recipe / a gate / a form:** `docs/playbooks/` · `docs/gates/` · `docs/mau-tai-lieu/`.

The 5 docs above are five *genres* (map / narrative / glossary / design / index) —
you consult one when you need it, you don't read all five to "get it".
