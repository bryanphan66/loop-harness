# GitHub -> Plane sync (elearning) — native + cron backfill

Mô hình **1 chiều GitHub -> Plane** (GitHub là nguồn thật). Hai tầng:

## Tầng 1 — Plane native integration (Repository & project sync)
- GitHub App `reno-ai-plane-silo` (org RenoAI-Labs). Map `elearning-platform` -> project `Elearning Platform`, direction **GitHub to Plane only**, state-map opened->Backlog / closed->Done.
- Lo: import issue (link `external_id` = số issue GitHub), open/close -> state, comment, PR, assignee (member mapping).
- **Forward-only:** issue MỚI chỉ tạo được item khi có event (labeled/edited/closed). Chỉ "tạo" issue KHÔNG kích sync.

## Tầng 2 — cron backfill (`sync-github-to-plane.py`)
Chạy mỗi 15 phút trên **vps04, user `trung`** (crontab). Bù 20% native không lo:
1. Issue GitHub F-* nào **chưa có item Plane** -> gắn label `Plane` để kích native import (item xuất hiện ở lần cron sau).
2. Với item đã link (`external_id`): đọc GitHub **live** rồi set:
   - **State chi tiết** (từ custom field `States`: Dev Done/QC/In Review...).
   - **Module** (từ custom field `Module` -> Plane Modules, chỉ gán nếu chưa thuộc).
   - **Cycle** (từ Milestone `Phase 1/1.5/2/3` -> Plane Cycle, chỉ gán nếu chưa thuộc).
   - **Description render** (lấy `body_html` GitHub -> `description_html` Plane; markdown in đậm/heading hiển thị đúng).
- **Resolve name->id ĐỘNG** mỗi lần (không hardcode UUID Plane; xóa/tạo lại state/module vẫn đúng).
- Idempotent: PATCH state/description mỗi lần (rẻ, giữ current); Module/Cycle chỉ gán khi chưa có.

## Vận hành
- **Đổi nhịp:** sửa `*/15` trong `crontab -e`.
- **Tắt:** `crontab -e` xóa dòng `sync-github-to-plane.py`.
- **Log:** `plans/plane-github-sync/sync.log` (append; dọn thủ công nếu to).
- **Auth:** Plane key ở `~/.claude/.../memory/.secrets/plane-api-key`; GitHub dùng `gh` CLI (auth của `trung`, repo scope). Nếu `gh` hết hạn -> cron gãy im lặng, chạy `gh auth status` kiểm.
- **Chạy tay:** `cd plans/plane-github-sync && python3 sync-github-to-plane.py`.

## Giới hạn đã biết
- Issue mới có "độ trễ ~1-2 chu kỳ cron" (lần 1 gắn label kích, lần 2 backfill).
- Sync 1 chiều: **đừng sửa tay bên Plane** (không đẩy ngược; cron/native sẽ ghi đè theo GitHub).
- 20% custom (State/Module/Phase) đến từ **custom field GitHub**, không phải open/close.
