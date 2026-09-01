<!--
TEMPLATE: Prototype Feedback Round (one record per review round)
Used by: WORKFLOW step 1.13 (review loop + FREEZE) — one copy per round.
Role: Designer + PM · Engine: facilitation; mint CR-NN via docs/mau-tai-lieu/change-request-log.md on feature-change.
Output path: docs/visuals/prototype/feedback-NN.md   (NN = round number, 01-based). The freeze record is feedback-final.md.
Bilingual: INTERNAL — English only (no locale-vi fork) per D4.
Authority: docs/process/STAGE_GOALS.md § Step 1.13 (Loop mechanics + Feature-change rule), docs/gates/pb-g3-prototype-frozen.md.
Triage rule (D-prototype-external-design-tool): the "Type" column forces visual-only vs feature-change at intake.
  - visual-only   → fix in the external tool, re-validate conformance, stays in the loop.
  - feature-change→ scope drift (feature-register froze at PB-G2) → mint a CR-NN; do NOT edit feature docs in this loop.
Cap = 2 rounds. A 3rd round is a scope problem, not a design problem.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths/code-fences EN.
-->

# Prototype Feedback — Round <NN>

**Project:** <project name> · **Date:** YYYY-MM-DD · **Round:** <NN> / 2
**Source:** <tool comment thread / call / email / chat> · **Reviewer:** <client name>
**Prototype version reviewed:** <vN> · **Share URL:** <link>

## Items

| # | Screen (FID) | Comment (client) | Type | Action | CR ref | Status |
|---|---|---|---|---|---|---|
| 1 | <F-0NN screen> | "<verbatim client comment>" | visual-only | fix in tool | — | open |
| 2 | <F-0NN screen> | "<verbatim client comment>" | feature-change | → mint CR | CR-NN | open |

> **Type** = `visual-only` (stays in loop) or `feature-change` (scope drift → CR-NN).
> **Status** = `open` / `done` / `deferred-to-CR`.

## Process-Logic Review *(process-complex features only)*

A clickable prototype freezes screen states, not process logic. For each feature
flagged process-complex at 1.11 (async / scheduled / state-machine / branching /
multi-actor), **walk the client through its flow diagram** and record confirmation
here. Unconfirmed rows block PB-G3.

| FID | Process-complex feature | Diagram (`locale-vi/`) | Walked through? | Client confirmed logic? |
|---|---|---|---|---|
| <F-0NN> | <e.g. async scan pipeline> | `diagrams/locale-vi/business-workflow.md` (BW-0N) | y/n | y/n |

> Confirmation = the client validated the **process behavior** (timing, states,
> branching, hand-offs), not only the screen. Drives the process-annex line on the
> PB-G3 checklist.

## Round Summary

```text
Visual-only fixes:     <N>   (re-validated design-system-compliance + floorplan conformance: y/n)
Feature-changes → CR:  <CR-NN, CR-MM ...>   (logged in docs/scope-baseline/change-request-log.md)
Revised version:       <vN+1>   shared on  YYYY-MM-DD
Round count:           <NN> / 2   (>2 → scope problem; name it before freezing)
Next:                  re-review  /  proceed to freeze (feedback-final.md, PB-G3)
```

## Cross-References

- Loop spec: `docs/process/STAGE_GOALS.md` § Step 1.13 · `docs/process/WORKFLOW.md` row 1.13.
- Freeze gate: `docs/gates/pb-g3-prototype-frozen.md`.
- Change requests: `docs/mau-tai-lieu/change-request-log.md` (where each `CR-NN` is logged).
- Prototype record: `docs/visuals/prototype/README.md`.
