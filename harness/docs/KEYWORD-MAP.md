# loop-harness — Bản đồ keyword (từ điển điều hướng)

Mục tiêu: nhìn 1 file là hiểu **loop-harness gồm những khái niệm gì, mỗi cái ở đâu**. Mỗi keyword = 1 dòng nghĩa + trỏ file **owner** (nơi giải thích đầy đủ). Nguyên tắc DRY: file này KHÔNG giải thích lại chi tiết — nó là mục lục.

> Repo: **loop-harness** (đổi từ `videcode-harness` 2026-07-31; GitHub redirect slug cũ nên clone cũ vẫn chạy).
>
> **loop-harness là gì (1 câu):** một *harness* (khung vận hành cho agent) nhận spec (đặc tả yêu cầu) → dựng app chạy được (**Mode A – Build**) → rồi chạy **vòng lặp tự-sửa** nuôi app tiến hoá (**Mode B – the loop**). Điểm khác biệt = **the loop**, không phải tài liệu.

---

## A. Xương sống — 2 chế độ + vòng lặp
> Owner: [`OPERATING-MODES.md`](./OPERATING-MODES.md) — ĐỌC ĐẦU TIÊN.

| Keyword | Nghĩa 1 dòng |
|---|---|
| **Mode A — Build** | Chế độ dựng app: hữu hạn, 1 chiều (spec → app chạy được). Driver = `/stage-next`. |
| **Mode B — Steady-state = the loop** | Chế độ nuôi app sau go-live (thời điểm app lên môi trường thật): vòng lặp vô hạn trên bảng issue (phiếu việc/vấn đề trên bảng theo dõi). Steady-state = trạng thái vận hành ổn định sau go-live. Nơi **chất lượng hội tụ**. |
| **the loop** (vòng lặp) | **Đồ vật cụ thể** = chu trình vận hành Mode B. Trả lời "mỗi vòng LÀM GÌ": 6 **nhịp** discover (phát hiện việc) → dispatch (giao việc cho agent) → verify (xác minh) → recover (tự-sửa khi lỗi) → persist (lưu trạng thái) → decide-next (quyết việc kế). Dùng khi **vận hành** dự án live. |
| **Loop Engineering** (kỹ nghệ vòng lặp) | **Bộ môn / 4 lớp bọc nhau** (framing): prompt ⊂ context ⊂ harness ⊂ loop — **lớp ngoài BỌC lớp trong, không thay thế**. Trả lời "hỏng ở lớp nào" → sửa đúng lớp. Dùng khi **thiết kế/chẩn đoán** harness. Owner: [`OPERATING-MODES.md`](./OPERATING-MODES.md) § four nested layers. |
| **the loop ⟂ Loop Engineering** | KHÔNG cạnh tranh: *Loop Engineering* = **bộ môn** (4 lớp bọc nhau); *the loop* = **đồ vật** lớp ngoài cùng chế ra (6 nhịp). Ẩn dụ: Loop Engineering = ngành cơ khí; the loop = cỗ động cơ ngành đó chế ra. ⚠️ KHÔNG phải bậc thang — leo lên lớp ngoài không có nghĩa là xong lớp trong. |
| **go-live (graduation — tốt nghiệp)** | Điểm chuyển A→B: app deploy lên env thường trực đầu tiên. |

## B. Quy trình Build (Mode A)
> Owner: [`WORKFLOW.md`](./WORKFLOW.md) (bước + gate), [`STAGE_GOALS.md`](./STAGE_GOALS.md) (mục tiêu từng bước).

