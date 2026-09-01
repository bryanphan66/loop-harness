<!--
TEMPLATE: Status Flow (state machine per stateful entity)
Used by: WORKFLOW step 1.11 (screen map / flows / RPM / status-flow / ERD draft); re-checked at ACCEPTANCE (2.12)
Role: Designer (UX/UI) · Engine: ck-ux-design · visual-and-behavioral-modeling
Output path: docs/visuals/diagrams/status-flow-<entity>.md (one file per stateful entity)
Bilingual: client-facing → fork to docs/mau-tai-lieu/locale-vi/status-flow.md (D4)
Token grammar (D3): every transition cites a REQ-ID (MODULE.AREA.NN). Do NOT use US-NNN.REQ-MMM.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths EN even in the VN fork.
-->

# Status Flow — <entity name>

Status: draft | reviewed-by-client | accepted · Last updated: YYYY-MM-DD

> Frozen during Design Prototype (step 1.11), cross-checked at **ACCEPTANCE**
> (2.12). One file per stateful entity (order, application, ticket, subscription).
> Captures the legal state machine before code — catches "user stuck in state X,
> no transition out" defects before they ship.
>
> Every transition cites a **REQ-ID** (`MODULE.AREA.NN`).

## Entity

| | |
| --- | --- |
| Entity name | <e.g. order, application, ticket> |
| Owning resource | <e.g. orders table> |
| Stateful field | <e.g. `status` column> |
| Initial state | <e.g. `pending`> |

## States

A state with no inbound transition is unreachable (delete). A state with no
outbound transition is terminal (mark it).

| State | Description | Terminal? |
| --- | --- | --- |
| pending | Awaiting first action | no |
| in-review | Under staff review | no |
| approved | Approved, awaiting fulfillment | no |
| fulfilled | Delivered | yes |
| cancelled | Cancelled by customer or staff | yes |
| rejected | Rejected during review | yes |

## State Diagram (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> in-review: customer submits
    pending --> cancelled: customer cancels
    in-review --> approved: staff approves
    in-review --> rejected: staff rejects
    approved --> fulfilled: ops ships
    approved --> cancelled: customer cancels (refund)
    fulfilled --> [*]
    cancelled --> [*]
    rejected --> [*]
```

Update the diagram WHEN the transition table changes — they are two views of the
same fact.

## Transition Table

The canonical source. One row per legal transition.

| From | To | Trigger | Allowed role(s) | Pre-conditions | Side effects | REQ-ID |
| --- | --- | --- | --- | --- | --- | --- |
| pending | in-review | submit | customer | all required fields filled | notify staff | `ORD.FLOW.01` |
| pending | cancelled | cancel | customer | — | none | `ORD.FLOW.02` |
| in-review | approved | approve | staff | review notes filled | notify customer; charge hold | `ORD.FLOW.03` |
| in-review | rejected | reject | staff | rejection reason filled | notify customer; release hold | `ORD.FLOW.04` |
| approved | fulfilled | ship | staff | shipment confirmed | notify customer with tracking | `ORD.FLOW.05` |
| approved | cancelled | cancel | customer, staff | within 24h of approval | refund in full | `ORD.FLOW.06` |

Every transition cites ≥1 `REQ-ID`. Untokened rows are spec gaps — add the REQ to
the SRS or remove the row.

## Illegal Transitions

State pairs that look transitionable but are NOT allowed. Document explicitly.

| From | To | Why blocked |
| --- | --- | --- |
| fulfilled | * | Terminal; returns route via a new entity (return-order). |
| cancelled | pending | No reactivation; customer creates a new entity. |
| rejected | in-review | No re-review; customer creates a new application. |

## Role × Action Cross-Check

Cross-reference `role-permission-matrix.md`: every trigger callable by a role
requires that role's relevant resource × action cell to be non-`N`.

- [ ] Every "Allowed role(s)" matches the RPM grid.
- [ ] Every side-effect that mutates another entity is reflected in that entity's grid.

## Audit Requirements

| Transition | Audited? | Retention |
| --- | --- | --- |
| Any transition into a terminal state | yes | 7 years |
| approved → cancelled (with refund) | yes | 7 years |
| pending → cancelled | optional | 1 year |

## Edge Cases & SLAs

| Case | Behavior | Time bound |
| --- | --- | --- |
| Stuck in `in-review` > 7 days | Auto-notify staff manager | 7 days |
| Stuck in `approved` > 3 days | Auto-cancel + refund | 3 days |
| Payment failure during in-review → approved | Roll back to in-review; flag for re-attempt | immediate |

## Coverage Check (before freeze)

- [ ] Every state appears in § States.
- [ ] Every diagram state appears in § Transition Table (as From OR To).
- [ ] Every terminal state marked `yes` in § States.
- [ ] Every transition cites a `REQ-ID`.
- [ ] All allowed roles match `role-permission-matrix.md`.
- [ ] Illegal transitions enumerated.
- [ ] Edge-case SLAs defined for non-terminal states.

## Change Log

| Date | Change | Reason | CR ID |
| --- | --- | --- | --- |
| YYYY-MM-DD | Added `approved → cancelled` (within 24h) | Client policy | CR-NN |

## Sign-Off

| Stage | Date | Approver |
| --- | --- | --- |
| Prototype freeze (step 1.11) | YYYY-MM-DD | <vendor lead> |
| ACCEPTANCE confirmation (2.12) | YYYY-MM-DD | <client signoff name> |

---

**Pointers**

- Playbook: `docs/playbooks/visual-and-behavioral-modeling.md`.
- Cross-check: `docs/mau-tai-lieu/role-permission-matrix.md`.
- Token grammar: `docs/process/TRACE_SPEC.md`.
- Localization: forks to `docs/mau-tai-lieu/locale-vi/status-flow.md` (D4).
