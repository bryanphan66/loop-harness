# Notification + Email Coverage Audit — elearning-platform

Repo: `/home/trung/Desktop/Workspace/elearning-platform` @ `videcode-build`. READ-ONLY. Ngày 2026-07-16.

---

## PHẦN A — "Thông báo chung" (broadcast/banner) → **WIRED THẬT, không UI-only**

Màn "Thông báo chung" = route `/settings/notifications` (KHÔNG phải `/admin/notifications`).

### Chuỗi wiring đầy đủ
- **UI list + toggle:** `apps/web/src/app/settings/notifications/page.tsx` — grid `homepage_banners`, nút "Tạo thông báo" mở dialog, toggle Bật/Tắt gọi `updateBroadcast`.
- **API controller:** `apps/api/src/notifications/notifications.controller.ts:54-88` — `POST /notifications/broadcast` (grant `email:W`), `GET /notifications/broadcasts` (`email:R`), `PATCH /notifications/broadcasts/:id` (`email:W`), `GET /notifications/banners/active` (self-scope), `POST /notifications/banners/:id/dismiss`.
- **Service:** `apps/api/src/notifications/notifications.service.ts`.

### Tạo thông báo → lưu DB thật
`broadcast()` (service:88-147) ghi **3 nơi**:
1. `homepage_banners.create` (schema `packages/database/prisma/schema.prisma:1017`) — bản banner (title/body/severity/audience/cta_url/cta_label/starts_at/ends_at/is_active).
2. `notification_logs.createMany` (service:110) — fan-out in-app 1 dòng/recipient (channel `in_app`), **luôn tạo**.
3. `queue.enqueue('email', …)` (service:129) — nửa email, **bỏ qua** ai đã mute event đó (`notification_preferences.email_muted`).

### Toggle Bật/Tắt → PATCH thật
`updateBroadcast()` (service:150-157) → `homepage_banners.update({ is_active })`, soft-delete-safe. Không phải mock.

### Có THỰC SỰ hiển thị ra đối tượng?
CÓ. `GlobalBanners` (`apps/web/src/components/layout/global-banners.tsx`) mount ở **cả 2 shell**: `admin-shell.tsx:105` và student `student-shell.tsx:109`. Gọi `GET /notifications/banners/active` → `activeBanners()` (service:163-180) lọc: `is_active=true`, trong cửa sổ `starts_at/ends_at`, chưa dismiss, và **theo audience**. Banner render ở đầu app shell với CTA link (`b.cta_url`). Dismiss durable qua `banner_dismissals` (unique (banner,user)).
→ Banner "Khai giảng khóa mới" trên đầu trang admin **đến từ đúng luồng này** (seed ở `packages/database/prisma/seed.ts`).

### Lọc đối tượng đúng không?
Audience chỉ có **2 giá trị**: `all` | `students` (`notifications.dto.ts:10`). Lọc tại `activeBanners`:
`user.role === 'STU' ? {} : { audience: 'all' }` (service:173).
- Student (STU) → thấy banner `all` + `students`. ✅
- Admin/staff (non-STU) → chỉ thấy `all`. ✅ (banner `students` KHÔNG lọt lên admin.)
- ⚠️ **KHÔNG có audience "admin-only"** — không thể broadcast riêng cho admin. Cột "Đối tượng" trong UI vì thế chỉ có Tất cả / Học viên.

**Kết luận A:** Thông báo chung **WIRED end-to-end thật** (DB `homepage_banners` + `notification_logs` + email queue; toggle PATCH thật; hiển thị + dismiss + lọc audience thật). Hạn chế nhỏ: audience chỉ 2 mức (thiếu admin-only).

---

## PHẦN B — Notification in-app + email transactional

