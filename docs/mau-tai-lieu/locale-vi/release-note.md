<!-- Bản dịch khách-facing của ../release-note.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (REQ-ID = MODULE.AREA.NN, TC-NNN, CR-NN) giữ nguyên tiếng Anh. -->

# Release Note — <phiên bản hoặc tên release>

Ngày: YYYY-MM-DD · Môi trường: dev | staging | production
Build / commit: <git sha> · Release trước: <phiên bản hoặc tag>

> **Bước 2.13 — Macro-Stage Build & Go-live (Release).** Tạo tại mỗi release. Mọi
> `REQ-ID` được phát hành trong release này phải xuất hiện ở § 2. Nằm giữa UAT
> (`docs/mau-tai-lieu/locale-vi/delivery-closure-story/01-uat-plan.md`) và thông báo
> khách (`03-client-update.md`). **Engine:** `ship` + `deploy`.
>
> *(Lưu ý macro-stage: scaffold client-facing này được fork đầy đủ ngay bây giờ;
> playbook build-execution + release đầy đủ của Build & Go-live build ở
> macro-stage increment kế tiếp.)*

## 1. Tóm tắt release

Một đoạn: release này có gì và lý do. Liên kết với mốc trong SOW
(`docs/mau-tai-lieu/locale-vi/proposal-sow.md` § 7) nếu có.

## 2. Tính năng mới

| # | Tính năng | REQ-ID | Bằng chứng (TC) | Khách thấy? |
| --- | --- | --- | --- | --- |
| F1 | <tính năng> | `ORD.STATUS.01` | `TC-001` | có |
| F2 | <tính năng> | `MKT.CONSENT.01` | `TC-014` | có |

> Mọi `REQ-ID` phát hành phải có ≥1 `TC-NNN` pass (RTM forward completeness).

## 3. Sửa lỗi

| # | Lỗi | Severity | CR / commit |
| --- | --- | --- | --- |
| B1 | <mô tả một dòng> | S2 | `CR-02` / `<commit>` |

## 4. Cải tiến (không thay đổi hành vi)

Các mục động đến codebase nhưng không thay đổi hành vi sản phẩm — hiệu năng, refactor,
nâng phụ thuộc, tài liệu.

- <cải tiến>

## 5. Thay đổi không tương thích (Breaking changes)

Nếu có. Nếu không, ghi "Không".

| Thay đổi | Ảnh hưởng | Bước di trú |
| --- | --- | --- |
| API endpoint X chuyển sang /v2 | tích hợp phía khách | cập nhật client sang /v2 trước YYYY-MM-DD |

## 6. Vấn đề đã biết

Vấn đề chúng tôi chấp nhận ship cùng. Liên kết mỗi mục tới một backlog row hoặc CR.

- <vấn đề> — `CR-NN` hoặc backlog row

## 7. Checklist trước khi deploy

- [ ] Toàn bộ test pass trên staging (link tới test run).
- [ ] Database migration đã test trên bản clone staging của dữ liệu prod.
- [ ] Backup DB prod thực hiện trong vòng 4 giờ gần nhất.
- [ ] Feature flag sẵn sàng (mặc định TẮT cho tính năng có rủi ro).
- [ ] Biến môi trường cho tích hợp mới đã thêm vào secret store prod.
- [ ] Dịch vụ bên thứ ba đã được thông báo (nếu tích hợp thay đổi).
- [ ] Đã thông báo cửa sổ deploy cho khách.
- [ ] Đường rollback đã được test (xem § 9).
- [ ] Người trực / liên hệ sẵn sàng trong cửa sổ deploy.

## 8. Checklist smoke sau deploy

Chạy trong vòng 30 phút sau deploy. Mọi mục phải pass trước khi tuyên bố release xanh.

- [ ] Homepage load được (200, < 3s).
- [ ] Flow đăng nhập hoạt động (tài khoản test, cả happy + sai).
- [ ] Hành động cốt lõi của release hoạt động end-to-end trên dữ liệu prod (trích từ `01-uat-plan.md` § Journey).
- [ ] Không có error-rate spike mới ở monitoring (so với baseline 1h trước deploy).
- [ ] Không có alert-rule mới firing.
- [ ] Flow payment xử lý được một giao dịch thật hoặc sandbox (chỉ e-commerce / SaaS).
- [ ] Background job xử lý được một event mẫu (chỉ queue / cron / webhook).
- [ ] Log từ code path mới hiển thị được ở monitoring.

## 9. Kế hoạch rollback

Rollback = một dòng đổi `IMAGE_TAG`.

| Khi nào rollback | Cách làm |
| --- | --- |
| Smoke sau deploy fail ở mục trọng yếu (login, payment, homepage) | Đổi `IMAGE_TAG` về release trước + redeploy. Thời gian ước lượng: <N> phút. |
| Error rate > <threshold> trong 1 giờ | Như trên. Thông báo khách theo § 11. |
| Phát hiện hỏng dữ liệu | Dừng ghi (`<command>`), restore từ backup (§ 7), tìm nguyên nhân gốc trước khi áp dụng lại. |

Các bước rollback:

1. Đổi `IMAGE_TAG` → release trước.
2. Redeploy.
3. Chạy lại smoke checklist (§ 8).
4. Thông báo khách (§ 11).

## 10. Xác nhận sau rollback

- [ ] Production trỏ về release trước (xác minh qua version-endpoint hoặc git sha header).
- [ ] Smoke checklist (§ 8) pass lại trên phiên bản đã rollback.
- [ ] Ghi chú sau sự cố ở `docs/incidents/YYYY-MM-DD-<slug>.md`.
- [ ] CR follow-up cho release đã fail (đúc `CR-NN`).

## 11. Tin nhắn báo khách

Gửi qua kênh đã thoả thuận trong vòng <N> giờ sau deploy. Dùng template tại
`docs/mau-tai-lieu/locale-vi/delivery-closure-story/03-client-update.md` và chèn tóm tắt
từ § 1.

Bản nháp:

```text
Tiêu đề: <dự án> release <phiên bản> đã deploy

Chào <khách>,

Bên em đã deploy <phiên bản> lên production lúc <giờ>. Release này bao gồm:

- <một dòng tính năng 1>
- <một dòng tính năng 2>
- <số lượng> sửa lỗi

URL production: <url>
Anh/chị có thể kiểm tra: <việc khách cần làm>

Vấn đề đã biết (đã trong backlog, không chặn):
- <vấn đề>

Nếu thấy gì khác lạ, anh/chị phản hồi giúp em ngay tại thread này.

— <tên vendor>
```

## 12. Ký xác nhận

| Vai trò | Tên | Xác minh bởi |
| --- | --- | --- |
| Vendor — người deploy | <tên> | git sha + timestamp |
| Vendor — người verify | <tên> | smoke checklist passed |
| Khách (nếu yêu cầu duyệt trước prod) | <tên> | link signoff UAT |

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/mau-tai-lieu/release-note.md`.
- Kế hoạch UAT gating release: `docs/mau-tai-lieu/locale-vi/delivery-closure-story/01-uat-plan.md`.
- Hồ sơ signoff: `docs/mau-tai-lieu/locale-vi/delivery-closure-story/02-signoff-nghiem-thu.md`.
- Template báo khách: `docs/mau-tai-lieu/locale-vi/delivery-closure-story/03-client-update.md`.
- Change request đã vào release này: `docs/mau-tai-lieu/locale-vi/change-request-log.md` (lọc theo release tag).
- Token grammar: `docs/process/TRACE_SPEC.md`. Cổng + macro-stage: `docs/process/WORKFLOW.md`.
