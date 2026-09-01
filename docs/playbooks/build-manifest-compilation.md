# Build Manifest Compilation

**When To Run:** at Build step 2.3 — turning the frozen Pre-Build spec into the ordered phase list (`build-manifest.md`) the build loop executes. **Skip when:** never for a real build (every build needs a manifest).

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Compiles the frozen Pre-Build spec into `docs/build-manifest.md` — the
> ONE file the build loop executes. This is the **spec→code conversion layer**:
> without it, a build agent faces the whole BA spine (hundreds of REQ-IDs,
> scenarios, screens) and produces documents instead of software. Owns the
> manifest half of Build & Go-live **step 2.3**.

**Macro-stage / step:** Build & Go-live · 2.3 (after 2.2 TDR, before the DoR
gate closes). **Template:** `docs/mau-tai-lieu/build-manifest.md`.

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
4b. **Route the phase-type — a REQ-ID's delivery shape decides its lane.** Set
   each phase's **`Phase-type`** (`crud` default | `async-job` | `media-pipeline` |
   `external-integration` | `storage`). A REQ-ID citing an **async / media /
   storage / integration** signal — grep the SRS + NFR + ERD notes for
   `transcode`, `HLS`, `upload`, `queue`, `webhook`, `signed-url`, `storage`,
   `PDF-render`, `email-blast`, `stream`, `bitrate`, `SES`, `Zalo`, `provider` —
   **MUST** get the matching non-CRUD phase-type carrying its type-specific
   acceptance categories (`docs/mau-tai-lieu/build-manifest.md` § Non-CRUD
   phase-types + the named playbook). **Folding such a REQ-ID into a CRUD phase is
   a 2.3 compile defect** — the CRUD trio can't assert the idempotency / signed-URL
   / entitlement / multi-bitrate / webhook-verify NFRs, so the build agent
   improvises the risky infra unproven. When a non-CRUD phase-type exists, confirm
   the stack ADR (2.2) surfaced the tier-2 primitives (queue / storage / worker).

5. **Write each phase block per the template:** REQ-IDs, entities (new/extend),
   endpoints, screens + floorplan class + **prototype export source file +
   fidelity strategy** (`adopt from export` default — adopt the export as code;
   `rebuild (decision: <slug>)` only, with a recorded decision, when no export
   covers the screen — `build-execution.md` § Prototype → Code Fidelity +
   `prototype-export-adoption.md`) + each UI screen's **fidelity contract as
   executable assertions** (required elements + interactions to encode as a
   Playwright fidelity spec — `docs/gates/visual-fidelity.md`; prose is not a
   contract), **concrete runnable acceptance
   checks covering all three MANDATORY categories** — functional,
   negative-path (trigger the failure for real; the real cause must surface),
   and visual-fidelity per shipped screen (fidelity assertions green + glance;
   `n/a — no screens` where true) — a
   check names an actor, an action, and an observable outcome; an independent
   verifier will execute these against the running preview
   (`docs/gates/phase-acceptance.md`), so an unrunnable check is a compile
   defect. Plus verify commands, dependencies, size, and the **`Verify-by`**
   field (`agent` | `both`) compiled from the manifest-header cadence knob.
   The block must be executable WITHOUT reading the rest of the manifest.
   **Late-phase rule:** a PUB product-shot capture phase depends on every APP
   screen phase it depicts.
6. **Set the acceptance knobs (header).** Declare the **Human checkpoint
   cadence** (`per-phase` | `per-ui-phase` default | `per-milestone` |
   `end-only`) and the one-line **Preview command** — then derive each phase's
   `Verify-by` from the cadence. The operator may retune the cadence mid-build;
   re-derive the remaining phases' `Verify-by` when they do.
7. **Prove coverage.** Fill the coverage checklist so the manifest-completeness
   rule holds (SoT: `docs/gates/dor-build.md`): a REQ-ID in zero phases = scope
   silently dropped; in two = double-build drift. Both block DoR.
8. **Gate.** DoR (`docs/gates/dor-build.md`) now includes: manifest complete,
   coverage proven, P0 defined, every phase ≤ one session, every phase's
   acceptance checks covering the three categories + `Verify-by` set + the
   cadence/preview header declared.

## Anti-patterns

- **Document phase** — a phase whose output is another document. The manifest
  executes code; docs belong to 2.1–2.3 or ride along a code phase.
- **Layer phase** — "all entities", "all APIs", "all screens". Slices must be
  vertical so each phase ends with a demonstrable journey.
- **Kitchen-sink P1** — half the REQ-IDs in one phase. Split until every phase
  is one session.
- **CRUD-folded infra** — an async / media / storage / integration REQ-ID
  smuggled into a CRUD phase with no `Phase-type`. Its NFRs (idempotency,
  signed-URL entitlement, multi-bitrate, webhook-verify) then go unasserted and the
  build agent improvises the risky bit unproven. Route it to its non-CRUD
  phase-type (step 4b).
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

- `docs/mau-tai-lieu/build-manifest.md` — the artifact shape.
- `docs/process/WORKFLOW.md` § Macro-Stage 2 — the 2.3 row + Build Manifest note.
- `.claude/commands/build-phase.md` — the loop that executes the manifest.
- `build-execution.md` — per-phase discipline (commits, hooks, fidelity).
- `docs/gates/dor-build.md` — the gate the manifest must satisfy.
- `docs/gates/phase-acceptance.md` — the per-phase gate the acceptance checks
  + `Verify-by` + cadence knob feed.
- `docs/process/TRACE_SPEC.md` — REQ-ID grammar; the coverage rule is a trace rule.
