# Gate — Visual Fidelity (built screen vs frozen prototype)

> ⚠️ **ENFORCEMENT STATUS (read first — honest scope of the "auto-block").**
> Auto-enforced TODAY in the shipped template's `lint:gates` for fidelity =
> **four** scripts: `scripts/check-universal-fidelity-imports.mjs`,
> `check-new-screen-fidelity-required.mjs`, **`check-prototype-fidelity.mjs`
> (NEW — structural adopt-via-existing-components check)**, and
> `check-admin-screen-width-caps.mjs` (plus `check-prisma-fk-indexes.mjs` for the
> FK floor) — all run by the verify-gate hook via the `validate` script. The
> per-screen **Playwright fidelity assertions** are real but only gate if the
> project wires its `apps/web/e2e-ui/*.fidelity.ts` specs into a run the hook/CI
> executes.
>
> **The fidelity spec must ASSERT the prototype's components/sections, not merely
> EXIST.** A spec that only smoke-tests "the screen renders" is NOT fidelity. The
> rule now has machine teeth: `check-prototype-fidelity.mjs` reads
> `scripts/fidelity-map.json` (route → `{prototypeFile, requiredComponents,
> requiredSections}`) and fails a mapped screen whose `page.tsx` does not IMPORT
> the required shared components (from `@/components`/`components/ui`) and USE
> them, or is missing a required section, or re-draws a grid as a raw `<table>`
> instead of `DataGrid`. This auto-blocks the RE-DRAW hole (build a look-alike by
> hand instead of adopting the export through existing components). Its limit is
> honest: it checks **component-presence only** — the **pixel/aesthetic match**
> (Tooth B, the side-by-side glance) stays a verifier + human step, never an
> auto-block.
> The U13–U19 `scripts/check-dead-affordance.mjs`, `check-inline-grid-reflow.mjs`,
> `check-icon-registry-coverage.mjs`, `check-prototype-copy-verbatim.mjs`,
> `check-primitive-inline-style.mjs`, `check-toast-convention.mjs` cited below are
> **SPECIFIED, NOT YET SHIPPED as scripts** — today they are enforced **manually**
> via `docs/playbooks/pre-demo-self-qa-checklist.md`, not by auto-lint. Do **not**
> treat U13–U19 as auto-blocks until those scripts ship into `lint:gates`.

> **Type:** internal HARD gate (auto-block), countersignable, **per-screen**.
> **Read by:** the per-phase acceptance leg at step **2.6**, code-review as a
> **floor-rule auto-block** at step **2.7**, and **DoD** at step **2.10**.
> **Authority:** `docs/playbooks/build-execution.md` § Prototype → Code Fidelity
> (adopt-the-export default) + `prototype-export-adoption.md` + the frozen
> prototype (PB-G3).

The client froze the **prototype**, not an abstract spec. This gate proves the
running app **is** what was frozen. Its teeth are **machine-checkable, not an
opinion**:

- **Tooth A — Playwright assertions per screen** (element completeness +
  interaction behaviour): a dropped element or a broken interaction is a **RED
  test**, undeniable.
- **Tooth B — a human glance** at the built screenshot **side-by-side** with the
  prototype image, **before the phase closes** — the human judges aesthetics.

**What this gate explicitly does NOT rely on:** an agent self-certifying "matches
the export", or **an LLM comparing two screenshots**. An LLM image-compare is
unreliable and biased toward "same" — it is not a tooth. The machine tooth is the
assertions; the human tooth is the glance. Prose ("port from export") gets
skimmed; an executable assertion cannot be, and a surfaced side-by-side cannot be
rubber-stamped blind (`docs/HARNESS.md` § Control-Plane Failure Classes — FC7).

