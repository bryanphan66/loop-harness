# Gate — Visual Fidelity (screen vs prototype export)

> **Type:** internal HARD gate (auto-block), countersignable, **per-screen**.
> **Read by:** the per-phase floor self-check at step **2.6**, code-review as a
> **floor-rule auto-block** at step **2.7**, and **DoD** at step **2.10** (the
> side-by-side evidence pass). **Authority:**
> `docs/playbooks/build-execution.md` § Prototype → Code Fidelity (port-first
> default) + the frozen prototype (PB-G3).

The client froze the **prototype**, not an abstract spec. This gate proves the
running app **looks like what was frozen** — per key screen, a screenshot of the
running app compared side-by-side with the render of that screen's prototype
export. Structural/visual divergence with no recorded deviation decision =
**block**.

**Why this gate exists (failure evidence):** on a design-heavy product, screens
rebuilt "correctly" via generic design-system components passed floorplan
classification, token compliance, review, and e2e — and were still rejected by
the operator at UAT because they looked nothing like the frozen mockup; the
screens had to be re-ported from the export afterwards (example: auto-script
Macro-2, UI-port fix leg). Fidelity was the one thing no gate checked. The same
run also shipped scaffold default tokens instead of the brand tokens — token
*classification* passed while token *values* were wrong; the side-by-side
comparison catches value-level drift too.

## Inputs

- `docs/visuals/prototype/exports/<engine-vN>/` — the frozen export bundle; the
  per-screen source file cited in the screen's build-manifest phase block.
- The running app (compose/dev server) — same screens, seeded data.
- `docs/build-manifest.md` — each screen's `port from export` vs
  `rebuild (decision: <slug>)` marker.

## Scope (which screens MUST appear)

Every **key screen** of the APP / ADM zones — at minimum: every screen a
build-manifest phase names, the app shell (nav/topbar), and every screen the
frozen prototype renders with sample data. PUB screens are ported ~verbatim and
are normally self-evident, but any PUB screen that visibly diverges from its
export belongs in the table too. A screen marked `rebuild (decision: <slug>)`
still appears — compared against the design-system contract instead of the
export, with its decision slug in the row.

## Per-Screen Fidelity Table

One row per screen. Evidence = paths to the app screenshot and the export
render (or the export file opened in a browser), stored under
`plans/reports/` with the QA evidence.

| Screen | Export source (file in exports/) | Strategy (port / rebuild+slug) | App screenshot | Verdict (pass / divergent) | Notes |
|---|---|---|---|---|---|
| `<screen>` | `<exports/.../file.html>` | `port` | `<plans/reports/...png>` | pass | |
| `<screen>` | `<exports/.../file.html>` | `rebuild (decision: <slug>)` | `<plans/reports/...png>` | pass | compared vs design-system contract |

**Verdict rubric — `pass` requires all of:**

- [ ] **Structure matches** — same layout regions, hierarchy, and component
      shapes as the export (columns, cards, panels, nav placement).
- [ ] **Token values match** — brand colors / typography / spacing read from the
      running screen match the export as reconciled to Tier-2 tokens (no
      scaffold/default theme leaking through).
- [ ] **States present** — the export's sample-data state is reproduced with
      real/seeded data; loading/empty/error states exist (per §10) even where
      the export shows only one state.
- [ ] Data wiring may change *content*, never *shape* — real values in the
      ported structure is `pass`; a different structure is `divergent`.

`divergent` = the screen is structurally or visually far from its reference —
**block** (see Auto-Block Rule). Cosmetic sub-pixel differences, font-rendering
noise, and real-data content differences are not divergence.

## Auto-Block Rule (the teeth)

A screen **blocks merge / DoD** when any of these is true — enforced at 2.7 with
the same "any dimension scoring 0 is an automatic block" mechanic as the
design-system floor rule (rubric Max and the ≥7 threshold unchanged):

1. An APP/ADM screen has **no export source citation** in its build-manifest
   phase block AND no `rebuild (decision: <slug>)` marker.
2. A ported screen's verdict is **divergent** from its export render.
3. A rebuilt screen has a `rebuild` marker whose decision record
   (`docs/decisions/<slug>.md`) does not exist.
4. The fidelity table is missing rows for key screens the manifest names.

## Sign-Off

```text
Visual Fidelity — running app matches the frozen prototype
Screens in scope:                   <N>
Screens passing:                    <N>   (must equal in-scope count)
Rebuilt screens (with ADR slug):    <list of slugs, or none>
Evidence dir:                       plans/reports/<...>
Confirmed by (QC/QA):               <name>   on  YYYY-MM-DD
```

> Self-checked per phase at 2.6 (the implementing agent eyeballs its own ported
> screens vs the export before committing), enforced as a floor rule at 2.7, and
> filled with screenshot evidence at 2.10 alongside `dod-build.md`. Never mark a
> screen `pass` without having rendered both sides.
