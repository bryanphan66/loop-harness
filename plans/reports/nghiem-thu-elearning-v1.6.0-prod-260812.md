# Biên bản nghiệm thu — elearning v1.6.0 lên Production

**Ngày:** 2026-08-12 · **Sản phẩm:** Nhất Nghệ eLearning (https://elearning.nhatnghe.net) · **Phiên bản:** v1.6.0 (commit `79fcdde`)

## 1. Kết luận nhanh
Phiên bản **v1.6.0 đã lên Production thành công**, health `db:ok / redis:ok`, chạy đúng commit `79fcdde`. Toàn bộ hạng mục kỹ thuật hôm nay đã live + verify. Còn lại là các mục **cần khách/owner cung cấp dữ liệu** (không phải lỗi kỹ thuật).

## 2. Đã lên Production + verify-at-source

| Hạng mục | Kết quả trên prod |
|---|---|
| **Seed tự động khi deploy** (mục kiểm chứng chính) | Boot chạy `migrate + seed:bootstrap + seed:cms` **thành công**, không vỡ boot. Prod tự có: vai trò + tài khoản admin + 16 mẫu email + cấu hình + khung trang. |
| **Số marketing thật** | `20.000+ hội viên` · `1.000+ học viên` · `VIDEO THỰC CHIẾN` (số từ nhatnghe.net, bỏ "17 năm" mâu thuẫn) |
| **Đã gỡ nội dung bịa** | Hết `286+ video`, countdown "Khai giảng 15/09 - 5.650.000đ", `9.000+` cũ |
| **Email hệ thống (16 mẫu)** | Wording chỉn chu + whitelabel `{{brand}}` / `{{brand_phone}}` / `{{brand_tax}}` (bỏ hotline + MST hardcode) |
| **Brand-neutral** | Template không hardcode tên/hotline/MST khách → dùng lại cho tenant khác được |

## 3. Kiến trúc seed (đã tái cấu trúc — chuẩn prod)
- **Tự động mỗi lần deploy** (an toàn prod, không phá dữ liệu): vai trò + 1 admin + 16 mẫu email + cấu hình trung tính + khung homepage. Mẫu email **ghi đè** mỗi deploy (nội dung mới tự lên); cấu hình + khung trang **giữ nếu đã có**.
- **KHÔNG tự động** (chạy tay theo khách): thương hiệu riêng + khóa học thật.
- **Demo (user/đơn giả):** chỉ dev/staging, KHÔNG lên prod.
- Đã bỏ cờ `ALLOW_PROD_SEED` (không còn dev-seed nguy hiểm ở boot) + có `check-idempotency` (chạy seed 2 lần row không đổi).

## 4. Còn treo — cần khách/owner (KHÔNG phải lỗi kỹ thuật)
| Mục | Cần |
|---|---|
| 12 số/claim còn lại | Khách Nhất Nghệ cấp số thật + bằng chứng (đã thay các số chính bằng số nhatnghe.net) |
| H-02: 7 khóa giáo trình placeholder | Owner quyết: giữ nguyên (đã chọn "quyết sau") / bổ sung nội dung thật |
| Thương hiệu + catalog khóa thật trên prod | Chạy seed thương hiệu (đã tách khỏi demo — việc kỹ thuật nhỏ) + nhập khóa thật |

## 5. Nợ CI ghi nhận (KHÔNG phải lỗi code v1.6.0, KHÔNG chặn prod)
- **SCA (kiểm bảo mật thư viện):** 31 lỗ hổng "high" trong dependency (js-yaml/nanoid... qua eslint/postcss — chủ yếu công cụ build). Đang xử bằng bump thư viện (PR riêng cho v1.6.1).
- **E2E (test giao diện tự động):** hỏng vì máy chạy CI thiếu quyền cài trình duyệt (`sudo`), không phải lỗi app. Cần chỉnh cấu hình CI/máy chạy 1 lần.

## 6. Xác nhận
- App build + boot + phục vụ bình thường (staging 85/85 trang, prod health ok).
- Đã verify trên staging (v1.6.0-beta.4) + prod (v1.6.0).
- Rollback sẵn sàng: pin version cũ 1 lệnh nếu cần.

---
*Người thực hiện: đội kỹ thuật · Verify-at-source: prod health + homepage live 2026-08-12.*
