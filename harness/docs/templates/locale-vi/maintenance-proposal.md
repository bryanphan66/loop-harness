<!-- Bản dịch khách-facing của ../maintenance-proposal.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (CR-NN, M4) giữ nguyên tiếng Anh. -->

# Đề xuất Bảo trì & Hỗ trợ — <tên dự án>

Ngày: YYYY-MM-DD · Hiệu lực từ: YYYY-MM-DD · Có giá trị: <NN> tháng

> **Bước 3.4 — Macro-Stage Post-Build.** Gửi tại hoặc sau khi bàn giao
> (`docs/templates/locale-vi/project-closure-story/`). Chuyển từ giao hàng một lần
> sang quan hệ hỗ trợ định kỳ — khách có chi phí dự đoán được, vendor có doanh thu
> định kỳ và tránh trách nhiệm hỗ trợ vô hạn. **Engine:** `maintenance-proposal.md`
> (template này) sau hypercare.
>
> *(Lưu ý macro-stage: scaffold client-facing này được fork đầy đủ; playbook
> hypercare + steady-state đầy đủ của Post-Build build ở macro-stage increment kế
> tiếp.)*

## 1. Bối cảnh

Dự án: <tên>
URL production: <url>
Bàn giao ngày: YYYY-MM-DD (Mốc M4 của SOW)
Bảo hành bug hết hạn: YYYY-MM-DD

## 2. Vì sao cần bảo trì?

Không có gói bảo trì sau khi bảo hành hết hạn, mọi yêu cầu hỗ trợ trở thành một cuộc
đàm phán giá riêng lẻ. Có gói rồi, khách có chi phí hàng tháng dự đoán được, vendor
có dung lượng làm việc được dành riêng.

## 3. Trong phạm vi (mọi gói)

- Giám sát uptime production (vendor kiểm tra staging+prod hàng tuần).
- Sửa bug cho lỗi tái hiện được trong scope đã bàn giao.
- Vá bảo mật cho các phụ thuộc đã khai báo (thư viện, OS-level nếu vendor host).
- Kiểm tra backup (vendor xác nhận backup vẫn chạy; khách thử restore một lần/quý).
- Rà soát cập nhật phụ thuộc hàng quý (vendor báo cáo; khách duyệt áp dụng).

## 4. Ngoài phạm vi (mọi gói)

Các mục dưới đi theo Change Request (`docs/templates/locale-vi/change-request-log.md`
→ `CR-NN`) và tính phí riêng:

- Tính năng mới hoặc màn hình mới.
- Thiết kế lại giao diện hoặc rebrand.
- Bug do khách tự sửa codebase hoặc hạ tầng gây ra.
- Sự cố dịch vụ bên thứ ba (vendor phối hợp nhưng không sở hữu việc sửa).
- Chuyển sang stack mới hoặc nhà cung cấp hosting khác.
- Khôi phục dữ liệu do khách xoá nhầm (vendor restore từ backup; khách trả phí effort).
- Đào tạo nhân sự mới ngoài các buổi bàn giao ban đầu.

## 5. So sánh các gói

| Mục | Basic | Standard | Premium |
| --- | --- | --- | --- |
| Phí hàng tháng | <số tiền> | <số tiền> | <số tiền> |
| Giờ hỗ trợ / tháng (cộng dồn tối đa 1 tháng) | 2 | 6 | 16 |
| Phản hồi — Severity 1 (production down) | 8 giờ làm việc | 4 giờ làm việc | 2 giờ làm việc |
| Phản hồi — Severity 2 (tính năng hỏng) | 2 ngày làm việc | 1 ngày làm việc | 4 giờ làm việc |
| Phản hồi — Severity 3 (giao diện / nhỏ) | 5 ngày làm việc | 3 ngày làm việc | 1 ngày làm việc |
| Kênh hỗ trợ | Email | Email + Zalo/Telegram | Email + Zalo/Telegram + lịch call |
| Báo cáo trạng thái hàng tháng | — | có (tóm tắt) | có (chi tiết + roadmap) |
| Họp review hàng quý | — | — | có |
| Kiểm tra backup | hàng quý | hàng tháng | hàng tháng + diễn tập restore |
| Cập nhật phụ thuộc | hàng năm | hàng quý | hàng quý |
| Hỗ trợ khẩn ngoài giờ | — | phí/sự cố | tối đa 2 sự cố/tháng |
| Giảm giá Change Request | — | 10% | 20% |

