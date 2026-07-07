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

Minimum `validate:quick`: `format → lint → typecheck → unit tests → architecture
check (if any)`.

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

## Prototype → Code Fidelity (port-first by default)

The frozen prototype is built in an external design tool (Claude Design / Open
Design) that **exports real HTML/CSS/JSX** (bundle at
`docs/visuals/prototype/exports/<engine-vN>/`). **The export is the primary
implementation reference for EVERY zone — port it, don't re-derive it:**

| Zone | Target | Strategy |
|---|---|---|
| **PUB** (landing, **pricing**, marketing, auth) | **Pixel-faithful** — this is the public "shop window" | **PORT the export** markup + styles ~verbatim into the marketing routes; wire content/links. Do NOT rebuild from a screenshot. |
| **APP / ADM** (dashboards, tables, wizards, forms) | **Design-faithful + data-wired** | **PORT the export** markup/structure/styles as the implementation reference, reconcile its values to **Tier-2 tokens**, then wire real data + loading/empty/error states into the ported structure. Do NOT rebuild-from-spec via generic design-system components. |

**Why port-first for APP/ADM too (failure evidence):** an earlier rule said
"rebuild APP/ADM via the design-system; the export is a spec, not the
implementation". On a design-heavy product that rule produced a
plain-but-functionally-correct app that passed every gate (floorplan
classification, token compliance, e2e) while **looking nothing like the frozen
mockup** — the operator rejected it at UAT and the screens had to be re-ported
from the export anyway (example: the auto-script Macro-2 run, UI-port fix leg).
The client froze the *prototype*, not an abstract spec; the build must look like
what was frozen.

Porting APP/ADM does NOT waive the design-system contract — it composes with it:
- Reconcile the export's raw colors/typography/spacing to **Tier-2 tokens**
  (the export tends to hardcode values; tokenize them — same visual result,
  compliant source). Genuinely one-off values may stay local if recorded.
- The screen's §4 floorplan row (screen-inventory) still applies — a frozen
  prototype screen already conforms to its floorplan (the 1.12 gate checked it),
  so porting preserves conformance by construction.
- Reuse Tier-3 components where the export's structure maps 1:1 onto an existing
  component; port bespoke structure where it doesn't. Do not force the export
  into a generic component that changes its look.
- **Every ported screen records its export source file** in its build-manifest
  phase block, and passes the **visual-fidelity check**
  (`docs/gates/visual-fidelity.md`): screenshot of the running screen
  side-by-side with the export render — structurally/visually divergent = block.

**Deviation needs a decision record.** Rebuilding a screen from spec instead of
porting (e.g. the export for that screen is broken, or the screen has no
prototype) is allowed ONLY with a recorded `docs/decisions/<slug>.md` naming the
screens and the reason. The build-manifest phase block marks each screen
`port from export` or `rebuild (decision: <slug>)` — never silently the latter.

Guardrails when porting (all zones):
- **Real assets required** — placeholders do not port. Logo + hero imagery must
  be provided or generated (`ai-artist` / `ai-multimodal`) before the PUB build,
  so it ports once.
- The plan (2.3) states the fidelity strategy explicitly per zone; the manifest
  carries it per screen.

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
- `docs/gates/visual-fidelity.md` — the per-screen screenshot-vs-export check
  every ported screen must pass (2.6 self-check, 2.7 floor rule, 2.10 DoD).
- `design-system-3-tier.md` — the cross-stage 3-tier enforcement chain.
- `seed-data-pattern.md` — step 2.5 precedes; provides demo data.
- `payment-integration.md` — applies when money is in scope at 2.6.
- `docs/ROLE_MAP.md` — Fullstack Dev role + `cook` engine binding.
