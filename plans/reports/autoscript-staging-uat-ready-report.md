# Auto Script — Staging UAT-READY (tóm tắt cho operator)

**Ngày:** 2026-07-07 · **Deploy leg hoàn tất** — staging đã LIVE, thay operator làm prerequisite của bước 2.12. UAT + sign-off vẫn thuộc operator (ACCEPTANCE chưa clear).

## Truy cập

- **Web:** https://autoscript.160.250.134.226.sslip.io (HTTPS Let's Encrypt hợp lệ)
- **API:** https://api-autoscript.160.250.134.226.sslip.io (`/health` 200, db up; docs tại `/docs`)
- Deployed từ branch `worktree-macro2-build` @ `772052a` (repo `huunghiaish/auto-script`), Dokploy project `auto-script` (stub 18/06 đã thay bằng app thật).
- Seed xong: super_admin = `admin@reno.ai.vn`; demo owner = `owner@example.com` (+ workspace, prompt library, 3 ai_models).

## Mocked vs LIVE cho UAT

| Hạng mục | Trạng thái |
| --- | --- |
| Google OAuth | **LIVE.** Callback URI đã đăng ký (`…/api/auth/google/callback`) HOẠT ĐỘNG nguyên trạng — không cần sửa Google console. Lưu ý: OAuth client đang External/**Testing** → thêm email tester vào Test users. `admin@reno.ai.vn` đăng nhập Google → vào thẳng admin. |
| YouTube scan/resolve | **LIVE.** Đã chạy thật từ app: resolve @mrbeast + scan 8 video thật, feed outlier có dữ liệu thật. |
| AI (idea gen, chat FAB, ikigai, transcript summary) | **LIVE** qua gateway omniroute (gpt-4o-mini) — chat từ app trả completion thật. |
| AI (script gen, brand blueprint) | Mocked (canned VI) — chưa có key dạng Anthropic; gateway là OpenAI-shape. |
| OTP email | Mocked trong app — app chỉ hỗ trợ Resend API, creds Brevo là SMTP. **Creds Brevo đã verify OK** (1 email thật đã gửi từ VPS, sender admin@reno.ai.vn — kiểm tra inbox). Khi UAT: đọc mã OTP trong `docker logs` container api (dòng `[mock-email]`). Muốn live: cấp Resend key HOẶC CR nhỏ thêm SMTP transport. |
| SePay webhook URL | URL đã đăng ký HOẠT ĐỘNG (đã probe: chữ ký đúng → 200, sai → 401). Không cần sửa SePay panel. |
| SePay checkout/billing | Mocked. **Gap trước khi live:** payload + auth thật của SePay khác contract app (app dùng HMAC schema riêng) → cần 1 CR adapter nhỏ trước khi nhận bank transfer thật. UAT dùng webhook giả lập bằng curl theo deploy guide §7. |
| Transcript (Supadata), DeepSeek | Mocked (chưa có key). |

## Việc operator làm tiếp

1. Thêm test users vào OAuth client (project `auto-script-501702`) rồi tự đăng nhập Google thật để chốt J01.
2. Chạy UAT theo `docs/uat/locale-vi/2026-07-07-uat-plan.md` (13 journeys), so với prototype v3, ghi feedback + sign-off → clear ACCEPTANCE → 2.13.
3. Quyết định: Resend key vs SMTP CR (email OTP thật); CR adapter SePay webhook thật; lịch backup VPS (guide §9).
4. Secrets sinh tại deploy (Postgres/JWT/SePay-webhook) nằm ở `~/.secrets/autoscript-staging-generated.env` trên máy build — không có trong git.

Chi tiết đầy đủ + 3 bug thật đã phát hiện và fix trong lúc deploy (pnpm devDeps trong Docker build, mạng Dokploy làm api mất kết nối db, gateway mặc định SSE): `plans/reports/macro2-deploy-staging-report.md` trong repo auto-script (branch worktree-macro2-build).
