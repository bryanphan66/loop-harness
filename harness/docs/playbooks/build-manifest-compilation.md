# Build Manifest Compilation

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Compiles the frozen Pre-Build spec into `docs/build-manifest.md` — the
> ONE file the build loop executes. This is the **spec→code conversion layer**:
> without it, a build agent faces the whole BA spine (hundreds of REQ-IDs,
> scenarios, screens) and produces documents instead of software. Owns the
> manifest half of Build & Go-live **step 2.3**.

**Macro-stage / step:** Build & Go-live · 2.3 (after 2.2 TDR, before the DoR
gate closes). **Template:** `docs/templates/build-manifest.md`.

## Engine

- **Fast path:** `ck-plan` for ordering/risk thinking; the manifest itself is
  hand-compiled from the frozen sources.
- **Role:** Tech Lead (+ PM for priority). Per the Independence Principle a bare
  agent following this playbook produces the same artifact.

## Inputs (all FROZEN before compiling)

1. Feature register (`docs/scope-baseline/`) or srs-lite feature table — the
   in-scope REQ-ID universe.
2. Frozen ERD (`docs/system-architecture.md`).
3. Screen inventory (`docs/visuals/diagrams/screen-inventory.md`) — floorplan
   class per screen.
4. API contract (2.2 output).
5. Scenarios (`docs/requirements/scenarios/*`) for high-risk REQ-IDs.
6. Prototype export bundle (`docs/visuals/prototype/exports/<engine-vN>/`) —
   the per-screen implementation reference each phase block cites.

A missing/unfrozen input is a 2.3 blocker — do not compile from moving specs.

## Compilation procedure

1. **List the REQ-ID universe.** Every in-scope REQ-ID from the register, one
   row each. This becomes the coverage checklist — the DoR proof.
2. **Cluster by capability, not by document.** Group REQ-IDs into user-visible
   increments (a workflow, an entity's CRUD + its screens, a report). Each
   cluster should touch ONE cohesive slice: entities + endpoints + screens that
   ship together and can be smoke-tested together.
3. **Order by dependency, then by risk.** P0 is always the walking skeleton
   (stack-template scaffold + boot + seed — closed by steps 2.4/2.5). P1..PN:
   foundation entities before dependents; auth/roles early; the riskiest
   business logic as early as its dependencies allow (fail fast); polish last.
4. **Size each phase — the hard rule:** completable in ONE agent session,
   ≤~10 files touched (S ≤3, M ≤6, L ≤10). A phase that wants more is **split**
   (vertical slice first: split by screen or by sub-workflow, not by layer —
   never a "backend phase" + "frontend phase" for the same feature unless the
   API is consumed by a later phase).
5. **Write each phase block per the template:** REQ-IDs, entities (new/extend),
   endpoints, screens + floorplan class + **prototype export source file +
   fidelity strategy** (`port from export` default; `rebuild (decision: <slug>)`
   only with a recorded decision — `build-execution.md` § Prototype → Code
   Fidelity), **concrete runnable acceptance
   checks** (the phase's e2e smoke script in prose — a check names an actor, an
   action, and an observable outcome — including the error/empty check and the
   visual-fidelity self-check), verify commands, dependencies, size.
   The block must be executable WITHOUT reading the rest of the manifest.
   **Late-phase rule:** a PUB product-shot capture phase depends on every APP
   screen phase it depicts.
6. **Prove coverage.** Fill the coverage checklist: every in-scope REQ-ID in
   exactly one phase. A REQ-ID in zero phases = scope silently dropped; in two
   = double-build drift. Both block DoR.
7. **Gate.** DoR (`docs/gates/dor-build.md`) now includes: manifest complete,
   coverage proven, P0 defined, every phase ≤ one session.

## Anti-patterns

- **Document phase** — a phase whose output is another document. The manifest
  executes code; docs belong to 2.1–2.3 or ride along a code phase.
- **Layer phase** — "all entities", "all APIs", "all screens". Slices must be
  vertical so each phase ends with a demonstrable journey.
- **Kitchen-sink P1** — half the REQ-IDs in one phase. Split until every phase
  is one session.
- **Re-reading the spine** — if executing a phase requires reading files its
  block does not name, the block is under-specified; fix the block, don't widen
  the read.

## Maintenance during 2.6

- The manifest is append-only in structure: checkboxes flip, `Closed by` fills,
  and new phases append (from CR-NN or discovered-but-agreed work). Never edit
  a done phase's scope.
- Manifest edits land in the same stage-boundary commit as the work that caused
  them.

## Variant Section

(Append a Variant block here when this playbook fails or partially works.)

## Related

- `docs/templates/build-manifest.md` — the artifact shape.
- `docs/WORKFLOW.md` § Macro-Stage 2 — the 2.3 row + Build Manifest note.
- `.claude/commands/build-phase.md` — the loop that executes the manifest.
- `build-execution.md` — per-phase discipline (commits, hooks, fidelity).
- `docs/gates/dor-build.md` — the gate the manifest must satisfy.
- `docs/TRACE_SPEC.md` — REQ-ID grammar; the coverage rule is a trace rule.
