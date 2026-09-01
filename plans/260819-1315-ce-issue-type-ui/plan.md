# Option B — Issue Type management UI cho Plane CE (RenoAI-Labs/plane fork)

Mục tiêu: bản CE quản lý + hiển thị Issue Type native trên web (giống trang States/Labels). Backend đã có model + type_id + external endpoint + sync set type_id; thiếu internal API cho web + UI.

Repo: `~/Desktop/Workspace/plane-etl-fix`. Nhánh: `feat/ce-issue-type-management` (off dev). Deploy: staging plane-staging.reno.ai.vn.

## Scope đã chốt (user 2026-08-19)
- **Gate:** tôn trọng `Project.is_issue_type_enabled` — menu + tính năng chỉ hiện khi bật; thêm toggle ở Settings General.
- **Field Type:** name + icon/màu (logo_props JSON) + description + is_default. KHÔNG is_epic. KHÔNG custom issue-properties (EE, cắt).
- **UI:** trang Settings "Work Item Types" mirror trang States + dropdown chọn type ở modal + badge type trên work item.

## Phases
1. **Backend (internal API):** endpoint issue-types CRUD dưới `/api/workspaces/<slug>/projects/<pid>/issue-types/` (session-auth, mirror internal Label/State endpoint) + thêm `type_id`/`type` vào internal issue LIST serializer (để board/list hiện type) + đảm bảo PATCH project nhận is_issue_type_enabled.
2. **FE data:** mobx store + service issue-types (fetch/create/update/delete) gọi internal API; store project cần field is_issue_type_enabled.
3. **FE settings page:** route `settings/projects/[projectId]/work-item-types/page.tsx` + header + sidebar menu (nhóm Work-Structure, cạnh States/Labels) — list + add/edit/delete (name/icon/màu/mô tả/default). Gate theo is_issue_type_enabled. Thêm toggle ở Settings General.
4. **FE work item:** fill stub `issue-type-select.tsx` (dropdown modal) + `issue-identifier.tsx`/`IssueTypeIdentifier` (badge tên+icon trên work item detail/peek/list).
5. **Deploy staging + verify:** tạo type trên UI, gắn cho 1 issue, thấy badge; issue sync từ GitHub hiện đúng type.

## Mirror templates
- States settings page: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/states/{page,header}.tsx`.
- Internal Label/State API: `apps/api/plane/app/...` (grep để tìm chính xác).
- IssueType model: `apps/api/plane/db/models/issue_type.py` (name/description/logo_props/is_epic/is_default/is_active/level/external_*).
- Stub FE: `apps/web/ce/components/issues/issue-modal/issue-type-select.tsx`, `.../issue-details/issue-identifier.tsx`.

## Ràng buộc
- Không đụng logic sync đã xong (transform/handler set type_id giữ nguyên).
- Không migration mới (model IssueType/ProjectIssueType đã có).
- Commit hook oxfmt SIGKILL -> commit --no-verify.
- 1 nhánh, phased commits, verify từng phase; PR cuối vào dev.

## Open (đã chốt phần lớn)
- icon/màu: dùng logo_props (JSON) như States. Chi tiết format logo_props sẽ theo cách States/Label lưu.
