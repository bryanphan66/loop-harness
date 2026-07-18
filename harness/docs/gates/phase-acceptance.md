# Gate — Phase Acceptance (per-phase verification before the next phase)

> **Type:** internal HARD gate (auto-block), **per build-manifest phase**.
> **Read by:** the `/build-phase` loop at step **2.6** (the orchestrator enforces
> it between phases), `docs/STAGE_GOALS.md` § 2.6, and **DoD** at 2.10 (which
> confirms every phase carried an acceptance record). **Authority:**
> `docs/WORKFLOW.md` § Gate rebalance + the phase's own Acceptance-checks block
> in `docs/build-manifest.md`.

A phase is **not done when its commit lands — it is done when its Acceptance
Criteria are verified against the RUNNING app.** This gate moves verification
from "once, at the end of the manifest" to "every phase, before the next phase
starts", so a defect born in phase N is caught and fixed in phase N — not
discovered at 2.7/2.8/2.10/2.12 after N+5 more phases were built on top of it.

**Why this gate exists (failure evidence + token rationale):** a full Macro-2
field run (auto-script) ran the whole 2.6 loop first and verified heavily only
at the end (2.7 review, 2.8 e2e, 2.9 security, 2.10 QA, 2.12 UAT). Deviations
accumulated silently across phases — wrong-looking screens, swallowed errors,
sibling call-sites left broken — and all surfaced together at the end, forcing
multiple UAT-fix rounds that re-opened supposedly-done phases. **Catching a
defect in its own phase costs one fix cycle in a context that is already
loaded; catching it at the end costs re-discovery, re-context, cross-phase
rework, and re-verification of everything built on top — an order of magnitude
more tokens and wall-clock.** With this gate, the end-of-manifest 2.7/2.8/2.10
passes become **aggregation and cross-phase confirmation**, not the first place
errors are found.

## The two verification legs

### Leg 1 — Agent verifier (ALWAYS runs, every phase, non-waivable)

After the phase's stage-boundary commit, the **orchestrator** (the `/build-phase`
caller) spawns an **independent verifier subagent** — a fresh context that did
NOT implement the phase. The verifier receives ONLY: the phase's block from
`docs/build-manifest.md` (its Acceptance checks are the contract), the preview
URL/command (see Incremental Preview below), the phase's screen-inventory rows
+ export source paths, and this gate file. It must verify against the **running
app**, never by reading the diff and assuming:

1. **Functional AC** — every numbered acceptance check in the phase block is
   exercised as written (actor → action → observable outcome) and holds.
2. **Visual fidelity** — each screen the phase ships has its **Playwright
   fidelity assertions** (element completeness + interaction behaviour) run
   GREEN and its screenshot captured for the human side-by-side glance, per
   `docs/gates/visual-fidelity.md`. The verifier RUNS the assertions — it does
   NOT LLM-compare two images, and an implementer's "matches export" self-claim
   is not a substitute.
3. **Negative path** — the phase's error/empty acceptance check(s) trigger the
   failure for real and the REAL cause surfaces in the UI (a generic message =
   FAIL, per the no-error-swallow floor rule).
