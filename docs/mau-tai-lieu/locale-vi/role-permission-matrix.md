<!-- Bản dịch khách-facing của ../role-permission-matrix.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (REQ-ID = MODULE.AREA.NN, CR-NN, PB-G3) giữ nguyên tiếng Anh. -->

# Ma trận Vai trò - Quyền hạn (RPM) — <tên dự án>

Trạng thái: nháp | khách review | đã duyệt · Cập nhật cuối: YYYY-MM-DD

> **Bước 1.11 — Macro-Stage Pre-Build, Block C (Design Prototype).** Đóng băng cùng
> prototype tại cổng `PB-G3` (CLIENT — prototype frozen). Kiểm tra lại tại ACCEPTANCE
> (Build 2.12, UAT).
>
> Ghi rõ AI/hệ thống ĐƯỢC LÀM GÌ trước khi code. Bắt lỗi phân quyền ở ma trận rẻ
> hơn 10 lần so với tìm trong audit log production. Sống tại
> `docs/visuals/diagrams/role-permission-matrix.md`. **Engine:** `ck-ux-design` +
> visual-and-behavioral-modeling.

## Vai trò

| Vai trò | Phạm vi một dòng | Ghi chú |
| --- | --- | --- |
| guest | Khách không đăng nhập | Chỉ bề mặt public. |
| customer | End-user đã đăng nhập | Sở hữu data của mình. |
| staff | User vận hành | Đọc data mọi người; ghi trong phạm vi đơn vị mình. |
| admin | Quản trị tenant | Quản lý staff và config trong một tenant. |
| superadmin | Vận hành cross-tenant | Vendor / chủ platform. |

Điều chỉnh theo dự án. Map mọi chức danh project-specific (Leader, Sale, Kế toán,
Giảng viên...) vào một hàng trên, HOẶC thêm hàng mới nếu thật sự khác biệt. Vai trò
không có grid quyền riêng = không phải vai trò — gộp lại.

## Tài nguyên

Liệt kê mọi entity / surface có ngữ nghĩa phân quyền. Một hàng cho mỗi tài nguyên.

| Tài nguyên | Mô tả một dòng |
| --- | --- |
| account | Bản ghi user của chính actor |
| product | Sản phẩm trong catalog |
| order | Đơn hàng của customer |
| ... | ... |

## Bảng quyền

Giá trị: `Y` = đầy đủ · `O` = chỉ của-mình · `N` = không · `C` = có điều kiện (trích bên dưới).
Action: C = Create, R = Read, U = Update, D = Delete. Thêm action tuỳ chỉnh thành
cột mới (e.g. `Refund`, `Approve`). **Cột Trích dẫn** dùng `REQ-ID = MODULE.AREA.NN`.

| Tài nguyên | Vai trò | C | R | U | D | Tuỳ chỉnh: <action> | Trích dẫn (REQ-ID) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| account | guest | N | N | N | N | — | — |
| account | customer | N | O | O | O | — | `ACC.SELF.01` |
| account | staff | N | Y | C¹ | N | — | `ACC.SUPPORT.01` |
| account | admin | Y | Y | Y | C² | — | `ACC.ADMIN.01` |
| product | guest | N | Y | N | N | — | `CAT.VIEW.01` |
| product | customer | N | Y | N | N | — | `CAT.VIEW.01` |
| product | staff | Y | Y | Y | C³ | — | `CAT.MANAGE.01` |
| order | customer | Y | O | C⁴ | N | — | `ORD.SELF.01` |
| order | staff | N | Y | Y | N | `Refund: Y` | `ORD.OPS.01` |

## Điều kiện

Mỗi `C` trong bảng trích về một điều kiện đánh số.

1. Staff chỉ được update account khi có ticket hỗ trợ đang mở liên kết staff với account đó.
2. Admin chỉ được xoá account sau ân hạn 30 ngày và chỉ khi account không còn đơn hàng đang mở.
3. Staff chỉ được xoá product nếu không có order tham chiếu; nếu có thì soft-delete (`archived=true`).
4. Customer chỉ được sửa order khi trạng thái còn `pending`. Sau đó chuyển qua flow change-request.

## Yêu cầu xác thực

| Bề mặt | Cần đăng nhập | Cần re-auth |
| --- | --- | --- |
| Xem catalog | không | — |
| Thêm giỏ hàng | không | — |
| Thanh toán | có | re-auth nếu order > <ngưỡng> |
| Admin dashboard | có | re-auth mọi session |
| Xoá tài khoản | có | re-auth + 2FA |

## Yêu cầu audit log

Mọi mutation đánh dấu bên dưới sinh entry audit log. Hành vi đọc thường không audit
trừ khi đánh dấu.

| Tài nguyên × Action | Có audit? | Lưu giữ |
| --- | --- | --- |
| account × U / D | có | 7 năm |
| order × C / U / refund | có | 7 năm |
| product × C / U / D | có | 1 năm |

## Bao phủ token

Mọi hàng ở § Bảng quyền có ít nhất một giá trị khác `N` đều trích `REQ-ID`. Hàng
không trích = lỗ hổng — thêm REQ vào SRS hoặc giảm cell xuống `N`.

Kiểm tra bao phủ (chạy trước khi đóng băng PB-G3):

- [ ] Mọi vai trò xuất hiện trong bảng (không thiếu vai trò).
- [ ] Mọi tài nguyên xuất hiện trong bảng (không thiếu tài nguyên).
- [ ] Mọi `C` có entry điều kiện đánh số.
- [ ] Mọi cell khác `N` trích `REQ-ID = MODULE.AREA.NN`.
- [ ] § Yêu cầu xác thực bao phủ mọi bề mặt cần authenticate.
- [ ] § Yêu cầu audit log liệt kê mọi mutation cần lưu giữ.

## Lịch sử thay đổi

Chỉ thêm. Theo dõi mọi chỉnh sửa bảng sau lần khách review đầu tiên. Sau ACCEPTANCE,
thay đổi đi qua `CR-NN`.

| Ngày | Thay đổi | Lý do | CR ID |
| --- | --- | --- | --- |
| YYYY-MM-DD | Thêm action tuỳ chỉnh `Refund` cho staff × order | Khách làm rõ trong UAT | CR-01 |

## Ký nghiệm thu

Đóng băng tại:

- **PB-G3** (đóng băng prototype, trước khi báo giá) — đóng băng ban đầu, vendor tự xác nhận.
- **ACCEPTANCE** (UAT, Build 2.12) — khách xác nhận ma trận khớp hành vi thực tế.

| Mốc | Ngày | Người duyệt |
| --- | --- | --- |
| Đóng băng PB-G3 | YYYY-MM-DD | <vendor lead> |
| Xác nhận ACCEPTANCE (UAT) | YYYY-MM-DD | <tên ký signoff phía khách> |

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/mau-tai-lieu/role-permission-matrix.md`.
- Playbook: `docs/playbooks/visual-and-behavioral-modeling.md`.
- Sơ đồ trạng thái (cross-check): `docs/mau-tai-lieu/locale-vi/status-flow.md`.
- UAT cross-check: `docs/mau-tai-lieu/locale-vi/delivery-closure-story/01-uat-plan.md`.
- Token grammar: `docs/about/TRACE_SPEC.md`. Cổng: `docs/process/WORKFLOW.md`.
