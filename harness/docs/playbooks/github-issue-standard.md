# Chuẩn tạo GitHub Issue (dùng chung — nạp cho agent PM + CS)

**When To Run (mở khi nào):** agent PM/CS soạn 1 GitHub issue mới để giao coder. **Skip when (bỏ qua khi):** mới là ghi chú/yêu cầu thô nội bộ, chưa qua BA-validate để thành task giao coder.

**Lifecycle:** verified · **First use:** elearning 2026-07 · **Verified by:** elearning issue-pipeline

**Macro-stage / step:** Steady-state (Mode B) — issue authoring (feeds Ready-for-Dev). **Gate it serves:** DoR (Definition of Ready — điều kiện issue "đủ chín" để giao: đủ field + AC trước khi dispatch/giao coder).

## Engine
- **Đường nhanh (fast path):** agent PM/CS làm BA-validate rồi `gh issue create` rồi điền field org (States/Module/Type/Parent).
- **Fallback (agent trần):** agent chung đọc chuẩn này, tạo issue, set field.

Cách tạo một issue để vòng lặp xử-lý-issue chạy được ngay, không phải làm lại. Dùng chung mọi dự án: giá trị cụ thể (danh sách Module, Phase, tên org) là chỗ trống `{...}` mỗi dự án tự điền; cấu trúc thì cố định. Phần feature `[F-NNN]` và đồng bộ register xem `feature-issue-ac-demo-standard.md` (file này không lặp lại). Vòng lặp tiêu thụ issue: `steady-state-issue-pipeline.md`.

## Dự án cung cấp (nạp sẵn cho agent để điền các chỗ trống `{...}`)
Mỗi dự án đưa agent 5 giá trị này; cấu trúc bên dưới giữ nguyên, chỉ thay giá trị:
- **Org/repo** = `{o}/{r}` (chủ + tên repo trên GitHub, VD `RenoAI-Labs/elearning-platform`).
- **Module list** = danh sách module hợp lệ (điền vào dòng `**Module:**` trong body).
- **Phase list** = các Milestone (mốc), đặt tên `Phase 1`, `Phase 2`…
- **Org field IDs** = id các trường States (trạng thái) / Module / Priority (ưu tiên) — để script `issue-state.mjs` set (xem §4).
- **Staging URL** = link môi trường staging (bản chạy thử để QC/khách nghiệm thu) — dán vào AC và link cuối issue.

## 0. BA-validate (phản biện nghiệp vụ) TRƯỚC khi issue ra đời
Khách báo "bug" nhiều khi là hành vi hiện tại mới đúng. **CS + Tech Lead phân loại TRƯỚC khi tạo:**
- **Kỹ thuật thuần** (giao diện, link hỏng, hiển thị sai, crash) -> tạo issue, code.
- **Nhạy cảm nghiệp vụ** (giá, đơn hàng, thanh toán, phân quyền, tiền, toàn vẹn dữ liệu) -> **KHÔNG tạo-rồi-code vội**; Tech Lead xác nhận hành vi đúng trước (ví dụ: đơn chờ thanh toán phải GIỮ giá lúc tạo đơn). Chốt xong mới tạo, ghi quyết định vào body.
Đừng đẻ issue từ tin khách thô mà chưa qua bước này.

## 1. Tiêu đề (Title)
- **Mệnh lệnh, plain, người đọc hiểu ngay.** Đổi cái gì, theo lời người dùng.
- **KHÔNG dính code ref, KHÔNG dính taxonomy của plan** (số phase, mã finding F13/Y1, nhãn audit, §ref) — mấy cái đó bị đánh số lại rồi mục rữa. Tả CÁI GÌ, đừng tả nguồn gốc.
- Issue feature (từ register): tiền tố **`[F-NNN] `** (mã bền). Bug/enhancement: không tiền tố.
- Tốt: `Đóng ticket hỗ trợ chưa chặn gửi tin trong phiên đã đóng`. Xấu: `Fix F-047 helpdesk bug (audit A4)`.

