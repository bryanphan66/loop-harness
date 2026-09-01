# Role Map

Which SDLC role plays each step, and which **agent(s)** + **skill engine(s)**
perform it. The `ck-*` skills are the **live engine** the harness invokes — they
are never vendored into a project (see `docs/about/HARNESS.md` § Independence
Principle). On a bare agent + git + bash, the global agents alone can play every
role; the skills only accelerate.

**Authority:** this file. **Orchestration:** `docs/process/WORKFLOW.md`
binds each role to numbered steps; `stage-runner` delegates one step at a time.

## Role Catalog

| Role | Core responsibility | Played by (agent / skill engine) |
|---|---|---|
| **PM** (Delivery Lead) | go/no-go intake, scope baseline, bao-gia/SOW/contract, payment milestones, client communication, change-control register, owns every client-paging gate | `project-manager`, `planner` · `ck-intake-file`, `ck-scope-confirmation`, `ck-client-update`, `ck-project-status` |
| **BA** (Requirements Engineer) — *spine* | reverse-requirements, gap analysis (MoSCoW), **SRS IEEE-830 + REQ-ID**, VISION_SCOPE, USE_CASES, RTM, GLOSSARY, CLARIFICATIONS, BPMN, scenarios; mints the token chain; change-request impact | `researcher`, `planner` · `ck-rri`, `ck-xre`, `ck-scenario`, `ck-persona`, `audit-product-feature` |
| **Designer** (UX/UI) | **pin Tier-1** (`docs/design-system/design-rules.md` version in `design-guidelines.md` §0) + **brand/tokens (Tier-2)** + **shadcn inventory (Tier-3)** → **classify every grid/form screen to one §4 floorplan** (or CUSTOM per §4.7) in `screen-inventory.md` → screen map / user flow / RPM / status-flow → prototype **all functions** from BA docs so each export **conforms** to its floorplan → freeze prototype | `ui-ux-designer` · `ck-brand-guidelines`, `ck-design-system`, `ck-ux-design`, `ui-styling` · **prototype (1.12) in an external design tool — Claude Design / Open Design / Google Stitch / Pencil.dev, not generated in Claude Code** |
| **SA** (Solution Architect) | design + **freeze ERD**, entity relationships, domain boundaries, state machines, multi-tenant/audit fields, map every REQ → data | `planner`, `researcher` · `ck-tech-design` (databases), `databases` |
| **Tech Lead** | choose **tech stack** vs NFR, system architecture, API contract, security model, authz, phase plan, DoR/DoD, wears the reviewer hat (6-dim rubric) | `planner`, `code-reviewer`, `brainstormer` · `ck-tech-design`, `ck-plan`, `ck-predict`, `ck-code-review` |
| **DevSecOps** | dev/staging/prod env, IaC, CI/CD, secrets, monitoring/alerting, backup **before** code; independent STRIDE/OWASP security review; go-live readiness; GitOps deploy (cosign/SBOM) | `fullstack-developer` (infra hat), `git-manager` · `devops`, `deploy`, `ck-security`, `security-scan`, `ck-prod-readiness`, `ck-seed`, `ship` |
| **Fullstack Dev** | code features by phase/API/ERD/tokens, commit cites ≥1 token, handle loading/empty/error states, no arch change without an ADR | `fullstack-developer` → `code-simplifier`, `debugger` · `cook`, `backend-development`, `frontend-development`, `fix`, `ck-debug` |
| **QC/QA** | write E2E **from BA acceptance criteria** (not from code), demo data, user-manual (field-by-field + video), real-browser QA with human approval gate, record TC-NNN | `tester` · `ck-e2e-flow`, `ck-scenario`, `ck-qa`, `test`, `web-testing` |
| **Release Manager** | aggregate go-live checklist, authorize release, merge→tag→deploy, release-note (every released REQ), post-deploy smoke | `git-manager`, `project-manager` · `ship`, `deploy`, `ck-prod-readiness` |
| **Support/SRE** (Hypercare Lead) | hypercare window, incident/escalation, monitoring review, SLA, backup/restore drill, handover package + maintenance proposal | `project-manager`, `fullstack-developer`, `debugger` · `ck-handover`, `ck-hypercare`, `ck-debug`, `fix` |
| **Docs/Audit** (always-on) | crosswalk docs, ADR by slug, session-retro, keep `STAGE.md`/`ROADMAP.md`/verification register advancing atomically inside stage-boundary commits, agent memory | `docs-manager`, `journal-writer` · `docs`, `journal`, `retro` |
| **Stage Orchestrator** (control plane) | read `STAGE.md` first, pick the next step, delegate one step at a time in isolated context, enforce the gate, update `STAGE.md`, write the stage-boundary commit | project-local `stage-runner.md` + `/stage-next` |

> **Design system is cross-role, not Designer-only.** The Fullstack Dev (2.6) and
> the Tech Lead reviewer (2.7) also consult Tier-1 `docs/design-system/design-rules.md`
> — the dev classifies any grid/form screen before coding it, and the reviewer
> enforces the design-system-compliance floor rule (see `AGENTS.md` § UI / Design
> System Rule and `docs/process/WORKFLOW.md` rows 2.6/2.7).

## SA and Tech Lead Are Separate (D5)

The user **locked** SA and Tech Lead as **two distinct named roles** — do not
merge them, even though the same stack agent (`planner`) may run them
back-to-back.

| | **SA** (Solution Architect) | **Tech Lead** |
|---|---|---|
| Owns | the **ERD freeze** (step 2.1) | the **stack / API / security / threat-model** (step 2.2) |
| Output | frozen ERD, entity relationships, domain boundaries, audit+tenant fields | stack decision (vs NFR), API contract, authz model, STRIDE threat-model |
| Gate | ERD FROZEN | stack justified + API contract complete |
| ADR slug | `<domain>-data-model-freeze` | `<project>-stack-selection`, `<project>-threat-model` |

The "minimalism" red-team proposed merging them; the user kept them separate.
**Do not auto-reverse this decision.** Decision record:
`docs/decisions/sa-and-tech-lead-separate-roles.md`.

## How stage-runner Delegates To Each Role

`stage-runner` is the control-plane orchestrator. For each step in
`docs/process/WORKFLOW.md`:

1. Read `STAGE.md` → identify the next step ID and its Role + Engine columns.
2. Load only the step's goal + the relevant playbook (isolated context — the
   main agent never sees the 10-30k tokens of stage work).
3. Invoke the role's engine. If the `ck-*` skill is present (preflight passed),
   use it; otherwise fall back to the global agent + the playbook's core logic
   (Independence Principle).
4. Write the step's artifact to the Output path in `docs/process/WORKFLOW.md`.
5. Enforce the Gate. For client-paging gates (PB-G2, PB-G3, PB-G4, ACCEPTANCE,
   HANDOVER), emit a `MANUAL_CHECKPOINT` and return
   `MANUAL_CHECKPOINT_PENDING`. For conditional enterprise gates, mark **N/A by
   decision** when not applicable — never silently drop.
6. Update `STAGE.md` (+ `ROADMAP.md` where it applies) in the **same**
   stage-boundary commit as the artifact.
7. Return a compact `**Status:**` block (≤200 words): `DONE |
   DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT | MANUAL_CHECKPOINT_PENDING`.

See `AGENTS.md` § Stage Orchestration for invocation and status handling.
