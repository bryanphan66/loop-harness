# Brief Prototype Phase 2 — CRM & Marketing (Nhất Nghệ eLearning)

> Mang bản này sang Claude Design để dựng prototype (bản mẫu giao diện HTML). Prototype tiếp ở: claude.ai/design -> "Nhat Nghe Prototype - Standalone.html".

## 0. Cách đọc brief

- **Chủ trương (chốt bởi Nghĩa):** module CRM & marketing của elearning Phase 2 = **TÁI SỬ DỤNG 100% module CRM/marketing của bizhub** (đúng menu screenshot: Khách tiềm năng · Cài đặt CRM · Form thu thập · Trang đích · Mẫu email · Danh sách người nhận · Chiến dịch · Mẫu bài đăng · Kết nối Facebook) **+ custom 20% cho elearning phù hợp**.
- **20% custom cho elearning** = phần gắn nghiệp vụ elearning: lead = học viên tiềm năng, gắn khóa học/lớp; lead Thành công -> đơn hàng + auto ghi danh vào lớp; báo cáo theo khóa. (Phần này khớp feature-register elearning #54-80.)
- **Look (nhìn thế nào):** bám giao diện bizhub (screenshot) - bảng lead + tab giai đoạn + sidebar "MARKETING & CRM".
- Mỗi màn ghi mã tính năng elearning `#NN` (đối chiếu `docs/scope-baseline/feature-register.md`) để biết cái nào đã trong hợp đồng, cái nào là bizhub-reuse cần Nghĩa xác nhận đưa vào chính thức (xem mục 4 - **ghi chú thương mại**, KHÔNG phải "bỏ").
- Chú giải nhanh: Lead = khách tiềm năng · Pipeline = đường ống bán hàng (các giai đoạn) · Campaign = chiến dịch · Landing page = trang đích · Form = biểu mẫu thu thập · Segment = nhóm phân khúc khách.

## 1. Bối cảnh + nguyên tắc chung

- elearning ĐÃ có nền sẵn (Phase 1): bảng `leads` (có `pipeline_stage`), `customers`, trình tạo mẫu email (email builder), phân khúc (segmentation), theo dõi mở/nhấp email (tracking). Phase 2 = **mở rộng thành CRM bán hàng đầy đủ + tự động hóa (automation)**.
- **Phân quyền (RBAC) 10 vai trò**: Sale chỉ thấy lead của mình; Leader/Admin thấy tất cả; Marketing quản campaign; Kế toán xem đơn/hóa đơn. Prototype nên thể hiện góc nhìn Admin (thấy hết) + note vai trò ở chỗ nhạy cảm.
- **Style**: đồng bộ admin elearning hiện có - sidebar trái, tiếng Việt đủ dấu, sạch, không màu mè. Tham khảo bố cục bảng + tab giai đoạn như screenshot bizhub.

## 2. Điều hướng (sidebar) - nhóm "CRM & Marketing"

```
CRM & Marketing
  ├─ Khách tiềm năng (Pipeline)      #57
  ├─ Khách hàng (Master data)        #54
  ├─ Giảng viên                      #55
  ├─ Cài đặt CRM (routing/nhãn/field)#58,#60
  ├─ Đơn hàng CRM                    #64,#65,#66
  ├─ Lớp / Niên khóa                 #68,#69,#70
  ├─ Affiliate                       #71-74
  ├─ Mẫu email                       #26 (đã có)
  ├─ Chiến dịch & Automation         #79,#80
  ├─ Kết nối Facebook (lead ads)     #62
  ├─ Báo cáo                         #75-78,#36
  └─ ⚠️ Form thu thập · Trang đích · Chiến dịch social  (MỚI, xem mục 4)
```

## 3. Màn hình chi tiết (bám hợp đồng)

### 3.1. Khách tiềm năng - Pipeline Kanban  `#57`
- **Mục đích:** quản lý lead theo 6 giai đoạn, kéo-thả đổi giai đoạn.
- **6 giai đoạn:** Mới → Đã liên hệ → Đủ điều kiện → Đã báo giá → Thành công → Thất bại.
- **Thành phần:** 2 chế độ xem: **Kanban** (cột = giai đoạn, thẻ lead kéo-thả) + **Bảng** (như screenshot bizhub: STT, Tên, Giai đoạn dropdown, Email, SĐT, Công ty, Nhãn, Hành động). Nút chuyển Kanban/Bảng.
- **Trên mỗi thẻ/dòng:** tên, công ty, người phụ trách (Sale), nhãn (Quan tâm/VIP/Cần gọi lại), điểm số + nhiệt (Hot/Warm/Cold).
- **Thanh trên:** ô tìm (tên/email/SĐT/công ty), lọc theo giai đoạn + nhãn + Sale + nhiệt, nút "+ Thêm khách tiềm năng".
- **Tương tác:** kéo thẻ sang cột khác = đổi giai đoạn; đổi ngay dropdown trên dòng; khi kéo vào "Thất bại" hỏi **lý do thua**.

### 3.2. Chi tiết Lead (drawer/trang)  `#59,#60,#61,#64`
- **Trái:** hồ sơ (tên, công ty, email, SĐT, nguồn, người phụ trách, nhãn, **Insight Level 1x Sinh viên / 3x Kỹ sư / 5x Quản lý / 10x Doanh nghiệp** `#60`).
- **Giữa:** dòng thời gian **hoạt động tư vấn** (gọi/Zalo/email/gặp) + nút ghi log nhanh.
- **Follow-up `#59`:** tạo lịch hẹn + nhắc; danh sách follow-up sắp tới.
- **Hành động:** nút **Chuyển thành đơn hàng** (khi Thành công `#64`), **Up-sale 1-click** (tạo lead mới cho khách cũ, pre-fill `#61`), đổi giai đoạn, đổi người phụ trách.

### 3.3. Cài đặt CRM  `#58,#60,#63`
- **Chia lead tự động (routing) `#58`:** cấu hình % theo Sale/danh mục + fallback vòng tròn (round-robin); Leader override.
- **Chuyển Sale hàng loạt `#63`:** chọn Sale nguồn → Sale đích, chuyển hết lead, giữ lịch sử.
- **Nhãn + trường tự thêm (custom field):** tạo/sửa nhãn, trường; cấu hình Insight Level; danh sách lý do thua.

### 3.4. Khách hàng - Master data  `#54`
- Danh sách khách hợp nhất (mục tiêu 30K+), tìm/lọc, hồ sơ khách (lịch sử đơn + lead).
- **Import AppSheet (CSV):** upload → map cột → **hợp nhất trùng (dedup)** theo SĐT/email → đối soát số lượng trước khi lưu. Giữ người phụ trách cũ.

### 3.5. Giảng viên  `#55`
- Danh sách Giảng viên/Huấn luyện viên, liên hệ, active/inactive, gán vào lớp.

### 3.6. Mục tiêu doanh số  `#56`
- Đặt chỉ tiêu theo Sale/tháng; bảng Actual vs Target (thực tế so mục tiêu).

### 3.7. Đơn hàng CRM  `#64,#65,#66,#67`
- Tạo đơn từ lead Thành công (chọn sản phẩm/khóa, chiết khấu, lớp).
- **SePay đối soát `#65`:** hiện mã QR + tự xác nhận chuyển khoản; xác nhận tay fallback.
- **Auto PDF hóa đơn `#66`** (logo/chữ ký) + **auto ghi danh vào lớp sau thanh toán `#67`** (mô tả trạng thái, phần lớn chạy nền).

### 3.8. Lớp / Niên khóa (cohort)  `#68,#69,#70`
- Lịch học, danh sách học viên; **điểm danh + chấm bài** (GV/BTC) `#69`; **tốt nghiệp + cấp chứng chỉ lớp thủ công** `#70` (điểm danh chỉ tham khảo, BTC quyết).

### 3.9. Affiliate  `#71-74`
- Đăng ký + tạo link giới thiệu (cap số link/khóa); theo dõi click + quy đơn (last-click); tính hoa hồng + duyệt chi; bảng xếp hạng + báo cáo.

### 3.10. Mẫu email  `#26` (đã có Phase 1 - tái dùng)
- Trình tạo email kéo-thả, biến `{{first_name}} {{course_name}}...`, preview mobile/desktop, chế độ HTML thô. Prototype chỉ cần màn danh sách + editor tham chiếu.

### 3.11. Chiến dịch & Automation  `#79,#80,#36`
- **Automation flow đa bước `#79`:** trigger → điều kiện (if/else) → hành động, có delay + A/B split + pause/archive (sơ đồ DAG).
- **Trigger upsell `#80`:** gửi email upsell khi tiến độ học đạt ngưỡng.
- **Chiến dịch email:** chọn nhóm nhận (segment) → gửi/hẹn giờ → theo dõi; báo cáo open/click/chuyển đổi `#36`.

### 3.12. Kết nối Facebook - Lead Ads  `#62`
- **Lưu ý: đây là INBOUND** (nạp lead TỪ fanpage về CRM), map trường. KHÔNG phải đăng bài. (Đăng bài social nằm ở mục 4 - MỚI.)

### 3.13. Báo cáo  `#75,#76,#77,#78`
- Dashboard doanh số (theo Sale/nhóm/sản phẩm, export Excel/PDF) `#75`; Actual vs Target `#76`; **phễu lead + thời gian mỗi giai đoạn + lý do thua** `#77`; phân khúc Hot/Warm/Cold `#78`.

## 4. Màn thuộc module bizhub được tái sử dụng (LÕI - vẽ đầy đủ)

Đây là các màn LÕI của module bizhub mà Nghĩa chốt reuse 100%. **Vẽ đầy đủ vào prototype như màn chính thức** (KHÔNG phải optional). Nghiệp vụ:

- **Form thu thập thông tin** (form builder): kéo-thả tạo biểu mẫu công khai, map trường vào Lead, logic gán nhãn khi nộp. Người ngoài điền -> tự tạo lead.
- **Trang đích (Landing page builder):** dựng trang đích + nhúng form; link công khai để share/gửi email/đăng social.
- **Chiến dịch Social + Mẫu bài đăng:** liên kết fanpage -> tạo bài viết mẫu (chèn link landing) -> đăng lên fanpage -> theo dõi tương tác. (Khác `#62` là inbound lead-ads.)

> **📌 Ghi chú thương mại (cho Nghĩa/PM, KHÔNG ảnh hưởng prototype):** hợp đồng elearning ký trước đó (feature-register) chưa liệt kê 3 màn Form/Landing/Social outbound này. Do chủ trương "reuse bizhub" nên chúng được đưa vào; Nghĩa nên xác nhận đưa vào phạm vi chính thức (cập nhật feature-register + báo giá/timeline nếu cần) để khớp hợp đồng. Prototype vẫn vẽ đầy đủ.

**Vòng lặp marketing đầy đủ (để prototype thể hiện mạch):**
Form + Landing (thu lead) → Lead vào Pipeline → nuôi bằng Email/Automation → Thành công → Đơn hàng. Social + Email đẩy traffic vào Landing.

## 5. Dữ liệu mẫu (để prototype hiện đúng trường)

- **Lead:** tên, công ty, email, SĐT, nguồn, giai đoạn, nhãn[], người phụ trách (Sale), điểm (0-100), nhiệt (Hot/Warm/Cold), insight level, lý do thua.
- **Giai đoạn:** Mới / Đã liên hệ / Đủ điều kiện / Đã báo giá / Thành công / Thất bại.
- **Nhãn ví dụ:** Quan tâm, Khách VIP, Cần gọi lại, Khách cũ.
- Dùng dữ liệu giả tiếng Việt hợp lý (Nguyễn Văn A, Công ty Xây dựng...), KHÔNG số liệu thật.

## 6. Câu hỏi mở (cần Nghĩa/khách chốt trước khi code thật)

1. **4 màn MỤC 4 (Form/Landing/Social) có đưa vào Phase 2 không?** Nếu có = yêu cầu phát sinh ngoài hợp đồng (báo giá + timeline). Prototype vẫn vẽ để lấy quyết định.
2. Facebook: chỉ **lead-ads inbound** (`#62` hợp đồng) hay **cả đăng bài outbound** (mẫu bizhub)?
3. "Danh sách người nhận" trong mẫu bizhub: elearning hiện dùng **segment động** - giữ segment hay làm thêm **list tĩnh** riêng?
4. Prototype vẽ theo góc nhìn vai trò nào là chính (Admin thấy hết / Sale thấy lead mình)?
