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

A dropped element or a wrong interaction = a **RED test = block**. The assertions
live in the screen's fidelity spec and run in `validate:quick` / the phase e2e
smoke, so they gate every commit, not just the final QA pass.

## Tooth B — human side-by-side glance (before the phase closes)

The gate **surfaces** the built screenshot next to the prototype image the
operator already has (the acceptance leg captures the running screen via
Playwright and stores it under `plans/reports/`). The human approves the pair
**before** the phase is marked done — aesthetics only (the assertions already
proved structure + behaviour). A phase whose fidelity assertions are green but
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
