# Agent Operating Guide

**Project: <project name — fill at bootstrap>.** <One-paragraph product
description: who it serves, what it does, where it came from.> This project runs
on the **loop-harness** operating model — a bootstrapped project, not the
harness itself.

Check `STAGE.md` first (Current step + **Lane**: Full | Lite). The 3-macro flow
in `docs/process/WORKFLOW.md` governs the work; the product contract lives in
`docs/requirements/` (SRS + REQ-IDs + RTM, or `srs-lite.md` in the Lite lane)
and `docs/discovery/` (raw input); the build order lives in
`docs/build-manifest.md` once step 2.3 compiles it.

## Source Of Truth

Read in this order:

1. `STAGE.md` (repo root) — the single state tracker. Answers "where is this
   repo / project at?" in one glance before anything else.
2. `README.md` — project status.
3. `docs/about/HARNESS.md` — the human-agent operating model (3-layer architecture +
   Independence Principle + Playbook Lifecycle).
4. `docs/process/WORKFLOW.md` — the 3-macro-stage map (Pre-Build / Build & Go-live /
   Post-Build), per-step tables, canonical gates, token chain.
5. `docs/process/ROLE_MAP.md` — which SDLC role plays each step and which agent + skill
   engine performs it.
6. `docs/process/TRACE_SPEC.md` — the token grammar (`GAP-NNN → REQ-ID → SC-NNN →
   TC-NNN`, `CR-NN`) and RTM completeness rule. Referenced by the verify-gate.
7. The user-provided spec or raw input, when one exists.
8. `docs/requirements/` — the BA spine (SRS + REQ-IDs + RTM + use-cases).
9. `docs/decisions/` — ADRs by stable **slug** (never by number) for why
   important choices were made.
10. `docs/playbooks/` — reusable recipes (lifecycle: experimental | verified |
    deprecated).

This harness does not ship a project-specific `SPEC.md`. When the human provides
a spec, treat it as input material for Pre-Build — the BA spine, scope baseline,
prototype, and contract become the living contract agents update as the system
evolves.

## Independence Principle

The harness must run on a **bare agent + git + bash**. The `ck-*` skills are the
**live engine** the harness *invokes* to produce artifacts faster, but they are
**accelerators, not dependencies**:

- `AGENTS.md`, `STAGE.md`, `docs/process/WORKFLOW.md`, `docs/about/HARNESS.md`,
  `docs/process/TRACE_SPEC.md`, and `scripts/install-harness.sh` MUST NOT reference any
  `ck-*` skill as a required step.
- `install-harness.sh` **preflight-checks** that `~/.claude/skills` and
  `~/.claude/agents` exist and **WARNS if missing** — it never copies/vendors
  them into the project repo (decision: `ck-skill-engine-not-vendored`).
- Playbooks reference `ck-*` skills only in their **Engine** / **Related**
  sections as the fast path. The core logic of every playbook must be executable
  by a plain agent reading the playbook — the skill is enrichment, not gating.

If you find a playbook, template, or plan that mandates a `ck-*` skill before it
can run, treat it as a defect — refactor the file or open a backlog entry.

## ck-Skills As Engine

The 3-layer model (full detail in `docs/about/HARNESS.md`):

| Layer | Role | Components |
|---|---|---|
| **Control plane** | decides *what runs next* + *did the gate pass* | `STAGE.md`, gates, verify-gate hook, stage-boundary commits, `stage-runner` |
| **Engine** | *produces* the artifact each step | `ck-*` skills (live, invoked — not vendored) + cook / ship / deploy / devops |
| **Role players** | *execute* each SDLC role's work | global agents (planner, researcher, fullstack-developer, code-reviewer, tester, debugger, ui-ux-designer, docs-manager, project-manager, git-manager, code-simplifier, journal-writer, brainstormer) orchestrated by `stage-runner` |

Role → engine binding is summarized below and specified fully in
`docs/process/ROLE_MAP.md`.

