# Three-Tier Design System

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> The cross-stage recipe that stops ERP UI drift: classify every grid/form screen
> to exactly one Tier-1 floorplan and enforce it at design, build, and review.
> Spans Pre-Build design (1.10–1.12) and Build (2.6–2.10).

**Macro-stage / step:** always-on across Pre-Build design + Build. **Gate it
serves:** `docs/gates/design-system-compliance.md` (per-screen §12) + the
verify-gate Floorplan grep.

> **Shape:** structural framework — "When this fits" + "What this means", then the
> tier model, the floorplan decision tree, precedence/ASK, version-pinning, the
> enforcement-point map, and engine bindings.

## Engine

Per D1 (Independence Principle): each binding names a `ck-*` fast path and a
bare-agent fallback producing the same artifact shape.

- **Tier-1 classification (floorplans/behavior):** `ck-ux-design` — screen map →
  per-screen floorplan. **Bare-agent fallback:** the `ui-ux-designer` agent reads
  `docs/design-system/design-rules.md` directly and classifies by hand.
- **Tier-2 tokens (`design-system.md`):** `ck-design-system`.
- **Tier-3 components:** `ui-styling` / shadcn.
- **Role:** Designer (classification) → Fullstack Dev (conform) → Tech Lead
  (review). Skills are accelerators, never hard requirements.

## When This Fits

Use when a project has **any screen with a data grid OR a create/edit form** —
i.e. essentially every ERP/admin/internal app. Classification is **mandatory
across ALL lanes**, Tiny/internal included; drift starts in fast internal modules.

Skip **only** a genuinely trivial single-screen tool with **neither a grid nor a
form** (a status page, a one-button utility).

## The 3-Tier Model

Three layers kept in sync; the top is the one usually missing.

| Tier | Owns | Source of truth | Engine |
|---|---|---|---|
| **Tier-1** | **Structure & behavior** — floorplans, action placement, modal/table/state rules | `docs/design-system/design-rules.md` (SHARED, ships to every project) | `ck-ux-design` |
| **Tier-2** | Tokens + `design-system.md` (color/type/spacing, light/dark) | per-project token files (code is SoT) | `ck-design-system` |
| **Tier-3** | Component implementations | `src/components/` (+ `README.md` inventory) | `ui-styling` / shadcn |

Tier-1 and Tier-2 are **authoritative**; Tier-3 components **conform**.

## Floorplan Decision Tree

Classify each screen using `design-rules.md` §3 (the choose-a-floorplan table),
landing on **exactly one** §4 floorplan, or `CUSTOM` via §4.7.

```text
Classify App-type first (§1/§3): transactional · fact-sheet · analytical
        │
        ├─ Overview of info & tasks (cards) ............... Overview Page (§4.4)
        ├─ List + find & act on a large set (filter/sort) . List Report  (§4.1)
        ├─ List + process items one-by-one (work queue) ... Worklist     (§4.3)
        ├─ KPI + chart + list, filter-impact-on-chart ..... Analytical List Page (§4.5)
        ├─ View / edit / create ONE object ................ Object Page  (§4.2)
        ├─ Long / unfamiliar task split into steps ........ Wizard       (§4.6)
        │
        └─ Fits none of the above ........................ CUSTOM (§4.7)
                                                            → one-line rationale
                                                            → docs/decisions/<slug>.md
                                                            → still obey §1 shell,
                                                              §7 actions, §10 states,
                                                              §11 a11y
```

Most common pairing: **List Report + Object Page (LROP)**. Recurring CUSTOM
screens (each needs an ADR slug): auth/login/forgot-password, settings/
preferences, global search results, onboarding/first-run, notifications center,
full-page 403/404/500/maintenance, billing/pricing.

## Precedence + ASK

- Tier-1 + Tier-2 are authoritative; components conform.
- A **Tier-1-rule-vs-explicit-user-request** conflict resolves to **ASK** — emit a
  clarification; do **not** silently apply either side. Record the resolution in a
  `docs/decisions/<slug>.md`.
- House-style divergence from the SAP-Fiori opinions baked into `design-rules.md`
  is captured as **`[House]`** overrides on the named rule (plus ASK on conflict),
  never by silently ignoring Tier-1.

