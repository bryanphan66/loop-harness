# Sổ tay bài học & sai lầm

CONTROL bồi đắp mỗi lần vấp. Mỗi mục: triệu chứng -> nguyên nhân gốc -> luật rút ra. Mới nhất trên cùng.

## 2026-07-31 → 08-02 — đợt audit-dọn loop-harness (6 lần rà: top-level · playbook · template · stack · docs · phân-khu-zone)

**L14 - Vouch 1 gate/doc "có răng thật" thì phải đọc CẢ header-trạng-thái + verify artifact trên filesystem — đừng tin prose tự-tin.**
Digest gate `visual-fidelity.md` tôi đọc từ dòng 185 (thân), BỎ header 1-52 -> vouch "mỗi U-class wired 1 lint thật, dogfood". Đo lại: **6/9 lint `check-*.mjs` KHÔNG tồn tại** (elearning `lint:gates` thật chỉ chạy 3), và header 3-15 ĐÃ ghi rõ "SPECIFIED, NOT YET SHIPPED" — tôi bỏ qua. Prose viết `a lint (check-X.mjs, lint:gates) fails` ở thì hiện tại đọc y như đang chạy nhưng là aspirational (mô tả thứ mong-có).
-> Luật: trước khi khẳng định 1 gate/doc "có răng chặn thật": (a) **đọc từ ĐẦU file** — doc dạng gate hay mang khối "Enforcement/Status" ở đầu phủ định phần thân; đọc-giữa-chừng = vouch nhầm. (b) mỗi lần doc viện dẫn 1 artifact chấp-hành (script/lint/test/hook), **grep filesystem xác nhận nó tồn tại + THỰC SỰ được wire** (VD đọc `lint:gates` trong `package.json`), đừng suy từ giọng văn. **"present-tense trong doc" ≠ "đang chạy".** Nối L13: blind-spot doc là drift/aspirational-đội-lốt-proven; người-audit tự nhân bản lỗi khi đọc thiếu + tin prose. Fix đúng = doc trung thực NGAY (hạ nhãn PLANNED) + queue eng thật thành issue, KHÔNG bịa "đã xong".

**L13 - Soi "thừa" trên doc đã-ổn định thường lòi ra THIẾU / DRIFT, không phải phình — hướng-fix là THÊM, không cắt.**
Đợt phân-khu (mở từng zone harness để học) chạy soi-thừa 2 lần trên vùng tưởng "lộn xộn/phình": (1) `STRUCTURE.md` index bỏ sót 3/14 file loose -> `ls docs/` nhìn "loose lộn xộn" thực ra là **index chưa phủ**, không phải cần foldering; (2) `scripts/README.md` kể THIẾU 3 tính năng chặn code đã có (test-suite-on-push, chặn register 0-dòng, self-check fail-closed khi hooksPath drift) -> C7 vi phạm ngay trong doc của chính cổng. Cả 2 lần: doc kể THIẾU so với thực tế -> sửa = **bổ sung cho khớp**, không cắt.
-> Luật: khi nghi 1 zone "phình/lộn xộn", đo 2 blind-spot TRƯỚC khi nghĩ tới cắt/foldering: **(a) index-coverage** (mọi file/tính năng có được liệt kê đúng?) + **(b) doc↔code drift** (mô tả có khớp code/hành-vi thật?). Foldering/cắt = bản-năng sai; phủ-index + đồng-bộ-doc = fix thật. Nối tiếp L12: không chỉ "không phình" mà hướng ngược = THÊM. Phản-ví-dụ chuẩn C1 để soi các file dùng-chung: `design-system/design-rules.md` (0 rò tên dự án, thuần structure/behavior, có version-pin) = mức mọi artifact "giống hệt mọi dự án" phải đạt.

