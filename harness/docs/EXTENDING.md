# loop-harness — Vận hành & mở rộng (đọc khi muốn HIỂU hoặc THÊM gì đó)

File này trả lời 3 câu: (1) harness vận hành thế nào — nhìn 1 màn hình; (2) **học được kinh nghiệm mới / muốn thêm gì → CẤT VÀO ĐÂU**; (3) tái dùng cho dự án mới + phổ biến cho dev khác thế nào. Chiều sâu ở: [`UNDERSTANDING`](./UNDERSTANDING-loop-harness.md) (narrative + scorecard) · [`KEYWORD-MAP`](./KEYWORD-MAP.md) (từ điển) · [`STRUCTURE`](./STRUCTURE.md) (cây thư mục).

---

## 1. Vận hành trong 1 màn hình

loop-harness = harness (khung cho AI agent) biến spec → app chạy được → nuôi app tiến hoá. **1 xương sống = 2 mode, cắt tại go-live:**

```
MODE A — BUILD (hữu hạn)            │  MODE B — THE LOOP (vô hạn)
spec → app deploy được             │  nuôi app sống, mỗi thay đổi = 1 issue
đơn vị: 1 PHASE                     │  đơn vị: 1 ISSUE (có AC)
lệnh: /stage-next · /build-phase    │  vòng: discover→dispatch→verify→recover→persist→decide-next
──────────────────── GO-LIVE ────────────────────
```

Chạy trên **agent + git + bash trần**; gate `harness-verify-gate.sh` fail-closed không bypass; tri thức tái dùng ở `playbooks/`; scaffold ở `templates/`.

---

## 2. Học được gì mới → CẤT VÀO ĐÂU (bảng quyết định)

> Nguyên tắc: **1 tri thức = 1 chủ (single owner)**; đừng chép ra 2 nơi. Chọn ĐÚNG 1 dòng dưới theo bản chất cái bạn học.

| Bạn vừa có... | Cất vào | Đường dẫn | Được tái dùng thế nào |
|---|---|---|---|
| **Cách làm 1 việc, dùng lại ở MỌI dự án** (VD "cách wire object-storage", "cách deploy verify-at-source") | **playbook** (tạo mới / sửa cái có sẵn) | `harness/docs/playbooks/*.md` + thêm dòng vào `playbooks/README.md` | Agent mở đúng playbook khi gặp domain đó; cài vào mọi dự án |
| **Một lần bị đau → rút ra luật** ("chart rỗng = lỗi CSS không phải data") | **lessons-log** | dự án: `docs/lessons-log.md` · của chính harness: `plans/lessons-log.md` | Phiên sau đọc trước khi lặp lại sai lầm |
| **Cấu hình/vận hành RIÊNG 1 dự án** (deploy host, bucket R2, biến env, CI/CD của dự án đó) | **runbook** (của dự án, KHÔNG phải harness) | `<dự-án>/docs/runbook/{deploy,config,cicd,seed-and-data}.md` | Người vận hành dự án đó đọc; KHÔNG lẫn vào harness |
| **Fact bền CONTROL cần nhớ qua phiên, KHÔNG suy được từ repo** (slug đổi, key/host, quyết định business) | **memory** | `~/.claude/projects/<key>/memory/` (fact riêng dự án → key dự án đó) | Tự nạp vào context phiên sau |
| **Một loại FILE mới harness kỳ vọng dự án có** (mẫu tài liệu/scaffold) | **template** | `harness/docs/templates/*.md` + dòng `templates/README.md` | scaffold copy vào dự án ở bước tương ứng |
| **Một chốt chặn / luật cứng mới** (điều kiện phải PASS) | **gate** hoặc **WORKFLOW** | `harness/docs/gates/*.md` / `WORKFLOW.md` | verify-gate + review đọc, chặn khi vi phạm |
| **Đổi bản thân harness** (thêm/sửa cơ chế, version) | **HARNESS_CHANGELOG** | `harness/docs/HARNESS_CHANGELOG.md` | Ghi nhận tiến hoá harness qua version |

**Bẫy hay gặp (từ [`../../plans/lessons-log.md`](../../plans/lessons-log.md) L9/L10):**
- Đừng chép luật của file A sang file B — file B chỉ **TRỎ** tới A.
- Tri thức "cho dự án" ≠ "của harness": lessons-log DỰ ÁN ở `docs/`, lessons-log HARNESS ở `plans/`.
- Fact riêng dự án (elearning) KHÔNG cất vào memory của harness — cất vào key của dự án đó.

---

## 3. Tái dùng — chạy harness cho 1 dự án MỚI

```bash
harness/scripts/install-harness.sh --bootstrap --spec ./spec-cua-ban.md ./du-an-moi
```
Bê nguyên cây `harness/` (self-contained) + init git + bật verify-gate + điền `STAGE.md`. Rồi mở Claude Code trong `du-an-moi`, lặp `/stage-next` tới go-live, sau đó chuyển sang vòng lặp issue (copy `templates/steady-state/`).

---

## 4. Phổ biến cho dev khác

**Dev mới đọc theo thứ tự (10 phút hiểu toàn cảnh):**
1. [`UNDERSTANDING-loop-harness.md`](./UNDERSTANDING-loop-harness.md) — narrative + scorecard thành thật (cái gì PROVEN/PATCHED/chưa-build).
2. File này (`EXTENDING.md`) — vận hành + cất tri thức ở đâu.
3. [`KEYWORD-MAP.md`](./KEYWORD-MAP.md) — tra keyword khi vướng.
4. [`STRUCTURE.md`](./STRUCTURE.md) — cây thư mục khi cần sửa.

**Dev đóng góp ngược lại:** làm dự án bằng harness → gặp bài học/công thức mới → theo Bảng §2 cất vào đúng chỗ (playbook nếu tái dùng được, lessons-log nếu là luật) → commit vào repo loop-harness → `git push`. Kho tri thức lớn dần, mọi dự án sau hưởng.

---

## 5. Giữ sạch khi mở rộng (đừng để chấp vá quay lại)
- **Self-containment:** thêm gì vào `harness/` thì KHÔNG trỏ `../../` ra ngoài cây harness (sẽ chết khi cài vào dự án).
- **Bảo thủ khi xoá:** nghi 2 file trùng → ĐỌC nội dung (hoặc giao subagent) rồi mới quyết; phần lớn "nghi trùng" là biên-giới có chủ ý.
- **Định kỳ dedup-audit** khi kho doc phình: scan(tên+ref-count) → cluster → đọc-hết → verify.
