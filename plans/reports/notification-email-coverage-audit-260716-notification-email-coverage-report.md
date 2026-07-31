# Notification + Email Coverage Audit — elearning-platform (videcode-build)

READ-ONLY. Repo: `/home/trung/Desktop/Workspace/elearning-platform`. Ngày 2026-07-16.

---

## PHẦN A — "Thông báo chung" (system broadcast / banner) → **WIRED (thật, không UI-only)**

Màn `/settings/notifications` = "Thông báo chung". Chuỗi đầy-đủ đầu-cuối, nối DB thật:

| Bước | File:line | Kết luận |
|---|---|---|
| UI list + nút "Tạo thông báo" + toggle | `apps/web/src/app/settings/notifications/page.tsx:30-127` | Grid thật (pagination), gọi API |
| API tạo broadcast | `apps/api/src/notifications/notifications.controller.ts:60-64` `@Post('broadcast')` grant `email:W` | thật |
| Service publish | `apps/api/src/notifications/notifications.service.ts:88-147` | Ghi DB thật |
| Bảng lưu | `packages/database/prisma/schema.prisma:1017 homepage_banners` (+ `banner_dismissals:1044`, `notification_logs:1574`) | 3 bảng thật |
| Toggle Bật/Tắt | controller `:72 @Patch('broadcasts/:id')` → `notifications.service.ts:150-157 updateBroadcast` cập nhật `is_active` | PATCH thật, không phải UI toggle giả |
| HIỂN THỊ ra đối tượng | `apps/web/src/components/layout/global-banners.tsx:23-78` → `GET /notifications/banners/active` → `notifications.service.ts:163-180 activeBanners` | thật, mount ở cả admin + student shell (`admin-shell.tsx:105`, `student-shell.tsx:109`) |

**Cơ chế publish** (`broadcast()` service:88): tạo 1 row `homepage_banners` + fan-out **in-app** cho mọi recipient (`notification_logs.createMany`, service:110) + enqueue **email** cho ai không mute event đó (service:128-139, category `marketing`, honor `notification_preferences`). Trả `{bannerId, inAppCount, emailQueued, emailMuted}`.

**Lọc đối tượng ĐÚNG** (service:104-107 khi fan-out, service:163-178 khi hiển thị):
- audience `all` | `students` (DTO `notifications.dto.ts:10`). Không có option "admins only".
- `activeBanners:173`: user `role==='STU'` thấy cả `all`+`students`; **non-STU (admin) chỉ thấy `all`**. Đúng ý đồ (banner "students" không lọt ra admin). Cũng lọc window `starts_at/ends_at` + trừ banner đã dismiss (`banner_dismissals`).

**Banner "Khai giảng khóa mới" trên đầu trang** = đến từ đây (seed `packages/database/prisma/seed.ts` insert `homepage_banners`, render qua `GlobalBanners`). CTA link hoạt động (`global-banners.tsx:56-63` render `cta_url`/`cta_label`).

Kết luận A: **WIRED hoàn toàn** — tạo/toggle/hiển thị/lọc-đối-tượng đều thật, có DB, có in-app + email fan-out.

---

## PHẦN B — Coverage matrix notification (in-app) + email transactional

### Kênh in-app
- Bảng: `notification_logs` (`schema.prisma:1574`) — cột: id, user_id, event, channel, title, body, read_at, created_at. **KHÔNG có cột link/url/entity_id → không thể deep-link.**
- UI chuông: `apps/web/src/components/layout/notification-bell.tsx` — badge unread + dropdown, mount trên topbar (admin + student). Click item **chỉ markRead**, **KHÔNG điều hướng** (bell.tsx:55-64). ⇒ in-app = **text-only, không deep-link ở toàn hệ thống**.
- Điểm TẠO in-app CHỈ 2 nơi:
  1. `notifications.service.ts:110` — broadcast fan-out.
  2. `helpdesk.service.ts:232 notifyParticipants` — ticket.reply (helpdesk:157) + ticket.status (helpdesk:196). Ticket **create KHÔNG** notify (createTicket:92 chỉ tạo ticket+reply+audit).

### Kênh email transactional (đường trực tiếp `MailService.send`)
| Email | File:line | CTA deep-link? |
|---|---|---|
| OTP login | `apps/api/src/auth/otp.service.ts:71` + `otp-email.template.ts` | Không cần (chỉ mã) — OK |
| Welcome (admin tạo account) | `users.service.ts:171` + `welcome-email.template.ts` | CÓ — nút "Đăng nhập lần đầu" → `/auth/login` |
| Cert issued | worker `render-certificate-pdf.job.ts:65 notifyStudent:88-98` | CÓ — link `verifyUrl` (trang verify công khai) |
| Payment dead-letter → **admin** | worker `sepay-confirm.job.ts:120 alertAdminsOfDeadLetter` | CÓ (text) — `/admin/orders/:id` |
| Bulk manual email (broadcast marketing) | `bulk-email.service.ts:40,125` | tùy admin soạn |
| Automation drip (order.paid, enrollment.created, course.completed, account.registered, user.inactive, cart.abandoned…) | `automation-trigger.service` → worker `automation-execute.job` → `render-automation-email.ts` | **template admin soạn; merge-tag chỉ resolve name/first_name/email (render-automation-email.ts:39-52). `{{course_name}}`/order/deep-link → BỊ XÓA.** Không deep-link động được. |

