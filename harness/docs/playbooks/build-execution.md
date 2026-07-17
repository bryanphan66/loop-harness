# Build Execution

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Build-phase discipline: what an agent (or solo dev) actually does between "phase
> is planned" and "code is up for review". Composes with the story's Implementation
> Guardrails — guardrails state the rules; this playbook says how to enforce them.
> Owns Build & Go-live **step 2.6**.

**Macro-stage / step:** Build & Go-live · 2.6 (after 2.5 seed, before 2.7 review).

> Branching / commit / hook recipes below are authoritative. Executed per
> manifest phase via `/build-phase` (`docs/WORKFLOW.md` § Macro-Stage 2).

## Engine

- **Fast path:** `cook` (implement features/phases) → `fullstack-developer` →
  `code-simplifier`; `fix` / `ck-debug` for defects. `git` for commits.
- **Role:** Fullstack Dev. Per D1 these are accelerators — a bare agent + git +
  bash executes the same recipes.

## When To Run

- Starting any phase implementation (2.6).
- Setting up a fresh project after stack-selection (2.2) lands.
- Onboarding a collaborator onto an in-flight project.

Skip when the task is a doc-only change with no code touched.

## Branching Strategy

Solo dev / small team default: **trunk-based** on `main`.

- Direct commits to `main` are fine for tiny-lane work.
- Normal + high-risk phases: short-lived feature branch per phase, merged to
  `main` via PR after the 2.7 review. Branch name `feat/<module>-NN-slug` or
  `fix/<module>-NN-slug`. Lifetime ≤2 days — if a phase spans longer, split it.
- Long-lived branches (`dev`, `staging`, `release/*`) only when CI/CD targets
  them.

Use Pull Requests as the review surface even when solo (creates the 2.7 audit
trail). Never force-push a shared branch.

## Commit Cadence

Commit on a clean, runnable state:

- Every 30-90 minutes of focused work.
- Always before stopping for the day / switching phases.
- Never on a broken-test state without an explicit `WIP:` prefix + same-day fix.

The 2.7 rubric penalizes massive commits that hide review-blockers. Smaller
commits score higher.

> **Stage-boundary commits (control plane):** each step that produces a repo
> artifact = one bundled commit at the step boundary that ALSO updates `STAGE.md`
> + `docs/ROADMAP.md`. Never split that into a follow-up commit (see
> `docs/WORKFLOW.md` § Always-On Layer).

## Commit Message Format

Conventional commits. The body MUST cite ≥1 token per `docs/TRACE_SPEC.md` — a
REQ-ID (`MODULE.AREA.NN`), an SC-NNN, or a TC-NNN.

```text
<type>(<scope>): <subject under 70 chars>

<paragraph explaining WHY, not WHAT — the diff shows WHAT>

Cites: IF.RBAC.02, SC-007
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`,
`build`, `ci`. No AI references in commit messages. Do not reference plan
artifacts (phase numbers, finding codes) in commit messages — describe the change.

### Token-Citation Hook (recommended)

`.git/hooks/commit-msg` (chmod +x) — note the **D3 grammar** (no
`US-NNN.REQ-MMM`):

```bash
#!/usr/bin/env bash
msg_file="$1"
first_line="$(head -1 "$msg_file")"
case "$first_line" in
  "Merge "* | "Revert "* | "fixup! "* | "squash! "* | "WIP:"*) exit 0 ;;
esac
# Require a REQ-ID (MODULE.AREA.NN), SC-NNN, TC-NNN, or CR-NN in the body.
if ! grep -qE '([A-Z]{2,}\.[A-Z]{2,}\.[0-9]{2}|SC-[0-9]{3}|TC-[0-9]{3}|CR-[0-9]{2})' "$msg_file"; then
  echo "commit-msg: missing trace token (MODULE.AREA.NN / SC-NNN / TC-NNN / CR-NN). Cite at least one." >&2
  exit 1
fi
```

