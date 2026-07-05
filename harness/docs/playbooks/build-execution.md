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
2. Reuse the components listed in `src/components/README.md` (the Tier-3
   inventory) before writing new ones — reuse-first, do not re-derive.
3. Consult the relevant section of `docs/design-system/design-rules.md` for the
   assigned floorplan's rules (§7 action placement, §8 modals, §10 states).

A grid/form screen with **no inventory row is a build blocker** — escalate to the
Designer to classify it (1.11 / `visual-and-behavioral-modeling.md`). **Do NOT
invent a floorplan** at build time; an unclassified grid/form screen is exactly
the drift the inventory exists to prevent. The verify-gate blocks on any
empty/placeholder Floorplan cell once `screen-inventory.md` exists, and the 2.7
review (`code-review-scoring.md`) treats an unclassified or rule-violating screen
as an automatic merge block.

## Prototype → Code Fidelity (by zone)

The frozen prototype is built in an external design tool (Claude Design / Open
Design) that **exports real HTML/CSS/JSX** (bundle at
`docs/visuals/prototype/exports/<engine-vN>/`). How faithfully to reproduce it in
code **depends on the zone** — do not apply one rule to all screens:

| Zone | Target | Strategy |
|---|---|---|
| **PUB** (landing, **pricing**, marketing, auth) | **Pixel-faithful** — this is the public "shop window" | **PORT the export** markup + styles ~verbatim into the marketing routes; wire content/links. Do NOT rebuild from a screenshot. |
| **APP / ADM** (dashboards, tables, wizards, forms) | **Function-faithful + consistent** — not pixel | **REBUILD** via the design-system (shadcn + §4 floorplan + Tier-2 tokens). The export is a **spec**, not the implementation. |

Rationale: marketing/landing pages are mostly **static** → the export is
production-usable, so porting yields ~100% fidelity at low cost, and these screens
are CUSTOM (§4.7) — bespoke marketing CSS is allowed, outside strict floorplan
discipline. App/admin screens need **real data wiring + cross-screen consistency**;
chasing pixel-parity there wastes effort and hurts maintainability — the
design-system is the contract, not the export bitmap.

Guardrails when porting PUB:
- Reconcile the export's colors/typography to **Tier-2 tokens** where feasible; an
  isolated marketing-only token/value is acceptable if recorded (don't hardcode app-wide).
- **Real assets required** — placeholders do not port. Logo + hero/product imagery
  must be provided or generated (`ai-artist` / `ai-multimodal`) before the PUB build,
  so it ports once.
- The plan (2.3) should state the split explicitly: *"port PUB from the export;
  rebuild APP/ADM via design-system."*

## Implementation Guardrails (reference)

The story's Implementation Guardrails section is the authority; restated for the
agent reading this at the start of 2.6:

- Stay inside scope. Out-of-scope cleanup → new story or backlog row.
- Architecture change → new `docs/decisions/<slug>.md` before merging.
- Don't delete referenced code without grep proof.
- UI: handle loading + empty + error states, not just happy path.
- Input validation at the boundary.
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
- `design-system-3-tier.md` — the cross-stage 3-tier enforcement chain.
- `seed-data-pattern.md` — step 2.5 precedes; provides demo data.
- `payment-integration.md` — applies when money is in scope at 2.6.
- `docs/ROLE_MAP.md` — Fullstack Dev role + `cook` engine binding.
