<!-- locale-vi fork — điều khoản bảo hành khách-facing. Scaffold (placeholder + hướng dẫn trong ngoặc). -->
<!-- ID/path/token (CR-NN, P1/P2/P3) giữ nguyên tiếng Anh. -->

# ĐIỀU KHOẢN BẢO HÀNH & HỖ TRỢ KỸ THUẬT

> **Dự án:** <tên dự án>
> **Ngày lập:** DD/MM/YYYY
> **Phiên bản:** v0.1

> Phụ lục của Hợp đồng Phát triển Phần mềm. Đính kèm báo giá (`01-bao-gia-du-an.md`).
> Bảo hành sửa lỗi của code đã bàn giao; thay đổi yêu cầu đi qua change request (`CR-NN`).

---

## 1. Phạm vi bảo hành miễn phí

### 1.1 Thời gian bảo hành

| Phase | Bắt đầu | Kết thúc | Thời hạn |
|---|---|---|---|
| Phase 1 | Ngày nghiệm thu Phase 1 | <NN> tháng sau nghiệm thu | <NN> tháng |
| Phase 2 | Ngày nghiệm thu Phase 2 | <NN> tháng sau nghiệm thu | <NN> tháng |

> Bảo hành mỗi Phase **độc lập** — bảo hành Phase 1 không bị ảnh hưởng khi Phase 2 bắt đầu.

### 1.2 Nội dung bảo hành (TRONG phạm vi)

| # | Hạng mục | Mô tả | Thời gian phản hồi |
|---|---|---|---|
| 1 | **Lỗi nghiêm trọng (P1)** | Hệ thống không truy cập được, mất dữ liệu, thanh toán không hoạt động, không login được | Trong **<N> giờ** làm việc |
| 2 | **Lỗi chức năng (P2)** | Tính năng sai so với yêu cầu đã nghiệm thu | Trong **<N> giờ** làm việc |
| 3 | **Lỗi giao diện (P3)** | Hiển thị sai trên trình duyệt hỗ trợ, layout vỡ, font/màu sai design đã duyệt | Trong **<N> ngày** làm việc |
| 4 | **Lỗi hiệu năng** | <e.g. API response > 500ms p95, video buffering ở 10 Mbps> | Trong **<N> ngày** làm việc |
| 5 | **Lỗi bảo mật** | Lỗ hổng phát sinh từ code đã bàn giao (XSS, SQL injection, RBAC bypass...) | Trong **<N> giờ** làm việc |
| 6 | **Cập nhật bảo mật** | Vá lỗi bảo mật của dependencies ảnh hưởng trực tiếp đến hệ thống | Trong **<N> ngày** làm việc |

### 1.3 Danh sách đầu mục bảo hành chi tiết

[Liệt kê theo module, đối chiếu feature-register. Mỗi đầu mục là một nhóm `FR-NN`.]

#### Phase 1 — <tên>

| Module | Đầu mục bảo hành |
|---|---|
| <module> | <các hành vi cụ thể được bảo hành> |

#### Phase 2 — <tên>

| Module | Đầu mục bảo hành |
|---|---|
| <module> | <các hành vi cụ thể được bảo hành> |

---

## 2. Ngoài phạm vi bảo hành (KHÔNG bao gồm)

| # | Hạng mục | Lý do |
|---|---|---|
| 1 | **Thay đổi yêu cầu** | Yêu cầu mới / đổi logic so với spec đã nghiệm thu → `CR-NN` |
| 2 | **Thêm tính năng mới** | Bất kỳ tính năng không có trong scope Phase đã bàn giao |
| 3 | **Thay đổi thiết kế/UI** | Đổi layout, màu, font ngoài design đã duyệt |
| 4 | **Lỗi do khách hàng** | Lỗi do khách tự chỉnh code, database, server config |
| 5 | **Lỗi do bên thứ 3** | <provider> sập, đổi policy, đổi API |
| 6 | **Nâng cấp hạ tầng** | Tăng cấu hình VPS, migrate server, đổi domain |
| 7 | **Đào tạo bổ sung** | Đào tạo nhân sự mới ngoài buổi đào tạo ban đầu |
| 8 | **Backup & restore** | Khôi phục data do khách tự xóa hoặc thao tác sai |
| 9 | **Phase 3 features** | Báo giá riêng |