| Role | Played by (agent · skill engine) |
|---|---|
| **PM** (Delivery Lead) | `project-manager`, `planner` · `ck-intake-file`, `ck-scope-confirmation`, `ck-client-update`, `ck-project-status` |
| **BA** (Requirements Engineer) — *spine* | `researcher`, `planner` · `ck-rri`, `ck-xre`, `ck-scenario`, `ck-persona`, `audit-product-feature` |
| **Designer** (UX/UI) | `ui-ux-designer` · `ck-brand-guidelines`, `ck-design-system`, `ck-ux-design`, `ck-scope-package` |
| **SA** (Solution Architect — ERD freeze) | `planner`, `researcher` · `ck-tech-design`, `databases` |
| **Tech Lead** (stack / API / security / threat-model) | `planner`, `code-reviewer`, `brainstormer` · `ck-tech-design`, `ck-plan`, `ck-predict`, `ck-code-review` |
| **DevSecOps** | `fullstack-developer` (infra hat), `git-manager` · `devops`, `deploy`, `ck-security`, `security-scan`, `ck-prod-readiness`, `ck-seed`, `ship` |
| **Fullstack Dev** | `fullstack-developer` → `code-simplifier`, `debugger` · `cook`, `backend-development`, `frontend-development`, `fix`, `ck-debug` |
| **QC/QA** | `tester` · `ck-e2e-flow`, `ck-scenario`, `ck-qa`, `test`, `web-testing` |
| **Release Manager** | `git-manager`, `project-manager` · `ship`, `deploy`, `ck-prod-readiness` |
| **Support/SRE** (Hypercare Lead) | `project-manager`, `fullstack-developer`, `debugger` · `ck-handover`, `ck-hypercare`, `ck-debug`, `fix` |
| **Docs/Audit** (always-on) | `docs-manager`, `journal-writer` · `docs`, `journal`, `retro` |
| **Stage Orchestrator** (control plane) | project-local `stage-runner.md` + `/stage-next` |

> **SA and Tech Lead are SEPARATE named roles** — do not merge them. SA owns the
> ERD freeze; Tech Lead owns stack/API/security/threat-model. The same stack
> agent may run them back-to-back, but they are distinct steps with distinct
> gates (decision: `sa-and-tech-lead-separate-roles`).

## UI / Design System Rule

Any UI work — prototype, build, or review — runs under a **3-tier design
system** with a **HARD gate** (auto-block, not advisory):

- **Tier 1 — Patterns/Floorplans/Behavior:** `docs/design-system/design-rules.md`
  (canonical home; ships to every project because `install-harness.sh` recurses
  `docs/`). Jump to the relevant section — do **not** load the whole file.
- **Tier 2 — Tokens:** the canonical brand/design tokens (colors, fonts,
  spacing, density). Use **only** Tier-2 tokens — no hardcoded values.
- **Tier 3 — Components:** the shadcn/ui inventory in `src/components/README.md`.
  Reuse before building new.

Before writing any UI code you MUST:

1. **Consult Tier-1** `docs/design-system/design-rules.md` for the relevant rule
   (shell §1, floorplans §4, tables §5, forms §6, actions §7, modals §8, states
   §10, a11y §11).
2. **Classify each screen** that contains a **data grid OR a create/edit form**
   to exactly **one §4 floorplan** (List Report, Object Page, Worklist,
   Overview, Analytical List, Wizard) — **or** declare it **CUSTOM per §4.7**
   (one-line rationale in `docs/decisions/<slug>.md`; CUSTOM still obeys
   cross-cutting rules: shell §1, actions §7, states §10, a11y §11) — and record
   that classification in `docs/visuals/diagrams/screen-inventory.md` **BEFORE
   coding**. This is **mandatory in ALL lanes** (including Tiny/internal). Only a
   genuinely trivial single-screen tool with **neither** grid **nor** form may
   skip classification.
3. **Reuse components** from `src/components/README.md` and use only Tier-2
   tokens (no hardcoded values).

**Precedence:** Tier-1 + Tier-2 are **authoritative**; Tier-3 components conform
to them. When a **Tier-1 rule conflicts with an explicit user request**, do
**not** silently apply either — **ASK** (emit a clarification).

## Task Loop

For every task:

0. Read `STAGE.md` at repo root. Confirm the task matches the Current stage (or
   is an explicit move to the next step). If it spans multiple macro-stages,
   surface that to the human before proceeding.
1. Identify the input type: new lead/spec, scope slice, change-request,
   maintenance request, or harness improvement.
2. Locate the affected artifacts — BA spine (`docs/requirements/`), scope
   baseline (`docs/scope-baseline/`), design (`docs/design/`, `docs/visuals/`),
   stories (`docs/stories/`). For **UI tasks** also read Tier-1
   `docs/design-system/design-rules.md` (relevant section only), the Tier-2
   tokens, the Tier-3 inventory `src/components/README.md`, and the floorplan
   classification in `docs/visuals/diagrams/screen-inventory.md` — see § UI /
   Design System Rule.
3. Check the token chain (`docs/process/TRACE_SPEC.md`): every feature traces
   `GAP-NNN → REQ-ID → use-case + RTM row → SC-NNN → feature-register line →
   SOW line → TC-NNN`. Do not break the chain.
4. Before fighting any tooling / environment problem, scan
   `docs/playbooks/README.md` for a matching recipe and apply it before
   re-deriving a fix.
