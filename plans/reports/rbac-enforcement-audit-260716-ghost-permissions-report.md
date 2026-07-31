# RBAC Enforcement Audit — elearning-platform (branch videcode-build)

READ-ONLY audit. Câu hỏi cốt lõi: tick thêm quyền cho role → backend có THẬT enforce không, hay "quyền ma"?

## TL;DR (1 dòng)
Cơ chế RBAC **thật và chắc** (guard đọc grant fresh từ Postgres mỗi request, ladder R<W<D<A có test) cho **9/18 feature-area**; **9/18 area còn lại là "quyền ma"** — UI cho tick + seed lưu DB nhưng KHÔNG route nào đọc: `auth, audit_log, learning, refund, crm, leads, classes, affiliate, migration`.

## 1. Nguồn sự thật của quyền
- Danh mục 18 area + 4 tầng: `packages/shared-types/src/index.ts:29` (`FEATURE_AREA_KEYS`), `:75` (`ACCESS_LEVELS = ['-','R','W','D','A']`), ladder order `:156` (`accessLevelOrder`; A=4>D=3>W=2>R=1, suffix `(own)`/`+X` bỏ qua chỉ so ký tự đầu).
- 18 area: auth, rbac, settings, audit_log, course, learning, payments, refund, certificates, email, blog, website, crm, leads, classes, affiliate, reports, migration.
- Decorator: `apps/api/src/common/decorators/require-grant.decorator.ts:18` `@RequireGrant(area, level)`.
- Guard: `apps/api/src/common/guards/permissions.guard.ts:34` — global APP_GUARD, **default-deny** (route không khai posture → 403, `:49-52`); đọc role hiện tại + `module_perms` FRESH từ Postgres mỗi request (`:79-94`, `role-grants.ts:15`), KHÔNG tin JWT claim → sửa quyền có hiệu lực ngay request kế, không cần re-login; SUPERADMIN bypass (`:87`).
- **UI Phân quyền** `apps/web/src/app/admin/roles/page.tsx:242-296`: lặp **toàn bộ** `FEATURE_AREA_GROUPS` (cả 18 area) × 4 tier → tick được cho MỌI role. → Danh sách UI = 18 area, **rộng hơn** tập backend enforce (9).

## 2. Đường lưu quyền (THẬT — đã xác nhận)
UI tick → `bulkSaveGrants` (`apps/web/src/lib/roles-client.ts:57`, `PATCH /roles`) → `roles.controller.ts:41` `bulkUpdate` (`@RequireGrant('rbac','A')`) → `roles.service.ts:70` `bulkUpdateGrants`: validate area hợp lệ (`isKnownFeatureArea`) + trần ADM (BR.IF.09) + chặn hạ chính ADM (self-lockout), ghi cột **`roles.module_perms` (JSON)** trong 1 transaction. Guard enforce đọc **đúng cột đó** → save có thật, không phân mảnh.

## 3. Bảng Resource × (UI / Enforce / Verdict)

