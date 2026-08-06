# Chuẩn tạo GitHub Issue (dùng chung — nạp cho agent PM + CS)

**When To Run (mở khi nào):** agent PM/CS soạn 1 GitHub issue mới để giao coder. **Skip when (bỏ qua khi):** mới là ghi chú/yêu cầu thô nội bộ, chưa qua BA-validate để thành task giao coder.

**Lifecycle:** verified · **First use:** elearning 2026-07 · **Verified by:** elearning issue-pipeline

**Macro-stage / step:** Steady-state (Mode B) — issue authoring (feeds Ready-for-Dev). **Gate it serves:** DoR (Definition of Ready — điều kiện issue "đủ chín" để giao: đủ field + AC trước khi dispatch/giao coder).

## Engine
- **Đường chuẩn (mọi agent - PM/CS/QC/ai phát hiện lỗi):** BA-validate rồi chạy **`node scripts/new-issue.mjs --input issue.json --create`**. Agent CHỈ điền phần BIẾN (title/context/scope/AC) trong `issue.json`; **khối cố định (5 header + DoD 13 mục) do script tự ghi -> không thể paraphrase sai**. Script tự gắn nhãn `plane` + `Module:`, Issue Type, assignee, Milestone, rồi **tự `--check` lại (fail-closed)**. Còn thiếu: gắn Parent (sub-issue) nếu là bug con của feature. States để Backlog; Priority triage sau.
- **Gate DoR (bắt buộc nếu tạo tay):** issue tạo bằng `gh issue create`/UI PHẢI qua **`node scripts/new-issue.mjs --check <issue#>`** (exit 1 nếu lệch: thiếu khối, DoD < 13 mục, thiếu `plane`/`Module:`, còn `github`, dùng Closes/Fixes). KHÔNG dispatch coder tới khi `--check` xanh.
- **Khung nguồn:** GitHub UI dùng `.github/ISSUE_TEMPLATE/bug-report.md` (đã đồng bộ khung chuẩn này); nhưng agent nên dùng script, không gõ tay.

Cách tạo một issue để vòng lặp xử-lý-issue chạy được ngay, không phải làm lại. Dùng chung mọi dự án: giá trị cụ thể (danh sách Module, Phase, tên org) là chỗ trống `{...}` mỗi dự án tự điền; cấu trúc thì cố định. Phần feature `[F-NNN]` và đồng bộ register xem `feature-issue-ac-demo-standard.md` (file này không lặp lại). Vòng lặp tiêu thụ issue: `steady-state-issue-pipeline.md`.

## Dự án cung cấp (nạp sẵn cho agent để điền các chỗ trống `{...}`)
Mỗi dự án đưa agent 5 giá trị này; cấu trúc bên dưới giữ nguyên, chỉ thay giá trị. **Điền/nạp sẵn 5 giá trị này TRƯỚC khi giao CS/PM** (kẻo họ không biết module/staging của dự án); giá trị dự án sống ở runbook/CLAUDE.md của dự án, KHÔNG hardcode vào file chung này (giữ repo-agnostic):
- **Org/repo** = `{o}/{r}` (chủ + tên repo trên GitHub, VD `RenoAI-Labs/elearning-platform`).
- **Module list** = danh sách nhãn `Module: <Tên>` hợp lệ CỦA REPO (mỗi repo tự định nghĩa bộ riêng — Module là chuyện riêng dự án, KHÔNG dùng chung org; xem §3.1).
- **Phase list** = các Milestone (mốc), đặt tên `Phase 1`, `Phase 2`…
- **Org field IDs** = tên/id các trường States (trạng thái) / Priority (ưu tiên). Lưu ý: `issue-state.mjs` **tự resolve theo TÊN**, KHÔNG cần cấp id sẵn; giá trị này chỉ cần khi admin tạo/khởi field lần đầu (xem §4).
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

