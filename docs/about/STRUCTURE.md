# loop-harness — Bản đồ cấu trúc (STRUCTURE)

Cây thư mục THẬT + vai trò từng phần, để biết **sửa/đọc file nào cho việc gì** và **cái gì được cài vào dự án vs cái gì chỉ để phát triển harness**. Tra khái niệm → [`KEYWORD-MAP.md`](./KEYWORD-MAP.md); hiểu tổng thể → [`UNDERSTANDING-loop-harness.md`](./UNDERSTANDING-loop-harness.md).

## Kiến thức Hasi + elearning nằm đâu (tra nhanh)

Không gom vào 1 doc (dễ lỗi thời); mỗi loại ở kho riêng:

| Cần gì | Mở kho |
|---|---|
| Cách LÀM 1 việc (recipe) | `docs/playbooks/` |
| Bài học "đổ máu" khi dựng harness | `plans/lessons-log.md` |
| Gotcha vận hành (loop / deploy / QC / dispatch) | auto-memory `MEMORY.md` |
| Deliverable từng mốc (nghiệm thu, audit, benchmark) | `plans/reports/` |
| Cách Trung muốn làm việc (style, review, deploy, coach) | `~/.claude/rules/` |

## Cây repo (PHẲNG — root LÀ sản phẩm, từ 2026-09-01)

Trước đây sản phẩm nằm lồng trong `harness/`; đã **làm phẳng** ra root (bỏ 1 lớp `harness/harness` thừa + dedup `plans/`). Giờ **repo root CHÍNH LÀ harness**; ranh giới sản-phẩm-vs-xưởng không còn theo thư mục mà theo **`SKELETON_PATHS` trong `scripts/install-harness.sh`** (danh sách cái gì được bê đi cài).

```
loop-harness/   (= chính là harness — không còn thư mục con harness/)
├── AGENTS.md ········· [SẢN PHẨM] operating model cho agent (task loop + gate + thứ tự đọc)
├── docs/ ············· [SẢN PHẨM] tri thức harness — chia process/ (cách CHẠY) + about/ (về chính harness) + playbooks/ gates/ mau-tai-lieu/ (bảng dưới). Vào cửa: docs/README.md
├── scripts/ ·········· [SẢN PHẨM] install-harness.sh + harness-verify-gate.sh + run-log/wait-workers
├── scaffolds/ ········ [SẢN PHẨM] scaffold CODE bê vào project: stack (Mode A) + steady-state (Mode B)
├── .claude/ ·········· [SẢN PHẨM, tracked] commands + agents + hooks (ship khi cài); +[XƯỞNG, gitignore] worktrees/agent-memory/settings.local
├── .githooks/ ········ [SẢN PHẨM] pre-commit + pre-push (gate fail-closed, không bypass)
├── README.md ········· [XƯỞNG] cửa vào: harness là gì, cài, chạy loop
├── CLAUDE.md ········· [XƯỞNG] brief control-session (KHÔNG ship — dev-only)
└── plans/ ············ [XƯỞNG] kế hoạch + reports + lessons-log/team-playbook CỦA harness (KHÔNG ship)
```

> **Ranh giới sản-phẩm vs xưởng:** **Sản phẩm** = những gì `install-harness.sh` bê đi (SKELETON_PATHS: `AGENTS.md docs .claude .githooks scripts/{harness-verify-gate,install-harness,README}`) + `scaffolds/stack-pnpm-nest-next` (qua STACK_TEMPLATE_RELDIR). **Xưởng** (KHÔNG ship) = `CLAUDE.md`, `plans/`, runtime của `.claude/` (worktrees/agent-memory/settings.local — gitignore).
> **2 thứ tên khác nhau, đừng nhầm:** `docs/mau-tai-lieu/` = MẪU TÀI LIỆU (form Markdown: build-manifest, feature-register, SOW…). `scaffolds/` (root) = SCAFFOLD CODE (app monorepo). Doc-form ≠ code-scaffold.

## `docs/` — tri thức (chia folder theo VAI TRÒ, từ 2026-09-01)

> Trước để 14 file .md rời ở `docs/` root (khó tra). Đã gom: **`process/`** (cách harness CHẠY: WORKFLOW, STAGE_GOALS, macro-2.md, OPERATING-MODES, TRACE_SPEC, ROLE_MAP, CONTEXT_RULES) + **`about/`** (về chính harness: HARNESS, STRUCTURE, KEYWORD-MAP, UNDERSTANDING, DOC-STANDARD, TEST_MATRIX, HARNESS_CHANGELOG). `docs/README.md` là bản đồ vào cửa. Bảng dưới ghi rõ **ai đọc** từng file.

**① Xương sống — NGƯỜI đọc (onboarding — nhập môn, theo thứ tự này):**
| File | Vai trò |
|---|---|
| `UNDERSTANDING-loop-harness.md` | Narrative (kể chuyện) onboarding (nhập môn) + scorecard (bảng điểm) thành thật (PROVEN/PATCHED/ASPIRATIONAL = đã kiểm chứng / vá-từ-bài-học / chưa-làm). **Đọc đầu.** |
| `KEYWORD-MAP.md` | Từ điển điều hướng mọi keyword → file owner. |
| `OPERATING-MODES.md` | Đặc tả chính xác **2-mode** (2 chế độ) (xương sống) + Loop-Engineering (kỹ nghệ vòng lặp) lens (lăng kính chẩn đoán). |
| `WORKFLOW.md` | Bảng bước 1.x/2.x/3.x (bên trong 2 mode) + gate (chốt kiểm) + lane (làn quy trình). **Load-bearing (trụ chịu lực — không bỏ được).** |
| `HARNESS.md` | Operating model (mô hình vận hành) + Independence Principle (nguyên tắc độc lập) + quyết định đã khoá. |
| `STRUCTURE.md` | (file này) bản đồ cấu trúc. |

