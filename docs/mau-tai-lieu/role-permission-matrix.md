<!--
TEMPLATE: Role-Permission Matrix (RPM)
Used by: WORKFLOW step 1.11 (screen map / flows / RPM / status-flow / ERD draft); re-checked at ACCEPTANCE (2.12)
Role: Designer (UX/UI) · Engine: ck-ux-design · visual-and-behavioral-modeling
Output path: docs/visuals/diagrams/role-permission-matrix.md
Bilingual: client-facing → fork to docs/mau-tai-lieu/locale-vi/role-permission-matrix.md (D4)
Token grammar (D3): every non-N grid cell cites a REQ-ID (MODULE.AREA.NN). Do NOT use US-NNN.REQ-MMM.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths EN even in the VN fork.
-->

# Role-Permission Matrix — <project name>

Status: draft | reviewed-by-client | accepted · Last updated: YYYY-MM-DD

> Frozen during Design Prototype (step 1.11), cross-checked at **ACCEPTANCE**
> (2.12). Captures who-can-do-what before code — authorization holes are 10x
> cheaper to fix in the matrix than in a production audit.
>
> Every non-`N` cell cites a **REQ-ID** (`MODULE.AREA.NN`).

## Roles

| Role | One-line scope | Notes |
| --- | --- | --- |
| guest | Unauthenticated visitor | Public surfaces only. |
| customer | Authenticated end-user | Owns own data. |
| staff | Operational user | Reads everyone's data; writes within their unit. |
| admin | Tenant administrator | Manages staff + config inside one tenant. |
| superadmin | Cross-tenant operator | Vendor / platform owner. |

Adapt to the project. Map every project title (Manager, Cashier, etc.) to a row
above, OR add a new row if truly distinct. A role with no distinct permission
grid is not a role — collapse it.

## Resources

Every entity / surface with permission semantics. One row per resource.

| Resource | One-line description |
| --- | --- |
| account | The actor's own user record |
| product | Catalog item |
| order | Customer purchase |
| ... | ... |

## Permission Grid

Permission values: `Y` = full · `O` = own-only · `N` = none · `C` = conditional
(cite a numbered condition). Actions: C = Create, R = Read, U = Update, D =
Delete. Add custom action columns (e.g. `Refund`, `Approve`).

| Resource | Role | C | R | U | D | Custom: <action> | REQ-ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| account | guest | N | N | N | N | — | — |
| account | customer | N | O | O | O | — | `IF.ACCT.01` |
| account | staff | N | Y | C¹ | N | — | `IF.ACCT.02` |
| account | admin | Y | Y | Y | C² | — | `IF.ACCT.03` |
| product | guest | N | Y | N | N | — | `CAT.PROD.01` |
| product | staff | Y | Y | Y | C³ | — | `CAT.PROD.02` |
| order | customer | Y | O | C⁴ | N | — | `ORD.ORDER.01` |
| order | staff | N | Y | Y | N | `Refund: Y` | `ORD.ORDER.02` |

## Conditions

Each `C` cites a numbered condition.

1. Staff can update an account only when an active support ticket links staff to that account.
2. Admin can delete an account only after a 30-day grace period and only with no open orders.
3. Staff can delete a product only if no order references it; otherwise soft-delete (`archived=true`).
4. Customer can update an order only while status is `pending`; beyond that, change-request flow.

## Authentication Requirements

| Surface | Auth required | Re-auth required |
| --- | --- | --- |
| Browse catalog | no | — |
| Checkout | yes | re-auth if order > <threshold> |
| Admin dashboard | yes | re-auth on every session |
| Account deletion | yes | re-auth + 2FA |

## Audit Requirements

| Resource × Action | Audited? | Retention |
| --- | --- | --- |
| account × U / D | yes | 7 years |
| order × C / U / refund | yes | 7 years |
| product × C / U / D | yes | 1 year |

## Token Coverage Check (before freeze)

- [ ] Every role appears in the grid (no missing role).
- [ ] Every resource appears in the grid (no missing resource).
- [ ] Every `C` has a numbered condition.
- [ ] Every non-`N` cell cites a `REQ-ID` (`MODULE.AREA.NN`).
- [ ] § Authentication covers every authenticated surface.
- [ ] § Audit lists every retention-critical mutation.

## Change Log

Append-only after first client review. Post-freeze changes need a CR-NN.

| Date | Change | Reason | CR ID |
| --- | --- | --- | --- |
| YYYY-MM-DD | Added `Refund` for staff × order | Client clarified at ACCEPTANCE | CR-NN |

## Sign-Off

| Stage | Date | Approver |
| --- | --- | --- |
| Prototype freeze (step 1.11) | YYYY-MM-DD | <vendor lead> |
| ACCEPTANCE confirmation (2.12) | YYYY-MM-DD | <client signoff name> |

---

**Pointers**

- Playbook: `docs/playbooks/visual-and-behavioral-modeling.md`.
- Cross-check: `docs/mau-tai-lieu/status-flow.md` (roles must match transition rows).
- Token grammar: `docs/about/TRACE_SPEC.md`.
- Localization: forks to `docs/mau-tai-lieu/locale-vi/role-permission-matrix.md` (D4).
