<!-- Bản dịch khách-facing của ../feature-register.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (GAP-NNN, REQ-ID = MODULE.AREA.NN, SC-NNN, PB-G2, CR-NN) giữ nguyên tiếng Anh. -->

# Sổ đăng ký tính năng & Ma trận scope (Feature Register) — <tên dự án>

Ngày: YYYY-MM-DD · Trạng thái: nháp | khách review | **đã đóng băng (PB-G2)** · Lượt: 1

> **Bước 1.9 — Macro-Stage Pre-Build, Block B (BA Core Docs), cuối spine.** Đây là
> **artifact của cổng `PB-G2` (CLIENT — scope frozen)**: cổng khách đầu tiên page
> người ra quyết định. Đóng băng = (a) mọi câu hỏi **BLOCKER** đã trả lời (1.6,
> `docs/requirements/CLARIFICATIONS.md`) + (b) feature-register này đã chốt.
>
> Mỗi dòng tính năng phải trace ngược về ≥1 `REQ-ID` và ≥1 use case (**RTM backward
> completeness**), và REQ trace về ≥1 `GAP-NNN` (hoặc ghi "no-gap — tính năng mới").
> Tính năng rủi ro cao có ≥1 `SC-NNN` (1.8) hoặc skip-declaration. Mỗi dòng in-scope
> sau đó neo một dòng giá trong bao-gia (1.14).
>
> Sống tại `docs/scope-baseline/feature-register.{md,xlsx}`. **Engine:**
> `ck-scope-package` (feature register + scope baseline; prototype 1.12 dựng bằng
> design tool ngoài — Claude Design / Open Design / Google Stitch / Pencil.dev,
> không generate trong Claude Code). Sau khi đóng băng, thay đổi đi qua `CR-NN` —
> không sửa tại chỗ.

## 1. Tóm tắt scope

| Hạng mục | Giá trị |
| --- | --- |
| Tổng tính năng in-scope | <NN> |
| Tổng tính năng out-of-scope (phase sau) | <NN> |
| Số câu hỏi BLOCKER còn mở | <NN> — phải = 0 để đóng băng PB-G2 |
| Phân kỳ (nếu có) | Phase 1 / Phase 2 / ... |

## 2. Ma trận scope (Scope Confirmation Matrix)

Bảng chính khách ký. Một dòng cho mỗi tính năng nghiệp vụ. Cột **Trong scope?** là
cột quyết định — khách đánh dấu rõ từng dòng.

Cột:
- **FR ID** — số dòng feature-register (đếm local: `FR-01`, `FR-02`...). Chỉ tham chiếu nội bộ.
- **Ưu tiên** — MoSCoW kế thừa từ gap analysis (1.4).
- **REQ-ID** — ≥1 requirement từ SRS (1.5).
- **GAP** — gap nguồn (hoặc "mới" nếu không từ gap).
- **SC** — scenario nếu rủi ro cao (1.8), hoặc "—".
- **Trong scope?** — ✅ giữ / ❌ phase sau / ⏳ chờ xác nhận (BLOCKER).

| FR ID | Tính năng (nghiệp vụ) | Module | Ưu tiên | REQ-ID | GAP | SC | Trong scope? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-01 | Trang "Trạng thái đơn" cho khách | Order | Must | `ORD.STATUS.01` | GAP-001 | SC-003 | ✅ |
| FR-02 | Push notification đơn mới cho staff | Order | Should | `ORD.NOTIF.01` | GAP-002 | — | ✅ |
| FR-03 | Bước validation order-intake | Order | Must | `ORD.INTAKE.01` | GAP-010 | SC-005 | ✅ |
| FR-04 | Đồng bộ tồn kho (read-only) | Inventory | Should | `INV.SYNC.01` | GAP-020 | — | ✅ (phase 1 read-only) |
| FR-05 | Đồng bộ tồn kho (write) | Inventory | Could | `INV.SYNC.02` | GAP-020 | — | ❌ (phase 2) |
| FR-06 | NPS survey sau fulfillment | Feedback | Could | `FB.NPS.01` | GAP-030 | — | ❌ (phase 2) |
| FR-07 | Consent capture email marketing | Marketing | Must | `MKT.CONSENT.01` | GAP-050 | SC-009 | ⏳ chờ BLOCKER Q2 |

## 3. Câu hỏi BLOCKER còn mở

Đồng bộ với `docs/requirements/CLARIFICATIONS.md` (1.6). **Mọi dòng ở đây phải đóng
(trả lời) trước khi đóng băng PB-G2.** Câu hỏi IMPORTANT/NICE không chặn cổng.

| # | Câu hỏi (BLOCKER) | Liên quan FR | Phương án mặc định (⭐) | Khách trả lời |
| --- | --- | --- | --- | --- |
| Q1 | Refund: chỉ Admin hay thêm role Kế toán? | FR-03 | A — chỉ Admin/Leader ⭐ | <điền> |
| Q2 | Consent retention: giữ dữ liệu bao lâu? | FR-07 | 24 tháng ⭐ | <điền> |

> Mẹo: nếu khách chưa chắc, ghi phương án mặc định (⭐) để không chặn tiến độ — nhưng
> BLOCKER mặc định vẫn cần khách xác nhận bằng văn bản trước PB-G2.

