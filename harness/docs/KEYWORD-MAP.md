# loop-harness — Bản đồ keyword (từ điển điều hướng)

Mục tiêu: nhìn 1 file là hiểu **loop-harness gồm những khái niệm gì, mỗi cái ở đâu**. Mỗi keyword = 1 dòng nghĩa + trỏ file **owner** (nơi giải thích đầy đủ). Nguyên tắc DRY: file này KHÔNG giải thích lại chi tiết — nó là mục lục.

> Repo: **loop-harness** (đổi từ `videcode-harness` 2026-07-31; GitHub redirect slug cũ nên clone cũ vẫn chạy).
>
> **loop-harness là gì (1 câu):** một *harness* (khung vận hành cho agent) nhận spec → dựng app chạy được (**Mode A – Build**) → rồi chạy **vòng lặp tự-sửa** nuôi app tiến hoá (**Mode B – the loop**). Điểm khác biệt = **the loop**, không phải tài liệu.

---

## A. Xương sống — 2 chế độ + vòng lặp
> Owner: [`OPERATING-MODES.md`](./OPERATING-MODES.md) — ĐỌC ĐẦU TIÊN.

| Keyword | Nghĩa 1 dòng |
|---|---|
| **Mode A — Build** | Chế độ dựng app: hữu hạn, 1 chiều (spec → app chạy được). Driver = `/stage-next`. |
| **Mode B — Steady-state = the loop** | Chế độ nuôi app sau go-live: vòng lặp vô hạn trên bảng issue. Nơi **chất lượng hội tụ**. |
| **the loop** (vòng lặp) | **Đồ vật cụ thể** = chu trình vận hành Mode B. Trả lời "mỗi vòng LÀM GÌ": 6 **nhịp** discover → dispatch → verify → recover → persist → decide-next. Dùng khi **vận hành** dự án live. |
| **Loop Engineering** (kỹ nghệ vòng lặp) | **Bộ môn / bậc thang** (framing). Trả lời "hệ trưởng thành TỚI ĐÂU": 4 **bậc** prompt → context → harness → loop. Dùng khi **thiết kế/định vị** harness. |
| **the loop ⟂ Loop Engineering** | KHÔNG cạnh tranh: *Loop Engineering* = cái **thang** (dọc, 4 bậc); *the loop* = thứ nằm ở **đỉnh** thang đó (ngang, 6 nhịp). Ẩn dụ: Loop Engineering = ngành cơ khí; the loop = cỗ động cơ ngành đó chế ra. |
| **go-live (graduation)** | Điểm chuyển A→B: app deploy lên env thường trực đầu tiên. |

## B. Quy trình Build (Mode A)
> Owner: [`WORKFLOW.md`](./WORKFLOW.md) (bước + gate), [`STAGE_GOALS.md`](./STAGE_GOALS.md) (mục tiêu từng bước).

| Keyword | Nghĩa 1 dòng |
|---|---|
| **3 macro** | Pre-Build (1.x) / Build & Go-live (2.x) / Post-Build (3.x). Bản đồ tổng. |
| **`/stage-next`** | Lệnh chạy bước kế tiếp của WORKFLOW qua subagent `stage-runner`, ép gate, commit ranh giới. |
| **`/build-phase`** | Vòng lặp code 1 phase ở bước 2.6 (code → verify AC → phase kế). Vòng lặp thật DUY NHẤT trong Mode A. |
| **`/gate-check`** | Kiểm 1 gate bất kỳ theo yêu cầu. |
| **`STAGE.md`** | Bảng theo dõi "dự án đang ở bước nào" (1 dòng). Sau go-live phải flip sang Steady-state. |
| **Lane (Full / Lite)** | Chọn ở intake: Full = việc khách trả tiền (BA đầy đủ); Lite = tool nội bộ (SRS-lite 1 file). Macro 2–3 giống nhau. |
| **walking skeleton** | Bộ khung app tối thiểu chạy được (login + 1 CRUD) scaffold ở 2.4 từ stack template. |
| **BUILD MANIFEST** | `docs/build-manifest.md`: các phase P0..PN, mỗi REQ-ID in-scope nằm đúng 1 phase. |
| **token chain / REQ-ID** | Chuỗi truy vết `GAP → REQ-ID → SC → TC`. Owner: [`TRACE_SPEC.md`](./TRACE_SPEC.md). |
| **stack template** | Bộ starter monorepo (pnpm + NestJS/Prisma/Postgres + Next.js + CI + e2e) hình mẫu hasi-hub. |

## C. Vòng lặp issue (Mode B)
> Owner: [`playbooks/steady-state-issue-pipeline.md`](./playbooks/steady-state-issue-pipeline.md) (bản đầy đủ + Recover). Chuẩn tạo issue: [`playbooks/github-issue-standard.md`](./playbooks/github-issue-standard.md).

