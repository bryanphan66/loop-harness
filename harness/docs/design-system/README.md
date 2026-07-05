# Design System — Folder Doctrine

The **shared, version-pinned Tier-1 rule book** and its doctrine. `design-rules.md`
in this folder is **identical in every installed project** — it ships unchanged
because `install-harness.sh` recurses `docs/`. Tier-2 and Tier-3 are per-project.

**Authority:** `design-rules.md` (this folder) is Tier-1. Decision record:
`docs/decisions/three-tier-design-system-floorplan-enforcement.md` (the ADR — read
it before changing any rule here).

## The Three Tiers

| Tier | Lives in | Scope | Mutability |
|---|---|---|---|
| **Tier 1 — Rule book** | `docs/design-system/design-rules.md` (**HERE**) | Patterns · Floorplans · Behavior (structure & interaction, no colors/fonts) | **SHARED · identical across projects · version-pinned.** Never forked per project. |
| **Tier 2 — Project design** | `docs/design/` + `docs/design-guidelines.md` | Brand, tokens (color/type/spacing), Component Coverage Matrix — the project's *look* | **Per-project.** Each project owns its own. |
| **Tier 3 — Components** | `src/components/` + `src/components/README.md` | The actual built components | **Per-project.** Components **conform** to Tier 1 + Tier 2; they never override a rule. |

Tier 1 says *what shape a screen takes and how it behaves*; Tier 2 says *what it
looks like*; Tier 3 *is the code*. A change flows **down** (rule → token →
component), never up.

## Precedence + ASK-on-conflict

- **Tier 1 + Tier 2 are authoritative.** Tier 3 conforms. A component is never the
  source of truth for a rule or a token.
- When a **Tier-1 rule conflicts with an explicit user request**, **ASK** — emit a
  clarification, do **not** silently apply either side (do not quietly follow the
  rule; do not quietly follow the request). See `design-rules.md` § 0.1.
- A screen with a **data grid OR a create/edit form** MUST be classified to a §4
  floorplan **or** declared CUSTOM per `design-rules.md` § 4.7 — **regardless of
  lane** (Tiny / internal included). Only a genuinely trivial single-screen tool
  with neither a grid nor a form may skip classification.

## Version-Pin Contract

- Tier 1 carries a version: `VERSION` (bare line) + the header line in
  `design-rules.md` (`Version: 1.0.0 … Pinned: 2026-06-03`). Current: **1.0.0**.
- **Each project records the pinned version** in its `docs/design-guidelines.md`
  § 0 — so a project states exactly which doctrine it builds against.
- **Doctrine bumps are opt-in per project.** A new Tier-1 version does not auto-
  rewrite a project; the project adopts it **by re-running the installer**, then
  updates its § 0 pin. Until then the project keeps building against its pinned
  version. This stops a doctrine edit from silently changing a frozen prototype.

## How To Consume From A Task

- **Jump to the section, never load the whole file.** From a task, open
  `design-rules.md`, go straight to the relevant § (the floorplan for the screen,
  or §5/§6/§8/§10 for the pattern), read only that.
- Classify the screen **first**: transactional / fact-sheet / analytical (§1) →
  pick the floorplan (§3 table) → read that §4.x → apply cross-cutting §7/§10/§11.
- For a non-floorplan screen (auth, settings, search results, 404…), read § 4.7
  and declare CUSTOM with a one-line rationale in `docs/decisions/<slug>.md`.
- Verify against the **§12 pre-merge checklist** before requesting review.

## Cross-Reference

- `design-rules.md` — the Tier-1 rule book (this folder).
- `VERSION` — the bare pinned version (`1.0.0`).
- `docs/decisions/three-tier-design-system-floorplan-enforcement.md` — the ADR that
  locks this 3-tier + precedence + version-pin model.
- `docs/playbooks/design-system-3-tier.md` — the playbook (how the 3 tiers are
  produced and kept in sync across the workflow).
- `docs/gates/design-system-compliance.md` — the compliance gate (HARD merge
  block: a screen with no floorplan classification, or violating its §4 floorplan
  / §7 action-placement / §8 modal rules, is an automatic block — the FLOOR-RULE
  row added to the code-review rubric).
- `docs/playbooks/ui-design-system-contract.md` — Tier-2 contract (tokens +
  Component Coverage Matrix).
- `scripts/harness-verify-gate.sh` — the mechanical floorplan-classification gate
  (blocks an empty/placeholder Floorplan column in
  `docs/visuals/diagrams/screen-inventory.md` when that file exists).