| Area | UI tick? | Route enforce @RequireGrant? | Bằng chứng file:line | Verdict |
|---|---|---|---|---|
| rbac | ✓ | ✓ | roles.controller.ts:21/27/34/41; users.controller.ts:26-50 | **THẬT** |
| course | ✓ | ✓ | courses.controller.ts:49-95; chapters/lessons/lesson-assets; delivery/video-delivery.controller.ts:49-110; learning.controller.ts:28-62 | **THẬT** |
| payments | ✓ | ✓ | orders.controller.ts:57-114; me.controller.ts:51 | **THẬT** |
| certificates | ✓ | ✓ | certificates.controller.ts:27/47; certificate-templates.controller.ts:26-71 (A) | **THẬT** |
| email | ✓ | ✓ | automation/email-templates/notifications/segments/ses/tags controllers | **THẬT** |
| blog | ✓ | ✓ | blog.controller.ts:48-129 (R/W/D) | **THẬT** |
| website | ✓ | ✓ | website/*.controller.ts (R/W/D/A) | **THẬT** |
| reports | ✓ | ✓ | reports.controller.ts:27-53 (chỉ R) | **THẬT** (xem F2) |
| settings | ✓ | ✓ (1 route, chỉ R) | settings/integrations-health.controller.ts:18 | **THẬT (mỏng)** |
| auth | ✓ | ✗ | routes profile là `@SelfScope` (me.controller.ts:30-44) — grant không bao giờ đọc | **QUYỀN MA*** |
| audit_log | ✓ | ✗ | chỉ `GET /audit/mine` `@SelfScope` (audit.controller.ts:22); không route đọc audit_log | **QUYỀN MA** |
| learning | ✓ | ✗ | learning routes enforce `course R`, KHÔNG đọc `learning` (learning.controller.ts:28-62) | **QUYỀN MA** |
| refund | ✓ | ✗ | KHÔNG có endpoint refund nào tồn tại | **QUYỀN MA** |
| crm | ✓ | ✗ | không có controller/module | **QUYỀN MA** |
| leads | ✓ | ✗ | không có controller/module | **QUYỀN MA** |
| classes | ✓ | ✗ | không có controller/module | **QUYỀN MA** |
| affiliate | ✓ | ✗ | không có controller/module | **QUYỀN MA** |
| migration | ✓ | ✗ | không có controller/module | **QUYỀN MA** |

`grep '@RequireGrant(' apps/api/src/**/*.controller.ts` chỉ ra 9 area duy nhất: rbac, course, payments, certificates, email, blog, website, reports, settings. Grep 9 area kia trong toàn api/src → **0 match**.

*auth: harmless — profile do `@SelfScope` bảo vệ (mọi user tự sửa hồ sơ mình), nên tick `auth` grant vô nghĩa nhưng feature vẫn chạy đúng.

## 4. "Quyền ma" — câu trả lời chính cho chủ dự án
Tick 9 area sau **lưu DB nhưng KHÔNG có tác dụng** (không route nào đọc):
- **Chưa có backend feature** (data model + seed có, API chưa build): `refund, crm, leads, classes, affiliate, migration` → grant forward-declared cho roadmap. Tick = vô nghĩa cho tới khi dựng controller.
- **Feature CÓ nhưng gác bằng posture KHÁC** (cell matrix gây hiểu nhầm): `learning` (thực chất gác bằng `course R`), `audit_log` (chỉ self-scope /mine), `auth` (self-scope). Đây là loại nguy hiểm hơn: người vận hành tưởng chỉnh `learning=W` cho một role là mở/khoá học tập, nhưng thực tế bị quyết bởi `course`.

## Route enforce nhưng THIẾU/ lệch ở UI
Không có area nào enforce mà thiếu khỏi UI (UI là superset 18 ⊇ 9). Ngược lại thôi.
Lưu ý phi-grant posture (không nằm trong matrix, đúng thiết kế): `impersonation.controller.ts:32` `@RequireRole('ADM','SUPERADMIN')`; helpdesk triage hardcode `isTriageRole = ADM/SUPERADMIN` (`helpdesk-access.ts:12`) — không đọc grant.

## Per-role: seed grant vs enforce (packages/database/prisma/seed.ts:63-157)
- **SUPERADMIN** `{'*':'A'}` — bypass guard (`:87`), không qua matrix. OK.
- **ADM**: full A hầu hết; `reports A+X`, `migration R`, `learning R`, `audit_log R`. Enforce: các area A (course/payments/certificates/email/blog/website/rbac/settings) đọc thật. `refund A / crm A / leads A / classes A / affiliate A / migration R / audit_log R / learning R` = **grant chết** (không route). Là **trần BR.IF.09** cho mọi role → trần trên area chết cũng chết theo.
- **COO/LDR/SAL/KET**: phần lớn grant rơi vào crm/leads/classes/affiliate/refund/audit_log/reports → **đa số là grant chết**; chỉ `reports R(+X)`, `payments R` (COO/KET) là enforce thật. KET `payments R` → list/export/detail đơn: THẬT.
- **MKT**: `email A, course W, blog W, website W` = enforce THẬT; `reports R(mktg)` thật.
- **STU**: `course R(enr/pub)` thật; `payments R(own)` thật (me/orders own-scope trong service); `certificates R(own)` thật; **`learning W(own)` = chết** (learning route đòi `course R`, STU có course R nên vẫn ghi được progress — nhưng tier W của learning vô nghĩa).
- **AFF**: chỉ `affiliate W(own)` → **toàn bộ quyền chết** (không có affiliate API). AFF thực tế chỉ còn auth self-scope.
- **GV/BTC**: `course R(own)` thật; `classes A` **chết**; `certificates A/R` thật (certificate-templates đòi A — GV/BTC không có certificates A đủ, chỉ R(own)).

## 5. Route nhạy cảm — kiểm mẫu
| Hành động | Route | Tier yêu cầu | Khớp ý nghĩa? |
|---|---|---|---|
| Xóa khóa học | courses.controller.ts:85 `remove` | `course D` | ✓ Xóa=D |
| Xóa user | users.controller.ts:50 `remove` | `rbac D` | ✓ |
| Sửa/publish khóa học | courses.controller.ts:55/76 | `course W` | ✓ publish=W |
| Sửa grant role (Phân quyền) | roles.controller.ts:21-41 | `rbac A` | ✓ manage-access=A |
| Cấu hình site/template cert | site-config.ts:31-58 / certificate-templates.ts:26 | `website A` / `certificates A` | ✓ configure=A |
| Manual-confirm đơn | orders.controller.ts:114 | `payments W` | ✓ (KET R không confirm được) |
| **Export CSV đơn/report** | orders.controller.ts:65 / reports.controller.ts:34-56 | **`payments R` / `reports R`** | **✗ xem F2** |

Test authz: `common/guards/authz-default-deny.spec.ts` cover đầy đủ — 401 chưa auth, 403 under-privileged, 403 route quên annotate (fail-closed), ladder R<W<D<A (`:246-309`), tier tĩnh (delete=D, publish=W `:331-343`), và static audit "mọi route khai posture" nhưng **chỉ trên 11 controller liệt kê tay** (`:346-358`) — không phải toàn bộ.

## Findings
- **F1 (chính) — 9 quyền ma / 18 area.** UI + seed cho 9 area không route nào enforce. 6 là feature chưa build (chấp nhận được nếu roadmap), 3 (`learning/audit_log/auth`) là feature CÓ nhưng gác bằng posture khác → cell matrix đánh lừa người vận hành. Không có route nào cấp quyền LẬU do việc này (fail-closed), nhưng "tick để trao quyền" **không có tác dụng** ở 9 area.
- **F2 — Export gác ở R, không phải A.** Legend (`index.ts:64-73`) nói export ∈ A, surface qua marker `+X`; nhưng `orders/export` và `reports/*?format=csv` chỉ đòi **R**. Marker `+X` trong seed (`reports A+X`, `KET R+X`, `COO R+X`) là **trang trí — không route nào đọc**. → Bất kỳ ai có `payments R` / `reports R` đều export được. Cố ý theo comment code ("read-level, so KET can export") nhưng **mâu thuẫn model "Export=A"** chủ dự án nêu.
- **F3 — Gap gate fidelity.** Không test nào assert "mọi area UI phải có ≥1 route enforce" → quyền ma lọt lưới. Static posture audit chỉ chạy trên 11/‾30 controller (hard-code danh sách), không auto-discover.

## Kết luận
Phân quyền đã "ăn" đủ và enforce **chắc** cho 9 area có feature (rbac, course, payments, certificates, email, blog, website, reports, settings) — guard fresh-read, ladder đúng, default-deny, có test. **Lỗ = 9 area quyền ma** (nổi cộm: learning/audit_log/auth gác bằng cơ chế khác nên cell matrix gây hiểu nhầm; refund/crm/leads/classes/affiliate/migration chưa có API) + **export bị gác R thay vì A** (marker +X vô nghĩa).

## Unresolved
1. 6 area chưa-có-API (refund/crm/leads/classes/affiliate/migration) là roadmap cố ý hay bug thiếu? → cần chủ dự án xác nhận: ẩn khỏi matrix cho tới khi build, hay để forward-declared.
2. Export=R hay Export=A là quyết định business? Code cố ý R (để KET export); model chủ dự án nói A. Cần chốt: có phải nâng export lên đòi `+X`/A không.
3. `learning` grant nên (a) bị route learning enforce thật, hay (b) gỡ khỏi matrix vì đã gộp vào `course`? Hiện là ghost gây nhầm.
