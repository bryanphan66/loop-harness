# Canonical E2E Flow Playbook

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Phase-typed shape for designing E2E tests that mirror real user journeys. Each
> test cites its **TC-NNN**; one journey per file. Owns Build & Go-live **step
> 2.8** (E2E from BA acceptance criteria).

**Macro-stage / step:** Build & Go-live · 2.8 (after 2.7 review, before 2.9
security). **Gate it serves:** every REQ-ID → ≥1 passing E2E + a TC-NNN row (RTM
forward completeness toward ACCEPTANCE).

> The 4 flow types + TC grammar below are authoritative.

## Engine

- **Fast path:** `ck-e2e-flow` (per phase auto-generates canonical E2E happy-path
  cases + realistic demo data + an SVG flow diagram; owns the Build-side scenario
  expansion; Pre-Build risk discovery stays with `scenario-taxonomy-playbook.md`).
  Pairs with `ck-scenario` for edge cases.
- **Role:** QC/QA. **Bare-agent fallback:** the `tester` agent writes the E2E
  files by hand from the 4 skeletons below + the seed IDs. Per D1 the skill is an
  accelerator.

**Tests are written from BA acceptance criteria (use-cases + scenarios), NOT from
the code** — the source is the BA bundle (1.7) and scenarios (1.8), not the
implementation.

## When To Run

- Per phase, after the SC-NNN are stable and before writing the E2E files.
- When refactoring an E2E suite that degraded into step-by-step assertions instead
  of journey-based ones.

Skip when the lane is tiny — unit + integration is sufficient.

## Flow Types

Pick ONE per E2E file. Mixed files become hard to debug and cap out on assertion
noise.

| Type | Shape | Use when |
|---|---|---|
| Form | Render → fill → submit → assert visible result + persisted state | Single screen input → output (signup, settings save, role update) |
| Workflow | Multi-screen sequence representing a user goal across N steps | Task spans ≥2 screens (checkout, onboarding, approval chain) |
| Readonly | Navigate → assert state matches expected snapshot | Dashboards, reports, search results — no mutation |
| Mixed | Workflow that includes one readonly verify step | Complete a workflow, then jump to a dashboard to verify the result |

## Per-Type Skeleton

### Form

```pseudo
test "TC-001 — manager updates own profile name":
  given: logged in as manager (seed user `seed-manager-1`)
  when:  navigate to /settings, fill name="New Name", click Save
  then:  assert toast "Saved"
         assert DB row users.id=<seed-manager-1>.name == "New Name"
  proves: IF.PROF.01
```

### Workflow

```pseudo
test "TC-007 — member role update + audit log entry":
  given: logged in as manager
  steps:
    1. Navigate to /team
    2. Click member row
    3. Select role=admin from dropdown
    4. Click Confirm
    5. Navigate to /audit
  then:  assert audit row "role-changed by <manager>" visible
         assert member's role badge in /team shows "admin"
  proves: IF.RBAC.03 (SC-002)
```

### Readonly

```pseudo
test "TC-010 — dashboard shows current period numbers":
  given: seeded period data via `seed-period-q1`
  when:  navigate to /dashboard
  then:  assert kpi "Active users" == 142
         assert chart series count == 3
  proves: RP.DASH.01
```

### Mixed

```pseudo
test "TC-015 — invite teammate then verify in roster":
  given: logged in as admin
  steps:
    1-4. (Workflow) Open invite dialog, enter email, send
    5.   (Readonly) Navigate to /team, assert row appears
  proves: UM.INV.01
```

Each test header cites its **TC-NNN** (global counter) and the REQ-ID it `proves`
(+ the SC-NNN if it proves a specific scenario). The composite `US-NNN.TC-MMM`
form is **not used** (D3).

## Mandatory Coverage Rules

Happy-path journeys alone do NOT satisfy 2.8. Two coverage rules are hard
requirements — the DoD E2E line reads them:

### 1. Negative-path for every operation that can fail

