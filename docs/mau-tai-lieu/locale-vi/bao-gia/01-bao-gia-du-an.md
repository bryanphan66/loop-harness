<!-- locale-vi fork — báo giá chính khách-facing. Scaffold (placeholder + hướng dẫn trong ngoặc). -->
<!-- ID/path/token (REQ-ID = MODULE.AREA.NN, FR-NN, PB-G4) giữ nguyên tiếng Anh. -->

# BÁO GIÁ DỰ ÁN — <tên dự án>

> **Ngày lập:** DD/MM/YYYY
> **Phiên bản:** v0.1
> **Hiệu lực báo giá:** 30 ngày kể từ ngày lập
> **Đơn vị phát triển:** <tên / freelancer>
> **Khách hàng:** <tên pháp lý khách hàng>

> **Bước 1.14 — Pre-Build Block D.** Mỗi dòng giá ở § 4 ↔ một dòng feature-register
> (`FR-NN`) đã đóng băng PB-G2. Báo giá neo vào prototype đã đóng băng PB-G3 (link § 1).

---

## 1. Tổng quan dự án

[Một đoạn: xây cái gì, thay thế hệ thống nào, phục vụ luồng người dùng nào. Vẽ luồng
chính bằng ASCII nếu giúp khách hình dung.]

```
[Luồng 1 — VD học viên tự mua online]:
  Xem sản phẩm → Thanh toán → Tự động mở quyền → Sử dụng → Hoàn tất

[Luồng 2 — VD đội vận hành]:
  Lead → Tư vấn → Đơn hàng → Vận hành → Báo cáo
```

### Prototype trực tuyến (đã đóng băng PB-G3)

Xem trước giao diện và luồng thao tác tại: <URL prototype>

### Công nghệ sử dụng

[Bảng do Tech Lead chọn theo NFR ở Build 2.2 — ở báo giá là dự kiến để khách hình dung.]

| Tầng | Công nghệ |
|---|---|
| Backend | <e.g. NestJS / FastAPI / Django> |
| Frontend | <e.g. Next.js (App Router, Tailwind)> |
| Database | <e.g. PostgreSQL + Redis> |
| Hạ tầng | <e.g. Docker Compose, VPS, Nginx, SSL> |
| Email | <e.g. Amazon SES> |
| Thanh toán | <e.g. SePay (QR, auto-confirm)> |
| Xác thực | <e.g. JWT + Refresh Token + Google OAuth> |

---

## 2. Phạm vi công việc

[Nhóm theo module / phase. Mỗi nhóm tính năng map về các `FR-NN` in-scope trong
feature-register. Tổng số tính năng = số dòng FR ✅.]

### Phase 1 — <tên phase>

**Mục tiêu:** <một dòng>
**Hoàn thành dự kiến:** DD/MM/YYYY
**Tổng features:** <NN>

| # | Module | Nội dung chính | FR / REQ-ID |
|---|---|---|---|
| 1 | <module> | <nội dung> | `FR-01` / `MODULE.AREA.NN` |
| 2 | <module> | <nội dung> | `FR-02` / `MODULE.AREA.NN` |

### Phase 1.5 — Migration dữ liệu (nếu brownfield — nếu không: N/A bằng quyết định)

[Chỉ điền nếu thay hệ cũ. Đây là cổng enterprise có điều kiện (Build 2.1b). Ghi rõ
điều kiện tiên quyết: cần access DB cũ trước ngày nào.]

| # | Task | Nội dung |
|---|---|---|
| 1 | Phân tích DB cũ | <schema + migration map> |
| 2 | Migrate <entity> | <metadata + files> |

### Phase 2 — <tên phase>

**Mục tiêu:** <một dòng>
**Hoàn thành dự kiến:** DD/MM/YYYY

| # | Module | Nội dung chính | FR / REQ-ID |
|---|---|---|---|
| 1 | <module> | <nội dung> | `FR-NN` |

### Phase 3 — Nâng cao / Tùy chọn (báo giá riêng)

[Tính năng đã defer ra khỏi scope đã ký. Báo giá riêng sau khi phase chính go-live.]

| Thứ tự | Nhóm | Nội dung | Lý do |
|---|---|---|---|
| 1 | <nhóm> | <nội dung> | <lý do ưu tiên> |

---

## 3. Tổng hợp phạm vi theo giai đoạn

| Giai đoạn | Nội dung | Hoàn thành (dự kiến) |
|---|---|---|
| Phase 1 | <NN tính năng> | DD/MM/YYYY |
| Phase 1.5 — Migration | <nếu có; nếu không: N/A> | DD/MM/YYYY |
| Phase 2 | <nội dung> | DD/MM/YYYY |

> Phạm vi đã bao gồm BA / QC / Testing / Deploy cho các giai đoạn trên.

---

## 4. Chi phí dự án

[Giá trọn gói HOẶC bảng dòng-theo-dòng. Mỗi dòng ↔ một nhóm `FR-NN`. Ghi rõ thuế/phí.]

| Hạng mục | Giá trị (VNĐ) |
|---|---|
| **Tổng giá trị hợp đồng (trọn gói)** | **<số tiền>** |

> **Ghi chú:**
> - Giá trọn gói cho toàn bộ phạm vi đã liệt kê § 2 (đã bao gồm BA/QC/Testing/Deploy).
> - [Ghi rõ: đã/chưa bao gồm VAT, phí xuất hóa đơn đỏ, thuế TNCN.]
> - Chưa bao gồm chi phí hạ tầng vận hành hàng tháng (§ 5).

