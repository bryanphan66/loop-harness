<!-- Bản dịch khách-facing của ../../delivery-closure-story/01-uat-plan.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (REQ-ID = MODULE.AREA.NN, SC-NNN, TC-NNN) giữ nguyên tiếng Anh. -->

# Kế hoạch UAT — <tên release / module>

> **Bước 2.12 — Macro-Stage Build & Go-live (UAT + nghiệm thu, một phiên client).**
> Gating cho cổng **ACCEPTANCE (CLIENT)**. **Engine:** `ck-uat` → `ck-signoff`.
> Mọi `REQ-ID` của release có ≥1 `TC-NNN` pass (RTM forward completeness) trước khi
> ký nghiệm thu (`02-signoff-nghiem-thu.md`).
>
> *(Lưu ý macro-stage: scaffold client-facing này được fork đầy đủ; playbook
> canonical-e2e + UAT đầy đủ của Build & Go-live build ở macro-stage increment kế tiếp.)*

## Phạm vi

REQ tokens được kiểm thử: `ORD.STATUS.01`, `ORD.INTAKE.01`, ...
SC tokens được kiểm thử: `SC-003`, `SC-005`, ...

REQ tokens KHÔNG kiểm thử lần này: liệt kê kèm lý do (e.g. "dời sang release N+1,
xem `02-signoff-nghiem-thu.md` § Loại trừ").

## Hành trình kiểm thử (Journey)

Mô tả từng bước hành trình người dùng qua bề mặt đang được nghiệm thu. Đánh số để
các test case có thể trích số bước. Dùng nhãn nghiệp vụ (theo bảng thuật ngữ), không
dùng thuật ngữ kỹ thuật khi khách quan sát.

1. Actor đăng nhập với vai trò <role>.
2. Actor điều hướng đến <màn hình>.
3. Actor thực hiện <hành động>.
4. Actor xác minh <kết quả mong đợi>.
5. ...

## Test cases

| TC ID | Loại | REQ-ID phủ | Bước | Kết quả mong đợi | Kết quả |
| --- | --- | --- | --- | --- | --- |
| TC-001 | Happy path | `ORD.STATUS.01` | 1-5 | <expected> | pass |
| TC-002 | Edge — input rỗng (phủ `SC-003`) | `ORD.INTAKE.01` | 1-3 | từ chối với 400 | pass |
| TC-003 | Edge — actor không có quyền (phủ `SC-005`) | `ORD.INTAKE.01` | 1-2 | từ chối với 403 | fail |

Mỗi test case trích `REQ-ID` đang chứng minh, và `SC-NNN` ở cột Loại khi áp dụng. Mọi
fail phải có link tới mục theo dõi (đúc `CR-NN` hoặc backlog row).

## Giới hạn số lượng

Khuyến nghị ≤ 40 test case cho mỗi đợt UAT. Nếu cần nhiều hơn, tách thành nhiều đợt
(e.g. một đợt cho mỗi module/phase) thay vì để bảng phình to.

## Môi trường

| Mục | Giá trị |
| --- | --- |
| Build / commit | <git sha hoặc release tag> |
| Môi trường | staging / pre-prod / prod-like |
| Nguồn dữ liệu test | <fixture set, dump prod ẩn danh, seed mới...> |
| Người quan sát | <tên hoặc vai trò chứng kiến đợt UAT> |

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/templates/delivery-closure-story/01-uat-plan.md`.
- Ký nghiệm thu: `docs/templates/locale-vi/delivery-closure-story/02-signoff-nghiem-thu.md`.
- Cross-check RPM + status-flow: `docs/templates/locale-vi/role-permission-matrix.md`, `status-flow.md`.
- Token grammar (REQ-ID → TC-NNN): `docs/process/TRACE_SPEC.md`. Cổng ACCEPTANCE: `docs/process/WORKFLOW.md`.
