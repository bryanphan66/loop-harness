# NEXT — việc kế tiếp cho phiên CLI

> **File cuốn chiếu, LUÔN ghi đè.** Không tạo file mới mỗi lần — một handoff cũ còn
> nằm lại là một nguồn-tin-thứ-hai chờ ai đó đọc nhầm.
>
> **Đây là Mức 0** của việc bỏ human-relay (người bê tay prompt giữa 2 phiên): git
> làm đường truyền. Đích thật là **Mức 1** — mỗi việc harness = 1 GitHub Issue trên
> chính repo này, dùng đúng Mode B mà harness đã có. Xem § Đích ở cuối.

**Cập nhật:** 2026-08-17 · **Bởi:** phiên cloud · **Trạng thái v7.3:** đã kiểm chứng
trên dữ liệu thật (guard PASS trên board elearning, run-log 1 run thật, L16–L21 ghi)

---

## Việc 1 — Land bền phần propagate ở elearning (ĐANG MẤT DẦN)

`elearning-platform/scripts/issue-state.mjs` là **thay đổi chưa commit trên `dev`**.
Một lần checkout / worktree mới / worker dọn cây là mất sạch — elearning âm thầm quay
về script KHÔNG có guard trong khi cả team tưởng đã có. Trạng thái này **nguy hiểm hơn
"chưa propagate"**, vì nó trông như đã xong.

- Branch từ `dev` → commit riêng file đó → **draft PR**. KHÔNG commit thẳng `dev`.
- PR body ghi: propagate harness v7.3; guard đã dry-run trên board thật
  (`Ready for UAT → Done` bị chặn · `→ UAT Testing` qua).

## Việc 2 — Push + merge v7.3 vào `main`

`main` đang ở v7.2 (`9db54a7`). Mọi dự án seed từ `main` lúc này nhận harness cũ:
không guard, không cân — đúng cái drift `CLAUDE.md` cảnh báo.

1. Push `0c4b156` (lessons-log L16–L21) lên `claude/twitter-link-access-7q6qqb` để nó
   đi cùng chuyến merge.
2. **Kiểm nhánh lạ TRƯỚC KHI merge**: origin có `harness/issue-standard-diacritics-rule`
   mà phiên cloud không biết (worker song song?). Nếu nó chạm
   `playbooks/github-issue-standard.md` hoặc docs v7.3 vừa sửa → xử xung đột trước,
   đừng merge đè.
3. Mở PR → `main`. **Đợi user duyệt mới merge.**

## Việc 3 — Chốt nguyên tắc từ L16

Phiên cloud đã sửa phần của nó (bỏ dòng "Tốc độ & SEO đạt ngưỡng" khỏi bản nháp
landing; 3 cam kết còn lại đều có gate thật đứng sau). Việc còn lại là ghi **nguyên
tắc**, cạnh L16:

> Harness được phép **thiếu** gate. Không được phép để bản bán hàng / template khách
> hàng **hứa** một gate chưa tồn tại. Mọi cam kết chất lượng trong tài liệu khách phải
> trỏ được tới gate cưỡng chế nó — không trỏ được thì bỏ câu đó.

Đây là ứng viên thành **luật cứng trong gate review tài liệu khách**. Thấy đúng thì
**đề xuất**, đừng tự nâng — nâng bài học thành luật mà chưa qua người là đúng cách
harness phình bằng luật chưa kiểm chứng.

---

## KHÔNG làm trong phiên này

- ❌ Dựng gate `landing-acceptance` — pre-build cho lane chưa có site nào.
- ❌ Mở Lane Landing — chờ 1 site thật.
- ❌ Vá harness thêm — v7.3 mới có **1 run**, chưa đủ căn cứ thêm/bớt luật nào.

Việc thật sự cần sau 3 việc trên: **chạy thêm 4 vòng issue nữa** để `run-log report`
bắt đầu có nghĩa (cần ≥2 nhóm version × ≥5 run).

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
