# Audit: Màn "Tích hợp bên thứ 3" (`/settings/integrations`) — config có dùng được thật không?

Repo: `elearning-platform` @ `videcode-build`. READ-ONLY.

## PHÁT HIỆN CỐT LÕI (bao trùm cả 4 dịch vụ)

**Màn này KHÔNG có form nhập cấu hình nào cả.** Nó là một **health hub read-only**: mỗi card chỉ HIỂN THỊ trạng thái live (đọc từ env đang chạy) + các nút.

- Nút "Cấu hình" / "Thiết lập" / "Mở console" TẤT CẢ chỉ `window.open(providerConsoleUrl)` — bật tab mới sang dashboard của nhà cung cấp (my.sepay.vn, console.aws.amazon.com/ses, dash.cloudflare.com, sentry.io). Xem `integration-card.tsx:58,71`.
- Comment trong code nói thẳng ý đồ: *"credentials themselves are environment/ops managed, so 'Cấu hình' routes to the provider rather than a fake form"* — `integration-card.tsx:11-12`.
- Controller ghi rõ: *"No write path here… this surface only observes; it never fabricates or mutates integration config"* — `integrations-health.controller.ts:8-12`. Chỉ có 1 endpoint duy nhất `GET /settings/integrations`.
- Grep toàn `apps/web/src`: KHÔNG có input nào cho accessKeyId / SEPAY_ACCOUNT / webhookSecret / STORAGE_S3 / SENTRY_DSN. Chỉ tồn tại đúng 2 file: `page.tsx` + `integration-card.tsx`. Không có `/admin/integrations`.

⇒ **Câu trả lời chung cho câu hỏi user: admin KHÔNG "điền cấu hình ở UI này" được — vì không có ô nào để điền.** Mọi credential đều env-managed (sửa env + redeploy). UI này thuần "đèn báo trạng thái" + link ra console nhà cung cấp.

Trạng thái mỗi card (`health` = `ok`/`err`/`off`) tính THẬT từ env đang chạy + 1 state DB của SES (`integrations-health.service.ts`), không phải "luôn xanh".

---

## BẢNG 4 DỊCH VỤ

| Dịch vụ | Config lưu đâu | Chức năng có ĐỌC config đó không? | "Trạng thái" tính từ đâu | VERDICT |
|---|---|---|---|---|
| **SePay** | `env.SEPAY_*` (`env.ts:28-33,111-120`). KHÔNG lưu DB/site_config. | ✅ CÓ. QR + verify webhook đọc `sepayConfig` (=env) tại `sepay.provider.ts:38,44-58,79-92`. | `Boolean(env.SEPAY_API_KEY)` → có key = "Hoạt động"/ok, không có = off (`integrations-health.service.ts:48-51`). | **CHỈ ENV** — nhập UI vô dụng (không có ô nhập); sửa env `SEPAY_API_KEY/ACCOUNT_NUMBER/BANK_CODE/WEBHOOK_IPS` + redeploy. Chức năng thanh toán thì THẬT & đọc env đúng. |
| **Amazon SES** | 2 nguồn: (a) region/topic từ `env` (`SES_REGION`…); (b) domain/DKIM/SPF/verification lưu **DB `site_configs`** qua `SesSettingsService` (`ses-settings.service.ts:11-17,67-91`). | Email GỬI THẬT chạy ở **worker**, driver chọn bằng `env.MAIL_TRANSPORT` (`smtp`→Mailpit / `ses`→SES SMTP), creds `SES_SMTP_USER/PASS` (`mail-config.ts`, `create-mail-sender.ts`). **KHÔNG đọc gì từ `site_configs` SES.** DB SES chỉ để hiển thị card + suppression. | domain có/không (DB) → off; verification=`success/verified`→ok; pending/failed→err (`integrations-health.service.ts:65-69`). DKIM/SPF/verify mặc định **static `'pending'`** (`ses-settings.service.ts:19,54-56`) — KHÔNG poll SES API thật. | **CHỈ ENV (gửi mail) + UI-ONLY dở dang (verify state)** — nhập UI vô dụng. Mail bật SES = sửa `MAIL_TRANSPORT=ses` + `SES_SMTP_*` env + redeploy. DKIM/SPF "pending" chỉ là chữ tĩnh, không verify domain thật. `upsertDomainConfig` (ghi DB) **KHÔNG có caller nào** — dead code (comment "P23 wires the UI" nhưng P23 chưa wire). |
| **Cloudflare R2** | `env.STORAGE_DRIVER` + `STORAGE_S3_*` (`env.ts`). KHÔNG DB. | ✅ Storage service **env-selected** (`storage.service.ts:13`: "is env-selected (STORAGE_DRIVER=local for dev, s3 for R2/S3/MinIO)"). Driver quyết 100% bởi env lúc boot, không đổi runtime. | `STORAGE_DRIVER==='s3' && STORAGE_S3_BUCKET` → ok, ngược lại off; "Driver=local" đọc từ `env.STORAGE_DRIVER` (`integrations-health.service.ts:85-97`). | **CHỈ ENV — nhập UI vô dụng, phải sửa env `STORAGE_DRIVER=s3` + `STORAGE_S3_BUCKET/REGION/ENDPOINT/KEY` + redeploy.** |
| **Sentry** | Chỉ `process.env.SENTRY_DSN` (`integrations-health.service.ts:104`). | ❌ **KHÔNG có SDK.** Grep `@sentry`/`Sentry.init`/`instrument` toàn `apps/{api,web,worker}` = 0 kết quả (chỉ khớp chính file health service đọc DSN). Không init ở main.ts nào. | `Boolean(SENTRY_DSN)` → ok/off. Comment thừa nhận: *"no SDK is wired; report honestly from the DSN env only"* (`:101-102`). | **UI-ONLY / chưa wire gì** — kể cả set `SENTRY_DSN` env, "theo dõi lỗi" VẪN KHÔNG chạy vì chưa có SDK bắt lỗi. Card sẽ báo "ok" (chỉ vì có DSN) nhưng thực tế zero error được gửi lên Sentry. |

