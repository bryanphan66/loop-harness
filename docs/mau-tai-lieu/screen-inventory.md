<!--
TEMPLATE: Screen Inventory (design-system classification record)
Used by: WORKFLOW step 1.11 (screen map / classify) — produced before 1.12 prototype.
Role: Designer · Engine: ck-ux-design (Tier-1 floorplan classification); bare-agent fallback reads docs/design-system/design-rules.md directly.
Output path: docs/visuals/diagrams/screen-inventory.md   ← the grep-auditable classification record the verify-gate checks.
Bilingual: INTERNAL — English only (no locale-vi fork) per D4.
Authority: docs/design-system/design-rules.md (§3 choose-a-floorplan, §4 floorplans, §4.7 CUSTOM escape hatch, §5 tables, §8 modals, §10 states).
Token grammar (D3): each row cites the REQ-ID(s) it realises (MODULE.AREA.NN). Do NOT use US-NNN.REQ-MMM.
Shape-only scaffold. Replace <placeholders>; keep IDs/paths/code-fences EN.

VERIFY-GATE CONTRACT: scripts/harness-verify-gate.sh blocks the commit when THIS file exists and any
data row's Floorplan column is empty or a placeholder (<...>, TODO, ?). Skipped cleanly when the file is absent.
-->

# Screen Inventory — <project name>

Status: draft | classified | prototype-conformed · Last updated: YYYY-MM-DD

> The per-project **classification record**. One row per screen. Lands at
> `docs/visuals/diagrams/screen-inventory.md` at step **1.11** (before the 1.12
> prototype). It is the **grep-auditable** source the verify-gate and the
> `design-system-compliance.md` gate both read.
>
> **Mandatory scope:** every screen with a **data grid OR a create/edit form** must
> have a row with a non-empty **Floorplan** — **regardless of lane** (Tiny /
> internal modules included). Only a genuinely trivial single-screen tool with
> neither grid nor form may be omitted.

## How To Fill

1. Classify each screen's **App-type** first (§1/§3 of `design-rules.md`):
   transactional / fact-sheet / analytical.
2. Pick **exactly one** §4 **Floorplan** (List Report · Object Page · Worklist ·
   Overview Page · Analytical List Page · Wizard). If none fits, declare `CUSTOM`
   + a one-line rationale and add `docs/decisions/<slug>.md` (§4.7).
3. Record **Table behavior** flags (skip with `n/a` when the screen has no table).
4. Record the **Message pattern** split per interaction (validation / success /
   async-error) — §10.
5. Record the **Create/Edit pattern** (Dialog / Sheet / Object-Page) — §8.
6. Cite the **REQ-ID(s)** the screen realises.

## Floorplan Values (exactly one per row, or CUSTOM)

`List Report` · `Object Page` · `Worklist` · `Overview Page` ·
`Analytical List Page` · `Wizard` · `CUSTOM (<one-line rationale; ADR slug>)`.

> **Never leave Floorplan empty or a placeholder** (`<...>`, `TODO`, `?`) on an
> in-scope row — the verify-gate blocks the commit on it.

## Screen Inventory

| Screen | App-type (transactional/fact-sheet/analytical) | Floorplan (one §4, or CUSTOM+rationale) | Table behavior (resp/grid · page/scroll · multisel Y/N · inline-edit Y/N) | Message pattern (validation: inline · success: toast · async-error: inline-alert) | Create/Edit pattern (Dialog/Sheet/Object-Page) | REQ-ID(s) |
|---|---|---|---|---|---|---|
| Orders list | transactional | List Report | responsive · pagination · multisel Y · inline-edit N | inline · toast · inline-alert | Object-Page | `ORD.LIST.01` |
| Order detail | fact-sheet | Object Page | n/a | inline · toast · inline-alert | Object-Page | `ORD.DETAIL.01` |
| Approvals queue | transactional | Worklist | responsive · scroll · multisel Y · inline-edit Y | inline · toast · inline-alert | Dialog | `ORD.APPR.01` |
| Sales dashboard | analytical | Overview Page | n/a | inline · toast · inline-alert | n/a | `RPT.DASH.01` |
| Revenue analysis | analytical | Analytical List Page | grid · scroll · multisel N · inline-edit N | inline · toast · inline-alert | n/a | `RPT.REV.01` |
| New customer wizard | transactional | Wizard | n/a | inline · toast · inline-alert | Object-Page | `CRM.ONB.01` |
| Quick add customer | transactional | List Report | n/a | inline · toast · inline-alert | Dialog | `CRM.CUST.02` |
| Login | transactional | CUSTOM (auth shell, no floorplan; `auth-screens-custom`) | n/a | inline · toast · inline-alert | n/a | `IF.AUTH.01` |
| `<screen>` | `<type>` | `<§4 / CUSTOM+rationale>` | `<resp/grid · page/scroll · Y/N · Y/N>` | `<inline · toast · inline-alert>` | `<Dialog/Sheet/Object-Page>` | `<MODULE.AREA.NN>` |

> **Counter rule (D3):** REQ-IDs use `MODULE.AREA.NN`. A screen may cite multiple
> REQ-IDs (comma-separated). Recurring CUSTOM screens to expect (each needs an ADR
> slug per §4.7): auth/login/forgot-password, settings/preferences, global search
> results, onboarding/first-run, notifications center, full-page 403/404/500/
> maintenance, billing/pricing.

## Coverage Check (before 1.12 prototype)

- [ ] Every screen with a **grid or form** has a non-empty, non-placeholder
      Floorplan — including Tiny/internal-lane screens.
- [ ] Each Floorplan is exactly one §4 name **or** `CUSTOM` with a rationale.
- [ ] Every `CUSTOM` row has a matching `docs/decisions/<slug>.md`.
- [ ] Message pattern is split per interaction on every form-bearing screen.
- [ ] Inline-edit vs page-edit is decided (not left ambiguous) on every grid.
- [ ] Every row cites ≥1 REQ-ID present in the feature register / SRS.

---

**Pointers**

- Tier-1 rules: `docs/design-system/design-rules.md` (§3 choose · §4 floorplans ·
  §4.7 CUSTOM · §5 tables · §8 modals · §10 states).
- Per-screen gate: `docs/gates/design-system-compliance.md` (reads this file).
- Decision: `docs/decisions/three-tier-design-system-floorplan-enforcement.md`.
- Cross-stage playbook: `docs/playbooks/design-system-3-tier.md`.
- Verify-gate contract: `scripts/harness-verify-gate.sh` (Floorplan-column grep).
