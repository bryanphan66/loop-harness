# Gate — Design-System Compliance (per-screen)

> **Type:** internal HARD gate (auto-block), countersignable, **per-screen**.
> **Read by:** `/gate-check` at step **1.12** (prototype must conform), code-review
> as the **floor-rule auto-block** at step **2.7**, and **DoD** at step **2.10**.
> **Authority:** `docs/design-system/design-rules.md` (Tier-1 patterns/floorplans/
> behavior) + `docs/decisions/three-tier-design-system-floorplan-enforcement.md`.

This gate turns the `design-rules.md` §12 pre-merge checklist into a **per-screen,
pass/fail** record. One terse row per screen — a 40-screen ERP fills a 40-row
table, not 40 ceremonies. A screen fails the gate (and **blocks merge**) when it
has **no floorplan classification**, OR it violates its assigned §4 floorplan, OR
it violates §7 action-placement, OR it violates §8 modal rules.

## Inputs

- `docs/visuals/diagrams/screen-inventory.md` — the classification record (one row
  per screen; the verify-gate greps its Floorplan column).
- `docs/design-system/design-rules.md` — §4 floorplans · §5 tables · §7 actions ·
  §8 modals · §10 states · §11 a11y.
- `src/components/README.md` — the reused-primitive inventory (no bespoke re-rolls
  of an existing component).

## Scope (which screens MUST appear)

Floorplan classification is **MANDATORY for any screen containing a data grid OR a
create/edit form — regardless of lane** (Tiny / internal modules included). The
only screen that may be omitted is a genuinely trivial single-screen tool with
**neither a grid nor a form**. Drift is born in fast internal modules; this gate
does not exempt them.

## Per-Screen Compliance Table

One row per screen. Floorplan = exactly one §4 name, or `CUSTOM` (then a
`docs/decisions/<slug>.md` rationale must exist, per §4.7). The three behavior
flags keep each row terse; `§12?` is the single pass/fail verdict for that screen.

| Screen | Floorplan (§4 / CUSTOM) | Table behavior (resp/grid · page/scroll · multisel Y/N) | Message pattern (val·success·async-err) | Create/Edit pattern (Dialog/Sheet/Object-Page) | §12? |
|---|---|---|---|---|---|
| Orders list | List Report | responsive · pagination · multisel Y | inline · toast · inline-alert | Object-Page | pass |
| Order detail | Object Page | n/a | inline · toast · inline-alert | Object-Page | pass |
| Approvals queue | Worklist | responsive · scroll · multisel Y | inline · toast · inline-alert | Dialog | pass |
| Quick add customer | List Report | n/a | inline · toast · inline-alert | Dialog | pass |
| Login | CUSTOM (`<slug>`) | n/a | inline · toast · inline-alert | n/a | pass |
| `<screen>` | `<§4 / CUSTOM+slug>` | `<resp/grid · page/scroll · Y/N>` | `<inline · toast · inline-alert>` | `<Dialog/Sheet/Object-Page>` | `<pass/fail>` |

> **Behavior-flag legend.** Table behavior: responsive (mobile-safe) vs grid
> (desktop/tablet only, §5); pagination vs scroll-with-sticky-header (§5);
> multiselect reveals the bulk-action bar (§5). Message pattern is **split per
> interaction** (§10): validation **inline**, success **toast**, async-error
> **inline-alert**. `§12?` = `pass` only when every applicable §12 line below holds
> for that screen.

## §12 Pre-Merge Lines (asserted per screen, summarized in `§12?`)

Each screen's `§12?` cell is `pass` only when all applicable lines hold:

- [ ] App type identified (transactional / fact-sheet / analytical).
- [ ] Matches exactly one §4 floorplan (or declared `CUSTOM` via §4.7 with a
      `docs/decisions/<slug>.md`); sits in shell + Dynamic Page (§1).
- [ ] Correct table type (responsive for mobile; grid only desktop/tablet);
      pagination/scroll rule applied (§5).
- [ ] **Inline-edit vs page-edit is the assigned one** — no grid silently switches
      between inline-edit and open-a-page (§5 / §8).
- [ ] Action placement per §7 (global→footer; object-page→header; local→near
      content; correct order/emphasis; one emphasized button per region).
- [ ] Modals: explicit close + Esc, focus trap + return, **no outside-click
      dismiss for unsaved forms**; destructive delete uses the confirm-dialog
      anatomy (§8).
- [ ] All three data states present: loading / empty / error (§10).
- [ ] Accessibility baseline met (§11): semantic HTML, keyboard, visible focus,
      target ≥44px, no color-only state.
- [ ] Reused existing components (checked `src/components/README.md`); no hardcoded
      tokens.

## Auto-Block Rule (the teeth)

A screen **blocks merge** when any of these is true — this is the floor-rule the
code-review step (2.7) enforces, reusing the existing "any dimension scoring 0 is
an automatic block" mechanic **without changing the rubric Max or the ≥7
threshold**:

1. The screen is in scope (has a grid OR a form) but has **no floorplan
   classification** in `screen-inventory.md` (empty / `<...>` / `TODO` / `?`).
2. The screen violates its assigned **§4 floorplan** structure/behavior.
3. The screen violates **§7 action-placement**.
4. The screen violates **§8 modal** rules.

> The mechanical half of teeth #1 also runs in `scripts/harness-verify-gate.sh`:
> if `docs/visuals/diagrams/screen-inventory.md` exists, the gate blocks the commit
> on any data row whose Floorplan column is empty or a placeholder.

## Precedence & Conflicts

Tier-1 (`design-rules.md`) and Tier-2 (design tokens / `design-system.md`) are
**authoritative**; components conform to them. If a **Tier-1 rule conflicts with an
explicit user request**, **ASK** — emit a clarification (do not silently apply
either side). Record the resolution in `docs/decisions/<slug>.md`.

## Sign-Off

```text
Design-System Compliance — all in-scope screens classified + §12 pass
Screens in scope (grid or form):   <N>
Screens passing §12:               <N>   (must equal in-scope count)
CUSTOM screens (with ADR slug):    <list of slugs, or none>
Tier-1-vs-user-request conflicts:  <resolved via ASK → slug, or none>
Confirmed by (reviewer):           <name>   on  YYYY-MM-DD
verify-gate screen-inventory grep: green (no empty/placeholder Floorplan)
```

> Filled in the stage-boundary commit alongside the prototype (1.12) and re-checked
> at code-review (2.7) and DoD (2.10). Never mark a screen `pass` you cannot
> evidence against `design-rules.md`.
