# Spec: fork silo cho sync GitHub Issue -> Plane workitem đạt 100%

Ngày 2026-08-18. Mục tiêu: custom source Plane (service `silo`) để 1 GitHub issue đồng bộ **đủ 100% field** sang Plane workitem, thay vì phải chạy cron ETL bù ngoài.

Repo Plane local: `~/Desktop/Workspace/plane-etl-fix` (fork `RenoAI-Labs/plane`).

## Kết luận 1 câu

Native silo **đã map ~80%** (title, description+ảnh re-host, author, labels, assignees, comments, milestone->cycle, open/close state). Phần thiếu = đúng các trường GitHub để trong **Projects v2 custom fields** (States chi tiết, Priority, Module, Type, parent/sub-issue) - những field này **KHÔNG có trong webhook payload**, nên phải gọi thêm GitHub GraphQL Projects v2 API rồi map vào Plane.

## Nơi fork (đã đọc source thật)

| File | Vai trò |
|---|---|
| `apps/silo/src/apps/github/workers/github/event-handlers/issue.handler.ts` | Nhận webhook issue GitHub -> tạo/update workitem Plane. Đã lo create label + map assignee + created_by. |
| `packages/etl/src/github/etl/transform-to-plane.ts` | **Hàm `transformGitHubIssue`** - biến GitHub issue -> object Plane. **Đây là nơi thêm field.** |
| `packages/etl/src/github/services/` (github.service.ts) | Gọi GitHub API. Cần thêm hàm fetch Projects v2 field values + issue type + sub-issues. |

## Bảng field: hiện có vs thiếu

| Field GitHub | Đích Plane | Native hiện tại | Cần fork? |
|---|---|---|---|
| number | `external_id` | ✅ | không |
| title | `name` | ✅ | không |
| body_html (+ ảnh) | `description_html` (ảnh re-host sang Plane assets qua `ContentParser.toPlaneHtml`) | ✅ | không |
| author (user) | `created_by` (qua userMap) | ✅ | không |
| created_at | `created_at` | ✅ | không |
| assignees | assignees (userMap) | ✅ | không |
| labels (thường) | labels (tự tạo nếu thiếu) | ✅ | không |
| comments | comments | ✅ | không |
| state open/closed | state (backlog/done hoặc issueStateMap) | ✅ | không |
| Milestone | Cycle (`transformGitHubMilestone`) | ✅ (cần verify gắn membership) | verify |
| **custom field States** (Dev Done/Ready for Test/QC - pipeline 10 trạng thái) | Plane state **chi tiết** | ❌ chỉ open/closed | **CÓ** |
| **custom field Priority** (Urgent/High/Medium/Low) | `priority` | ❌ hardcode `"none"` | **CÓ** |
| **Module** (label `Module: X` hoặc field) | Plane Module (membership) | ❌ | **CÓ** |
| **Issue Type** (Bug/Feature/Enhancement) | Plane Issue Type hoặc label | ❌ (không đọc `issue.type`) | **CÓ** |
| **sub_issues** (cha/con) | `parent` | ❌ | **CÓ** |
| state_reason (completed/not_planned) | phân biệt Done vs Cancelled | ❌ | tùy chọn |

## Thách thức kỹ thuật chính

GitHub Projects v2 custom fields (States, Priority, Module) + Issue Type + sub-issues **không nằm trong webhook payload issue thường**. Silo phải:
1. Thêm hàm trong `github.service.ts` gọi **GraphQL Projects v2** lấy field values của issue.
2. Thêm fetch **issue type** (REST `issues` với header full, field `type`) và **sub_issues** (REST `/issues/{n}/sub_issues`).
3. Trong `transformGitHubIssue`: map States->state (theo tên), Priority->priority, Module->module membership, Type->issue-type/label, parent->parent.

Đây đúng là logic cron cũ `sync-github-to-plane.py` từng làm (Tier-2) - giờ chuyển vào silo để native + real-time thay vì cron 15 phút.

## Vướng vận hành khi test local

- Silo nhận webhook từ GitHub -> cần **public tunnel** (cloudflared/ngrok) trỏ về silo local, hoặc dùng GitHub App test riêng.
- Cần bootstrap: admin + workspace + project + API token trên Plane local (backend không UI -> qua `manage.py` hoặc build thêm web).
- Có thể test transform **offline** (unit test `transform-to-plane.test.ts` đã có sẵn) trước khi cần tunnel - nhanh hơn.

## Tiến độ

- **Local dev Plane backend: LIVE** (`docker-compose-local.yml`, api `:8000`, ~90 migration xong, instance registered). Cổng remap 5432->15432, 6379->16379 tránh vướng.
- **Increment 1: DONE + verified offline** (nhánh `feat/github-sync-custom-fields`, chưa commit). 4 file đổi:
  - `transform-to-plane.ts`: thêm Priority (custom field -> Plane priority, lạ->none), State-detail (custom field States -> Plane state theo tên, thắng open/closed + issueStateMap), Type->label. 2 param optional mới (backward-compatible).
  - `api.service.ts`: `getIssueFields()` dùng full media type -> `issue_field_values` + `type`.
  - `issue.handler.ts`: fetch + truyền field vào transform.
  - test: 15/15 xanh (`pnpm --filter @plane/etl test -- transform-to-plane`), 11 case mới. Typecheck etl + silo sạch.
  - **Quyết định cần lưu:** States thắng CẢ `issueStateMap` admin cấu hình (coi States là tín hiệu chi tiết hơn) - ghi trong code comment. Nếu không muốn vậy, đảo lại 1 dòng.
