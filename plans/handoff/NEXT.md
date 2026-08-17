# NEXT — việc kế tiếp cho phiên CLI

> **File cuốn chiếu, LUÔN ghi đè.** Không tạo file mới mỗi lần — một handoff cũ còn
> nằm lại là một nguồn-tin-thứ-hai chờ ai đó đọc nhầm.
>
> **Đây là Mức 0** của việc bỏ human-relay: git làm đường truyền. Đích thật là **Mức 1**
> — mỗi việc harness = 1 GitHub Issue, dùng đúng Mode B harness đã có. Xem § Đích ở cuối.

**Cập nhật:** 2026-08-17 (phiên cloud) · **Trạng thái:** user ĐÃ DUYỆT merge cả 2 PR.
Handoff trước xong sạch — 3/3 việc, không phải làm lại.

---

## VIỆC 1 — Merge PR #708 (elearning) · ƯU TIÊN CAO NHẤT

`RenoAI-Labs/elearning-platform#708` → `dev` (propagate `issue-state.mjs` guard v7.3).

Còn ở draft nghĩa là **elearning vẫn chạy script KHÔNG có guard** trong khi cả team
tưởng đã có. Đây là phơi nhiễm thật, không phải nợ giấy tờ — và chính PR này sinh ra để
đóng trạng thái "trông như xong mà chưa xong".

- Bỏ draft → merge vào `dev`.
- Sau merge **verify tại nguồn**, đừng tin dòng merge xanh:
  ```bash
  cd ~/Desktop/Workspace/elearning-platform && git checkout dev && git pull
  node scripts/issue-state.mjs --self-test          # phải OK 20 case
  node scripts/issue-state.mjs <N> "Done" --dry-run # từ state không hợp lệ -> phải CHẶN
  ```

## VIỆC 2 — Merge PR #2 (loop-harness → main) + gộp nhánh diacritics

`bryanphan66/loop-harness#2` → `main` (v7.3 + v7.4, 10 commit).

`main` đang ở **v7.2** — mọi dự án seed từ đó nhận harness không guard, không cân.

- Merge PR #2.
- **Gộp luôn `harness/issue-standard-diacritics-rule`** (chỉ +2 dòng vào
  `github-issue-standard.md`, 0 xung đột). Đừng để treo — một nhánh 2 dòng bỏ quên 3
  tháng sau chính là drift, thứ vừa tốn 2 pass để dọn. Nếu không rõ chủ nhánh: đọc
  diff, đúng thì gộp, sai thì xoá nhánh — **không để nguyên**.
- Verify sau merge: `git ls-remote origin refs/heads/main` phải trỏ commit chứa v7.4,
  và `grep "Current version" harness/docs/HARNESS_CHANGELOG.md` trên `main` ra `v7.4`.

## VIỆC 3 — Ghi L22 + vá lỗ nó chỉ ra

### 3a. Ghi bài học (plans/lessons-log.md)

Phiên CLI trước commit `issue-state.mjs` **qua GitHub contents API để né gate local
nặng**. Kết quả tốt, rủi ro lần đó thấp — nhưng nó phơi ra một lỗ hạng nặng:

> **L22 — verify-gate chỉ canh MỘT đường vào.** Gate là git hook, nên nó chỉ chặn
> đường `git commit/push` từ máy. Commit qua **contents API / web UI / MCP / máy khác**
> không chạm hook một lần nào. Vì vậy tuyên bố *"gate fail-closed, không bypass được"*
> đang in trong `AGENTS.md` + `STRUCTURE.md` là **SAI** — đúng khuôn FC6: một cổng kiểm
> một đường trong khi có bốn đường là cổng không có răng.
> **Triệu chứng nhận ra:** ai đó nói "né gate local cho nhanh" mà không khai đó là bypass.
> **Vá:** đẩy cổng lên phía máy chủ (việc 3b). Hook local thành lớp *nhanh*, không còn
> là lớp *duy nhất*.
> **Ghi chú:** phát hiện được là nhờ bản đồ v7.4 (harness = vòng ngoài = "được chạm
> gì") — câu hỏi đúng của tầng đó là *"có mấy đường vào repo, mấy đường có cổng?"*.

### 3b. Bật branch protection (cả 2 repo)

`loop-harness` (`main`) và `elearning-platform` (`dev` + `main`):
- Require pull request trước khi merge.
- **Require status checks to pass** — chọn check tương đương verify-gate (lint /
  typecheck / test). Đây là phần thật sự vá L22: mọi đường vào đều phải qua CI.
- Không cần bật force-push protection ngặt nếu nó cản flow hiện tại — ưu tiên
  required checks trước.

Nếu repo chưa có CI workflow chạy được gate → **nói ra**, đừng bịa check. Ghi thành
việc kế, không tự dựng CI trong phiên này.

## VIỆC 4 — Chạy ≥4 vòng issue (việc THẬT)

Ba việc trên là **dọn nốt**. Đây mới là việc mở khoá mọi quyết định sau.

`run-log report` hiện có **1 run**. Cần **≥2 nhóm version × ≥5 run** mới nói được câu
đang đuổi theo: *luật nào trong harness đáng giữ, luật nào là mỡ thừa.*

Mỗi vòng, kẹp đủ hai đầu:
```bash
H=~/Desktop/Workspace/loop-harness/harness
RUN=$(node $H/scripts/run-log.mjs start --repo elearning-platform --issue <N> \
      --worker <8char> --task "<việc>" --model opus)     # BẮT BUỘC --repo (bug L20)
# dispatch 1 worker / 1 issue, worktree riêng
node $H/scripts/run-log.mjs end --run "$RUN" --outcome done|blocked|failed \
      --qc-fails <n> --retries <n>
```
**Worker chết cũng phải gọi `end`** — ca chết mới là dữ liệu đáng giá. Không có `end`
thì vòng đó biến mất khỏi thống kê và bảng nói dối theo hướng đẹp lên.

---

## KHÔNG làm trong phiên này

- ❌ Gate `landing-acceptance` — pre-build cho lane chưa có site nào.
- ❌ Lane Landing — chờ 1 site thật.
- ❌ Thêm bất kỳ luật harness nào — 1 run chưa đủ căn cứ thêm/bớt gì.
- ❌ Dựng CI mới chỉ để có status check — nếu thiếu thì báo, đừng tự mở mặt trận.

## Ràng buộc

Verify-at-source sau MỌI merge · gate đỏ = còn việc thật, cấm `--no-verify` **và cấm
đi vòng qua API để né gate** (chính là L22 — nếu buộc phải, khai rõ là bypass) ·
`Refs #N` ở CẢ commit lẫn PR body, cấm close-keyword · nghi số nào trong file này thì
**tự kiểm bằng repo**, đừng tin nó.

## OUTPUT

#708 merged + guard verify tại nguồn ra gì · #2 merged + `main` đã ở v7.4 chưa · nhánh
diacritics xử thế nào · L22 ghi chưa + branch protection bật được tới đâu · đã chạy
được mấy vòng issue. Kết bằng DONE hoặc BLOCKED <lý do>.

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