| Keyword | Nghĩa 1 dòng |
|---|---|
| **10-state model** | Backlog → Ready for Dev → In Dev → Deploying → Ready for Test → QC Testing → Ready for UAT → UAT Testing → Done (+ Cancelled). Issue **chỉ đóng ở Done**. |
| **golden AC-rule** | QC fail: lỗi TRONG Acceptance Criteria → lùi In Dev sửa issue cũ; lỗi NGOÀI AC → issue mới. |
| **Refs-not-Closes** | Tham chiếu issue bằng `Refs #N`/`Part of #N` ở CẢ PR body VÀ commit message (squash gộp keyword → `Closes` đóng nhầm). |
| **verify-at-source** | Sau deploy: container đang chạy phải mang đúng commit đã ship. Không tin CI-xanh / HTTP-200. |
| **BA-validate (upstream)** | CS + Tech Lead phân tích nghiệp vụ TRƯỚC khi tạo issue → loop không validate lại. |
| **Recover R1/R2/R3** | Tự-sửa (Frontier 1): R1 re-dispatch khi BLOCKED (chưa build); R2 `push-retry.sh` (retry push flaky); R3 `ship-and-verify.sh` (verify SHA staging, re-trigger 1 lần, mở drift issue). |
| **Issue Type vs Label** | Feature/Bug/Enhancement = **Issue Type** (org-level). Label CHỈ có `github` + `plane`. Module = body, Phase = Milestone. |
| **issue-state.mjs / qc-checklist.mjs** | Script đổi state / sinh QC checklist cho 1 issue. |

## D. Gate (fail-closed = đỏ thì chặn)
> Owner: [`WORKFLOW.md`](./WORKFLOW.md) (định nghĩa gate) + [`scripts/harness-verify-gate.sh`](../scripts/harness-verify-gate.sh) (gate không bypass được).

| Keyword | Nghĩa 1 dòng |
|---|---|
| **verify-gate** | Git-hook không-bypass: self-check FAIL CLOSED nếu hook chưa arm / lệch path; test suite gate pre-push. |
| **PB-G1..G4** | Các gate paging khách/chủ ở Pre-Build (freeze scope, prototype, quote, contract). |
| **DoR / DoD** | Definition of Ready / Done — điều kiện vào/ra của 1 phase/issue. |
| **phase-acceptance** | Bộ "legs" nghiệm thu 1 phase (domain-state, IDOR/object-authz, rate-limit, concurrency…). |
| **visual-fidelity / design-system** | Gate khớp UI với prototype đã freeze (adopt export, không vẽ lại). |

## E. Kho tri thức (4 loại — đừng lẫn)
| Keyword | Nghĩa 1 dòng | Ở đâu |
|---|---|---|
| **playbook** | Công thức TÁI DÙNG cho mọi dự án (1 bước macro / 1 domain). 35 cái. | [`playbooks/`](./playbooks/) (index [`README.md`](./playbooks/README.md)) |
| **runbook** | Quy trình vận hành RIÊNG 1 dự án (deploy/seed/env của repo đó). | `docs/` của từng repo dự án |
| **lessons-log** | Sổ bài học & sai lầm (triệu chứng → nguyên nhân → luật). CONTROL bồi đắp mỗi lần vấp. | [`../../docs/lessons-log.md`](../../docs/lessons-log.md) |
| **memory** | Trí nhớ bền của CONTROL qua các phiên (fact ngắn có frontmatter). | `~/.claude/projects/.../memory/` |
| **HARNESS_CHANGELOG** | Lịch sử version của harness (v7.0…). | [`HARNESS_CHANGELOG.md`](./HARNESS_CHANGELOG.md) |
| **HARNESS.md** | Operating model + Independence Principle + quyết định đã khoá. | [`HARNESS.md`](./HARNESS.md) |

## F. Domain runbook (gặp gì mở nấy)
> Owner: [`playbooks/`](./playbooks/) — mở đúng cái khi chạm domain đó.

- **Hạ tầng:** `object-storage` (lưu file/S3), `async-job-queue` (BullMQ/queue), `media-pipeline` (video/HLS), `config-driven-identity`, `seed-data-pattern`, `go-live-deploy-verify`.
- **Tích hợp:** `payment-integration`, `external-integration` (bên thứ 3).
- **BA / thiết kế:** `ba-core-doc-bundle`, `discovery-interview`, `gap-analysis`, `scenario-taxonomy`, `design-system-3-tier`, `ui-design-system-contract`, `prototype-export-adoption`.
- **QA:** `canonical-e2e-flow`, `e2e-qa-field-by-field`, `code-review-scoring`, `pre-demo-self-qa-checklist`, `feature-issue-ac-demo-standard`.

## G. Vận hành / khởi session
| Keyword | Nghĩa 1 dòng |
|---|---|
| **`cd repo && claude`** hoặc **`ctl <repo>`** | Mở session; context tới từ **`CLAUDE.md` của repo** (vai trò + gotcha). `ctl` = tiện ích tmux mỏng (session + monitor). |
| **CONTROL session** | Phiên orchestrator: giao task → poll → ship. Không tự cày code feature. |
| **`claude daemon` / `claude agents` / FleetView** | Bền session / theo dõi các agent đang chạy. |
| **`flow`** | Ceremony git+gh cắt release/ship (có xác nhận). Chỉ git+gh, không đụng worktree/Claude. |
| **verify-at-source** | (xem C) nguyên tắc deploy xuyên suốt: xác nhận artifact chạy = commit đã ship. |

---

## Thứ tự đọc để "thấm" loop-harness
1. [`OPERATING-MODES.md`](./OPERATING-MODES.md) — 2 mode + the loop (trọng tâm).
2. [`HARNESS.md`](./HARNESS.md) — operating model + Independence Principle.
3. [`WORKFLOW.md`](./WORKFLOW.md) — bản đồ 3-macro, bước, gate, lane.
4. [`playbooks/steady-state-issue-pipeline.md`](./playbooks/steady-state-issue-pipeline.md) — vận hành Mode B (vòng lặp).
5. [`playbooks/README.md`](./playbooks/README.md) — mục lục 35 playbook.