## 2. Nội dung (Body) — các khối bắt buộc (AC = "xong CÁI GÌ" · DoD = "xong THẾ NÀO", thuần NFR)
```
## Bối cảnh
1-3 câu: hiện trạng + vì sao cần đổi (nguyên văn khách nếu là bug). Nếu nhạy cảm nghiệp vụ: ghi quyết định Tech Lead đã chốt.

## Phạm vi
Cái gì trong, cái gì ngoài.

## Tiêu chí nghiệm thu (Acceptance Criteria - AC)   <-- QUAN TRỌNG NHẤT (dev + QC + UAT cùng kiểm)
- [ ] Given <bối cảnh> When <thao tác> Then <kết quả kiểm được>.  Demo: <link> | HDSD: <link>  (2 link điền khi dev/QC xong, KHÔNG cần lúc tạo issue)
- [ ] ... (mỗi tiêu chí PHẢI kiểm được trên staging; đây là cái QC + demo bám vào)

## Định nghĩa hoàn thành (Definition of Done - DoD)   <-- CỐ ĐỊNH · GIỐNG mọi task · 1 dòng gộp AC + còn lại thuần NFR/process · KHÔNG mô tả tính năng
> Mỗi mục xong đính thông số hoặc link chứng minh. Mục KHÔNG áp dụng (vd task backend không có Mobile/WCAG; fix vặt không đẻ E2E mới; task nội bộ không có UAT khách): ghi `N/A - <lý do>`, ĐỪNG bỏ trống và ĐỪNG xoá dòng — giữ khối đồng nhất + trung thực. Luồng: xong hết AC -> qua các "ĐK lên staging" (kỹ thuật/NFR) -> deploy staging -> QC pass -> UAT pass -> mới Done. (Dự án có catalog SRS/NFR thì gắn mã trace của mình vào mỗi dòng, vd `DP.DEPLOY.05`.)
- [ ] Xong toàn bộ AC ở trên (mỗi AC QC-pass được trên staging)
- [ ] Lint pass (CI) - (link)
- [ ] Unit test pass, coverage đạt ngưỡng (dự án tự đặt) - (link)
- [ ] Integration test pass - (link)
- [ ] E2E test pass - (link)
- [ ] Security test (OWASP / NFR bảo mật) - (link)
- [ ] Regression - không phá chức năng/số liệu liên quan (kiểm hồi quy sau khi lên staging)
- [ ] Mobile 375px + WCAG AA (nếu có UI) - (link)
- [ ] HDSD tính năng đầy đủ (user guide cả tính năng; khác `HDSD:` per-AC ở trên chỉ trỏ mục tương ứng) - (link)
- [ ] Cập nhật tài liệu liên quan trong source - (commit)
- [ ] Deploy staging + verify-at-source (health ok, SHA == commit đã merge) - (link)
- [ ] QC pass (human) - (ghi chú)
- [ ] UAT khách đạt (mirror sang PM-tool) - (link)  -> mới chuyển Done

## Liên kết
- Commit / PR: dùng `Refs #N` (hoặc `[F-NNN]`) trong commit - TUYỆT ĐỐI không `Closes/Fixes/Resolves`. Chỉ chuyển **Done**/Close sau khi QC + UAT pass (không đóng sớm).
- PM-task (Plane...): đồng bộ 1-1 với issue.
- Link staging của tính năng liên quan; issue/PR liên quan.
- (Chỉ feature) marker ẩn `<!-- feat-id: F-NNN -->` để đồng bộ idempotent (chạy đồng bộ lại nhiều lần vẫn ra 1 kết quả, không tạo trùng).
```

**AC là dòng sống còn.** Issue không có AC dạng checkbox kiểm-được = issue chưa chuẩn (QC không có gì để tick, coder không biết "xong" là gì).

**DoD là khối CỐ ĐỊNH cho mọi issue** — các mục NFR/process trên **y hệt nhau** cho mọi task (kỹ thuật hay nghiệp vụ), giống nhau, mỗi mục đính bằng chứng. Mục nào **không áp dụng** cho task cụ thể thì ghi `N/A - <lý do>` (KHÔNG xoá dòng, KHÔNG bỏ trống) — khối vẫn đồng nhất, và "bỏ qua" là quyết định trung thực có ghi lý do chứ không phải âm thầm drop. **DoD KHÔNG mô tả tính năng** — tính năng nằm ở AC. AC = "xong CÁI GÌ" (riêng từng issue, mô tả tính năng cụ thể); DoD = "xong THẾ NÀO" (thuần NFR — chuẩn chất lượng/phi-chức-năng chung). Issue thiếu khối DoD, hoặc DoD nhét mô tả tính năng = chưa chuẩn.

> **Giải nghĩa thuật ngữ trong khối DoD (cho người đọc — KHÔNG chép mấy dòng giải nghĩa này vào issue):** `NFR` (Non-Functional Requirement — yêu cầu phi chức năng: hiệu năng/bảo mật/khả dụng/khả bảo trì…) · `QC` (Quality Control — kiểm thử chất lượng) · `staging` (bản chạy thử, giống thật, để kiểm trước khi ra khách) · `coverage` (độ phủ test — % code được test chạy qua) · `Integration/E2E test` (kiểm tích hợp / kiểm đầu-cuối cả luồng người dùng) · `OWASP` (bộ chuẩn lỗ hổng bảo mật web phổ biến) · `WCAG AA` (chuẩn khả dụng cho người khuyết tật, mức AA) · `regression` (hồi quy — sửa cái này làm hỏng cái đang chạy) · `HDSD` (hướng dẫn sử dụng — user guide) · `verify-at-source` (xác minh tại nguồn — kiểm container đang chạy mang đúng commit đã merge, không tin CI xanh suông) · `UAT` (User Acceptance Testing — khách nghiệm thu) · `Refs #N` (chỉ THAM CHIẾU issue, KHÁC `Closes/Fixes` là tự-đóng-issue — dùng Refs để không đóng sớm) · `CI` (Continuous Integration — máy tự động chạy lint/build/test mỗi lần push).

