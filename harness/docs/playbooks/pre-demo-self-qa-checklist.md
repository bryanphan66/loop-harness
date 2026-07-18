# Pre-Demo Self-QA Checklist

**Lifecycle:** verified · **First use:** elearning retrospective enrichment (2026-07) · **Verified by:** 182 mined human-caught defects across the P0–P16 build

> The agent runs this **against the running preview, BEFORE any human handoff /
> demo / UAT** — it converts the eyeball-QA a human otherwise does (clicking every
> control, submitting every form, checking every image) into an **agent self-check**.
> It is the runnable companion to the machine gates: `docs/gates/phase-acceptance.md`
> (Legs 9–14 + Leg-5 clause U-img) and `docs/gates/visual-fidelity.md` (U13–U19).
> Every item has an explicit pass/fail predicate — a FAIL is fixed before a human
> ever sees the build. Applies at 2.10 (pre-ACCEPTANCE) and before any demo record.

**Macro-stage / step:** Build & Go-live · 2.10 (and pre-2.12). **Gate it serves:**
the DoD QA-evidence leg — this checklist's green run IS the agent-side evidence.

## Engine

- **Fast path:** `ck-web-testing` / Playwright to drive the preview; the
  `lint:gates` scripts for the static half; `psql` for the seed invariants.
- **Role:** QC/QA. **Bare-agent fallback:** Playwright + `curl` + `psql` directly.

## How to run

Drive the running preview (not a static read). Each `FAIL` is a blocker: fix +
lock a regression assertion (Regression Ledger) before handoff. Record the run
under `plans/reports/`.

### A. Navigation & interaction (drive it, don't read it)
- [ ] **A1 Dead-affordance sweep (U13):** click EVERY clickable-looking element per screen — link/button-styled spans, `cursor-pointer` rows, faux-selects, "see all N →" more-links, nav items — assert an observable change (URL / DOM mutation / opened menu / network request). FAIL = any click with zero effect, or a bare `mailto:`/`#`/`javascript:void` placeholder.
- [ ] **A2 Tab/deep-link reactivity (U11):** click each sidebar deep-link (`?tab=…`), press Back/Forward — the content + active-nav highlight switched. FAIL = URL changed but content didn't.
- [ ] **A3 Create/edit round-trip (Leg-12):** open every create/edit dialog, submit fully-filled, reload — the record shows your exact values. FAIL = 422 on submit, or a "save" that leaves the row unchanged.
- [ ] **A4 Required-field gating (Leg-12):** clear each required field one at a time — submit is DISABLED client-side (not a 422 toast). FAIL = submit enabled with a DTO-required field empty.
- [ ] **A5 Shared-primitive integrity (U18):** on one screen mounting each shared primitive — active tab computes `font-weight:600`, filter-row controls share ONE row (equal `offsetTop`), StatCard icon resolves in `.stat-ico`. FAIL = a clobbered/mis-slotted primitive.

### B. Links & routing
- [ ] **B1 Link crawl (Leg-9a):** BFS-click every nav/tab/CTA/share/deep-link from app root — each navigates to a rendered page. FAIL = any 404/blank, a `:slug`/`:code` deep-link with no index route, a share button emitting a guessed path, a marketing CTA to a 404.
- [ ] **B2 Orphan scan (Leg-9b):** every built user-facing route is in the reachable set OR marked `internal-only`/`programmatic-entry`. FAIL = an unmarked route with zero inbound links.
- [ ] **B3 Nav lands on first tab (Leg-9c):** each zone/section nav entry resolves to that zone's first tab in spec order. FAIL = lands on an arbitrary sub-route.

### C. Grids, empty-states & lifecycle
- [ ] **C1 Grid floor (Leg-8):** each record grid has wired pagination + ≥1 filter/search + column sort; a fetch-all grid sizes its fetch ≤ endpoint `pageSize.max`. FAIL = decorative/missing control or the page's own request 422s.
- [ ] **C2 Status exhaustiveness (U16):** for every status/type enum, drive EACH value on BOTH list and detail — badge label+color match across the two and are distinct per value. FAIL = two values collapse to one badge, or a value falls to a generic/'pending' fallback.
- [ ] **C3 Lifecycle (Leg-13):** re-open the create surface twice → ONE open row + same QR/token; force one open row past TTL → status flips to `expired` and shows in list filter + badge; a fresh row can then mint. FAIL = duplicate-on-remount, no expiry path, or terminal status absent from filters.
- [ ] **C4 Empty/error states present (Leg-5):** each list/detail renders its loading, empty, and error state (not just the happy path).