**Lưu ý quan trọng:** order-paid & enrollment-success **KHÔNG có email transactional bảo đảm**. `sepay-confirm.job` thành công chỉ: render invoice PDF (`render-invoice-pdf.job` — **không email buyer**) + emit automation trigger. Buyer chỉ nhận email NẾU admin đã cấu hình automation `order.paid`/`enrollment.created`. Không có in-app cho order/enrol.

### COVERAGE MATRIX

| Action | in-app? | email? | deep-link? | file:line | Gap |
|---|---|---|---|---|---|
| Đăng ký / login OTP | — | ✅ OTP | n/a | otp.service.ts:71 | OK |
| Admin tạo account (welcome) | — | ✅ | ✅ /auth/login | users.service.ts:171 | OK |
| Đơn mới (pending) — admin | ❌ | ❌ | — | orders.service.ts (create) | **GAP: admin không biết có đơn mới** |
| Đơn đã thanh toán — **user** (receipt) | ❌ | ⚠️ chỉ nếu admin bật automation | ❌ | sepay-confirm.job.ts:43-58 | **GAP: không có receipt transactional; invoice PDF không email** |
| Đơn đã thanh toán — admin | ❌ | ❌ (chỉ email khi dead-letter fail) | — | sepay-confirm.job.ts:120 | GAP: paid thành công không báo admin |
| Ghi danh khóa thành công | ❌ | ⚠️ chỉ nếu automation `enrollment.created` | ❌ | sepay-confirm.job.ts:50,144 | **GAP: không transactional** |
| Hoàn thành khóa / cấp chứng chỉ | ❌ | ✅ | ✅ verifyUrl | render-certificate-pdf.job.ts:65 | Email OK; **thiếu in-app** |
| Ticket mới → admin/triage | ❌ | ❌ | — | helpdesk.service.ts:92 createTicket | **GAP: triage không được báo ticket mới** |
| Ticket được trả lời → user | ✅ | ❌ | ❌ text-only | helpdesk.service.ts:157 | **thiếu email + deep-link tới ticket** |
| Ticket đổi trạng thái → user | ✅ | ❌ | ❌ | helpdesk.service.ts:196 | thiếu email + deep-link |
| Broadcast / automation | ✅ | ✅ | ⚠️ banner CTA có; automation không deep-link động; in-app text-only | notifications.service.ts:88 | in-app không deep-link |
| Refund | ❌ | ❌ | — | (không có handler notify) | **GAP: user không được báo hoàn tiền** |
| Tài khoản đổi quyền (role) | ❌ | ❌ | — | users.service.ts:277 (chỉ audit) | **GAP: user không biết bị đổi quyền** |
| Khóa sắp hết hạn truy cập | ❌ | ❌ | — | (không có job reminder) | **GAP: không có nhắc hết hạn** |
| Bài học / nội dung mới | ❌ | ❌ | — | (không có notify) | **GAP: học viên không được báo nội dung mới** |

---

## GAP ưu tiên

**A. Thiếu HẲN notify (cả in-app lẫn email) cho action quan trọng:**
1. **Ticket mới → triage/admin** — admin không biết có ticket cần xử lý (helpdesk.service.ts:92).
2. **Đơn đã thanh toán / ghi danh → user (receipt)** — chỉ có nếu admin tự cấu hình automation; không transactional (sepay-confirm.job.ts).
3. **Refund → user** — không báo gì.
4. **Đổi quyền tài khoản → user** — chỉ ghi audit.
5. **Đơn mới / paid → admin** (chỉ báo khi dead-letter).
6. **Khóa sắp hết hạn truy cập** — không có job nhắc.
7. **Nội dung/bài học mới → học viên đã ghi danh** — không có.

**B. Có notify nhưng THIẾU deep-link (user không click tới được):**
1. **Toàn bộ in-app** (bell) — text-only, click chỉ markRead, không điều hướng. Nguyên nhân gốc: `notification_logs` **không có cột link/entity_id** (schema.prisma:1574). Cần thêm cột `link` + cho bell render `<a>`.
2. **Ticket in-app (reply/status)** — không link tới ticket detail.
3. **Cert issued in-app** — thiếu hẳn in-app (chỉ email).
4. **Automation email** — không deep-link động (merge-tag chỉ name/email; course/order URL bị strip — render-automation-email.ts:39-52).

**Khắc phục gốc rẻ nhất:** thêm cột `link` vào `notification_logs` + `NotificationBell` render item thành `<Link href={r.link}>`; và bổ sung điểm tạo in-app/email transactional cho order-paid, enrollment, ticket-new, refund, role-change.

---

## Unresolved
- Chưa xác minh runtime seed banner "Khai giảng khóa mới" đang thực sự active trên DB deploy (chỉ đọc code seed).
- `email-templates` có `TEMPLATE_VARIABLES` gồm course_name/progress/expiry_date (template-merge-vars.util.ts) nhưng đường automation runtime (render-automation-email.ts) chỉ resolve name/email — cần xác nhận có path render thứ 2 resolve các var kia không (nghi ngờ không).
- Chưa kiểm order.paid **manual admin confirm** (orders.service.ts:245) có email receipt riêng — đọc lướt thấy chỉ emit automation + segment, giống webhook.
