# E2E QA Field-By-Field Verify With Report

**When To Run:** QA step (2.10) — verifying a persisted record field-by-field after a form submit, emitting a `correct | incorrect | manual | not-found` matrix report. **Skip when:** the feature has no form or persisted record to inspect.

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> An E2E spec that must (a) fill a long form like a real user, (b) on the
> post-submit detail page **inspect every field individually as a manual QA
> would**, (c) emit a `correct | incorrect | manual | not-found` matrix as a
> markdown report dev can act on, and (d) leave a slow-paced video usable as a
> user-guide. PRs that ship `.check()`-based assertions look green in CI but
> silently drop form values; "verify-via-API" checks prove nothing on the recorded
> screen. The QA-evidence counterpart to `canonical-e2e-flow-playbook.md`. Owns
> Build & Go-live **step 2.10** (QA real-browser + video).

**Macro-stage / step:** Build & Go-live · 2.10 (after 2.9 security, before 2.12
UAT). **Gate it serves:** **DoD** — review + E2E + security + QA evidence +
user-manual.

> The 3 deliverables + report shape below are authoritative. This is a
> **workflow recipe**, not a tooling-fix template.

## Engine

- **Fast path:** `ck-qa` (real-browser testing with video evidence, requirement
  coverage, human approval gate). Pairs with `web-testing` (Playwright) for the
  spec runner and `agent-browser` / `chrome-profile` for the browser surface.
- **Role:** QC/QA. **Bare-agent fallback:** the `tester` agent assembles the
  field-catalog + verify driver + inspect overlay below directly in
  Playwright/Cypress. Per D1 the skill is an accelerator.

Use `canonical-e2e-flow-playbook.md` for the fill / navigation grammar; use **this
one** when the goal is **verify a persisted entity, field by field, with a report
dev can act on**.

## Symptoms (why loose specs lie)

- Spec asserts page health via one heading + a couple of toast checks → green CI,
  but cannot answer "which of 30 fields round-tripped".
- Asserts on a concatenated rendered string (`getByText(value)`) → passes whenever
  ANY copy of the value lands anywhere in the DOM; misses silently-dropped fields.
- `input.check()` on a React-controlled `CheckboxGroup` → first checkbox "works",
  second silently drops from the submit payload.
- Test uploads a 1×1 PNG placeholder → verification can only check the BE returned
  a key; the video has no visual signal the upload rendered.
- Test stack returns 500 on `POST /presign-upload` (storage env unset) but a FE
  `if (url.includes('stub')) return ok` fallback masks it → "succeeds" with a fake
  key → broken image on screen, assertion still passes.
- Dev gets "test failed" with no consolidated report of WHICH fields are wrong vs
  merely unverifiable vs known wiring gaps → re-derives triage every time.
- Route renamed months ago; verify spec still navigates the old path which now
  serves a different page that shares enough text to keep loose assertions green.

## Root Cause

1. **`Locator.check()` ≠ a user click on a React controlled input.** React
   reconciles controlled state from the `checked` PROP, not the DOM property, so
   the parent `onChange` may not run; a CheckboxGroup reading stale `value` writes
   state that omits the first item.
2. **Outer-wrapper label trap.** A `<label>` whose `innerText` contains all option
   texts as substrings matches a `filter({ hasText })` lookup and `.first()` walks
   the wrong ancestor.
3. **Verify reads aggregated DOM, not per-field DOM.** `getByText(value)` masks
   per-field correctness when fields share substrings.
4. **No artifact for dev handoff.** A failing CI step + screenshot forces the dev
   to re-run the spec to learn what broke.
5. **Test-stack env drift.** Test infra lacks env dev has (storage, mail) → the
   production-shape code path is "tested" but never actually exercised.
6. **Un-scoped `.first()` / `.last()` against repeated card sections** picks the
   DOM-last occurrence; a section appended later silently shifts the target.

## Fix — Three Deliverables

