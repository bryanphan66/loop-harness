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
     via signed-URL/CDN (unentitled fetch denied); progress/status surfaced;
     renditions cleaned on delete; **streaming NFR asserted HERE — player
     first-byte within budget, signed-URL entitlement, multi-bitrate present**
     (not deferred to 2.11) (`docs/playbooks/media-pipeline.md`).
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
