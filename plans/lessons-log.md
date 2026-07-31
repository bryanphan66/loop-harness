# Sổ tay bài học & sai lầm

CONTROL bồi đắp mỗi lần vấp. Mỗi mục: triệu chứng -> nguyên nhân gốc -> luật rút ra. Mới nhất trên cùng.

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
