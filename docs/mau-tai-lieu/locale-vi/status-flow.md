<!-- Bản dịch khách-facing của ../status-flow.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (REQ-ID = MODULE.AREA.NN, CR-NN, PB-G3) giữ nguyên tiếng Anh. -->

# Sơ đồ trạng thái — <tên entity>

Trạng thái: nháp | khách review | đã duyệt · Cập nhật cuối: YYYY-MM-DD

> **Bước 1.11 — Macro-Stage Pre-Build, Block C (Design Prototype).** Đóng băng cùng
> prototype tại cổng `PB-G3` (CLIENT). Một file cho mỗi entity có trạng thái (order,
> application, ticket, subscription...). Sống tại
> `docs/visuals/diagrams/status-flow-<entity>.md`. **Engine:** `ck-ux-design` +
> visual-and-behavioral-modeling.
>
> Ghi lại máy trạng thái hợp lệ trước khi code. Bắt được lỗi "user kẹt ở trạng thái
> X vì không có transition ra" trước khi ship.

## Entity

| | |
| --- | --- |
| Tên entity | <e.g. order, application, ticket> |
| Tài nguyên sở hữu | <e.g. bảng orders> |
| Trường trạng thái | <e.g. cột `status`> |
| Trạng thái ban đầu | <e.g. `pending`> |

## Các trạng thái

Mọi trạng thái entity có thể giữ. Trạng thái không có transition đến = không thể đạt
(xoá). Trạng thái không có transition đi = trạng thái cuối (đánh dấu).

| Trạng thái | Mô tả | Trạng thái cuối? |
| --- | --- | --- |
| pending | Chờ hành động đầu tiên | không |
| in-review | Đang được staff xem | không |
| approved | Đã duyệt, chờ giao | không |
| fulfilled | Đã giao | có |
| cancelled | Đã huỷ bởi khách hoặc staff | có |
| rejected | Bị từ chối khi review | có |

## Sơ đồ trạng thái (Mermaid)

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

Render qua bất kỳ Mermaid viewer nào (hoặc `tech-graph` cho bản publish-grade). Cập
nhật sơ đồ KHI bảng transition thay đổi — sơ đồ và bảng là hai view của cùng sự thật.

## Bảng transition

Nguồn chính. Mỗi transition hợp lệ là một hàng. **Cột Token** dùng `REQ-ID = MODULE.AREA.NN`.

| Từ | Tới | Trigger | Vai trò được phép | Điều kiện tiên quyết | Tác động phụ | Token (REQ-ID) |
| --- | --- | --- | --- | --- | --- | --- |
| pending | in-review | submit | customer | đầy đủ trường bắt buộc | thông báo staff qua email | `ORD.SUBMIT.01` |
| pending | cancelled | cancel | customer | — | không thông báo | `ORD.CANCEL.01` |
| in-review | approved | approve | staff | ghi chú review đã điền | thông báo khách; charge payment hold | `ORD.APPROVE.01` |
| in-review | rejected | reject | staff | lý do từ chối đã điền | thông báo khách; release payment hold | `ORD.REJECT.01` |
| approved | fulfilled | ship | staff | xác nhận đã giao | thông báo khách kèm tracking | `ORD.FULFILL.01` |
| approved | cancelled | cancel | customer, staff | trong vòng 24h sau approve | hoàn tiền đầy đủ | `ORD.REFUND.01` |

Mọi hàng transition trích ít nhất một `REQ-ID`. Hàng không có token là lỗ hổng spec —
thêm REQ vào SRS hoặc xoá hàng.

## Transition bị cấm

Cặp trạng thái có vẻ transitionable nhưng KHÔNG được phép. Ghi rõ để tránh bug âm thầm.

| Từ | Tới | Vì sao bị chặn |
| --- | --- | --- |
| fulfilled | * | Fulfilled là trạng thái cuối; trả hàng đi qua entity mới (return-order). |
| cancelled | pending | Không cho kích hoạt lại; khách tạo entity mới. |
| rejected | in-review | Không cho re-review; khách tạo application mới. |

## Cross-check Vai trò × Hành động

Đối chiếu với `docs/mau-tai-lieu/locale-vi/role-permission-matrix.md` để đảm bảo mọi
cột trigger ở trên có cell quyền tương ứng. Trigger gọi được bởi `staff` cần cell
tài nguyên × hành động của staff khác `N`.

- [ ] Mọi "Vai trò được phép" khớp với grid RPM.
- [ ] Mọi "Tác động phụ" sửa entity khác (e.g. payment hold) cũng được phản ánh trong grid quyền của entity đó.

## Yêu cầu audit log

| Transition | Có audit? | Lưu giữ |
| --- | --- | --- |
| Bất kỳ transition vào trạng thái cuối | có | 7 năm |
| approved → cancelled (kèm hoàn tiền) | có | 7 năm |
| pending → cancelled | tuỳ chọn | 1 năm |

## Edge case & SLA

| Trường hợp | Hành vi | Ràng buộc thời gian |
| --- | --- | --- |
| Kẹt ở `in-review` > 7 ngày | Tự động thông báo staff manager | 7 ngày |
| Kẹt ở `approved` > 3 ngày | Tự động huỷ và hoàn tiền | 3 ngày |
| Payment fail giữa in-review → approved | Rollback về in-review; flag để thử lại | ngay lập tức |

## Kiểm tra bao phủ

Trước khi đóng băng (PB-G3):

- [ ] Mọi trạng thái có trong bảng § Các trạng thái.
- [ ] Mọi trạng thái trong sơ đồ xuất hiện ít nhất một lần ở § Bảng transition (Từ HOẶC Tới).
- [ ] Mọi trạng thái cuối đánh dấu `có` ở § Các trạng thái.
- [ ] Mọi transition trích `REQ-ID = MODULE.AREA.NN`.
- [ ] Mọi vai trò được phép khớp với `docs/mau-tai-lieu/locale-vi/role-permission-matrix.md`.
- [ ] Transition bị cấm đã liệt kê.
- [ ] SLA edge-case đã định nghĩa cho trạng thái không-cuối.

## Lịch sử thay đổi

Chỉ thêm. Sau ACCEPTANCE, thay đổi đi qua `CR-NN`.

| Ngày | Thay đổi | Lý do | CR ID |
| --- | --- | --- | --- |
| YYYY-MM-DD | Thêm `approved → cancelled` (trong vòng 24h) | Chính sách kinh doanh của khách | CR-01 |

## Ký nghiệm thu

| Mốc | Ngày | Người duyệt |
| --- | --- | --- |
| Đóng băng PB-G3 | YYYY-MM-DD | <vendor lead> |
| Xác nhận ACCEPTANCE (UAT) | YYYY-MM-DD | <tên ký signoff phía khách> |

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/mau-tai-lieu/status-flow.md`.
- Playbook: `docs/playbooks/visual-and-behavioral-modeling.md`.
- Ma trận Vai trò - Quyền hạn (cross-check): `docs/mau-tai-lieu/locale-vi/role-permission-matrix.md`.
- UAT cross-check: `docs/mau-tai-lieu/locale-vi/delivery-closure-story/01-uat-plan.md`.
- Token grammar: `docs/about/TRACE_SPEC.md`. Cổng: `docs/process/WORKFLOW.md`.
