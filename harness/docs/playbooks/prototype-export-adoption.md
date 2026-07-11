# Prototype Export Adoption (consume the export as code)

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> How a build turns a **frozen client-approved prototype export** into faithful
> app UI: **adopt the export's real code verbatim** — its CSS, its component
> kit, its screen structure — and wire only real data on top. This is the
> concrete method behind `build-execution.md` § Prototype → Code Fidelity.
> Owns the UI-adoption leg of Build & Go-live **step 2.6**.

**Macro-stage / step:** Build & Go-live · 2.6 (per UI phase).

## Engine

- **Fast path:** `frontend-development` (component port) + `ui-styling` (CSS
  wiring). `cook` drives the phase.
- **Role:** Fullstack Dev. Per D1 these are accelerators — a bare agent that can
  copy files + edit JSX/CSS executes the same recipe.

## When It Applies

**Adopt (this playbook)** when a **frozen export bundle exists** for the screen —
a Claude-Design / Open-Design export at
`docs/visuals/prototype/exports/<engine-vN>/` containing:

- `tokens.css` — design tokens as CSS variables (colors, fonts, spacing, radius).
- `components.css` (+ `components-<domain>.css`) — the styles the kit's classes
  target.
- `kit.jsx` — the component library (Button, Input, Logo, AuthShell, OtpInput,
  Badge, LangToggle, …).
- `screens-*.jsx` — each screen's element tree, composed from the kit.

**Fallback — design-system build** (NOT this playbook) when **no frozen export
exists** for the screen (net-new screen, or one the prototype never covered):
build it via Tier-1 floorplan + Tier-2 tokens + Tier-3 components. Record it as
`rebuild (decision: <slug>)` in the phase block — never a silent choice.

The build-manifest phase block marks each screen `adopt from export` (default
when an export exists) or `rebuild (decision: <slug>)`.

## Why Adopt, Not Re-Draw (failure evidence)

Re-implementing a frozen export by *reading* it into fresh Tailwind reproduces
the functional skeleton but lands at **~80%**: dropped elements (logo, a signup
link, a VI/EN toggle), the **wrong theme** (dark instead of the export's
light-first), a washed-out primary button, and a broken **OTP input** (backspace
not deleting + stepping back) — plus heavy manual eye-tuning that still diverges
(elearning-platform P1/P2/P3). Bringing the export's real `tokens.css` +
`components.css` in, porting the kit keeping classNames, and rebuilding screens
from `screens-*.jsx` reached **~99% by construction** (elearning commit *re-base
auth screens on the frozen prototype export*). **The LLM re-drawing step is the
fidelity-loss step — remove it.**

## Method (per UI phase)

1. **Adopt the CSS.** Copy `tokens.css` + `components.css`
   (+ `components-<domain>.css`) from the export into
   `apps/web/src/styles/prototype/` and import them globally (e.g. from
   `globals.css` or the root layout). Do NOT hand-transcribe values into a
   Tailwind config — import the real files; theme + spacing hold by construction.

2. **Port the kit components — KEEP the exact classNames.** For each `kit.jsx`
   component, create the real app component (`src/components/…`) that renders the
   **same class names** the imported CSS targets. Same classes → the CSS applies
   → correct look with zero eye-tuning. Convert JSX idioms to the app's framework
   (Next/React) but **do not rename or "clean up" classes** — that breaks the CSS
   binding. Add real behaviour the export stubbed (e.g. `OtpInput`: type fills +
   advances, backspace deletes + steps back, paste fills, submit disabled until
   complete).

3. **Register the kit as Tier-3.** List every ported component in
   `src/components/README.md`. Later screens **reuse** these — re-inventing a kit
   component is a build-phase BLOCK (drift at the root).

4. **Rebuild each screen from `screens-*.jsx`.** Same element tree, same kit
   components, same classes as the export screen. Reproduce **every** element the
   export screen has (each field, button + variant, link, toggle, icon, empty/
   error/loading state) — a dropped element is a defect, not a style choice.

5. **Wire ONLY real data / behaviour** into the adopted markup — routing, API
   calls, form state, validation, loading/empty/error. Content changes;
   structure + look do not.

6. **Prove fidelity, don't claim it.** Write the screen's Playwright fidelity
   assertions (element completeness + interaction behaviour — see
   `docs/gates/visual-fidelity.md`) and run them green; then capture the running
   screenshot and place it side-by-side with the prototype image for the human
   glance **before the phase closes**. Assertions + human approval, not a
   self-certified "matches export".

## Kit-First Ordering

The kit is the leverage point — one lossy port there drifts **every** screen.
Adopt + verify the kit **once, under the hardest scrutiny** (a P0.5 / walking-
skeleton design-system leg, before any screen phase): CSS imported, components
porting classes 1:1, operator sign-off on the kit once. Every screen phase then
inherits correct theme + components, so per-screen review is a quick glance that
scales to many screens.

## Variant Section

(Append a Variant block here when this playbook fails or partially works.)

## Related

- `build-execution.md` § Prototype → Code Fidelity — the rule this playbook
  implements; § Before Coding A Screen — the pre-flight.
- `docs/gates/visual-fidelity.md` — the toothy gate (Playwright element +
  interaction assertions + human side-by-side glance) each adopted screen passes.
- `docs/templates/build-manifest.md` — the phase block carries each screen's
  export source + required-element + interaction assertions.
- `design-system-3-tier.md` — the adopted `tokens.css` = Tier-2; the ported kit
  = Tier-3.
- `ui-design-system-contract.md` — the design-system build used in the fallback
  (no frozen export).
- `docs/HARNESS.md` § Control-Plane Failure Classes — FC7 (human review must be
  real) governs step 6's glance.
