<!-- locale-vi fork — bộ báo giá khách-facing. Scaffold (placeholder + hướng dẫn trong ngoặc), không phải dự án đã điền. -->
<!-- ID/path/token (REQ-ID = MODULE.AREA.NN, PB-G4, FR-NN) giữ nguyên tiếng Anh. -->

# Bộ tài liệu Báo giá — <tên dự án>

> **Ngày lập:** DD/MM/YYYY
> **Hiệu lực:** 30 ngày kể từ ngày lập

> **Bước 1.14 — Macro-Stage Pre-Build, Block D (Freeze + Quote + Contract).** Bộ này
> là **bề mặt khách-facing** của báo giá. Mỗi dòng giá ↔ một dòng feature-register
> (`FR-NN`) đã đóng băng ở cổng `PB-G2`. Báo giá sinh **sau** khi prototype đóng băng
> (`PB-G3`) — bất biến PROTOTYPE-THEN-QUOTE. Ký + cọc = cổng `PB-G4` (cứng nhất, không
> build code trước cổng này). **Engine:** `project-manager`.

---

## Danh sách tài liệu

| # | File | Nội dung | Hành động |
|---|---|---|---|
| 1 | [Báo giá dự án](./01-bao-gia-du-an.md) | Phạm vi công việc, bảng giá, timeline, thanh toán | **Đọc kỹ** — tài liệu chính |
| 2 | [Điều khoản bảo hành](./02-dieu-khoan-bao-hanh.md) | Bảo hành miễn phí, đầu mục bảo hành, gói hỗ trợ sau bảo hành, chuyển giao | **Đọc kỹ** — đưa vào hợp đồng |
| 3 | [Câu hỏi xác nhận](./03-cau-hoi-xac-nhan.md) | Câu hỏi BLOCKER cần khách xác nhận trước khi đóng băng scope (PB-G2) | **Cần trả lời** |
| 4 | [Tổng quan kỹ thuật](./04-tong-quan-ky-thuat.md) | Công nghệ, tính năng, actors, rủi ro — tóm tắt cho khách (VISION_SCOPE) | Tham khảo |
| 5 | [Bảng thuật ngữ](./05-bang-thuat-ngu.md) | Giải thích thuật ngữ: vai trò, nghiệp vụ, kỹ thuật, trạng thái | Tham khảo |

---

## Tóm tắt nhanh

| Hạng mục | Giá trị |
|---|---|
| Tổng chi phí dự án | <số tiền> (trọn gói — ghi rõ đã/chưa gồm VAT + phí hóa đơn) |
| Timeline | DD/MM/YYYY → DD/MM/YYYY (~<NN> ngày) |
| Chi phí hạ tầng/tháng | <số tiền> (khách trả trực tiếp NCC) |
| Bảo hành miễn phí | <NN> tháng |
| Câu hỏi xác nhận scope (BLOCKER) | <NN> câu — phải = 0 còn mở để qua PB-G2 |

---

## Bước tiếp theo

1. Khách xem báo giá + trả lời câu hỏi xác nhận BLOCKER (file #3) → đóng băng scope (`PB-G2`).
2. Cập nhật báo giá theo feedback (mỗi dòng giá ↔ một `FR-NN`).
3. Ký hợp đồng + đặt cọc (`PB-G4`) → Kick-off dự án (bắt đầu Build).

---

> **Hướng dẫn dùng scaffold:** thay mọi `<...>` và `[...]` bằng dữ liệu dự án thật.
> Giữ ID/path/token tiếng Anh. Đối chiếu mọi dòng giá với
> `docs/templates/locale-vi/feature-register.md`. Bản gốc tiếng Anh của các surface
> chung: `docs/templates/*.md`.
