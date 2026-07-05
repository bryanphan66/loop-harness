<!--
TEMPLATE: Story (work item)
Used by: WORKFLOW step 2.6 (code feature by phase). Born in Build & Go-live.
Role: Fullstack Dev (implements) · Engine: cook · fullstack-developer
Output path: docs/stories/<module>-NN-<slug>.md  (FLAT naming, e.g. order-02-status-view.md)
Bilingual: INTERNAL — English only (no locale-vi fork) per D4.
Token grammar (D3): a story realises one or more REQ-IDs (MODULE.AREA.NN); commits cite ≥1 REQ-ID or SC-NNN; tests mint TC-NNN. Do NOT use US-NNN.REQ-MMM.
Shape-only scaffold. Replace <placeholders>. Filename is FLAT <module>-NN-<slug>.md.
-->

# <module>-NN — <story title>

## Status

planned | in-progress | in-review | done

## REQ-IDs Realised

The story's reason to exist. Each must trace to a frozen feature-register line.

- `ORD.STATUS.01` — <one-line>
- `ORD.STATUS.02` — <one-line>

## Product Contract

Describe the behavior this story must make true.

## Relevant Spine Docs

- `docs/requirements/srs/<module>.md` (REQ-ID source)
- `docs/visuals/diagrams/role-permission-matrix.md` (authz)
- `docs/visuals/diagrams/status-flow-<entity>.md` (if stateful)

## Acceptance Criteria

- Criterion 1.
- Criterion 2.
- Criterion 3.

## Design Notes

- Commands:
- Queries:
- API:
- Tables:
- Domain rules:
- UI surfaces:

## Implementation Guardrails

Hold true during the build step regardless of who implements.

- Stay inside scope. Only change behavior this story names. Out-of-scope cleanup → new story or backlog row.
- Do not change architecture without a new `docs/decisions/<slug>.md` (slug, never a number). Renaming the stack, swapping the ORM, restructuring folders count.
- Do not delete code referenced elsewhere unless the deletion is the point. If unused, prove it (grep) and cite the proof.
- For any UI surface, handle loading, empty, and error states — not just the happy path.
- For any form or API input, validate at the boundary.
- Commit body explains WHAT changed and cites ≥1 `REQ-ID` (`MODULE.AREA.NN`) or `SC-NNN`.

## Validation

Each REQ-ID → ≥1 TC-NNN before ACCEPTANCE (`docs/TRACE_SPEC.md` § RTM forward).

| Layer | Expected proof | TC-NNN |
| --- | --- | --- |
| Unit | | |
| Integration | | |
| E2E | | `TC-001` |
| Platform | | |
| Release | | |

## Harness Delta

Any harness updates made or proposed because of this story.

## Evidence

Commands, reports, screenshots, or links — added after validation exists.