- **Increment 2: DONE + verified offline** (commit `c56e625`). 21/21 test, typecheck sạch. 3 item handler-level:
  - **parent/sub-issue**: `getSubIssues` (Octokit `issues.listSubIssues` - có type sẵn) -> set `parent` cho child đã có workitem (idempotent, bỏ qua child chưa sync).
  - **Module native membership**: `resolveModuleNameFromLabels` (strip `Module: ` prefix) -> `Client.modules.addIssues` nếu chưa là member. SDK hỗ trợ đủ.
  - **Cycle-from-milestone**: phát hiện `transformGitHubMilestone` là **dead code** (silo KHÔNG có milestone handler nào). Subagent wire thẳng vào issue handler đọc `ghIssue.data.milestone` -> list-or-create Cycle -> `cycles.addIssues`. Deviation hợp lý, đã ghi.
  - **Caveat cần E2E verify:** idempotency Module/Cycle dựa `ExModule.issues`/`ExCycle.issues` từ `list()` - nếu serializer backend KHÔNG trả field `issues` thì check luôn thấy "chưa member" -> gọi `addIssues` mỗi lần sync. Cần verify khi có live API (hoặc đổi sang `getModule`/`getCycle` singular).
- **E2E bootstrap phía Plane: DONE** — local sandbox sẵn sàng: workspace `sync-sandbox`, project `Sync Test` (SYNC, id `65a95133-...`), 5 default state, API token hoạt động qua **`/api/v1/`** (không phải `/api/`). Creds ở `$CLAUDE_JOB_DIR/tmp/plane-local-sandbox-creds.txt`. Gotcha: tạo project qua ORM KHÔNG seed state -> phải seed tay; external API là `/api/v1/` dùng X-API-Key (còn `/api/` là app-API session).
- **E2E còn thiếu (cần người):** chạy service `silo` + public tunnel (cloudflared) trỏ webhook về silo local + tạo **GitHub App test MỚI** (không repoint app production `reno-ai-plane-silo` kẻo phá sync hosted). Đây là bước cần Trung làm tay.

## Runbook E2E (chạy sync thật) - còn lại

Logic đã xong; muốn thấy 1 GitHub issue chảy thành workitem đủ field cần dựng đường truyền webhook. 4 mảnh:

1. **[NGƯỜI] Tạo GitHub App test mới** (KHÔNG dùng app production `reno-ai-plane-silo`):
   - Permissions: Issues (read/write), Metadata (read), Contents (read), Pull requests (read).
   - Subscribe events: Issues, Issue comment, (Milestone nếu muốn), Installation.
   - Webhook URL = URL tunnel (bước 3) + `/silo/api/github/...`; đặt Webhook secret.
   - Sinh Private key. Ghi lại: App ID, App name, Client ID, Client secret, Webhook secret, Private key.
   - Install app lên repo test (1 repo throwaway hoặc elearning-platform).
2. **[TỰ ĐỘNG] Chạy silo** + nhét 6 env GitHub App ở trên vào (`GITHUB_APP_ID/APP_NAME/CLIENT_ID/CLIENT_SECRET/WEBHOOK_SECRET/PRIVATE_KEY`) + trỏ `SILO_API_BASE_URL` về Plane local. Silo có trong `docker-compose.yml` (build từ source).
3. **[TỰ ĐỘNG] Public tunnel** (cloudflared) trỏ về silo local (để GitHub gọi webhook vào được).
4. **[TỰ ĐỘNG] Workspace connection** trong Plane: bình thường tạo qua nút "Connect GitHub" ở web UI integration settings (cần build frontend `web`), HOẶC insert headless các bản ghi workspaceConnection + entityConnection + credential (như đã bootstrap workspace) - map installation GitHub -> project `Sync Test`, kèm `userMap` (github login -> plane user).

Nút thắt: bước 1 (GitHub App) là việc người. Bước 4 nếu né build frontend thì phải insert headless (cần trace schema connection - việc thêm).

## Cách VERIFY mapping rẻ hơn (không cần GitHub App/tunnel)
Vì thay đổi của mình nằm ở tầng transform/handler (không phải webhook transport), có thể viết 1 driver nhỏ import `transformGitHubIssue` (từ etl dist) + `@plane/sdk` Client trỏ `localhost:8000` (API token sandbox) + Octokit token của `gh`, nạp 1 issue elearning thật -> tạo workitem -> assert priority/state/label/parent/module/cycle. Test đúng code thật, chỉ bỏ qua lớp webhook. Cần seed thêm state pipeline (Ready for Test/Dev Done/QC...) vào project `Sync Test` để state-detail match.

## Câu hỏi mở

- Test transform bằng unit test offline trước (nhanh, không cần tunnel) hay dựng full tunnel + GitHub App ngay?
- Module: map từ label `Module: X` hay từ Projects v2 field? (elearning đã chuyển Module thành label repo).
- Issue Type -> Plane Issue Type (cần tạo type tương ứng) hay -> label như cron cũ?