### B1. Kênh in-app
- **Bảng:** `notification_logs` (`schema.prisma:1574`): `id, user_id, event, channel, title, body, read_at, created_at`. **KHÔNG có field `link`/`url`/`entity_type`/`entity_id`.** → in-app notif **về bản chất không thể deep-link.**
- **Điểm tạo in-app (chỉ 2):**
  1. `notifications.service.ts:110` — broadcast fan-out.
  2. `helpdesk.service.ts:232` (`notifyParticipants`) — reply ticket (`ticket.reply`) + đổi status (`ticket.status`), gửi cho requester+assignee ≠ actor.
- **UI chuông (bell):** `apps/web/src/components/layout/notification-bell.tsx`, ở topbar cả admin + student. Badge unread, dropdown 10 notif mới nhất, click → `markNotificationRead` (chỉ đánh dấu đã đọc).
  - ⚠️ **Bell KHÔNG deep-link:** item chỉ render `title` + `body` (text), onClick chỉ markRead, **không navigate**. Model không có link nên không thể click tới đối tượng. → **mọi in-app notif đều là text chết.**

### B2. Kênh email transactional (thực sự gửi)
Đường gửi: `MailService.send` (api) hoặc `mailSender.send` (worker) → queue `email` → `email-dispatch.job.ts` → SES/SMTP (Mailpit dev).

| Email | Nơi gửi | CTA/deep-link |
|---|---|---|
| **OTP login** | `apps/api/src/auth/otp.service.ts:71` (`otp-email.template.ts`) | Không (chỉ mã 6 số) — đúng bản chất |
| **Welcome/tạo tài khoản** | `apps/api/src/users/users.service.ts:171` (`welcome-email.template.ts`) | ✅ CTA "Đăng nhập lần đầu" → `/auth/login` |
| **Chứng chỉ cấp** | `apps/worker/src/jobs/render-certificate-pdf.job.ts:65,98` (`notifyStudent`) | ✅ link `verifyUrl` (trang verify công khai) |
| **Payment dead-letter alert (ADM)** | `apps/worker/src/jobs/sepay-confirm.job.ts:120` | ✅ text `/admin/orders/:id` (chỉ khi confirm FAIL) |
| **Bulk manual email (marketing)** | `apps/api/src/notifications/bulk-email.service.ts:40,125` | CTA do admin soạn |
| **Broadcast email half** | `notifications.service.ts:129` | Body admin soạn (không tự chèn link) |
| **Automation/drip email** | worker automation-execute → `render-automation-email.ts` | CTA do admin soạn trong template; **merge-tag chỉ resolve `name/first_name/email`** — `{{course_name}}`/link động bị **xóa trắng** (render-automation-email.ts:39-52) |

**KHÔNG có email nào cho:** order đã thanh toán (receipt), ghi danh thành công, ticket reply, refund, đổi quyền, hết hạn truy cập, nội dung mới.

### B3. COVERAGE MATRIX

