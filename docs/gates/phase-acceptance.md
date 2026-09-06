# Gate — Phase Acceptance (per-phase verification before the next phase)

> ⚠️ **ENFORCEMENT STATUS (read first — honest scope of the "auto-block").**
> Every numbered check (1-27) in **Leg 1** below is run by the **independent
> verifier AGENT against the running app** — a *prose contract the agent
> executes*, **not** an auto-lint that blocks a commit, UNLESS it is backed by one
> of the shipped scripts. Auto-enforced TODAY in `lint:gates` (via the `validate`
> script the verify-gate hook runs) = **eight** scripts (all under `scripts/`,
> each fail-soft on a bare skeleton so the harness stays runnable) — plus one
> **coverage-floor** script (`check-ac-coverage.mjs`) that backs Leg 1:
> - `check-universal-fidelity-imports.mjs` — an existing `*-fidelity.spec.ts` imports the universal fixture (backs check 5).
> - `check-new-screen-fidelity-required.mjs` — every admin screen HAS a fidelity spec (backs check 5; closes the "a new screen skips the U1-U4/i18n/a11y floor" hole a field run found).
> - `check-prototype-fidelity.mjs` — every route mapped in `scripts/fidelity-map.json` IMPORTS-from-shared + USES its required components + has its required sections + no re-drawn `<table>` on a grid (backs check 2, the component-presence half of visual-fidelity Tooth A; closes the RE-DRAW hole — a screen hand-built instead of adopted through existing components).
> - `check-prisma-fk-indexes.mjs` — every FK scalar is indexed (backs check 7).
> - `check-admin-screen-width-caps.mjs` — no hard content-width cap (backs visual-fidelity U7).
> - `check-manifest-coverage.mjs` — every in-MVP REQ-ID is built in exactly one phase + P0 defined (backs the DoR manifest-completeness rule; closes the G4 duplicate-build risk).
> - `check-authz-test-present.mjs` — every id-addressed controller HAS a negative-authz spec (backs check 16).
> - `check-money-concurrency-test-present.mjs` — every money model HAS a concurrency spec (backs check 20).
> - `check-ac-coverage.mjs` — every in-scope REQ-ID (from the build-manifest phase
>   blocks) is REFERENCED by >=1 test file (backs check 1, the coverage half). A
>   **coverage floor**, not an RTM: it proves no REQ-ID is entirely test-less; it
>   does NOT prove every AC under a REQ has its own test, nor that the referencing
>   test asserts the AC correctly (that stays with the verifier + the test-run
>   gate). Wire it HARD on a new project; a repo with a pre-gate backlog runs it
>   `--advisory` (reports, does not block) until the backlog burns down.
>
> Plus `scripts/harness-verify-gate.sh` greps the verification register
> (`docs/about/TEST_MATRIX.md`) for `fail` / `never-run`.
>
> **What the coverage gates DO vs DON'T (the honest limit).** The four
> coverage/presence gates (`new-screen-fidelity-required`, `manifest-coverage`,
> `authz-test-present`, `money-concurrency-test-present`) enforce that the required
> SPEC/TEST EXISTS and the structural mapping is complete — they do NOT prove the
> behaviour is correct. The behavioural assertion (the IDOR denial actually fires,
> the concurrent race actually yields ONE effect, the fidelity floor actually
> passes) stays with the verifier agent RUNNING that spec against the app. So a
> leg marked **[AUTO] (presence)** can no longer be silently self-attested (the
> machine blocks a MISSING spec), but a green `lint:gates` is NOT proof the spec
> passes — that remains the verifier's job. **Every other "Lint:/grep …" clause
> below is SPECIFIED, NOT SHIPPED** — the verifier performs it by hand; do not
> treat it as an auto-block.
>
> | Marker | Meaning | Checks |
> |---|---|---|
> | **[AUTO]** (partial) | a shipped `lint:gates` script backs PART of the check; the rest is agent-driven | 5 (fixture-import + spec-exists), 7 (FK-index) |
> | **[AUTO] (presence)** | a shipped script enforces the required spec/test EXISTS + structural coverage; the BEHAVIOUR stays verifier-run | 2 (mapped screen imports+uses its prototype components/sections — component-presence; the PIXEL/aesthetic glance stays verifier+human), 16 (negative-authz spec exists), 20 (concurrency spec exists) |
> | **[AUTO] (coverage-floor)** | `check-ac-coverage.mjs` proves every in-scope REQ-ID is REFERENCED by >=1 test; per-AC completeness + the AC actually holding stays verifier-run | 1 (each REQ-ID has a test home — the coverage half; the actor→action→outcome behaviour stays [VERIFIER]) |
> | **[VERIFIER]** | agent-driven only — drives the running app + does any grep by hand; no auto-block today | 1 (behaviour), 3-4, 6, 8-15, 17-19, 21-27 |
>
> Plus a manifest-level auto gate not tied to a numbered leg:
> **manifest-coverage** (REQ-ID ⟷ phase). **Backlog now clear of the 3 costliest
> the field run flagged** (IDOR-test, concurrency-test, manifest-coverage — all
> shipped as presence gates); the remaining `[VERIFIER]` legs are behavioural by
> nature and stay agent-run by design. **Not a script (ops-task):** server-side
> branch-protection so `validate` cannot be bypassed at push — a repo-config
> change, tracked separately.

> **Type:** internal HARD gate (auto-block), **per build-manifest phase**.
> **Read by:** the `/build-phase` loop at step **2.6** (the orchestrator enforces
> it between phases), `docs/process/STAGE_GOALS.md` § 2.6, and **DoD** at 2.10 (which
> confirms every phase carried an acceptance record). **Authority:**
> `docs/process/WORKFLOW.md` § Gate rebalance + the phase's own Acceptance-checks block
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
`docs/build-manifest.md`, **the SRS declaration block for every REQ-ID in that
phase** (the `**<REQ-ID>**` paragraph, pulled with `req-issue-scaffold.mjs`), the preview
URL/command (see Incremental Preview below), the phase's screen-inventory rows
+ export source paths, and this gate file. It must verify against the **running
app**, never by reading the diff and assuming:

