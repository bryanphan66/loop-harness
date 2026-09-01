<!-- locale-vi fork — câu hỏi xác nhận scope khách-facing. Scaffold (placeholder + hướng dẫn trong ngoặc). -->
<!-- ID/path/token (BLOCKER/IMPORTANT/NICE, FR-NN, REQ-ID, PB-G2) giữ nguyên tiếng Anh. -->

# Câu hỏi cần Khách hàng xác nhận — <tên dự án>

> **Nguồn:** `docs/requirements/CLARIFICATIONS.md` (bước 1.6 — VALIDATE → RESOLVE-PATCH).
> **Ngày:** DD/MM/YYYY
> **Engine:** `ck-xre VALIDATE → RESOLVE-PATCH`.
>
> **Vai trò trong workflow:** đây là các câu hỏi chặn việc đóng băng scope ở cổng
> `PB-G2`. Mọi câu **BLOCKER** phải được khách trả lời (bằng văn bản) trước khi
> feature-register đóng băng. Câu **IMPORTANT/NICE** không chặn cổng.
>
> **Hướng dẫn:** Đánh dấu ✅ vào lựa chọn. Nếu chưa chắc, ghi "Chưa quyết định" — team
> dev dùng phương án mặc định (⭐) và điều chỉnh sau. Lưu ý: BLOCKER mặc định vẫn cần
> khách xác nhận để qua PB-G2.

---

## Mức độ ưu tiên

| Ký hiệu | Ý nghĩa | Ảnh hưởng cổng |
|---|---|---|
| 🔴 **BLOCKER** | Không trả lời → dev có thể làm sai → phải làm lại | **Chặn PB-G2** |
| 🟡 **IMPORTANT** | Dev có thể bắt đầu với giả định, trả lời sớm tốt hơn | Không chặn |
| 🟢 **NICE** | Không ảnh hưởng tiến độ phase chính | Không chặn |

---

## 🔴 CÂU HỎI BLOCKER (phải trả lời trước PB-G2)

[Mỗi câu liên kết tới `FR-NN` / `REQ-ID` bị ảnh hưởng. Đây là bản dịch khách-facing
của các CLARIFICATION mức BLOCKER.]

### Câu 1 — <tiêu đề ngắn>

**Tình huống:** <mô tả bối cảnh nghiệp vụ bằng ngôn ngữ khách hiểu>

**Câu hỏi:** <câu hỏi cụ thể> · *Liên quan:* `FR-01` / `MODULE.AREA.NN`

| | Lựa chọn | Mô tả |
|---|---|---|
| ☐ | **A — <phương án>** ⭐ | <mô tả — đánh ⭐ vào mặc định> |
| ☐ | **B — <phương án>** | <mô tả> |

> ⚠️ Nếu chọn sai → <hệ quả, e.g. phải sửa lại database>. Cần chốt trước khi dev.
>
> **Khách trả lời:** ____________________________________________

### Câu 2 — <tiêu đề ngắn>

**Tình huống:** <mô tả>

**Câu hỏi:** <câu hỏi> · *Liên quan:* `FR-NN` / `MODULE.AREA.NN`

| | Lựa chọn | Mô tả |
|---|---|---|
| ☐ | **A — <phương án>** ⭐ | <mô tả> |
| ☐ | **B — <phương án>** | <mô tả> |

> **Khách trả lời:** ____________________________________________

---

## 🟡 CÂU HỎI IMPORTANT

### Câu 3 — <tiêu đề ngắn>

**Tình huống:** <mô tả>

**Câu hỏi:** <câu hỏi>

| | Lựa chọn | Mô tả |
|---|---|---|
| ☐ | **A — <phương án>** ⭐ | <mô tả> |
| ☐ | **B — <phương án>** | <mô tả> |

> **Khách trả lời:** ____________________________________________

### Câu 4 — Xác nhận danh sách tính năng giữ / lùi phase

[Nếu có tập tính năng cần khách chốt giữ hay lùi — kẻ bảng từng dòng. Mỗi dòng ↔ `FR-NN`.]

| | Tính năng | FR | Giữ phase này / Lùi |
|---|---|---|---|
| ☐ | <tính năng> | `FR-NN` | ✅ Giữ / ❌ Lùi |
| ☐ | <tính năng> | `FR-NN` | ✅ Giữ / ❌ Lùi |

---

## 🟢 CÂU HỎI NICE

### Câu 5 — <tiêu đề ngắn>

**Tình huống:** <mô tả — e.g. thứ tự ưu tiên phase 3>

> **Khách trả lời:** ____________________________________________

---

## Bảng tổng hợp

| Câu | Nội dung | Mức độ | FR / REQ liên quan | Cần trả lời trước |
|---|---|---|---|---|
| 1 | <tóm tắt> | 🔴 | `FR-01` | PB-G2 |
| 2 | <tóm tắt> | 🔴 | `FR-NN` | PB-G2 |
| 3 | <tóm tắt> | 🟡 | `FR-NN` | <mốc> |
| 4 | Giữ/lùi tính năng | 🟡 | nhiều FR | PB-G2 |
| 5 | <tóm tắt> | 🟢 | — | Khi nào tiện |

> Số câu 🔴 BLOCKER còn mở phải = **0** để đóng băng scope (`PB-G2`). Đối chiếu cột
> "Số câu hỏi BLOCKER còn mở" trong `docs/templates/locale-vi/feature-register.md § 3`.

---

> **Gửi file này lại cho team dev sau khi đánh dấu xong.**
> Câu chưa trả lời sẽ dùng phương án mặc định (⭐) để không chặn tiến độ — trừ BLOCKER
> vẫn cần xác nhận bằng văn bản.
>
> **Tham chiếu:** `docs/requirements/CLARIFICATIONS.md` (nguồn) · feature-register
> `docs/templates/locale-vi/feature-register.md` · token grammar `docs/TRACE_SPEC.md`.
