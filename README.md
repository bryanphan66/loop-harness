# loop-harness

> Product name & repo slug: **loop-harness** — a loop-engineering delivery harness (the differentiator is *the loop*, not the paperwork). Renamed from `videcode-harness` 2026-07-31; GitHub auto-redirects the old slug, so stale clones keep working.

A reusable **agent-driven delivery harness** built around a **loop**. It takes a project
from a spec to a **running, deployable app** (pnpm monorepo, NestJS + Prisma + Postgres,
Next.js, CI, e2e), then runs the loop that keeps it evolving. **Value converges in the
loop, not the paperwork** — so the linear build stays a *lean on-ramp*. Two modes
(`harness/docs/OPERATING-MODES.md`):

- **Mode A - Build:** a lean, gated on-ramp (Macro 1 Pre-Build -> Macro 2 Build), driven by `/stage-next` + `STAGE.md`, default lane Lite. Job: reach go-live fast.
- **Mode B - Steady-state = THE LOOP** (Macro 3): discover -> dispatch -> verify -> recover -> persist -> decide-next, repeating on the issue board. **Where quality converges** (per-AC + human checklist).

Graduate A -> B at **go-live**. Our own trials say it plainly: the project stuck in Mode A underdelivered (auto-script); the one that reached the loop came out solid (elearning).

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
curl -fsSL https://raw.githubusercontent.com/<owner>/loop-harness/main/harness/scripts/install-harness.sh \
  | HARNESS_REPO=<owner>/loop-harness bash -s -- --bootstrap --spec ./your-spec.md ./my-project
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

0. `harness/docs/KEYWORD-MAP.md` — glossary/navigation map of every loop-harness concept + where it lives (start here to orient)
1. `harness/docs/OPERATING-MODES.md` — the two modes + the loop (the harness's center of gravity — READ FIRST)
2. `harness/docs/HARNESS.md` — operating model + Independence Principle + locked decisions
3. `harness/docs/WORKFLOW.md` — the 3-macro map, step tables, gates, lanes
4. `harness/docs/STAGE_GOALS.md` — per-step executable goal text
5. `harness/docs/TRACE_SPEC.md` — token grammar (`GAP → REQ-ID → SC → TC`, `CR`)
6. `harness/docs/playbooks/README.md` + `harness/docs/templates/README.md` — recipes + scaffolds