Giờ hỗ trợ là dung lượng được dành riêng; giờ không dùng được cộng dồn 1 tháng rồi
hết hiệu lực.

## 6. Định nghĩa Severity

Dùng cùng thang với `docs/templates/locale-vi/change-request-log.md` § Severity.

| Severity | Định nghĩa | Ví dụ |
| --- | --- | --- |
| S1 | Production không dùng được, nguy cơ mất dữ liệu, hoặc payment hỏng | site trả 500 cho mọi user, checkout fail |
| S2 | Một tính năng cốt lõi hỏng nhưng có workaround | search trả kết quả sai, một role không đăng nhập được |
| S3 | Lỗi giao diện, nhỏ, không chặn | nút lệch, lỗi chính tả, trang chậm không nghiêm trọng |

## 7. Cách yêu cầu hỗ trợ

1. Khách mở một entry trong `docs/templates/locale-vi/change-request-log.md` (hoặc
   gửi qua kênh đã thoả thuận — vendor sẽ ghi log thành `CR-NN`).
2. Vendor xác nhận trong thời gian phản hồi của gói.
3. Vendor phân loại (bug / change / new feature / UX / clarification).
4. Bug trong scope → sửa trong budget thời gian của gói. Change request → ước lượng,
   khách duyệt trước khi làm.

## 8. Trường hợp loại trừ SLA

SLA thời gian phản hồi không áp dụng khi:

- Dịch vụ bên thứ ba bị down (e.g. payment provider, sự cố cloud). Vendor phối hợp nhưng đồng hồ tạm dừng.
- Khách không cấp được quyền truy cập cần thiết trong 1 ngày làm việc kể từ yêu cầu của vendor.
- Sự cố do khách tự sửa hoặc do bên thứ ba truy cập trái phép bằng tài khoản của khách.
- Cửa sổ bảo trì đã thông báo (vendor thông báo ≥48 giờ trước).

## 9. Thời hạn & Gia hạn

- Thời hạn: <3 / 6 / 12 tháng>.
- Tự động gia hạn trừ khi một bên thông báo trước <30 / 60> ngày.
- Gói có thể nâng cấp bất kỳ tháng nào; hạ cấp chỉ tại cuối kỳ.
- Hai bên có thể chấm dứt với thông báo trước <30 / 60> ngày. Vendor hoàn trả phần
  trả trước chưa dùng trừ giờ đã tiêu thụ theo đơn giá (§ 11).

## 10. Bàn giao khi kết thúc bảo trì

Nếu bảo trì kết thúc:

- Vendor bàn giao trạng thái codebase hiện tại kèm patch notes cho giai đoạn bảo trì.
- Vendor thu hồi quyền truy cập của mình tới hạ tầng khách trong <N> ngày, và **rotate
  mọi secret** đã chia sẻ.
- Vendor gửi báo cáo cuối: vấn đề đang mở, change request đã hoãn, đề xuất bước tiếp theo.

## 11. Chi tiết giá

| Mục | Đơn giá |
| --- | --- |
| Đơn giá theo giờ ngoài budget của gói | <số tiền/giờ> |
| Đơn giá khẩn ngoài giờ (gói Basic + Standard) | <số tiền/sự cố> |
| Đơn giá Change Request | <số tiền/giờ hoặc per-feature> |
| Giảm giá khi trả trước cả năm | NN% (trả 12 tháng một lần) |

## 12. Đề xuất gói theo giai đoạn dự án

| Giai đoạn | Gói đề xuất |
| --- | --- |
| Vừa launch, < 100 user/ngày | Basic |
| Đang tăng trưởng, 100-1000 user/ngày, chưa có commerce trọng yếu | Standard |
| Doanh thu trọng yếu (e-commerce, SaaS billing) hoặc > 1000 user/ngày | Premium |

## 13. Đồng ý

| Bên | Tên | Chức danh | Chữ ký | Ngày |
| --- | --- | --- | --- | --- |
| Khách hàng | | | | |
| Đơn vị thực hiện | | | | |

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/templates/maintenance-proposal.md`.
- Log sự cố: `docs/incidents/` (repo dự án).
- Change Request log: `docs/templates/locale-vi/change-request-log.md`.
- Bàn giao dự án: `docs/templates/locale-vi/project-closure-story/` (đề xuất này gửi kèm).
- Macro-stage Post-Build: `docs/WORKFLOW.md`.
