# QC 49 F-XXX (register features) - bản đồ đầy đủ PASS/FAIL

**Ngày:** 2026-08-06 · **Repo:** RenoAI-Labs/elearning-platform · **Verify-at-source:** container staging == `origin/dev` HEAD (`521eaa65` -> `46af731`), fail-closed.

## Con số (ĐÃ SỬA)

Con số "87% FAIL" báo giữa chừng là **SAI do lỗi classifier** (chỉ bắt chuỗi "ALL PASS", bỏ sót verdict viết "PASS 4/4", "PASS toàn bộ"...). Đọc lại verdict header thật cả 49:

| Kết quả | Số | Tỷ lệ |
|---|---|---|
| **PASS** (all AC pass, đề xuất Ready for UAT, body đã tick) | **24** | 49% |
| **FAIL** (>=1 AC defect, giữ lại - loop dev fix) | **24** | 49% |
| **Borderline** (#113: 5/6 pass, AC3 Google login không QC được trên staging, không thấy defect) | **1** | 2% |

Gần 50/50 - không phải thảm hoạ, nhưng **một nửa register-feature chưa đạt chính AC của nó** (đúng giá trị của việc QC: bắt trước khi UAT tay).

## PASS (24) - đã tick body, giữ Ready for UAT
111, 115, 116, 119, 120, 122, 125, 126, 129, 130, 133, 134, 136, 137, 138, 142, 146, 147, 148, 151, 153, 156, 157, 213

## FAIL (24) - gom theo nhóm defect

**A. Thiếu control lọc/tìm/sắp xếp trên UI (quick-win, thuần frontend):**
- #144 - AC3 lọc phễu theo ngày + khóa: UI chỉ 1 dropdown, thiếu bộ lọc kép.
- #145 - AC4 thiếu control "lọc" (mọi thứ khác pass).
- #155 - AC3 không có ô tìm kiếm tên tính năng.
- #128 - AC1 danh sách: cột đủ nhưng sort ngày/tiền hỏng.
- #152 - AC1 thiếu 1 cột bắt buộc.
- #150 - AC5 blog phân trang: URL đúng nhưng scheme phân trang lỗi.

**B. RBAC / phân quyền:**
- #114 - RBAC động vs enum tĩnh, guard đọc lại role.
- #139 - 5/5 AC chức năng PASS nhưng 1 ô rủi ro phân quyền FAIL (gửi lại người đã gửi).
- #131 - AC4 cert đã cấp không được sửa (cần chặn mutate).
- #143 - cần quyền reports:A (admin@ bị chặn, phải superadmin@).

**C. Media / video / email (một phần có thể do staging media-gap, cần phân biệt code-bug vs môi trường):**
- #117 - AC1/AC2 upload video hỏng lõi: R2 uploadId 343 ký tự > schema max(300) -> 422. (CODE BUG thật.)
- #118 - video không phát trên Chromium/Firefox staging (nghi codec/media-gap - cần xác minh).
- #135 - AC4 tên người gửi email hỏng.

**D. Config / hạ tầng / NFR:**
- #110 - AC4 Swagger `/api/docs` 404 (NODE_ENV=production tắt, AC đòi staging bật).
- #154 - AC3 `/health` không phản ánh đúng DB+Redis+commitSha.
- #112 - AC3 thiếu lệnh revert migration (Prisma up-only).
- #121 - AC1 SSR+SEO pass nhưng tải trang > 2s@4G (perf).

**E. Logic tính năng thiếu/sai:**
- #123 - AC2 mobile: dàn bài không thu gọn được.
- #124 - AC liên quan phiên/token.
- #127 - AC3+AC4 lỗi trong AC.
- #132 - 2/4: AC2 fail, AC3 happy-path không kiểm được trên staging.
- #140 - AC2 dòng log truy vấn/lọc theo NCC.
- #141 - AC1 banner + thu hồi + số người nhận.
- #149 - AC1 giới hạn ảnh 2MB thay vì 5MB; AC2 thiếu.

## Đề xuất đợt fix
1. **Nhóm A (thiếu lọc/tìm/sort/cột)** = quick-win frontend, gom 1 lứa loop dev nhiều issue song song (mỗi worker 1 issue, worktree riêng).
2. **Nhóm C** phân biệt trước: #117 chắc chắn code-bug (fix ngay); #118 xác minh media-gap (nếu do staging thiếu media thì không phải bug, theo policy "để nguyên").
3. **Nhóm B (RBAC)** cần cẩn thận - phân quyền nhạy cảm, review kỹ.
4. **Nhóm D**: #110/#112/#154 là NFR/config - quyết định BA (vd Swagger có cần bật staging không; migration revert có đổi AC sang forward-only + restore-from-backup không).

## Câu hỏi chưa chốt
- #118 (video không phát): code-bug hay staging media-gap? Cần xác minh trước khi loop.
- #112/#110/#154: một số AC là quyết định NFR/BA (revert migration, Swagger-on-staging) - cần chốt hướng trước khi "fix".
- #113: AC3 (Google OAuth login) không QC được trên staging qua OTP - human check thủ công hay chấp nhận UAT.