**L12 - Nghi "phình / thừa / chấp vá" thường SAI — ĐO, đừng cắt theo cảm giác.**
Cả đợt nghi harness phình nhiều lần (big-refactor mọi file · 26 playbook unproven · 6 meta-doc). Đo thật: **3/4 lần "không phải"** — playbook/template/stack phân-chia trách-nhiệm kỷ luật; grep OVER-COUNT (đếm chuỗi không hiểu ngữ cảnh: "control-plane" khớp "plane", CHANGELOG cite nơi dogfood, `First use: elearning` = nhãn-bằng-chứng hợp lệ); gate 500 dòng = mỗi dòng 1 leg nghiệm thu THẬT (đặc, không verbose). Chỉ **1 lần ĐÚNG** = cụm explainer TÔI vừa đẻ (chép sơ-đồ/bảng/thứ-tự qua lại).
-> Luật: **đóng RUBRIC (mã hoá thước đo, VD `DOC-STANDARD.md` C1-C10) → scout ĐẾM → read-audit ĐỌC (tách vi-phạm-thật khỏi false-positive-grep/ví-dụ-có-nhãn) → người duyệt TỪNG cái → sửa scoped + verify.** 3 TRỤC đừng lẫn: **dedup** (trùng file khác?) · **necessity** (bước/flow ĐÃ-định-nghĩa cần nó? — load-bearing thì GIỮ dù unproven) · **provenance** (dùng thật chưa?). Bảo thủ với đồ cũ-đã-verified; **NGHI TRƯỚC đồ MÌNH vừa thêm** (auditor's own additions = nguồn accretion số 1) + giao mắt độc-lập (subagent) né bias-bảo-vệ. Format-only (tách bullet/xuống đoạn) an toàn cả với verified; đổi CHỮ thì dừng ở ranh giới verified. Code đã-dogfood: toolchain chặn dead-code/unused-import → chỉ soi vùng-MÙ (unused-deps trong package.json · doc↔code drift · env-doc 2 chiều · version-pin drift).

**L11 - 1 rule = 1 owner (DRY): doc phình vì LẶP nội-dung giữa file, KHÔNG phải file thừa.**
Audit đọc-hết: 0 file cần xoá, nhưng ~14KB TRÙNG (changelog nhồi vào HARNESS.md, cùng 1 flow/luật ở 3 nơi). File khác chỉ **TRỎ** tới owner, không chép lại. Thêm doc mới đừng restate cái file khác đã sở hữu (chính tôi vi phạm nhiều lần: chép sơ-đồ 2-mode ×3, bảng 4-kho ×4). Gom-về-1-nguồn thì mạnh tay; xoá FILE thì bảo thủ (chỉ trùng/chết thật đã verify).

**L10 - Self-containment + ranh giới product ⟂ workshop.**
Cây CÀI-ĐƯỢC (`harness/`) TUYỆT ĐỐI không `../../` ra ngoài chính nó (link chết khi cài vào dự án khác). Root = **workshop** (`plans/` chứa lessons-log/reports của harness; `.claude` phiên-dev = gitignore); `harness/` = **product** tự-đủ. Tri thức "cho dự án" (VD lessons-log của dự án) = 1 **template** trong cây; "của chính harness" = `plans/`.

**L9 - Discovery của kho "gặp gì mở nấy" = trigger + index, KHÔNG phải tên file.**
Tìm đúng playbook nhờ dòng **"When To Run"** trong mỗi file + **index nhóm-theo-domain** (README/KEYWORD-MAP), KHÔNG phải prefix tên (`ba-`/`qa-`): đổi tên = churn phá ref, lợi ít vì agent đọc index/pointer chứ không `ls`. Đừng đồng-phục-hoá trigger — biến-thể chính xác (`When To Fork`/`Compose`/`It Applies`) tốt hơn generic; grep `When` vẫn ra hết.

## 2026-07-28

**L8 - Pre-push gate flaky (test integration redis/BullMQ).**
Pre-commit chạy `validate` (gồm test) PASS, nhưng pre-push chạy lại cùng bộ test lại FAIL 1 lần rồi push lại là xanh. Có test integration real-redis/BullMQ phụ thuộc timing.
-> Luật: docs/script-only mà pre-push đỏ ở test integration thì **retry push 1-2 lần** trước khi nghi lỗi thật; đừng bypass gate. Cần dọn flaky test riêng (debugger đã flag "dev CI quality-gate fail lặp lại" = pre-existing).

**L7 - Harness đang over-constrain (bài context-engineering Anthropic).**
Model mới (Opus 4.8/5, Fable 5) phán đoán tốt hơn; Anthropic bỏ hơn 80% system prompt Claude Code không giảm eval. Harness của ta (CLAUDE.md khổng lồ + nhiều rule + WORKFLOW dài) là kiểu nhồi-hết-lên-đầu.
-> Luật: CLAUDE.md/WORKFLOW nhẹ + gotcha; chi tiết đẩy sang skill/script/test (reference nạp đúng lúc); để agent tự phán đoán; ưu tiên reference-dạng-code hơn văn xuôi. Gõ /doctor để soi quá tải. Không tự cắt quyết định đã chốt.

**L6 - Plane Page: API không đọc/ghi được, TRỪ page đã publish.**
Public API v1 (X-API-Key) không có endpoint pages (404); internal API cần cookie web (401). Kể cả key đúng workspace.
-> Nhưng page **publish (Spaces)** đọc được: `GET /api/public/anchor/<anchor>/pages/` trả `description_html`. Ghi thì vẫn không. Nên tri thức CONTROL cần cập nhật phải ở file repo; Plane Page chỉ để người đọc, chia sẻ cho CONTROL bằng link /spaces/.

**L5 - Chart rỗng = lỗi CSS render, KHÔNG phải data (issue #239).**
KPI "Học viên mới=20" nhưng biểu đồ tuần rỗng. Review code tĩnh (TS + query) thấy đúng hết, tưởng mâu thuẫn. Thực ra bar có `height:N%` nhưng ô cha `.col` bị co bằng nội dung (flex-end) -> `%` không có gốc -> mọi bar 0px bất kể data.
-> Luật: lỗi "rỗng/không hiển thị" ở UI phải ĐO trên trình duyệt thật (headless-chromium), review code tĩnh không bắt được lỗi layout CSS. Data-fix đúng vẫn có thể bị chặn ở tầng render.

**L4 - QC fail: happy-fail vs ngoài-AC (luật vàng).**
Rối vì lúc tạo issue mới (#213->#260), lúc lùi In Dev (#239).
-> Luật DUY NHẤT: lỗi trong AC của issue -> lùi In Dev sửa issue cũ; lỗi ngoài AC -> issue mới (issue cũ đi tiếp độc lập). Bỏ cách phân "happy vs biên".

**L3 - Auto-close nằm ở COMMIT MESSAGE, không chỉ PR body (issue #225).**
Sửa PR body `Closes`->`Refs` vẫn bị đóng nhầm khi merge, vì commit của coder ghi `Closes #225`; squash-merge gộp commit body -> auto-close.
-> Luật: `Refs`/`Part of` phải áp cho CẢ commit message; trước khi merge PR cũ, grep commit message (`gh api .../commits/<sha> --jq .commit.message`) tìm keyword đóng.

**L2 - Gate elearning fail vì worktree mới thiếu node_modules.**
Pre-commit chạy full `validate` (lint+typecheck+test+build); worktree mới -> `eslint: not found` -> gate đỏ, không được bypass.
-> Luật: commit tài liệu/script nhỏ từ **checkout chính** (đã có deps) trên branch off dev; nếu typecheck thiếu export của `@nhat-nghe/database` thì rebuild nó trước (`pnpm --filter @nhat-nghe/database build` -> làm mới `out/`).

**L1 - Verify-at-source bằng SHA container, không tin CI xanh.**
-> Sau deploy staging: SSH vps02, `docker ps` tên container `elearning-web-web-<sha>` phải == dev HEAD. Health `commitSha`="unknown" vô dụng. CI xanh / HTTP 200 không đủ.