Tiny-lane work is exempt — use the `WIP:` prefix or a `chore:` subject.

## Pre-Commit Hook Recipe

Catch lint / format / typecheck before the commit lands. Varies by stack.

### Node / TypeScript

`pnpm add -D husky lint-staged && pnpm dlx husky init`. `.husky/pre-commit`:
`pnpm exec lint-staged`. `package.json`:

```json
{ "lint-staged": {
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{md,json,yml,yaml}": ["prettier --write"] } }
```

### Python

`.pre-commit-config.yaml` with `ruff` (+ `--fix`), `ruff-format`, `mypy`; then
`pre-commit install`.

### Go

```bash
# .git/hooks/pre-commit
#!/usr/bin/env bash
set -e
gofmt -l -s . | grep . && { echo "gofmt failed"; exit 1; } || true
go vet ./...
golangci-lint run
```

## Secrets & `.env` Policy

- `.env` is **never** committed. `.env.example` IS committed — every required var
  with empty value + one-line purpose.
- `.gitignore` MUST contain `.env`, `.env.*`, but NOT `.env.example`.
- Production values live in the secret vault chosen at stack-selection (2.2).

### Secret-Scan Hook (recommended)

```bash
# Block accidental .env commit (not .env.example)
if git diff --cached --name-only | grep -E '^\.env(\..*)?$' | grep -v '^\.env\.example$' >/dev/null; then
  echo "pre-commit: refusing to commit .env — use .env.example for shape only" >&2; exit 1
fi
# Crude secret-pattern scan
if git diff --cached -U0 | grep -E '(AWS_SECRET_ACCESS_KEY|API_KEY|PRIVATE_KEY|BEGIN [A-Z]+ PRIVATE KEY)=' >/dev/null; then
  echo "pre-commit: possible secret in staged diff — verify before committing" >&2; exit 1
fi
```

## Validate Bootstrap

Before 2.6 starts, the project MUST have at least `validate:quick` runnable. The
2.2 stack decision picks the framework; this playbook produces the script.

Minimum `validate:quick`: `format → lint → typecheck → unit tests → **boot smoke**
→ architecture check (if any)`.

**Boot smoke (non-negotiable for a DI-framework backend).** Compile + unit tests do
NOT boot the app — unit tests inject positionally and mock modules, so a runtime
DI/wiring or fail-closed-config error passes the gate green and only surfaces as a
prod **crash-loop** (health 404). Add a step that instantiates the **real
AppModule** — Nest `Test.createTestingModule({ imports: [AppModule] }).compile()`,
or a `--dry-run` bootstrap against a throwaway DB — so a boot error fails the GATE,
not the deploy. Code corollary: any constructor param that is an *optional
collaborator with a runtime default* (a test-injected stub, a config-built
instance, a plain function default) MUST carry `@Optional()` — the framework
ignores the TS `?`/default and tries to resolve it by type, throwing "can't resolve
dependencies" at boot. (Evidence: two elearning deploys took the whole API down with
a green gate — a fail-closed secret that threw at boot, and a service with an
un-`@Optional()` optional collaborator not in its module.)

