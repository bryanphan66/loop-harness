# videcode-harness

A reusable **agent-driven delivery harness**: install it into a fresh directory,
feed it a spec, and drive one project from raw idea to a **running, deployable
app** (pnpm monorepo · NestJS + Prisma + Postgres API · Next.js web · CI · e2e)
through three gated macro-stages:

```text
MACRO 1 — PRE-BUILD    spec → frozen scope + frozen prototype (+ contract, Full lane)
MACRO 2 — BUILD        ERD → stack → BUILD MANIFEST → walking skeleton → phase loop → review/security/QA → UAT → release
MACRO 3 — POST-BUILD   handover → hypercare → maintenance → change control → retro
```

The harness is the **control plane** (stage tracker, gates, verify-git-hooks,
orchestration commands); your global agents/skills are the engine. It runs on a
bare agent + git + bash — `ck-*` skills only accelerate it (Independence
Principle, `harness/docs/HARNESS.md`).

## Repo layout

| Path | What |
|---|---|
| `harness/` | The installable skeleton: `AGENTS.md`, `docs/` (WORKFLOW, STAGE_GOALS, gates, playbooks, templates, design-system), `.claude/` (stage-runner agent + `/stage-next` `/build-phase` `/gate-check` commands + notifier hooks), `.githooks/` + `scripts/harness-verify-gate.sh` (non-bypassable verify gate), `scripts/install-harness.sh` |
| `harness/templates/stack-pnpm-nest-next/` | Walking-skeleton stack template (hasi-hub-shaped starter monorepo) scaffolded at Build step 2.4 — v0.1.1, full local verify 2026-07-06 (see its `TEMPLATE_VERSION`) |
| `plans/` | Harness development plans + reports (not installed into projects) |

## Install into a fresh project

```bash
# from a local clone of this repo
harness/scripts/install-harness.sh --bootstrap --spec ./your-spec.md ./my-project

# remote (no clone): set HARNESS_REPO explicitly
curl -fsSL https://raw.githubusercontent.com/<owner>/videcode-harness/main/harness/scripts/install-harness.sh \
  | HARNESS_REPO=<owner>/videcode-harness bash -s -- --bootstrap --spec ./your-spec.md ./my-project
```

The bootstrap copies the skeleton, drops your spec into `docs/discovery/`,
initializes git with the verify gate active (`core.hooksPath=.githooks`), fills
`STAGE.md` (the single current-step tracker), and commits the baseline. It never
touches your global `~/.claude`.

## Run loop

Open Claude Code in the project and repeat:

1. **`/stage-next`** — runs the next `docs/WORKFLOW.md` step via the
   `stage-runner` subagent (isolated context), enforces the step's gate,
   updates `STAGE.md`, and lands one stage-boundary commit.
2. **Gates** — internal gates assert with evidence; client/owner-paging gates
   (PB-G2/G3/G4, ACCEPTANCE, HANDOVER) emit a `MANUAL_CHECKPOINT` and wait for
   your written ack. `/gate-check` verifies any gate on demand.
3. **`/build-phase`** (Build step 2.6) — the phase loop. Step 2.3 compiles the
   frozen spec into `docs/build-manifest.md` (ordered phases P0..PN, every
   in-scope REQ-ID in exactly one phase); step 2.4 scaffolds the **walking
   skeleton** from the stack template and boots it; then each `/build-phase`
   run implements ONE phase: code → `validate:quick` → e2e smoke →
   verification-register row → token-citing commit. Repeat until the manifest
   is done, then `/stage-next` resumes at the review/security/QA pass.

`cat STAGE.md` at any time answers "where is this project?".

## Lane choice (declare at intake, step 1.2)

| | **Full** | **Lite** |
|---|---|---|
| For | paid client work | internal tools, own products, small builds |
| Macro 1 | full BA spine: discovery → gap analysis → SRS + RTM → feature register → prototype rounds → quote → contract | merged intake → one-file `srs-lite` (REQ-ID table + high-risk scenarios only) → tokens + Tier-1 pin → prototype ONE round → freeze by owner ack; quote/contract skipped (recorded N/A) |
| Gates | client-paging | owner acks (still written) |
| Macro 2–3 | identical in both lanes | identical in both lanes |

Both lanes keep the non-negotiables: REQ-ID grammar, floorplan classification
for every grid/form screen, the token chain (REQ-ID → TC-NNN), stage-boundary
commits, and the verify gate.

## Success bar

A harness-produced project must meet the structural checklist in
`plans/reports/hasi-hub-benchmark-260705.md` (pnpm monorepo, module-per-domain
NestJS API with Prisma migrations + seed, Next.js App Router web with ui/
primitives and loading/empty/error states, docker-compose Postgres with working
seeded-admin login, green CI with unit + integration + build, Playwright e2e per
critical journey, husky hooks, complete `.env.example`, docs, deployable
Dockerfiles). That checklist is the acceptance test for the harness itself.

## Key docs (read in this order)

1. `harness/docs/HARNESS.md` — operating model + Independence Principle + locked decisions
2. `harness/docs/WORKFLOW.md` — the 3-macro map, step tables, gates, lanes
3. `harness/docs/STAGE_GOALS.md` — per-step executable goal text
4. `harness/docs/TRACE_SPEC.md` — token grammar (`GAP → REQ-ID → SC → TC`, `CR`)
5. `harness/docs/playbooks/README.md` + `harness/docs/templates/README.md` — recipes + scaffolds