5. Walk the macro-stage step in `docs/process/WORKFLOW.md`. Honor its gate. Conditional
   enterprise gates (data-migration, NFR/load, DR/RTO-RPO, compliance/WCAG,
   observability/SLO) must be explicitly marked **N/A by decision** when not
   needed — never silently dropped.
6. Before finishing, ask:
   - Did a WORKFLOW step complete? If yes, update `STAGE.md` (move the row to
     History with today's date + commit SHA placeholder; update Snapshot). The
     `STAGE.md` edit lands in the **same** stage-boundary commit as the artifact.
   - Did the BA spine / scope baseline / RTM change? Keep them current.
   - Did a gate pass or get marked N/A-by-decision? Record it.
   - Did an architecture / behavior / authz / data-ownership / API-shape change
     happen? Add `docs/decisions/<slug>.md` (slug, not number).
   - Did we exercise an `experimental` playbook usable without modification?
     Promote it to `verified` (see `docs/about/HARNESS.md` § Playbook Lifecycle).
   - Is this a multi-task session (3+ commits)? Run the session-retrospective
     playbook → `plans/reports/retro-<date>-<slug>.md`.
7. Record a **session trace** per `docs/process/TRACE_SPEC.md` before reporting done.

## Stage Orchestration

To keep the main session's context small, **delegate stage execution to the
`stage-runner` subagent** instead of running the stage inline. The subagent
reads the step's goal + the relevant playbook in isolation, writes the
artifacts, updates `STAGE.md`, and returns a compact summary (≤200 words) — the
main agent sees the summary, not the 10-30k tokens of stage work.

How to invoke:

- Slash command: `/stage-next` (preferred — auto-detects the next step from
  `STAGE.md`).
- **Build step 2.6:** `/build-phase` — one invocation = ONE build-manifest
  phase; repeat until the manifest is exhausted, then `/stage-next` continues
  at 2.7. Never run "all of 2.6" in one invocation. Each phase ends with the
  **acceptance verification** (`docs/gates/phase-acceptance.md`): independent
  verifier PASS + cadence-driven operator checkpoint — the next phase does not
  start before it.
- Direct: `Task({ subagent_type: "stage-runner", prompt: "Run step <ID> per
  goal: …" })`.
- **Agent-registry caveat:** `stage-runner` resolves only in sessions started
  AFTER the harness was installed — a session's agent registry is frozen at
  start, so the very session that ran the installer gets "agent not found".
  Fall back to `subagent_type: "fullstack-developer"` (or run inline) for that
  session; the next session picks up `stage-runner` normally.

**Background-session isolation:** `.claude/settings.json` ships with
`"worktree": {"bgIsolation": "none"}` so a bg agent works at the checked-out
root and `STAGE.md` / the verify gate stay live. The setting is read at session
START — a bg session launched before it existed is already fenced into
`.claude/worktrees/`. In that case run the WHOLE flow inside that one worktree
(never split work across the worktree and the root) and fast-forward the main
branch from the worktree branch at the end. Never scaffold or `git init` inside
a worktree — its `.git` is a pointer file (see the stack template's
`scaffold.sh`).

When NOT to delegate:

- The human asks to do a step inline (review-as-you-go).
- A non-stage task (refactor, bugfix, harness tweak) with no WORKFLOW row.
- A change-request flow — the always-on layer is not a "stage".

The subagent returns a `**Status:**` block: `DONE | DONE_WITH_CONCERNS |
BLOCKED | NEEDS_CONTEXT | MANUAL_CHECKPOINT_PENDING`. Never silently retry on
`BLOCKED` — change context, simplify the scope, or escalate to the human.

The `.claude/hooks/stage-deliver.sh` notifier hook fires on the subagent's
stage-boundary commit, so the human gets the artifact + the next step's gate
text on their phone without the main agent doing anything extra.

## Manual Checkpoint Signaling

Several steps require the human to do offline work the agent cannot do — open
the prototype tool, sign a contract, review a gap analysis, run UAT, hand over
credentials. The **client-paging gates** are exactly: **PB-G2** (scope frozen),
**PB-G3** (prototype frozen), **PB-G4** (contract + deposit), the Build
**ACCEPTANCE** gate (UAT + sign-off), and the Post-Build **HANDOVER** gate.
**PB-G1** (intake go/no-go) is an *internal* capture — it does NOT page the
client.

When you reach a client-paging handoff, end the turn with a `MANUAL_CHECKPOINT`
block so the human sees a structured alert and knows exactly what to do and when
to return.

Format (write in the last assistant message of the turn that ends in handoff):

```
MANUAL_CHECKPOINT: <one-line action — start with a verb>
- URL: <link if any>
- Reference: <file or spec the human reads first>
- Save to: <where the output lands, if applicable>
- Return condition: <what the human says/does when finished>

<blank line ends the block>
```

If multiple manual steps are pending, list each as its own block separated by a
blank line. The parser captures from the first `MANUAL_CHECKPOINT` line to the
end of the message, so trailing prose ("I'll resume once you confirm") is fine.

## Verify Gate — No Bypass

A git hook (`.githooks/`, core `scripts/harness-verify-gate.sh`) enforces the
Pre-Close Verification Gate mechanically on every commit and push: it runs the
project's lint/validate command and blocks any `Result: fail` (and `never-run`
on a stage-close commit) in the verification register.

