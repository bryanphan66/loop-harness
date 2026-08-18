# loop-harness

> A loop-engineering delivery harness. Repo slug `loop-harness` (renamed from `videcode-harness` 2026-07-31; GitHub auto-redirects the old slug, so old clones keep working).

A reusable **agent-driven delivery harness**: it takes a project from a spec to a
**running, deployable app** (pnpm monorepo, NestJS + Prisma + Postgres, Next.js,
CI, e2e), then runs the **loop** that keeps it evolving. Value converges in the
loop, not the paperwork — so the linear build stays a lean on-ramp.

It runs on a bare **agent + git + bash**; `ck-*` skills only accelerate it
(Independence Principle, `harness/docs/HARNESS.md`).

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
are just the step-grouping inside the modes (`harness/docs/WORKFLOW.md`), and
*Loop Engineering* (`prompt -> context -> harness -> loop`) is a diagnostic lens, not a
third model. Full detail + honest scorecard: **`harness/docs/UNDERSTANDING-loop-harness.md`**.

**Visual concept map (Vietnamese)** — every repo term mapped to its 2026 industry name,
badged *real / in-progress / not-yet* (from the `KEYWORD-MAP.md § H` audit):
[`plans/visuals/loop-harness-industry-map.html`](plans/visuals/loop-harness-industry-map.html)
· hosted: <https://claude.ai/code/artifact/44acda68-210d-4e7b-8ed1-1a5ea1f6a526> (private link).

## Repo layout

**Hard boundary: the product is `harness/` (self-contained); everything at root is the workshop that builds it.**

| Path | What | Installed into a project? |
|---|---|---|
| `harness/` | **The product** — the installable skeleton (self-contained, never references outside its own tree): `AGENTS.md`, `docs/`, `.claude/` (commands + stage-runner agent + hooks), `scripts/` + `.githooks/` (non-bypassable verify gate), `templates/` | **yes** |
| `plans/` | Workshop: harness-development plans + reports + the harness's own `lessons-log.md` + `team-playbook-human-agent.md` | no |
| `CLAUDE.md` | Workshop: control-session brief (role, auto-loaded by cwd) | no |
| `.claude/` | Workshop, dev-local: Claude Code session config for working ON this repo (personal parts gitignored). NOT the shipped `harness/.claude/`. | no |

Full file-by-file map with each part's role: **`harness/docs/STRUCTURE.md`**.

## Install into a fresh project

```bash
# from a local clone of this repo
harness/scripts/install-harness.sh --bootstrap --spec ./your-spec.md ./my-project

# remote (no clone): set HARNESS_REPO explicitly
curl -fsSL https://raw.githubusercontent.com/<owner>/loop-harness/main/harness/scripts/install-harness.sh \
  | HARNESS_REPO=<owner>/loop-harness bash -s -- --bootstrap --spec ./your-spec.md ./my-project
```

Bootstrap copies the skeleton, drops your spec into `docs/discovery/`, initializes
git with the verify gate active (`core.hooksPath=.githooks`), fills `STAGE.md`, and
commits the baseline. It never touches your global `~/.claude`.

## Run — Mode A (Build)

Open Claude Code in the project and repeat:

1. **`/stage-next`** — runs the next `docs/WORKFLOW.md` step via the `stage-runner`
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

Copy `harness/templates/steady-state/` into the project and work the issue board:
**discover -> dispatch -> verify -> recover -> persist -> decide-next**. Operating manual:
`harness/docs/playbooks/steady-state-issue-pipeline.md`. Issue-authoring contract:
`harness/docs/playbooks/github-issue-standard.md`.

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

## Key docs (read in this order)

1. `harness/docs/UNDERSTANDING-loop-harness.md` — narrative onboarding + honest scorecard + where new knowledge goes (decision table) + reuse/extend — **read first**
2. `harness/docs/KEYWORD-MAP.md` — glossary of every concept + where it lives
3. `harness/docs/STRUCTURE.md` — file-by-file directory map
4. `harness/docs/OPERATING-MODES.md` — the two modes + the loop (the spine's precise spec)
5. `harness/docs/HARNESS.md` — operating model + Independence Principle + locked decisions
6. `harness/docs/WORKFLOW.md` — step tables (inside the two modes), gates, lanes
7. `harness/docs/TRACE_SPEC.md` — token grammar · `harness/docs/DOC-STANDARD.md` — doc-writing rubric · `harness/docs/playbooks/README.md` — recipes
