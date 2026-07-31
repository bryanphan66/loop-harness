# Playbook Human + Agent (chuẩn để Trung follow)

Bản gọn, có chủ đích (theo tinh thần slim + progressive disclosure của bài context-engineering: đừng nhồi hết vào đây, chi tiết nằm ở reference nạp đúng lúc). File này chỉ giữ: vai trò, vòng đời, luật vàng, và trỏ tới nơi có chi tiết.

## Vai trò (5 người: 3 agent + 2 human)

- **Trung (bạn) = Điều phối + QC.** 3 nhịp: **giao code -> chờ CONTROL báo đã lên staging -> QC bằng checklist -> phán pass/fail.** Không tự code, không tự merge/deploy.
- **CONTROL (phiên Claude này) =** giao agent code, merge, deploy staging, verify-at-source, đổi state. Khâu kỹ thuật.
- **Agent CS + Agent Tech Lead =** làm việc với nhau **BA-validate (phân tích nghiệp vụ) TRƯỚC khi tạo issue**. Nên issue tới tay đã sạch nghiệp vụ -> Trung KHÔNG validate lại.
- **Coder/Debugger/Reviewer agent =** code / fix / review theo AC.

## Vòng đời issue + luật vàng (bản đầy đủ + Recover: `../harness/docs/playbooks/steady-state-issue-pipeline.md`)

- **10 state:** Backlog -> Ready for Dev -> In Dev -> Deploying -> Ready for Test -> QC Testing -> Ready for UAT -> UAT Testing -> Done (+ Cancelled). Issue **chỉ đóng ở Done**. Đổi state: `node scripts/issue-state.mjs <N> "<state>"`.
- **Luật vàng QC fail:** lỗi TRONG Acceptance Criteria (tiêu chí nghiệm thu) của issue -> lùi In Dev sửa issue cũ; lỗi NGOÀI AC -> issue mới (issue cũ đi tiếp độc lập). Không phân "happy vs biên".

## QC như thế nào

1. CONTROL báo issue đã lên staging (đã verify SHA container = commit đúng).
2. Mở `https://elearning-staging.reno.ai.vn`, chạy **QC checklist** đã đính trong comment issue (happy path + 6 lát cắt). Checklist do coder tự sinh: `node scripts/qc-checklist.mjs <N>`.
3. PASS hết -> báo CONTROL đẩy Ready for UAT. Có FAIL -> tạo bug theo mẫu `.github/ISSUE_TEMPLATE/bug-report.md`, giữ ở QC Testing.
4. Trước deploy lớn: chạy `elearning-platform/docs/qc/regression-checklist.md` (luồng lõi).

## Nơi lưu (references, không nhồi vào đây)

- SOP agent đọc: `elearning-platform/docs/WORKFLOW.md`.
- Đổi state: `scripts/issue-state.mjs`. Sinh QC checklist: `scripts/qc-checklist.mjs`. Regression: `docs/qc/regression-checklist.md`. Mẫu bug: `.github/ISSUE_TEMPLATE/bug-report.md`.
- Sổ tay bài học: `videcode-harness/docs/lessons-log.md` (CONTROL bồi đắp; Trung đọc/paste sang Plane nếu muốn team xem).

## Nguyên tắc giữ harness gọn (slim + progressive disclosure)

Theo bài "context engineering for Claude 5 models" (model mới phán đoán tốt hơn -> đừng over-constrain):
- CLAUDE.md/WORKFLOW **nhẹ** + tập trung "gotcha" (bẫy); chi tiết đẩy sang **skill/script/test làm reference** nạp đúng lúc, KHÔNG nhồi hết lên đầu.
- Ưu tiên **reference dạng code** (script, test-suite, register.json, mockup HTML) hơn văn xuôi mô tả.
- Để agent **tự phán đoán** thay vì chồng luật cứng mâu thuẫn.
- Định kỳ gõ `/doctor` trong Claude Code để soi CLAUDE.md/skills quá tải.
- **Không tự cắt** rule/quyết định đã chốt: liệt kê "cái nào nên gọn" cho Trung duyệt, không âm thầm xoá.

## Cách chia sẻ tài liệu cho CONTROL (Plane)

CONTROL **không** đọc/ghi được Plane Page riêng tư qua API. Nhưng page **đã publish** (Spaces) thì đọc được: đưa link `/spaces/pages/<id>` (CONTROL lấy qua `GET /api/public/anchor/<id>/pages/`). Muốn CONTROL cập nhật liên tục thì để ở file repo, không phải Plane.
