# Audit AUTH + SECURITY + RATE-LIMIT — elearning-platform (branch videcode-build)

Scope: READ-ONLY scout. 3 phần: (1) bug login-redirect, (2) auth review tổng, (3) rate-limit.
Kết luận nhanh: **backend auth/security rất chỉn chu, gần "dứt điểm"**. Chỉ **1 lỗ UX/security bậc thấp PHẢI vá** trước go-live: trang auth không redirect khi đã đăng nhập.

---

## PHẦN 1 — BUG: đã đăng nhập vẫn vào được /auth/login (+ otp-verify, forgot-password)

### Root cause (xác nhận)
Trang login là client component nhưng **không hề kiểm tra session khi mount**.
- `apps/web/src/app/auth/login/page.tsx:28-46` — `useEffect` duy nhất chỉ đọc `?error=google`. KHÔNG gọi `loadMeSession`/`refreshAccessToken`, KHÔNG có `router.replace(postLoginPath(...))`. → user đã đăng nhập (còn refresh cookie HttpOnly + token trong sessionStorage) mở /auth/login vẫn thấy form.
- `apps/web/src/app/auth/otp-verify/page.tsx:50-52` — chỉ guard `if (!email) → /auth/login`; không check session.
- `apps/web/src/app/auth/forgot-password/page.tsx` — không có useEffect check session.
- `components/auth/auth-shell.tsx` — chỉ layout, không chứa guard nào.

Ngược lại, back-office guard đúng: `components/layout/portal-session.tsx:45-59` gọi `loadMeSession()` → `canEnterAdmin` → redirect. Trang auth thiếu đúng cơ chế đối xứng này.

### Google finish (KHÔNG lỗi)
`auth/google/finish/page.tsx:21-39` — có bootstrap `refreshAccessToken → loadMe → router.replace(postLoginPath)`; đúng. Đây là callback landing, không phải màn "vào lại khi đã login" nên không cùng loại bug.

### Fix đề xuất (dùng helper có sẵn — KHÔNG cần code mới)
Thêm useEffect "đã-login → thoát" vào `auth/login/page.tsx` (mount):
```ts
useEffect(() => {
  let cancelled = false;
  loadMeSession()                         // tự refresh access token từ cookie
    .then((p) => { if (!cancelled) router.replace(postLoginPath(p.role, p.grants)); })
    .catch(() => {});                       // chưa login → ở lại form (nuốt lỗi)
  return () => { cancelled = true; };
}, [router]);
```
- `loadMeSession` + `postLoginPath` đã export sẵn ở `lib/auth-client.ts:234` và `:95`.
- Áp cùng pattern cho `otp-verify/page.tsx` và `forgot-password/page.tsx` (mount → nếu đã login thì thoát về portal).
- Lưu ý nhỏ: chấp nhận 1 nhịp "flash form" trước khi redirect (client-only session, không thể chặn ở server vì token nằm ở sessionStorage/cookie /auth). Muốn mượt hơn thì render null/spinner tới khi `loadMeSession` settle. Không bắt buộc.

Mức độ: **UX/security thấp** — không rò rỉ dữ liệu (form chỉ gửi OTP), nhưng gây khó chịu + có thể tạo phiên chồng. NÊN vá trước go-live.

---

## PHẦN 2 — AUTH review tổng

| Hạng mục | Trạng thái | file:line |
|---|---|---|
| Access token (JWT) lưu sessionStorage `nn_access_token`, TTL 15' | ✅ ổn | auth-client.ts:4,14 · token.service.ts:12 |
| Refresh token opaque random 32B, chỉ lưu HMAC hash trong DB (không JWT) | ✅ tốt | token.service.ts:21,42-50 |
| Refresh cookie HttpOnly + SameSite=Strict + path=/auth + Secure(prod) | ✅ tốt | refresh-cookie.util.ts:12-20 |
| Refresh flow: /auth/refresh public (credential = cookie), rotate single-use | ✅ tốt | auth.controller.ts:117-129 · token.service.ts:62-101 |
| **Refresh-token reuse/replay → revoke toàn bộ session** (atomic claim updateMany) | ✅ rất tốt | token.service.ts:69-93 |
| authorizedFetch: 401 → refresh once → retry; self-heal | ✅ ổn | auth-client.ts:219-231 |
| Route protection back-office: guard client `canEnterAdmin` + **API là enforcer default-deny** | ✅ tốt | portal-session.tsx:45-59 · app.module.ts:85-96 |
| Guard chain global: Throttler → JwtAuth → Permissions, quên annotation = fail CLOSED | ✅ rất tốt | app.module.ts:92-96 · jwt-auth.guard.ts:8-14 |
| OTP TTL 15', single-use (del on success) | ✅ ổn | otp.service.ts:8,62-63,102-103 |
| **Brute-force OTP: ≤5 lần nhập sai/code → xoá code** (chặn 1e6 space) | ✅ tốt | otp.service.ts:12,88-96 |
| OTP request cap ≤5/email/hr (Redis incr+expire) | ✅ tốt | otp.service.ts:10-11,49-60 |
| Resend cooldown enforce **server-side** (per-email cap, không chỉ client 60s) | ✅ tốt | otp.service.ts:49-60 (client cooldown otp-verify.tsx:13 chỉ là UX) |
| Account enumeration: /otp/request luôn 202 "OTP sent", không lộ tồn tại | ✅ tốt | auth.controller.ts:41-49 · forgot-password.tsx:38-44 |
| Login gate: locked → "account locked", inactive/deleted → generic | ✅ ổn | login-gate.util.ts:9-16 |
| Google OAuth CSRF: state nonce cookie SameSite=Lax + callback so khớp | ✅ tốt | auth.controller.ts:94-101 · google-oauth-state.util.ts:13-27 |
| Google code exchange, dev-stub tách khỏi real (chỉ dev), token không vào URL | ✅ ổn | auth.controller.ts:66-112 |
| Env fail-closed prod: JWT secrets ≥length + SEPAY key bắt buộc, refuse boot | ✅ tốt | config/env.ts:55-96 |

