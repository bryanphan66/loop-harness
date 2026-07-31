# Zone E (Email & Tự động hóa) — Audit tính năng CHƯA wired thật

Repo: `/home/trung/Desktop/Workspace/elearning-platform` @ `videcode-build`. Auditor read-only, không sửa code. Grep/read code thật.

## Bảng vấn đề (ưu tiên)

| Tab | Vấn đề | Loại | Bằng chứng (file:line) | Mức |
|-----|--------|------|------------------------|-----|
| Tự động hóa | `order.paid` CHỈ emit từ SePay worker; path **manualConfirm** (ADM xác nhận tay, PO.PAY.06) chỉ recompute segment, KHÔNG enqueue trigger → automation "Mua hàng thành công" KHÔNG chạy cho đơn xác nhận tay | event-không-emit (đúng pattern OTP) | `apps/api/src/orders/orders.service.ts:229-234` (chỉ `segments.recomputeOne('order.paid')`, thiếu trigger emit); emit thật nằm ở `apps/worker/src/jobs/sepay-confirm.job.ts:137`, KHÔNG nằm trong `confirmOrderAndEnrol` dùng chung | **Cao** |
| Nhật ký gửi / mọi tab gửi | Open/Click tracking THỰC TẾ = 0: `injectEmailTracking` (pixel+rewrite link+unsub) CHỈ được gọi ở `sendTest` (gửi thử về chính mình). Hai path gửi thật KHÔNG chèn pixel | tracking-0 | `apps/worker/src/lib/automation/send-email-action.ts:67` (enqueue html thô, không inject); `apps/api/src/notifications/bulk-email.service.ts:78-84` (không inject); chỉ `apps/api/src/email-templates/email-templates.service.ts:172` inject. Xác nhận: `apps/web/src/app/marketing/_components/delivery-log-page.tsx:43-44` "dispatch logs don't track opens" | **Cao** |
| Tự động hóa | Builder KHÔNG grey trigger chết: web layer KHÔNG BAO GIỜ đọc cờ `implemented` → author chọn được cart.abandoned/tag.added/email.opened; flow lưu OK nhưng KHÔNG BAO GIỜ fire (trái comment catalog "web is expected to grey these out") | UI-only-không-wired | `apps/web/src/app/marketing/_components/flow-node-editor-panel.tsx:58-60` (map toàn bộ catalog thành option, không filter/disable); `grep '\.implemented' apps/web/src` = 0 kết quả | **Cao** |
| Tự động hóa | 3 trigger DEAD trong catalog: `cart.abandoned`, `tag.added`, `email.opened` — `implemented:false`, không có nơi `.emit(` | event-không-emit | `apps/api/src/automation/automation-triggers.catalog.ts:55-79`; `grep .emit(` toàn repo không có 3 event này | **Cao** |
| Tự động hóa | `tag.added` chết KÉP: ngay cả action `add_tag` khi gắn tag cũng KHÔNG emit `tag.added` → không thể chain "gắn tag → chạy flow" | event-không-emit | `apps/worker/src/lib/automation/automation-engine.ts:65-67` gọi `applyCustomerTag` rồi trả `tagged`, không emit; `resolve-customer-tag.ts` không emit | **Vừa** |
| Phân khúc | THIẾU CRUD Thêm + Xóa: controller chỉ có `@Get`, `@Post('recalculate')`, `@Get(:key)`, `@Patch(:key)` — KHÔNG có `@Post` (create) / `@Delete`. UI chỉ có nút "Tính lại" + row→sửa | thiếu-CRUD | `apps/api/src/segments/segments.controller.ts:18-42`; `apps/web/src/app/marketing/_components/segment-list-page.tsx:45-50,148-156` (chỉ recalculate + edit) | **Vừa** |
| Gửi hàng loạt | Broadcast KHÔNG có Xóa/Hủy: chỉ `@Post('broadcast')`, `@Get('broadcasts')`, `@Patch('broadcasts/:id')` — thiếu `@Delete` (hủy lịch broadcast đã đặt) | thiếu-CRUD | `apps/api/src/notifications/notifications.controller.ts:60-72` | **Thấp** |
| Danh sách chặn | Suppression KHÔNG có nút Thêm tay: chỉ `@Get` + `@Delete(:email)` (gỡ chặn). Không `@Post` thêm địa chỉ thủ công (chỉ auto qua bounce/unsub/webhook) | thiếu-CRUD | `apps/api/src/ses/suppression.controller.ts:18-42` | **Thấp** |
| Mọi tab gửi thật | Footer 1-click unsubscribe + header `List-Unsubscribe` CHỈ có ở sendTest; automation + broadcast gửi thật KHÔNG có (rủi ro compliance/CAN-SPAM) | UI-only-không-wired | `send-email-action.ts:67`, `bulk-email.service.ts:81` (không set header/footer) vs `email-templates.service.ts:180` | **Thấp** |