4. **Type-specific categories (non-CRUD phase-types only)** — when the phase's
   `Phase-type` ≠ `crud`, the verifier ALSO exercises that type's categories
   against the running preview (`docs/templates/build-manifest.md` § Non-CRUD
   phase-types + the named playbook):
   - `async-job` — idempotency-key holds (same key → one run), a forced failure
     retries then dead-letters, the status endpoint reports terminal state, the
     real cause surfaces (`docs/playbooks/async-job-queue.md`).
   - `storage` — a signed PUT then signed GET round-trips; an **unauth GET is
     denied**; deleting the owner removes the object; over-quota is rejected
     (`docs/playbooks/object-storage.md`).
   - `media-pipeline` — a large upload transcodes to the **full 480/720/1080
     ladder + master manifest**, exposed to the consumer only once `status(jobId)`
     reports `completed` (the primitive uploads renditions as they're produced —
     no automatic stage→atomic-publish — so gating on job state, not "the key
     exists", is what makes this atomic in practice); a forced upload failure
     leaves no orphaned renditions under the output prefix; the manifest is served
     via signed-URL/CDN **through an entitlement-gated HTTP proxy route, NOT a raw
     storage signed-URL handed to the player** (a `file://` local-driver URL or a
     relative child playlist that loses its presign spins the player forever) —
     `signManifest` returns a root-relative path so child playlists/segments resolve
     into the same guarded route; unentitled fetch denied; progress/status surfaced;
     renditions cleaned on delete; **streaming NFR asserted HERE — player
     first-byte within budget, signed-URL entitlement, multi-bitrate present**
     (not deferred to 2.11). Verify by driving the STUDENT path (OTP-login enrolled
     → `playback-url` is HTTP not `file://` → `master.m3u8` is `#EXTM3U` → a `.ts`
     is 200 `video/mp2t`), not just the editor preview (`docs/playbooks/media-pipeline.md`).
   - `external-integration` — sandbox credentials on the test path (no prod key
     reachable); an unsigned webhook is rejected before any DB read; a duplicate
     callback is idempotent; a failed outbound surfaces the real provider error
     (`docs/playbooks/external-integration.md`).
   A type-specific category that FAILs blocks the phase exactly like a functional AC.
5. **Universal UI floor (every phase that ships or touches a screen)** — the
   shared fixture `apps/web/e2e-ui/_universal.fidelity.ts` runs against each
   screen: app-shell present (U1), no input focus-steal (U2), both themes
   faithful (U3), shell stays put on scroll (U4), i18n locale-switch changes the
   visible strings + currency/date per locale, responsive (no horizontal page
   scroll at the mandated min width + tap targets ≥44×44px), loading/empty/error
   states present (not just the happy path), and an **axe-core a11y pass**
   (0 serious/critical, WCAG 2.2 AA). These are NOT per-screen opt-in — a
   `*-fidelity.spec.ts` that does not import + call the universal fixture is a
   RED lint gate. This moves theme/i18n/responsive/a11y/shell/states from an
   end-of-manifest gate (where they silently accrue across phases and surface in
   a batch — the exact anti-pattern this gate exists to kill) into every phase,
   by a mechanism screens inherit, not a checklist authors re-copy.
   **Clause U-img (public image integrity — every screen that renders an
   `<img>`/next `Image` for a cover, thumbnail, avatar, logo, or funnel/landing
   graphic).** The universal fixture asserts, in a REAL browser, that every
   rendered image is DECODED not broken (`img.complete && img.naturalWidth > 0`
   for every element of `document.images`) — the only check that catches the
   failures a `curl` 200 hides: a 404-after-redeploy (asset written to the
   container's ephemeral fs with no volume/R2, gone on the next deploy), a helmet
   `crossOriginResourcePolicy:'same-origin'` that makes the browser refuse a
   cross-origin asset while curl still 200s, and a dead/wrong src — and that the
   image is not UPSCALED (`naturalWidth >= renderedCSSpx * devicePixelRatio`, ≥1
   real rung) so a 400px master isn't blown up blurry. Static companion greps
   (RED lint over `screens-*.jsx`/JSX + seed): (a) NO `<img src>`/`Image src`
   points at an EXTERNAL absolute host (hotlink, e.g. `nhatnghe.net`) — public
   assets are seeded local / R2 under the project's OWN asset origin, never
   another site's URL; (b) every `<img>` whose src is user- or remote-derived
   carries an `onError` placeholder fallback (no browser broken-glyph on a dead
   src); (c) a MUTABLE asset URL (re-uploadable cover/avatar) is cache-busted by
   `?v=<updated_at>` (or a content hash) so re-uploading to the same key doesn't
   serve the stale CDN/browser copy; (d) uploaded-then-served assets persist on
   R2/S3 or a mounted volume, never the API container's ephemeral fs. A
   broken/CORP-blocked/upscaled image, or a hotlinked / onError-less /
   non-cache-busted / ephemeral-fs asset src, is a phase FAIL — image integrity
   is a floor, not a cosmetic nit. Distinct from the v6.17 media-delivery proxy
   leg (that is video *playback* `file://`→HTTP-proxy; this is `<img>` decode +
   host + persistence).
6. **Security floor (every phase that adds or touches an API route)** — authz is
   **default-deny**: a route with no `@Public` / `@RequireGrant(...)` /
   `@SelfScope(...)` metadata is denied (403), enforced by a global guard, not
   opt-in per controller. The verifier asserts each new route: unauth → 401,
   under-privileged → 403, and the route appears in the phase's authz matrix.
   Secrets **fail closed** — production refuses to boot without the required
   JWT/provider secrets (no source-committed fallback). **Corollary — a new
   fail-closed secret ships WITH its deploy-env value in the same phase, or it
   crash-loops the box.** The fail-closed check is correct, but a phase that adds
   a new prod-required secret/config (a payment webhook HMAC + account, an SES
   key, an OAuth secret) and does NOT also add a sandbox/placeholder default to
   the deploy compose (the `${VAR:-default}` pattern the stack already uses) —
   or have the control deploy step inject it — turns the *next deploy* into an
   API crash-loop (the box 404s, health red). The gate: for every new
   `NODE_ENV=production`-required env var a phase introduces, either a safe
   sandbox default lands in `docker-compose.*.yml` (staging boots; real creds
   override) or the phase report lists it under "deploy env the control must set
   before deploying" — a new required secret with neither is an incomplete phase.
   **Boot smoke — the gate boots the real AppModule, not just compiles it.**
   `validate:quick` compiles + unit-tests, but unit tests inject positionally and
   mock modules, so a **runtime DI/boot error ships green and only surfaces as a
   prod crash-loop** (health 404). Two real incidents: a fail-closed config threw
   at boot when a prod secret was absent; and a Nest DI crash — a service took an
   optional collaborator (`verifier?: X` + a function default) **without
   `@Optional()`**, so Nest tried to resolve it as a provider that wasn't in the
   module and `AppModule` boot threw "Nest can't resolve dependencies of …". The
   gate MUST add a **boot-smoke step** that instantiates the full AppModule
   (`Test.createTestingModule({imports:[AppModule]}).compile()` or a `--dry-run`
   bootstrap against a throwaway DB) so DI/boot errors fail the GATE, not the
   deploy. Code corollary: any constructor param that is an optional collaborator
   with a runtime default (test-injected stub, config-built instance, a plain
   function) MUST carry `@Optional()` — Nest ignores the TS `?`/default and resolves
   by type otherwise. Verify-at-source after any deploy that touches API modules:
   `curl API/health` == `{status:ok}` — a health 404/502 is a boot crash, not
   transient.
   Baseline hardening the
   app carries once (asserted present, not re-added per phase): **per-IP
   rate-limit** — shared across instances (Redis-backed, never in-memory on a
   multi-container API), tiered (strict on auth/OTP), 429 + `Retry-After`,
   proxy-aware client-IP (X-Forwarded-For, else every caller looks like the
   reverse proxy) — and **HTTP security headers** (helmet: HSTS, nosniff,
   frameguard). This moves authz + secret + abuse-control coverage from the 2.9
   security sign-off (where one forgotten guard hides for the remaining phases)
   into the phase that adds the route.
   **Authz is not complete until the UI reflects it.** A route guard (403) is
   necessary but NOT sufficient — a screen that renders a mutating control
   (delete, publish, create) the caller has no grant for is a defect: it invites
   a 403 dead-end and reads as "the permission model isn't applied." Every phase
   that ships an admin screen **gates its action controls on the caller's grant**
   (hide by default; disabled-with-reason only where hiding breaks layout), read
   from the SAME authoritative source the guard uses (the caller's fresh grant
   map, e.g. surfaced on `/auth/me`) — never a second, divergent copy. The
   verifier asserts: a caller lacking the grant does not see the control, and the
   API still 403s it (both layers, not either/or).
   **RBAC matrices carry a self-lockout guard.** When a permission-editing screen
   lets a grant be lowered — especially the role that DEFINES the ceiling (the top
   admin whose own grants bound everyone else's) — an operator can drop the
   ceiling below the level needed to raise it again and lock the whole system out.
   The matrix (and the save API, defense-in-depth) must refuse an edit that lowers
   the ceiling-defining role's own grant below its current level, with a clear
   reason; and a documented recovery path exists (e.g. the idempotent boot seed
   restores the spec grants on restart). Raising is always allowed.
7. **Index discipline (`crud` phases)** — any schema change indexes every
   foreign-key scalar + the common filter/sort columns; a schema-lint fails a
   relation scalar with no index. Keeps p95 (`NFR.PERF`) from degrading silently
   as tables grow, in-phase rather than discovered under load at go-live.
8. **Grid completeness floor — every data grid ships pagination + filter + sort.**
   A data grid / list (a table of records: users, courses, orders, leads,
   students…) is not "done" as a bare list. It ships, as DoD: **server-side
   pagination** (already `NFR.PERF.08`), **at least one filter/search**, and
   **column sort** — and an Excel/CSV **export** where the feature's REQ calls for
   it. This is a project standard the operator elevated from per-feature to
   universal: a grid that surfaces records without a way to filter or sort them is
   an incomplete grid, not a smaller one — the same lesson as the public catalog
   shipping without its filter row (U10). A pure 2-D config matrix (a role×area
   permission grid) is NOT a data grid and is exempt; the floor is for record
   lists. The verifier asserts each new record-list screen carries the pagination
   + filter + sort controls, wired (not decorative) — a list phase missing them is
   FAIL. (Project NFR: `NFR.UXC.09`.) **A grid that fetches-all for client-side
   sort/filter/paginate must size its fetch ≤ the endpoint's max pageSize** — one
   page set `FETCH_SIZE=200` against a `pageSize.max(100)` DTO → HTTP 422 → the
   page's error state, and a plain `curl` (default page size) 200s so the earlier
   verify missed it; the verifier drives the PAGE's own request, or switches the
   grid to true server-side pagination.
9. **Route reachability floor — no orphan routes, no dead internal links (every
   phase that adds/touches a route, nav item, or link).** The verifier builds the
   app's route graph and asserts it is connected both ways. (a) **Every internal
   link target resolves** — each `<Link href>`/`router.push`/`redirect`/nav-config
   entry/CTA/copy-share URL the phase ships points to a route that EXISTS and
   renders (no 404, no blank), including dynamic segments: a `:slug`/`:code`
   deep-link has an index/handler route not just the leaf (`'Vào học'→
   /student/learn/:slug` needs an index route); a copy-share button emits the
   app's REAL public path (`/certificates/verify/{code}`, NOT a guessed
   `/certificates/{code}`); a marketing CTA points at the real page (`'Đăng ký
   học'→/auth/register` must render, not 404); About/Classes nav resolve to their
   pages, never a stub `/`. (b) **Every built user-facing route is reachable** — a
   page a phase adds is linked from nav/sidebar/tab or another reachable page; a
   route in code with zero inbound links is an orphan (built-but-unreachable —
   `/reports/funnel`, `/reports/email`, `/marketing/suppression` shipped with no
   nav/tab) and MUST be wired into nav or explicitly marked
   `internal-only`/`programmatic-entry` in the phase block. (c) **A nav item lands
   on the intended first destination** — a zone/section entry resolves to that
   zone's first tab in spec order, not an arbitrary sub-route. The verifier drives
   a **link crawl** from the app root (BFS-click every sidebar/nav/tab item + every
   primary CTA/share link), asserts no target 404s or renders blank, and that every
   route the phase's screen-inventory lists is in the reachable set. A 404/blank on
   click, an orphan route, or a nav landing on the wrong sub-tab is a RED block —
   pixel-perfect look does not waive it (distinct from visual-fidelity U11, which
   only proves a resolving nav switches content; and U6 breadcrumbs, ancestor trail).
10. **Seed coherence + prototype fidelity floor (every phase that seeds
    demo/default content or ships a public catalog/marketing screen)** — the seed
    must be COHERENT and FAITHFUL, not merely FK-valid (FK order + determinism is
    `seed-data-pattern.md`; this is a distinct floor). Three machine checks against
    the seeded DB + running app: (a) **cross-entity invariants hold** — every
    business invariant between seeded rows is asserted by a SQL/API query returning
    0 violations: an enrolled student with no `paid` order (37 enrolled all-`pending`
    broke order-history), an order line with no product, a published course with no
    lessons, a paid order with no invoice; non-zero → FAIL. (b) **seed UPSERTS
    singleton/default content, not insert-if-absent** — any default/singleton row
    the prototype defines (a `gioi-thieu`/about page, hero/landing settings, a
    content block) is re-derived from the frozen export on EVERY seed run and
    OVERWRITES a dirty row; a `findOrCreate` leaving a stale `Nháp` draft is a
    defect (verifier: hand-dirty the row, re-run seeder, assert row == frozen). (c)
    **public catalog + default copy match the frozen prototype EXACTLY, count-exact**
    — the frozen public list (`GET /courses`, `/blog`) returns exactly the
    prototype's item set (real slugs), never leftover demo/lorem, and default
    marketing copy equals the export string VERBATIM (byte-exact incl. em-dash vs
    hyphen), asserted `toHaveText(FROZEN_STRING)` from the export. A non-zero
    invariant, a stale singleton, a catalog count/slug-set ≠ frozen, or a copy
    byte-mismatch is a FAIL exactly like a functional AC.
11. **Build & migration hygiene (every phase — extends the boot-smoke past the API
    AppModule; runs against the RUNNING preview at Leg-1, not the throwaway
    boot-smoke DB).** Green typecheck + unit + AppModule boot prove neither that the
    deliverable BUILDS for production nor that the RUNNING DB matches the committed
    schema. The verifier additionally asserts, in-phase: (a) **production frontend
    build passes** — `pnpm build` (`next build`, NOT `dev`) exits 0, so a
    `'use client'` page reading context/`window` during static prerender fails the
    GATE not the deploy; (b) **no schema drift at the target** — `prisma migrate
    status` up-to-date (or `migrate diff` empty) against the SAME DB the
    preview/deploy uses, so a committed-but-unapplied migration (a column the code
    reads but the box lacks → runtime 500) blocks in-phase; (c) **custom queue /
    external IDs are slug-safe** — every `enqueue(..,{jobId})`/idempotency-key
    matches `^[A-Za-z0-9_-]+$` (a BullMQ `jobId` with `:` throws at enqueue → 500);
    (d) **worktree base correct** — an isolated worktree/branch was cut from the
    branch carrying prior phases' code (`git merge-base --is-ancestor`), not a
    stale/empty base. Any of (a)–(d) failing is a phase FAIL.
12. **Create/edit dialog payload satisfies the server DTO — every create/edit form
    round-trips 2xx, no guaranteed-422 and no silent no-op.** For each create/edit
    dialog, the verifier DRIVES the real form to a successful submit against the
    running app and asserts the entity persists (reload/list shows it) — never
    assumed from the diff. It kills three shapes, all seen: (a) a required field
    sent empty/`||''`/`null` against a DTO `min(1)`/required-enum/NON-NULL column →
    422 on EVERY submit (`triggerType||''`; `graph_json:null` vs Zod
    `{entry,nodes}`); (b) a structured-JSON payload missing a Zod-required key so
    the save-guard returns SILENTLY — no error, no persistence (data loss reading as
    success); (c) a required enum/select the UI never validates, submit enabled
    before it's set → guaranteed 422. Machine-check BOTH: (1) submit DISABLED until
    every DTO-required field is set (blocked client-side, never sent-and-422'd); (2)
    a filled submit returns 2xx AND the entity re-reads with the submitted values (a
    save that leaves the row unchanged is the silent-guard FAIL). Derive the required
    set by grepping the DTO/Zod schema, not the form's optional-looking defaults.
    **Seed corollary:** every seeded row that later flows through a save/validation
    path must satisfy that SAME Zod/DTO schema, not merely be FK-valid (a seeded
    `graph_json {edges,nodes}` missing `entry` passed FK but tripped the guard).
    Distinct from Leg-8's read-side `pageSize.max` 422 (an oversized GET query-param;
    this is a create/edit request BODY vs the create DTO).
13. **Record-lifecycle floor (any phase creating a row with a status/lifecycle
    enum — order, enrollment, invite, send-record, job)** — idempotency legs cover
    only INBOUND callbacks; this covers the CLIENT write-path, driven against the
    preview: (a) **reuse-or-create, not mint-on-remount** — re-entering the create
    surface (re-open checkout, re-mount form) while an OPEN row exists for
    (actor, subject) REUSES it: exactly one open row + the same QR/token, never a
    fresh pending per mount; (b) **idempotency scoped to accidental double-submit,
    NOT repeatable actions** — a deliberately repeatable action (resend test,
    re-export, re-invite) acts EVERY time OR is throttled with a VISIBLE cooldown; a
    stable key turning the 2nd deliberate click into a SILENT no-op is a FAIL, while
    a true double-submit still dedupes; (c) **TTL + terminal state are real** — force
    the clock/sweep so an open row past TTL flips to `expired`/terminal via an actual
    job, that status is a real enum value present in lifecycle filters + badges +
    counts, and a fresh row can then mint; (d) **no phantom rows on partial fan-out**
    — a forced mid-loop failure leaves NO row stuck non-terminal with no backing
    job (transactional batch or a reconciler recovers orphans; assert zero
    unrecoverable `queued`/`processing` after the injected fault). Any of (a)–(d) is
    a FAIL. (The terminal-status-in-filters requirement pairs with U16.)
14. **i18n catalog + export integrity (every phase touching a message catalog, an
    enum-labeled table, or a data export; runs against the RUNNING preview + a real
    file download at Leg-1).** A machine lint blocks the phase when: (a) **a message
    fails to ICU-compile** — literal `{{name}}` (Handlebars braces) or an unescaped
    bare `{`/`}` throws next-intl `INVALID_MESSAGE`; lint = compile EVERY catalog
    entry through the ICU parser (grep `{{` is the fast pre-check); (b) **a dead key
    exists** — a `messages/*.json` key no source `t('…')` references, OR a rendered
    key missing from the catalog (both directions RED); (c) **a target-locale value
    equals its source-locale value** for a translatable string (`vi.json` keeps
    `"Automation"`/`"Drip"`) — RED unless on a proper-noun/brand whitelist; (d) **a
    user-facing export is not localized** — a CSV/XLSX/PDF writing raw enum codes
    (`STU`/`GV`/`ADM`) or ISO timestamps instead of the SAME localized labels +
    active-locale dates the on-screen table renders. On-screen untranslated strings
    are already caught by Leg-5 + visual-fidelity block 11; this leg catches the
    surfaces those cannot see — the parse-crash, the never-referenced key,
    English-in-locale on an unsampled screen, and the downloaded file.

The verifier returns a **verdict block**:

```text
PHASE ACCEPTANCE — <P-id>
Verdict: PASS | FAIL
Checks: <n passed> / <n total>   (list each AC id → pass/fail)
Fidelity: <screens checked → pass/divergent>
Negative path: <triggered? real cause surfaced?>
Type-specific: <Phase-type ≠ crud → each category → pass/fail; or n/a — crud>
Evidence: <screenshot/log paths under plans/reports/>
Reasons (on FAIL): <concrete, reproducible — what to fix>
```

- **FAIL → fix inside the same phase.** The orchestrator dispatches a fix leg
  (same phase scope, the verifier's Reasons as input), then re-runs the
  verifier. Cap: **3 verify rounds**; still FAIL → `BLOCKED`, page the human.
  The next phase MUST NOT start on a FAIL.
- **PASS → record it:** flip the phase's `Accepted` cell in the manifest
  Progress table (`agent-pass <date>`) + add a TC-NNN verification-register row
  (`docs/TEST_MATRIX.md`, `Result: pass`) for the acceptance run. Recorded in
  one small `test(<scope>):` commit citing the TC token — the verification
  event is distinct from the phase's implementation commit, so the
  stage-boundary-commit atomicity rule is not violated.

### Leg 2 — Human checkpoint (cadence-driven, the operator's eyes)

The **human checkpoint cadence** is a knob declared in the build-manifest
header (set at 2.3, changeable by the operator at any time):

| Cadence | Human checkpoint fires after… | Use when |
|---|---|---|
| `per-phase` | every phase | high-stakes or unfamiliar domain |
| `per-ui-phase` **(default)** | every phase that ships/changes screens, and every phase that closes a module/milestone | normal builds — trivial glue phases don't page |
| `per-milestone` | only phases marked `Milestone: yes` in the manifest | long manifests, trusted verifier record |
| `end-only` | never during 2.6 (2.10/2.12 remain) | explicitly reverts to pre-gate behavior — operator's own risk |

Each phase block carries a compiled **`Verify-by`** field: `agent` (Leg 1 only)
or `both` (Leg 1 + Leg 2), derived from the cadence at 2.3 so no runtime
interpretation is needed. **`agent` is the floor — there is no human-only
value; the agent verifier is never skipped.**

When `Verify-by: both` and Leg 1 passed, the orchestrator emits a
`MANUAL_CHECKPOINT` (per `AGENTS.md` § Manual Checkpoint Signaling):

```text
MANUAL_CHECKPOINT: Review phase <P-id> (<name>) on the running app
- URL: <preview URL — local compose/dev server or staging>
- Reference: docs/build-manifest.md § <P-id> (its Acceptance checks) + the verifier verdict
- Save to: docs/build-manifest.md Progress row <P-id> — Accepted cell
- Return condition: operator writes OK (or lists defects → fix in this phase, re-verify)
```

The **next phase does not start** until the operator's OK is recorded in the
`Accepted` cell (`human-ok <date>`). Operator-reported defects are fixed inside
the same phase and re-verified (Leg 1 re-runs first). This checkpoint does NOT
page the client — it is internal; client gates remain PB-G*/ACCEPTANCE/HANDOVER.

## Incremental Preview (what both legs verify against)

Verification needs a **running app after every phase** — never "we'll see it at
the end":

- **Local (default):** the compose/dev-server stack from P0 stays runnable at
  every phase close; the manifest header records the one-line **Preview
  command** (e.g. `docker compose up` / `pnpm dev`) + URL.
- **Staging (optional):** when a shared/staging target exists, deploy the phase
  commit there and hand that URL to the verifier + operator.

The walking skeleton (P0) already guarantees a bootable app; this gate keeps
that invariant alive phase-by-phase — a phase that leaves the app un-runnable
is a FAIL regardless of its diff. Mechanics: `docs/playbooks/build-execution.md`
§ Incremental Preview.

## Auto-Block Rule (the teeth)

The next manifest phase MUST NOT start (and `/build-phase` refuses to pick it)
while any of these holds for the previous phase:

1. No agent-verifier verdict recorded (`Accepted` cell empty).
2. Verdict is FAIL (fix in-phase and re-verify first).
3. `Verify-by: both` and the operator's OK is not yet recorded.
4. The preview does not run (app un-bootable at the phase boundary).

At 2.10, a manifest with any phase lacking its acceptance record is a **DoD
block** — the record is per-phase evidence, not retroactively fillable.

## Sign-Off (per phase — lives in the manifest, not here)

The durable record is the manifest Progress table (`Verify-by` + `Accepted`
columns) plus the TC-NNN rows in `docs/TEST_MATRIX.md`. This gate file defines
the mechanic; it is not filled per project.

> Relationship to the end-of-manifest gates: 2.7 (review), 2.8 (e2e from BA
> docs), 2.9 (security), 2.10 (QA/DoD) still run — but as **whole-system
> aggregation** (cross-phase interactions, security posture, full coverage
> proof), no longer as the first place a per-phase defect can be caught.
