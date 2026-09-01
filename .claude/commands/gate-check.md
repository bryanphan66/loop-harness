---
description: Assert a 3-macro-stage gate (PB-G2/G3/G4 or a Build/Post gate) is GREEN before a later step may run; print exactly what is missing
allowed-tools: Read, Bash, Grep, Glob
---

Goal: verify a harness gate is satisfied BEFORE a later step proceeds, and if it
is not, print precisely what is missing. This is the guardrail that stops build
code starting before **PB-G4** and stops out-of-order step execution.

Gates are defined in `docs/process/WORKFLOW.md` § Canonical Gate List. Token chain rules
are in `docs/about/TRACE_SPEC.md` (RTM completeness). The verify-gate command
(`scripts/harness-verify-gate.sh`) is the mechanical proof source where present.

## Arguments

- `--gate <name>` → check a specific gate: `PB-G1 | PB-G2 | PB-G3 | PB-G4 |
  DoR | ERD-FROZEN | WALKING-SKELETON | SECURITY-SIGNOFF | DoD | ACCEPTANCE |
  HANDOVER`.
- `--before <step-id>` → "is the gate that must be GREEN before step `<id>`
  satisfied?" (auto-resolves the gate from the step's position).
- No argument → check the gate that gates the **Current** step in `STAGE.md`.

## Steps

1. Read `STAGE.md` (Current step, **Lane**, blockers) and `docs/process/WORKFLOW.md`
   (the Canonical Gate List + the step tables). In the **Lite lane**
   (`docs/process/WORKFLOW.md` § Lanes): PB-G2/PB-G3 clear on a recorded owner ack, and
   the 2.x hard line is PB-G3 frozen **+ `1.14/1.15 — N/A by decision (Lite
   lane)` recorded in STAGE.md** instead of PB-G4.

2. Resolve which gate to assert:
   - From `--gate`, use it directly.
   - From `--before <id>`, map the step to its predecessor gate:
     - any `1.10`–`1.13` (design) → needs **PB-G2** (scope frozen) GREEN.
     - `1.14` (bao-gia) → needs **PB-G3** (prototype frozen) GREEN
       (PROTOTYPE-THEN-QUOTE invariant — quote only after the prototype freezes).
     - any `2.x` (build code) → needs **PB-G4** (contract + deposit) GREEN
       (**Lite lane:** PB-G3 frozen + 1.14/1.15 N/A-by-decision recorded).
       **This is the hard line: no build code before it.**
     - `2.4`+ → also needs **DoR** GREEN (incl. build-manifest completeness).
     - `2.5`/`2.6` → also needs **WALKING-SKELETON** GREEN (2.6 additionally
       needs manifest P0 marked done).
     - `2.10` (DoD) → needs review + E2E + security + QA evidence.
     - `2.13` (release) → needs **ACCEPTANCE** GREEN.
     - `3.2`+ → needs **HANDOVER** GREEN.
   - With no argument, gate the Current step the same way.

3. Assert the gate's clearing condition (from `docs/process/WORKFLOW.md`). Check
   mechanically where possible — prefer evidence over assumption:

   | Gate | GREEN when (evidence to look for) |
   |---|---|
   | **PB-G1** | intake brief records a go/no-go decision (`docs/intake/*-intake-brief.md` has proceed/park/decline). Internal — does not page client. |
   | **PB-G2** | every BLOCKER in `docs/requirements/CLARIFICATIONS.md` answered + `docs/scope-baseline/feature-register.{md,xlsx}` marked frozen + RTM **backward** complete (every feature-register line → ≥1 REQ-ID + ≥1 use case, per `docs/about/TRACE_SPEC.md`). Client sign recorded. |
   | **PB-G3** | `docs/visuals/prototype/feedback-final.md` records a written freeze; no open scope-drift items. |
   | **PB-G4** | signed contract + deposit recorded; `docs/ROADMAP.md` skeleton exists. **No build code may exist before this.** |
   | **DoR** | requirements baselined + scope signed (PB-G4 / Lite equivalent) + ERD frozen + design approved + acceptance criteria + NFR present + **build-manifest complete** — assert the full DoR checklist incl. the manifest-completeness rule from `docs/gates/dor-build.md` (SoT). |
   | **ERD-FROZEN** | ERD ADR (`docs/decisions/<domain>-data-model-freeze.md`) + entities/normalization/audit+tenant fields reviewed. |
   | **WALKING-SKELETON** | scaffolded app: install + build green, `docker compose up` boots, health endpoint 200, seeded admin login works (after 2.5), CI(-equivalent local run) green, secret scan clean. Prefer running the commands over reading claims. |
   | **SECURITY-SIGNOFF** | security report shows 0 Critical/High open + red-team performed. |
   | **DoD** | review record (score ≥7, floor rules clean) + every REQ-ID → ≥1 passing TC-NNN (incl. negative-path + auth-to-data coverage per `docs/playbooks/canonical-e2e-flow-playbook.md` § Mandatory Coverage Rules) + security sign-off + QA evidence + `docs/gates/visual-fidelity.md` all key screens pass + user-manual. |
   | **ACCEPTANCE** | critical journeys pass + matches prototype + signed sign-off (`docs/uat/*` + signoff). RTM **forward** complete (every REQ-ID → passing TC-NNN). |
   | **HANDOVER** | docs/credentials/training/source-IP received + verified + secrets rotated. |

4. For each unmet condition, list it as a concrete missing item with the file or
   token that proves it (e.g. "PB-G2 NOT GREEN: `IF.AUTH.03` has no
   feature-register line — RTM backward incomplete (`docs/about/TRACE_SPEC.md`)").

5. Run the verify-gate command if it exists, to confirm the verification
   register has no `fail` / `never-run` rows:
   - `bash scripts/harness-verify-gate.sh` (best-effort; report its output).
   - Do NOT bypass a red verify-gate to declare a gate GREEN.

## Output

Print a compact verdict:

```
Gate: <name>
Verdict: GREEN | NOT GREEN | N/A by decision
Checked for step: <id or "current">
Missing (if any):
  - <missing item 1 — with file/token evidence>
  - <missing item 2>
Next action: <one line — what clears it, who clears it>
```

Rules:
- **Client-paging gates** (PB-G2, PB-G3, PB-G4, ACCEPTANCE, HANDOVER) clear only
  when the human records the offline sign-off — never declare them GREEN from
  agent state alone. If the artifacts are ready but the human sign is missing,
  the verdict is **NOT GREEN — pending client sign**, and the next action is a
  `MANUAL_CHECKPOINT`.
- **Conditional enterprise gates** absent because marked **N/A by decision** →
  report `N/A by decision` with the file that records the decision; never report
  them as a silent pass. The tracked toggle table (SoT) is
  `docs/gates/dod-build.md` § Conditional Enterprise Gate Toggles.
- If asked `--before <id>` and the gate is NOT GREEN, state plainly: "step `<id>`
  must NOT run yet" and name the blocking gate.

Stay terse and evidence-first. A gate is GREEN only with proof, not assertion.
