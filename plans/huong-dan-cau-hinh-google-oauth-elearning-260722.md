# Hướng dẫn cấu hình đăng nhập Google (OAuth) — Nhất Nghệ eLearning

Mục tiêu: tạo **Client ID + Client Secret** trên 1 tài khoản Google MỚI để nút "Đăng nhập với Google" chạy thật.

Code dùng 3 biến môi trường (mặc định trống → app chạy "dev-stub", không gọi Google thật):
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI` — PHẢI khớp CHÍNH XÁC với Redirect URI khai trên Google.

Callback nằm ở **API** (không phải web): `<API_HOST>/auth/google/callback`.

| Môi trường | API host | Redirect URI khai trên Google |
|---|---|---|
| Local | `http://localhost:4000` | `http://localhost:4000/auth/google/callback` |
| DEV (Dokploy) | `https://api-elearning.180.93.47.196.sslip.io` | `https://api-elearning.180.93.47.196.sslip.io/auth/google/callback` |
| STAGING (Kamal, khách UAT) | `https://api.elearning-staging.reno.ai.vn` | `https://api.elearning-staging.reno.ai.vn/auth/google/callback` |

---

## A. Tạo credential trên Google Cloud Console

1. Vào https://console.cloud.google.com, đăng nhập tài khoản Google MỚI.
2. **Tạo Project**: thanh trên cùng → chọn project → **New Project** → tên `nhat-nghe-elearning` → Create → chọn project vừa tạo.
3. **OAuth consent screen** (menu trái: APIs & Services → OAuth consent screen):
   - User type: **External** → Create.
   - App name: `Nhất Nghệ eLearning`; User support email: email của bạn; Developer contact: email của bạn → Save and Continue.
   - **Scopes** → Add or Remove scopes → tick 3 cái: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` → Update → Save and Continue.
   - **Test users**: bấm Add users, thêm các email sẽ dùng để test (khi app còn ở chế độ Testing, CHỈ email này đăng nhập được) → Save and Continue.
4. **Credentials** (menu trái: APIs & Services → Credentials):
   - **+ Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: `elearning-web`.
   - **Authorized JavaScript origins** (thêm origin của WEB, không có path):
     - `http://localhost:3000`
     - `https://elearning-staging.reno.ai.vn`
     - (dev, nếu cần) `https://elearning.180.93.47.196.sslip.io`
   - **Authorized redirect URIs** (thêm ĐÚNG các URI ở bảng trên — đây là API host + `/auth/google/callback`):
     - `http://localhost:4000/auth/google/callback`
     - `https://api.elearning-staging.reno.ai.vn/auth/google/callback`
     - (dev, nếu cần) `https://api-elearning.180.93.47.196.sslip.io/auth/google/callback`
   - **Create** → popup hiện **Client ID** và **Client Secret** → copy cả hai (Client Secret chỉ hiện 1 lần, lưu ngay).

> Lưu ý: consent screen ở chế độ **Testing** thì chỉ Test users đăng nhập được. Muốn mọi tài khoản Google đăng nhập → quay lại OAuth consent screen → **Publish app** (với scope cơ bản email/profile thì KHÔNG cần Google verification).

---

## B. Nạp biến môi trường vào từng env

Giá trị cần đặt (cùng 1 Client ID/Secret, khác Redirect URI theo env):
```
GOOGLE_OAUTH_CLIENT_ID=<client id>.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=<client secret>
GOOGLE_OAUTH_REDIRECT_URI=<redirect URI của env đó, xem bảng>
```

**Local** — thêm vào `.env` (hoặc `apps/api/.env`), restart `pnpm dev`.

**DEV (Dokploy)** — Dokploy panel → project → compose `elearning` → Environment → thêm 3 biến (redirect = `https://api-elearning.180.93.47.196.sslip.io/auth/google/callback`) → Deploy lại.

**STAGING (Kamal)** — 2 nơi:
- `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_REDIRECT_URI` (không nhạy cảm) → thêm vào `config/deploy.yml` mục `env.clear:` (redirect = `https://api.elearning-staging.reno.ai.vn/auth/google/callback`).
- `GOOGLE_OAUTH_CLIENT_SECRET` (bí mật) → thêm tên vào `config/deploy.yml` mục `env.secret:` và đặt giá trị trong `.kamal/secrets` (file gitignored; CI tự materialize từ GitHub Secrets — xem PR #186). Tức là thêm `GOOGLE_OAUTH_CLIENT_SECRET` vào GitHub repo Secrets.
- Redeploy: push `dev` → CI `kamal deploy` nạp env mới.

---

## C. Kiểm tra
1. Mở trang đăng nhập của env tương ứng → bấm **Đăng nhập với Google**.
2. Chọn tài khoản Google (phải là Test user nếu app còn Testing) → đồng ý quyền.
3. Google redirect về `<API>/auth/google/callback` → app tạo/đăng nhập tài khoản, vào thẳng (không cần OTP).

### Lỗi thường gặp
- **redirect_uri_mismatch**: Redirect URI khai trên Google KHÁC `GOOGLE_OAUTH_REDIRECT_URI` (sai scheme http/https, thiếu/thừa `/`, sai host). Phải giống hệt từng ký tự.
- **403 access_denied / app chưa publish**: tài khoản không nằm trong Test users, hoặc app chưa Publish.
- **Bấm Google nhưng không gọi Google thật**: `GOOGLE_OAUTH_CLIENT_ID` chưa set (app rơi vào dev-stub) → kiểm tra env đã nạp + đã restart/redeploy.
