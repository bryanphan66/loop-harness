<!--
TEMPLATE: ROADMAP.md (whole-project module / milestone map)
Used by: WORKFLOW step 1.15 (skeleton born at PB-G4); enriched + advanced through Build & Go-live. Updated in every stage-boundary commit.
Role: PM (Delivery Lead) · Engine: project-manager
Output path: <project-root>/docs/ROADMAP.md
Bilingual: INTERNAL — English only (no locale-vi fork) per D4. (Commercial dates live in VN docs/bao-gia/.)
Source of truth for committed dates: the SOW/bao-gia milestone table (1.14). This file MIRRORS those dates; date changes flow change-request-log.md (CR-NN) → SOW → here.
Token grammar (D3): modules reference their REQ-IDs (MODULE.AREA.NN); deferrals link a CR-NN.
Shape-only scaffold. Replace <placeholders>.
-->

# Project Roadmap

> Whole-project map: which modules, in what order, on what timeline, how far
> along. Companion to `STAGE.md` — STAGE.md is the single-glance "which step are
> we at **now**"; this is the full route.
>
> Skeleton born at **PB-G4** (1.15); enriched in Build & Go-live. **Committed
> dates source of truth = the SOW / `docs/bao-gia/` milestone table** (1.14).
> This file mirrors them; date changes flow `change-request-log.md` (CR-NN) →
> SOW → here.

## Snapshot

- **Project:** <name>
- **Macro-stage:** Pre-Build | Build & Go-live | Post-Build (mirror `STAGE.md`)
- **Modules / milestones:** <N total> (<done> done · <in-progress> in progress · <pending> pending)
- **Current milestone:** M<N> — <name>
- **Overall progress:** <0–100>%
- **Target completion:** <YYYY-MM-DD from SOW>
- **Updated:** YYYY-MM-DD by <author / agent>

## Modules / Milestones

Each row is a product module (the "what" — from the frozen feature-register), not
a delivery phase. `Target` maps each module to the SOW milestone date that ships
it. The `Stories` column stays empty until Build & Go-live slicing fills it.

| ID | Module / Milestone | Scope (one line) | REQ-IDs | Stories | Depends on | Target (SOW) | Status | % |
|---|---|---|---|---|---|---|---|---|
| M1 | <module name> | <what it delivers> | `IF.AUTH.*`, `IF.RBAC.*` | <filled in Build> | — | YYYY-MM-DD | pending | 0 |
| M2 | <module name> | <what it delivers> | `ORD.STATUS.*` | <filled in Build> | M1 | YYYY-MM-DD | pending | 0 |

Status values: `pending | in-progress | in-review | done | deferred`.
`deferred` rows must link the `change-request-log.md` (CR-NN) entry that moved
them.

## Run Order

Milestone sequence and why, anchored by the `Depends on` column. State which
modules can run in parallel and which are hard-blocked.

```text
M1 → M2 → M3
        └→ M4   (M4 parallel with M3 once M2 done)
```

> Post-PB-G4 parallel wave: ERD freeze (2.1) ∥ infra/CI (2.4) ∥ seed (2.5) once
> the plan lands (2.3). Reflect that here once the build starts.

## Timeline

Milestone → committed date, mirrored from the SOW / bao-gia.

| Milestone | Target (SOW) | Effort estimate | Notes |
|---|---|---|---|
| M1 | YYYY-MM-DD | <Xh / Xd> | <gate / dependency note> |
| M2 | YYYY-MM-DD | <Xh / Xd> | — |

## Change Log Impact

Roadmap shifts come from change requests, not silent edits. Each row links the
CR-NN that moved a date, added a module, or deferred scope.

| Date | CR ID | What changed | Affected modules |
|---|---|---|---|
| YYYY-MM-DD | CR-NN | <date moved / module added / deferred> | M<N> |

## Pointers

- Current-step pointer → `STAGE.md`.
- Committed dates source of truth → SOW / `docs/bao-gia/` milestone table (1.14).
- Scope source → frozen feature-register (`docs/scope-baseline/feature-register.md`, 1.9).
- Module breakdown source → `docs/stories/` (Build & Go-live slicing).
- Token chain → `docs/about/TRACE_SPEC.md`.

## Release roadmap

> **Milestone trên GitHub lấy từ bảng này**, không lấy từ bảng phase thi công. Đây là mốc
> **kinh doanh**: có hạn chót, có người ngoài đội chờ. Phase thi công (`P0..PN` trong
> `build-manifest.md`) là thứ tự làm nội bộ và nằm ở nhãn `Build: P<n>`.
>
> Từng va tên thật trong một dự án: file này dùng "phase 2" nghĩa đợt phát hành sau, bảng
> thi công cũng có "Phase 2" nghĩa gói việc thứ hai - nhìn milestone không biết nghĩa nào.
>
> `scripts/setup-issue-board.mjs` đọc đúng bảng này. Không có bảng thì nó **dừng**, không
> suy ra milestone từ gói việc kỹ thuật.

| Đợt | Nội dung | Thời gian |
|---|---|---|
| Phase 1 | *(vd: phát hành MVP thị trường đầu)* | dd/mm-dd/mm |
| Phase 2 | | dd/mm-dd/mm |

**Một issue mang cả hai:** nhãn `Build: P<n>` nói nó thuộc gói việc nào, milestone nói nó
ra mắt ở đợt nào. Thiếu milestone nghĩa là chưa ai quyết tính năng đó lên sóng lúc nào.
