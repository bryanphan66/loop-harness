# Audit: gọn harness rules (slim + progressive disclosure)

Advisory. KHÔNG đụng file rule nào. Mỗi mục chờ Trung duyệt (keep / gộp / chuyển-skill) rồi mới sửa. Ngày 2026-07-28.

## Bối cảnh
`~/.claude/rules/` = **950 dòng / 11 file, nạp vào MỌI session** (always-on). Theo bài "context engineering for Claude 5": model mới phán đoán tốt hơn, over-constrain gây (a) lãng phí token, (b) mâu thuẫn nội bộ model phải cân nhắc. Mục tiêu: cắt ~65-70% always-on mà KHÔNG mất "gotcha" thật.

Cơ chế: rule trong `~/.claude/rules/` bị nạp thẳng vào system prompt. Muốn "progressive" (nạp khi cần) thì phải **chuyển nội dung thành 1 skill** (gọi qua Skill tool) hoặc file @-reference. "Gộp" = trộn nhiều file chồng lấp thành 1 file lean.

## Bảng verdict từng file

| File | Dòng | Verdict | Lý do |
|---|---|---|---|
| review-audit-self-decision | 82 | **KEEP** | Gotcha thật: chống đảo quyết định đã verify, scout-first, guard user decision. Chi phối cách xử lý mọi session. |
| aggressive-skill-routing | 35 | **KEEP (rút)** | Giữ nguyên tắc "route mạnh"; bỏ phần reflex-map chi tiết, trỏ sang skill-picker. |
| CLAUDE.md (rules/) | 93 | **TRIM ~40** | Giữ: hook privacy-block protocol + python venv path + role 1 câu. Bỏ: mô tả lại workflow (trùng file khác). |
| reno-deploy-workflow-standard | 96 | **TRIM ~25** | Giữ nguyên tắc verify-at-source + bẫy PAT + anti-patterns. Chuyển bảng adoption-ladder per-repo -> skill deploy. |
| development-rules + primary-workflow + orchestration-protocol | 52+65+111 | **GỘP -> ~60** | Chồng lấp nặng (đều tả build/delegate/document). Gộp lean: giữ YAGNI/KISS, no-fake-data, subagent status protocol (DONE/BLOCKED), context-isolation. Bỏ: template prompt dài, câu hiển nhiên. |
| skill-domain-routing + skill-workflow-routing | 154+52 | **-> SKILL** | Bảng tra intent->skill thuần reference. Không cần always-on; nạp khi model cần chọn skill (đã có skill `find-skills`). |
| team-coordination-rules | 90 | **-> SKILL** | File tự ghi "chỉ áp khi ở Agent Team; vô hiệu ở session thường". Nạp khi vào team mode. |
| documentation-management | 120 | **-> SKILL** | Cấu trúc plan/phase-file, roadmap/changelog. Chỉ cần khi planning/documenting. |

## Kết quả ước tính
Always-on: **~950 -> ~265 dòng (cắt ~72%)**. Phần chuyển-skill (~516 dòng) vẫn dùng được, chỉ nạp đúng lúc.

Giữ always-on (lean core ~265):
- review-audit-self-decision (82)
- 1 file "build-and-delegate" gộp mới (~60)
- reno-deploy TRIMMED (~25)
- CLAUDE.md TRIMMED (~40)
- aggressive-skill-routing rút (~20)
- (memory index + explain-terms + diacritics + avoid-ai-chars feedback rules giữ nguyên, nhỏ)

## Xung đột cần Trung dứt điểm (đúng loại bài nêu)
1. **aggressive-skill-routing** ("route mạnh, đừng tự làm") vs **development-rules YAGNI** ("việc vặt làm thẳng"). Đề xuất 1 câu duy nhất: "match domain skill VÀ non-trivial -> route; việc vặt/1-edit -> làm thẳng." (File aggressive vốn đã có guardrail này, chỉ cần dedupe.)
2. **"dùng code-reviewer agent sau MỖI lần code"** (development-rules + primary-workflow) vs judgment/token. Đề xuất: "review trước khi merge/PR hoặc khi thay đổi rủi ro - không máy móc sau mỗi edit."
3. **documentation-management "MUST update roadmap/changelog sau mỗi feature"** vs "đừng đẻ doc trung gian nếu không được yêu cầu". Đề xuất: cập nhật doc ĐÃ CÓ khi thay đổi user-facing; đừng mint file doc mới theo phản xạ.

## Cách thực thi (chờ duyệt)
- Đây là **rule GLOBAL** (mọi dự án) do Trung tự đặt -> tôi KHÔNG tự cắt. Duyệt xong từng mục tôi mới sửa.
- Caveat: theo CK rule, không sửa `~/.claude/skills` trực tiếp -> skill mới tạo trong working dir hoặc cần Trung đồng ý sửa global.
- Thứ tự đề xuất làm khi duyệt: (1) chuyển 3 nhóm -> skill (thắng lớn, ít rủi ro: routing-tables, team-coord, docs-mgmt = 416 dòng), (2) gộp 3 file workflow, (3) trim reno-deploy + CLAUDE.md, (4) dứt 3 xung đột.

## Unresolved
- Có nên update CC 2.1.204 -> 2.1.220 để lấy /doctor xịn (tự rightsize) trước khi làm tay không? (song song, không chặn audit).
- 3 skill mô tả > 512 ký tự (dataviz/claude-api/update-config): doctor khuyên để nguyên (raise cap tốn 10k token). Đồng ý giữ nguyên?