**Why this gate exists (failure evidence):** re-implementing a frozen
Claude-Design export by *reading* it into fresh Tailwind passed floorplan
classification, token classification, review, and e2e — and still shipped the
**wrong theme** (dark vs the export's light), **dropped** the logo + a signup
link + a VI/EN toggle, and a **broken OTP input** (backspace didn't delete + step
back), while the old verifier stamped it PASS on the builder's own "matches
export" claim (elearning-platform P1/P2/P3). Element assertions would have gone
RED on every dropped element; an interaction assertion would have caught the OTP
backspace bug. The fix (`prototype-export-adoption.md`) reached ~99% by adopting
the export's code — this gate now proves it mechanically.

## Inputs

- `docs/visuals/prototype/exports/<engine-vN>/` — the frozen export bundle
  (`screens-*.jsx` for each screen's element inventory; the prototype image /
  board render the operator already has for the glance).
- The running app (compose/dev server) — same screens, seeded data.
- `docs/build-manifest.md` — each screen's `adopt from export` vs
  `rebuild (decision: <slug>)` marker + its **required-element + interaction
  assertions**.
- The screen's Playwright fidelity spec (e.g. `apps/web/e2e-ui/<screen>-fidelity.spec.ts`).
- `scripts/fidelity-map.json` — route → `{prototypeFile, requiredComponents,
  requiredSections}`, the structural contract `check-prototype-fidelity.mjs`
  auto-enforces (authored when the prototype is frozen, PB-G3).

## Scope (which screens MUST have assertions + a glance)

Every **key screen** the build ships — at minimum every screen a build-manifest
phase names, the app shell (nav/topbar), and every screen the frozen prototype
renders. A screen marked `rebuild (decision: <slug>)` still appears — its
assertions check against the design-system contract, with its decision slug in
the row.

## Tooth A — Playwright fidelity assertions (the machine teeth)

Each screen's **Required-Elements Checklist + interaction behaviours** (compiled
into the manifest phase block at 2.3) are encoded as **Playwright assertions on
the running app** — not prose. Two families:

**Element completeness** — every element the prototype screen has is present in
the built DOM:

```ts
// auth/login — required elements from screens-login.jsx
await expect(page.getByRole('img', { name: /logo/i })).toBeVisible();
await expect(page.getByRole('link', { name: 'Đăng ký học' })).toBeVisible();
await expect(page.getByRole('button', { name: /vi|en/i })).toBeVisible(); // lang toggle
await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible();
// theme guard: page bg is the export's light token, not a scaffold/dark default
await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
```

**Interaction behaviour** — the export's interactive elements actually behave:

```ts
// OTP input — the exact class the ~80% re-draw got wrong
await otp.nth(0).type('1'); await expect(otp.nth(1)).toBeFocused();   // type fills + advances
await otp.nth(1).press('Backspace');                                   // backspace...
await expect(otp.nth(0)).toBeFocused();                                // ...deletes + steps back
await page.evaluate(() => navigator.clipboard.writeText('123456'));
await otp.nth(0).press('Control+v');                                   // paste fills all cells
await expect(submit).toBeEnabled();
await expect(submit).toBeDisabled();                                   // submit disabled until valid
```

**Four UNIVERSAL assertions — every APP/ADM screen** (mandatory, NOT per-screen
opt-in). All four gaps below passed element checks, review, and e2e and still
shipped (elearning /admin/roles): the screen rendered as a bare panel with no
portal chrome (U1); its create-role input lost focus after every keystroke (U2);
its dark theme was wrong because a scaffold `globals.css` re-declared the export
tokens (U3); and its sidebar scrolled away with the page (U4). A per-screen
checklist misses them because they are cross-cutting — so they are always-on:

```ts
// (U1) App-shell present — an authenticated screen is NEVER a bare panel; it
// renders INSIDE the frozen portal chrome. A screen built as an isolated panel
// (no sidebar sections + no topbar controls) is a RED test.
await expect(page.getByRole('navigation')).toBeVisible();            // sidebar
for (const s of SHELL_NAV_SECTIONS) await expect(page.getByText(s)).toBeVisible();
await expect(shellSearch).toBeVisible();                             // topbar search
await expect(langToggle).toBeVisible();                             // VI/EN
await expect(themeToggle).toBeVisible();                             // dark-mode
await expect(userChip).toBeVisible();                               // user menu

// (U2) No text input loses focus while typing — the dialog/OTP focus-steal
// class. Type a multi-char string in ONE burst: the whole string must land AND
// the field stay focused (a focus effect that re-runs per keystroke, or a
// controlled input that remounts, drops focus and fails this).
await field.click();
await page.keyboard.type('abcdefghij0123456789');
await expect(field).toHaveValue('abcdefghij0123456789');
await expect(field).toBeFocused();

// (U3) Theme fidelity in BOTH modes + no scaffold overrides the adopted tokens.
// The export ships light (:root) AND dark (.dark) tokens; the build must honour
// BOTH. The trap: a scaffold globals.css that re-declares the export's token
// names in `@layer base` emits AFTER the imported tokens.css and silently wins
// in BOTH modes (Tailwind v3 @layer base is not a real cascade layer) — the app
// shipped the wrong dark theme this way while the light glance looked fine.
for (const theme of ['light', 'dark']) {
  await setTheme(theme);                                            // toggle .dark
  const bg = await page.locator('main').evaluate(e => getComputedStyle(e).backgroundColor);
  expect(bg).toBe(EXPORT_BG[theme]);      // == the export token, NOT a scaffold value
}
// portal chrome keeps its own brand background in dark (not the body dark):
await setTheme('dark');
await expect(page.locator('.shell-sidebar')).not.toHaveCSS('background-color', EXPORT_BG.dark);

// (U4) The app-shell stays put while content scrolls — sidebar is a fixed cell,
// only the inner content region scrolls (a shell not bound to the viewport lets
// the whole document scroll and the sidebar disappears).
await contentRegion.evaluate(el => el.scrollTo(0, el.scrollHeight));
expect(await page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
await expect(firstNavItem).toBeInViewport();
```