| Stack | `validate:quick` shape |
|---|---|
| Node / TS | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit` |
| Python | `ruff format --check && ruff check && mypy . && pytest tests/unit -q` |
| Go | `gofmt -l . && go vet ./... && golangci-lint run && go test -short ./...` |

Wire `validate:quick` into pre-commit (or pre-push) once reliable. The
verify-gate (`scripts/harness-verify-gate.sh`) is the hard gate at stage close —
**never instruct bypassing a failing verify-gate or test to close a stage.**

`test:integration` / `test:e2e` / `test:release` ladder out as the project grows —
add each when the first phase needs it, not preemptively.

## Before Coding A Screen (design-system contract)

Before writing any UI for a screen, the Fullstack Dev MUST:

1. Find the screen's row in `docs/visuals/diagrams/screen-inventory.md` and
   confirm its assigned §4 floorplan + table/message/modal/create behaviors.
2. Open the screen's **prototype export source file** (cited in its
   build-manifest phase block) — the implementation reference per
   § Prototype → Code Fidelity below. No export + no recorded rebuild decision =
   blocker.
3. Reuse the components listed in `src/components/README.md` (the Tier-3
   inventory) before writing new ones — reuse-first, do not re-derive.
4. Consult the relevant section of `docs/design-system/design-rules.md` for the
   assigned floorplan's rules (§7 action placement, §8 modals, §10 states).

A grid/form screen with **no inventory row is a build blocker** — escalate to the
Designer to classify it (1.11 / `visual-and-behavioral-modeling.md`). **Do NOT
invent a floorplan** at build time; an unclassified grid/form screen is exactly
the drift the inventory exists to prevent. The verify-gate blocks on any
empty/placeholder Floorplan cell once `screen-inventory.md` exists, and the 2.7
review (`code-review-scoring.md`) treats an unclassified or rule-violating screen
as an automatic merge block.

## Prototype → Code Fidelity (consume the export as code — do NOT re-draw)

The frozen prototype is built in an external design tool (Claude Design / Open
Design) that **exports real code** — a bundle at
`docs/visuals/prototype/exports/<engine-vN>/`: `tokens.css` + `components.css`
(+ product-specific `components-<domain>.css`), a component kit `kit.jsx`, and
per-screen `screens-*.jsx`. **When a frozen client-approved export exists, the
build ADOPTS that code verbatim — it does NOT re-implement the look in fresh
Tailwind by "reading" the export.** Full method: `prototype-export-adoption.md`.

**The rule (adopt, don't re-approximate):**

1. **Bring the export's real CSS into the app** — copy `tokens.css` +
   `components.css` (+ `components-<domain>.css`) into
   `apps/web/src/styles/prototype/` and import them globally. The theme + spacing
   + component look now hold **by construction**, not by an agent re-deriving
   them.
2. **Port the kit components KEEPING the exact classNames** — each `kit.jsx`
   component becomes a real app component (`Button`/`Input`/`Logo`/`AuthShell`/
   `OtpInput`/`Badge`/…) that renders **the same class names** the imported CSS
   targets. Same classes → the CSS applies → the component looks right with zero
   eye-tuning. Changing the markup/classes to "clean it up" breaks the CSS
   binding — don't.
3. **Rebuild each screen from its `screens-*.jsx` structure** — same element
   tree, same components, same classes as the export screen; then wire real
   data / routing / API into that structure. Content changes; structure + look
   do not.
4. **Wire ONLY the real data / behaviour** — routing, API calls, form state,
   loading/empty/error states — into the adopted markup. Everything visual came
   from the export; the build adds only what the export could not carry.

**Why adopt-as-code, NOT re-draw (failure evidence):** an earlier rule said
"port the export markup/structure/styles as the *reference*, reconcile to Tier-2
tokens, rebuild in the app's own Tailwind". Re-implementing a frozen
Claude-Design export by *reading* it into fresh Tailwind reproduced the
functional skeleton but landed at **~80%**: dropped elements (logo, the
"Đăng ký học" link, the VI/EN toggle), the **wrong theme** (dark instead of the
export's light-first), a washed-out primary button, and a broken **OTP input**
(backspace did not delete + step back) — all requiring heavy manual eye-tuning
and still diverging (elearning-platform P1/P2/P3). The fix that reached **~99%
by construction** did the opposite: it brought the export's real `tokens.css` +
`components.css` in, ported the kit components keeping their classNames, and
rebuilt the screens from `screens-*.jsx` — wiring only real data (elearning
commit `re-base auth screens on the frozen prototype export`). The client froze
the *prototype code*; adopt it, don't re-approximate it. **An LLM re-drawing a
design from a screenshot or a JSX read is the fidelity-loss step — remove it.**

Adopting the export does NOT waive the design-system contract — it composes:
- The export's `tokens.css` **is** the Tier-2 token layer for this project (its
  CSS variables are the tokens). Screens use those variables via the ported
  components — no hardcoded values re-introduced, no scaffold/default theme.
- The screen's §4 floorplan row (screen-inventory) still applies — a frozen
  prototype screen already conforms to its floorplan (the 1.12 gate checked it),
  so adopting its structure preserves conformance by construction.
- The ported kit **is** the Tier-3 inventory — record it in
  `src/components/README.md` so later screens reuse, never re-invent (a
  re-invented kit component is a build-phase BLOCK).
- **Every screen records its export source file** in its build-manifest phase
  block and satisfies the **visual-fidelity gate**
  (`docs/gates/visual-fidelity.md`): its required-element + interaction
  assertions pass on the running app AND the human glance approves the
  side-by-side.

**Fallback — no frozen export exists** (net-new screen, or a screen the
prototype never covered): build it via the design-system (Tier-1 floorplan +
Tier-2 tokens + Tier-3 components). This is a recorded `rebuild (decision:
<slug>)` in the phase block, never a silent choice — the build-manifest marks
each screen `adopt from export` (default when an export exists) or
`rebuild (decision: <slug>)`.

Guardrails (all zones):
- **Real assets required** — placeholders do not adopt. Logo + hero imagery must
  be provided or generated (`ai-artist` / `ai-multimodal`) before the build, so
  the real asset is in the adopted markup once.
- The plan (2.3) states adopt-vs-rebuild per zone; the manifest carries it per
  screen.

### PUB product-shot capture is a LATE phase

Marketing screens (landing hero, feature sections) often embed **screenshots of
the product itself**. Capture those from the RUNNING APP only **after** the APP
screens they depict are built + styled + fidelity-checked — never from an early
flat/scaffold UI. (Failure evidence: a run captured landing hero/feature shots
off the early unported UI; after the APP screens were ported to the design the
landing images were stale and had to be re-captured — auto-script Macro-2.)

- The build-manifest sequences the PUB product-shot capture phase (or 2.10
  sub-step) with an explicit **depends-on: every APP screen phase it depicts**.
- Commit the capture script/recipe so shots are re-generatable after later UI
  changes.

## Incremental Preview (a running app after EVERY phase)

Verification cannot wait for the end of the manifest — both legs of the
per-phase acceptance gate (`docs/gates/phase-acceptance.md`) inspect the
**running app**, phase by phase:

- **Local (default):** the compose/dev-server stack that booted at P0 (walking
  skeleton) stays bootable at every phase close. The build-manifest header
  records the ONE-line **Preview command** + URL (e.g. `docker compose up` →
  `http://localhost:3000`); the implementing agent leaves it runnable when it
  returns, and a phase that leaves the app un-bootable FAILs acceptance
  regardless of its diff.
