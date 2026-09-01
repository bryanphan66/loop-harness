# locale-vi — Bản fork tiếng Việt cho bề mặt khách-facing

> **Quyết định D4 (đã chốt):** **VN toàn bộ client-facing.** Mọi tài liệu khách
> hàng nhìn thấy được fork sang tiếng Việt tại đây. Tài liệu kỹ thuật nội bộ **giữ
> tiếng Anh**. ID / path / code / token grammar **luôn giữ tiếng Anh** kể cả bên
> trong file VN.

## Nguyên tắc

| | EN (gốc) | VN (fork tại đây) |
|---|---|---|
| **Bề mặt khách-facing** (commercial + handover + user-guide) | bản chuẩn ở `docs/mau-tai-lieu/*.md` | **fork ở `locale-vi/`** |
| **Artifact kỹ thuật nội bộ** (SRS, ADR/decisions, code, story, spec-intake, validation, playbooks, `AGENTS.md`, `WORKFLOW.md`, `TRACE_SPEC.md`) | **giữ EN** | không fork |
| **ID / path / token** (`REQ-ID = MODULE.AREA.NN`, `GAP-NNN`, `SC-NNN`, `TC-NNN`, `CR-NN`, `PB-G1..G4`, đường dẫn file) | EN | **giữ EN** kể cả trong file VN |

Mỗi file VN mở đầu bằng comment đồng bộ trỏ về **bản gốc EN là chuẩn** — khi bản
gốc đổi, re-sync bản dịch.

## Các file đã fork

### Bề mặt thương mại (commercial)

| File VN | Bước | Cổng / vai trò | Gốc EN |
|---|---|---|---|
| `client-intake-brief.md` | 1.2 | `PB-G1` (capture nội bộ) | `../client-intake-brief.md` |
| `gap-analysis.md` | 1.4 | đúc `GAP-NNN` | `../gap-analysis.md` |
| `feature-register.md` | 1.9 | **`PB-G2`** (scope frozen, CLIENT) | `../feature-register.md` |
| `role-permission-matrix.md` | 1.11 | đóng băng `PB-G3` | `../role-permission-matrix.md` |
| `status-flow.md` | 1.11 | đóng băng `PB-G3` | `../status-flow.md` |
| `proposal-sow.md` | 1.14–1.15 | **`PB-G4`** (contract+deposit, CLIENT) | `../proposal-sow.md` |
| `change-request-log.md` | 3.5 | đúc `CR-NN` (always-on) | `../change-request-log.md` |
| `release-note.md` | 2.13 | release (Build) | `../release-note.md` |
| `maintenance-proposal.md` | 3.4 | maintenance (Post-Build) | `../maintenance-proposal.md` |

### Bộ báo giá (`bao-gia/`) — bước 1.14, Pre-Build Block D

| File VN | Nội dung |
|---|---|
| `bao-gia/README.md` | Mục lục bộ báo giá + tóm tắt nhanh |
| `bao-gia/01-bao-gia-du-an.md` | Báo giá chính: phạm vi, bảng giá, timeline, thanh toán |
| `bao-gia/02-dieu-khoan-bao-hanh.md` | Điều khoản bảo hành + gói hỗ trợ + chuyển giao |
| `bao-gia/03-cau-hoi-xac-nhan.md` | Câu hỏi BLOCKER xác nhận trước `PB-G2` |
| `bao-gia/04-tong-quan-ky-thuat.md` | Tổng quan kỹ thuật (VISION_SCOPE rút gọn) |
| `bao-gia/05-bang-thuat-ngu.md` | Bảng thuật ngữ song ngữ (view khách-facing) |

### Đóng dự án (handover + user-guide — D4 mở rộng VN)

| File VN | Bước | Cổng | Gốc EN |
|---|---|---|---|
| `delivery-closure-story/01-uat-plan.md` | 2.12 | UAT (ACCEPTANCE) | `../delivery-closure-story/01-uat-plan.md` |
| `delivery-closure-story/02-signoff-nghiem-thu.md` | 2.12 | **ACCEPTANCE** (CLIENT) | `../delivery-closure-story/02-signoff.md` |
| `delivery-closure-story/03-client-update.md` | 2.12–2.13 | thông báo khách | `../delivery-closure-story/03-client-update.md` |
| `project-closure-story/01-handover-docs.md` | 3.1 | **HANDOVER** (CLIENT) | `../project-closure-story/01-handover-docs.md` |

## Token grammar (D3) — chỉ một scheme duy nhất

Mọi file VN dùng chuỗi truy vết chuẩn (KHÔNG dùng `US-NNN.REQ-MMM`):

```
business problem → GAP-NNN → REQ-ID (MODULE.AREA.NN) → use-case + RTM
  → SC-NNN → feature-register line (FR-NN) → bao-gia line
  → TC-NNN → UAT → release-note → handover
```

Change request sau `PB-G4` đúc `CR-NN`; CR được duyệt đúc `REQ-ID` mới, tái nhập
pipeline tại 1.5 (hoặc giữa Build: 2.3 / 2.6).

## Cổng khách (client-paging) vs nội bộ

- **Page khách** (`MANUAL_CHECKPOINT`): `PB-G2`, `PB-G3`, `PB-G4`, ACCEPTANCE, HANDOVER.
- **Nội bộ, không page**: `PB-G1` (intake go/no-go capture).

## Engine (D1 — ck-skills là engine sống, KHÔNG vendor)

Các file ở đây chỉ tham chiếu `ck-*` skill trong mục **Engine / Tham chiếu** — không
phải yêu cầu cứng. **Independence Principle:** harness vẫn chạy trên bare agent + git
+ bash; `ck-*` là accelerator, không phải dependency. `install-harness.sh`
preflight-check `~/.claude/skills` + `~/.claude/agents` và CẢNH BÁO nếu thiếu — không
copy. Chi tiết: `docs/about/HARNESS.md`.

## Cách dùng

1. Copy file VN cần dùng vào repo dự án, thay mọi `<...>` / `[...]` bằng dữ liệu thật.
2. Giữ ID / path / token tiếng Anh.
3. Khi bản gốc EN đổi, re-sync (so với comment đồng bộ ở đầu mỗi file).

---

**Tham chiếu**

- Bản đồ macro-stage + danh sách cổng: `docs/process/WORKFLOW.md`.
- Token grammar + RTM completeness rule: `docs/process/TRACE_SPEC.md`.
- Mô hình vận hành + Independence Principle: `docs/about/HARNESS.md`.
- Vai trò → engine: `docs/process/ROLE_MAP.md`.
- Bản gốc EN của các surface chung: `docs/mau-tai-lieu/*.md`.