Every user-facing operation with a realistic failure mode — **AI/generation
calls, tier/quota-gated features, payment, external providers, permission-gated
actions** — MUST have ≥1 e2e that **triggers the failure** (lower-tier user,
exhausted quota, provider error/mock-reject, invalid payment) and asserts:

- the operation fails *gracefully* (no crash, no stuck spinner), AND
- **the REAL cause surfaces in the UI** — assert on the specific message
  (e.g. "model X requires plan Y"), NOT on a generic error string. A test that
  passes on "something went wrong" proves the swallow, not the surfacing.

```pseudo
test "TC-021 — basic-tier user generating with a pro-only default":
  given: logged in as basic-tier user (seed `seed-basic-1`)
  when:  trigger generate on a feature whose default model is pro-gated
  then:  assert job completes on the tier-valid fallback model
         OR assert the visible error names the tier restriction + the allowed model
         assert NO generic "something went wrong" text
  proves: <REQ-ID> (SC-NNN)
```

(Evidence: a run's e2e suite exercised only happy paths; real tier-gate errors
reached users as a generic toast and every gated sibling feature was broken —
found only in manual UAT. auto-script Macro-2, systemic tier-model fix leg.)

### 2. Every auth method proves login → real data loads

For **EVERY auth method the app ships** (OAuth, OTP/passwordless, password,
admin login), ≥1 e2e that logs in AND then loads **real authenticated data** —
assert the post-login screen's data calls return 200 and render actual
values/empty-states. "Reached the dashboard route" is NOT proof: an SSR gate can
pass on a dead cookie while every API call 401s.

Plus **one cookie-hygiene case per app**: on the SAME browser profile, log in
via method A, log out, log in via method B → assert data loads (no stale-cookie
shadowing, no 401s).

**Single cookie-scope authority note (for the implementation this tests):** the
app should have exactly ONE writer and ONE scope for session cookies (either
host-only or domain-wide — never both). Two flows writing the same cookie names
at different scopes creates split-brain jars: the browser keeps both copies,
reads return the stale one, and the fresh login is shadowed. If two scopes are
unavoidable (cross-subdomain OAuth), the client must purge all ancestor-scope
copies on every set/clear and prefer the most-recently-set copy on read.
(Evidence: OTP login after a dead OAuth session left every data card
"Unauthorized" — two cookie writers at different scopes; only caught in manual
UAT because the e2e stopped at "reached dashboard". auto-script Macro-2,
OTP-dashboard auth fix leg.)

## Cap

- One user journey per E2E file. If the journey forks, write a sibling file
  (`<base-name>-fork-a.spec.<ext>`).
- ≤8 assertion calls per file. Beyond that, the test does two things — split.

## Hand-Off

- Each TC-NNN becomes a **verification-register row** (the source the verify-gate
  reads) and the RTM Section 2 forward cell against its REQ-ID. The loop closes:
  `IF.RBAC.03 → SC-002 → TC-007`.
- The journey description in the header is reusable as a video script when QA video
  evidence is required — see `e2e-qa-field-by-field-verify-with-report.md` for the
  field-by-field verify + report counterpart (the QA evidence at 2.10).

## Variant Section

(Append a Variant block here when this flow shape fails or partially works. Do not
delete the original 4 types.)

## Related

- `docs/process/WORKFLOW.md` § 2.8 — the step this playbook owns.
- `docs/process/TRACE_SPEC.md` — TC-NNN format + the REQ→SC→TC loop.
- `scenario-taxonomy-playbook.md` — the SC-NNN these tests prove.
- `seed-data-pattern.md` — provides the seed IDs the skeletons reference.
- `e2e-qa-field-by-field-verify-with-report.md` — field-by-field verify + QA
  report (2.10 evidence).
- `code-review-scoring.md` — the "no generic error-swallow" floor rule (2.7)
  that the negative-path tests here prove at the e2e level.
- `docs/gates/dod-build.md` — the DoD E2E line reads § Mandatory Coverage Rules.
- `docs/process/ROLE_MAP.md` — QC/QA role + `ck-e2e-flow` engine binding.