| Keyword | Nghĩa 1 dòng |
|---|---|
| **3 macro** | Pre-Build (1.x) / Build & Go-live (2.x) / Post-Build (3.x). Bản đồ tổng. |
| **`/stage-next`** | Lệnh chạy bước kế tiếp của WORKFLOW qua subagent (agent con) `stage-runner`, ép gate (chốt kiểm), commit ranh giới. |
| **`/build-phase`** | Vòng lặp code 1 phase (pha/giai đoạn build) ở bước 2.6 (code → verify AC → phase kế). Vòng lặp thật DUY NHẤT trong Mode A. |
| **`/gate-check`** | Kiểm 1 gate bất kỳ theo yêu cầu. |
| **`STAGE.md`** | Bảng theo dõi "dự án đang ở bước nào" (1 dòng). Sau go-live phải flip sang Steady-state. |
| **Lane (làn quy trình) (Full / Lite)** | Chọn ở intake (tiếp nhận đầu vào): Full = việc khách trả tiền (BA (Business Analyst — phân tích nghiệp vụ) đầy đủ); Lite = tool nội bộ (SRS (Software Requirements Specification — đặc tả yêu cầu phần mềm)-lite 1 file). Macro 2–3 giống nhau. |
| **walking skeleton** (bộ xương biết đi) | Bộ khung app tối thiểu chạy được (login + 1 CRUD (Create/Read/Update/Delete — thêm/đọc/sửa/xoá)) scaffold (khung dựng sẵn) ở 2.4 từ stack template (khung code mẫu). |
| **BUILD MANIFEST** (bản kê thi công) | `docs/build-manifest.md`: các phase P0..PN, mỗi REQ-ID (mã yêu cầu) in-scope (trong phạm vi) nằm đúng 1 phase. |
| **token chain / REQ-ID** (chuỗi truy vết yêu cầu / mã yêu cầu) | Chuỗi truy vết `GAP → REQ-ID → SC → TC`. Owner: [`TRACE_SPEC.md`](./TRACE_SPEC.md). |
| **stack template** (khung code mẫu) | Bộ starter (khung khởi đầu) monorepo (1 repo chứa nhiều package) (pnpm + NestJS/Prisma/Postgres + Next.js + CI (Continuous Integration — tự động tích hợp) + e2e (end-to-end — kiểm thử đầu-cuối)) hình mẫu hasi-hub. |

## C. Vòng lặp issue (Mode B)
> Owner: [`playbooks/steady-state-issue-pipeline.md`](./playbooks/steady-state-issue-pipeline.md) (bản đầy đủ + Recover). Chuẩn tạo issue: [`playbooks/github-issue-standard.md`](./playbooks/github-issue-standard.md).

| Keyword | Nghĩa 1 dòng |
|---|---|
| **10-state model** | Backlog → Ready for Dev → In Dev → Deploying → Ready for Test → QC Testing → Ready for UAT → UAT Testing → Done (+ Cancelled). Issue **chỉ đóng ở Done**. |
| **golden AC-rule** (luật vàng theo tiêu chí nghiệm thu) | QC (Quality Control — kiểm thử chất lượng) fail: lỗi TRONG Acceptance Criteria (tiêu chí nghiệm thu) → lùi In Dev sửa issue cũ; lỗi NGOÀI AC → issue mới. |
| **Refs-not-Closes** | Tham chiếu issue bằng `Refs #N`/`Part of #N` ở CẢ PR body VÀ commit message (squash (gộp các commit thành một khi merge) gộp keyword → `Closes` đóng nhầm). |
| **verify-at-source** (xác minh tại nguồn) | Sau deploy: container đang chạy phải mang đúng commit đã ship. Không tin CI-xanh / HTTP-200. |
| **BA-validate (upstream)** | CS + Tech Lead phân tích nghiệp vụ TRƯỚC khi tạo issue → loop không validate lại. |
| **Recover R1/R2/R3** | Tự-sửa (Frontier 1): R1 re-dispatch khi BLOCKED (chưa build); R2 `push-retry.sh` (retry push flaky); R3 `ship-and-verify.sh` (verify SHA staging, re-trigger 1 lần, mở drift issue). |
| **Issue Type vs Label** | Feature/Bug/Enhancement = **Issue Type** (org-level). Label CHỈ có `github` + `plane`. Module = body, Phase = Milestone. |
| **issue-state.mjs / qc-checklist.mjs** | Script đổi state / sinh QC checklist cho 1 issue. |

## D. Gate (fail-closed = đỏ thì chặn)
> Owner: [`WORKFLOW.md`](./WORKFLOW.md) (định nghĩa gate (chốt kiểm — điều kiện phải đạt mới qua)) + [`scripts/harness-verify-gate.sh`](../scripts/harness-verify-gate.sh) (gate không bypass được).

| Keyword | Nghĩa 1 dòng |
|---|---|
| **verify-gate** (cổng kiểm chứng không bỏ qua được) | Git-hook không-bypass: self-check FAIL CLOSED (mặc định CHẶN khi nghi ngờ/lỗi) nếu hook chưa arm (kích hoạt) / lệch path; test suite gate pre-push. |
| **PB-G1..G4** | Các gate paging khách/chủ ở Pre-Build (freeze (chốt/đóng băng) scope, prototype (bản mẫu giao diện), quote, contract). |
| **DoR / DoD** | Definition of Ready / Done — điều kiện vào/ra của 1 phase/issue. |
| **phase-acceptance** (nghiệm thu pha) | Bộ "legs" nghiệm thu 1 phase (domain-state, IDOR (Insecure Direct Object Reference — lỗ hổng truy cập vượt quyền qua ID)/object-authz, rate-limit, concurrency…). |
| **visual-fidelity / design-system** | Gate khớp UI với prototype đã freeze (adopt export, không vẽ lại). |

