# design-rules.md — Tier 1: Patterns, Floorplans & Behavior

> **Version: 1.0.0** · Source: SAP Design System (Fiori for Web + Digital Design System) · Pinned: 2026-06-03

> Structure & behavior rule book for enterprise/ERP apps, distilled from the **SAP Design
> System** (SAP Fiori for Web floorplans + SAP Digital Design System patterns). This file
> holds NO colors/fonts — those live in `DESIGN.md`. Implement with **shadcn/ui**.
>
> **How to read this file:** Don't load it whole. From a task, jump to the relevant section
> via the table of contents. Every screen MUST match exactly one floorplan in §4 **or be
> declared a custom screen per §4.7**.
>
> Source portal: https://www.sap.com/design-system  (see §12 for deep links)

## Table of contents
0. Principles · 0.1 Precedence & conflicts · 1. Information architecture & shell · 2. Page layouts
(incl. 2.x named breakpoints + cozy/compact density) · 3. Choosing a floorplan
· 4. Floorplans (List Report, Object Page, Worklist, Overview, Analytical List, Wizard) ·
4.7 Custom screens (escape hatch)
· 5. Tables (incl. 5.x bulk-edit dialog + inline-edit grid mode) · 6. Forms & validation
(incl. 6.x file upload) · 7. Actions & buttons · 8. Modal / Dialog / Overlay
(incl. 8.x confirm / destructive-delete dialog) · 9. Navigation · 10. Messages, feedback & states
(incl. 10.x toast timing / position / max-stack) · 11. Accessibility baseline
· 12. Behavior summary + checklist + sources

---

## 0. Principles (the "why")

SAP Fiori rests on five principles — use them to break ties: **role-based** (built around the
user's real role & tasks), **adaptive/responsive** (one app, desktop→phone), **simple** (focus
on what matters, allow personalization), **coherent** (same mental model & interaction language
across every screen — learn module A, feel at home in module B), **delightful**.

Practical consequence: **prefer consistency over local cleverness.** A shared filter bar,
familiar table behavior, and fixed action positions are how the system scales across modules.

Tier 1 fuses three industry sub-layers — interpretive **Patterns**, prescriptive **Floorplans**,
and **Behavior** rules; floorplans are prescriptive (a screen must match one or declare custom,
§4.7) while patterns stay interpretive (adapt to context).

---

## 0.1 Precedence & conflicts

- **Tier 1 (this file) + Tier 2** (the per-project `docs/design-guidelines.md` + `docs/design/`)
  are **authoritative**. Components (Tier 3) **conform** — a component never overrides a rule here.
- When a **Tier-1 rule conflicts with an explicit user request**, **ASK** — emit a clarification
  and do not silently apply either side. Do not quietly follow the rule, and do not quietly follow
  the request. Surface the conflict (rule text + the request) so a human decides.

---

## 1. Information architecture & shell

- The base unit is a **page** that fills the viewport: **header + content + optional footer
  toolbar** → the **Dynamic Page** (§2).
- A persistent **shell** sits on top of every app: logo/tenant, navigation, **global/enterprise
  search**, **notifications** (message center), personalization, user menu.
- Classify each screen first: **transactional** (create/edit/approve), **fact sheet**
  (read-only detail), **analytical** (KPI/analysis). The type drives the floorplan (§3).

shadcn: shell = sidebar block + top bar (search + notifications + user menu).

---

## 2. Page layouts

### Dynamic Page (the frame every floorplan sits in)
- **Header title** (always visible): title (required) + global actions.
- **Header content** (snapping): collapses on scroll. Auto-collapses with a responsive table;
  manual collapse with grid/analytical/tree tables.
- **Content area.**
- **Footer toolbar** (optional, sticky bottom): **message indicator (left)** · **draft
  indicator (right, just before actions)** · **finalizing actions**.

Never nest a whole floorplan inside another Dynamic Page's content area.

### Full screen vs Flexible Column Layout (FCL)
- **Full screen** — one page at a time. Use for single flows, large forms, wizards.
- **FCL (1/2/3 columns)** — master-detail / master-detail-detail with fast drill-down without
  losing context. Col 1 = list report, col 2 = object page, col 3 = sub-detail. Layout actions
  (Close, Full Screen/Exit) always sit last in the header toolbar and never go to overflow.
- **Do NOT use FCL for:** supplementary side content (use dynamic side content instead),
  context-independent dashboards, opening multiple instances of one object type, or embedding
  the launchpad/overview page.

