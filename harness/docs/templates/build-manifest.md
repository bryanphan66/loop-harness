<!--
TEMPLATE: build-manifest.md (the spec→code conversion layer)
Used by: WORKFLOW step 2.3 (compiled), 2.4/2.5 (P0), 2.6 /build-phase loop (P1..PN).
Role: Tech Lead compiles it; Fullstack Dev executes it one phase at a time.
Playbook: docs/playbooks/build-manifest-compilation.md
Output path: <project-root>/docs/build-manifest.md
  (a single file, deliberately NOT a "build" subdirectory under docs — that
  dir name collides with common build-artifact ignore/deny patterns in agent
  tooling)
Bilingual: INTERNAL — English only (no locale-vi fork).
Rule of thumb: a build agent reads ITS phase block + the files that block names
— never the whole BA spine. Write each block to be sufficient alone.
Shape-only scaffold. Replace <placeholders>.
-->

# Build Manifest — <project>

> Ordered, executable build plan **P0..PN** compiled from the frozen spec
> (SRS(-lite) + feature register + ERD + screen inventory + API contract).
> **One phase = one agent session.** Driven by `/build-phase`; progress flips
> here + a `2.6/P<N>` History row in `STAGE.md`, in the same stage-boundary
> commit.

- **Compiled:** YYYY-MM-DD by <agent/human> (step 2.3)
- **Sources (frozen):** ERD `docs/system-architecture.md` (<commit>) · SRS <path> · screen inventory `docs/visuals/diagrams/screen-inventory.md` · API contract <path>
- **Stack:** <ADR slug, e.g. `<project>-stack-selection`> (default: walking-skeleton stack template)
- **Phase count:** <N+1> · **Sizes:** S ≤3 files · M ≤6 · L ≤10 (harder than L → SPLIT)
- **Human checkpoint cadence:** `per-ui-phase` *(knob — `per-phase` | `per-ui-phase` (default) | `per-milestone` | `end-only`; sets each phase's Verify-by below — `docs/gates/phase-acceptance.md`)*
- **Preview command:** `<one line, e.g. docker compose up → http://localhost:3000>` *(the running app both acceptance-verification legs check against — incremental preview, `build-execution.md` § Incremental Preview)*

## Progress

> A phase is done only when its **Accepted** cell is filled per
> `docs/gates/phase-acceptance.md`: `agent-pass <date>` always; plus
> `human-ok <date>` when Verify-by = `both`. `/build-phase` refuses to start
> the next phase while the previous one's Accepted cell is incomplete.

| Phase | Name | Size | Verify-by | Status | Accepted (agent / human) | Closed by (commit) |
|---|---|---|---|---|---|---|
| P0 | Walking skeleton | M | agent | [ ] | | |
| P1 | <name> | S | both | [ ] | | |
| P2 | <name> | M | agent | [ ] | | |

## Phase blocks

### P0 — Walking skeleton *(executed by steps 2.4 + 2.5, not /build-phase)*

- **Scope:** scaffold from the stack template (`scaffold.sh`, slug `<project-slug>`); env + CI + compose; seed extended to domain foundation data.
- **REQ-IDs:** <the infra/auth reqs it satisfies, e.g. `IF.AUTH.01`, or "platform — no feature REQ">
- **Acceptance checks (all must run, not be assumed):**
  1. `pnpm install && pnpm -r build` green
  2. `docker compose up` → health endpoint 200
  3. CI-equivalent local run (lint + typecheck + unit + build) green
  4. seeded admin login succeeds (e2e smoke or HTTP check)
- **Verify commands:** `<validate:quick>` · `<e2e smoke command>`
- **Gate:** WALKING SKELETON (`/gate-check --gate WALKING-SKELETON`)

### P1 — <phase name>

- **Goal (1 line):** <user-visible capability this phase delivers>
- **REQ-IDs covered:** `<MODULE.AREA.NN>`, `<MODULE.AREA.NN>` *(each in-scope REQ-ID appears in exactly ONE phase)*
- **Entities touched:** `<Entity>` (new | migrate | extend) — per frozen ERD
- **API endpoints:** `<METHOD /path>` (auth: <roles>) — per API contract
- **Screens:** one line per screen — name · floorplan `<§4 class or CUSTOM>`
  (row: screen-inventory.md) · **export source**
  `<docs/visuals/prototype/exports/<engine-vN>/<file>>` · **fidelity strategy**
  `port from export` | `rebuild (decision: <slug>)` *(port is the DEFAULT —
  `docs/playbooks/build-execution.md` § Prototype → Code Fidelity; `rebuild`
  requires the named `docs/decisions/<slug>.md` to exist)*
- **Depends on:** <P-ids or "P0 only">
- **Verify-by:** `agent` | `both` *(compiled from the header cadence — `both` =
  agent verifier + human checkpoint; the agent leg is never skipped —
  `docs/gates/phase-acceptance.md`)*
- **Acceptance checks (MANDATORY — concrete + runnable; the independent
  verifier exercises these against the running preview, so a check that cannot
  be run is a 2.3 compile defect). Every phase MUST cover all three
  categories:**
  1. **functional** — <e.g. admin creates X via UI → appears in list with status DRAFT>
  2. **functional** — <e.g. member without role R gets 403 on POST /x>
  3. **negative-path** — <error/empty state check — trigger the failure for real; the REAL cause surfaces, no generic message>
  4. **visual-fidelity** — each screen this phase ships, side-by-side vs its
     export render — no structural/visual divergence (`docs/gates/visual-fidelity.md`)
     *(phases with no screens record `n/a — no screens` here)*
- **Verify commands:** `<validate:quick>` · `<targeted test/e2e command>`
- **Est. size:** S | M | L
- **Notes:** <sharp edges, SC-NNN scenarios to honor, out-of-scope reminders>

### P2 — <phase name>

<same shape>

<!--
LATE-PHASE RULE — PUB product-shot capture:
If any PUB/marketing screen embeds screenshots of the product (landing hero,
feature shots), give that capture its own LATE phase whose "Depends on" lists
EVERY APP screen phase it depicts — capture from the running, fidelity-checked
app, never from an early scaffold UI. Commit the capture script so shots are
re-generatable. (build-execution.md § PUB product-shot capture is a LATE phase)
-->

## Coverage checklist *(DoR proof — every in-scope REQ-ID exactly once)*

| REQ-ID | Phase |
|---|---|
| `<MODULE.AREA.NN>` | P1 |
| `<MODULE.AREA.NN>` | P2 |

- [ ] Every in-scope REQ-ID from the feature register / srs-lite appears above **exactly once**
- [ ] P0 defined; every phase ≤ L (one agent session, ≤~10 files)
- [ ] Every phase's screens have a screen-inventory floorplan row
- [ ] Every phase's screens cite a **prototype export source** + fidelity strategy (`port from export` default; `rebuild` only with an existing `docs/decisions/<slug>.md`)
- [ ] Every phase has **runnable acceptance checks covering all three categories** (functional + negative-path + visual-fidelity or `n/a — no screens`) and a **Verify-by** value compiled from the header cadence (`docs/gates/phase-acceptance.md`)
- [ ] Human checkpoint cadence + preview command declared in the header
- [ ] Any PUB product-shot capture phase **depends on every APP screen phase it depicts** (late-phase rule)
- [ ] Change requests (CR-NN) enter as NEW phases appended here — never stretch a done phase