**② Chi tiết bước — MÁY đọc (hook/command nạp đúng lúc; load-bearing — trụ chịu lực, không bỏ được):**
| File | Vai trò |
|---|---|
| `STAGE_GOALS.md` | Text mục tiêu chạy được của từng bước (dùng bởi `/stage-next`). |
| `CONTEXT_RULES.md` | Context-engineering (kỹ thuật quản lý ngữ cảnh): đọc gì / bỏ gì mỗi bước ở token (đơn vị văn bản LLM) thấp nhất (pair với hook (móc tự động) `context-monitor`). |
| `TRACE_SPEC.md` | Grammar (văn phạm) token chain (chuỗi truy vết yêu cầu) `GAP→REQ-ID→SC→TC` + luật RTM (Requirements Traceability Matrix — ma trận truy vết yêu cầu). |
| `ROLE_MAP.md` | Vai trò SDLC (Software Development Life Cycle — vòng đời phát triển phần mềm) theo bước (được ~6 file máy móc tham chiếu). |
| `TEST_MATRIX.md` | Register (sổ đăng ký) test/verify (đọc ở mỗi 2.x close; ~8 file tham chiếu). |

**③ Thư viện (thư mục) — MỖI zone có `README.md` liệt kê từng file 1-dòng. Không hiểu file nào → mở README của zone đó.**
| Thư mục | Số | Vai trò | Index (mở để biết từng file là gì) |
|---|---|---|---|
| `playbooks/` | 34 | công thức TÁI DÙNG (1 bước macro / 1 domain) | `playbooks/README.md` |
| `gates/` | 11 | định nghĩa gate (PB-G, DoR, DoD, phase-acceptance, visual-fidelity…) | `gates/README.md` |
| `mau-tai-lieu/` | >40 (gồm `locale-vi/` fork song ngữ) | mẫu file dự án (build-manifest, srs-lite, bao-gia, STAGE.md…) | `mau-tai-lieu/README.md` |
| `design-system/` | 3 | quy tắc UI 3-tier (floorplan/action/modal) | `design-system/README.md` |

**④ Meta / tham chiếu — HỖN HỢP (không thuộc xương sống lẫn máy-móc):**
| File | Vai trò | Ai đọc |
|---|---|---|
| `README.md` | Crosswalk (bảng ánh xạ): process-folder của harness → doc trong `CLAUDE.md` toàn cục + thứ tự đọc doc. | người + máy |
| `DOC-STANDARD.md` | Rubric (thước đo) C1-C10 để viết/refactor bất kỳ doc; có When-To-Run. | người (tác giả doc) |
| `HARNESS_CHANGELOG.md` | Version log (nhật ký phiên bản) của CHÍNH mô hình harness (docs/playbook/gate/template); **dòng `Current version:` ở đầu file là NGUỒN DUY NHẤT** — `run-log.mjs` đọc chính dòng đó, nên đừng chép số version sang file khác. State dự án KHÔNG ở đây. | tham chiếu |

## `.claude/` — tự động hoá (index: `.claude/README.md`)
- `commands/`: **`/stage-next`** (chạy bước kế), **`/build-phase`** (vòng code phase), **`/gate-check`**.
- `agents/stage-runner.md`: subagent (agent con) chạy 1 bước trong context riêng (isolated — cô lập).
- `hooks/`: `stage-deliver`, `qa-deliver`, `context-monitor` (cảnh báo 40/60/80/95% token), `notify`.
- `settings.json` + `scripts/notifier-send.sh`.

## `scripts/` + `.githooks/` — gate + cài đặt (index: `scripts/README.md`)
- `install-harness.sh`: bê skeleton (từ repo root) vào dự án mới + init git + bật verify-gate (cổng kiểm chứng không bỏ qua được).
- `harness-verify-gate.sh` + `pre-commit`/`pre-push`: **gate fail-closed (mặc định CHẶN khi nghi ngờ/lỗi) không bypass (không bỏ qua được)** (chặn commit lỗi lint/typecheck/register).
- `wait-workers.sh`: ctl chờ bg-worker tới tín hiệu DONE (PR MERGEABLE hoặc worker terminal) — thay vòng poll tự chế.
- `run-log.mjs`: **cái cân** — 1 dòng JSONL / 1 lần dispatch, `report` so các bản harness. Ghi NGOÀI git (`~/.claude/loop-harness/run-log.jsonl`), dùng chung mọi repo.

## `scaffolds/` — 3 scaffold code (root)
- `stack-pnpm-nest-next/`: khung app **Mode A (chế độ A — Build)** (walking skeleton (bộ xương biết đi) — NestJS+Prisma+Postgres+Next.js+CI+e2e+docker). Dùng ở bước 2.4.
- `steady-state/` (trạng thái vận hành ổn định sau go-live): kit (bộ đồ nghề) **Mode B** — `issue-state.mjs` (đặt state + **ép cạnh chuyển hợp lệ**), `qc-checklist.mjs`, `push-retry.sh` (Recover (tự-sửa khi lỗi) R2), `ship-and-verify.sh` (Recover R3), `bug-report.md`, `regression-checklist.md`. Copy vào dự án khi go-live (thời điểm app lên môi trường thật).

## 4 kho tri thức — VỊ TRÍ
> Owner: [`UNDERSTANDING-loop-harness.md`](./UNDERSTANDING-loop-harness.md) §5 ("cất gì vào đâu"). 4 kho = playbook · runbook · lessons-log · memory. Chi tiết + luật tái dùng ở đó (không lặp bảng ở đây nữa).
