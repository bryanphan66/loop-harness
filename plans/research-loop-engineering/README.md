# Research: Loop Engineering

> Khu vực nghiên cứu (research) tập hợp + phân tích các nguồn về **Loop Engineering**.
> Control session `ctl-loop-harness` điều phối. Nguồn do Trung cung cấp dần.

## Cách dùng
- Trung đưa nguồn (link bài báo, tin tức, video, hoặc file) -> tôi thêm 1 dòng vào bảng dưới + tạo 1 file note phân tích trong `notes/`.
- File thô (PDF, ảnh, transcript tải về) bỏ vào `sources/`.
- Ghi chú phân tích từng nguồn: `notes/{stt}-{slug}.md`.

## Câu hỏi nghiên cứu (research question)
- Field có đồng ý 1 định nghĩa "agent loop" không? -> KHÔNG (audit 45 nguồn: 11 camp bất đồng).
- Đâu là phần lõi mọi nguồn đều đồng ý, và harness "the loop" (Mode B) mình đã làm đúng chưa?

## Sổ nguồn (source log)

| # | Loại | Tiêu đề / Link | Ngày thêm | Note | Trạng thái |
|---|------|----------------|-----------|------|------------|
| 1 | bài báo (guide) | agent-loops-beginner-guide.html (`sources/`) | 2026-08-05 | `notes/01-agent-loops-beginner-guide.md` | đã phân tích |
| 2 | báo cáo (audit) | agent-loop-source-audit-report.html (`sources/`) | 2026-08-05 | `notes/02-agent-loop-source-audit-report.md` | đã phân tích |
| 3 | video | "99% Mọi Người Hiểu Sai Về Agent Loops" - Phước (transcript do Trung cung cấp) | 2026-08-05 | gộp trong note 02 (mục so sánh) | đã tóm tắt |

Loại (type): `bài báo (article)` · `tin tức (news)` · `video` · `paper` · `khác`.
Trạng thái: `mới (new)` -> `đã đọc (read)` -> `đã phân tích (analyzed)`.

## Tổng hợp (synthesis) — cập nhật 2026-08-05 (sau 3 nguồn đầu)

### Lõi chung (invariant core) - cả 3 nguồn đồng ý
1. **LLM ở trung tâm** ra quyết định mỗi vòng.
2. **Lặp lại** (iteration) - gọi model nhiều lần, không 1 phát.
3. **State/feedback đẩy về sau** - kết quả vòng này vào context vòng sau (git + progress file khi chạy dài).
4. **Goal rõ ràng, kiểm được bằng máy** - là "mỏ neo" của loop. ("done" auto do model tự chốt thì KHÔNG chắc chắn.)
5. **Verify step** - "bước bị đánh giá thấp nhất"; checker riêng > agent tự chấm.
6. **Stop condition** - goal đạt + trần cứng (max tries); đừng tin model tự dừng.

### 3 mô hình loop (cả 3 nguồn thống nhất)
solo loop -> maker-checker (người làm / người duyệt) -> team + orchestrator (1 lead chia việc).

### Điểm mới đáng chú ý
- **"Loop engineering"** (Steinberger, frontier grassroots): đừng gõ prompt cho agent từng lượt, hãy THIẾT KẾ cái loop tự prompt agent - con người = kiến trúc sư loop. = đúng lập trường Mode B của harness.
- Không có định nghĩa chung: formal (vendor/academic) coi loop = reason-act-observe của agent; grassroots coi loop = thứ con người thiết kế bao quanh agent.

### Harness "the loop" (Mode B) đối chiếu -> phần lớn ĐÃ ĐÚNG
verify-at-source fail-closed = verify step; 10-state issue-pipeline + AC/DoD = goal kiểm được; progress file + git = state externalize; agent-QC + human BA = maker-checker; max retries = hard stop; human thiết kế pipeline, worker chạy = loop engineering. **Harness còn ĐI XA HƠN nguồn**: các nguồn dạy loop 1 agent hoặc 1 cặp; harness = orchestrator điều phối N worker đa repo qua GitHub Issues.

### Gap chưa nguồn nào trả lời (cơ hội cho harness)
1. Ai giữ state cho loop đa-context-window (nhiều worker song song)?
2. Enforce ngân sách token (cost) mỗi vòng lặp ở đâu?
3. Khi nào nên RE-DESIGN chính cái loop giữa chừng, không chỉ chạy nó?
(Chi tiết: `notes/02-...md` mục "Unresolved questions".)