| Action | in-app? | email? | deep-link tới đâu? | file:line | Gap |
|---|---|---|---|---|---|
| Đăng ký / login OTP | ✗ | ✅ OTP | — (không cần) | otp.service.ts:71 | OK |
| Tạo tài khoản (welcome) | ✗ | ✅ | /auth/login | users.service.ts:171 | OK |
| Đơn mới (pending) — ADM | ✗ | ✗ | — | — | **THIẾU cả 2** (admin không biết có đơn mới) |
| Đơn mới (pending) — user | ✗ | ✗ | — | — | THIẾU (chỉ có QR checkout tại chỗ) |
| **Đơn ĐÃ thanh toán — user (receipt)** | ✗ | ✗* | — | sepay-confirm.job.ts:43-58 | **THIẾU** — chỉ render invoice PDF (không email); email chỉ nếu admin cấu hình automation `order.paid` |
| Đơn đã thanh toán — ADM | ✗ | ✗ | — | — | **THIẾU** (admin không được báo đơn thành công) |
| **Ghi danh khóa thành công** | ✗ | ✗* | — | sepay-confirm.job.ts:50 | **THIẾU** transactional; chỉ trigger automation `enrollment.created` (tùy admin) |
| Hoàn thành khóa / cấp chứng chỉ | ✗ | ✅ | verifyUrl | render-certificate-pdf.job.ts:65 | Email OK; **in-app THIẾU** |
| Ticket mới — ADM/triage | ✗ | ✗ | — | helpdesk.service.ts:92 `createTicket` | **THIẾU** — tạo ticket KHÔNG notify triage |
| Ticket được trả lời — user | ✅ in-app | ✗ | **không có link** | helpdesk.service.ts:157 | **thiếu deep-link + thiếu email** |
| Ticket đổi trạng thái — user | ✅ in-app | ✗ | **không có link** | helpdesk.service.ts:196 | thiếu deep-link + email |
| Broadcast / thông báo chung | ✅ in-app + banner | ✅ (trừ muted) | banner có cta_url; in-app không | notifications.service.ts:88 | in-app không deep-link |
| Email automation/drip | ✗ | ✅ | CTA admin soạn (link động bị xóa) | render-automation-email.ts | link động không resolve |
| **Refund** | ✗ | ✗ | — | orders (status refunded, no notify) | **THIẾU cả 2** |
| **Tài khoản đổi quyền (role)** | ✗ | ✗ | — | users.service.ts:256-277 (chỉ audit) | **THIẾU cả 2** |
| **Khóa sắp hết hạn truy cập** | ✗ | ✗ | — | — (không có job reminder) | **THIẾU cả 2** — không có scheduled reminder |
| **Bài học/nội dung mới** | ✗ | ✗ | — | — (chapters/courses không notify) | **THIẾU cả 2** |

\* = chỉ đi qua automation trigger (admin phải tự cấu hình workflow), KHÔNG phải transactional đảm bảo.

### B4. GAP ưu tiên

**Thiếu HẲN notify (cả in-app lẫn email) cho action quan trọng:**
1. **Order đã thanh toán — user (receipt) & admin** — sự kiện quan trọng nhất của thương mại, hiện chỉ render invoice PDF (không email), không in-app. `sepay-confirm.job.ts` chỉ email admin khi FAIL.
2. **Ticket mới → không báo triage/admin** (`createTicket` không gọi `notifyParticipants`) — support có thể miss ticket.
3. **Đổi quyền tài khoản** — user không biết bị thăng/giáng quyền (chỉ audit_logs).
4. **Refund** — không báo user.
5. **Khóa sắp hết hạn truy cập** — không có scheduled reminder job (chỉ có `pending-order-expire.job` cho đơn, không cho entitlement).
6. **Nội dung/bài học mới** — không báo học viên đã ghi danh.

**Có notify nhưng THIẾU deep-link (text chết, user không click tới được):**
- **Toàn bộ in-app notif** (bell) — `notification_logs` không có field link; bell click chỉ markRead. Ảnh hưởng: ticket reply/status, broadcast in-app.
- **Automation/drip email** — template hỗ trợ CTA nhưng merge-tag chỉ resolve name/email; link động theo course/order bị xóa → không deep-link tới khóa/đơn cụ thể.

**Chỉ email, thiếu in-app (bổ sung nhẹ):** chứng chỉ cấp (có email, nên thêm in-app bell).

---

## Unresolved
- Automation `order.paid`/`enrollment.created` CÓ gửi email hay không phụ thuộc admin đã tạo workflow tương ứng trong `/admin/automations` — chưa kiểm seed có workflow mặc định nào không (cần đọc `seed.ts` automation_workflows).
- Chưa xác nhận `email-dispatch.job` có honor suppression cho transactional (OTP/welcome) hay chỉ marketing — thấy `category` gate ở `suppression-aware-mail-sender` nhưng chưa trace category của welcome/otp.
- Deep-link fix cho in-app cần thêm cột `link` vào `notification_logs` (migration) — ngoài phạm vi audit.