## Version-Pinning + Opt-In Upgrade

`design-rules.md` ships SHARED at `docs/design-system/design-rules.md` (the
installer recurses `docs/`). Each project owns its pinned copy. Upgrading to a
newer Tier-1 is an **opt-in, per-project decision** — re-pin consciously, re-run
the §12 gate against the new rules, record the bump in a decision. Tier-1 never
mutates a project's UI behind its back.

## Enforcement-Point Map (the full teeth)

| Step | What runs | Blocks when |
|---|---|---|
| **1.10** | **Pin** Tier-1 (`design-rules.md` present at `docs/design-system/`) + Tier-2 tokens | Tier-1 absent / unpinned |
| **1.11** | **Classify** every grid/form screen → `docs/visuals/diagrams/screen-inventory.md` | any in-scope row missing a Floorplan |
| **1.12** | **Prototype conforms** — §12 per-screen checklist asserted | a prototyped screen violates its floorplan |
| **2.6** | **Classify before code** — re-affirm the screen's floorplan before implementing | code starts on an unclassified grid/form screen |
| **2.7** | **Code-review floor-rule auto-block** — no floorplan, or §4/§7/§8 violation | reuses "dimension=0 auto-block"; **Max & ≥7 unchanged** |
| **2.8** | **E2E behavior assertion** — a test proves the assigned behavior (e.g. modal does NOT dismiss on outside-click with unsaved input; grid edits inline where declared) | behavior test missing/failing |
| **2.10** | **DoD** — `design-system-compliance.md` signed; all in-scope screens pass §12 | any in-scope screen not `pass` |

Plus the **mechanical** layer: `scripts/harness-verify-gate.sh` blocks any commit
where `screen-inventory.md` exists and a data row's Floorplan column is empty or a
placeholder (`<...>`, `TODO`, `?`); it skips cleanly when the file is absent.

## design-rules.md — What Tier-1 Now Covers

The pinned Tier-1 carries the floorplans (§4) plus these behavior patterns the
classifier and reviewer assert: confirm/destructive-delete dialog anatomy (§8);
bulk-edit dialog + inline-edit grid mode — the "some grids edit inline, some open a
page" drift (§5/§8); toast timing/position/max-stack (§10); named breakpoints +
cozy/compact density (§5); file upload — drag-drop + picker, progress, validation,
multi-file (§6).

## Hand-Off

- **To 1.12 prototype:** `screen-inventory.md` is the input — every prototyped
  screen must render in its classified floorplan.
- **To 2.6 build:** the developer reads the screen's row before implementing.
- **To 2.7/2.10:** the reviewer/QC reads `design-system-compliance.md` and asserts
  the floor-rule + §12 per screen.

## Per-Tier Application

| Lane | Application |
|---|---|
| Tiny / internal | Classification **still mandatory** for any grid/form screen — this is where drift is born. Only a no-grid/no-form one-screen tool may skip. |
| Normal | Full classify → prototype-conform → floor-rule → DoD chain. |
| High-risk | Same, plus the 2.8 E2E behavior assertion is non-negotiable per screen. |

## Variant Section

(Append a Variant block here when this playbook fails or partially works. Do not
delete the original shape.)

## Related

- `docs/design-system/design-rules.md` — Tier-1 rule book (§3/§4/§4.7/§5/§7/§8/§10/§11).
- `docs/gates/design-system-compliance.md` — per-screen §12 gate (1.12/2.7/2.10).
- `docs/mau-tai-lieu/screen-inventory.md` — the classification record template.
- `docs/decisions/three-tier-design-system-floorplan-enforcement.md` — the decision.
- `docs/playbooks/ui-design-system-contract.md` — Tier-2 token contract (1.10).
- `docs/playbooks/code-review-scoring.md` — the floor-rule lives at 2.7.
- `docs/process/WORKFLOW.md` § 1.10–1.12 + 2.6–2.10 — the steps this spans.
- `docs/process/ROLE_MAP.md` — Designer + `ck-ux-design` / `ck-design-system` binding.