## 2. Nội dung (Body) — 5 khối bắt buộc (khối CUỐI = DoD cố định)
```
## Bối cảnh
1-3 câu: hiện trạng + vì sao cần đổi (nguyên văn khách nếu là bug). Nếu nhạy cảm nghiệp vụ: ghi quyết định Tech Lead đã chốt.

## Phạm vi
Cái gì trong, cái gì ngoài.

## Tiêu chí nghiệm thu (Acceptance Criteria - AC)   <-- QUAN TRỌNG NHẤT
- [ ] Given <bối cảnh> When <thao tác> Then <kết quả kiểm được>
- [ ] ... (mỗi tiêu chí PHẢI kiểm được trên staging; đây là cái QC + demo bám vào)

**Module:** {module}

## Definition of Done (DoD)   <-- CỐ ĐỊNH · GIỐNG Y CHANG MỌI TASK · DÁN NGUYÊN VĂN · KHÔNG SỬA
- [ ] Tất cả AC ở trên PASS QC trên staging (mỗi AC tick được)
- [ ] Code đã merge vào `dev` qua PR; commit + PR dùng `Refs #N` (TUYỆT ĐỐI không Closes/Fixes/Resolves)
- [ ] CI gate xanh: lint · typecheck · build (next build) · unit
- [ ] Đã deploy staging + verify-at-source (container SHA == commit đã merge)
- [ ] Không gây regression: chức năng/số liệu liên quan vẫn đúng
- [ ] Migration/seed (nếu có) chạy sạch; docs/config cập nhật nếu bị ảnh hưởng
- [ ] Chỉ chuyển **Done** (và Close) sau khi QC/UAT pass — không đóng sớm
```
+ Link: URL staging của tính năng liên quan, issue/PR liên quan.
+ (Chỉ feature) marker ẩn `<!-- feat-id: F-NNN -->` để đồng bộ idempotent (chạy đồng bộ lại nhiều lần vẫn ra 1 kết quả, không tạo trùng).

**AC là dòng sống còn.** Issue không có AC dạng checkbox kiểm-được = issue chưa chuẩn (QC không có gì để tick, coder không biết "xong" là gì).

**DoD là khối CỐ ĐỊNH ở CUỐI mọi issue** — 7 dòng trên **y hệt nhau** cho mọi task (kỹ thuật hay nghiệp vụ), dán nguyên văn, KHÔNG chỉnh/bớt dòng. AC = "xong CÁI GÌ" (riêng từng issue); DoD = "xong THẾ NÀO" (chuẩn chất lượng chung, giống nhau). Issue thiếu DoD ở cuối = chưa chuẩn.

> **Giải nghĩa thuật ngữ trong khối DoD (cho người đọc — KHÔNG chép mấy dòng giải nghĩa này vào issue):** `QC` (Quality Control — kiểm thử chất lượng) · `staging` (bản chạy thử, giống thật, để kiểm trước khi ra khách) · `Refs #N` (chỉ THAM CHIẾU issue, KHÁC `Closes/Fixes` là tự-đóng-issue — dùng Refs để không đóng sớm) · `CI` (Continuous Integration — máy tự động chạy lint/build/test mỗi lần push) · `verify-at-source` (xác minh tại nguồn — kiểm container đang chạy mang đúng commit đã merge, không tin CI xanh suông) · `regression` (hồi quy — sửa cái này làm hỏng cái đang chạy) · `migration` (di trú CSDL — đổi cấu trúc database) · `UAT` (User Acceptance Testing — khách nghiệm thu).

## 3. Các trường (Fields) — set LÚC TẠO vs để TRIAGE sau
| Trường | Set khi tạo? | Cách |
|---|---|---|
| **Title / Body / AC** | Bắt buộc | `gh issue create` |
| **Module** | Ghi trong BODY (`**Module:** {module}`), KHÔNG làm label | dòng body |
| **Issue Type** (Feature/Bug/Enhancement) | Có | `gh api --method PATCH /repos/{o}/{r}/issues/{n} -f type=Bug` |
| **Assignee** | Có | `--assignee {user}` |
| **Milestone** = Phase (số nguyên) | Có nếu biết | `--milestone "Phase {n}"` |
| **Parent** (sub-issue) | Bug/task = con của feature cha đúng domain | `POST /repos/{o}/{r}/issues/{parent}/sub_issues -F sub_issue_id={child rest id}` |
| **Label** | CHỈ 2 nhãn nguồn/mirror | **`github` + `plane`** (đánh dấu nguồn GitHub + đồng bộ sang PM-tool). Loại = Issue Type (không phải label); Module = body; Phase = Milestone. Không đẻ label khác. |
| **States** | Để mặc định = **Backlog** | (vòng lặp chuyển sau bằng `issue-state.mjs`) |
| **Priority** (Urgent/High/Medium/Low) | Để triage | org custom-field, set khi PM triage (xem §4) |