The spec calls them in order: **field catalog → verify+report driver → per-field
inspect overlay**. Image cells get an auto-check (URL + HTTP probe) so they don't
fall back to human eyeball for wiring + delivery.

### 1. Field catalog (declarative, one row per visible field)

Keep selector, expected derivation, and classification policy in data, not code.

```ts
// e2e/fixtures/detail-page-field-catalog.ts
export type FieldKind = 'text' | 'image' | 'chip-list' | 'manual';
export interface FieldProbe {
  label: string; section: string; kind: FieldKind;
  expected: (data: Form) => string;
  locator: (page: Page, data: Form) => Locator;
  resolve?: (locator: Locator) => Promise<string>;  // custom extractor
  manualOnly?: boolean;    // skip auto-compare, force human verify
  manualNote?: string;     // surfaced in report
}
const dlValue = (label: string) => (page: Page) =>
  page.locator(`dt:has-text("${label}") + dd`).first();
const chipsIn = (heading: string) => (page: Page) =>
  page.locator('div.card').filter({ has: page.locator(`h3:has-text("${heading}")`) })
      .first().locator('.tag, .pill');
```

Fall back to `manualOnly` ONLY for checks a URL + HTTP probe cannot cover (pixel
color, animation, layout cropping). Wiring + delivery are auto-verified.

### 2. Verify-with-report driver

Walks the catalog, inspects each field, classifies, writes markdown. Returns rows
so the spec can `expect(rows.filter(r => r.status === 'incorrect')).toEqual([])`.

```ts
type RowStatus = 'correct' | 'incorrect' | 'manual' | 'not-found';
// matches(): exact or contains for text; set-equality for chip-list.
```

Report shape (per section) — the artifact dev acts on:

```markdown
| Field | Expected | Actual | Correct | Incorrect | Manual / Note |
|-------|----------|--------|:-------:|:---------:|---------------|
| MST   | 0314…    | 0314…  |    x    |           |               |
| Markets (chips) | Domestic, Direct export, Other | Domestic, Other |  | x |  |
| Logo  | bg-image color X | (verify via video) |   |   | See ~02:14 |
```

### 3. Per-field inspect overlay (visual)

So the video shows a real "QA inspect" — outline pulse + tone-colored label chip
over each field as it is verified. The overlay div is `pointer-events:none` with a
max z-index so it never blocks subsequent clicks. Tones: pass green / fail red /
manual amber / neutral blue.

## Acceptance Gate

The spec is DoD-ready when:

- [ ] Every detail-page field has a catalog row (no silent omission).
- [ ] The driver emits the markdown report at a fixed path the dev can open.
- [ ] `rows.filter(r => r.status === 'incorrect')` is empty (green).
- [ ] `manual` rows carry a video timestamp note.
- [ ] The running stack = the latest build (no stale `docker compose` image
  serving a previous build).
- [ ] Each verified REQ-ID maps to a **TC-NNN** in the verification register.

If a field is `not-found` because the seed left it `null`, the root cause is an
incomplete seed (`seed-data-pattern.md`), not a render bug — fix the seed.

## Variant Section

(Append a Variant block here when this recipe fails or partially works.)

## Related

- `docs/process/WORKFLOW.md` § 2.10 — the step this playbook owns (DoD gate). The same
  step also runs the **visual-fidelity evidence pass**
  (`docs/gates/visual-fidelity.md`): per key APP/ADM screen, a running-app
  screenshot side-by-side with its prototype export render, recorded
  pass/divergent — and re-captures any PUB product-shot taken before the APP
  screens it depicts were final.
- `docs/about/TRACE_SPEC.md` — TC-NNN the report rows map to.
- `canonical-e2e-flow-playbook.md` — the fill/navigation counterpart (2.8).
- `seed-data-pattern.md` — `not-found` rows often trace to incomplete seed.
- `code-review-scoring.md` — the Tests dimension this evidence satisfies.
- `docs/about/ROLE_MAP.md` — QC/QA role + `ck-qa` engine binding.
