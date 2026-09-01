<!-- Bản dịch khách-facing của ../../delivery-closure-story/02-signoff.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (REQ-ID = MODULE.AREA.NN, TC-NNN) giữ nguyên tiếng Anh. -->

# Biên bản nghiệm thu (Sign-off) — <tên release / module>

> **Bước 2.12 — Macro-Stage Build & Go-live (UAT + nghiệm thu).** Đây là artifact của
> cổng **ACCEPTANCE (CLIENT)**: critical journey pass + khớp prototype đã đóng băng
> (PB-G3) + khách ký. **Engine:** `ck-signoff`. Khóa thanh toán mốc M3/M4 (SOW § 8).
>
> *(Lưu ý macro-stage: scaffold client-facing này được fork đầy đủ; playbook nghiệm
> thu đầy đủ của Build & Go-live build ở macro-stage increment kế tiếp.)*

## Người duyệt — Phía khách hàng

- Họ tên: <name>
- Chức danh: <role>
- Ngày: YYYY-MM-DD
- Hình thức ký: <duyệt qua email / chữ ký điện tử / phản hồi văn bản>

## Người duyệt — Phía thực hiện

- Họ tên: <name>
- Chức danh: <role>
- Ngày: YYYY-MM-DD

## Bao phủ REQ

| REQ-ID | Mô tả một dòng | Bằng chứng (TC) |
| --- | --- | --- |
| `ORD.STATUS.01` | <mô tả một dòng> | `01-uat-plan.md#TC-001` |
| `ORD.INTAKE.01` | <mô tả một dòng> | `01-uat-plan.md#TC-003` |

Mỗi `REQ-ID` phải có ít nhất một link bằng chứng `TC-NNN`. Thiếu bằng chứng chặn việc
ký nghiệm thu (RTM forward completeness chưa đủ).

## Khớp prototype

Xác nhận sản phẩm khớp prototype đã đóng băng tại cổng PB-G3.

- [ ] Critical journey khớp prototype `docs/visuals/prototype/` (không lệch màn hình / flow).
- [ ] Lệch so với prototype (nếu có) đã được giải thích qua `CR-NN` đã duyệt.

## Loại trừ

REQ tokens KHÔNG nằm trong đợt nghiệm thu này (e.g. dời sang release sau). Mỗi loại
trừ trích decision đã dời.

| REQ loại trừ | Lý do | Dời tới | Link decision |
| --- | --- | --- | --- |
| `INV.SYNC.02` | Ngoài scope release này | <release tag> | `docs/decisions/<slug>.md` |

## Điều kiện

Bất kỳ nghiệm thu có điều kiện ("ký với điều kiện sửa X trước ngày Y"). Bỏ trống nếu
không có điều kiện. Mỗi điều kiện đúc `CR-NN` để theo dõi.

| Điều kiện | Người chịu trách nhiệm | Hạn | Link theo dõi (CR) |
| --- | --- | --- | --- |
| | | | |

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/templates/delivery-closure-story/02-signoff.md`.
- Kế hoạch UAT (nguồn bằng chứng): `docs/templates/locale-vi/delivery-closure-story/01-uat-plan.md`.
- Thông báo khách sau ký: `docs/templates/locale-vi/delivery-closure-story/03-client-update.md`.
- Token grammar: `docs/process/TRACE_SPEC.md`. Cổng ACCEPTANCE: `docs/process/WORKFLOW.md`.
