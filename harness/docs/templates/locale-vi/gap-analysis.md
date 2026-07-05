<!-- Bản dịch khách-facing của ../gap-analysis.md (bản gốc EN là chuẩn). Đồng bộ lại sau mỗi lần cập nhật bản gốc. -->
<!-- locale-vi fork — chỉ dịch bề mặt khách hàng. ID/path/token (GAP-NNN, REQ-ID = MODULE.AREA.NN, PB-G2) giữ nguyên tiếng Anh. -->

# Phân tích khoảng cách (Gap Analysis) — <tên dự án>

Ngày: YYYY-MM-DD · Trạng thái: nháp | khách đã review | đã đóng băng · Lượt: 1

> **Bước 1.4 — Macro-Stage Pre-Build, Block B (BA Core Docs).** Brief do vendor
> sản xuất, so sánh trạng thái hiện tại (As-Is) của khách với trạng thái tương lai
> mong muốn (To-Be) và cấu trúc các khoảng cách + giải pháp.
>
> **File này đúc `GAP-NNN`** — mắt xích đầu của chuỗi truy vết:
> `business problem → GAP-NNN → REQ-ID → use-case + RTM → SC-NNN → feature-register → bao-gia`.
> Mỗi `GAP-NNN` sẽ trở thành ≥1 requirement (`REQ-ID = MODULE.AREA.NN`) ở SRS (1.5).
>
> Sống tại `docs/requirements/gap-analysis.md`. Đóng băng (review tối đa 2 lượt)
> trước khi feature-register chốt ở cổng `PB-G2`. **Engine:** `researcher` +
> gap-analysis-playbook; nguồn REQ list từ discovery (1.3, engine `ck-rri`).

## 1. To-Be (Trạng thái tương lai)

Khách muốn thế giới trông như thế nào sau khi dự án ship.

### Mục tiêu kinh doanh

- Mục tiêu 1 (một dòng, đo lường được nếu có thể).
- Mục tiêu 2.

### Tiêu chí thành công

Khách biết "đã đạt" bằng cách nào.

| Chỉ số | Hôm nay (baseline) | Mục tiêu | Đo lúc |
| --- | --- | --- | --- |
| <e.g. thời gian xử lý đơn> | <e.g. TB 24h> | <e.g. < 4h TB> | <e.g. 30 ngày sau launch> |

### Người dùng mục tiêu × hành động mục tiêu

| Vai trò | Sẽ làm được gì (To-Be) |
| --- | --- |
| Customer | Tự kiểm tra trạng thái đơn hàng 24/7 trên app |
| Staff | Nhận thông báo đơn hàng + cập nhật trạng thái từ dashboard |

### Ràng buộc

- Deadline: <ngày>
- Khoảng ngân sách: <range>
- Quy định pháp lý: <e.g. PCI-DSS, GDPR, không> — đối chiếu câu hỏi tuân thủ ở intake brief § 10
- Hệ thống đang chạy phải giữ: <list>

## 2. As-Is (Trạng thái hiện tại)

Khách đang làm gì hôm nay. Capture từ discovery interview, source docs, và
`docs/discovery/` raw inputs.

### Bản đồ quy trình hiện tại

Các bước đánh số, ai làm gì, đâu là điểm đau. Sơ đồ chính thức (Mermaid) xuất hiện
ở Design Prototype (1.11) tại `docs/visuals/diagrams/business-workflow-as-is.md`.
Ở brief này, văn bản là đủ.

1. <Actor X> làm <hành động> qua <kênh> → kết quả.
2. <Actor Y> làm <hành động> → bàn giao cho <Actor Z>.
3. ...

### Hệ thống hiện tại

| Hệ thống | Mục đích | Sở hữu bởi | Tích hợp với | Điểm đau |
| --- | --- | --- | --- | --- |
| <e.g. Excel sổ đơn hàng> | Theo dõi đơn hàng thủ công | Nhân viên sale | Không có — nhập thủ công | Trùng entry, mất đơn |

### Điểm đau (nguyên văn nếu có thể)

Trích nguồn: `docs/discovery/2026-05-17-kickoff-notes.md § 4`.