Agents **MUST NOT** bypass it. Do not run `git commit --no-verify`, `git commit
-n`, or `git push --no-verify`, and do not unset `core.hooksPath`, to get past a
blocked gate. A red gate means real work remains — fix the error or run and
record the Verify command. `--no-verify` is reserved for the **human**, who must
state an explicit reason; an agent may use it only when the human authorizes
that specific commit in the conversation.

## Done Definition

A task is done only when:

- The requested change is completed or the blocker is documented.
- The BA spine, scope baseline, RTM, stories, and verification register remain
  current.
- The token chain is unbroken (`docs/process/TRACE_SPEC.md`).
- Validation commands ran when they exist; the **Pre-Close Verification Gate**
  is satisfied (`pass`, or a recorded reason — `MANUAL:` checkpoint the human
  signed off).
- Any conditional enterprise gate touched is either passed or explicitly
  marked **N/A by decision**.
- A **session trace** is recorded per `docs/process/TRACE_SPEC.md`.
- The final response says what changed and what was not attempted.

## Addendum (2026-07-22) — shared-branch safety + background-session hygiene

### Git safety on the shared branch
- **Never push directly to a shared branch (dev/main).** If branches are
  unprotected a direct push silently clobbers others' commits. Always land through a
  **PR into the branch**; let a human (or an explicit approval) merge it.
- **Force-pushing a shared branch is a human decision.** The auto-mode classifier
  blocks it; do not work around it. Surface it and let the user run the one command.
- **Prepare-branch, hold-push pattern for client deploys.** Build the change on a
  branch, get it VERIFIED-GREEN (full build+test), open the PR, and STOP. Do not push
  to the deploy branch until the operator approves — merging the PR is the deploy.

### Background-session hygiene (control plane)
- **Concurrency cap: ≤3-4 full-gate bg workers at once.** Each worker that runs
  `validate` (typecheck + `next build` + tests) is CPU-heavy; dispatching 5+ at once
  thrashes the box (observed load 328 with ~6 workers all validating → every gate
  crawls, appears hung). Cap concurrent full-gate workers at 3-4; queue the rest and
  dispatch as slots free (a completion notification frees a slot). Read-only scouts
  are cheap and exempt. This cap is NOT optional — over-dispatch is slower, not
  faster, because thrash inflates each validate from minutes to tens of minutes.
- **Isolation hazard.** Dispatching multiple `--bg` sessions with OVERLAPPING file
  scope produces divergence + duplicated work that must later be reconciled into ONE
  verified-green branch (expensive). Give each bg task a non-overlapping scope; when
  overlap is unavoidable, plan the reconcile step up front. Never let two sessions
  share one worktree (`EnterWorktree` with the same branch name reuses it → a race on
  the git index); verify each dispatch spawned its OWN worktree before dispatching more.
- **Base worktrees off `origin/<branch>` (fetched), never the local checkout.** A bg
  session that branches off a stale local ref produces a PR that conflicts with the
  real base. Always `git fetch` then base on the remote ref.
- **A bg task that COMMITS must set up the full env first** (`pnpm install` +
  `prisma generate` + build workspace `packages/*`) or the verify gate fails on
  missing generated types / node_modules — an environmental failure, not a code one.
  Note the gate runs the full validate+build at BOTH pre-commit AND pre-push (double
  cost); budget time accordingly and do not `--no-verify`.
- **Stale-dist after pull/rebase — rebuild BEFORE trusting `validate`.** The same
  staleness bites after a `git pull`/`rebase` that brings in new schema/types/deps
  from other merges: the workspace `packages/*` dist + `.prisma` client + linked
  `node_modules` are now behind the pulled source, so `validate` throws FALSE
  typecheck errors (e.g. `Cannot find module 'exceljs'`, `property X does not exist on
  PrismaClient`, `no exported member Y`). Do NOT diagnose these as code bugs — run
  `pnpm install && pnpm --filter <db> run prisma:generate && pnpm -r --filter
  "./packages/**" run build`, THEN re-run typecheck. Only a real error survives the
  rebuild. This is a control-plane rule; the build playbook restates it at 2.6.