## E. Kho tri thức (4 loại — đừng lẫn)
| Keyword | Nghĩa 1 dòng | Ở đâu |
|---|---|---|
| **playbook** | Công thức TÁI DÙNG cho mọi dự án (1 bước macro / 1 domain). 35 cái. | [`playbooks/`](./playbooks/) (index [`README.md`](./playbooks/README.md)) |
| **runbook** | Quy trình vận hành RIÊNG 1 dự án (deploy/seed/env của repo đó). | `docs/` của từng repo dự án |
| **lessons-log** | Sổ bài học & sai lầm (triệu chứng → nguyên nhân → luật). Mỗi DỰ ÁN tự nuôi 1 cuốn. | `docs/lessons-log.md` (template: `templates/lessons-log.md`) |
| **memory** | Trí nhớ bền của CONTROL qua các phiên (fact ngắn có frontmatter). | `~/.claude/projects/.../memory/` |
| **HARNESS_CHANGELOG** | Lịch sử version của harness (v7.0…). | [`HARNESS_CHANGELOG.md`](./HARNESS_CHANGELOG.md) |
| **HARNESS.md** | Operating model + Independence Principle + quyết định đã khoá. | [`HARNESS.md`](./HARNESS.md) |

## F. Domain runbook (gặp gì mở nấy)
> Owner: [`playbooks/`](./playbooks/) — mở đúng cái khi chạm domain đó.

- **Hạ tầng:** `object-storage` (lưu file/S3), `async-job-queue` (BullMQ/queue), `media-pipeline` (video/HLS), `config-driven-identity`, `seed-data-pattern`, `go-live-deploy-verify`.
- **Tích hợp:** `payment-integration`, `external-integration` (bên thứ 3).
- **BA / thiết kế:** `ba-core-doc-bundle`, `discovery-interview`, `gap-analysis`, `scenario-taxonomy`, `design-system-3-tier`, `ui-design-system-contract`, `prototype-export-adoption`.
- **QA (Quality Assurance — đảm bảo chất lượng):** `canonical-e2e-flow`, `e2e-qa-field-by-field`, `code-review-scoring`, `pre-demo-self-qa-checklist`, `feature-issue-ac-demo-standard`.

## G. Vận hành / khởi session
| Keyword | Nghĩa 1 dòng |
|---|---|
| **`cd repo && claude`** hoặc **`ctl <repo>`** | Mở session (phiên làm việc); context tới từ **`CLAUDE.md` của repo** (vai trò + gotcha (điểm dễ vấp)). `ctl` = tiện ích tmux (bộ chia màn hình terminal) mỏng (session + monitor). |
| **CONTROL session** | Phiên orchestrator (điều phối viên): giao task → poll (thăm dò trạng thái) → ship. Không tự cày code feature. |
| **`claude daemon` / `claude agents` / FleetView** | Bền session / theo dõi các agent đang chạy. |
| **`flow`** | Ceremony (nghi thức) git+gh cắt release/ship (có xác nhận). Chỉ git+gh, không đụng worktree/Claude. |
| **`wait-workers.sh`** | ctl chờ bg-worker tới tín hiệu DONE (PR MERGEABLE / worker terminal) — thay vòng poll tự chế. |
| **`run-log.mjs`** (cái cân) | 1 dòng JSONL / 1 lần dispatch (`start`→`end`), `report --by harness` so các bản harness. Ghi NGOÀI git, dùng chung mọi repo. **Bắt buộc kẹp quanh mọi dispatch** — không có nó thì hill-climbing loop không có số để leo. |
| **ops-board** | Mặt phẳng trạng thái NỘI BỘ (`templates/ops-board/`): worker đang chạy · số của kỳ · so bản harness · chỗ ùn. Cố ý KHÔNG vẽ lại bảng 10-state. Khách xem mặt riêng (D4). |
| **verify-at-source** | (xem C) nguyên tắc deploy xuyên suốt: xác nhận artifact chạy = commit đã ship. |

---

## H. Tên nhà ⟷ tên ngành (bảng phiên dịch)

