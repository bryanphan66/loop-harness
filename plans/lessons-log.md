# Sổ tay bài học & sai lầm

CONTROL bồi đắp mỗi lần vấp. Mỗi mục: triệu chứng -> nguyên nhân gốc -> luật rút ra. Mới nhất trên cùng.

## 2026-08-02

**L14 - File do CHÍNH auditor mới tạo = nguồn accretion số 1.**
Cả session 3 lần nghi-phình playbook đo ra "không phải" (L10/L12/L13). Nhưng nghi-phình cụm 6 meta-doc onboarding lại LÀ THẬT (chép sơ-đồ 2-mode ×3, bảng 4-kho ×4, thứ-tự-đọc ×4) — vì 5/6 file đó tôi vừa đẻ 3 ngày trước.
-> Luật: **audit đồ MÌNH vừa viết NẶNG TAY nhất + giao mắt độc lập (subagent) để né bias-bảo-vệ.** Đồ cũ-đã-verified thì bảo thủ; đồ mình-mới-thêm thì NGHI TRƯỚC. (Cụm docs explainer dễ đẻ trùng hơn code/playbook vì không có toolchain/step chặn.)

**L13 - "unproven / experimental" KHÁC "thừa" — đo bằng 3 trục, load-bearing-check TRƯỚC.**
Nghi ngờ: 26/34 playbook là `experimental · First use TBD · Verified none` (chưa từng chạy dự án thật) -> "chấp vá thừa, tôi bảo cần hết là over-claim". Nghi CHÍNH ĐÁNG (ép test cái tôi bỏ sót), nhưng necessity-audit cho ra: **25 GIỮ · 1 HẠ-CẤP · 0 CẮT.** Vì mỗi playbook **SỞ HỮU đúng 1 bước WORKFLOW đã định nghĩa** (WORKFLOW/gate/CONTEXT_RULES trỏ thẳng); "unproven" = bước đó chưa có dự án chạy tới (elearning mới chạy Mode-B/build/deploy, chưa chạm full Macro-1 + non-CRUD infra), KHÔNG phải rác. Cắt = phá công thức của 1 bước quy trình.
-> Luật: phân biệt **3 TRỤC riêng, đừng lẫn**: (a) **dedup** — có trùng file khác? (b) **necessity** — có bước/flow nào ĐÃ ĐỊNH NGHĨA cần nó? (c) **provenance** — đã dùng thật chưa? File **unproven (c) NHƯNG load-bearing (b) -> GIỮ**. Đo necessity = **LOAD-BEARING CHECK TRƯỚC** (grep WORKFLOW/gates/CONTEXT_RULES/STAGE_GOALS trỏ tới nó -> giữ dù chưa chạy), CHỈ xét cắt khi vừa-không-ai-trỏ vừa-speculative/meta-về-meta. Ứng viên cắt thật hiếm: file **tự cãi sự tồn tại** (`playbook-composition-pattern` viết "đừng pre-build meta-playbook" -> chính nó speculative) = hạ-cấp gộp vào owner. **Đây là lần thứ 3 một "nghi phình" đo ra "không phải"** (L10 dedup 0-xoá · L12 grep-noise · L13 unproven≠thừa) -> mặc định: nghi phình thì ĐO 3 trục, đừng cắt theo cảm giác.

**L12 - "Big-refactor vào từng chữ mọi file" thường là over-engineer dựa trên NHIỄU grep, không phải vấn đề thật.**
Yêu cầu: đại-phẫu doc harness (per-repo lọt vào playbook, dài dòng, trùng). Cảm giác = phải sửa từng chữ 101 file. Đo thật thì ngược lại: grep báo ~100 "vi phạm C1" nhưng đọc ra **~3-4 thật**; phần lớn là NHIỄU — `control-plane` (regex khớp "plane"), CHANGELOG cite nơi dogfood (hợp lệ), header `First use: elearning` + war-story dán nhãn (đúng chuẩn C1/C7). Gate dài 500 dòng = mỗi dòng 1 leg nghiệm thu THẬT (đặc, C10 giữ), không phải verbose. Kết cục cả "big-refactor" = **4 sửa nhỏ (1 C2-leak + 1 generic-hoá + 1 format-only + để-nguyên 1), 0 rewrite.**
-> Luật: **TRƯỚC big-refactor: (1) đóng RUBRIC (thước đo mã hoá, VD DOC-STANDARD C1-C10) -> (2) scout ĐO -> (3) read-audit ĐỌC tách "vi phạm thật" khỏi "ví-dụ-có-nhãn/false-positive grep" -> (4) người duyệt TỪNG cái -> (5) sửa scoped + verify.** KHÔNG rewrite mù theo cảm giác. **grep OVER-COUNT** (đếm chuỗi, không hiểu ngữ cảnh) -> luôn đọc xác nhận trước khi gọi là "vi phạm". Mỗi sửa gắn 1 mã chuẩn; không gắn được -> để nguyên. Format-only (tách bullet, xuống đoạn) an toàn cho cả nội-dung-đã-verified; đổi CHỮ thì dừng ở ranh giới verified (C10).