---

## GHI CHÚ CHI TIẾT

**SePay "Hoạt động":** thật sự chỉ nghĩa "có `SEPAY_API_KEY` trong env". Dev/CI fallback `dev-only-sepay-api-key-sandbox` (`env.ts:112`) NHƯNG `configured` check dùng `env.SEPAY_API_KEY` (giá trị optional gốc), nên fallback không làm card xanh giả — chỉ "Hoạt động" khi env thật sự set key. Prod boot bắt buộc key ≥16 ký tự (`env.ts:74-78`). Chức năng QR (`generateCheckout`) + auth webhook (`verifyWebhook`: IP allow-list + `Authorization: Apikey <key>` constant-time) đều đọc env — **hoạt động thật, đúng scheme SePay** (Apikey, không HMAC).

**SES "Địa chỉ chặn = 0":** đếm THẬT — `email_suppressions.count()` từ DB (`ses-settings.service.ts:48,58`). Bảng này được ghi bởi luồng webhook SNS bounce/complaint → `SesSuppressionService.suppress()` (có spec `ses-suppression.service.spec.ts`). Nên "= 0" là thật (chưa có bounce), join thật, không phải hardcode.

**SES DKIM/SPF "pending":** KHÔNG verify domain qua SES API. Là giá trị đọc từ `site_configs`; nếu chưa có row thì default hằng số `'pending'`. Muốn thành "verified" phải có ai đó gọi `upsertDomainConfig(...)` — mà **không nơi nào gọi** (không controller @Post/@Patch, không UI). Backend capability treo lơ lửng.

**R2 runtime switch:** không có. Driver cố định lúc boot theo env. Nhập key ở UI (không có ô) hay set DB đều vô nghĩa — bắt buộc env + redeploy.

---

## VIỆC CẦN LÀM để "dùng được thật sau thiết lập" (nếu muốn UI thực sự cấu hình được)

Hiện trạng thiết kế = cố ý "ops-managed env + link ra console", KHÔNG phải bug. Nếu user muốn admin cấu hình NGAY trên UI:

1. **Chung:** thêm form nhập + endpoint `POST/PATCH /settings/integrations/<key>` ghi vào `site_configs` (đã có store), và các service ĐỌC config từ store (fallback env) thay vì đọc env cứng. Với R2/mail cần cơ chế reload runtime hoặc chấp nhận "lưu xong vẫn phải redeploy".
2. **SePay:** cho nhập account/bank/webhook-IP/api-key → store; `sepay.provider` đọc store. (Nhưng secret trong DB cần mã hoá.)
3. **SES:** nối `upsertDomainConfig` vào 1 controller ghi + form (đúng như comment "P23"); và nếu muốn DKIM/SPF/verify THẬT thì gọi SES `GetIdentityVerificationAttributes`/`GetIdentityDkimAttributes` (cần aws-sdk) thay vì chữ tĩnh. Mail bật SES phải chuyển `MAIL_TRANSPORT` — hiện env-only.
4. **R2:** cho storage service đọc driver/bucket/keys từ store + khởi tạo lại S3 client động (hoặc rõ ràng "lưu xong redeploy").
5. **Sentry:** **cài SDK `@sentry/{node,nextjs}` + `Sentry.init({dsn})` ở api/web/worker** trước đã — chưa có thì set DSN vô ích. Sau đó mới cho nhập DSN qua UI/env.

---

## Unresolved
- Bảng `email_suppressions` không có API xoá/whitelist từ UI này (card chỉ đếm) — ngoài scope, chưa kiểm luồng un-suppress.
- Chưa xác minh có job/cron nào tự động refresh SES verification state (grep upsertDomainConfig = 0 caller ⇒ gần như chắc chắn KHÔNG, nhưng chưa loại trừ path động).