Không thấy trang nào render dữ liệu authed khi chưa auth (API default-deny chặn ở tầng server; client chỉ mirror để gate UI).

**Ghi chú cường độ thấp (không chặn go-live):**
- Guard back-office chỉ **client-side redirect** → 1 nhịp có thể thấy shell rỗng trước khi API 401/403. Không rò dữ liệu (mọi fetch đều qua bearer + PermissionsGuard). Chấp nhận được cho SPA.
- Access token ở `sessionStorage` (XSS-reachable). Comment tại auth-client.ts:6-13 tự nhận "in-memory-only store belongs to a later hardening phase". Trade-off đã biết, TTL 15' giảm blast radius. Không bắt buộc vá trước go-live nếu XSS surface đã kiểm soát.

---

## PHẦN 3 — RATE LIMIT

**Có global throttler** (`@nestjs/throttler` v6, APP_GUARD chạy TRƯỚC JWT — 429 trước khi tốn verify/DB). Storage = **Redis dùng chung mọi replica** (`common/throttler/redis-throttler.storage.ts`) → đổi container không reset budget. Key theo client IP (proxy-aware).

| Tier | limit/60s | Áp cho | file:line |
|---|---|---|---|
| DEFAULT | 300 | toàn API + /auth/me (hot read) | throttle-tiers.ts:22 · app.module.ts:54 · auth.controller.ts:142 |
| AUTH | 10 | class /auth/* (issue/rotate token) | throttle-tiers.ts:29 · auth.controller.ts:28 |
| OTP | 5 | /auth/otp/request + /otp/verify | throttle-tiers.ts:36 · auth.controller.ts:38,53 |
| SEPAY_WEBHOOK | 100 | POST /webhooks/sepay | throttle-tiers.ts:44 · sepay-webhook.controller.ts:24 |
| SES_WEBHOOK | 100 | POST /webhooks/ses | throttle-tiers.ts:52 · ses-webhook.controller.ts:22 |

### Coverage các endpoint nhạy cảm
- **OTP spam gửi mail**: 2 lớp — per-IP 5/min (throttle) + per-EMAIL ≤5/hr (OtpService). ✅ Chống cả 1 IP spray nhiều email lẫn nhiều IP đập 1 email.
- **Brute-force OTP verify**: per-IP 5/min + per-code ≤5 attempts. ✅
- **login/refresh**: AUTH tier 10/min/IP. ✅
- **forgot-password**: dùng chung `/auth/otp/request` → hưởng OTP tier. ✅
- **webhook sepay**: HMAC `timingSafeEqual` + IP allow-list (verify TRƯỚC mọi DB read) + 100/min. ✅ (sepay.provider.ts:61-84)
- **webhook ses**: SNS RSA signature verify (`sns-signature.verifier.ts`) + 100/min. ✅

### Gap rate-limit
- **Không có gap ưu tiên nào ở tầng app.** OTP spam / brute-force / webhook flood đều đã phủ + layered.
- Đúng như comment throttle-tiers.ts:10-12: chống flood volumetric (L3/L4) là việc của **edge/WAF/reverse-proxy**, KHÔNG phải Nest middleware. → Đây là phần "để lại cho tầng hạ tầng", không phải lỗ code. Đảm bảo prod đứng sau reverse-proxy set đúng `trust proxy` để throttler đọc IP thật (proxy-aware config đã có tại config/http-security.ts — chưa đọc sâu, xem unresolved).

---

## KẾT LUẬN — auth+security đã "dứt điểm" chưa?

**Gần như xong.** Backend auth/token/OTP/webhook/throttle **đạt chuẩn production** (rotate+replay-revoke, fail-closed guard chain, layered rate-limit, env fail-closed, webhook signature verify). Đây là chất lượng ngang hasi-hub.

**PHẢI vá trước go-live (1 mục):**
1. **Auth pages redirect khi đã login** — thêm `loadMeSession → postLoginPath` mount-guard vào `login/page.tsx` (+ otp-verify, forgot-password). Dùng helper có sẵn, ~5 dòng/trang. (PHẦN 1)

**Nên cân nhắc (không chặn go-live):**
2. Access token → in-memory thay sessionStorage (giảm XSS blast) — đã ghi là hardening phase sau.
3. Xác nhận reverse-proxy/`trust proxy` ở prod để throttler + secure-cookie hoạt động đúng IP thật.

---

## Unresolved
- Chưa đọc sâu `config/http-security.ts` (proxy-aware IP extraction) — cần xác nhận `trust proxy` set đúng ở prod để per-IP throttle không bị bypass sau reverse-proxy.
- Chưa verify chi tiết SNS RSA (cert URL host allow-list chống SSRF) trong `sns-signature.verifier.ts` — chỉ xác nhận có `createVerify`/RSA. Nên soi riêng nếu SES webhook là bề mặt quan trọng.
- Chưa kiểm CSP/HTTP security headers (helmet?) — liên quan tới rủi ro XSS của token sessionStorage ở mục (2).