1. **Functional AC** — every numbered acceptance check in the phase block is
   exercised as written (actor → action → observable outcome) and holds.

   **The SRS outranks the manifest here, and the verifier is where that is
   enforced.** The manifest is a derived document: it may order the work, it may
   not set a lower bar than the requirement. A real run produced a manifest
   acceptance check reading *"partial until P13 lands"* for a REQ-ID whose SRS
   text carries no such qualifier. If a phase block asks for less than the SRS
   declaration does, verify against the **SRS**, and report the manifest line as
   a defect in the manifest.

2. **A check that wears a REQ-ID's name must assert what that REQ-ID requires.**
   For each REQ-ID in the phase, open its SRS declaration, read the obligation,
   then read the check that carries its name — the test title, the comment, the
   validator. Ask one question: *does this assert what the requirement demands,
   or something weaker that happens to sit nearby?*

   Weaker is a **defect**, not partial credit, and the fix has two halves: build
   the real check, or **strip the REQ-ID from the weaker one** so it goes back to
   being a visible empty spot. An empty spot sends someone to work; a correct
   label on the wrong work sends everyone onward.

   Three instances in one evening on a real run: a comment naming a
   `console.error` call site that did not exist; an acceptance criterion that
   copied the code's `409` instead of the SRS's `already_done`; and a boot
   validator labelled `IF.PROVIDER.07` that only checked a routing table had a
   primary, while the requirement's actual obligation — reject a fallback
   provider that cannot carry the request constraints — was neither implemented
   nor implementable, the adapter declaring no capabilities at all.

   No script can ask this question; it is semantic. A gate pretending to ask it
   would itself be a right label on the wrong work. That is why it lives here, in
   a contract a reader executes, and not in `scripts/`.

   The same rule binds comments: a comment that claims a behaviour must point at
   a behaviour that exists, or say plainly that it does not yet.

   **And it binds `docs/TEST_MATRIX.md` hardest of all**, because that table is
   what everyone downstream reads instead of the tests. A row saying `pass` is a
   claim about a test, not the test. On a real run a row read *"signed URL is
   TTL-scoped and refused after expiry"*, cited a verify command, and was marked
   `pass` - and the file that command runs contains no occurrence of `ttl`,
   `expire` or `expiry` at all. Zero. For each row you verify: open the file the
   verify command actually runs and confirm it asserts what the row's own
   sentence promises. It does not, the row is a defect - rewrite the row to say
   what the test really covers, then open the gap as its own work item.
3. **Visual fidelity** [AUTO] (presence) + [VERIFIER] — each screen the phase
   ships has its **Playwright fidelity assertions** (element completeness +
   interaction behaviour) run GREEN and its screenshot captured for the human
   side-by-side glance, per `docs/gates/visual-fidelity.md`. The verifier RUNS the
   assertions — it does NOT LLM-compare two images, and an implementer's "matches
   export" self-claim is not a substitute.
   - **Component-presence is now AUTO** for every route in
     `scripts/fidelity-map.json`: `check-prototype-fidelity.mjs` fails the phase
     if a mapped screen does not IMPORT-from-shared + USE its required components
     (DataGrid/StatCard/PageHead-tabs/…), is missing a required section, or
     re-draws a grid as a raw `<table>`. This machine-blocks the RE-DRAW hole
     (build a look-alike by hand instead of adopting the export through existing
     components) — the worst Macro-2 defect class.
   - **Pixel/aesthetic match stays VERIFIER + human.** The machine proves the
     structural blocks are present; it cannot judge "looks like the export". So
     the verify-fidelity checkpoint still runs: OPEN the cited prototype
     `screens-*.jsx`, compare structure (KPI row / tabs / grid columns / sections)
     against the built screen, and glance the running screenshot (desktop + 375px)
     side-by-side with the prototype image BEFORE the phase closes
     (`docs/playbooks/build-execution.md` § Checkpoint verify-fidelity). This is
     verify-at-source for fidelity — a green `check-prototype-fidelity` is NOT a
     substitute for the glance.
4. **Negative path** — the phase's error/empty acceptance check(s) trigger the
   failure for real and the REAL cause surfaces in the UI (a generic message =
   FAIL, per the no-error-swallow floor rule).
