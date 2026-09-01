# Plan: Tái cấu trúc SEED elearning theo 3 loại (chốt 2026-08-11)

## Mô hình đã chốt (Trung + Nghĩa)
Tách bạch, hết loạn:

| Trục | Là gì | Chạy khi nào | File/script |
|---|---|---|---|
| **Migration/schema** (không tính là seed) | Cấu trúc bảng/cột | **Tự động mọi deploy**, fail-closed | `prisma migrate deploy` (giữ ở boot) |
| **1. init-bootstrap** | Hệ thống bắt buộc: roles + 1 superadmin + bảng enum/lookup | **Tự động** (boot) | `prisma:seed:bootstrap` |
| **2. content-cms** (whitelabel default) | **Email template hệ thống** + site config mặc định + pages mặc định. Brand-NEUTRAL (biến `{{brand}}`) | **Tự động** (boot) -> **prod CÓ email temp** | `prisma:seed:cms` |
| **3. tenant** (Nhất Nghệ = 1 khách) | Khóa học, thương hiệu, nội dung riêng của khách | **KHÔNG tự động** - trigger tay/script theo khách | `prisma:seed:tenant -- --tenant=nhatnghe` |
| **Demo/fixture** (không thuộc 3 loại prod) | User/đơn giả cho dev/QC | **CHỈ dev/stg**, KHÔNG prod | `prisma:seed:demo` |
| **Verify** | check-idempotency (bê từ HASI) | CI + tay | `prisma:seed:check-idempotency` |

## 3 tinh chỉnh từ phản biện (bổ sung vào model, không đảo)
1. **Bucket-2 phải BRAND-NEUTRAL (whitelabel).** Email template + pages default dùng biến `{{brand}}/{{site_name}}`, KHÔNG hardcode "Nhất Nghệ" - vì bucket-2 chạy cho MỌI tenant. "Nhất Nghệ" thuộc bucket-3. (Đây là bài học HASI: không seed content khách vào default.)
2. **"Tự động" cho 1+2 = trong boot-CMD nhưng CHỈ 1+2** (idempotent, prod-safe). Demo KÉO HẲN ra khỏi boot -> nhờ vậy **bỏ được `ALLOW_PROD_SEED`** (không còn dev-seed nguy hiểm trong boot để phải chặn).
3. **check-idempotency assert 2 điều:** (a) chạy 2 lần số dòng bằng nhau (không nhân đôi), (b) output 1+2 KHÔNG lọt token demo/test HOẶC brand-cụ-thể (giữ default trung tính).

## Các bước triển khai (thứ tự tránh loạn)
1. **Chờ email pha-1 (17 template) merge** -> đó chính là nội dung email của bucket-2. (Đang chạy.)
2. **Tách seed hiện tại thành 4 file:** `seed-init-bootstrap.ts`, `seed-content-cms.ts` (import email templates + site config default + pages default), `seed-tenant-nhatnghe.ts` (khóa/branding/content Nhất Nghệ - bê từ seed hiện tại), `seed-demo-fixture.ts` (user/đơn giả). Giữ nội dung, chỉ phân loại lại.
3. **package.json** thêm scripts: `prisma:seed:bootstrap|cms|tenant|demo|check-idempotency`. Giữ `prisma:seed` cũ (dev = bootstrap+cms+tenant+demo) cho tiện dev.
4. **Boot-CMD (apps/api/Dockerfile):** đổi thành `migrate deploy && seed:bootstrap && seed:cms && start` (BỎ dev-seed monolith khỏi boot).
5. **Bỏ `ALLOW_PROD_SEED`:** xóa guard trong seed.ts/seed-production.ts + xóa env khỏi config/deploy.*.yml. (Không còn cần vì boot chỉ chạy 1+2 an toàn.)
6. **check-idempotency.ts:** port pattern HASI - chạy seed:bootstrap+cms 2 lần, assert row-count bằng + không lọt test/brand token.
7. **Verify:** chạy trên staging (boot lại api, hoặc chạy tay scripts) -> role+admin+email temp+site config có; demo KHÔNG tự vào; check-idempotency PASS. Prod (sau): boot tự có bucket 1+2 (email temp có mặt), tenant seed chạy tay 1 lần.

## Rollback
- Mỗi bước 1 commit riêng. Boot-CMD + bỏ ALLOW_PROD_SEED là bước rủi ro nhất -> commit riêng, verify staging boot ok trước khi prod. Nếu lỗi: revert commit boot-CMD (quay lại seed cũ + ALLOW_PROD_SEED=false), không mất data.

## Ràng buộc
- Migration GIỮ ở boot (đừng bê "boot trống" của HASI cho migrate).
- Không đụng data thật; refactor là phân loại lại + đổi script/boot, không xóa nội dung.
