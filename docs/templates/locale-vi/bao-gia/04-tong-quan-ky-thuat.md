<!-- locale-vi fork — tổng quan kỹ thuật khách-facing (VISION_SCOPE rút gọn). Scaffold (placeholder + hướng dẫn trong ngoặc). -->
<!-- ID/path/token (REQ-ID = MODULE.AREA.NN, GAP-NNN) giữ nguyên tiếng Anh. SRS chi tiết là tài liệu EN nội bộ. -->

# TỔNG QUAN KỸ THUẬT — <tên dự án>

> **Nguồn:** `docs/requirements/VISION_SCOPE.md` + SRS nội bộ (`docs/requirements/srs/*`).
> **Ngày:** DD/MM/YYYY
>
> Đây là bản **tóm tắt khách-facing** của VISION_SCOPE. Tài liệu SRS chi tiết
> (IEEE-830, đủ `REQ-ID`, use-case) là **tài liệu kỹ thuật nội bộ tiếng Anh** cho team
> dev — không nằm trong bộ báo giá.

---

## 1. Bối cảnh

[Mô tả hệ thống hiện tại (As-Is) và lý do thay thế. Lấy từ gap-analysis § 2.]

<Khách hiện đang dùng hệ thống X / quy trình thủ công Y. Vấn đề: ...>

Dự án xây dựng <mô tả giải pháp To-Be>, phục vụ <các luồng người dùng>:

```
[Luồng 1]:
  <bước> → <bước> → <bước>

[Luồng 2]:
  <bước> → <bước> → <bước>
```

---

## 2. Công nghệ

[Bảng do Tech Lead chọn theo NFR (Build 2.2). Ở báo giá là dự kiến.]

| Tầng | Công nghệ |
|---|---|
| Backend | <...> |
| Frontend | <...> |
| Database | <...> |
| Cache / Queue | <...> |
| Hạ tầng | <...> |
| Email | <...> |
| Thanh toán | <...> |
| Xác thực | <...> |

---

## 3. Mục tiêu kinh doanh

[Lấy từ gap-analysis § 1 (To-Be). Mỗi mục tiêu trace về một nhóm `GAP-NNN`.]

| # | Mục tiêu | GAP nguồn |
|---|---|---|
| 1 | <mục tiêu> | GAP-001 |
| 2 | <mục tiêu> | GAP-0NN |

---

## 4. Hành trình người dùng chính

[Mỗi luồng dùng ASCII box để khách dễ hình dung. Đây là view khách-facing của use-cases.]

### 4.1 <tên hành trình>

```
┌─────────────────────────────────────────────────────────────┐
│                      <TÊN HÀNH TRÌNH>                        │
├─────────────────────────────────────────────────────────────┤
│  ① <bước>  ──→  ② <bước>  ──→  ③ <bước>  ──→  ④ <bước>    │
│  ⑤ <bước>  ──→  ⑥ <bước>  ──→  ⑦ <bước>  ──→  ⑧ <bước>    │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Các bên liên quan (Actors)

[Bảng vai trò — đối chiếu role-permission-matrix. Dùng nhãn nghiệp vụ tiếng Việt.]

| Vai trò | Tiếng Việt | Mô tả |
|---|---|---|
| Admin | Quản trị viên | Toàn quyền hệ thống |
| <role> | <vi> | <mô tả một dòng> |

---

## 6. Tính năng theo Phase

[Bảng tóm tắt — đối chiếu feature-register. Tổng = số `FR-NN` in-scope.]

### Phase 1 — <tên> (<NN> tính năng · Hoàn thành: DD/MM/YYYY)

| Nhóm | Tính năng chính |
|---|---|
| <module> | <tính năng> |

### Phase 2 — <tên> (Hoàn thành: DD/MM/YYYY)

| Nhóm | Tính năng chính |
|---|---|
| <module> | <tính năng> |

> **Đã lùi phase sau theo feedback khách hàng:** <liệt kê tính năng defer>.

---

## 7. Yêu cầu phi chức năng (NFR)

[Lấy từ SRS NFR. NFR viết ra sẽ được *test* ở Build 2.11 (cổng load/NFR có điều kiện).]

| Hạng mục | Yêu cầu |
|---|---|
| Phân quyền | RBAC tại tầng API + UI cho tất cả <NN> vai trò |
| Hiệu năng | <e.g. API < 500ms p95; ~2000 active đồng thời> |
| Bảo mật | <e.g. HTTPS toàn hệ thống; JWT; chống SQL injection; rate limiting> |
| Nhật ký | <các mutation cần audit log> |
| Backup | <chu kỳ + retention + RTO> |
| Giao diện | <responsive, data grid tốc độ cao...> |

---

## 8. Rủi ro chính

[Lấy từ gap-analysis § Rủi ro + intake brief § 14. Đánh dấu cổng enterprise có điều kiện.]

| Rủi ro | Mức độ | Giải pháp |
|---|---|---|
| <rủi ro> | CAO/TB | <giải pháp> |
| Migration dữ liệu (nếu brownfield) | <CAO / N/A> | <cần access trước ngày...; hoặc N/A greenfield> |
| Scope creep vào phase chính | TB | Danh sách defer rõ; thay đổi scope cần văn bản (`CR-NN`) |

---

> Tài liệu này là bản tóm tắt kỹ thuật dành cho khách hàng.
> SRS chi tiết (đủ `REQ-ID`, use-case) lưu nội bộ cho team dev (tiếng Anh).
>
> **Tham chiếu:** gap-analysis `docs/templates/locale-vi/gap-analysis.md` ·
> feature-register `docs/templates/locale-vi/feature-register.md` · token grammar
> `docs/process/TRACE_SPEC.md`.
