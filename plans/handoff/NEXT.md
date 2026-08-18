# NEXT — việc kế tiếp cho phiên CLI

> **File cuốn chiếu, LUÔN ghi đè.** Không tạo file mới mỗi lần — một handoff cũ còn
> nằm lại là một nguồn-tin-thứ-hai chờ ai đó đọc nhầm.
>
> **Đây là Mức 0** của việc bỏ human-relay: git làm đường truyền. Đích thật là **Mức 1**
> — mỗi việc harness = 1 GitHub Issue, dùng đúng Mode B harness đã có. Xem § Đích ở cuối.

**Cập nhật:** 2026-08-17 (phiên CLI ctl) · **Trạng thái:** 4 việc handoff trước đã xử
xong phần làm được; còn vài mục chờ user + 1 mục bất khả thi ở gói GitHub hiện tại.

---

## ĐANG CHỜ USER DUYỆT (không tự merge — classifier chặn self-approval)

- ~~PR #3 (diacritics rule)~~ ✅ **MERGED → main** (a525158, user duyệt 2026-08-18).
- **PR #709** (RenoAI-Labs/elearning-platform → dev): fix #707 menu trùng đôi 'Về chúng
  tôi'. DONE, Refs #707, sạch close-keyword. → cần QC/UAT rồi mới merge (theo Mode B).
- **PR #710** (elearning → dev): fix #706 avgRating chỉ tính APPROVED (+ bonus #686
  DELETE segment 400). DONE, Refs #706 #686, sạch. → cần QC/UAT.

## ĐÃ XONG phiên này (không làm lại)

- **Việc 1** — #708 merged → elearning `dev`; verify-at-source: `--self-test` OK 20
  case, guard chặn `Ready for UAT → Done`. Guard sống trên dev.
- **Việc 2** — #2 merged → `main` = **v7.4** (verify remote 8f17b59). Nhánh diacritics
  → PR #3 (trên).
- **Việc 3a** — L22 (verify-gate chỉ canh 1 đường git-hook; API/web/MCP đi lọt) ghi
  vào lessons-log, đã theo #2 lên main.
- **Việc 4 (một phần)** — chạy 2 vòng issue thật: #707→PR#709, #706→PR#710, cả 2 DONE.
  run-log giờ **3 run / 2 nhóm**: v7.3 (1 run, 66') · v7.4 (2 run, 33'). Bảng vẫn
  tự-cảnh-báo "3 run quá ít để kết luận".

## VIỆC KẾ

### A. run-log chưa đủ để nói gì (cần ≥5 run/nhóm × ≥2 nhóm; đang 1 và 2)

Board elearning HIỆN chỉ còn **2 bug tươi** đã lấy hết (#707/#706). Phần còn lại: đa số
**Ready for UAT** (đã build, chờ UAT) hoặc thuộc **milestone [1.6] đã HOÃN** (#594/#575/
#574/#573/#572 — phần lớn là chính sách/ops/phụ-thuộc-khách, KHÔNG phải code, và HOÃN =
quyết định business, ghế harness không tự khởi). → Muốn thêm run hợp lệ: **cần issue mới
vào pipeline** (BA/PM tạo, hoặc UAT trả về tạo bug-con). Đừng bịa run để làm đẹp bảng.

### B. Việc 3b (branch protection) — BẤT KHẢ THI ở gói hiện tại

- Branch protection API trả **403 "Upgrade to GitHub Pro or make repo public"** — cả 2
  repo private. Không bật được.
- elearning `ci.yml` **cố ý không chạy trên `pull_request`** (bỏ 2026-08-05: gate nằm ở
  đường phát hành qua `workflow_run`, tiết kiệm 1 lượt CI). loop-harness **chưa có CI**.
- → Vá thật cho L22 (đẩy cổng lên server) BỊ CHẶN 2 lớp. Muốn làm: hoặc nâng GitHub Pro,
  hoặc public 1 repo, HOẶC thêm CI-chạy-trên-PR. **Quyết định của user**, không tự làm.

## KHÔNG làm trong phiên này

- ❌ Tự khởi issue [1.6] đã hoãn để lấp cho đủ 4 run — đó là quyết định business.
- ❌ Gate `landing-acceptance` / Lane Landing — chờ site thật.
- ❌ Tự merge PR #3/#709/#710 — chờ user / chờ QC-UAT.
- ❌ Bịa CI/status-check chỉ để bật branch protection.

## Ràng buộc

Verify-at-source sau MỌI merge · gate đỏ = còn việc thật, cấm `--no-verify` **và cấm đi
vòng qua API để né gate** (L22 — nếu buộc phải, khai rõ là bypass) · `Refs #N` ở CẢ
commit lẫn PR body, cấm close-keyword · không merge khi user chưa duyệt · nghi số nào
trong file này thì **tự kiểm bằng repo**, đừng tin nó.

## OUTPUT (cho phiên trước, đã đạt)

#708 merged + guard verify OK · #2 merged + main=v7.4 · diacritics→PR#3 chờ user · L22
ghi + lên main · 3b bất khả thi (báo, không bịa) · chạy 2/≥4 vòng (board chỉ còn 2 bug
tươi). 2 PR fix #709/#710 chờ QC.

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
