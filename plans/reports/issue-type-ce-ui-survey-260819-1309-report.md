# Khảo sát: đưa Issue Type (loại công việc) LỘ RA và QUẢN LÝ được trên web UI của Plane CE fork

- Repo: `/home/trung/Desktop/Workspace/plane-etl-fix` (fork RenoAI-Labs/plane)
- Web: `apps/web` (Next.js/React/mobx). Backend: `apps/api` (Django).
- Ngày: 2026-08-19. Phạm vi: CHỈ đọc, không sửa code.
- Alias then chốt: `apps/web/tsconfig.json:9` map `@/plane-web/*` -> `./ce/*`, nên mọi thứ gọi `@/plane-web/...issue-type...` thực chất trỏ vào stub (mã rỗng) trong `apps/web/ce`.

---

## 1. Kiểm kê stub CE - hiện mỗi cái render gì

| File (dưới `apps/web/ce/`) | Render hiện tại | Ghi chú |
|---|---|---|
| `components/issues/issue-details/issue-identifier.tsx` | `IssueIdentifier` -> render text `PROJ-123` (mã định danh). `IssueTypeIdentifier` -> `<></>` (rỗng, KHÔNG icon loại) | Đây là chỗ DUY NHẤT có render thật; nhưng chỉ ra mã, không ra loại |
| `components/issues/issue-details/issue-type-switcher.tsx` | Bọc lại `IssueIdentifier` -> chỉ hiện `PROJ-123`, KHÔNG có badge/icon loại | Dùng ở work item detail + peek (xem muc 2) |
| `components/issues/issue-modal/issue-type-select.tsx` | `return <></>` (dropdown chọn loại = rỗng) | Type + props đầy đủ, chỉ thiếu thân |
| `components/issues/issue-details/issue-type-activity.tsx` | `return <></>` | Không ghi lịch sử đổi loại |
| `components/issues/filters/issue-types.tsx` | `return null` | Lọc theo loại = không có |
| `components/issues/filters/applied-filters/issue-types.tsx` | `return null` | Chip filter đã áp = không có |
| `types/issue-types/index.ts` + `issue-property-values.d.ts` | Chỉ `type TIssuePropertyValues = object` (kiểu rỗng) | Không có mô hình dữ liệu loại |

Ngoài ra: KHÔNG có `store`/`service`/`hooks` nào cho issue type trong `apps/web/ce` (grep `store`, `services`, `hooks` = 0 kết quả). Nghia là frontend CE không có cách nào nạp danh sách loại vào state.

## 2. Chỗ loại CÔNG VIỆC "đáng lẽ" hiện ra + cái đang thiếu

- **Work item detail / peek**: `IssueTypeSwitcher` được gọi ở `core/components/issues/issue-detail/main-content.tsx:107` và `core/components/issues/peek-overview/issue-detail.tsx`. Vì stub chỉ bọc `IssueIdentifier`, người dùng chỉ thấy `PROJ-123`, KHÔNG thấy icon/tên loại.
- **Modal tạo/sửa work item**: `core/components/issues/issue-modal/form.tsx:396` đã gọi `<IssueTypeSelect ... typeId={watch("type_id")}/>` và form đã có field `type_id` (dòng 197/248/268/285). Tức là "ổ cắm" đã đấu sẵn; chỉ thân stub rỗng nên không có dropdown. Đây là điểm THUẬN LỢI: chỉ cần thay ruột stub, không phải sửa form.
- **Project Settings**: KHÔNG có route quản lý loại. Config sidebar ở `packages/constants/src/settings/project.ts` chỉ có general/members/features_*/states/labels/estimates/automations - KHÔNG có "Work Item Types". Thư mục route `apps/web/app/.../settings/projects/[projectId]/` cũng không có folder issue-types. => Chưa có trang tạo/sửa/xoá loại.
- **Filter / group-by theo loại**: cả 2 stub filter trả `null` -> không lọc, không nhóm theo loại được.

## 3. Dữ liệu / store: có gì vs thiếu gì (ĐIỂM CHẶN QUAN TRỌNG NHẤT)

- Frontend `TIssue` ĐÃ có `type_id: string | null` (`packages/types/src/issues/issue.ts:65`). Nghia là chỗ chứa id-loại trên issue có sẵn.
- **Nhưng đường ống API nội bộ đang đứt**:
  - Endpoint issue-types CHỈ tồn tại ở **API ngoài** (external, cần token): `apps/api/plane/api/urls/issue_type.py` -> `workspaces/<slug>/projects/<project_id>/issue-types/` (GET+POST). Đây là `/api/v1/` (`plane.api.urls`).
  - **API nội bộ** mà web app dùng (session-cookie, `plane.app.urls` = `/api/`) KHÔNG có endpoint issue-types (grep `apps/api/plane/app/urls/` = 0).
  - Serializer issue nội bộ dạng LIST (`IssueSerializer`, `apps/api/plane/app/serializers/issue.py:760`) KHÔNG trả `type_id` -> board/list frontend không nhận được loại. Chỉ `IssueDetailSerializer` (dòng ~995) có field `type`.
  - Web KHÔNG có service nào gọi `/issue-types/` (grep `packages/services` = 0).
- Kết luận: kể cả chỉ để XEM, phải thêm việc BACKEND (endpoint nội bộ) chứ không chỉ frontend. Web không dùng token API ngoài theo kiểu session được.

