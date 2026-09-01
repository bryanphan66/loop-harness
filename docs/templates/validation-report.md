<!--
TEMPLATE: Validation Report
Used by: WORKFLOW step 2.8 (E2E) → 2.10 (QA / DoD). Records the proof status for a story/slice that the verify-gate reads.
Role: QC/QA · Engine: ck-e2e-flow · ck-qa · test
Output path: docs/uat/validation-report-<slug>.md  (or alongside the story)
Bilingual: INTERNAL — English only (no locale-vi fork) per D4.
Token grammar (D3): maps each REQ-ID (MODULE.AREA.NN) → TC-NNN result. Feeds the verification register the verify-gate parses (scripts/harness-verify-gate.sh).
Shape-only scaffold. Replace <placeholders>.
-->

# Validation Report — <story / slice name>

Date: YYYY-MM-DD · Macro-stage/step: <Build & Go-live / 2.8>

> Records proof status for the verify-gate. The verification register reads the
> `Result` column: a `fail` (or `never-run` on a stage-close commit) blocks the
> commit. Each in-scope REQ-ID needs ≥1 passing TC-NNN before ACCEPTANCE.

## Scope

What story or change was validated? Cite the REQ-IDs.

- REQ-IDs: `ORD.STATUS.01`, `ORD.STATUS.02`
- Story: `docs/stories/order-02-status-view.md`

## Commands Run

```text
<exact command — e.g. pnpm test:e2e --filter order-status>
```

## REQ-ID × TC-NNN Coverage

The RTM-forward proof. Every in-scope REQ-ID → ≥1 TC-NNN with a Result.

| REQ-ID | TC-NNN | Test name | Result | Notes |
| --- | --- | --- | --- | --- |
| `ORD.STATUS.01` | `TC-001` | order-status-view-happy | pass | |
| `ORD.STATUS.02` | `TC-002` | order-status-update-staff | pass | |

## Layer Results

| Layer | Result | Notes |
| --- | --- | --- |
| Typecheck | pass / fail / not-run | |
| Unit | pass / fail / not-run | |
| Integration | pass / fail / not-run | |
| E2E | pass / fail / not-run | |
| Platform | pass / fail / not-run | |
| Release | pass / fail / not-run | |

`not-run` is allowed only where the command does not yet exist — state why. On a
stage-close commit, a required layer that is `never-run` blocks the gate.

## Evidence

Report paths, screenshots, video links, logs.

## Gaps

Remaining risk, missing TC-NNN, or missing harness capability. A high-risk REQ-ID
with no SC-NNN and no skip note is an **incomplete RTM** — resolve before close.

---

**Pointers**

- RTM completeness rule: `docs/TRACE_SPEC.md` § RTM Completeness Rule.
- Verify-gate: `scripts/harness-verify-gate.sh` (reads the verification register).
- DoD gate: WORKFLOW 2.10.