- **Staging (optional):** when a shared/staging target exists (chosen at
  2.2/2.4), deploy each phase commit there and hand that URL to the verifier +
  operator — same mechanic, remote surface. Go-live readiness (2.11) then
  confirms the production variant; it is not the first time the app runs.

This is the delivery surface for the **human checkpoint**: the operator reviews
each module on the real app as it lands (cadence knob in the manifest header),
instead of meeting the whole product for the first time at UAT.

## Per-Phase Acceptance Verification (after commit, before the next phase)

The phase pipeline does not end at the stage-boundary commit. Per
`docs/gates/phase-acceptance.md`: an **independent agent verifier** (spawned by
the `/build-phase` orchestrator — never the implementer) re-runs the phase's
acceptance checks against the running preview (functional + visual-fidelity per
shipped screen + negative-path); FAIL → fix inside the same phase and
re-verify (cap 3 rounds); PASS → `Accepted` cell + TC-NNN row; then the human
checkpoint when the phase's `Verify-by` is `both`. The implementer's
self-checks above exist to make the verifier pass first try — they never
substitute for it. (Failure evidence: verifying only at 2.7/2.8/2.10 let
per-phase defects accumulate to the end and forced multiple UAT-fix rounds —
auto-script Macro-2; per-phase catch is the cheap point on the token curve.)