## 4. Có bản EE để chép không?

**KHÔNG.** Không có thư mục `ee/`, không có package `@plane/*issue-type*` thật trong `node_modules`, không có bản EE trong lịch sử git (git log chỉ cho thấy các commit xoay quanh việc map GitHub type -> label rồi revert về `type_id` native). Toàn bộ UI Issue Type phải **viết mới từ đầu** theo stub interface đã có (đây cũng là mặt tốt: chữ ký hàm/props đã cố định sẵn, chỉ cần điền ruột).

## 5. Feature-flag / gating

- Backend có `Project.is_issue_type_enabled` (mặc định `False`, `apps/api/plane/db/models/project.py:99`) và được phơi ở serializer API ngoài (`apps/api/plane/api/serializers/project.py:93`).
- **Web KHÔNG gate theo cờ này**: project store/`IProject` frontend không mang `is_issue_type_enabled` (grep store = 0). Chỗ duy nhất nhắc tên cờ là icon activity `core/components/common/activity/helper.tsx`. => Cờ KHÔNG chặn UI hiện tại, nhưng nếu bật loại thì nên tôn trọng cờ (và cần thêm cờ vào serializer nội bộ + project store).

---

## 6. Ước lượng công + file cần đụng

### Option A - READ-ONLY (chỉ cho THẤY loại trên work item) - cỡ M (~1-2 ngày, 8-16h)

Backend (nội bộ):
1. Thêm endpoint GET nội bộ list issue-types: `apps/api/plane/app/urls/` + view + serializer (mô phỏng view external đã có ở `plane/api/views` -> đọc lại làm mẫu nhanh).
2. Thêm `type_id` vào `IssueSerializer` (list) `apps/api/plane/app/serializers/issue.py:760` nếu muốn badge hiện trên board/list (peek/detail đã có `type`).

Frontend:
3. Thêm service + mobx store nạp+giữ danh sách loại (mới, đặt ở `apps/web/ce/store/issue-types/` hoặc `core/store`) - gọi endpoint mới ở buoc 1.
4. Cài ruột `IssueTypeIdentifier` (trong `ce/.../issue-identifier.tsx`) và/hoặc nâng `IssueTypeSwitcher` để tra `type_id` -> tên+icon loại rồi render badge cạnh `PROJ-123`.

KHÔNG có UI quản lý, không sửa/xoá, không filter.

### Option B - FULL CRUD (tái hiện tính năng EE) - cỡ L (~1.5-2+ tuần)

Gồm toàn bộ Option A, cộng:
- Trang settings "Work Item Types": route `apps/web/app/.../settings/projects/[projectId]/issue-types/` + thêm entry vào `packages/constants/src/settings/project.ts` + icon.
- CRUD backend nội bộ (POST/PATCH/DELETE) cho issue-types.
- Dropdown chọn loại thật (điền ruột `ce/.../issue-type-select.tsx`) - ổ cắm form đã sẵn ở `form.tsx:396`.
- Filter + applied-filter + group-by theo loại (điền 2 stub filter + logic group-by ở issue-layouts).
- Activity đổi loại (`issue-type-activity.tsx`).
- Nên gate theo `is_issue_type_enabled` (thêm cờ vào project serializer nội bộ + store).
- **Khuyến nghị loại TRỪ** phần "custom issue properties" của EE (thuộc tính động theo loại) - đó là khối lớn nhất, gấp đôi công; giữ MVP là loại + icon + tên.

---

## 7. Đường tối thiểu KHUYẾN NGHỊ (chỉ để THẤY loại)

Làm đúng Option A, ưu tiên đường nhỏ nhất:
1. Backend: thêm 1 endpoint GET nội bộ list issue-types theo project (1 view + 1 serializer + 1 url).
2. Frontend: 1 service + 1 store nhỏ nạp danh sách loại theo project; render badge trong `IssueTypeIdentifier`/`IssueTypeSwitcher`.
3. (Tuỳ chọn) thêm `type_id` vào list serializer để badge hiện cả trên board, không chỉ peek/detail.

Kết quả: loại đã sync (`type_id` native) hiện thành icon+tên trên work item - đủ để mắt thấy, chưa cần trang quản lý. Ước ~1 ngày nếu chỉ peek/detail; +vài giờ nếu muốn cả board.

## 8. Câu hỏi mở / rủi ro

- Icon/màu của loại: model `IssueType` (`apps/api/plane/db/models/issue_type.py`) lưu icon/màu thế nào? Cần đọc để render badge đúng (chưa soi field chi tiết trong khảo sát này).
- Có cần bật cờ `is_issue_type_enabled` cho project để hợp lệ về mặt "được phép dùng loại" không? Hiện web không gate; nếu Nghia muốn theo chuẩn EE thì phải thêm cờ vào serializer nội bộ + project store.
- Endpoint external `/api/v1/issue-types/` có POST sẵn - có muốn tái dùng cho CRUD hay làm endpoint nội bộ riêng cho web (khuyến nghị nội bộ, vì web dùng session cookie chứ không token)?
- Group-by theo loại đụng nhiều layout (list/kanban/spreadsheet/calendar/gantt) - nếu làm Option B, đây là phần dễ phình công, nên khoanh vùng trước.