---

## 5. Chi phí hạ tầng vận hành hàng tháng (sau go-live)

[Khách trả trực tiếp NCC. Liệt kê từng dịch vụ.]

| # | Dịch vụ | Chi phí/tháng | Ghi chú |
|---|---|---|---|
| 1 | VPS Hosting | <số tiền> | <cấu hình + capacity> |
| 2 | Email (SES...) | <số tiền> | <volume> |
| 3 | Thanh toán (SePay...) | <số tiền> | <gói> |
| 4 | Backup | <số tiền> | <dung lượng> |
| 5 | Domain + DNS + SSL | <số tiền> | <số domain> |
| | **TỔNG VẬN HÀNH / THÁNG** | **<số tiền>** | <quy đổi USD nếu cần> |

> Chi phí hạ tầng do **khách hàng thanh toán trực tiếp** cho nhà cung cấp.

---

## 6. Timeline dự kiến

```
   Tháng N            Tháng N+1          Tháng N+2
   ├── Phase 1 ───────────────┤ Go-live DD/MM
   ├── Phase 1.5 (song song) ─┤
                      ├── Phase 2 ──────┤ Go-live DD/MM
```

| Mốc | Ngày dự kiến | Điều kiện |
|---|---|---|
| Kick-off | DD/MM/YYYY | Ký hợp đồng + đặt cọc (`PB-G4`) |
| <điều kiện tiên quyết> | Trước DD/MM/YYYY | <e.g. khách cấp access DB cũ> |
| Phase 1 Go-live | DD/MM/YYYY | UAT passed + nghiệm thu (ACCEPTANCE) |
| Phase 2 Go-live | DD/MM/YYYY | UAT passed + nghiệm thu (ACCEPTANCE) |

> **Nếu schedule là DRIVER** (deadline cứng): scope vượt timeline → lùi tính năng sang
> phase sau thay vì kéo dài deadline. [Xóa dòng này nếu timeline mềm.]

---

## 7. Điều khoản thanh toán

| Đợt | Thời điểm | Tỷ lệ | Số tiền (VNĐ) | Điều kiện |
|---|---|---|---|---|
| 1 | Ký hợp đồng | NN% | <số tiền> | Đặt cọc để bắt đầu (`PB-G4`) |
| 2 | Nghiệm thu Phase 1 | NN% | <số tiền> | UAT Phase 1 passed (ACCEPTANCE) |
| 3 | Nghiệm thu Phase 2 | NN% | <số tiền> | UAT Phase 2 passed (ACCEPTANCE) |
| 4 | Kết thúc bảo hành | NN% | <số tiền> | Hoàn tất bảo hành, bàn giao (HANDOVER) |

> Chi tiết điều khoản thanh toán ghi trong hợp đồng chính thức.

---

## 8. Lưu ý quan trọng trước Kick-off

[Điều kiện tiên quyết khách cần chuẩn bị. Mỗi mục có thời hạn.]

| # | Hạng mục | Thời hạn |
|---|---|---|
| 1 | <e.g. Verify domain email gửi + thoát sandbox> | Trước kick-off |
| 2 | <e.g. Tài khoản cổng thanh toán đã kích hoạt webhook> | Trước kick-off |
| 3 | <e.g. Access DB hệ cũ (nếu migration)> | Trước DD/MM/YYYY |
| 4 | <e.g. Phê duyệt nghiệm thu mỗi Phase trước khi chuyển phase> | Mỗi Phase |

---

## 9. Điều khoản bảo hành

> Chi tiết đầy đủ: **`02-dieu-khoan-bao-hanh.md`** (đính kèm).

**Tóm tắt:**
- **Bảo hành miễn phí:** <NN> tháng sau mỗi Phase go-live
- **Phạm vi:** Sửa lỗi phần mềm phát sinh từ code đã bàn giao
- **Không bao gồm:** Thay đổi yêu cầu, thêm tính năng, lỗi do khách tự chỉnh sửa
- **Gói hỗ trợ sau bảo hành:** Có các gói tháng/năm tùy chọn (xem maintenance proposal)

---

## 10. Tài liệu đính kèm

| # | Tài liệu | Mô tả |
|---|---|---|
| 1 | `02-dieu-khoan-bao-hanh.md` | Điều khoản bảo hành & gói hỗ trợ chi tiết |
| 2 | `03-cau-hoi-xac-nhan.md` | Câu hỏi BLOCKER cần xác nhận trước PB-G2 |
| 3 | `04-tong-quan-ky-thuat.md` | Tổng quan kỹ thuật (VISION_SCOPE) |
| 4 | `05-bang-thuat-ngu.md` | Bảng thuật ngữ (actors, roles, trạng thái) |

---

> **Báo giá này có hiệu lực 30 ngày kể từ ngày lập.**
> Mọi thay đổi về phạm vi sau khi ký (`PB-G4`) sẽ được đánh giá tác động và báo giá
> bổ sung riêng qua quy trình change request (`CR-NN`).
>
> **Tham chiếu:** scope đóng băng `docs/mau-tai-lieu/locale-vi/feature-register.md` ·
> SOW `docs/mau-tai-lieu/locale-vi/proposal-sow.md` · token grammar `docs/about/TRACE_SPEC.md`.