## Implementation Guardrails (reference)

The story's Implementation Guardrails section is the authority; restated for the
agent reading this at the start of 2.6:

- Stay inside scope. Out-of-scope cleanup → new story or backlog row.
- Architecture change → new `docs/decisions/<slug>.md` before merging.
- Don't delete referenced code without grep proof.
- UI: handle loading + empty + error states, not just happy path.
- **Errors surface their real cause** — a user-facing operation that fails must
  show the actual reason (tier/quota limit, provider error, validation detail),
  never a generic "something went wrong" that swallows it. Generic-swallow is a
  2.7 review floor block (`code-review-scoring.md`).
- Input validation at the boundary.
- **A fetch-all grid respects the endpoint's max pageSize.** A list screen that
  pulls every row to sort/filter/paginate client-side must set its fetch size ≤ the
  API's `pageSize.max(...)` — a page that requested 200 against a `max(100)` DTO got
  HTTP 422 and rendered its error state, while a plain `curl` at the default page
  size 200'd (so a naive verify missed it). Cap the fetch to the endpoint max, or
  switch to true server-side pagination.
- **Systemic fix = full sweep.** When a change fixes an instance of a systemic
  pattern (error handling, model/tier resolution, auth, quota, permission
  checks), grep ALL call-sites of that pattern and cover every sibling in the
  same change — prefer moving the logic into a **single chokepoint** (one
  resolver/guard/helper) over per-feature patches (DRY). A fix that leaves
  sibling sites broken is an automatic 2.7 review finding. (Failure evidence:
  a run patched tier-model resolution only in the one generator the bug was
  reported against; every other AI-gen entrypoint kept the same broken default
  and failed in UAT — auto-script Macro-2, systemic tier-model fix leg.)
- Commit body explains the change + cites ≥1 token.

## Variant Section

(Append a Variant block here when this playbook fails or partially works.)

## Related

- `docs/WORKFLOW.md` § 2.6 — the step this playbook owns; § Always-On — stage
  commits.
- `docs/TRACE_SPEC.md` — the token grammar the commit-msg hook enforces (D3).
- `code-review-scoring.md` — step 2.7 follows this playbook.
- `visual-and-behavioral-modeling.md` — produces `screen-inventory.md` (1.11), the
  floorplan row a screen build confirms first.
- `ui-design-system-contract.md` — produces `src/components/README.md` (Tier-3
  inventory) the build reuses from.
- `docs/design-system/design-rules.md` — Tier-1 §4/§7/§8/§10 rules a screen build
  consults; never invent a floorplan.
- `prototype-export-adoption.md` — the step-by-step method § Prototype → Code
  Fidelity points to (adopt the export's CSS + kit + screens verbatim).
- `docs/gates/visual-fidelity.md` — the toothy per-screen gate every UI phase
  must pass: machine-checkable Playwright assertions (element completeness +
  interaction behaviour) + a human side-by-side glance before the phase closes
  (2.6 leg, 2.7 floor rule, 2.10 DoD).
- `docs/HARNESS.md` § Control-Plane Failure Classes — **FC6** (verify at the real
  source, never a wrapper exit) + **FC7** (human review must be real — surface
  the side-by-side, no rubber-stamp) bind this playbook's commit/push +
  fidelity-gate legs.
- `docs/gates/phase-acceptance.md` — the per-phase acceptance-verification gate
  (independent verifier + cadence-driven human checkpoint) this playbook's
  Incremental Preview serves.
- `design-system-3-tier.md` — the cross-stage 3-tier enforcement chain.
- `seed-data-pattern.md` — step 2.5 precedes; provides demo data.
- `payment-integration.md` — applies when money is in scope at 2.6.
- `docs/ROLE_MAP.md` — Fullstack Dev role + `cook` engine binding.
