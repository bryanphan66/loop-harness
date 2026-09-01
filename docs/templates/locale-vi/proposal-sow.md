<!-- Bản dịch khách-facing của ../proposal-sow.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (REQ-ID, PB-G4, CR-NN) giữ nguyên tiếng Anh. -->

# Đề xuất & Phạm vi công việc (SOW) — <tên dự án>

Ngày: YYYY-MM-DD · Hiệu lực: <NN> ngày · Phiên bản: v0.1

> **Bước 1.14–1.15 — Macro-Stage Pre-Build, Block D (Freeze + Quote + Contract).**
> Tài liệu khung gửi khách hàng. Mỗi dòng phạm vi § 4 ↔ một dòng feature-register
> đã đóng băng ở `PB-G2`, mỗi dòng giá ↔ một dòng feature-register (đối chiếu ở
> bộ `bao-gia/`).
>
> **Bất biến PROTOTYPE-THEN-QUOTE:** đóng băng prototype (`PB-G3`) **trước** khi báo
> giá — để báo giá neo vào một hợp đồng thị giác đã đóng băng (chống tranh chấp
> scope #1). Ký + đặt cọc = cổng `PB-G4`, cứng nhất: **không một dòng code build
> nào trước cổng này**.
>
> Đọc kèm bộ `docs/templates/locale-vi/bao-gia/` (bảng giá + điều khoản chi tiết).
> SOW này là bản tóm tắt hợp đồng; `bao-gia/01` là bảng giá chính.

## 1. Khách hàng & Đơn vị thực hiện

| | |
| --- | --- |
| Khách hàng | <tên pháp lý + người liên hệ> |
| Đơn vị thực hiện | <tên đơn vị / solo dev + liên hệ> |
| Ngày hiệu lực | YYYY-MM-DD |
| Ngày dự kiến bắt đầu | YYYY-MM-DD (sau khi qua `PB-G4`) |
| Ngày dự kiến bàn giao | YYYY-MM-DD |

## 2. Tóm tắt dự án

Một đoạn: chúng ta đang xây dựng cái gì, cho ai, và vì sao.

## 3. Mục tiêu & Tiêu chí thành công

- Mục tiêu kinh doanh 1.
- Mục tiêu kinh doanh 2.

Tiêu chí đo lường thành công (khách dùng để đánh giá "đã hoạt động đúng"):

- <chỉ số>

## 4. Phạm vi — Bao gồm

Liệt kê tính năng và sản phẩm bàn giao nằm trong giá. **Mỗi dòng phải trace tới ≥1
`REQ-ID`** (từ feature-register đã đóng băng `PB-G2`). Nhóm theo module nếu nhiều
hơn ~8 mục.

| # | Tính năng / deliverable | REQ-ID liên quan |
| --- | --- | --- |
| 1 | <tính năng> | `MODULE.AREA.NN` |
| 2 | <tính năng> | `MODULE.AREA.NN` |

## 5. Phạm vi — KHÔNG bao gồm

Liệt kê rõ những gì không bao gồm để tránh tranh chấp về sau. Nếu khách yêu cầu một
trong những mục này (sau `PB-G4`), đi theo quy trình Change Request (§ 9 → đúc `CR-NN`).

- <mục bị loại>
- <mục bị loại>

## 6. Sản phẩm bàn giao

| # | Sản phẩm | Hình thức | Khi nào |
| --- | --- | --- | --- |
| D1 | Quyền truy cập source code | Mời vào git repo | Kickoff (sau PB-G4) |
| D2 | URL staging | Link hosted | Mốc M2 |
| D3 | Triển khai production | Link hosted | Mốc M4 |
| D4 | Tài liệu bàn giao | `docs/handover/*` | Mốc M5 |
| D5 | Thông tin tài khoản quản trị | Tham chiếu vault (rotate khi bàn giao) | Mốc M5 |

## 7. Mốc & Tiến độ

| M# | Tên | Đầu ra | Ngày dự kiến | Điều kiện thanh toán |
| --- | --- | --- | --- | --- |
| M0 | Kickoff | Hợp đồng ký + cọc (`PB-G4`) | <ngày> | Đặt cọc <NN>% |
| M1 | ERD + tech design | ERD đóng băng (SA) + chọn stack (Tech Lead) + DoR | <ngày> | — |
| M2 | Build staging | Tính năng cốt lõi lên staging | <ngày> | Tiến độ <NN>% |
| M3 | UAT + nghiệm thu | Nghiệm thu UAT (ACCEPTANCE, client) | <ngày> | — |
| M4 | Production | Triển khai production + release-note | <ngày> | Bàn giao <NN>% |
| M5 | Bàn giao | `docs/handover/*` hoàn tất (HANDOVER, client) | <ngày> | Bảo lưu <NN>% |

Tỉ lệ phần trăm điều chỉnh theo quy mô. Khoản bảo lưu bảo vệ khách trong giai đoạn
đầu chạy production và buộc đơn vị thực hiện đóng bàn giao đúng cách.

## 8. Điều khoản thanh toán

| Giai đoạn | Số tiền | Điều kiện |
| --- | --- | --- |
| Đặt cọc | NN% | Ký hợp đồng (`PB-G4`) |
| Tiến độ | NN% | Nghiệm thu M2 staging |
| Bàn giao | NN% | Triển khai production M4 |
| Bảo lưu | NN% | Hoàn tất bàn giao M5 |

- Loại tiền: <VND / USD>
- Chu kỳ xuất hóa đơn: <theo điều kiện / hàng tháng>
- Ân hạn quá hạn: <N> ngày. Sau ân hạn, công việc tạm dừng đến khi thanh toán.
- Hình thức thanh toán: <chuyển khoản / SePay / Stripe / etc.>

> Bảng giá chi tiết và tổng giá trị hợp đồng: `docs/templates/locale-vi/bao-gia/01-bao-gia-du-an.md`.

## 9. Chính sách Change Request (Yêu cầu phát sinh)

Mọi yêu cầu ngoài § 4 (sau `PB-G4`) đi theo quy trình Change Request
(`docs/templates/locale-vi/change-request-log.md` → đúc `CR-NN`):

1. Đơn vị thực hiện phân loại yêu cầu (bug / change / new feature / UX / clarification).
2. Nếu trong scope ban đầu → xử lý không tính phí phát sinh.
3. Nếu ngoài scope → đơn vị thực hiện trả về ước lượng effort + giá trong <N> ngày làm việc.
4. Khách duyệt (hoặc dời sang phase 2) **trước** khi bắt đầu công việc.
5. Không thay đổi bằng miệng — mọi CR đều phải ghi vào log. CR được duyệt sinh ra
   `REQ-ID` mới, tái nhập pipeline.

## 10. Điều kiện nghiệm thu (ACCEPTANCE)

Khách hàng nghiệm thu mỗi mốc khi:

- Các sản phẩm bàn giao tại § 6 cho mốc đó tồn tại và truy cập được.
- Các test case UAT của mốc đó pass (theo `docs/templates/locale-vi/delivery-closure-story/01-uat-plan.md`).
  Mọi `REQ-ID` của mốc có ≥1 `TC-NNN` pass.
- Mọi bug đang mở được ghi log và gán mức độ. Severity 1 (chặn nghiệp vụ) phải sửa
  trước khi ký nghiệm thu; severity 2-3 có thể dời sang release sau.
- Ký nghiệm thu qua `docs/templates/locale-vi/delivery-closure-story/02-signoff-nghiem-thu.md`.

Khách có <N> ngày làm việc kể từ khi được thông báo bàn giao để rà soát và phản hồi.
Quá thời gian không phản hồi = mặc định chấp nhận.

## 11. Rủi ro & Giả định

| Loại | Mục | Biện pháp giảm thiểu |
| --- | --- | --- |
| Giả định | Khách cung cấp nội dung/copy trước M1 | Đơn vị thực hiện dùng placeholder; khách chấp nhận placeholder trên staging |
| Giả định | Khách cấp quyền domain + DNS trước M3 | Đơn vị thực hiện chạy trên subdomain vendor đến khi có quyền |
| Rủi ro | API bên thứ ba bị rate-limit hoặc down | Vendor cấu hình retry + fallback; SLA không bao phủ sự cố bên thứ ba |
| Rủi ro | Scope creep vượt 10% ước lượng | Mỗi CR ước lượng lại; tổng CR > 10% kích hoạt thảo luận phase 2 |

## 12. Trách nhiệm của khách hàng

- Cung cấp một người ra quyết định duy nhất (hoặc chuỗi escalation có tên).
- Cung cấp tài sản thương hiệu (logo, font, màu) trước M1.
- Cung cấp nội dung/copy trước M1 (hoặc chấp nhận placeholder).
- Phản hồi câu hỏi của vendor trong <N> ngày làm việc. Trả lời chậm dời timeline 1:1.
- Cung cấp thông tin truy cập dịch vụ bên thứ ba (domain, email, payment) khi bàn giao.

## 13. Bảo hành & Hỗ trợ sau bàn giao

- Bảo hành bug: <N> ngày kể từ M4 deploy production. Bug tái hiện trên production
  trong scope ban đầu được sửa không tính phí.
- Ngoài phạm vi bảo hành: change request (§ 9), thêm tính năng, bug do khách tự sửa code.
- Chi tiết: `docs/templates/locale-vi/bao-gia/02-dieu-khoan-bao-hanh.md`.
- Bảo trì dài hạn (tùy chọn): `docs/templates/locale-vi/maintenance-proposal.md`.

## 14. Sở hữu trí tuệ

- Sau khi thanh toán đủ: <vendor chuyển giao toàn bộ source code và tài sản / vendor
  giữ quyền với component tái sử dụng, khách nhận license vĩnh viễn>.
- Vendor có thể trưng bày dự án trong portfolio (ẩn danh hoặc có đồng ý của khách).
- Thư viện bên thứ ba giữ nguyên license gốc.

## 15. Chấm dứt hợp đồng

Hai bên có thể chấm dứt với thông báo trước <N> ngày. Khi chấm dứt:

- Vendor bàn giao công việc đang dở dang ở trạng thái hiện tại.
- Khách thanh toán phần đã hoàn thành tới ngày chấm dứt (chia tỉ lệ theo mốc).
- Chuyển giao IP áp dụng cho phần đã bàn giao.

## 16. Ký kết (cổng PB-G4)

Chữ ký + đặt cọc tại đây = qua cổng `PB-G4`. Sau cổng này build code mới bắt đầu.

| Bên | Tên | Chức danh | Chữ ký | Ngày |
| --- | --- | --- | --- | --- |
| Khách hàng | | | | |
| Đơn vị thực hiện | | | | |

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/templates/proposal-sow.md`.
- Bộ báo giá chi tiết: `docs/templates/locale-vi/bao-gia/` (01..05 + README).
- Nguồn scope (đóng băng PB-G2): `docs/templates/locale-vi/feature-register.md`.
- Đóng dự án (UAT, signoff, client update — tại M3/M4): `docs/templates/locale-vi/delivery-closure-story/`.
- Bàn giao (M5): `docs/templates/locale-vi/project-closure-story/`.
- Change requests: `docs/templates/locale-vi/change-request-log.md`.
- Bảo trì: `docs/templates/locale-vi/maintenance-proposal.md`.
- Bản đồ macro-stage + cổng: `docs/process/WORKFLOW.md`. Token grammar: `docs/process/TRACE_SPEC.md`.