### D. Config-reflection & seed fidelity
- [ ] **D1 Catalog count-exact (Leg-10c):** each public catalog/marketing page returns the frozen prototype's EXACT item set (real slugs, no demo/lorem); hero/badge copy byte-identical to the export (`toHaveText(FROZEN_STRING)`).
- [ ] **D2 Cross-entity invariants (Leg-10a):** run each seed invariant SQL — enrolled-with-no-paid-order = 0, order-line-with-no-product = 0, published-course-with-no-lessons = 0. FAIL = any non-zero.
- [ ] **D3 Singleton upsert (Leg-10b):** hand-dirty a singleton content row (about/hero), re-run the seeder, assert it overwrites back to the frozen content. FAIL = a stale `Nháp`/dirty row survives.
- [ ] **D4 Config drives identity (config-driven-identity):** flip a brand/company value in Settings → cert/invoice/email/json-ld/copyright reflect it. FAIL = a surface still shows the old literal.

### E. Conventions (static + i18n)
- [ ] **E1 Copy verbatim (U17):** `check-prototype-copy-verbatim.mjs` green — every ported public/catalog string byte-matches the corpus, no ASCII `-`/`,` where the export uses `·`/`—`/`–`.
- [ ] **E2 i18n catalog (Leg-14):** every message ICU-compiles (0 `{{…}}` braces), 0 dead keys, no `vi` value identical to its `en` value (outside brand whitelist).
- [ ] **E3 Export localized (Leg-14d):** download every CSV/XLSX/PDF — cells show the localized label + active-locale date the table shows, not raw codes (STU/GV/ADM) or ISO dates.
- [ ] **E4 Toast convention (U19):** no `duration:Infinity` on `toast.error`, no raw server `err.message` in a toast, mutates use the shared `toast` not a bespoke banner.
- [ ] **E5 Gate lints green:** `lint:gates` passes — dead-affordance, inline-grid-reflow, icon-registry, copy-verbatim, primitive-inline-style, toast-convention all 0 unexplained hits.
- [ ] **E6 Build & migration hygiene (Leg-11):** `pnpm build` (next build) exits 0; `prisma migrate status` up-to-date against the preview's OWN DB; every `enqueue({jobId})` matches `^[A-Za-z0-9_-]+$`; worktree base contains prior phases' code.

### F. Media-real (real browser, not curl)
- [ ] **F1 Image decode (U-img):** on every screen `[...document.images].filter(i=>!i.complete||i.naturalWidth===0)` is empty. FAIL = a 404-after-redeploy, CORP-blocked, or dead-src image a curl 200 hid.
- [ ] **F2 No upscale (U-img):** each image `naturalWidth >= renderedWidth * devicePixelRatio` (≥1 real rung).
- [ ] **F3 Image src hygiene (U-img):** grep JSX+seed — no external-host `<img src>` (hotlink), every remote/user-src `<img>` has an `onError` fallback, every mutable cover/avatar URL is `?v=<updated_at>` cache-busted, uploaded assets persist on R2/volume not ephemeral fs.
- [ ] **F4 Playback proxy (v6.17):** video/HLS serves via the entitlement-gated HTTP proxy, never a raw `file://`/signed URL; no forced upscale.
- [ ] **F5 Icon registry (U15):** each catalog/category-strip/section renders DISTINCT icons keyed off row type; 0 unresolved registry keys, no blank where an icon should be.

### G. Responsive (375px, EVERY route)
- [ ] **G1 No sideways scroll (U14):** at 375px on every route incl. admin/builder/landing, `document.documentElement.scrollWidth <= window.innerWidth` AND every multi-column layout grid computed a single column. FAIL = any route scrolls sideways or keeps 2+ columns.

## Residual — what this checklist does NOT catch (stays human-glance)

Two mined classes remain human-only judgement (not cleanly lint-able) and stay in
the Leg-2 human checkpoint + Regression Ledger: (a) per-screen overlay/scroll edge
cases (a `::after` gradient swallowing a click, an inert scroll container, a
canvas-clip); (b) per-surface empty/error specifics (a video watchdog timeout, an
`<object>` PDF inner fallback, a coming-soon admin-preview escape hatch). Any
instance surfaced by the human is promoted to a locked regression assertion.