> Các hạng mục ngoài bảo hành sẽ được báo giá bổ sung theo yêu cầu thực tế (`CR-NN`).

---

## 3. Điều kiện bảo hành

Bảo hành có hiệu lực khi đáp ứng **tất cả**:

| # | Điều kiện |
|---|---|
| 1 | Hệ thống vận hành trên **hạ tầng đã bàn giao** (không thay đổi VPS, Nginx, Docker) |
| 2 | Khách hàng **không tự ý chỉnh sửa** source code, database schema, server config |
| 3 | Khách hàng **thông báo lỗi** qua kênh hỗ trợ chính thức |
| 4 | Lỗi **có thể tái hiện** (cung cấp steps to reproduce, screenshots, log) |
| 5 | Khách hàng **thanh toán đầy đủ** các đợt theo hợp đồng |

> Nếu vi phạm điều kiện 1 hoặc 2, đơn vị phát triển có quyền từ chối bảo hành hoặc tính phí.

---

## 4. Quy trình xử lý bảo hành

```
Khách báo lỗi → Tiếp nhận & phân loại (P1/P2/P3) → Trong bảo hành?
    ├── CÓ → Fix & deploy → Khách xác nhận → Đóng ticket
    └── KHÔNG → Thông báo khách → Báo giá bổ sung (CR-NN, nếu khách đồng ý)
```

| Bước | Mô tả | Thời gian |
|---|---|---|
| 1. Tiếp nhận | Khách gửi mô tả lỗi + screenshot/video | — |
| 2. Xác nhận | Dev xác nhận, phân loại (P1/P2/P3), kiểm tra trong/ngoài bảo hành | Trong <N> giờ |
| 3. Sửa lỗi | Dev fix, test nội bộ, deploy | Theo SLA từng mức |
| 4. Xác nhận | Khách kiểm tra và xác nhận đã sửa | Trong <N> ngày |
| 5. Đóng ticket | Ghi nhận hoàn tất, cập nhật changelog | — |

**Giờ làm việc:** <Thứ 2 – Thứ 6, 9:00 – 18:00 GMT+7>. Ngoài giờ chỉ xử lý P1.

---

## 5. Gói hỗ trợ sau bảo hành

> Chi tiết đầy đủ: `docs/templates/locale-vi/maintenance-proposal.md`. Tóm tắt nhanh
> 3 gói (Basic / Standard / Premium) đính kèm để khách hình dung.

| | Basic | Standard | Premium |
|---|---|---|---|
| Phí/tháng | <số tiền> | <số tiền> | <số tiền> |
| Fix bug | <N>/tháng | Không giới hạn | Không giới hạn |
| Ngày công phát triển | — | <N>/tháng | <N>/tháng |
| Phản hồi P1 | <N> giờ | <N> giờ | <N> giờ (24/7) |

> Gói ký theo năm giảm <NN>% so với theo tháng. Ngày công chưa dùng **không** cộng dồn.

---

## 6. Chuyển giao & Sở hữu

| Hạng mục | Chi tiết |
|---|---|
| **Source code** | Bàn giao toàn bộ sau nghiệm thu. Khách sở hữu 100%. |
| **Repository** | Private Git repo — chuyển owner cho khách sau Phase cuối. |
| **Tài liệu kỹ thuật** | Kiến trúc, hướng dẫn deploy, API docs, SOP vận hành. |
| **Tài khoản dịch vụ** | Đăng ký dưới tên khách; dev hỗ trợ setup; **rotate secret khi bàn giao**. |
| **Dữ liệu** | 100% thuộc sở hữu khách. Dev không giữ bản sao sau bàn giao. |

---

## 7. Cam kết bảo mật

| # | Cam kết |
|---|---|
| 1 | Dev **không lưu giữ** dữ liệu khách hàng sau khi bàn giao |
| 2 | Mọi credentials được **chuyển giao** cho khách và **rotate/xóa** khỏi hệ thống dev |
| 3 | Dev **không truy cập** production ngoài phạm vi xử lý bảo hành (có thông báo trước) |
| 4 | Source code **không** dùng lại cho dự án khác mà không có đồng ý bằng văn bản |

---

> **Điều khoản này là phụ lục của Hợp đồng Phát triển Phần mềm.**
> Mọi thay đổi cần hai bên đồng ý bằng văn bản.
> Bản gốc tiếng Anh (surface chung): `docs/templates/maintenance-proposal.md`.
