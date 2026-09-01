<!--
TEMPLATE: STAGE.md (per-project stage tracker)
Used by: Always-on control plane. Copied to the bootstrapped project's REPO ROOT at the baseline commit. Read FIRST every Task Loop (AGENTS.md § Source Of Truth).
Role: Stage Orchestrator (stage-runner) · updated in every stage-boundary commit
Output path: <project-root>/STAGE.md
Bilingual: INTERNAL — English only (no locale-vi fork) per D4.
Model: the 3-macro model (Pre-Build / Build & Go-live / Post-Build) with the
  canonical gates PB-G1..PB-G4, DoR, ERD FROZEN, SECURITY SIGN-OFF, DoD,
  ACCEPTANCE, HANDOVER (docs/process/WORKFLOW.md § Canonical Gate List).
Shape-only scaffold. Replace <placeholders>.
-->

# Project Stage

> Single-glance answer to "which `docs/process/WORKFLOW.md` step is this project at?".
> Read this **first** every Task Loop. Updated in **every** stage-boundary
> commit (the same commit as the artifact + `docs/ROADMAP.md`).

## Snapshot

- **Macro-stage:** Pre-Build | Build & Go-live | Post-Build
- **Lane:** Full | Lite — declared at intake (1.2); see `docs/process/WORKFLOW.md` § Lanes
- **Harness source:** <path of the harness clone or `owner/repo@ref` — filled by install-harness.sh; step 2.4 scaffolds the stack template from here>
- **Current step:** <e.g. 1.9 — Feature register + scope baseline>
- **Last completed:** <e.g. 1.8 — Scenario edge-case> on YYYY-MM-DD (commit <short-sha>)
- **Next gate:** <one-line — what unlocks the next step, e.g. "PB-G2: scope frozen (client)">
- **Client-paging?** yes (PB-G2 / PB-G3 / PB-G4 / ACCEPTANCE / HANDOVER) | no
- **Conditional gates marked N/A-by-decision:** <list or "none yet">
- **Blockers:** <none | description>
- **Updated:** YYYY-MM-DD by <author / agent>

## How To Use

1. Returning after time away? Read this file first.
2. Starting work? Verify Current step matches what you intend to do.
3. Completing a step? Move its Pending row to History (with date + commit SHA),
   update Snapshot, then commit `STAGE.md` as part of the stage-boundary commit.
4. Marking a conditional enterprise gate N/A? Record it in Snapshot — never drop
   it silently.

## History

Append-only. One row per completed step. Cite the short SHA so `git show <sha>`
reproduces the artifact set.

**Commit-SHA back-fill convention:** a stage-boundary commit cannot know its own
SHA. Write `— (this commit)` in the new row, then back-fill the previous row's
real SHA in the NEXT stage-boundary commit. A row left `—` is still resolvable:
`git log --oneline --grep 'step <ID>'` is the source of truth.

| Macro-stage | Step | Done date | Commit | Gate cleared | Notes |
|---|---|---|---|---|---|
| Pre-Build | 1.1 Lead capture | YYYY-MM-DD | — | — | <how the project started> |
| Pre-Build | 1.2 Intake brief | YYYY-MM-DD | <sha> | PB-G1 (internal) | <one-line> |

## Pending

The full 3-macro route. Mark conditional enterprise rows `N/A-by-decision` when
not applicable (never delete them silently).

### Macro 1 — Pre-Build

> **Lite lane:** route is `1.1 → 1.2 → 1.5-lite → 1.9-lite → 1.10-lite → 1.11 →
> 1.12 → 1.13 → 2.1`; mark 1.3/1.4/1.6/1.7 rows `merged into 1.5-lite` and
> 1.14/1.15 `N/A-by-decision (Lite)` — never delete rows silently.

