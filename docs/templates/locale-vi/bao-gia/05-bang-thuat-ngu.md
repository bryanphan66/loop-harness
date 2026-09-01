<!-- locale-vi fork — bảng thuật ngữ song ngữ khách-facing. Scaffold (placeholder + hướng dẫn trong ngoặc). -->
<!-- ID/path/token + token grammar của harness giữ nguyên tiếng Anh. -->

# BẢNG THUẬT NGỮ — <tên dự án>

> Giải thích thuật ngữ dùng trong báo giá và tài liệu dự án. Đối chiếu
> `docs/requirements/GLOSSARY.md` (bản song ngữ nội bộ — nguồn chuẩn). Bảng này là
> view khách-facing.

---

## 1. Vai trò trong hệ thống

[Đối chiếu role-permission-matrix + tổng-quan-kỹ-thuật § 5.]

| Thuật ngữ | Tiếng Việt | Giải thích |
|---|---|---|
| Admin | Quản trị viên | Toàn quyền: cấu hình hệ thống, phân quyền, quản lý mọi module |
| <role> | <vi> | <mô tả một dòng> |

---

## 2. Thuật ngữ nghiệp vụ

[Thuật ngữ domain-specific của dự án. Mỗi mục giải thích bằng ngôn ngữ khách hiểu.]

| Thuật ngữ | Giải thích |
|---|---|
| **<term>** | <giải thích> |
| **UAT** | User Acceptance Testing — kiểm thử nghiệm thu do khách hàng thực hiện |

---

## 3. Thuật ngữ kỹ thuật

[Thuật ngữ kỹ thuật xuất hiện trong báo giá — giải thích cho khách không chuyên.]

| Thuật ngữ | Giải thích |
|---|---|
| **RBAC** | Role-Based Access Control — phân quyền theo vai trò |
| **API** | Application Programming Interface — giao diện để phần mềm giao tiếp |
| **CI/CD** | Continuous Integration / Continuous Deployment — tự động kiểm tra và triển khai code |
| **SSL** | Chứng chỉ bảo mật — mã hóa dữ liệu giữa trình duyệt và server (https://) |
| **VPS** | Virtual Private Server — máy chủ ảo riêng |
| **<term>** | <giải thích> |

---

## 4. Trạng thái

[Đối chiếu status-flow của mỗi entity. Mỗi bảng là một entity có trạng thái.]

### Trạng thái <entity 1> (e.g. Lead / Pipeline)

| Trạng thái | Tiếng Việt | Mô tả |
|---|---|---|
| <state> | <vi> | <mô tả> |

### Trạng thái <entity 2> (e.g. Đơn hàng)

| Trạng thái | Tiếng Việt | Mô tả |
|---|---|---|
| <state> | <vi> | <mô tả> |

---

## 5. Viết tắt

| Viết tắt | Đầy đủ |
|---|---|
| CRM | Customer Relationship Management — Quản lý quan hệ khách hàng |
| SRS | Software Requirements Specification — Tài liệu đặc tả yêu cầu phần mềm |
| SEO | Search Engine Optimization — Tối ưu hóa công cụ tìm kiếm |
| KPI | Key Performance Indicator — Chỉ số đo lường hiệu suất |
| P1/P2/P3 | Priority 1/2/3 — Mức ưu tiên xử lý lỗi (P1 nghiêm trọng nhất) |
| SLA | Service Level Agreement — Cam kết thời gian phản hồi/xử lý lỗi |
| <abbr> | <đầy đủ> |

---

## 6. Token truy vết của harness (cho khách tham khảo)

[Khách có thể bắt gặp các token này trong release-note / nghiệm thu. Giải thích ngắn.
Giữ token tiếng Anh — đây là ngữ pháp truy vết của dự án.]

| Token | Ý nghĩa với khách |
|---|---|
| `GAP-NNN` | Một khoảng cách nghiệp vụ được phát hiện ở phân tích (e.g. `GAP-001`) |
| `REQ-ID` (`MODULE.AREA.NN`) | Một yêu cầu phần mềm cụ thể (e.g. `ORD.STATUS.01`) |
| `FR-NN` | Một dòng trong sổ đăng ký tính năng (scope đã đóng băng) |
| `TC-NNN` | Một test case nghiệm thu (e.g. `TC-001`) |
| `CR-NN` | Một yêu cầu phát sinh sau ký hợp đồng (e.g. `CR-01`) |

> Chuỗi truy vết: vấn đề kinh doanh → `GAP-NNN` → `REQ-ID` → `FR-NN` → dòng báo giá →
> `TC-NNN` (nghiệm thu) → release → bàn giao.

---

> Bảng thuật ngữ này giúp các bên hiểu chung một ngôn ngữ trong suốt dự án.
> Nguồn chuẩn (song ngữ): `docs/requirements/GLOSSARY.md`. Token grammar đầy đủ:
> `docs/TRACE_SPEC.md`.