## 4. Out-of-scope (đẩy phase sau / từ chối)

Mỗi dòng trích lý do và định hướng. Đây là § 5 của SOW (KHÔNG bao gồm) ở dạng chi tiết.

| FR ID | Tính năng | Tại sao out | Định hướng |
| --- | --- | --- | --- |
| FR-05 | Đồng bộ tồn kho (write) | Phụ thuộc inventory API ổn định | Phase 2 |
| FR-06 | NPS survey | Vượt ngân sách phase 1 | Phase 2 |

## 5. Giả định scope

Điều kiện feature-register này giả định đúng. Nếu sai → có thể là CR.

- <e.g. khách cấp access DB hệ cũ trước ngày X để migrate>
- <e.g. mỗi tính năng dùng component có sẵn trong design system, không custom widget>

## 6. Cổng enterprise có điều kiện (đánh dấu N/A bằng quyết định)

Các cổng enterprise sống chủ yếu ở Build & Go-live. Ghi rõ tại đây cổng nào áp
dụng cho dự án này, cổng nào **N/A bằng quyết định** — không bỏ lửng im lặng.

| Cổng | Áp dụng? | Quyết định / ghi chú |
| --- | --- | --- |
| Data migration / cutover (brownfield) | có / **N/A** | <greenfield → N/A; hoặc: cần migrate từ hệ cũ X> |
| NFR / load test (k6 p95 + Lighthouse) | có / **N/A** | <ngưỡng p95 = ...; hoặc N/A vì traffic thấp> |
| DR + RTO/RPO (restore-drill) | có / **N/A** | <RTO = ..., RPO = ...; hoặc N/A> |
| Compliance / Privacy / WCAG | có / **N/A** | <in-scope chuẩn nào; hoặc N/A> |
| Observability / SLO | có / **N/A** | <thường always-on; hoặc N/A> |

## 7. Kiểm tra RTM completeness (chạy trước khi đóng băng PB-G2)

- [ ] Mọi dòng FR in-scope (✅) có ≥1 `REQ-ID`.
- [ ] Mọi `REQ-ID` trace về ≥1 `GAP-NNN` hoặc ghi "no-gap — tính năng mới".
- [ ] Mọi dòng FR có ≥1 use case (đối chiếu `docs/requirements/use-cases/USE_CASES.md`).
- [ ] Mọi FR rủi ro cao có ≥1 `SC-NNN` hoặc skip-declaration.
- [ ] Số câu hỏi BLOCKER còn mở (§ 3) = 0.
- [ ] Mọi cổng enterprise có điều kiện (§ 6) được đánh dấu áp dụng HOẶC N/A — không bỏ trống.
- [ ] Mỗi dòng in-scope sẽ neo được một dòng giá trong bao-gia (1.14).

Một dòng FR không có `REQ-ID`, hoặc một BLOCKER còn mở, là **RTM chưa hoàn chỉnh** —
verify-gate chặn stage-close commit đến khi giải quyết.

## 8. Ký đóng băng (PB-G2 — CLIENT)

Chữ ký dưới đây = scope đã đóng băng. Sau cổng này, mọi thay đổi scope đi qua `CR-NN`.

| Mốc | Ngày | Người duyệt | Ghi chú |
| --- | --- | --- | --- |
| Vendor draft xong | YYYY-MM-DD | <vendor> | Lượt 1 |
| Khách review | YYYY-MM-DD | <tên khách> | Lượt 1 |
| **Đóng băng (PB-G2)** | YYYY-MM-DD | <vendor + khách ký> | Scope frozen — BLOCKER = 0 |

## 9. Lịch sử thay đổi (sau đóng băng)

Chỉ thêm. Mọi thay đổi sau PB-G2 phải qua `CR-NN`.

| Ngày | Thay đổi | Lý do | CR ID |
| --- | --- | --- | --- |
| YYYY-MM-DD | Thêm FR-08 ... | Khách yêu cầu sau ký | CR-01 |

---

**Tham chiếu**

- Bản gốc tiếng Anh (chuẩn): `docs/mau-tai-lieu/feature-register.md`.
- Nguồn gap (GAP-NNN): `docs/mau-tai-lieu/locale-vi/gap-analysis.md` (1.4).
- Nguồn REQ-ID: `docs/requirements/srs/<module>.md` (1.5, engine `ck-xre EXTRACT`).
- Use-case + RTM: `docs/requirements/use-cases/USE_CASES.md` + `docs/requirements/traceability/RTM.md` (1.7).
- Scenario (SC-NNN): `docs/requirements/scenarios/*.md` (1.8, engine `ck-scenario`).
- Clarifications (BLOCKER): `docs/requirements/CLARIFICATIONS.md` (1.6).
- Forward: báo giá (1.14) `docs/mau-tai-lieu/locale-vi/bao-gia/` + SOW `docs/mau-tai-lieu/locale-vi/proposal-sow.md`.
- Change requests sau đóng băng: `docs/mau-tai-lieu/locale-vi/change-request-log.md`.
- Token grammar + RTM completeness rule: `docs/process/TRACE_SPEC.md`. Cổng: `docs/process/WORKFLOW.md`.