- Đau 1: <một dòng>. Trích: <nguồn>.
- Đau 2: <một dòng>. Trích: <nguồn>.

### Workaround user tự nghĩ ra

- <e.g. khách gọi tổng đài nhiều lần để check trạng thái vì không có trang tracking>.

### Stakeholder trong As-Is

| Vai trò | Trách nhiệm hiện tại | Bị ảnh hưởng bởi thay đổi? |
| --- | --- | --- |
| CSKH | Xử lý cuộc gọi check trạng thái | có — workload giảm khi tự phục vụ |
| Nhân viên sale | Nhập đơn thủ công vào Excel | có — thay bằng capture tự động |

## 3. Khoảng cách (The Gap)

Phân loại. Mỗi hàng có token `GAP-NNN` (đếm toàn cục, zero-pad: `GAP-001`). Token
trace tiếp tới `REQ-ID` khi viết SRS (1.5).

### Khoảng cách chức năng (thiếu tính năng)

| GAP ID | Mô tả | Mức độ | As-Is touch | To-Be touch |
| --- | --- | --- | --- | --- |
| GAP-001 | Không có giao diện cho khách check trạng thái đơn | Cao | Khách gọi tổng đài | Khách mở app, xem trạng thái |
| GAP-002 | Không có realtime notification cho staff khi có đơn mới | Trung bình | Staff poll email | Push notification trên điện thoại |

### Khoảng cách quy trình (workflow thiếu hoặc hỏng)

| GAP ID | Mô tả | Mức độ | Liên kết Plan-of-action |
| --- | --- | --- | --- |
| GAP-010 | Order intake không có bước validation trước khi chuyển kho | Cao | Thêm bước validation + UI gate |

### Khoảng cách công nghệ (hệ thống không tích hợp)

| GAP ID | Mô tả | Mức độ | Liên kết Plan-of-action |
| --- | --- | --- | --- |
| GAP-020 | Excel sổ đơn hàng không kết nối với hệ thống tồn kho | Cao | Thay Excel + tích hợp với inventory API mới |

### Khoảng cách dữ liệu (dữ liệu không được capture / không truy cập được)

| GAP ID | Mô tả | Mức độ | Liên kết Plan-of-action |
| --- | --- | --- | --- |
| GAP-030 | Customer satisfaction không được track ở đâu | Trung bình | Thêm NPS survey sau fulfillment |

### Khoảng cách vai trò / kỹ năng (người không có quyền hoặc training)

| GAP ID | Mô tả | Mức độ | Liên kết Plan-of-action |
| --- | --- | --- | --- |
| GAP-040 | Staff không có admin account trên tool hiện tại — chỉ chủ có | Thấp | Thêm staff role + buổi training khi handover |

### Khoảng cách tuân thủ (quy định chưa đáp ứng)

| GAP ID | Mô tả | Mức độ | Liên kết Plan-of-action |
| --- | --- | --- | --- |
| GAP-050 | Không có consent capture cho email marketing | Cao (pháp lý) | Thêm consent checkbox + retention policy |

Thang mức độ: **Cao** = chặn To-Be / rủi ro pháp lý. **Trung bình** = chặn mục tiêu
nhưng có workaround. **Thấp** = nên có.

## 4. Plan of Action (Kế hoạch hành động)

Mỗi gap có một hàng giải pháp. Ưu tiên MoSCoW trực tiếp dẫn quyết định in-scope của
feature-register (1.9). Cột **REQ-ID dự kiến** là REQ sẽ đúc ở SRS (1.5) — dùng
grammar `MODULE.AREA.NN` (module + sub-area + 2 chữ số đếm local).