Repo này đặt tên **tự chế** cho gần hết khái niệm — dùng trong nhà thì tốt, nhưng ra ngoài thì không ai hiểu, và ngược lại đọc tài liệu ngành không nhận ra "cái này mình có rồi". Bảng dưới **không đổi tên đang dùng** (đổi là loạn hết doc), chỉ ghi kèm **tên ngành gọi là gì** để:
- onboard dev mới đã quen từ vựng ngành (khỏi mất 1 tuần dịch ngược),
- nói chuyện với khách/đối tác kỹ thuật bằng từ họ tìm kiếm,
- đọc bài/tool ngoài mà biết map vào đâu.

> Trạng thái từ vựng (khảo sát 2026-08): `context engineering` đã chuẩn hoá; `agent harness` / `harness engineering` **hội tụ nhanh nhất** trong nhóm từ mới; `loop engineering` mới thành hình 06/2026; `graph engineering` gắn với framework (LangGraph/AutoGen). Chưa từ nào đóng băng hoàn toàn — bảng này cần soát lại mỗi vài tháng.

| Repo gọi | Ngành gọi | Ghi chú khi dùng ra ngoài |
|---|---|---|
| **Mode A — Build** (spec → REQ-ID → build-manifest → phase) | **Spec-Driven Development (SDD)** | Trùng gần hết: 6 thành phần của SDD (outcomes · scope boundaries · constraints · prior decisions · task breakdown · **verification criteria**) đều có mặt. Nói "SDD" thì mượn được cả hệ tooling ngành (Spec Kit, Kiro, OpenSpec…). |
| **Mode B — the loop** (issue-pipeline) | **event-driven loop** + steady-state | Trigger = 1 issue. |
| **`/build-phase`** | **agent loop** (cấp phase) | Vòng lặp nền: model → tool → quan sát → lặp. |
| **verify-gate + verify-at-source + QC-vs-AC** | **verification loop** | Nguyên tắc ngành: *loop on evidence, not on confidence* — mình có sẵn, còn chặt hơn (FC6: không tin cả tín hiệu wrapper). |
| **Growth Rule** (friction → vá harness → re-propagate) | **hill-climbing loop** | Vòng cải tiến harness. Cần `run-log.mjs` mới leo có đo. |
| **CONTROL session → N bg worker** | **supervisor pattern** | 2026 doanh nghiệp đang bỏ "swarm" quay về supervisor + phase-gating cứng = đúng cái mình làm. |
| **Locked Decisions D1–D6** | **constitution** (Constitutional SDD) | Ràng buộc bất-khả-thương-lượng, có version. |
| **stack template · steady-state kit** | **harness template** | |
| **CONTEXT_RULES + context-monitor** | **context engineering · compaction · context budget** | |
| **`run-log.mjs`** | **evals · observability / tracing** | Ngành: *evals là dữ liệu huấn luyện của harness*. |
| **10-state model** (edge được `issue-state.mjs` ép) | **state machine** — liều nhỏ của **graph engineering** | Đây là đường DUY NHẤT đủ ổn định để formalize; xem `OPERATING-MODES.md` § why there is no graph layer. |
| **agent build ra sản phẩm** ⟷ **agent nằm TRONG sản phẩm** | **build-side agent** ⟷ **product-side agent** | ⚠️ Hai thứ khác hẳn (gate, evals, mức cẩn thận). Lẫn nhau là lỗi kiến trúc tốn. Harness này chỉ quản **build-side**. |

**Từ nên tránh khi nói với khách/đối tác kỹ thuật:** *"vibecode / vibe coding"* — ngành dùng từ này để chỉ **cách làm ẩu** (agent sinh code trông hợp lý nhưng trôi khỏi ý định); SDD sinh ra chính là để phản ứng lại nó. Repo này thực chất đang làm SDD nghiêm túc → dùng từ đó là tự hạ mình. Trong nhà gọi sao cũng được.

**Từ khoá ngành mình CHƯA có** (trùng đúng backlog): `evals` (đang mở — `run-log.mjs` là bước 1) · `observability/tracing` · `least-privilege / permissions` (dispatch đang `bypassPermissions`) · `durable execution` · `memory engineering`.

---

## Thứ tự đọc
Xem [`UNDERSTANDING-loop-harness.md`](./UNDERSTANDING-loop-harness.md) §8 (Dev mới bắt đầu) — 1 nguồn duy nhất, file này không lặp lại.