shadcn: `Resizable` panels. Responsive: desktop 2–3 cols; tablet 2; mobile collapses to 1 col,
open detail = push a new route or `Sheet` + Back.

### 2.1 Named breakpoints + density
**When:** every responsive layout decision — so "mobile/tablet/desktop" means the same px app-wide
and tables/forms don't each invent their own cutoffs.
**Named breakpoints (use these names, map to the framework's defaults):**
- **mobile** — `< 640px` (1 col; responsive table only; side nav → drawer/`Sheet`).
- **tablet** — `640–1024px` (FCL up to 2 cols; grid/analytical tables allowed).
- **desktop** — `1024–1280px` (FCL up to 3 cols; full toolbars).
- **wide** — `≥ 1280px` (max content width capped; extra space → margins, not stretched fields).
(Aligns with Tailwind `sm`/`md`/`lg`/`xl`; pin the names so every component references the same set.)
**Density (cozy vs compact):**
- **cozy** — the **default**; comfortable row height + spacing; the right choice for most screens
  and all touch contexts.
- **compact** — opt-in for **dense data grids** (grid/analytical tables, power-user worklists)
  where more rows per viewport beats breathing room. Compact is **desktop/tablet only** — never
  drop below the 44×44px touch target (§11) on mobile.
Pick density **per surface** and expose it as a user toggle on heavy grids; do not mix densities
within one table.
shadcn: Tailwind breakpoint tokens (`sm`/`md`/`lg`/`xl`) named to mobile/tablet/desktop/wide; a
density prop/class on the table (cozy = default padding, compact = reduced row height).

---

## 3. Choosing a floorplan

| Need | Floorplan |
|---|---|
| Overview of information & tasks | **Overview Page** (cards) |
| List + **find & act** on a large set (filter/sort/search) | **List Report** |
| List + **process items one by one** (work queue), light filtering | **Worklist** |
| KPI + chart + list, see filter impact on chart, switch chart/table | **Analytical List Page** |
| View / edit / create **one** object | **Object Page** |
| Long or unfamiliar task, split into steps | **Wizard** |

Most common pairing: **List Report + Object Page (LROP)**.

---

## 4. Floorplans (each screen = exactly one)

### 4.1 List Report — "find & act"
**Structure:** app title → **filter bar (MANDATORY:** filter criteria + saved **variants** like
All/Open/Assigned + Go/Reset; header snaps on scroll**)** → table toolbar (left: title/result
count/selected count; right: Export, column Settings, Sort, Personalize) → table (multiselect,
sticky header, pagination) → footer toolbar (finalizing actions in edit).
**Behavior:** row actions are either **in-place** (Approve/Reject, stay on page) or
**navigating** (open the object page). Cross-references to other entities open in a popover
(quick view + link). **Do** offer Export to spreadsheet. **Don't** ship a List Report without a
filter bar.
shadcn: TanStack Table + Input/Select/DatePicker (filters) + DropdownMenu (row actions) + Checkbox.

### 4.2 Object Page — view / edit / create one object
**Structure:** dynamic page header — breadcrumb (optional, limited to drill-down levels) → title
→ subtitle (below the title) → image via avatar control → optional KPIs as key-value facets.
Global actions (Edit, Delete, Copy, Share) live in the **header toolbar**. Content uses
**anchor navigation or Tabs**, organized as **sections → subsections** (sections only hold
subsections; subsections hold the actual controls, support progressive disclosure via a
**Show All** button, and may carry their own toolbar at the right of the subsection header).
**Footer toolbar (finalizing):** edit/create → Save, Post, Accept, Reject, Activate; display →
Approve, Accept, Reject.
**Behavior:** layout stays identical across display/edit/create — controls must NOT move when
switching modes. On load in edit mode, set initial focus to the first empty required field
(else the first editable element/action).
shadcn: layout + Tabs/anchor nav + Card per subsection + sticky footer; Form (§6) inside.

### 4.3 Worklist — process a work queue
Like List Report but the focus is **processing items, not finding them** → drop the heavy filter
bar. Use when users have many work items and need a direct entry point to act (Approve/Reject).
Prefer a responsive table; footer carries messaging + finalizing actions; group by a property if useful.

### 4.4 Overview Page — card dashboard
Data-driven page of **cards** summarizing a scenario on one plane; supports a filter; each card
is a jump-off point that drills down to a List Report/detail app. Don't cram a large table here.
shadcn: Card grid + recharts mini charts; click card → navigate.

### 4.5 Analytical List Page (ALP) — chart + table hybrid
KPI + visualization + list on one page; show the **filter's impact directly on the chart**;
**switch/hybrid** chart↔table; predefined views. Use when users extract insight, find root cause,
or need to see impact on a KPI.
shadcn: one shared filter bar driving recharts (top) + data-table (bottom); toggle chart/table/both.

### 4.6 Wizard — multi-step task
**Structure:** a walkthrough screen (form sections revealed in sequence as each completes) + a
read-only **summary page** for review and final submit. Use full screen OR a modal dialog
(full-screen variant can also live in FCL, where the wizard always occupies the rightmost column —
no navigation onward from it).
**Behavior:** two navigation patterns — **anchor bar** (horizontal step links at top, click to
jump) or **tab bar**. The **Next Step** button appears only on the walkthrough, below the content,
after the required fields of the current step are filled. Validate per step before Next; allow Back.
shadcn: Stepper + Button; summary as read-only review.

### 4.7 Custom screens (escape hatch)
A screen that genuinely fits **no** §4 floorplan may be declared **CUSTOM** — but only with a
one-line rationale recorded in `docs/decisions/<slug>.md` (stable slug, no plan-artifact refs).
A custom screen is **not** exempt from the cross-cutting rules: it still obeys the shell (§1),
action placement (§7), required states — loading / empty / error (§10), and the accessibility
baseline (§11). Custom is an escape from *floorplan shape*, not from *system behavior*.
**Recurring non-floorplan screens** (declare these as CUSTOM by default):
- auth / login / forgot-password
- settings / preferences
- global search results
- onboarding / first-run
- notifications center
- full-page **403 / 404 / 500 / maintenance**
- billing / pricing

> Floorplan classification is still **mandatory** for any screen with a data grid OR a
> create/edit form (see the Tier-2 gate). CUSTOM is for screens that have neither a grid nor a
> form *and* fit no floorplan — not a way to skip classification on a grid/form screen.

---

## 5. Tables

**When to use:** display structured, comparable rows of data; let users scan, sort, filter, select, act.
**Structure & types:**
- **Responsive table** — works on all devices incl. **mobile**; the default choice.
- **Grid / analytical / tree table** — **desktop + tablet only**, NOT mobile. Use for many
  columns / large volumes / hierarchical data. When such a table leads to an object page,
  navigate at row level (no "Show Detail" button).
**Behavior & interactions:**
- **Pagination** for extensive data (paginated tables usually avoid scrolling).
- **Long table with scrollbar** when rows exceed the viewport/container height (keep header sticky).
- Multiselect → reveal a **bulk action bar**. Row-level actions are in-place or navigating.
- Allow column show/hide, resize, sort, and Export to spreadsheet on the table toolbar.
- Empty-but-required table → use a "no data" text that states the required action
  ("Create at least one item").
**Accessibility:** proper `<table>` semantics, header cells, row/column headers announced;
full keyboard navigation; visible focus.
**Do:** when a table is used to **compare** items, use a **maximum of four** items; use pagination
for large data; keep the header visible while scrolling.
**Don't:** compare **more than five** items in a table — switch to a Filter & Sort tool instead;
don't rely on horizontal scrolling to hide too many columns (let users hide/reorder instead).
shadcn: TanStack Table (responsive vs dense density); virtualize for very large row counts.

### 5.1 Bulk-edit dialog + inline-edit grid mode
Resolves the drift "**some grids edit inline, some open a page**" — pick by the decision rule below,
once per table, and keep it consistent across the app.
**When:** users need to change one or many rows of an existing grid without losing the list context.
**Decision rule (the consistency lever):**
- **Inline-edit grid mode** — for **light, in-row** edits (a status, a quantity, a date) on a
  handful of fields. The grid flips a row (or the whole table) into an editable state; Save/Cancel
  sit in the table toolbar or footer (§7), not per cell.
- **Bulk-edit dialog** — for applying the **same change to many selected rows** (multiselect →
  bulk action bar → "Edit"). The dialog edits only the **shared** fields; each field carries a
  "leave unchanged" option so unselected fields are not overwritten.
- **Open a page (Object Page §4.2)** — for **deep / multi-section** edits of a single row, or any
  edit touching fields not present in the grid. Row click navigates; the grid does not flip inline.
**Structure (inline mode):** editable cells use the same control the Object Page would (input /
select / date); invalid cells show inline error (§6) + a "contains errors" row state (§10).
**Structure (bulk-edit dialog):** one row of shared editable fields + per-field "keep current";
confirm shows the count ("Apply to 12 items"); destructive bulk ops route through §8.x.
**Behavior:** never mix — a grid is **either** inline-editable **or** navigates to a page for edit,
not both for the same edit intent. Bulk-edit is additive (it coexists with either).
shadcn: TanStack Table editable cells (inline) · `Dialog` with per-field "unchanged" `Select`
(bulk) · row click → Object Page route (deep edit).

---

## 6. Forms & validation

**When to use:** create/edit structured data, in Object Page subsections, Dialogs, or Wizards.
**Structure:** label left of field (wide desktop) or above field (narrow columns); group related
fields into sections/subsections with headings; two-column form layout for density. Field width
should fit the data type — don't stretch everything full-width. Mark required fields with `*`.
**Behavior & interactions:** validate **inline** next to/under the field; aggregate a summary in a
**message strip** at top/bottom when needed; show validation on blur/submit, not on every keystroke.
`Save` is a finalizing action in the footer (§7), not scattered inside the form.
**Accessibility:** every input has an associated `<label>`; errors announced via `aria-describedby`;
required state conveyed beyond color; keyboard reachable in logical order.
**Do:** keep the same field layout in display and edit modes (don't move fields).
**Don't:** validate aggressively while typing; don't use color alone to mark errors.
shadcn: `Form` + react-hook-form + zod; `FormField`/`FormLabel`/`FormControl`/`FormMessage`;
`Alert` for the summary strip.

### 6.1 File upload
**When:** a form (or a standalone region) needs the user to attach one or many files — avatar,
import sheet, document, evidence. Use the same pattern everywhere uploads appear.
**Structure:** a **drop zone** (drag-and-drop target) that is **also a button** opening the native
file picker — never picker-only (drag is expected) and never drop-only (keyboard/AT users need the
button). Show accepted types + max size in the drop-zone label. Selected files render as a list:
name · size · per-file **progress bar** · remove (×) · per-file error.
**Behavior:**
- **Validation** runs **before/at** upload, client-side: file **type** (extension + MIME),
  **size** cap, and **count** cap for multi-file. Reject invalid files with an inline per-file
  error; do not silently drop them.
- **Progress** per file while transferring; on failure show **Retry** on that file, not a full
  re-pick. Allow **cancel** of an in-flight upload.
- **Multi-file:** accept a set; show aggregate state ("3 of 5 uploaded"); one failed file does not
  abort the others.
- Disable the form's finalizing Save (§7) until required uploads finish (or fail explicitly).
**Accessibility:** the drop zone is a real `<button>`/labelled input — keyboard-focusable, Enter/
Space opens the picker; announce progress via `aria-live`; never rely on drag alone.
shadcn: file input + `Progress` per file + list rows; `react-dropzone` for the drag layer;
inline `FormMessage` for per-file validation errors.

---

## 7. Actions & buttons (placement rules)

**Rules (hard):**
- **Global actions** (affect the whole page) → **footer toolbar**. Exception: the **object page**
  puts its global actions in the **object-page header toolbar**. Both stay visible while scrolling.
- **Local actions** (affect part of a page / one control) → as close as possible to the content
  (the control's own toolbar, e.g. the table or chart toolbar).
- **Order:** most important action on the **left**; actions overflow **right → left**.
- **Text vs icon:** use one, not both. Icons only for generic actions (e.g. Share); text buttons
  for all business actions.
- **Emphasis:** in a toolbar, the leftmost button may be emphasized or positive/negative; only
  **one emphasized** button at a time; defaults are Save / Accept / Reject.
- **Footer composition:** message indicator (left) · draft indicator (right, before actions) ·
  finalizing actions.
- **Enable/disable/hide:** hide finalizing actions while in edit/partial-edit; hide actions the
  user has no authorization for; or keep enabled and, on click, show a message on how to enable.
shadcn: Button variants — `default` (emphasized), `secondary`, `ghost`, `destructive`; one
`default` per region; footer = `flex justify-end` with a left cluster for message/draft indicators.

---

## 8. Modal / Dialog / Overlay

**When to use:** present extra info, a form, or an interaction **in the current context** without
navigating to a new page. Keep modal content focused and short; large/complex flows → a full page
or wizard.
**Types:**
- **Modal** — focused dialog over dimmed content.
- **Lightbox** — a modal specifically for assets (PDF/image/video); background dimmed, no
  interaction with page behind until closed.
- **Overlay** — the semi-transparent layer that backs a modal/lightbox and blocks interaction.
**Behavior & interactions:** appears from a user action (e.g. button click). Closes via the close
button or **Esc**. **[House] Modals should NOT close on outside click** by default — require an
explicit close/action — so users don't accidentally lose progress (more predictable + better
a11y). Outside-click-to-close only if explicitly configured. If the background content is needed
for reference (e.g. comparison), consider showing the modal without an overlay.
**Accessibility:** trap focus inside the modal while open; return focus to the trigger on close;
`role="dialog"` + labelled title; Esc closes; don't trap keyboard users.
**Do:** use a modal for short, in-context tasks; provide an explicit close.
**Don't:** dismiss on outside click for forms with unsaved input; don't stack multiple modals.
shadcn: `Dialog` (modal), `Sheet` (side panel for longer forms); set
`onInteractOutside`/`onEscapeKeyDown` deliberately for forms with unsaved data.

### 8.1 Confirm / destructive-delete dialog
**When:** any **irreversible or destructive** action — delete, archive, deactivate, bulk-delete,
cancel-with-data-loss. Reversible actions do **not** get a confirm dialog (use an undo toast §10.x
instead); reserve the interrupt for real risk.
**Structure:** a focused modal with a clear **title that names the object** ("Delete invoice
INV-1042?"), a one-line consequence ("This permanently removes 3 line items. This can't be
undone."), then two buttons.
**Button order & emphasis:** the **cancel / safe** action is the default-focused, low-emphasis
button; the **destructive** action uses the `destructive` variant and is **not** the initially
focused button (so Enter doesn't destroy). Right-aligned cluster, overflow right→left per §7;
the destructive verb is explicit ("Delete", not "OK").
**Type-to-confirm (high-risk only):** for **high-blast-radius** deletes (a whole project, a tenant,
a bulk-delete over many rows, anything unrecoverable), require the user to **type the object name
or "DELETE"** into a field; the destructive button stays disabled until it matches. Skip type-to-
confirm for ordinary single-row deletes — it is friction reserved for genuine danger.
**Behavior:** [House] no outside-click dismiss (§8 default); Esc cancels (the **safe** path);
on confirm, optimistically remove + offer an **undo toast** (§10.x) where the delete is soft.
**Accessibility:** `role="alertdialog"` + labelled title/description; focus lands on the **safe**
button; the destructive button announces its consequence.
shadcn: `AlertDialog` (not plain `Dialog`) for confirms; `destructive` button variant; an
`Input` gated match for type-to-confirm; pair with a Sonner undo toast for soft deletes.

---

## 9. Navigation

**Shell-level:** global search, notifications, breadcrumbs. Breadcrumbs limited to the drill-down
levels within the app.
**Side navigation:** primary navigation between modules/areas; collapsible to icons; on mobile
becomes a drawer (`Sheet`). Mark the current item; keep grouping shallow.
**Tab navigation:** switch between peer views of the **same** context (e.g. object page sections);
don't use tabs to navigate to unrelated destinations.
**In-page links / quick views:** smart links open a quick view popover with key details + a link
to the full object/app.
**Accessibility:** nav is a `<nav>` landmark; current item via `aria-current`; full keyboard
operation; visible focus.
**Do:** keep one clear primary navigation; show where the user is.
**Don't:** mix navigation patterns for the same purpose; don't bury primary actions in nav.
shadcn: sidebar block (side nav), `Tabs` (tab nav), `Breadcrumb`, `Popover`/`HoverCard` (quick view).

---

## 10. Messages, feedback & states

**Message handling (centralized):** aggregate multiple messages from one interaction into a
**message popover** (a single messaging button in the footer toolbar). Severity levels: error /
warning / information / success. Field-level errors show **inline** next to the field; an overall
**message strip** at top/bottom summarizes. Table item errors use a "contains errors" row state.
Don't show the message popover for a partial-editing area.
**Draft handling (implicit save):** auto-save drafts; show **editing status** (in a responsive
table, a link under the key info; in a non-responsive table, an "Editing Status" column placed
after the main info with a transparent button opening a lock/unsaved popover). New draft items are
highlighted; drafts group to the top. Locked items can't be edited/updated/deleted; users can
delete their own drafts. Warn before navigating away while dirty.
**Required states (every data region):** **loading** (Skeleton matching the content shape, not a
full-page spinner) · **empty** (icon + one line + one suggested primary action) · **error** (short
message + Retry).
shadcn: message center = Popover (top bar) + **[House]** toast (Sonner) for transient feedback +
`FormMessage` inline + `Alert` strip; `Skeleton`; custom EmptyState/ErrorState.

### 10.1 Toast timing / position / max-stack [House]
House rule (not Fiori — Fiori centralizes in the message popover; we add transient toasts for
lightweight success/undo feedback via Sonner).
**When:** transient, non-blocking feedback — "Saved", "Copied", "3 items deleted · Undo". **Not**
for errors that need action (those go inline §6 or to the message strip/popover §10) and **not**
for anything the user must read before continuing.
**Position:** **bottom-right** on desktop (consistent app-wide); **top-center** is acceptable on
mobile where bottom is thumb-occupied — pick one per app and keep it fixed.
**Timing:** auto-dismiss after **~4 s** for plain info/success; **~6–8 s** when the toast carries
an **action** (Undo) so the user has time to act; **errors that warrant a toast are persistent**
(no auto-dismiss) until dismissed. Pause the timer on hover/focus.
**Max-stack:** show at most **3** toasts at once; newer ones **collapse/replace** older rather than
growing an infinite column. Never let toasts cover the primary action or the footer toolbar.
**Accessibility:** `aria-live="polite"` (assertive only for errors); the toast and its action are
keyboard-reachable; an Undo toast must remain actionable for its full lifetime.
shadcn: **[House]** Sonner — `position`, `duration`, and a `visibleToasts` cap of 3;
`toast.success` / `toast.error` / `toast(..., { action })` for undo.

---

## 11. Accessibility baseline (cross-cutting, all components)

- Use **semantic HTML** (`<button>`, `<a>`, `<nav>`, `<table>`) — never a `<div>` for a button/link.
- **Full keyboard support:** Tab order matches reading order; Enter activates; **Esc** closes
  overlays. No keyboard traps (except intentional, escapable modal focus traps).
- **Visible focus indicators** on every interactive element (WCAG 2.4.7).
- **Touch targets ≥ 44×44px.**
- **ARIA roles/labels** where semantics aren't enough; errors via `aria-describedby`; current
  nav item via `aria-current`.
- **Never rely on color alone** to convey state — pair with icon/text.
- Target **WCAG 2.2 AA** contrast (verify with the token pairs in `DESIGN.md`).

---

## 12. Behavior summary, checklist & sources

### Behavior summary
| Situation | Rule |
|---|---|
| Primary action | Emphasized/`default` in the left of the footer cluster; one per region |
| Global vs local | Global → footer (object page → header); local → next to its content |
| Overflow | Overflows right → left; most important action stays leftmost |
| Destructive action | Separated; requires a confirm Dialog |
| Quick create/edit | Dialog (short) / Sheet (long); complex → Object Page |
| Modal dismissal | Explicit close/Esc; NOT outside-click for unsaved forms |
| Table comparison | ≤ 4 items; > 5 → use Filter & Sort instead |
| Large data | Pagination or virtualization; sticky header; column hide/resize |
| Mode display↔edit | Layout unchanged; controls don't move |
| Status | Semantic Badge, consistent (success/warning/danger/info) |
| Mobile | Responsive table; FCL collapses to 1 col; no grid/analytical table |

### Pre-merge checklist
- [ ] App type identified (transactional / fact-sheet / analytical).
- [ ] Screen matches exactly one floorplan (§4); sits in shell + Dynamic Page.
- [ ] Correct full-screen vs FCL; mobile collapse handled.
- [ ] List Report has filter bar (mandatory) + table toolbar + bulk actions.
- [ ] Object Page: dynamic header, sections→subsections, finalizing footer, layout stable across modes.
- [ ] Action placement per §7 (global→footer/header, local→near content, correct order/emphasis).
- [ ] Correct table type (responsive for mobile; grid only desktop/tablet); pagination/scroll rule applied.
- [ ] Modals: explicit close, focus trap + return, no outside-click dismiss for unsaved forms.
- [ ] Centralized messages + draft handling where forms/tables have drafts.
- [ ] All three states present: loading / empty / error.
- [ ] Accessibility baseline (§11) met.
- [ ] No hardcoded tokens; existing components reused (checked `src/components/README.md`).

### Sources (SAP Design System)
- Portal: https://www.sap.com/design-system
- Fiori for Web — floorplans, layouts, action placement, message/draft handling, tables:
  https://www.sap.com/design-system/fiori-design-web
- Digital Design System — component patterns (Tables, Wizard, Modal/Overlay, Side/Tab Navigation):
  https://www.sap.com/design-system/digital/patterns
