<!--
TEMPLATE: build-manifest.md (the spec→code conversion layer)
Used by: WORKFLOW step 2.3 (compiled), 2.4/2.5 (P0), 2.6 /build-phase loop (P1..PN).
Role: Tech Lead compiles it; Fullstack Dev executes it one phase at a time.
Playbook: docs/playbooks/build-manifest-compilation.md
Output path: <project-root>/docs/build/build-manifest.md
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

## Progress

| Phase | Name | Size | Status | Closed by (commit) |
|---|---|---|---|---|
| P0 | Walking skeleton | M | [ ] | |
| P1 | <name> | S | [ ] | |
| P2 | <name> | M | [ ] | |

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
- **Screens:** `<screen name>` — floorplan `<§4 class or CUSTOM>` (row: screen-inventory.md)
- **Depends on:** <P-ids or "P0 only">
- **Acceptance checks (concrete + runnable):**
  1. <e.g. admin creates X via UI → appears in list with status DRAFT>
  2. <e.g. member without role R gets 403 on POST /x>
  3. <error/empty state check>
- **Verify commands:** `<validate:quick>` · `<targeted test/e2e command>`
- **Est. size:** S | M | L
- **Notes:** <sharp edges, SC-NNN scenarios to honor, out-of-scope reminders>

### P2 — <phase name>

<same shape>

## Coverage checklist *(DoR proof — every in-scope REQ-ID exactly once)*

| REQ-ID | Phase |
|---|---|
| `<MODULE.AREA.NN>` | P1 |
| `<MODULE.AREA.NN>` | P2 |

- [ ] Every in-scope REQ-ID from the feature register / srs-lite appears above **exactly once**
- [ ] P0 defined; every phase ≤ L (one agent session, ≤~10 files)
- [ ] Every phase's screens have a screen-inventory floorplan row
- [ ] Change requests (CR-NN) enter as NEW phases appended here — never stretch a done phase
