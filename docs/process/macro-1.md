# Macro-1 (Pre-Build) — spine 1 bảng

> Mở file này thấy toàn bộ Macro-1 (xây tài liệu + prototype, TRƯỚC khi code): mỗi
> bước dùng playbook nào + qua gate nào + điền mẫu nào. Chi tiết-text: `STAGE_GOALS.md`.
> **Mặc định lane Lite** (nội bộ, gọn); Full = khách trả tiền (đầy đủ BA). Neo = REQ-ID.

## Bảng bước → file

| Bước | Làm gì (1 câu) | Playbook (cách làm) | Gate (cổng) | Mẫu tài liệu | Xong khi |
|---|---|---|---|---|---|
| **1.1** | Hứng file/yêu cầu thô từ khách | — (ck-intake-file) | — | `docs/discovery/` (append) | raw ghi lại + Source Map |
| **1.2** | Chốt nhận/từ chối + chọn Lane | — (project-manager) | **PB-G1** *(nội bộ)* | `client-intake-brief` | go/no-go, Lane ghi vào STAGE.md |
| **1.3** | Phỏng vấn khám phá (5 vai × 3 kiểu) | `discovery-interview-playbook` | phủ persona | discovery-summary | ra ứng viên yêu cầu + log quyết định |
| **1.4** | Phân tích khoảng cách (As-Is/To-Be, MoSCoW) | `gap-analysis` | ≤2 vòng | `gap-analysis` | đẻ **GAP-NNN** |
| **1.5** | SRS-lite (gói yêu cầu 1 file) *(lane Lite)* | — (ck-xre) | — | `srs-lite` | module + bảng REQ-ID + rủi ro |
| **1.7** | 5 tài liệu BA gốc + RTM *(lane Full)* | `ba-core-doc-bundle` | RTM đủ | (VISION/USE_CASES/GLOSSARY/BPMN/RTM) | mọi feature → ≥1 REQ-ID + use-case |
| **1.8** | Bóc tình huống biên (rủi ro cao) | `scenario-taxonomy-playbook` | — | — | đẻ **SC-NNN** |
| **1.9** | **Danh sách tính năng (scope)** | — (ck-scope-package) | **PB-G2** *(KHÁCH chốt scope)* | `feature-register` | scope đóng băng, RTM backward-complete |
| **1.10** | Brand + token giao diện (sáng/tối) | `ui-design-system-contract` | — | — | design-token chốt, code-is-SoT |
| **1.11** | Sơ đồ màn/luồng/trạng thái + phân loại bố cục | `visual-and-behavioral-modeling` | floorplan phủ | `screen-inventory`, `role-permission-matrix`, `status-flow` | mỗi màn grid/form được phân loại |
| **1.12** | Dựng prototype (1 vòng) | — (tool thiết kế ngoài) | — | `prototype-build-prompt` | prototype đủ màn |
| **1.13** | Chốt prototype (khách duyệt) | — | **PB-G3** *(KHÁCH chốt prototype)* | `prototype-feedback-round` | prototype đóng băng; feedback đổi feature → CR-NN |
| **1.14** | Báo giá *(lane Full)* | — | — | `proposal-sow` + `bao-gia/` | mỗi dòng giá ↔ 1 dòng feature-register |
| **1.15** | Hợp đồng + đặt cọc *(lane Full)* | — | **PB-G4** *(KHÁCH, vạch cứng)* | — | ký + cọc; **prototype chốt TRƯỚC báo giá** |

> Lane Lite: gộp 1.1+1.2, dùng 1.5 srs-lite thay 1.3-1.9, 1.14/1.15 N/A-by-decision → nhảy thẳng 2.1. Bất biến giữ: REQ-ID, phân loại floorplan, gate freeze PB-G2/G3.

## Đọc thêm
- Mục tiêu-text từng bước: `STAGE_GOALS.md` · Bảng đầy đủ + lane: `WORKFLOW.md` · Sau bước này: [`macro-2.md`](./macro-2.md).