| Step | Status | Gate to clear | Owner |
|---|---|---|---|
| 1.3 Discovery interview | pending | persona coverage / time-box | BA |
| 1.4 Gap analysis | pending | As-Is/To-Be/GAP-NNN/MoSCoW frozen | BA |
| 1.5 SRS + REQ-ID | pending | every req has REQ-ID `MODULE.AREA.NN` | BA |
| 1.6 Validate + resolve BLOCKERs | pending | rolled into PB-G2 | BA |
| 1.7 Vision/use-cases/glossary/BPMN/RTM | pending | RTM completeness | BA |
| 1.8 Scenario edge-case | pending | high-risk reqs → SC-NNN or skip | BA |
| 1.9 Feature register | pending | **PB-G2 (CLIENT): scope frozen** | BA + PM |
| 1.10 Brand + design tokens | pending | Component Coverage Matrix | Designer |
| 1.11 Screen map / flows / RPM / status-flow | pending | RPM + status-flow coverage | Designer |
| 1.12 Prototype all functions | pending | each screen ≥1 sample + ≥1 empty/error | Designer |
| 1.13 Review loop + FREEZE | pending | **PB-G3 (CLIENT): prototype frozen** | Designer + PM |
| 1.14 Bao-gia + SOW + contract draft | pending | every price line ↔ 1 feature-register row | PM |
| 1.15 Sign contract + deposit | pending | **PB-G4 (CLIENT, hardest): no build code before this** | PM |

### Macro 2 — Build & Go-live

| Step | Status | Gate to clear | Owner |
|---|---|---|---|
| 2.1 ERD freeze | pending | **ERD FROZEN** | SA |
| 2.1b Data migration / cutover | pending | **CONDITIONAL — N/A-by-decision** if greenfield | SA + DevSecOps |
| 2.2 Stack + TDR + threat-model | pending | stack justified, API complete, STRIDE | Tech Lead |
| 2.3 Implementation plan + build manifest + DoR | pending | **DoR GATE** (manifest coverage proven) | Tech Lead + PM |
| 2.4 Walking skeleton (P0) + env + CI/CD | pending | **WALKING SKELETON** boots + CI green | DevSecOps |
| 2.5 Seed + foundation data | pending | seeded admin login works; P0 done | DevSecOps + Dev |
| 2.6 Code by phase (`/build-phase` loop P1..PN) | pending | per phase: validate:quick + smoke + token commit + **PHASE ACCEPTANCE** (verifier PASS; human checkpoint per cadence) | Fullstack Dev |
| 2.7 Code review (6-dim, at manifest completion) | pending | score ≥7, no dimension = 0 | Tech Lead |
| 2.8 E2E + user manual | pending | every REQ-ID ≥1 E2E pass + TC-NNN | QC/QA |
| 2.9 Security review | pending | **SECURITY SIGN-OFF**: 0 Critical/High | DevSecOps |
| 2.10 QA real-browser + video | pending | **DoD GATE** | QC/QA |
| 2.11 Go-live readiness | pending | readiness green; NFR/load + DR **N/A-by-decision** if not needed | DevSecOps + PM |
| 2.12 UAT + sign-off | pending | **ACCEPTANCE (CLIENT)** | BA + Release Mgr + Client |
| 2.13 Release | pending | release-note + smoke pass | Release Manager |

### Macro 3 — Post-Build

| Step | Status | Gate to clear | Owner |
|---|---|---|---|
| 3.1 Handover package | pending | **HANDOVER (CLIENT)**: secrets rotated | Support/SRE + PM |
| 3.2 Hypercare + SLA window | pending | window closed, 0 Critical open | Support/SRE |
| 3.3 Steady-state maintenance | pending | uptime in SLA, backup verified | DevSecOps |
| 3.4 Maintenance proposal | pending | tier proposed; client decides | PM |
| 3.5 Change control (always-on) | continuous | impact + re-estimate + approval before code | BA + PM |
| 3.6 Retro + journal + memory | pending | lessons captured; memory persisted | Docs/Audit |

## Pointers

- Whole-project map (modules + timeline + %): `docs/ROADMAP.md`.
- Step tables + gate definitions: `docs/process/WORKFLOW.md`.
- Token chain: `docs/about/TRACE_SPEC.md`.
- Role bindings: `docs/about/ROLE_MAP.md`.
