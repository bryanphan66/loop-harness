# Audit: Màn "Tích hợp bên thứ 3" (`/settings/integrations`)

Repo: elearning-platform @ videcode-build. READ-ONLY. Ngày 2026-07-16.

## TL;DR — phát hiện cốt lõi (áp cho CẢ 4 dịch vụ)

**Màn này KHÔNG có form nhập cấu hình nào cả.** Nó là 1 **health hub read-only**: đọc trạng thái sống của 4 dịch vụ từ API rồi hiển thị. Mọi nút "Cấu hình"/"Thiết lập"/"Mở console" **chỉ `window.open()` sang dashboard ngoài của nhà cung cấp** (my.sepay.vn, console.aws, dash.cloudflare, sentry.io) — không có ô nhập, không có POST/PATCH lưu config.

- Nút bấm: `integration-card.tsx:58,71` → `window.open(p.console)`. URL console là hằng static tại `integration-card.tsx:17-20`.
- Controller CHỈ có `@Get('integrations')` — không có write path: `integrations-health.controller.ts:23` (docstring nói rõ "No write path here").
- Health derive từ **env đã resolve** + 1 state SES lưu DB: `integrations-health.service.ts:41-112`.

⇒ Trả lời câu hỏi user: **admin KHÔNG thể "điền cấu hình ở UI này"** — không có gì để điền. Muốn đổi config của bất kỳ dịch vụ nào ⇒ **phải sửa env + redeploy** (trừ 1 phần SES ghi được vào DB nhưng UI ghi đó **chưa tồn tại** — xem dưới).

---

## Bảng 4 dịch vụ

| Dịch vụ | Config lưu đâu | Chức năng có đọc config? | Verdict | Cần làm gì để "dùng được thật sau thiết lập" |
|---|---|---|---|---|
| **SePay** | `env` (`SEPAY_*`) → `sepayConfig` `env.ts:111-120`. KHÔNG có DB/site_config cho SePay. | ✅ CÓ — QR + verify webhook đọc `this.cfg = sepayConfig` (`sepay.provider.ts:38,42-58,73-88`) | **CHỈ ENV — nhập UI vô dụng** (mà UI cũng không cho nhập) | Đổi tài khoản/bank/webhook key ⇒ sửa `SEPAY_ACCOUNT_NUMBER/BANK_CODE/API_KEY/WEBHOOK_IPS` + redeploy. Muốn nhập từ UI: phải build form + endpoint ghi site_config + cho `sepayConfig` đọc DB-override runtime. |
| **Amazon SES** | Backend CÓ ghi được vào `site_configs` qua `upsertDomainConfig` (`ses-settings.service.ts:67-91`) NHƯNG **hàm này KHÔNG có caller nào** (grep: 0 hit ngoài định nghĩa). Region đọc từ env `sesConfig.region`. | ⚠️ MỘT PHẦN — mailer thật đọc **env** (`MAIL_TRANSPORT`, `SES_SMTP_USER/PASS`) `mail-config.ts` + `create-mail-sender.ts:17-40`, KHÔNG đọc site_config. DKIM/SPF/verification = static `'pending'` mặc định `ses-settings.service.ts:19,54-56` (không gọi SES API verify domain thật). | **UI-ONLY (read) + backend write DEAD** — nhập UI vô dụng (không có UI nhập; endpoint ghi chưa wire) | (1) Email: đặt `MAIL_TRANSPORT=ses` + `SES_SMTP_USER/PASS` env (worker), redeploy — nếu thiếu creds thì **fallback SMTP/Mailpit** `create-mail-sender.ts:19-33`. (2) DKIM/SPF: hiện chỉ hiển thị `pending` tĩnh; muốn thật phải gọi SES `GetIdentityVerificationAttributes` API. (3) Nối "P23" form → `upsertDomainConfig`. |
| **Cloudflare R2** | `env` (`STORAGE_DRIVER`, `STORAGE_S3_*`) `integrations-health.service.ts:86,93-97`. | ✅ driver quyết HOÀN TOÀN bởi env — `storage.service.ts:13` "env-selected (STORAGE_DRIVER=local/s3)". Nhiều service inject storage này. | **CHỈ ENV — nhập UI vô dụng, phải sửa env+redeploy** | Đặt `STORAGE_DRIVER=s3` + `STORAGE_S3_BUCKET/REGION/ENDPOINT/keys` env, redeploy. "Driver=local" đọc từ `env.STORAGE_DRIVER` (`integrations-health.service.ts:97`). Không có runtime switch từ UI. |
| **Sentry** | CHỈ `process.env.SENTRY_DSN` `integrations-health.service.ts:104`. | ❌ **KHÔNG có SDK ở đâu cả** — grep `@sentry`/`Sentry.init` toàn repo = 0 (chỉ file health service tự nhắc tên). API/web/worker `main.ts` không init gì. | **UI-ONLY, "theo dõi lỗi" HOÀN TOÀN chưa hoạt động** dù có set DSN | Thêm `@sentry/node` (api/worker) + `@sentry/nextjs` (web), `Sentry.init({dsn})` đọc env, redeploy. Set DSN không thôi = card xanh "ok" nhưng **không có lỗi nào được gửi đi** (trạng thái `ok` chỉ nghĩa "DSN có mặt", không phải "đang bắt lỗi"). |