## 3. Các trường (Fields) — set LÚC TẠO vs để TRIAGE sau
| Trường | Set khi tạo? | Cách |
|---|---|---|
| **Title / Body / AC** | Bắt buộc | `gh issue create` |
| **Module** | Có — **nhãn `Module: <Tên>` cấp repo** (xem §3.1) | `--label "Module: Course Management"` |
| **Issue Type** (Feature/Bug/Enhancement) | Có | `gh api --method PATCH /repos/{o}/{r}/issues/{n} -f type=Bug` |
| **Assignee** | Có | `--assignee {user}` |
| **Milestone** = Phase (số nguyên) | Có nếu biết | `--milestone "Phase {n}"` |
| **Parent** (sub-issue) | Bug/task = con của feature cha đúng domain | `POST /repos/{o}/{r}/issues/{parent}/sub_issues -F sub_issue_id={child rest id}` |
| **Label** | `plane` (mirror PM-tool) + **`Module: <Tên>`** (nhóm chức năng) | `--label plane --label "Module: Course Management"`. Loại = Issue Type field (KHÔNG phải label); Phase = Milestone. Ngoài `plane` + `Module:` thì không đẻ label khác. |
| **States** | Để mặc định = **Backlog** | Vòng lặp/pipeline chuyển sau bằng `scripts/issue-state.mjs` (script TRONG repo, KHÔNG thuộc file này); CS/PM tạo issue KHÔNG chạy |
| **Priority** (Urgent/High/Medium/Low) | Để triage | org custom-field, set khi PM triage (xem §4) |

> **Generic hoá `plane`:** `plane` là tên nhãn **mirror sang PM-tool** (RENO đang dùng Plane). Dự án dùng PM-tool khác thì **đổi tên nhãn này** cho khớp (`{pm-mirror}`). Nhãn `github` cũ đã bỏ - nó không có chức năng trong sync (chỉ `plane` mới trigger mirror).

## 3.1 Module = nhãn `Module: <Tên>` cấp REPO (vì sao, quy ước)
**Vì sao là nhãn chứ không phải org field:** Module (nhóm chức năng) là chuyện **riêng từng dự án** — elearning có `Course Management`/`Commerce & Payments`…, dự án khác bộ khác hẳn. GitHub org Issue Field dùng CHUNG 1 danh sách cho MỌI repo trong org, nên nhét Module vào org field bắt mọi repo xài chung 1 bộ module — sai. Nhãn (label) thì **per-repo tự nhiên**: mỗi repo tự định nghĩa bộ nhãn riêng. (Phase thì khác: Milestone vốn đã per-repo, nên Phase GIỮ là Milestone.)
- **Quy ước tên (giữ nguyên chữ, dễ đọc):** `Module: <Tên>` — VD `Module: Course Management`, `Module: Commerce & Payments`, `Module: CRM`. Chữ M hoa, có dấu cách sau dấu hai chấm, tên nhóm chức năng giữ nguyên như tên module dự án đã dùng.
- **Mỗi repo tự khai bộ nhãn** (danh sách Module sống ở runbook/CLAUDE.md của repo, KHÔNG hardcode vào file chung này). Tạo nhãn 1 lần cho repo trước khi giao CS/PM.
- **1 issue = 1 nhãn `Module:`** (đúng 1 nhóm chức năng). Bug/task con dùng nhãn Module của feature cha.
- **Phase = Milestone** (`Phase 1`/`Phase 2`…), không làm label.
- **Plane sync** (nếu có): map nhãn `Module:` <-> Plane Module. Module KHÔNG còn là org field; `issue-state.mjs` KHÔNG đụng Module.

