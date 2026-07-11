# Gate — Visual Fidelity (built screen vs frozen prototype)

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