A dropped element or a wrong interaction = a **RED test = block**. The assertions
live in the screen's fidelity spec and run in `validate:quick` / the phase e2e
smoke, so they gate every commit, not just the final QA pass.

## Tooth B — human side-by-side glance (before the phase closes)

The gate **surfaces** the built screenshot next to the prototype image the
operator already has (the acceptance leg captures the running screen via
Playwright and stores it under `plans/reports/`). **When the export ships a dark
theme, the glance is captured in BOTH light and dark** — the wrong-dark-theme
defect (U3) was invisible because only the light screen was ever glanced. The
human approves the pair **before** the phase is marked done — aesthetics only
(the assertions already proved structure + behaviour). A phase whose fidelity
assertions are green but
whose glance is not yet approved is **not done** (FC7 — no blind rubber-stamp).

The kit is adopted + operator-signed **once** (P0.5 / walking-skeleton leg —
`prototype-export-adoption.md` § Kit-First Ordering), so per-screen theme +
components are correct by construction and the per-screen glance is a quick check
that scales to many screens.

## Per-Screen Fidelity Table

One row per screen. Evidence = the fidelity spec path + the app screenshot path,
stored under `plans/reports/` with the QA evidence.

| Screen | Export source (screens-*.jsx) | Strategy (adopt / rebuild+slug) | Fidelity spec | Assertions | App screenshot | Glance | Notes |
|---|---|---|---|---|---|---|---|
| `<screen>` | `<exports/.../screens-x.jsx>` | `adopt` | `<...-fidelity.spec.ts>` | green | `<plans/reports/...png>` | ok | |
| `<screen>` | `<exports/.../screens-y.jsx>` | `rebuild (decision: <slug>)` | `<...-fidelity.spec.ts>` | green | `<plans/reports/...png>` | ok | vs design-system contract |

## Auto-Block Rule (the teeth)

A screen **blocks merge / DoD / phase-close** when any of these is true —
enforced at 2.6 (acceptance leg) and 2.7 with the design-system floor rule's
"any dimension scoring 0 is an automatic block" mechanic:

1. An APP/ADM screen has **no export source citation** in its build-manifest
   phase block AND no `rebuild (decision: <slug>)` marker.
2. The screen has **no fidelity spec**, or its fidelity assertions are **RED**
   (dropped element / wrong interaction / wrong theme token).
3. The screen's **required-element + interaction assertions were never compiled**
   into the manifest phase block (nothing to encode = a 2.3 compile defect).
4. A rebuilt screen has a `rebuild` marker whose decision record
   (`docs/decisions/<slug>.md`) does not exist.
5. The human **glance is not recorded** for a screen the phase ships (assertions
   green is necessary, not sufficient — FC7).
6. An **APP/ADM screen renders without the portal app-shell** (U1 RED) — shipped
   as a bare/isolated panel (no sidebar sections + topbar controls). The app-shell
   is a **P0.5 foundation adopted before any inner screen** (`prototype-export-
   adoption.md` § Kit-First Ordering); inner screens mount inside it.
7. **Any text input loses focus mid-typing** (U2 RED) — a controlled input that
   remounts or a focus effect that re-runs per keystroke. Every screen with a
   text input carries U2.
