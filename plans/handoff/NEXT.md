# NEXT — việc kế tiếp cho phiên CLI

> **File cuốn chiếu, LUÔN ghi đè.** Không tạo file mới mỗi lần — một handoff cũ còn
> nằm lại là một nguồn-tin-thứ-hai chờ ai đó đọc nhầm.
>
> **Đây là Mức 0** của việc bỏ human-relay (người bê tay prompt giữa 2 phiên): git
> làm đường truyền. Đích thật là **Mức 1** — mỗi việc harness = 1 GitHub Issue trên
> chính repo này, dùng đúng Mode B mà harness đã có. Xem § Đích ở cuối.

**Cập nhật:** 2026-08-17 (phiên CLI) · **Bởi:** phiên CLI ctl-loop-harness
**Trạng thái:** 3 việc của handoff trước ĐÃ XONG — giờ chờ user duyệt merge 2 PR.

---

## ĐANG CHỜ USER DUYỆT (không tự merge)

- **PR #2** (bryanphan66/loop-harness) → `main`: v7.3 + v7.4. Không xung đột với nhánh
  `harness/issue-standard-diacritics-rule` (đã kiểm: nhánh đó chỉ đụng
  `github-issue-standard.md`, PR #2 không đụng). **Chờ user duyệt mới merge.**
- **PR #708** (RenoAI-Labs/elearning-platform) → `dev`: propagate `issue-state.mjs`
  guard v7.3. Draft. Working-tree bẩn trên `dev` đã dọn (change đã nằm an toàn trên PR).
- Nhánh `harness/issue-standard-diacritics-rule` còn treo trên origin — chưa rõ chủ,
  chỉ +2 dòng vào `github-issue-standard.md`. Hỏi user có gộp không.

## ĐÃ XONG phiên này (không làm lại)

- Việc 1 handoff cũ: propagate elearning land bền → PR #708 (không còn "mất dần").
- Việc 2: push `claude/twitter-link-access-7q6qqb` + kiểm nhánh lạ + mở PR #2 → main.
- Việc 3: nguyên tắc cạnh L16 (ứng viên luật review tài liệu khách) → commit `0eb05fe`.
- v7.3 kiểm chứng thật: guard PASS trên board elearning, run-log 1 run (#632 done 66'),
  L16–L21 ghi. (PR elearning #705 fix dev-stack #632, draft, đã có sẵn.)

## VIỆC KẾ (sau khi user merge 2 PR)

**Chạy thêm ≥4 vòng issue nữa** để `run-log report` bắt đầu có nghĩa — cần **≥2 nhóm
version × ≥5 run**. Hiện mới 1 run (v7.3). Mỗi vòng: kẹp `run-log start/end`
(BẮT BUỘC `--repo elearning-platform`, bug #5), dispatch worker 1 issue thật, verify.

## KHÔNG làm trong phiên này

- ❌ Dựng gate `landing-acceptance` — pre-build cho lane chưa có site nào.
- ❌ Mở Lane Landing — chờ 1 site thật.
- ❌ Vá harness thêm — v7.3 mới 1 run, chưa đủ căn cứ thêm/bớt luật.
- ❌ Tự merge PR #2 / #708 — chờ user.

## Ràng buộc

Verify-at-source · gate đỏ = còn việc thật, cấm `--no-verify` · `Refs #N` ở CẢ commit
lẫn PR body, cấm close-keyword · không merge khi user chưa duyệt · nghi số nào trong
file này thì **tự kiểm bằng repo**, đừng tin nó.

---

## Đích: bỏ hẳn human-relay (Mức 1)

File này vẫn cần người nói "pull đi" — mới bỏ được thao tác copy, chưa bỏ được việc
**trạng thái nằm trong đầu người**. Đích là mỗi việc harness = **1 Issue trên repo
này**, chạy đúng Mode B đã có:

- Issue = tin nhắn (nội dung + AC + lịch sử) · States = giao thức · board = hàng đợi chung
- Đo được: mở bất kỳ phiên nào, bất kỳ máy nào, sau bất kỳ bao lâu → **nhìn board là
  biết làm gì tiếp**, không cần hỏi người.

Đây chính là **Frontier 2 (Autonomy)** trong `OPERATING-MODES.md`. Điều kiện nên có
trước: Frontier 1 (Recover R1) — *"một vòng lặp mong manh không nên tự lái"*.