---

## Chi tiết theo câu hỏi

### 1) SePay (đang "Hoạt động")
- Trạng thái "Hoạt động"/`ok` tính từ `Boolean(env.SEPAY_API_KEY)` `integrations-health.service.ts:48,50`. Dev/CI có fallback `'dev-only-sepay-api-key-sandbox'` `env.ts:112` nhưng health check nhìn `env.SEPAY_API_KEY` (biến raw, không phải fallback) ⇒ "ok" nghĩa là **env đã set key thật ≥16 ký tự** (prod bắt buộc, `env.ts:74-78`).
- Nút "Cấu hình" (health=ok) mở `https://my.sepay.vn` (console ngoài), + nút phụ "Mở console" cũng mở URL đó `integration-card.tsx:58,71`.
- QR VietQR build từ `cfg.accountNumber/bankCode/qrBaseUrl` `sepay.provider.ts:44-58`; webhook verify bằng IP allow-list + `Apikey <cfg.apiKey>` constant-time `sepay.provider.ts:73-88`. Tất cả = env. **Không đọc giá trị UI** (vì không có).

### 2) Amazon SES ("Chưa cấu hình", DKIM/SPF pending)
- Card "Chưa cấu hình" vì `configured = Boolean(s.domain)` mà `ses.domain` chưa có trong site_configs `integrations-health.service.ts:67`.
- Nút "Thiết lập" (health=off, variant primary) mở `console.aws.amazon.com/ses` — không nhập gì.
- Email gửi thật: worker chọn driver theo `MAIL_TRANSPORT` env (`smtp`→Mailpit / `ses`→SES qua SMTP endpoint). Mặc định `smtp`+Mailpit `mail-config.ts`. **Mailer KHÔNG đọc config SES từ UI/DB** — chỉ env SMTP_*/SES_SMTP_*.
- DKIM/SPF "pending": **static** — default `VERIFY_STATE='pending'` khi site_config trống `ses-settings.service.ts:19,54-56`. KHÔNG verify domain thật qua SES API. Chỉ đổi khi có ai đó ghi site_config, mà **đường ghi (`upsertDomainConfig`) không có caller** ⇒ thực tế luôn `pending`.
- "Địa chỉ chặn = 0": **suppression thật** — `email_suppressions.count()` `ses-settings.service.ts:48`. Bảng được đổ bởi SES SNS webhook bounce/complaint → `ses-suppression.service` (có spec chứng minh: `ses-suppression.service.spec.ts:24-27`). = 0 vì chưa có bounce/complaint nào (hoặc chưa nhận webhook).

### 3) Cloudflare R2 (Driver=local)
- Xem bảng. Driver 100% env, `storage.service.ts:13`. UI vô dụng cho việc đổi driver.

### 4) Sentry (env=production)
- Xem bảng. Detail "environment=production" = `env.NODE_ENV` `integrations-health.service.ts:110`. Không SDK ⇒ chưa theo dõi lỗi.

---

## Kết luận tổng
Toàn bộ màn = **read-only status dashboard trung thực** (không fabricate "ok" giả — thiết kế cố ý, docstring nhấn mạnh). Nhưng nó **KHÔNG phải màn cấu hình**: không dịch vụ nào "dùng được sau khi nhập UI" vì **UI không cho nhập**. Mọi thay đổi config = env + redeploy. Riêng SES có sẵn backend-write vào DB (`upsertDomainConfig`) nhưng **chưa nối UI/controller** (dead capability, comment tự nhận "P23 wires the UI" — P23 chưa làm), và kể cả nối xong thì **mailer vẫn đọc env chứ không đọc DB đó** (DB chỉ dùng cho card hiển thị domain/DKIM, không đổi đường gửi mail).

Xếp hạng "khoảng cách tới dùng-được-thật":
- SePay: gần nhất — chức năng đầy đủ, chỉ thiếu form UI (đang chạy bằng env, đã "Hoạt động").
- R2: env-switch, cần build override runtime nếu muốn UI.
- SES: mailer env-driven OK; phần DKIM/SPF/verify là mock static + write chưa wire.
- Sentry: xa nhất — **chưa có SDK**, set DSN không sinh tác dụng gì.

## Unresolved
- "P23" (SES config UI) trong plan có được lên lịch làm không, hay đã bỏ? (backend write đã sẵn, chỉ thiếu FE + controller).
- Chủ đích thiết kế: giữ read-only hub (config qua ops/env) hay tính chuyển sang self-serve form? — quyết định business, cần user xác nhận.
- `sepayConfig` fallback sandbox ở non-prod: card có thể hiện "off" ở dev dù thanh toán vẫn chạy bằng key sandbox (health nhìn `env.SEPAY_API_KEY` raw). Cần xác nhận đây là ý đồ (chỉ prod-key mới "Hoạt động").