8. **Dark (or light) theme is not the export's** (U3 RED) — the computed token in
   either mode diverges from the export, most often because a scaffold
   `globals.css` re-declares an export-owned token. Rule: the scaffold MUST NOT
   redeclare any token the adopted `tokens.css` defines (light OR dark); the
   export tokens win, and both modes are asserted + glanced.
9. **The app-shell scrolls with the page** (U4 RED) — the shell is not bound to
   the viewport, so the sidebar/topbar scroll away instead of the content region
   scrolling inside its own container.
10. **The local export was not verified against the LIVE prototype** — no pinned
    version + no local-vs-live diff at adoption (`prototype-export-adoption.md`
    § Source Freshness). A local export snapshot silently drifts from the design
    the client keeps editing; adopting a stale cache faithfully ships the wrong
    design while every "matches the export" check passes. Re-pull + diff the live
    source (tokens + components + chrome) before adoption, or the phase is blocked.
11. **Cross-cutting UI NFRs the SRS mandates are absent** — when the SRS requires
    i18n and/or responsive (e.g. `NFR.I18N.01` locale floor VI+EN with
    locale-aware number/currency/date; `NFR.UX.01` student-facing usable at the
    mandated min width with no horizontal page scroll + tap targets ≥44×44px),
    EVERY UI phase ships them as part of DoD, with machine assertions: switching
    locale changes the visible strings (no target-locale string left hardcoded on
    the screen) + currency/date render in the active locale; at the mandated min
    viewport the page has no horizontal scroll and key controls meet the tap-size
    floor. A frozen prototype is usually desktop + single-language, so these are
    additive faithful work (the reflow/second-locale is designed on top of the
    frozen visual language), not a redraw. A screen missing a mandated UI NFR is
    blocked — the prototype only covers look, not the NFR floor.
12. **A drag-reorder UI is hand-rolled and/or one-directional** (U5 RED) — any
    screen that reorders items by drag (chapters, lessons, list rows) MUST use a
    real DnD primitive with a **keyboard sensor** (e.g. dnd-kit) — NOT a bespoke
    HTML5 `dragstart/drop` handler. The classic hand-rolled bug is a
    **down-direction no-op**: dropping onto the next row lands one slot short, so
    items move UP but never DOWN. The gate asserts reorder **persists across
    reload in BOTH directions** (drag a row down AND up), the **whole row** is the
    handle (not a 12px grip icon), and **keyboard reorder** works with axe 0
    serious/critical (drag-drop alone fails keyboard a11y). Persistence is verified
    at source (reload → new `sort_order`), never assumed from the optimistic UI.
13. **Breadcrumb crumbs are dead text** (U6 RED) — on any object/detail page whose
    header renders a breadcrumb trail, every **non-last** crumb MUST be a
    keyboard-focusable navigable link (`<a>`/`<Link>`) that actually routes back to
    that ancestor; only the **last** crumb stays plain text with
    `aria-current="page"`. A breadcrumb that renders all crumbs as inert spans is a
    dropped interaction (the trail exists to navigate, not to decorate) and blocks.

14. **A ported-mockup width cap fights the shell content column** (U7 RED) — the
    frozen export screens are drawn as centered narrow columns (a mockup-canvas
    convention), so each ported screen tends to bake its own `maxWidth: 720/760`
    (or `max-w-[720px]`) that overrides the shell's `.page`/`.page-body` content
    column and renders the page not-full-width. **Root cause, not a one-off:** the
    cap rides in with EVERY ported screen, so fixing it per-screen is whack-a-mole
    (it surfaced on the chapter editor, then again on the sibling lesson editor).
    **Remedy is a single machine guard over the whole screen tree**, not a
    per-screen assertion: a lint (`scripts/check-admin-screen-width-caps.mjs`)
    fails when any screen under the admin route dir carries a LARGE inline
    `maxWidth`/`max-w-[…px]` (≥ ~480px = a content-column cap, not a badge/cell),
    wired into `lint:gates`. Small element caps and control `minWidth`s are fine.
    Removing the cap so the page fills the shell column is a **legitimate
    deliberate deviation** from the frozen export; a genuinely intended narrow
    admin column opts out with a `// width-cap-ok: <reason>` line. General rule:
    when a ported-export defect recurs across sibling screens, promote the fix
    from a screen-local regression assertion to **one lint over the entire ported
    screen directory** — catch the whole class at the source, at once.