| GAP ID | Hình thức giải pháp | Chủ trách nhiệm | Effort | Ưu tiên (MoSCoW) | REQ-ID dự kiến | Trong scope? |
| --- | --- | --- | --- | --- | --- | --- |
| GAP-001 | Build trang "Trạng thái đơn" + status API | Vendor | L (16-40h) | **Must** | `ORD.STATUS.01` | có |
| GAP-002 | Push notification cho điện thoại staff qua FCM | Vendor | M (4-16h) | **Should** | `ORD.NOTIF.01` | có |
| GAP-010 | Thêm bước validation trong workflow order-intake | Vendor | M | **Must** | `ORD.INTAKE.01` | có |
| GAP-020 | Inventory API mới + migrate dữ liệu Excel | Vendor | XL (> 40h) | **Should** | `INV.SYNC.01` | một phần — phase 1 read-only, phase 2 write |
| GAP-030 | NPS survey sau fulfillment | Vendor | S (1-4h) | **Could** | `FB.NPS.01` | không — phase 2 |
| GAP-040 | Staff role + buổi training | Cả hai | S | **Must** | `IF.RBAC.02` | có (trong scope handover) |
| GAP-050 | Consent capture + retention policy doc | Vendor | M | **Must** | `MKT.CONSENT.01` | có |

Chú giải MoSCoW:

- **Must** — chặn tầm nhìn To-Be HOẶC quy định pháp lý. Bắt buộc trong feature-register in-scope.
- **Should** — giá trị đáng kể nhưng không chặn. In-scope nếu ngân sách cho phép.
- **Could** — nên có. Mặc định out-of-scope (phase 2).
- **Won't** — rõ ràng ngoài dự án này. Document lý do ở `docs/decisions/<slug>.md`.

## Out-of-Scope từ brief này

Gap khách nhắc nhưng team chọn không xử lý bây giờ. Mỗi gap trích lý do và sẽ đi đâu.

| GAP ID | Mô tả | Tại sao out | Định hướng |
| --- | --- | --- | --- |
| GAP-099 | UI đa ngôn ngữ (5 thứ tiếng) | Vượt ngân sách phase 1 | Phase 2 (sau launch) |

## Rủi ro phát hiện

Rủi ro gap analysis bóc tách (khác với gap — là điều kiện có thể derail việc đóng gap).

| Rủi ro | Khả năng | Ảnh hưởng | Biện pháp giảm thiểu |
| --- | --- | --- | --- |
| Chất lượng dữ liệu Excel tệ hơn khách nói | Trung bình | Cao | Spike tuần 1 — lấy mẫu 100 hàng, báo cáo |
| Staff kháng cự training | Thấp | Trung bình | Handover bao gồm 2 buổi + tài liệu hướng dẫn |

## Câu hỏi mở

Câu hỏi gap analysis KHÔNG giải quyết được. Trả lời trước khi đóng băng feature-register
(`PB-G2`) — câu hỏi mức **BLOCKER** sẽ vào `docs/requirements/CLARIFICATIONS.md` (1.6).

- Q1: PIM hiện tại có export API không hay phải scrape?
- Q2: Cơ quan quy định yêu cầu giữ dữ liệu đơn hàng bao lâu?

## Ký nghiệm thu (đóng băng pre-PB-G2)

| Mốc | Ngày | Người duyệt | Ghi chú |
| --- | --- | --- | --- |
| Vendor draft xong | YYYY-MM-DD | <vendor> | Lượt 1 |
| Khách review | YYYY-MM-DD | <tên khách> | Lượt 1 — chấp nhận với chỉnh sửa ưu tiên GAP-020 |
| Đóng băng (pre-feature-register) | YYYY-MM-DD | <vendor + khách> | Final |

Sau khi đóng băng, thay đổi gap đi qua `docs/templates/locale-vi/change-request-log.md`.
Không sửa analysis tại chỗ — ghi chú trỏ tới `CR-NN`.

## Cross-References

- Bản gốc tiếng Anh (chuẩn): `docs/templates/gap-analysis.md`.
- Nguồn business problem: `docs/templates/locale-vi/client-intake-brief.md § 3` (1.2).
- Đầu ra discovery: `docs/intake/YYYY-MM-DD-discovery-summary.md` (1.3, engine `ck-rri`).
- Forward: SRS REQ-ID (1.5, engine `ck-xre EXTRACT`) → `docs/requirements/srs/<module>.md`.
- Forward: feature-register in-scope (1.9) → `docs/templates/locale-vi/feature-register.md`.
- Token grammar đầy đủ: `docs/TRACE_SPEC.md`.