> **Generic hoá `plane`:** `plane` là tên nhãn **mirror sang PM-tool** (RENO đang dùng Plane). Dự án dùng PM-tool khác thì **đổi tên nhãn này** cho khớp — cấu trúc "`github` (nguồn) + `{pm-mirror}`" giữ nguyên, chỉ tên nhãn thứ 2 thay theo tool.

## 4. Cơ chế custom Issue Fields (thành thật — chỗ hay sai)
States / Module / Priority là **org-level single-select Issue Fields** (trường tuỳ-biến cấp tổ-chức, mỗi trường chọn-1-giá-trị — KHÁC Projects v2, KHÁC label). Đọc value = `GET /repos/{o}/{r}/issues/{n}` header `Accept: application/vnd.github.full+json` -> `.issue_field_values[]`. Set value = `PATCH .../issues/{n}` body `{"issue_field_values":[{"field_id":ID,"value":"<tên option>"}]}` — **DECLARATIVE (khai báo): gửi trường nào thì các trường khác BỊ XOÁ, nên phải gửi lại tất cả cùng lúc** (dùng `scripts/issue-state.mjs`, nó tự gửi lại Module + Priority kèm States). Option chỉ tạo được lúc tạo field (cần quyền admin:org). -> **Agent CS/PM lúc tạo issue chỉ lo: Title / Body / AC / Module-trong-body / Issue Type / Assignee / Milestone / Parent / Label.** States tự Backlog; Priority + Module-field để triage/vòng-lặp set bằng script (đừng tự PATCH declarative kẻo wipe nhầm trường khác).

## 5. external_id + PM-tool
`external_id` (khoá nối sang PM-tool như Plane) = **số issue GitHub**. `[F-NNN]` chỉ là mã phụ trong tiêu đề, không phải khoá nối. Item PM-tool nối 1:1 với issue GitHub (khách nghiệm thu ở đó nếu có).

## Anti-patterns (issue "chưa chuẩn" trông như thế nào)
- Không có AC, hoặc AC không kiểm được ("làm cho đẹp hơn").
- **Thiếu khối DoD ở cuối**, hoặc mỗi issue một kiểu DoD (phải giống y chang, dán nguyên văn).
- **Loại (Feature/Bug/Enhancement) làm LABEL** thay vì Issue Type; hay **Module/Phase làm label**. Chỉ `github` + `plane` là label; loại = Issue Type, module = body, phase = Milestone.
- Tiêu đề dính code/plan ref (F13, phase-2, audit).
- Bug mồ côi (không gán feature cha).
- Thiếu Issue Type / tạo mà chưa BA-validate nhạy cảm nghiệp vụ.
- (PR về sau) dùng `Closes/Fixes` -> đóng issue sớm; phải `Refs #N` ở CẢ commit + PR.

## Checklist tạo 1 issue (dán cho agent)
- [ ] BA-validate: kỹ thuật hay nhạy cảm nghiệp vụ? (nhạy cảm -> Tech Lead chốt trước)
- [ ] Title mệnh lệnh, không code/plan ref (feature: `[F-NNN]`)
- [ ] Body: Bối cảnh + Phạm vi + **AC checkbox kiểm-được** + `**Module:**` + **DoD cố định ở CUỐI** (dán nguyên văn 7 dòng, giống mọi task)
- [ ] Issue Type (Feature/Bug/Enhancement) + Assignee + Milestone(Phase) + Parent (nếu là con feature)
- [ ] Label: CHỈ `github` + `plane` (loại ở Issue Type, không phải label)
- [ ] States để Backlog; Priority để triage
- [ ] Rà: external_id = số issue; không đẻ label loại/module/phase
