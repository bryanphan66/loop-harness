# Gates

A **countersignable checklist** per canonical gate. Each file is a checklist plus
a sign-off line — the durable record that a gate was cleared (or a conditional
gate marked **N/A by decision**) before the next step started.

**Authority:** `docs/WORKFLOW.md` § Canonical Gate List + the per-step Gate
columns. **Decision weight:** D2 (balanced process — `docs/decisions/balanced-process-conditional-enterprise-gates.md`).

## Gate Index

| Gate file | Gate | Macro | Type | Pages client? |
|---|---|---|---|---|
| `pb-g1-intake.md` | PB-G1 intake go/no-go | Pre-Build | internal capture | no |
| `pb-g2-scope-frozen.md` | PB-G2 scope frozen | Pre-Build | **CLIENT** | yes |
| `pb-g3-prototype-frozen.md` | PB-G3 prototype frozen | Pre-Build | **CLIENT** | yes |
| `pb-g4-contract-deposit.md` | PB-G4 contract + deposit (hardest) | Pre-Build | **CLIENT** | yes |
| `dor-build.md` | Definition of Ready (enter Build) — incl. build-manifest coverage | Build | internal | no |
| *(no file — mechanical)* | WALKING SKELETON (2.4/2.5) — scaffold boots, health OK, seeded admin login, CI green; asserted by `/gate-check --gate WALKING-SKELETON` | Build | internal | no |
| `design-system-compliance.md` | Design-System Compliance (per-screen 3-tier) | Build | internal | no |
| `visual-fidelity.md` | Visual Fidelity (per-screen, app vs prototype export) | Build | internal | no |
| `dod-build.md` | Definition of Done (exit Build) | Build | internal | no |

> **`design-system-compliance.md`** is a per-screen checklist (one fill per
> grid/form screen): every such screen classified to one §4 floorplan
> (`docs/design-system/design-rules.md` Tier-1) with §7 action / §8 modal / §10
> feedback rules honored, tokens from Tier-2 (no hardcoded values), components
> reused from the Tier-3 inventory. **Filled per-screen at 1.12** (prototype),
> **re-verified at 2.7** (code review floor rule) and **2.10** (DoD), and walked
> by `/gate-check` alongside the step gate. It is internal — it does **not** page
> the client.

> **`visual-fidelity.md`** is a per-screen checklist proving the running app
> **looks like the frozen prototype**: for each key APP/ADM screen, a
> running-app screenshot compared side-by-side with the screen's prototype
> export render; structural/visual divergence without a recorded rebuild
> decision = auto-block. **Self-checked per phase at 2.6**, enforced as a
> code-review **floor rule at 2.7**, and filled with evidence at **2.10** (DoD).
> Complements `design-system-compliance.md` — compliance checks classification
> and rules; fidelity checks the screen actually matches the design the client
> froze. Internal — does **not** page the client.

> **Client-paging gates** (emit `MANUAL_CHECKPOINT`, page the human's phone):
> PB-G2, PB-G3, PB-G4, plus the Build **ACCEPTANCE** gate (inside the UAT step)
> and the Post-Build **HANDOVER** gate. **PB-G1 is internal — it does NOT page.**
> ACCEPTANCE and HANDOVER clearing conditions live in the WORKFLOW Canonical
> Gate List + the 2.12 / 3.1 goal blocks; their sign-off records use the
> delivery-closure-story and project-closure-story templates. In the **Lite
> lane** the paging gates page the owner; a one-line written ack clears them
> (`docs/WORKFLOW.md` § Lanes).

## Conditional Enterprise Gates

Per D2, enterprise gates are **conditional**, not dropped. Each one must be
explicitly marked **N/A by decision** (with a one-line reason + date) when it does
not apply — never silently skipped. They live mostly in Build & Go-live and
Post-Build, and their toggles are tracked in `dod-build.md`:

- data-migration / cutover (2.1b)
- NFR / load test (2.11)
- DR + RTO/RPO restore-drill (2.11)
- compliance / privacy / WCAG
- observability / SLO (2.4 — usually always-on, rarely N/A)

## How verify-gate / gate-check Reference These

- **`/gate-check` command** (`.claude/commands/gate-check.md`) loads the gate file
  for the current step, walks the checklist, and refuses to advance `STAGE.md`
  while any required line is unchecked (or any conditional line is neither checked
  nor marked N/A by decision).
- **verify-gate** (`scripts/harness-verify-gate.sh`, run by `.githooks/`) is
  mechanical: it blocks a stage-close commit when the **verification register**
  (`docs/TEST_MATRIX.md`) carries a `Result: fail` or a `never-run` on a
  stage-close. The gate **checklist** is the human-judgment half; the verify-gate
  is the machine half. A client-paging gate clears only when the human's
  countersign line is filled in **and** the verify-gate is green.
- A gate file is filled **in the same stage-boundary commit** as the step's
  artifact (`docs/WORKFLOW.md` § Always-On Layer — stage-boundary commits).

## Filling A Gate File

1. Copy the gate file's checklist into the gate event (or edit it in place for a
   single-project install).
2. Check every required line; for conditional lines, check **or** mark
   `N/A by decision — <reason> (<date>)`.
3. Fill the sign-off line: who countersigned, the date, and (for client gates) the
   client's written-confirmation reference (email, signed PDF, chat acknowledgment).
4. Commit it with the step's artifact. Never check a line you cannot evidence.