## 4. Cơ chế custom Issue Fields (thành thật — chỗ hay sai)
States / Priority là **org-level single-select Issue Fields** (trường tuỳ-biến cấp tổ-chức, mỗi trường chọn-1-giá-trị — KHÁC Projects v2, KHÁC label). (**Module KHÔNG còn là org field** — đã chuyển sang nhãn `Module: <Tên>` cấp repo, §3.1.) Đọc value = `GET /repos/{o}/{r}/issues/{n}` header `Accept: application/vnd.github.full+json` -> `.issue_field_values[]`. Set value = `PATCH .../issues/{n}` body `{"issue_field_values":[{"field_id":ID,"value":"<tên option>"}]}` — **DECLARATIVE (khai báo): gửi trường nào thì các trường khác BỊ XOÁ, nên phải gửi lại tất cả cùng lúc** (dùng `scripts/issue-state.mjs`, nó tự gửi lại Priority kèm States). Option chỉ tạo được lúc tạo field (cần quyền admin:org). -> **Agent CS/PM lúc tạo issue chỉ lo: Title / Body / AC / Issue Type / Assignee / Milestone / Parent / Label (`plane` + `Module: <Tên>`).** States tự Backlog; Priority để triage/vòng-lặp set bằng script (đừng tự PATCH declarative kẻo wipe nhầm trường khác).

> **Field gắn theo Issue Type (chỗ hay quên) + script ở đâu:** States/Priority **gắn theo TỪNG Issue Type** — hiện Feature/Bug/Enhancement đều mang đủ 2. Thêm/đổi Issue Type phải gắn đủ 2 field cho type mới, kẻo field không hiện trên issue + `issue-state.mjs` (resolve theo TÊN) không set được. Script này nằm ở `scripts/issue-state.mjs` của repo (seed từ harness `templates/steady-state/scripts/`), thuộc vòng lặp `steady-state-issue-pipeline.md`, **KHÔNG kèm trong file chuẩn này** — gửi riêng file này thì người đọc xem script ở repo, và người tạo issue không cần chạy nó.

## 5. external_id + PM-tool
`external_id` (khoá nối sang PM-tool như Plane) = **số issue GitHub**. `[F-NNN]` chỉ là mã phụ trong tiêu đề, không phải khoá nối. Item PM-tool nối 1:1 với issue GitHub (khách nghiệm thu ở đó nếu có).

## Anti-patterns (issue "chưa chuẩn" trông như thế nào)
- Không có AC, hoặc AC không kiểm được ("làm cho đẹp hơn").
- **Thiếu khối DoD**, hoặc mỗi issue một kiểu DoD (các mục NFR/process phải giống nhau mọi task).
- **DoD nhét mô tả tính năng** (DoD chỉ thuần NFR/process; tính năng nằm ở AC), hoặc DoD-item không đính bằng chứng (link/thông số).
- **Xoá dòng / bỏ trống DoD-item không áp dụng** thay vì ghi `N/A - <lý do>` (mất tính đồng nhất + không rõ đã cân nhắc hay quên).
- **Loại (Feature/Bug/Enhancement) làm LABEL** thay vì Issue Type; hay **Phase làm label** thay vì Milestone. Label chỉ có `plane` + `Module: <Tên>`; loại = Issue Type field, phase = Milestone.
- **Module làm org field** thay vì nhãn `Module:` cấp repo (bắt mọi repo dùng chung 1 danh sách — sai, §3.1).
- Tiêu đề dính code/plan ref (F13, phase-2, audit).
- Bug mồ côi (không gán feature cha).
- Thiếu Issue Type / tạo mà chưa BA-validate nhạy cảm nghiệp vụ.
- (PR về sau) dùng `Closes/Fixes` -> đóng issue sớm; phải `Refs #N` ở CẢ commit + PR.

## Checklist tạo 1 issue (dán cho agent)
- [ ] BA-validate: kỹ thuật hay nhạy cảm nghiệp vụ? (nhạy cảm -> Tech Lead chốt trước)
- [ ] Title mệnh lệnh, không code/plan ref (feature: `[F-NNN]`)
- [ ] Body: Bối cảnh + Phạm vi + **AC checkbox kiểm-được** (kèm Demo/HDSD) + **DoD thuần NFR** (các mục NFR/process giống mọi task, mỗi mục đính bằng chứng) + **Liên kết** (Refs #N, PM-task)
- [ ] Issue Type (Feature/Bug/Enhancement) + Assignee + Milestone(Phase) + Parent (nếu là con feature)
- [ ] Label: `plane` + `Module: <Tên>` (1 nhãn Module đúng nhóm chức năng; loại ở Issue Type field, không phải label)
- [ ] States để Backlog; Priority để triage
- [ ] Rà: external_id = số issue; không đẻ label loại/phase (Module CÓ là label)