5. **Type-specific categories (non-CRUD phase-types only)** — when the phase's
   `Phase-type` ≠ `crud`, the verifier ALSO exercises that type's categories
   against the running preview (`docs/mau-tai-lieu/build-manifest.md` § Non-CRUD
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
6. **Universal UI floor (every phase that ships or touches a screen)** — the
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
7. **Security floor (every phase that adds or touches an API route)** — authz is
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
8. **Index discipline (`crud` phases)** — any schema change indexes every
   foreign-key scalar + the common filter/sort columns; a schema-lint fails a
   relation scalar with no index. Keeps p95 (`NFR.PERF`) from degrading silently
   as tables grow, in-phase rather than discovered under load at go-live.
9. **Grid completeness floor — every data grid ships pagination + filter + sort.**
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
10. **Route reachability floor — no orphan routes, no dead internal links (every
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
11. **Seed coherence + prototype fidelity floor (every phase that seeds
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
12. **Build & migration hygiene (every phase — extends the boot-smoke past the API
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
13. **Create/edit dialog payload satisfies the server DTO — every create/edit form
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
14. **Record-lifecycle floor (any phase creating a row with a status/lifecycle
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
15. **i18n catalog + export integrity (every phase touching a message catalog, an
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
16. **Domain state-field integrity (any phase that reads/writes a domain time,
    deadline, capacity/count, or gating-state flag).** A domain quantity — an
    SLA/reminder clock, an expiry deadline, a capacity/remaining count, an
    is-confirmed flag — MUST live in a DEDICATED, single-meaning column the domain
    code OWNS and SETS explicitly, and a predicate MUST read the LIVE domain field —
    never an ORM-managed timestamp, never a column already meaning something else,
    never an immutable cap. Six shapes, each machine-checkable, each a phase FAIL:
    (a) **No ORM-auto timestamp as a domain clock** — a reminder/SLA/"days-since"
    calc MUST NOT read `updatedAt`/`createdAt` (Prisma `@updatedAt`, TypeORM
    `@UpdateDateColumn`, any auto-managed column): every row write silently resets
    the clock, so the cron that touches the row resets its own deadline and the
    D+5/7/10 reminder never fires. Lint (RED): grep domain time-diff logic
    (`differenceIn*`, `Date.now()-x`, `isBefore/isAfter` on a stored date) whose
    right-hand side is an ORM-auto column; the deadline needs its OWN explicit
    column (`slaStartedAt`/`dueAt`/`remindAfter`) written by the domain event.
    (b) **One column = one meaning (no semantic overload)** — a scalar written under
    ≥2 unrelated business contexts with divergent semantics is a defect
    (`Membership.expiresAt` reused as BOTH tier-expiry AND invite-TTL → a bulk
    tier-import expires in-flight invites). Lint: a column written from ≥2 feature
    modules with different meaning → split into two columns.
    (c) **Immutable cap is never mutated as a live counter** — a hard-cap/original-
    capacity column (`capacity`, `maxSeats`, `hardCap`) is immutable after creation;
    the live remaining/used count lives in a SEPARATE counter (`remaining`,
    `seatsUsed`). Decrementing the cap destroys the original capacity. Lint: no
    `UPDATE`/`.update({capacity: capacity-1})` on a cap-named column — the running
    total is its own field.
    (d) **Predicate reads the LIVE field, not the cap** — a gate/transition predicate
    ("slot ready", promote, "sold out?") reads the live remaining counter, NOT the
    immutable cap (`cap > 0` stays true when sold out → false 'slot ready'). Driven
    check: exhaust the counter to 0, assert the predicate flips.
    (e) **No sentinel/magic value in a free-text or human column** — a machine
    sentinel (`sla_overdue`, `__expired__`) written into a human free-text column
    (rejection-reason, notes) collides with real user text and is invisible to
    filters/counts; a state distinction gets its OWN status enum. Lint: no constant
    sentinel string assigned to a free-text/notes column.
    (f) **No premature state mutation before its gating confirmation** — a
    to-be-confirmed value (new email on `requestEmailOtp`, new phone) is staged in a
    PENDING field (`pendingEmail`) until the confirming event fires; overwriting the
    live `email` while `emailVerifiedAt` stays set publishes an unverified value as
    verified. Driven check: request the change, assert the live field AND its
    verified flag are unchanged until the OTP/confirm completes.
    The verifier runs the static greps (a/b/c/e) as a `lint:gates` rule and DRIVES
    (d/f) against the preview. Distinct from Leg-13 (which covers a lifecycle ENUM's
    TRANSITIONS — reuse/TTL/terminal); this covers WHICH column a domain time/count/
    flag lives in and whether predicates read the live one. Any shape is a phase FAIL.

17. **Object-level authz (IDOR) + negative-authz test floor (every phase that adds/touches a route reading or mutating a row addressed by an id/slug/token — read, resolve, status, approve, mint, export).** Leg-6 proves privilege LEVEL (unauth→401, under-privileged→403, route in the authz matrix); this leg proves object OWNERSHIP/SCOPE — two callers of the SAME role, one owning/in-scope the object and one NOT, must diverge. (a) **Scope is derived server-side from the authenticated principal, never from a client-supplied id/scope param** — the query filters by the principal's own ownership/tenant/party/approval, NOT by a body/query/header value the caller can devtools-edit (`context`, `partyId`, `eventId`, `ticketTypeId`, `ownerId`, `registrationId`); a handler that trusts a client id/context AS its authorization key, or that cross-wires one entity's id into another's ownership prop, is a FAIL. (b) **Every id-addressed read/mutation carries its ownership + scope predicate IN the query** (`WHERE id=? AND owner=<principal> AND status='approved' AND eventId=<scope>`), not a post-fetch `if` a resolver-merge/refactor can silently drop; a public/status/QR endpoint keyed on a raw numeric id returns only the owner-visible projection (no PII / QR / token / counterpart-record leak) or 404s a non-owned id — a 200 full-record on any guessed id is a FAIL. (c) **A negative-authz test ships per id-addressed endpoint — not happy-path shape only**: assert foreign-owner id → 403/404, out-of-scope id (wrong event/tenant/status) → 403/404, unapproved/guest principal → 403, and a non-existent id is indistinguishable from a forbidden one (same 404, no enumeration oracle). The verifier drives owner-A-creates → non-owner-B-requests-A's-id (and B-devtools-edits the scoped body field) against the running preview and asserts B is denied at BOTH the query and the response; a resolver whose only tests are happy-path shape is a FAIL. Any of (a)–(c) failing is a phase FAIL. Distinct from Leg-6 (role/grant privilege level) and from the Leg-6 UI-reflects-authz corollary (control visibility) — this is per-OBJECT ownership between same-privilege callers. **(Absorbs the response-projection-overexposure residue via (b)'s owner-visible-projection / no-PII-on-wire clause: a raw Prisma model returned without a `select` allowlist, or PII gated only client-side, is caught here as a full-record leak on the wire.)**
18. **Per-route rate-limit classification (every phase that adds/touches an API route) — the global per-IP bucket is the FLOOR, not the whole story; specific route CLASSES need their own tighter, differently-scoped throttle.** Leg-6's baseline per-IP throttler is asserted-once and does NOT cover four recurring gaps, all seen: (a) **public unauthenticated PII/enumeration/verify routes** (register, status-lookup, QR/OTP-resend, cert-verify) MUST carry an explicit tight `@Throttle` — "the global throttler covers it" is false; an unthrottled `@Public()` route is a PII-harvest + resend-amplification vector. (b) **paid-outbound / external-cost routes** (send SMS/ZNS/email, bulk send-welcome, a confirm-transfer that calls a paid provider + writes audit) MUST carry a **per-actor AND per-target amplification cap, NOT merely per-IP** — one authed admin at one IP stays under the IP bucket while firing 10k paid sends, so a per-IP limit provably does not stop the bomb. (c) **mutating write routes with external side-effects** (audit writes, provider calls, money movement) carry a per-route throttle, never relying on the global bucket alone. (d) **poll-interval-vs-throttle budget** — for every client that polls (progress/status), the poll interval's implied req/min MUST fit UNDER the route's throttle budget with headroom for concurrent tabs; a 1.5s poll (40 req/min) against a shared 60/min IP bucket starves legit users into intermittent 429s. Machine-check: grep each new route's decorators, CLASSIFY it (public-unauth / paid-outbound / mutating-side-effect / poll-backing) from its `@Public`/path/provider-call/frontend-poller, and assert the class-appropriate `@Throttle` (or an explicit `@SkipThrottle` + one-line justification in the phase block) is present and scoped to actor/target where the class demands. A "reuse route X's throttle" that resolves to a route with NO throttle is a FAIL. For poll-backing routes, parse the frontend poll interval and assert `60000/interval_ms × expected_tabs ≤ route_throttle_limit`. An unthrottled public/paid/mutating route, a per-IP-only cap on a paid-outbound route, or a poll interval exceeding its route budget is a phase FAIL — abuse-control is verified per-route in the phase that adds the route, not deferred to the 2.9 security sign-off. (Extends Leg-6's asserted-once baseline from a global floor to a per-route classification.)
19. **Session-lifecycle & OTP-purpose integrity (every phase touching auth session state — user disable/ban, role-revoke, credential/password change, impersonation/act-as, token issue/rotate, trusted-device/remember-me/"skip-OTP" records, or OTP issuance; driven against the RUNNING app, never assumed from the diff).** Five shapes, each a phase FAIL: (a) **revoke-on-change is COMPLETE across ALL session vectors** — any action that terminates or downgrades access (disableUser, ban, role-revoke, force-logout, password/credential reset) invalidates EVERY persisted access vector for that user, not just the one the author remembered: refresh-token families AND trusted-device / remember-me / OTP-bypass records AND any access-token allow-list. Give a user an active refresh token + a trusted device that skips OTP; run the disable/revoke; assert BOTH the old refresh token now 401s AND a login from that device STILL requires OTP (the trust record was cleared) — a trust cookie that bypasses OTP after disable is a FAIL. (b) **credential change logs out the prior holder** — an email/phone/password mutation revokes all OTHER live sessions + trusted devices (minimum: every session except the one performing the change) so a thief who changed the credential cannot leave the victim logged in; assert a second still-open session (or the pre-change refresh token) is 401 after the change. (c) **security-affecting custom claims survive rotate()/refresh** — every claim that changes authority or attribution (impersonatedByUserId/act-as, tenant/org scope, elevated-role flag, mfa-satisfied) is re-derived and re-threaded through the SAME rotate()/signAccess path a silent refresh uses, not only the initial sign; start impersonation (or set the claim) → force/await one token refresh → assert the impersonation banner + audit attribution + scoped access are STILL present (claim not silently dropped mid-session). (d) **OTP records carry a PURPOSE discriminator** — an OTP row/key is (userId, channel, PURPOSE), never (userId, channel), so concurrent flows (login, password-reset, contact-change, step-up) don't clobber each other and verifying a code consumes only its own purpose; request two OTPs of different purpose on the same user+channel and assert verifying purpose-A neither consumes nor satisfies purpose-B, and a purpose-A code cannot be replayed against a purpose-B challenge. (e) **session-cookie Path is a prefix of the endpoint that reads it, proven in a REAL browser** — the refresh/session cookie's `Path` attribute must be a string-prefix of the FULL mounted path of the route that consumes it (`Path=/auth` is NOT sent to `/api/auth/refresh`; include the global API prefix); the check drives the actual silent-refresh round-trip in a browser (permissive test cookie-jars hide it) and asserts the refresh request CARRIES the cookie and returns a rotated 200 — a refresh that 401s because the cookie was never sent is a FAIL even with green e2e. Distinct from the canonical-e2e cookie-scope split-brain case (WHICH cookie is read across two writers at different scopes) — this leg is session REVOCATION completeness, OTP purpose-keying, custom-claim survival on rotation, and cookie-Path routing.
20. **Canonical field-validator + unique/consistent identity-key floor (any phase that validates a shared business field — phone, email, tax-code, slug, national-id — or writes/dedups/tokens a row by an identity key; static schema+source lint + a driven cross-path check at Leg-1).** Kills two recurring shapes, both driven against the running app, never assumed from the diff: (A) **divergent field validators** — a field carrying a business-format rule has EXACTLY ONE canonical validator/regex, exported from a shared module (`packages/validation` / a shared Zod schema) and imported by EVERY write path (self-edit, admin-edit, public signup, bulk-import, seed, the DB CHECK). A lint greps for ≥2 distinct regex / Zod / class-validator definitions constraining the SAME field and RED-fails on divergence; the verifier drives the SAME value (e.g. a `+84`/`0` phone, a spaced/uppercased email) through two write paths (self vs admin) and asserts IDENTICAL accept/reject — a value accepted in self-edit but 422'd in admin-edit, or accepted at write then thrown-on downstream, proves the paths disagree and is a FAIL. (B) **non-unique / inconsistent identity key** — any key feeding an `upsert` / `ON CONFLICT` / `findOrCreate` / dedup / `{scope}:{id}`-token builder maps to a DB column carrying a REAL `@unique` (plus `NOT NULL` when it IS the dedup key): a schema-lint fails a dedup/upsert-key column with no matching unique index. A dedup/auto-create keyed on an optional or non-unique column (auto-create User on raw `email` while the `@unique`+`NOT NULL` constraint and blind-index actually live on `sdt`; `guest:{sdt}` used as an `ON CONFLICT` key where `sdt` is nullable/duplicable) silently MERGES two distinct people into one account/QR or SPOOFS an existing one. AND the identity key for one entity is built by ONE shared key-builder symbol, not divergent literals across paths — a grep asserts no ad-hoc `` `guest:${...}` ``/`` `user:${...}` `` template keys for the same entity in >1 file (a cart path writing `guest:{sdt}` while `attendeesJson` reads `user:{id}` zips the wrong name onto a QR). The verifier drives it: two records that SHOULD be distinct (same phone, different person; or the two divergent key paths) yield TWO rows / TWO correctly-attributed tokens, never one merged/mis-named. Any of — >1 validator for a field, a dedup/upsert key on a non-unique or nullable column, or >1 key-builder shape for one entity — is a phase FAIL. Distinct from Leg-12 (one form's payload vs its own DTO) and Leg-13 (lifecycle reuse of an already-OPEN row); this is the KEY's real uniqueness + the validator/key CONSISTENCY across all paths, not open-row reuse.
21. **Concurrency & write-path atomicity (any phase whose write-path enforces a uniqueness / capacity / one-open / ordinal / "only-one-running" invariant, drives a lifecycle transition from a cron / webhook / timeout, or opens a modal that fetches-on-open).** Green SEQUENTIAL tests (Leg-13's remount reuse, an idempotency-key) do NOT prove the guard survives two concurrent actors; the async/webhook legs cover only INBOUND callbacks — this leg drives the race on the internal write-path + crons. Three teeth, all mined: (a) **check-then-act is atomic, not TOCTOU** — for every guard of shape `count()/findFirst()/findUnique() → if → create()/external-call` (double-click confirm both firing a SePay call, per-slot `count()>=cap` then `create()`, waitlist `position=count()+1`, mail-blast "only one running" SELECT-then-INSERT), the verifier fires the SAME mutation TWICE concurrently (`Promise.all` of two identical requests) against the running preview and asserts EXACTLY ONE effect — one row, one external call, one winner; ≥2 is a FAIL. The invariant MUST be backed by a DB constraint (`UNIQUE` / partial-unique index / `EXCLUDE`) OR a transaction with a locking read (`SELECT … FOR UPDATE` / serializable) — a bare count/find→create outside a tx-or-constraint is RED on static grep even if the probe happens to win that round. (b) **lifecycle transitions from crons/webhooks/timeouts are CONDITIONAL** — every `update` that flips a status enum in a scheduled/inbound path carries the expected current state in its `where` (`where:{id, status:'pending'}`) or a version/`updatedAt` CAS guard; an unconditional `update({where:{id}})` on a row LOADED EARLIER (payment-timeout cron cancelling a row a webhook set `paid` in between; refresh-rotation revoking on a stale check → false token-theft) is a FAIL — assert the interleaving leaves the winning state, not the last-writer. (c) **modal/panel fetch-on-open guards stale responses** — any effect that fetches on open / param-change and `setState`s the result uses an `AbortController` (or a request-sequence / ignore-stale token) so a slow earlier response cannot overwrite a newer one; a fetch-on-open with no abort in an admin modal/detail panel is RED. Any of (a)–(c) is a phase FAIL. Distinct from Leg-13 (sequential remount idempotency) and Leg-4/async webhook legs (inbound-callback keys) — this is the CONCURRENT internal write-path + cron race.
22. **Process & request resilience floor (every phase adding/touching an API route, a DB write, or an in-process fan-out loop).** The API must survive a runtime fault WITHOUT terminating, and never leak DB internals or 500 on a valid request. Four machine checks, driven against the running preview + a grep pass — distinct from Leg-6 boot-smoke (STARTUP crashes only), async-job-queue (BullMQ workers, not the API process nor the in-process loop) and Leg-13d (DB row-state after a fault, not process survival). (a) **No floating promise crashes the process** — every fire-and-forget async call in request scope (a broadcast/notify loop `.then()` with no `.catch`, an `await`-less service call) is awaited OR carries a terminal `.catch` that logs-and-swallows; and the bootstrap registers a last-resort `process.on('unhandledRejection')`/`uncaughtException` that logs WITHOUT `process.exit`. Verify: inject a rejecting downstream (a DB blip / a throwing notify) on a fire-and-forget path → the process stays up and the NEXT request still 200s; a Node terminate → every request 502 is a FAIL. Lint: grep handlers/services for a bare `.then(`/un-awaited async call with no `.catch` in request scope. (b) **DB known-errors map to the right HTTP status via a GLOBAL exception filter, not per-method try/catch** — a Prisma `PrismaClientKnownRequestError` filter maps `P2002`→409, `P2025`→404, `P2003`→409/422, and NEVER surfaces the raw error (column name, SQL, stack) to the client. Verify by driving a real duplicate-value submit through EVERY create AND update path (a bare `update()` whose try/catch exists only in `create()` returns a raw 500 leaking the unique column) → assert 409 + a clean message, 0 responses carrying `column`/`prisma`/a stack. A per-method catch a sibling write-path lacks is a systemic-sweep FAIL (pairs with code-review systemic-pattern sweep). (c) **Never re-query a failed transaction client (25P02)** — inside an interactive `$transaction`, a caught constraint error must NOT be followed by another statement on the SAME tx client (Postgres aborted it → `25P02 current transaction is aborted` → 500 on a VALID retry); dedupe via `upsert`/`ON CONFLICT` or BEFORE the tx, or let the error propagate and retry a FRESH tx. Verify: a concurrent double-submit hitting a unique index returns one 2xx + one clean 409, never a 25P02 500. (d) **Graceful shutdown drains in-flight, idempotently** — `app.enableShutdownHooks()` / a SIGTERM handler stops accepting new requests, finishes in-flight, closes DB/queue before exit; an in-process fan-out (email/notify blast) is moved to the durable queue (`async-job-queue.md`) OR checkpoints per-item so a SIGTERM mid-loop + restart resumes WITHOUT re-sending already-processed recipients (per-recipient sent-marker, not "re-run the whole loop"). Verify: SIGTERM mid-blast → restart → already-sent recipients are not re-sent. Any of (a)–(d) failing is a phase FAIL.
23. **Multi-instance state safety (every phase that adds a service-held cache/dedup/candidate store, a `@Cron`/`@Interval`/`@Timeout` scheduled handler, or a cache key for per-scope data; the acceptance preview/deploy runs ≥2 API replicas so the verifier can PROVE it, not assume single-box).** The single-box preview hides three defects that only bite under the client's real multi-pod deploy — all machine-checkable: (a) **Request-spanning state in a process-local field** — any state WRITTEN on one HTTP request and READ on a later one (OTP/contact-change candidates, pending-confirmation tokens, short-lived dedup entries) held in a singleton `@Injectable()` field (`private x = new Map()/new Set()/{}`) is process-local: a follow-up request routed to a different replica sees an empty store → the correct OTP/token is rejected non-deterministically. Such cross-request state MUST live in a shared store (a DB row or Redis with TTL), never a service field. Lint: flag a mutable `Map`/`Set`/plain-object class field on an injectable that is both mutated and read in distinct handlers — RED unless it is a pure derived/immutable-at-boot cache (config, compiled templates) that never holds request state. (b) **Scheduled handler with no distributed lock** — every `@Cron`/`@Interval`/`@Timeout` method fires on EVERY replica, so the job double-runs (duplicate emails/charges/transcodes) or, with naive in-process dedup, mis-coordinates. Each scheduled handler MUST claim a cross-instance lock before doing work — Postgres advisory lock (`pg_try_advisory_lock`), Redis `SET NX PX`, or a `SELECT … FOR UPDATE SKIP LOCKED` row-claim — so exactly one replica executes each tick. Lint: every scheduled-decorator method body must reference a lock/claim helper; a `@Cron` handler with none = FAIL. (c) **Cache key missing a scoping dimension** — a cache/memo key for per-user/per-tenant data must include EVERY dimension the value varies by; a key `eventId:supplierId` for slots that also vary by `buyerUserId` serves one buyer another buyer's data (cross-tenant leak). Review/lint: each cache `.get`/`.set` key template for scope-varying data carries its user/tenant/org id — a missing dimension = FAIL. **Verifier proof (runtime, not static-only):** the acceptance preview runs ≥2 API replicas behind the proxy (or the verifier drives the flow twice forcing cross-replica routing); it exercises the stateful round-trip end-to-end — request the OTP/candidate on one call, confirm on the next — and asserts it succeeds every time; a non-deterministic reject, a cron that fires per-replica, or a cache read returning another scope's data is FAIL, fixed in-phase. This moves the "green on my single box, breaks on the client's 2-pod deploy" defect out of go-live and into the phase.
24. **FE↔BE contract fidelity — the field a component reads or sends actually exists on the other side, and no derived value renders NaN/undefined/raw-key (every phase wiring a FE call to a server route; driven against the RUNNING preview + a static contract diff).** Leg-12 covers the create/edit request BODY vs the create DTO; THIS covers the READ response the FE consumes AND non-dialog action payloads. Kills four shapes, all seen: (a) **response-field drift** — a component destructures/reads `res.<key>` (`totalAmountVnd`,`boootCount`→`boothCount`,`data.total`) that the endpoint's serializer/response type never returns (server sends `totalAmount`,`booths[]`,`{items,nextCursor}`) → `Tổng: NaN VND`/`undefined gian hàng`/`Tất cả · undefined`; machine-check by grepping the fields the CALLING component reads and diffing against the response DTO/serializer the route ACTUALLY returns — a shared type or generated client is the single source of truth, and a read of a key absent from the produced shape is RED; (b) **non-dialog action-payload drift** — every action/bulk/toggle button (batch-print, mark-all, status-flip) POSTs a body whose keys satisfy the server handler schema; DRIVE it against the preview and assert a real 2xx + observable state change, never a silent no-op (a `{eventId,mode}` body against a `registrationIds[]`-required `BatchPrintSchema` = FAIL); (c) **response fails its OWN shared schema** — an endpoint whose payload is parsed by a shared Zod on the client (`invite-preview` returning `inviteeEmail:''` vs `z.string().email().optional()`) must return values that PASS that schema; assert the route's real response parses clean — a served value that throws at the consumer is RED; (d) **unguarded derived-value render** — the running preview renders NO literal `NaN`/`undefined`/`null`/`[object Object]`/raw i18n-or-enum key in a value position on ANY phase screen (Playwright `innerText` regex scan over every rendered screen), and every numeric/date derivation guards invalid input BEFORE render (`new Date(garbage).getTime()` → `Còn NaN ngày` is a FAIL). Any of (a)–(d) is a phase FAIL. Distinct from Leg-8 (read-side `pageSize.max` GET-query 422) and Leg-12 (create/edit request body vs create DTO).
25. **Seed reseed-idempotency floor (every phase whose seeder writes rows — distinct from Leg-10's single-run coherence and from seed-data-pattern's FK-order/determinism; this proves the seeder CONVERGES across N runs + partial failures).** The verifier runs the seed script TWICE back-to-back against the same DB, snapshots `SELECT count(*)` for every seeded table after each run, then runs it a THIRD time after a forced mid-seed abort (kill after the first child table), and asserts: (a) **row counts converge — every table's post-run-2 count == post-run-1 count**; a keyless `create()`/`createMany()` with no natural key that duplicates N rows on every reseed is a FAIL — the fix is a natural/composite unique key + `upsert`, NEVER a table-level `count()>0 → return` early-exit (that freezes the row-set, hides drift, and is banned by (d)); (b) **the 2nd run exits 0 — no P2002/unique-constraint/duplicate-key crash**; folding two seeders that both write the same natural key (same MST/slug/email/blind-index) must dedupe to ONE upsert, not two racing inserts on a unique index; (c) **rename leaves no orphan** — mutate a seeded row's natural key in the source and re-run: the old-key row must NOT persist beside the new one (an upsert-BY-that-mutated-key CREATEs a duplicate + orphans the old row); the seeder keys on a STABLE surrogate id (or deletes-missing / reconciles), so the seeded set == the source set exactly, count-exact; (d) **the reseed guard is PER-ROW, not per-table** — presence is decided by `upsert`/`findUnique`-on-natural-key row-by-row, never a whole-table `count()>0`/`isEmpty()` gate (a partial first run leaves a permanently half-seeded DB the count-gate then refuses to complete); the forced-abort re-run MUST end fully seeded; (e) **cross-seeder FK deps resolve or fail LOUD** — a seeder resolving a parent via `findFirst({…})`/`findUnique` asserts the row EXISTS and THROWS a clear "run <parent> seeder first" when null, never silently seeds a null-FK/empty child (a `findFirst({phoneVerified:true})=null` author → silent-empty comment set); seed order is explicit per seed-data-pattern and a null lookup is a hard error, not a skipped row. Any of (a)–(e) is a phase FAIL exactly like a functional AC. (Leg-10 proves ONE run is coherent + faithful; this proves the seeder is RE-RUNNABLE — the two are orthogonal and both required.)
26. **Notification / template render + fan-out integrity (every phase that emits a transactional notification — email/SMS/Zalo/push — or renders a server-side template with a merge context; runs against the RUNNING preview, capturing each send via the dev sink e.g. Mailpit `/api/v1/messages` or a template-preview route).** A machine check blocks the phase when: (a) **an unresolved merge token survives render** — render EVERY template with a representative context for EACH type/enum/product-variant branch it serves; the output still contains a `{{…}}`/`{{{…}}}`/`${…}` token, OR a literal `undefined`/`null`/`NaN` or an empty span where a REQUIRED merge field sits (a hardcoded `{{perks.gala}}` that renders empty for the `vip`/`standard` branch, OR a reused order template whose `{{orderId}}` is NULL for a standalone-registration caller → `Mã đơn:` blank — both RED); derive the required-field set from the tokens the template body references, NOT the happy-path caller. (b) **a shared renderer is unsatisfied by SOME caller** — grep every caller of the shared `render(templateId, ctx)`; each must supply every token the template references OR the template must guard the absent token with a conditional (`{{#if orderId}}`), never emit a bare merge — a renderer reused across contexts with a field only one caller populates is RED. (c) **a content override is ignored** — when a caller passes a subject/body/message override (or selects a non-default `templateId`), the RENDERED output CONTAINS the override text and does NOT render the template's default copy; a placeholder template whose Handlebars body hardcodes the original copy and drops `context.message` is RED (assert by string-match on the rendered output, not on the call args). (d) **fan-out is not aggregated** — a single business event spanning N children (multi-item order, multi-booth booking, batch enrollment) emits exactly ONE aggregated notification per (recipient, parent-event) that itemizes all N lines, NOT one-per-child; assert the sink send-count equals distinct parents, never N (10 booth-emails for one paid order is RED). Any of (a)–(d) is a FAIL. Distinct from Leg-14 (on-screen next-intl `t()` catalog ICU-compile) — this is the OUTBOUND server-rendered template system (Handlebars/MJML/react-email) + its send shape; distinct from Leg-13(d) (orphan lifecycle rows) — this is the recipient-facing render + aggregation, not row terminality. Pairs with `external-integration.md` (the transport/provider mechanics this content rides on).
27. **Test-integrity floor (every phase that adds or relies on a test — unit, integration, or E2E; the verifier AUDITS the test suite itself, not just its green result, because a green suite that proves nothing or proves the bug is worse than no test — it forges the coverage record the DoD "≥1 passing E2E per REQ-ID" trusts).** The verifier blocks the phase when any holds: (a) **a spec never executed** — the executed-test count from the recursive run (`pnpm -r test` across EVERY workspace, or the equivalent all-packages runner) is < the committed `*.spec.*`/`*.test.*` count: a file outside the runner's include glob, an un-added/unbuilt workspace, or a `.only`/`.skip`/`xit`/`it.todo`/`describe.skip` sitting on a REQ-mapped test → CI-green while that path never ran; the CI script runs the recursive suite, not a single package. (b) **a placeholder / tautological assertion stands in for coverage** — `expect(true).toBe(true)`, `expect(1).toBe(1)`, an `it()`/`test()` body with ZERO `expect`/`assert` calls, or a lone `toBeDefined()`/`not.toThrow()` on a TC a REQ-ID maps to; a `// documents:`-style comment is not an assertion. (c) **a self-confirming test mirrors the code under test** — the expected value is built by RE-CALLING or RE-IMPLEMENTING the exact production transform being tested (an HMAC helper re-stringifying via the same code path, an expected hash computed by the signer under test) so the test asserts whatever the code does, bug included; the oracle MUST be independent — a hand-written literal, a known-good vector, or the provider's documented sample — never the SUT's own output fed back. (d) **a fixture, credential, or route is not the real one** — a test persona logs in with a credential the RUNNING app actually authenticates as the intended role (no flag-off dev-bypass login, no `admin@x.test/111111` shortcut when that path is disabled, superadmin = the true top-role seed), and an integration/E2E targets the REAL mounted path grepped from the controller's route constant (not a hand-typed `/api/sepay/webhook` when the app mounts `/api/webhooks/sepay`) with the provider's REAL auth scheme. Machine-check: grep the placeholder-assertion set; diff executed-vs-committed spec counts + grep `\.only|\.skip|xit|\.todo`; grep each test helper for an import of the SUT symbol it derives its expected from; assert each E2E route string ∈ the app's registered routes and each test login uses a seeded credential the running auth path accepts. Any of (a)–(d) is a phase FAIL — the test is rewritten to prove real behavior, the count never fudged.
28. **Prod-image packaging + runtime-capability floor (every phase that touches the Dockerfile / prod image, a package manifest's deps/peerDeps, a monorepo workspace-package import, or a documented prod/ops runbook or CMD/entrypoint command — plus once at build-manifest completion).** Green `pnpm build` + AppModule boot-smoke (Leg-11a; DoD boot-smoke) run in the FAT monorepo tree where every dep is hoisted and every dev-tool present — they never exercise the PRUNED multi-stage RUNTIME image the box actually runs, and go-live Rule 2 verifies the box only AFTER deploy (a crash-loop discovered reactively as health-red, not blocked in-phase). The verifier BUILDS the real prod image and boots it in an ISOLATED container (no bind-mount of the repo `node_modules`, on its own docker network), asserting: (a) **every runtime require/import resolves in the pruned image** — a `@scope/shared-types` workspace symlink, a transitive PEER dep resolved only via workspace hoist (`@react-pdf/renderer`→`react`), or any prod dep dropped by `--prod`/`prune`/standalone-copy that the code loads → `Cannot find module` at boot; boot the image and require `/health` `.status==ok` reached from OUTSIDE, never a `docker exec` back into the dev tree. (b) **The runtime stage copies what runtime needs, not only `apps/<svc>/node_modules`** — for a monorepo the workspace-package's own built output + its deps are present in the final stage; assert each `node_modules/@scope/*` symlink target is a real directory, not dangling. (c) **The server binds a container-reachable interface** — a Next `standalone`/framework server that defaults to `localhost`/`127.0.0.1` sets `HOSTNAME=0.0.0.0` (or `--host 0.0.0.0`) in the runtime stage, verified by hitting the port from a SIBLING container on the same network, not from inside. (d) **Every command a prod/ops runbook, migration, backfill, or CMD/entrypoint invokes exists in the image or on the host that runs it** — `tsx scripts/backfill.ts` fails when the image ships only `dist/`+`prisma` and stripped `tsx` (compile the script to `dist` or keep the tool a real prod dep); a host-side `pg_restore`/`pg_dump --list` step names `postgresql-client` as a provisioned prerequisite, not assumed on the app VPS. Any of (a)–(d) is a phase FAIL. Distinct from Leg-11a (fat-tree `next build` exits 0) and go-live Rule 2 (verify-at-source after deploy) — this boots the pruned artifact BEFORE the box does.
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
  (`docs/about/TEST_MATRIX.md`, `Result: pass`) for the acceptance run. Recorded in
  one small `test(<scope>):` commit citing the TC token — the verification
  event is distinct from the phase's implementation commit, so the
  stage-boundary-commit atomicity rule is not violated.

### Bằng chứng của chính verifier - vì một phán quyết cũng là một lời khai

Cổng này tin phán quyết của verifier y như người ta từng tin một dấu test xanh. Không có gì
kiểm lại **chính nó**.

Đo được trên một lượt chạy thật: verifier vòng 1 phán `FAIL 17/20`, báo cáo dài 250 dòng,
tự khai "~45/60 lượt" - và thực tế gọi **8 lượt công cụ**, ít hơn cả số REQ-ID nó nhận kiểm,
trong khi chỉ riêng việc mở 20 khối khai báo SRS đã tốn hơn thế. Báo cáo **không trích một
lệnh nào đã chạy**, dù hợp đồng ngay phía trên đòi kiểm *trên app đang chạy, không phải đọc
diff rồi suy*.

Ba cái FAIL của nó đều thật - kiểm lại bằng tay xác nhận cả ba. **Nhưng 17 cái PASS thì
không có bằng chứng nào phía sau.** Trạng thái thật là *"3 lỗi đã xác lập, 17 CHƯA KIỂM"*,
không phải *"3 lỗi, 17 đạt"*.

Đây là đúng con bệnh ở mục 2, dịch lên một tầng: một agent được cử đi tìm những phép kiểm
khai nhiều hơn thứ chúng khẳng định, tự nó khai nhiều hơn thứ nó làm.

**Nên phán quyết phải mang bằng chứng, và verifier phải được phép nói "chưa kiểm được":**

- **Mỗi REQ-ID một dòng bằng chứng:** hoặc **lệnh đã chạy kèm kết quả**, hoặc `file:line`
  đã mở. Không có bằng chứng thì trạng thái là `unverified`, **không phải `pass`**.
- **`unverified` là kết quả HỢP LỆ và được khuyến khích.** *"Tôi kiểm được 14/20, đây là 6
  cái tôi không với tới và vì sao"* là một phán quyết tốt. **Một chữ PASS trải đều trên
  bằng chứng mỏng thì không.**
- **Người gọi phải đối chiếu công sức với bằng chứng** trước khi nhận phán quyết: số lệnh
  đã chạy, số file đã mở, so với số REQ-ID nhận kiểm. Lệch quá xa thì phán quyết đó chưa
  dùng được - chạy lại, đừng đọc lướt rồi tin.
- **Issue gom nhiều REQ-ID không được gom bằng chứng.** Từ P3 một issue mang cả nhóm con
  (`STAGE_GOALS.md` § 2.6), nên "một dòng bằng chứng cho cả nhóm" trở thành mặc định tiện
  tay - cấu trúc issue không còn tự đẩy verifier tách ra nữa. Vẫn phải **một dòng cho từng
  mã**. Đã thấy dấu hiệu ngay ở vòng P1 khi issue còn 1-1: năm mã lưu trữ dùng chung một
  dòng, `IF.JOBS.06` xuất hiện đúng một lần.
- **Vòng sau KHÔNG kế thừa `pass` của vòng trước.** Sửa xong thì mọi REQ-ID mở lại từ đầu;
  một `pass` không bằng chứng mà được mang sang vòng sau thì nó thành sự thật vĩnh viễn
  bằng cách không ai kiểm.

Lý do phải viết ra: **PASS trải đều là đầu ra RẺ NHẤT.** Không có gì phân biệt nó với việc
làm thật, thì nó là thứ sẽ xuất hiện - không phải vì ai gian, mà vì không có sức ép nào
theo hướng ngược lại.

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
columns) plus the TC-NNN rows in `docs/about/TEST_MATRIX.md`. This gate file defines
the mechanic; it is not filled per project.

> Relationship to the end-of-manifest gates: 2.7 (review), 2.8 (e2e from BA
> docs), 2.9 (security), 2.10 (QA/DoD) still run — but as **whole-system
> aggregation** (cross-phase interactions, security posture, full coverage
> proof), no longer as the first place a per-phase defect can be caught.

## Điều kiện issue (máy kiểm được)

Phase chỉ được tính xong khi `node scripts/check-issue-coverage.mjs --phase P<n> --closing`
**xanh**. Ba điều nó kiểm:

1. Mọi REQ-ID **trong phạm vi** của phase có **>=1 issue** nhắc tới nó.
2. Mọi issue đó gắn **milestone `Phase <n>`**.
3. Không issue nào còn ở trạng thái mở đầu (`Backlog`, `Ready for Dev`) khi đóng phase.

Cổng này **fail-closed**: phase có REQ-ID mà tìm ra 0 issue là ĐỎ (đọc hỏng, không phải
"phase không cần issue"), và không đọc được trường org `States` cũng là ĐỎ.

Vì sao thêm: một lượt chạy thật đi hết 2.0..2.4 với **0 issue trên repo** mà không cổng nào
đỏ - `issue%` được dựng ra để đo đúng chuỗi `REQ-ID -> issue -> test -> UAT` và đứng yên ở 0
suốt bốn lần đo. Macro 3 chạy bằng issue-pipeline, nên phase đóng mà không có issue nghĩa là
go-live xong không có gì để bàn giao.
