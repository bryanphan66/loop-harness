<!--
TEMPLATE: prototype-build-prompt.md — Step 1.12 board-mode build prompt (TRIAL engine)
Used by: Designer at step 1.12 when the chosen engine is "Claude Code + taste skill" (the
  external-tool path does NOT need this file). Copied into the bootstrapped project; fill <<...>>.
Engine: Claude Code in-repo. Output: prototype/board.html + prototype/screens/*.html.
Authority: docs/process/WORKFLOW.md 1.12 · docs/process/STAGE_GOALS.md §1.12 · ADR prototype-external-design-tool-not-generated (Amendment TRIAL).
Bilingual: prompt body VI (user runs it in Claude Code); user-facing screen copy VI-first.
Project note: a filled, project-specific copy lives at docs/visuals/prototype/build-prompt-claude-code.md.

SKILL ABSTRACTION (swappable):
  The UI-quality skill is referenced ONLY by the token <<FRONTEND_TASTE_SKILL>>.
  Default = `design-taste-frontend` (taste-skill by Leonxlnx) — BETA. Install GLOBALLY:
    npx skills add <repo-url> --skill "<skill-name>" --global --yes
  To swap for a stronger skill: change <<FRONTEND_TASTE_SKILL>> + the install line. Nothing else.
-->

# Prototype Build Prompt — Claude Code + taste skill (board mode)

Fill the `<<...>>` placeholders, then paste the block into Claude Code at the project repo.

- `<<PRODUCT_NAME>>` — e.g. "Acme Portal"
- `<<PRODUCT_ONE_LINER>>` — e.g. "SaaS quản lý đơn hàng đa tenant (Next.js)"
- `<<SCREEN_COUNT>>` — total screens from `screen-inventory.md` (e.g. 29)
- `<<STATE_MIN>>` — minimum total states (e.g. 63)
- `<<ZONES>>` — board sections + frame numbers (from `sitemap-screen-map.md` §3)
- `<<FRONTEND_TASTE_SKILL>>` — default `design-taste-frontend` (BETA/swappable)

```
NHIỆM VỤ: Dựng prototype HTML dạng BOARD cho "<<PRODUCT_NAME>>" — <<PRODUCT_ONE_LINER>>. Toàn bộ <<SCREEN_COUNT>> screens hiển thị trên 1 board duy nhất (giống Figma/Stitch present), gom theo Zone, mỗi frame tag GROUP, board có chức năng COMMENT/feedback ngay trên màn.

== ĐỌC FILE (path từ repo root, đúng mục đích, KHÔNG đọc nhầm) ==
[SPEC CHÍNH] docs/visuals/prototype/prototype-brief.md → §3 nguồn sự thật mọi screen (route/layout/components/states/text VI); §4 Feature Coverage Map (mọi FID → screen).
[ZONE+FLOORPLAN] docs/visuals/diagrams/screen-inventory.md → floorplan mỗi screen + zone. docs/visuals/diagrams/sitemap-screen-map.md → các Zone (board sections).
[RULES Tier-1] docs/design-system/design-rules.md → §4 floorplan, §7 actions, §8 modals, §10 states, §11 a11y. docs/design-guidelines.md → §0 Tier-1 pin + Component Coverage Matrix.
[TOKENS Tier-2] docs/design/globals.css, design-tokens.ts, tailwind.config.ts, components.json → chỉ dùng token; cấm hardcode hex/px/font; light+dark.
[INVENTORY Tier-3] src/components/README.md → tên component có sẵn.
[ADR] docs/decisions/*-custom-floorplan.md → đọc khi screen CUSTOM.
[GROUPS] docs/scope-baseline/feature-register.md → feature GROUP để tag frame.

== ENGINE KÉP THEO ZONE ==
Dùng skill UI-quality `<<FRONTEND_TASTE_SKILL>>` (mặc định design-taste-frontend — BETA, thay được). Tôn trọng scope skill:
- PUB ZONE (landing + auth): ENGAGE skill, khai báo 1 dòng "Design Read" trước khi code. Dials DESIGN_VARIANCE=5, MOTION_INTENSITY=4, VISUAL_DENSITY=3. VẪN khóa màu+typography theo Tier-2 tokens.
- APP + ADM ZONE (dashboard/table/wizard/form): NGOÀI scope skill → KHÔNG đổi layout. Repo design-system làm chủ (shadcn + floorplan §4 + tokens). Chỉ áp anti-slop discipline (tránh AI-purple/Inter+slate mặc định/glassmorphism bừa; tinh chỉnh spacing+typo). KHÔNG phá floorplan.

== RÀNG BUỘC (mọi zone) ==
1. Floorplan mỗi screen lấy từ screen-inventory.md (CUSTOM → ADR + design-rules §4.7).
2. Mỗi screen ≥1 state sample-data + ≥1 state empty/error. Tổng tối thiểu <<STATE_MIN>> states.
3. CHỈ dùng Tier-2 token; cấm hardcode. Light+dark.
4. Component theo Component Coverage Matrix + src/components/README.md.
5. Copy user-facing VI-first — dùng đúng text VI trong prototype-brief.md.
6. Tuân thủ design-rules §7/§8/§10/§11.
7. Mọi FID trong §4 Feature Coverage Map reachable từ ≥1 screen state.
KHÔNG bịa/bỏ sót screen. MỤC TIÊU: pass design-system-compliance + floorplan conformance (PB-G3).

== OUTPUT: BOARD ==
- prototype/screens/<NN>-<slug>.html : mỗi screen 1 file standalone, toggle state (sample/empty/error), light/dark.
- prototype/board.html : gom TẤT CẢ, section theo Zone:
<<ZONES>>
  Mỗi section: tiêu đề + subtitle (sub-feature) + hàng frame. Mỗi frame: <iframe> scale nhỏ, caption = số + tên + tag GROUP + nút expand. Tương tác: cuộn-zoom, kéo-pan, ←/→ duyệt frame, dropdown nhảy giữa zone.

== COMMENT / FEEDBACK (như Claude Design / Stitch / Open Design) ==
- "Comment mode": click lên frame → thả PIN đánh số + ô nhập text.
- Mỗi comment lưu: id, screen(số+slug), toạ độ pin(x%,y%), tác giả, timestamp, nội dung, open/resolved.
- Panel phải: list comment, lọc theo screen/trạng thái, click → board nhảy tới pin. Resolved + badge đếm open/frame.
- LƯU localStorage (no backend). Nút Export feedback (JSON) → khớp docs/mau-tai-lieu/prototype-feedback-round.md; nút Import nạp lại. Đây là kênh thu feedback của step 1.13.

- Chạy bằng mở prototype/board.html (no server). Báo lại đường dẫn khi xong.
```

## Notes

- **Swapping the skill:** the day a stronger skill replaces taste-skill, change
  `<<FRONTEND_TASTE_SKILL>>` (and the global install line in the header) — the rest
  of the prompt is skill-agnostic.
- **Scope honesty:** taste skills target landing/portfolio surfaces; on data-dense
  product screens the differentiator is the repo design-system, not the skill. Do
  not expect the skill to "beautify" dashboards beyond token/floorplan discipline.
- **Gate unchanged:** board path still clears PB-G3 via design-system-compliance +
  floorplan conformance; comments feed the 1.13 review loop.
