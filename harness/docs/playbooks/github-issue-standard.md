# GitHub Issue Standard (generic — feed to PM + CS agents)

How to create a GitHub issue that the Mode-B loop can run without rework. Project-agnostic: the field VALUES (module list, phases, org) are per-project placeholders `{...}`; the STRUCTURE is fixed. For the FEATURE-register (`[F-NNN]`) idempotent-sync specifics, see `feature-issue-ac-demo-standard.md` — this doc does NOT repeat it. The loop that consumes these issues: `steady-state-issue-pipeline.md`.

## 0. BA-validate FIRST — before the issue exists
A customer "bug" is often the current behaviour being correct. **CS + Tech Lead classify BEFORE creating:**
- **Technical** (UI, broken link, wrong display, crash) -> create the issue, code it.
- **Business-sensitive** (price / order / payment / permission / money / data-integrity) -> **do NOT create-and-code blindly**; Tech Lead confirms the intended behaviour first (e.g. an order pending payment must KEEP its create-time price). Only then create, with the decision recorded in the body.
Don't mint an issue from a raw report without this step.

## 1. Title
- **Imperative, plain, human-readable.** What changes, in the user's words.
- **NO code refs, NO plan-taxonomy** (phase numbers, finding codes F13/Y1, audit labels, §refs) — those get renumbered and rot. Describe the WHAT, not the origin.
- Feature issues (from the register): prefix **`[F-NNN] `** (durable id). Bug/enhancement: no prefix.
- Good: `Đóng ticket hỗ trợ chưa chặn gửi tin trong phiên đã đóng`. Bad: `Fix F-047 helpdesk bug (audit A4)`.

## 2. Body — 4 mandatory blocks
```
## Bối cảnh / Why
1-3 câu: hiện trạng + vì sao cần đổi (nguyên văn khách nếu là bug). Nếu business-sensitive: ghi quyết định Tech Lead đã chốt.

## Phạm vi / Scope
Cái gì trong, cái gì ngoài.

## Tiêu chí nghiệm thu (Acceptance Criteria)   <-- QUAN TRỌNG NHẤT
- [ ] Given <bối cảnh> When <thao tác> Then <kết quả kiểm được>
- [ ] ... (mỗi tiêu chí PHẢI test được trên staging; đây là cái QC + demo bám vào)

**Module:** {module}
```
+ Links: staging URL của tính năng liên quan, issue/PR liên quan.
+ (Feature only) hidden marker `<!-- feat-id: F-NNN -->` for idempotent sync.

**AC là dòng sống-còn.** Issue không có AC checkbox testable = issue chưa chuẩn (QC không có gì để tick, coder không biết "done" là gì).

## 3. Fields — SET tại lúc tạo vs để TRIAGE sau
| Field | Set khi tạo? | Cách |
|---|---|---|
| **Title / Body / AC** | ✅ bắt buộc | `gh issue create` |
| **Module** | ✅ trong BODY (`**Module:** {module}`) — KHÔNG làm label | dòng body |
| **Type** (Feature/Bug/Enhancement) | ✅ | `gh issue create ... ` rồi `gh api --method PATCH /repos/{o}/{r}/issues/{n} -f type=Bug` |
| **Assignee** | ✅ | `--assignee {user}` |
| **Milestone** = Phase (số nguyên) | ✅ nếu biết | `--milestone "Phase {n}"` |
| **Parent** (sub-issue) | ✅ bug/task = con của feature cha đúng domain | `POST /repos/{o}/{r}/issues/{parent}/sub_issues -F sub_issue_id={child rest id}` |
| **Labels** | ✅ bộ CỐ ĐỊNH | chỉ dùng: `feature`/`bug`/`enhancement` + `plane` (mirror PM-tool) + `phase-N`. **KHÔNG đẻ label `module:*`** (Module ở body). |
| **States** | ❌ để mặc định = **Backlog** | (pipeline chuyển sau bằng `issue-state.mjs`) |
| **Priority** (Urgent/High/Medium/Low) | ⚠️ triage | org custom-field, set khi PM triage (xem §4) |

## 4. Cơ chế custom Issue Fields (thành thật — chỗ hay sai)
States / Module-field / Priority là **org-level single-select Issue Fields** (không phải Projects v2, không phải label). Đọc value = `GET /repos/{o}/{r}/issues/{n}` header `Accept: application/vnd.github.full+json` -> `.issue_field_values[]`. Set value = `PATCH .../issues/{n}` body `{"issue_field_values":[{"field_id":ID,"value":"<option NAME>"}]}` — **DECLARATIVE: gửi field nào thì các field khác BỊ XOÁ, nên phải gửi lại tất cả cùng lúc** (dùng `scripts/issue-state.mjs`, nó tự re-send Module+Priority kèm States). Option chỉ tạo được lúc CREATE field (cần admin:org). → **CS/PM agent lúc tạo issue chỉ cần lo: Title/Body/AC/Module-body/Type/Assignee/Milestone/Parent/Labels.** States tự Backlog; Priority + Module-field để triage/pipeline set bằng script (tránh tự PATCH declarative làm wipe field khác).

## 5. external_id + PM-tool
`external_id` (khoá nối sang PM-tool như Plane) = **số issue GitHub**. `[F-NNN]` chỉ là mã phụ trong tiêu đề, không phải khoá nối. PM-tool item 1:1 với issue GitHub (khách nghiệm thu ở đó nếu có).

## Anti-patterns (issue "chưa chuẩn" trông như thế nào)
- Không có AC, hoặc AC không test được ("làm cho đẹp hơn").
- Module làm label thay vì body; đẻ `module:*` labels.
- Tiêu đề dính code/plan ref (F13, phase-2, audit).
- Bug mồ côi (không gán feature cha).
- Thiếu Type / tạo mà chưa BA-validate business-sensitive.
- (PR sau này) dùng `Closes/Fixes` -> auto-close sớm; phải `Refs #N` ở cả commit + PR.

## Checklist tạo 1 issue (dán cho agent)
- [ ] BA-validate: technical hay business-sensitive? (sensitive -> Tech Lead chốt trước)
- [ ] Title imperative, không code/plan ref (feature: `[F-NNN]`)
- [ ] Body: Bối cảnh + Scope + **AC checkbox testable** + `**Module:**`
- [ ] Type + Assignee + Milestone(Phase) + Labels(bộ cố định) + Parent(nếu là con feature)
- [ ] States để Backlog; Priority để triage
- [ ] Sanity: external_id = số issue; không đẻ module-label
