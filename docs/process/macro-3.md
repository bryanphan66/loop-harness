# Macro-3 (Post-Build) — spine 1 bảng

> Mở file này thấy toàn bộ Macro-3 (SAU go-live): bàn giao + vận hành + đổi/sửa qua
> issue. Đây là nơi **Mode B (vòng lặp)** chạy — 3.3 + 3.5 là LIÊN TỤC, không phải
> bước tuyến tính. Chi tiết-text: `STAGE_GOALS.md`.

## Bảng bước → file

| Bước | Làm gì (1 câu) | Playbook (cách làm) | Gate (cổng) | Mẫu tài liệu | Xong khi |
|---|---|---|---|---|---|
| **3.1** | Bàn giao cho khách | — (ck-handover) | **HANDOVER** *(khách)* | `project-closure-story/` (tài liệu + credentials + chuyển giao) | khách nhận đủ, ký bàn giao |
| **3.2** | Hypercare (chăm sát sau go-live) | — | SLA hypercare | — | qua giai đoạn theo dõi gắt, ổn định |
| **3.3** | **Vận hành ổn định — vòng lặp issue (Mode B)** *(liên tục)* | `steady-state-issue-pipeline` | verify-at-source + QC/AC mỗi issue | (bug-report, regression-checklist ở `scaffolds/steady-state/`) | mỗi issue: discover→dispatch→verify→recover→persist→decide; đóng ở Done |
| **3.4** | Đề xuất bảo trì (gói SLA) | — | tier chốt | `maintenance-proposal` | khách chọn gói (Basic/Standard/Premium) |
| **3.5** | **Kiểm soát thay đổi (CR)** *(luôn-bật, xen bất kỳ lúc nào)* | — | impact + duyệt TRƯỚC code | `change-request-log` | đẻ **CR-NN**; CR duyệt → REQ-ID mới re-entry ở 2.3 |
| **3.6** | Rút bài học + ghi nhớ | `session-retrospective` | — | (lessons-log dự án) | bài học ghi; nâng playbook "thử"→"đã kiểm" |

> **Bug/UAT/CR đi đâu** (§ trong `../playbooks/steady-state-issue-pipeline.md`): bug = issue con (không vào feature-register); CR nhỏ-free = như bug; CR lớn-tính-tiền = CR-NN full luồng + vào register. Test: có phải FEATURE khách trả tiền? Có → register.

## Đọc thêm
- Mode B chi tiết: [`../playbooks/steady-state-issue-pipeline.md`](../playbooks/steady-state-issue-pipeline.md) · Kit: `scaffolds/steady-state/` · Trước bước này: [`macro-2.md`](./macro-2.md).