15. **A native browser primitive is substituted for a designed export component**
    (U8 RED) — the export shows a *designed* control (a custom video player =
    poster + center play + rich status badge; a styled insert-link/insert-image
    dialog; a styled select/confirm), and the build ships the raw browser default:
    a native `<video controls>` grey bar, a `window.prompt()` / `window.confirm()`
    / `alert()` chrome, a bare `<select>`. It "works" and survives a loose glance,
    so it slips — but it is NOT the adopted design (approach-B), it is redraw-by-
    omission. Rule: when the frozen export defines a control's look, adopt THAT
    (poster-then-play, not a default control bar shown by default; an in-app dialog
    component, never `window.prompt`); a native primitive is allowed only where the
    export itself shows the native affordance. The verifier asserts the designed
    markers render (e.g. the poster + `.vplay` + badge are present before any
    `<video>` mounts; no `window.prompt|confirm|alert` on a screen the export gives
    a dialog). The interaction-side twin of the U1–U4 look assertions.
16. **A typed entity renders the one designed variant for ALL its types** (U9 RED)
    — an entity carries a `type`/`kind`/`format` enum with N values (a lesson
    `video|text|pdf`, a block `image|quote|embed`, a field `string|date|select`),
    the SRS defines DISTINCT content/behavior per value, but the frozen prototype
    only drew ONE variant (usually the richest — the video lesson) — and the build
    renders that one layout for every value. So a `text` lesson shows a video
    banner, a `pdf` lesson shows a video banner: nonsensical, and a silent spec
    violation. Rule: an editor/viewer for a typed entity is **type-aware** — it
    branches on the enum and surfaces the SRS-defined content per type (video →
    video asset; text → rich-text body as the primary content; pdf → the PDF
    upload/preview), NOT the single drawn layout defaulted onto all. Where the
    prototype only drew one variant, the others are **designed on top of the frozen
    kit** (type-appropriate, visually consistent) — the gap between "the enum has N
    values" and "the prototype drew 1" is additive faithful work, never a silent
    default. The verifier asserts each enum value renders its correct content
    surface (no video frame on a text/pdf lesson). Read from build-manifest 2.3:
    when a phase's entity has a type enum, its screens must be checked per value.
17. **A ported screen ships REDUCED — the gist, not the whole design** (U10 RED) —
    the export defines a screen with a full toolbar (a filter row of search + N
    selects), a full chrome (a utility top-strip + a multi-column footer), and a
    component that has variants (a nav that is light OR dark) — and the build ships
    a stripped version: the filter loses its selects, the footer collapses to a
    copyright line, the nav renders the WRONG variant (dark where the export is
    light). Each omission "looks close" in isolation, so it slips — but adopt-
    export means porting the WHOLE screen, not a lossy summary. Rules: (a) every
    control the export's toolbar/filter row shows is present and wired (a missing
    select is a dropped feature, not a style nit); (b) shared chrome (top-strip,
    footer) is ported at full fidelity — a multi-column footer is not a copyright
    stub; (c) when a kit component takes a variant flag (`ink`/light-dark,
    size, tone), the screen uses the SAME variant the export picked for THAT screen
    — don't default to one. The glance checks the ported screen against the export
    as a WHOLE (toolbar controls, chrome, variant), not just "the main content is
    there." A size-S phase is not licence to ship a reduced port.
18. **A screen renders but does not INTERACT — state + convention not wired**
    (U11 RED) — a ported/self-designed screen looks right (pixels pass) but its
    interactions are dead: a tabbed page seeded its active tab from `?tab=` into a
    local `useState` **once at mount**, so the sidebar deep-links (`?tab=orders`,
    `?tab=certs`) changed the URL but the mounted component ignored the param
    change → clicking the nav didn't switch the tab (URL said one thing, screen
    showed another). The fidelity gate proves the tab STRIP exists; it does not
    prove clicking it changes the page. Rules: (a) screen state that a URL can
    address is **derived from the URL each render** (`useSearchParams()` /
    route param), not copied into local state once — writes go through
    `router.replace`/`push` so nav item + control + URL + shell active-state stay
    in sync; (b) deep-link + browser back/forward land on the right state; (c) the
    active-nav highlight matches the rendered content; (d) a mutation uses the
    app's **established feedback convention** (the shared `toast` every other save
    uses — not a bespoke inline banner the user reads as "no feedback"). The
    verifier drives the interaction (click the deep-link, press Back, save a form)
    and asserts the observable state changed — a screen whose nav/tab/deep-link
    does not actually switch content is a RED block, even at pixel-perfect look.
