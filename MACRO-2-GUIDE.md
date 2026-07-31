# Macro 2 — BUILD & GO-LIVE (usage guide)

**loop-harness** turns a frozen spec into a **running, deployable app** through
three gated macro-stages. This guide covers **Macro 2 — Build & Go-live**: the part
that converts the frozen ERD + build-manifest into working, verified, deployed code,
one phase at a time, with a machine gate between every phase so a defect born in
phase N is caught in phase N — not at UAT after N+5 phases were built on top of it.

> Full operating model: `harness/docs/HARNESS.md`. Step tables + gates:
> `harness/docs/WORKFLOW.md`. Per-step goals: `harness/docs/STAGE_GOALS.md`.
> Current harness version + hardening log: `harness/docs/HARNESS_CHANGELOG.md` (v6.20).

---

## What Macro 2 does

Input: a frozen scope + frozen prototype + a data model, from Macro 1 (Pre-Build).
Output: an app that **builds, runs, is verified against its acceptance criteria,
passes review/security/QA, and deploys with verify-at-source** — plus a signed
client acceptance.

The spine is: **ERD → stack → BUILD MANIFEST → walking skeleton → `/build-phase`
loop (gated per phase) → aggregate review/security/QA → UAT → release.**

## The flow (steps 2.1 → 2.13)

| Step | What | Gate |
|---|---|---|
| **2.1** | Freeze the **ERD** (data model, audit + tenant fields) | ERD FROZEN |
| 2.1b | Data migration / cutover (brownfield) | conditional — N/A by decision on greenfield |
| **2.2** | Technical design + choose stack (default = the shipped walking-skeleton stack) + API contract + **STRIDE threat-model** | stack justified vs NFR |
| **2.3** | Implementation plan + **BUILD MANIFEST** (ordered phases P0..PN; every REQ-ID in exactly one phase) | **DoR** (`gates/dor-build.md`) |
| **2.4** | **Walking skeleton** (manifest P0) + env + CI + observability | `install && build` green · `docker compose up` boots · health OK |
| **2.5** | Seed + foundation data | app boots with RBAC · seeded admin login works |
| **2.6** | **Code feature by phase — the `/build-phase` loop P1..PN** | **PHASE ACCEPTANCE** per phase (see below) |
| **2.7** | Code review (6-dim) — once at manifest completion (+ mid-point if >6 phases) | score ≥7, no dim = 0 + floor rules |
| **2.8** | E2E from BA docs + user manual | every REQ-ID ≥1 passing E2E (TC-NNN) + coverage rules |
| **2.9** | Independent security review (STRIDE+OWASP, **red-team**) | 0 Critical/High open |
| **2.10** | QA real-browser + video | **DoD** (`gates/dod-build.md`) |
| **2.11** | Go-live readiness (rollback rehearsed; DR/NFR conditional) | readiness green |
| **2.12** | **UAT + sign-off** (one client session) | **ACCEPTANCE (client)** |
| **2.13** | Release | release note + tag; rollback = one image-tag line |

## The engine: build-manifest + walking skeleton + `/build-phase`

- **Build manifest** (`docs/build-manifest.md`, compiled at 2.3) is the spec→code
  conversion layer: ordered phases P0..PN, each with a `Phase-type`
  (`crud | async-job | media-pipeline | external-integration | storage`), its
  acceptance checks, screen-inventory rows, and a `Verify-by` cadence. Playbook:
  `harness/docs/playbooks/build-manifest-compilation.md`.
- **Walking skeleton** (2.4) scaffolds the proven **pnpm monorepo · NestJS +
  Prisma + Postgres · Next.js · CI · e2e** stack template (`harness/templates/
  stack-pnpm-nest-next/`) so no phase hand-derives infrastructure.
- **`/build-phase`** runs ONE manifest phase per isolated invocation: implement →
  stage-boundary commit → an **independent verifier subagent** checks the running
  preview against the phase's acceptance criteria. The next phase MUST NOT start on
  a FAIL. Engine: `cook` + `fullstack-developer`.