**L11 - Discoverability của kho "gặp gì mở nấy" nằm ở TRIGGER + INDEX, KHÔNG ở tên file.**
34 playbook "mở khi cần" chỉ chạy được nếu TÌM đúng cái lúc gặp tình huống. Cám dỗ: thêm prefix taxonomy vào tên (ba-/build-/qa-/infra-) cho "dễ nhận biết". Phản biện + bác: (1) churn cao — đổi tên 34 file phá refs ở WORKFLOW/CONTEXT_RULES/gates/cross-ref/2 index = đúng "chấp vá cải tổ" đang dọn; (2) lợi ít — agent KHÔNG `ls` thư mục, nó đọc README index hoặc bị WORKFLOW/CONTEXT_RULES TRỎ thẳng tới 1 file; prefix chỉ giúp người-lướt-ls. Taxonomy đã sống ở INDEX (README nhóm theo domain + KEYWORD-MAP §F), nhân đôi vào tên file = trùng.
-> Luật: **discoverability = (a) dòng trigger "When To Run" trong mỗi file + (b) index nhóm-theo-domain; KHÔNG phải prefix tên file.** Cải thiện discovery = vá cho ĐỦ trigger (thêm dòng, không đổi tên, 0 phá ref), nuôi index — KHÔNG rename hàng loạt. **Đừng đồng-phục-hoá trigger:** biến thể chính xác (`When To Fork`/`When To Compose`/`When It Applies`/"Use when") TỐT HƠN "When To Run" chung chung — grep `When` vẫn ra hết. Phụ: **audit "thiếu" phải dùng grep pattern CHẶT** — pattern lỏng (`When To|## When|Mở khi`) đếm nhầm "9 thiếu" trong khi thực tế là 9-thiếu-hẳn + phần-còn-lại-dùng-biến-thể; verify lại bằng token đúng.

## 2026-07-31

**L10 - Audit dọn cấu trúc TOÀN repo: chấp vá tập trung ở RANH GIỚI + rìa, KHÔNG ở nội dung lõi.**
Rà hết loop-harness (top-level files, 34 playbook, ~50 template, code stack 154 file, .claude+scripts, cấu trúc repo). Kết quả nhất quán: **0 file nội-dung-lõi trùng/xoá** (playbook/template/stack đều phân-chia-trách-nhiệm kỷ luật; "cặp nghi trùng" hầu hết là biên-giới CÓ CHỦ Ý — 2 closure-story = ACCEPTANCE vs HANDOVER, design-3-tier vs contract = Tier-1 vs Tier-2/3, locale-vi = fork D4). Chấp vá thật chỉ nằm 3 chỗ: (a) file onboarding top-level thừa (xoá 3), (b) **RANH GIỚI product/workshop bị rò**, (c) rìa: naming HOA-lẫn-kebab, index thiếu dòng, SKELETON_PATHS có entry chết `STAGE.md`, import value type-only.
-> Luật rút ra:
1. **Self-containment:** một cây CÀI-ĐƯỢC (`harness/`) TUYỆT ĐỐI không `../../` ra ngoài chính nó (đang rò tới `../../docs/lessons-log.md` → link chết khi cài vào dự án). Artifact "cho dự án" = 1 **template** trong cây; artifact "của chính harness" (lessons-log/team-playbook) = **workshop** ở `plans/`. Root = workshop, `harness/` = product; `.claude` phiên-dev phải gitignore.
2. **Code đã-dogfood cần audit KHÁC doc:** toolchain (lint/tsc/build green) đã chặn dead-code/unused-import → soi vùng toolchain MÙ: unused **deps** trong package.json, doc↔code drift (changelog vs file), env-doc 2 chiều, version-pin drift giữa package.json. (2 nit thật lộ ra: `import { Request } from 'express'` type-only nhưng value-import + `express` chỉ khai transitive → `import type`; FFMPEG_PATH đọc mà thiếu .env.example.)
3. **Bảo thủ khi xoá, phương pháp = scan(tên+ref-count) → cluster → subagent đọc HẾT → verify từng nghi vấn.** "Nghi trùng" trong codebase kỷ luật thường là biên-giới chủ ý; đừng xoá theo cảm giác. Load-bearing đo bằng ref-count (TEST_MATRIX 8 ref, ROLE_MAP 6 ref = giữ; nhưng file lb=0 vẫn có thể hợp lệ vì được COPY vào dự án chứ không cần máy-móc ref tên).

**L9 - Doc knowledge-base phình vì LẶP NỘI DUNG giữa file, không phải vì file thừa.**
Audit de-dup (1 subagent đọc HẾT 35 playbook + doc top): **0 file cần xoá** — mọi playbook distinct (mỗi cái sở hữu 1 bước macro / phân-tầng có chủ đích). Nhưng ~14KB TRÙNG: HARNESS.md nhồi nguyên changelog history (−43% khi cắt), prototype-fidelity evidence ở 2 nơi, 3-macro flow ở 3 nơi, 10-state+luật-vàng ở 3 nơi, luật label ở 2 nơi. Còn 1 chỗ STALE (changelog v6.22 ghi "5-label set" đã bị thay 2026-07-24 mà không có entry ghi nhận) + index thiếu 2 dòng.
-> Luật: **1 rule = 1 owner (single source of truth); file khác TRỎ tới, không chép lại.** Khi thêm doc mới đừng restate cái file khác đã sở hữu (chính tôi vi phạm: `github-issue-standard` chép lại label rule của `feature-issue-ac-demo`). Đánh giá "thừa" phải ĐỌC nội dung (subagent), không xoá theo tên. Định kỳ chạy dedup-audit khi kho doc lớn. Bảo thủ khi XOÁ file (chỉ cắt trùng/chết thật đã verify), mạnh tay khi gom-về-1-nguồn.

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
