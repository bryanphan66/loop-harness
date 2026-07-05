<!-- Bản dịch khách-facing của ../../project-closure-story/01-handover-docs.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (REQ-ID = MODULE.AREA.NN, CR-NN, decision slug) giữ nguyên tiếng Anh. -->

# Chỉ mục tài liệu bàn giao — <tên dự án>

> **Bước 3.1 — Macro-Stage Post-Build (Handover package).** Đây là artifact của cổng
> **HANDOVER (CLIENT)**: nhận docs / credentials / training / source-IP; mọi
> credential access-verified; **rotate secret khi bàn giao**. **Engine:** `ck-handover`.
>
> *(Lưu ý macro-stage: scaffold client-facing này được fork đầy đủ; playbook handover
> + hypercare đầy đủ của Post-Build build ở macro-stage increment kế tiếp.)*

## Đọc theo thứ tự này

1. `README.md` — tổng quan dự án, lệnh chạy, quick start.
2. `docs/HARNESS.md` — mô hình vận hành (Independence Principle: chạy được trên bare agent + git + bash).
3. `docs/requirements/` — SRS + hợp đồng sản phẩm hiện hành.
4. `docs/decisions/*` — vì sao các lựa chọn quan trọng được đưa ra (tham chiếu theo slug).
5. `docs/scope-baseline/feature-register.{md,xlsx}` — scope đã đóng băng (PB-G2).
6. `docs/TEST_MATRIX.md` — trạng thái bằng chứng (REQ-ID nào đã có TC-NNN pass).

## Các Decision còn hiệu lực

Tham chiếu theo slug ổn định (không theo số).

| Decision | Vì sao còn quan trọng hôm nay |
| --- | --- |
| `docs/decisions/<stack-selection-slug>.md` | Khoá stack runtime; muốn đổi cần decision thay thế. |
| `docs/decisions/<data-model-slug>.md` | <một dòng hệ quả người nhận bàn giao cần biết> |

Trích mỗi decision còn ràng buộc công việc hiện tại. Bỏ qua các decision đã bị thay thế.

## REQ-ID đã phát hành tại bàn giao

Mọi `REQ-ID` đã release phải xuất hiện ở đây (forward completeness — đối chiếu
release-note + RTM).

| REQ-ID | Mô tả một dòng | Release | Bằng chứng (TC) |
| --- | --- | --- | --- |
| `ORD.STATUS.01` | <mô tả> | v1.0 | `TC-001` |

## Change request còn mở tại thời điểm bàn giao

| CR ID | Trạng thái | Mô tả | Định hướng |
| --- | --- | --- | --- |
| `CR-03` | deferred | <một dòng> | Phase 2 candidate |

Báo cáo mọi CR `deferred` đang mở làm candidate phase 2 (xem maintenance proposal).

## Bề mặt bảo trì

- Phụ thuộc lần cập nhật cuối: YYYY-MM-DD. Lần rà soát tiếp theo: YYYY-MM-DD.
- Nợ kỹ thuật đã ghi nhận: liệt kê link tới backlog row.
- Playbook định kỳ dự án này tham khảo: `docs/playbooks/<name>.md` × N lần dùng.

## Tích hợp bên ngoài

| Tích hợp | Mục đích | Tham chiếu credential | Liên hệ |
| --- | --- | --- | --- |
| <provider> | <làm gì cho app> | <vault ref — KHÔNG paste giá trị> | <account manager của vendor> |

GIÁ TRỊ credential nằm ở secret store, không ở đây — row này chỉ trỏ tới tham chiếu
vault. **Rotate mọi secret tại bàn giao** (yêu cầu cổng HANDOVER).

## Kiểm tra cổng HANDOVER

- [ ] Mọi tài liệu trong § "Đọc theo thứ tự này" tồn tại và truy cập được.
- [ ] Mọi credential đã access-verified (khách đăng nhập thử được).
- [ ] Mọi secret vendor từng dùng đã được **rotate**.
- [ ] Source code / repo ownership đã chuyển cho khách.
- [ ] Buổi training đã hoàn tất (hoặc lịch đã chốt).
- [ ] Mọi CR đang chạy chưa gán chủ → chặn signoff bàn giao đến khi gán.

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/templates/project-closure-story/01-handover-docs.md`.
- Đề xuất bảo trì (gửi kèm bàn giao): `docs/templates/locale-vi/maintenance-proposal.md`.
- Scope đóng băng: `docs/templates/locale-vi/feature-register.md`.
- Token grammar: `docs/TRACE_SPEC.md`. Cổng HANDOVER + macro-stage: `docs/WORKFLOW.md`.