## The gates (the teeth)

- **DoR** (`gates/dor-build.md`) — before building: baseline frozen, ERD frozen,
  build-manifest complete.
- **Phase acceptance** (`gates/phase-acceptance.md`) — **Legs 1–27**, run every
  phase against the running app: functional AC · visual fidelity · negative path ·
  type-specific categories · universal-UI floor (+ image integrity) · security /
  object-authz(IDOR) / rate-limit / session-lifecycle · grid completeness ·
  route-reachability · seed-coherence · build+migration hygiene · create/edit-DTO
  round-trip · record-lifecycle · i18n-catalog · concurrency & atomicity ·
  resilience · multi-instance safety · prod-image packaging.
- **Visual fidelity** (`gates/visual-fidelity.md`) — **auto-blocks U1–U19**: adopt
  the prototype export as code (not re-draw), whole-screen region completeness,
  interaction-completeness, dead-affordance, responsive reflow, enum-status
  exhaustiveness, copy byte-fidelity, shared-primitive integrity, toast convention…
- **DoD** (`gates/dod-build.md`) — before showing the client: review + E2E +
  security + QA + user-manual + design-system + config-driven-identity +
  deploy-verify-at-source all green.
- **Pre-demo self-QA** (`playbooks/pre-demo-self-qa-checklist.md`) — a runnable
  7-group checklist the agent drives against the preview BEFORE any human handoff,
  turning eyeball-QA into agent self-check.

The gate set is **retrospective-enriched**: v6.19/v6.20 mined 330+ real defects from
two shipped projects (a content/UI app + a payments/multi-tenant backend) and folded
each recurring, machine-checkable class into a gate — so the next build catches at
build time what a human used to catch at the demo.

## Key Macro-2 playbooks (`harness/docs/playbooks/`)

`build-execution` (branch/commit cadence + adopt-export-as-code) ·
`prototype-export-adoption` · `seed-data-pattern` · `async-job-queue` ·
`object-storage` · `media-pipeline` · `external-integration` · `payment-integration` ·
`code-review-scoring` · `canonical-e2e-flow-playbook` · `config-driven-identity` ·
`go-live-deploy-verify` · `pre-demo-self-qa-checklist` · `demo-video-production`.

## How to run

```bash
# 1. install the harness into a project (skeleton + your spec + verify-gate + STAGE.md)
harness/scripts/install-harness.sh --bootstrap --spec ./your-spec.md ./my-project

# 2. open Claude Code in ./my-project, then repeat the run loop:
/stage-next     # runs the next WORKFLOW step via the stage-runner subagent,
                # enforces the step's gate, updates STAGE.md, lands one commit.
                # Through Macro 2 this drives 2.1 → 2.5.

/build-phase    # at 2.6: builds ONE manifest phase, then the independent verifier
                # runs the phase-acceptance gate (Legs 1–27) against the running
                # preview. Repeat P1..PN. A FAIL blocks the next phase.

/gate-check     # verify any gate (DoR / phase-acceptance / DoD) on demand.
```

Deploy is **verify-at-source, fail-closed** (`playbooks/go-live-deploy-verify.md`):
confirm the *running artifact* carries the release — health `.status==ok` + a
content marker only the new build produces — never a green CI run or an HTTP 200.

`ck-*` skills accelerate each step but are **not required** — the harness runs on a
bare agent + git + bash (Independence Principle, `harness/docs/HARNESS.md`).

## Where to go deeper

- Operating model + locked decisions: `harness/docs/HARNESS.md`
- Full step tables + gate list: `harness/docs/WORKFLOW.md`
- Per-step goals: `harness/docs/STAGE_GOALS.md`
- Gates: `harness/docs/gates/` · Playbooks: `harness/docs/playbooks/`
- Version history / why each gate exists: `harness/docs/HARNESS_CHANGELOG.md`