19. **A ported screen keeps its PRIMARY region but drops SECONDARY ones** (U12 RED,
    sharpens U10) — U10 blocks a *reduced* toolbar/chrome; U12 blocks the subtler
    miss where the hero table/form is faithfully ported but the screen's secondary
    regions are silently dropped though their DATA exists: a KPI **StatCard row**
    above a list, a **composite card** (recent-orders + coaching-slot), **Pagination**
    (and, worse, ignoring the `page` param so results truncate past page 1), a
    secondary **tab** (a lesson's "Tài nguyên"/resources attachments), per-row
    **metadata** (per-lesson/chapter durations, an updated-date) and an **accordion
    collapse** the export shows. Each reads as "small" alone and recurs across
    screens. Rule: the fidelity check diffs the ENTIRE screen's **region inventory**
    — stat rows, composite cards, pagination (with its param actually paging the
    data), tabs, per-row metadata, secondary CTAs — not just "the hero table/form
    is present." "Primary element present" is not "screen ported." The screen's
    required-element checklist (2.3) enumerates every region the export draws, and
    a dropped secondary region is a RED test exactly like a dropped primary one.
20. **A styled-clickable element is a dead affordance — no handler, no href, no
    effect** (U13 RED) — a screen renders an element that LOOKS actionable (a
    `.btn`/`.btn-link`-styled `<span>`/`<div>`, a `cursor-pointer` table `<tr>`, a
    faux-`<select>` span mimicking a dropdown, a "Xem toàn bộ N →" more-link) but
    carries NO `onClick`/`href`/`onChange`/`role`+handler — clicking does nothing.
    It survives the look glance and even slips U11 (no wired state to desync — the
    interaction was never wired at all). This is the PRIMITIVE twin of U11: U11 =
    wired-but-not-synced, U13 = not-wired-at-all. Rules: (a) any element the design
    draws as actionable is a REAL control (`<button>`/`<a href>`/`<Link>` or a
    `role` + keyboard-focusable handler), never a decorative span; (b) a faux-select
    is a real `<select>`/menu whose `onChange` changes state (generalizes the grid
    page-size case beyond the NFR.UXC.09 floor); (c) a navigable row/card routes on
    click, whole-row target, keyboard-reachable; (d) a placeholder action (`mailto:`,
    `href="#"`, `javascript:void`, empty `onClick`) is a DROPPED feature. Machine
    tooth is DUAL: a lint (`scripts/check-dead-affordance.mjs` — PLANNED, not yet shipped; see Enforcement Status) will fail
    any button/link/select/cursor-pointer-styled element with no
    `onClick|href|onChange|role`+handler (opt out `// static-ok: <reason>`); a
    Playwright drive clicks every actionable-looking element and asserts an
    observable effect (URL change, DOM mutation, opened menu, network request) — a
    click with zero effect is RED even at pixel-perfect look.
21. **A layout grid can't reflow to 1-col on mobile — inline grid-template beats
    @media** (U14 RED, sibling of U7) — a multi-track grid set via inline React
    `style={{ gridTemplateColumns: '1fr 320px' }}` always beats a stylesheet
    `@media (max-width:768px)` rule (inline specificity), so it NEVER collapses to
    one column on a phone → horizontal page scroll at 375px. Twins: (a) a class grid
    (`.grid4`/`.stat-card` row) declares its tracks but ships NO `≤768px` 1-col
    rule; (b) a hero leaves `img`/`iframe` uncapped (no `max-width:100%`, no
    `overflow-x` guard). Root cause, recurs across admin/builder/landing that the
    student-facing responsive floor (block 11) never scopes. **One machine guard
    over the whole tree** (like U7): a lint (`scripts/check-inline-grid-reflow.mjs`
    — PLANNED, not yet shipped) is specified to FAIL when (1) a `.tsx` sets a MULTI-TRACK
    `gridTemplateColumns`/fixed multi-column width via inline `style=` (move to a
    class), (2) a class layout grid (2+ tracks) has no `@media (max-width:768px)`
    1-col rule, (3) a hero/media element lacks `max-width:100%` under an
    `overflow-x`-guarded container. Runtime twin: the universal fixture asserts
    `document.scrollWidth ≤ clientWidth` + each grid computes a single column at
    375px on EVERY route (admin/builder/landing incl.), not only student-facing.
    Opt out `// grid-reflow-ok: <reason>`.
22. **A name-keyed asset renders SILENTLY when its key is absent, or one hardcoded
    key serves every type** (U15 RED, registry-completeness twin of U9) — a
    component looks up a visual by string name (`<Icon n="send"/>` → `ICON_PATHS`,
    `<GuideIllustration archetype=…>`). Two silent failures: (a) **absent key** —
    `n="send|refresh|copy"` has no registry entry, lookup returns `undefined`, the
    component renders nothing / a fallback glyph (passes compile + loose glance); (b)
    **one key for all types** — a `.map()` over N typed rows passes a constant
    literal (`'zap'`) or shared archetype, so N types wear one icon. Rules: (a)
    registry completeness is a static lint (`scripts/check-icon-registry-coverage.mjs`
    — PLANNED, not yet shipped): collect every literal passed as `n=`/`icon=`/`archetype=`, diff
    against the registry's keys, FAIL on any absent key; the component throws/RED in
    dev on a missing key, never renders empty/silent-fallback (opt out
    `// icon-fallback-ok: <reason>`); (b) an icon in a `.map()` over typed data is
    keyed off the row's own `type`/`id`/`slug`, not a constant — a per-type map with
    an entry per enum value. Verifier asserts (i) coverage lint green and (ii) a
    mapped list renders ≥2 DISTINCT icon paths. U9 branches CONTENT per type; U15
    guarantees the per-type ICON + no silent no-render.
23. **A status/enum is not mapped exhaustively, or list and detail diverge** (U16
    RED, sibling of U9) — an entity carries an enum with N values
    (`paid|pending|shipped|cancelled|refunded|failed`) but the render is a
    hand-rolled `if/else` branching only 2-3, so the rest fall to a wrong catch-all
    `else` (3 of 6 statuses show as 'pending'); OR the LIST uses a shared
    `StatusBadge`+map while the DETAIL hand-rolls its own → the two disagree on the
    same status; OR a status-derived count binds to the wrong aggregate ('đang mở'
    wired to `tabCounts.all`). Rule: (a) status→{label,color,icon} lives in ONE
    shared map BOTH list and detail import; (b) the map is EXHAUSTIVE (every DB/SRS
    value has an entry; an unknown value renders a visible fallback, never collapses
    onto a real status); (c) a status-derived label/count binds to the aggregate it
    names. The verifier reads the enum from the ERD/`status-flow-<entity>.md`, drives
    EACH value, asserts its own distinct label+color on BOTH list and detail, and
    greps that no branch uses a catch-all `else` mapping unhandled values onto a
    named status. U9 = type→content; U16 = status→badge exhaustiveness + list↔detail
    single-source. (Pairs with Leg-13(c): terminal status must appear in filters.)
24. **Copy drifts from the frozen prototype — separators re-typed, strings not
    byte-exact** (U17 RED) — the export's real code carries specific glyphs (`·` `—`
    `–`) in a badge/subtitle/message entry; a re-draw or hand-retyped i18n message
    substitutes ASCII `-`/` - `/`,` so the string reads close but is NOT the frozen
    copy (207 such drifts across the elearning catalog + JSX; the courses hero badge
    shipped a hyphen where prototype A1 uses an em-dash; the invoice used `,` where
    the prototype uses `·`). Pixels + element-presence pass, so it slips — but
    adopt-export means the STRING is verbatim. One machine guard over the whole
    ported string surface (like the U7 lint): `scripts/check-prototype-copy-verbatim.mjs`
    (PLANNED, not yet shipped) builds the frozen copy corpus from the export JSX + catalog, then
    fails when any ported public/catalog string is not byte-exact in that corpus —
    esp. an ASCII `-`/`,`-separator where the corpus uses `·`/`—`/`–`. Opt out
    `// copy-ok: <reason>`. Carve-out: brand/company/SEO/`© <year>` identity literals
    are a DIFFERENT class (they flip via `config-driven-identity.md`); this is glyph
    fidelity of frozen marketing copy, not identity de-hardcoding. (Runtime
    seeded-catalog twin is Leg-10(c).)