## Danh sách trigger DEAD (catalog có, không emit) — QUAN TRỌNG

Catalog 8 card (`automation-triggers.catalog.ts`), đối chiếu `.emit(` thật:

| eventType | catalog `implemented` | Emit thật? | Trạng thái |
|-----------|----------------------|-----------|-----------|
| account.registered | true | ✓ `auth.service.ts:64`, `google-oauth.service.ts:153`, `users.service.ts:179` | SỐNG |
| order.paid | true | ✓ CHỈ `sepay-confirm.job.ts:137` — **thiếu ở manualConfirm** | SỐNG một-phần (đơn xác nhận tay = chết) |
| video.watched | true | ✓ `learning.service.ts:184` | SỐNG |
| course.completed | true | ✓ `learning.service.ts:204` | SỐNG |
| user.inactive | true | ✓ scan hằng ngày `inactivity-scan.ts:42` | SỐNG |
| cart.abandoned | false | ✗ | **CHẾT** |
| tag.added | false | ✗ (add_tag action cũng không emit) | **CHẾT** |
| email.opened | false | ✗ (recordOpen chỉ set `opened_at`, không emit) | **CHẾT** |

Phụ: `lesson.completed` CÓ emit (`learning.service.ts:180`) nhưng KHÔNG có trong catalog → không expose cho author (nhỏ, nội bộ).

## Phần đã wired TỐT (không phải bug — để khỏi fix nhầm)

- Automation engine: condition / send_email / add_tag / wait đều thực thi thật; enroll vào flow `status='active'` khớp `trigger_type`; drip dùng chung path (`trigger-flows.ts:22-43`, `automation-engine.ts`).
- Chỉ flow `active` mới enroll; `draft` không fire (đúng).
- Segment recompute ("Tính lại") chạy sync-inline thật + engine đánh giá điều kiện (`segments.service.ts:90,127`; `condition-predicates.ts`).
- Suppression ĐƯỢC HONOR trước gửi ở 3 lớp: broadcast loại suppressed khỏi recipient (`bulk-email.service.ts:112`), automation `isSuppressed` check (`send-email-action.ts:60`), + lớp mail-sender defense-in-depth.
- Broadcast: enqueue mỗi recipient + ghi `email_dispatch_logs` + lên lịch (`scheduledAt`→delay) + resend (`notifications.controller.ts:48`). CRUD gửi/sửa OK, chỉ thiếu xóa.
- Email templates: CRUD đầy đủ + soft-delete (chặn xóa template transactional) + send-test chạy thật qua queue worker.
- Automation flows CRUD + duplicate + enrollments/stats đầy đủ.

## Kết luận — ưu tiên fix để Zone E "chạy thật" chứ không chỉ đẹp UI

1. **[Cao] `order.paid` cho manualConfirm** — thêm enqueue trigger `order.paid` trong path ADM xác nhận tay (hoặc chuyển emit trigger vào chung `confirmOrderAndEnrol` để cả 2 path — SePay + tay — cùng fire). Đây đúng loại bug OTP: UI báo trigger sống, âm thầm chết cho một tập đơn.
2. **[Cao] Chèn tracking pixel vào 2 path gửi thật** — gọi `injectEmailTracking` trong `send-email-action.ts` (automation, đã có `email_logs.id`) và trong broadcast. Không có bước này thì mọi KPI Mở/Click luôn = 0. Broadcast còn ghi bảng khác (`email_dispatch_logs`) vốn không có cột open/click — cần thống nhất nguồn tracking.
3. **[Cao] Grey trigger chết trong builder** — web đọc cờ `implemented` để disable cart.abandoned/tag.added/email.opened (mitigation đã dự tính trong catalog nhưng CHƯA code). Hoặc emit thật 3 event đó nếu muốn tính năng sống.
4. **[Vừa] Segments Add + Delete** — thêm `@Post`/`@Delete` + nút UI (hiện khóa ở 4 segment seed).
5. **[Vừa] `tag.added` emit từ action add_tag** — nếu muốn chain tag→flow.
6. **[Thấp] Broadcast delete/cancel, suppression manual-add, footer unsubscribe trên send thật.**

## Câu hỏi chưa chắc
- 3 trigger `implemented:false` là "cố tình để lại greyed cho phase sau" — nhưng web KHÔNG grey. Là quyết định business (chờ phase cart/CRM/tracking) hay bug UI? Cần user xác nhận có nên grey ngay hay build tiếp.
- Suppression không cho thêm tay: cố ý (system-managed) hay thiếu? Prototype E-suppression có nút "Thêm" không (chưa đối chiếu bản export)?
- Bảng log kép `email_logs` (automation/test, có open/click) vs `email_dispatch_logs` (broadcast, không open/click): hợp nhất hay giữ 2? Ảnh hưởng cách vá tracking.
