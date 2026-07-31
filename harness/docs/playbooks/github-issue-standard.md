# Chuẩn tạo GitHub Issue (dùng chung — nạp cho agent PM + CS)

**Lifecycle:** verified · **First use:** elearning 2026-07 · **Verified by:** elearning issue-pipeline

**Macro-stage / step:** Steady-state (Mode B) — issue authoring (feeds Ready-for-Dev). **Gate it serves:** DoR (issue complete: fields + AC set before dispatch).

## Engine
- **Đường nhanh (fast path):** agent PM/CS làm BA-validate rồi `gh issue create` rồi điền field org (States/Module/Type/Parent).
- **Fallback (agent trần):** agent chung đọc chuẩn này, tạo issue, set field.

Cách tạo một issue để vòng lặp xử-lý-issue chạy được ngay, không phải làm lại. Dùng chung mọi dự án: giá trị cụ thể (danh sách Module, Phase, tên org) là chỗ trống `{...}` mỗi dự án tự điền; cấu trúc thì cố định. Phần feature `[F-NNN]` và đồng bộ register xem `feature-issue-ac-demo-standard.md` (file này không lặp lại). Vòng lặp tiêu thụ issue: `steady-state-issue-pipeline.md`.

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

## 2. Nội dung (Body) — 4 khối bắt buộc
```
## Bối cảnh
1-3 câu: hiện trạng + vì sao cần đổi (nguyên văn khách nếu là bug). Nếu nhạy cảm nghiệp vụ: ghi quyết định Tech Lead đã chốt.

## Phạm vi
Cái gì trong, cái gì ngoài.

## Tiêu chí nghiệm thu (Acceptance Criteria - AC)   <-- QUAN TRỌNG NHẤT
- [ ] Given <bối cảnh> When <thao tác> Then <kết quả kiểm được>
- [ ] ... (mỗi tiêu chí PHẢI kiểm được trên staging; đây là cái QC + demo bám vào)

**Module:** {module}
```
+ Link: URL staging của tính năng liên quan, issue/PR liên quan.
+ (Chỉ feature) marker ẩn `<!-- feat-id: F-NNN -->` để đồng bộ idempotent.

**AC là dòng sống còn.** Issue không có AC dạng checkbox kiểm-được = issue chưa chuẩn (QC không có gì để tick, coder không biết "xong" là gì).

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

## 4. Cơ chế custom Issue Fields (thành thật — chỗ hay sai)
States / Module / Priority là **org-level single-select Issue Fields** (không phải Projects v2, không phải label). Đọc value = `GET /repos/{o}/{r}/issues/{n}` header `Accept: application/vnd.github.full+json` -> `.issue_field_values[]`. Set value = `PATCH .../issues/{n}` body `{"issue_field_values":[{"field_id":ID,"value":"<tên option>"}]}` — **DECLARATIVE (khai báo): gửi trường nào thì các trường khác BỊ XOÁ, nên phải gửi lại tất cả cùng lúc** (dùng `scripts/issue-state.mjs`, nó tự gửi lại Module + Priority kèm States). Option chỉ tạo được lúc tạo field (cần quyền admin:org). -> **Agent CS/PM lúc tạo issue chỉ lo: Title / Body / AC / Module-trong-body / Issue Type / Assignee / Milestone / Parent / Label.** States tự Backlog; Priority + Module-field để triage/vòng-lặp set bằng script (đừng tự PATCH declarative kẻo wipe nhầm trường khác).

## 5. external_id + PM-tool
`external_id` (khoá nối sang PM-tool như Plane) = **số issue GitHub**. `[F-NNN]` chỉ là mã phụ trong tiêu đề, không phải khoá nối. Item PM-tool nối 1:1 với issue GitHub (khách nghiệm thu ở đó nếu có).

## Anti-patterns (issue "chưa chuẩn" trông như thế nào)
- Không có AC, hoặc AC không kiểm được ("làm cho đẹp hơn").
- **Loại (Feature/Bug/Enhancement) làm LABEL** thay vì Issue Type; hay **Module/Phase làm label**. Chỉ `github` + `plane` là label; loại = Issue Type, module = body, phase = Milestone.
- Tiêu đề dính code/plan ref (F13, phase-2, audit).
- Bug mồ côi (không gán feature cha).
- Thiếu Issue Type / tạo mà chưa BA-validate nhạy cảm nghiệp vụ.
- (PR về sau) dùng `Closes/Fixes` -> đóng issue sớm; phải `Refs #N` ở CẢ commit + PR.

## Checklist tạo 1 issue (dán cho agent)
- [ ] BA-validate: kỹ thuật hay nhạy cảm nghiệp vụ? (nhạy cảm -> Tech Lead chốt trước)
- [ ] Title mệnh lệnh, không code/plan ref (feature: `[F-NNN]`)
- [ ] Body: Bối cảnh + Phạm vi + **AC checkbox kiểm-được** + `**Module:**`
- [ ] Issue Type (Feature/Bug/Enhancement) + Assignee + Milestone(Phase) + Parent (nếu là con feature)
- [ ] Label: CHỈ `github` + `plane` (loại ở Issue Type, không phải label)
- [ ] States để Backlog; Priority để triage
- [ ] Rà: external_id = số issue; không đẻ label loại/module/phase