25. **A shared primitive is clobbered at its ONE source and ships wrong on every
    screen** (U18 RED) — a reused primitive (PageHead/tabs, the Select, StatCard,
    Button) is mis-styled in its single definition, so the defect propagates
    everywhere it mounts. Three mechanisms: (a) an inline `style` uses a CSS
    **shorthand** (`font`, `background`, `border`, `margin`, `flex`, `transition`)
    which resets ALL longhands and clobbers a class the design system owns
    (`font:'inherit'` on a tab reset `font-weight` and killed
    `.tab.active{font-weight:600}` on every Zone-E screen); (b) a shared control
    hardcodes its own layout dimension inline (`width:'100%'`) so it fills/breaks
    the row it's dropped into (the filter Select's inline `width:'100%'` made every
    filter/pagination control eat a full row); (c) content in the WRONG slot (a
    StatCard icon rendered into `.stat-label` not the `.stat-ico` badge). Rules: an
    inline `style` on a shared primitive uses LONGHANDS only (`fontWeight`, never
    `font`); a shared control never hardcodes its own layout width/height (sizing is
    the container's job); every slot holds its designed content. Machine tooth = a
    primitive-level assertion run ONCE per primitive (states/storybook or one
    representative screen): active tab computes `font-weight:600`; the filter
    toolbar's N controls share ONE row (equal `offsetTop`); the StatCard icon
    resolves in `.stat-ico`. Plus a lint over `src/components/**`
    (`scripts/check-primitive-inline-style.mjs` — PLANNED, not yet shipped) failing an inline
    `style` with a CSS-shorthand key OR a hardcoded layout `width`/`height` (opt out
    `// primitive-style-ok: <reason>`). Per U7: a defect that rides in with a SHARED
    component is fixed at the component and asserted against it once, never per screen.
26. **A toast breaks the app's notification convention** (U19 RED) — error toasts
    ship `duration:Infinity` so they never auto-dismiss and pile up (recurred 3+
    times), or a raw server `err.message`/response body is leaked verbatim into a
    toast (internal detail + untranslated), or a mutate uses a bespoke inline banner
    where the app's convention is a `toast` (read as "no feedback"). Rule: error
    toasts auto-dismiss on the app's standard timeout (~8000ms), never
    `duration:Infinity`; a user-facing toast shows a mapped/localized message, never
    a raw server string; a mutate uses the app's shared `toast` (not a bespoke
    banner). Lint (`scripts/check-toast-convention.mjs` — PLANNED, not yet shipped): RED on
    `duration:Infinity` on a `toast.error`, on a raw `err.message`/response body
    passed to a toast, requires the standard auto-dismiss (opt out
    `// toast-ok: <reason>`). (Pairs with U11's reuse-the-app-feedback-convention.)

## Regression Ledger — a fixed UI defect NEVER comes back

Every UI defect the human review surfaces — however small (a clipped modal, a
mis-sized tap target, a modal that won't dismiss, a dropped element) — becomes a
**permanent machine assertion** the moment it is fixed, added to the touched
screen's fidelity spec. It runs on **every** subsequent phase, so the same defect
cannot silently reappear on that screen OR on a related/later one. A recurring or
inherently cross-cutting class is **promoted to a universal always-on assertion**
(the U-series above were born exactly this way: OTP-backspace → U2, wrong-dark →
U3, shell-scroll → U4). Operating rule: **noted-and-fixed ⇒ locked-by-assertion**;
a fix without a regression assertion is an incomplete fix and blocks the phase.
This is the machine memory that keeps "small" bugs from returning as the harness
runs on — it does not rely on anyone remembering them.

## Sign-Off

```text
Visual Fidelity — running app is the frozen prototype
Screens in scope:                   <N>
Screens with green fidelity assertions:  <N>   (must equal in-scope count)
Screens with recorded human glance:      <N>   (must equal in-scope count)
Rebuilt screens (with ADR slug):    <list of slugs, or none>
Evidence dir:                       plans/reports/<...>
Confirmed by (QC/QA + operator):    <name>   on  YYYY-MM-DD
```

> The machine tooth (assertions) runs every phase in the acceptance leg (2.6),
> is a floor rule at 2.7, and is re-confirmed with screenshot evidence at 2.10.
> The human tooth (glance) is the default cadence for UI phases
> (`docs/gates/phase-acceptance.md`). Never mark a screen `pass` on a
> self-certified "matches export" — the assertions must be green and the glance
> recorded.
