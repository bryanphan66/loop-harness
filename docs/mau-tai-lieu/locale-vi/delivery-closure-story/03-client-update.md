<!-- Bản dịch khách-facing của ../../delivery-closure-story/03-client-update.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (REQ-ID = MODULE.AREA.NN) giữ nguyên tiếng Anh. -->

# Thông báo khách — <tên release / module>

> **Bước 2.12–2.13 — Macro-Stage Build & Go-live.** Tin nhắn gửi khách sau UAT /
> release. **Engine:** `ck-client-update`.
>
> **Không thông tin nhạy cảm, không PII.** Không paste credentials, access token,
> định danh cá nhân, hoặc bất kỳ thứ gì không nên xuất hiện trong log lưu trữ của
> kênh liên lạc.
>
> *(Lưu ý macro-stage: scaffold client-facing này được fork đầy đủ; playbook Build &
> Go-live đầy đủ build ở macro-stage increment kế tiếp.)*

## Kênh

<kênh thông báo — ví dụ: Zalo, email, Telegram, ticketing inbox. Chọn một kênh cho
mỗi thông báo; không cross-post>

## Người nhận

<danh sách phân phối, tên kênh, hoặc người nhận cụ thể>

## Tiêu đề

<tiêu đề một dòng — e.g. "Module Đơn hàng sẵn sàng UAT">

## Nội dung

<tóm tắt hai-đến-năm câu về cái gì đã ship, kiểm tra gì trong release, và yêu cầu
hành động tiếp theo nếu có>

Ví dụ các yêu cầu hành động:

- "Anh/chị vui lòng xác nhận nghiệm thu UAT trước <ngày> theo `01-uat-plan.md`."
- "Không cần hành động — release notes đính kèm. Tham chiếu: `ORD.STATUS.01`."
- "Phát hiện bug ở <khu vực>; lên kế hoạch rollback vào <ngày>; sẽ cập nhật tiếp."

## Tham chiếu REQ (tuỳ chọn)

Nếu thông báo nêu rõ hành vi đã bàn giao, trích `REQ-ID` để khách có thể grep ngược lại:

- `ORD.STATUS.01` — <mô tả một dòng cái đã ship>.

## Đã gửi

- Ngày: YYYY-MM-DD
- Giờ: HH:MM (GMT+7)
- Người gửi: <tên hoặc nguồn automation>
- Link log kênh (nếu có): <permalink tới tin nhắn>

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/mau-tai-lieu/delivery-closure-story/03-client-update.md`.
- Kế hoạch UAT: `docs/mau-tai-lieu/locale-vi/delivery-closure-story/01-uat-plan.md`.
- Biên bản nghiệm thu: `docs/mau-tai-lieu/locale-vi/delivery-closure-story/02-signoff-nghiem-thu.md`.
- Release note: `docs/mau-tai-lieu/locale-vi/release-note.md`.
