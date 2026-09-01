# loop-harness — Bản đồ cấu trúc (STRUCTURE)

Cây thư mục THẬT + vai trò từng phần, để biết **sửa/đọc file nào cho việc gì** và **cái gì được cài vào dự án vs cái gì chỉ để phát triển harness**. Tra khái niệm → [`KEYWORD-MAP.md`](./KEYWORD-MAP.md); hiểu tổng thể → [`UNDERSTANDING-loop-harness.md`](./UNDERSTANDING-loop-harness.md).

## Cây repo (2 tầng)

```
loop-harness/                    ← ranh giới: [WORKSHOP] ở root · [SẢN PHẨM] trong harness/
├── README.md ············ [workshop] cửa vào: harness là gì, cài, chạy loop
├── CLAUDE.md ··········· [workshop] brief control-session (nạp tự động theo cwd)
├── .gitignore ·········· ignore .claude phiên-dev (worktrees/settings.local/agent-memory)
├── .claude/ ············ [workshop, dev-local] config phiên Claude Code làm việc TRÊN repo này
│                          (KHÁC harness/.claude — quy ước Claude Code, phần cá nhân bị gitignore)
├── plans/ ············· [workshop] kế hoạch + reports + lessons-log/team-playbook của HARNESS
└── harness/ ··········· ⭐ [SẢN PHẨM] tự-đủ — install-harness.sh bê nguyên cây này vào dự án mới
    ├── AGENTS.md ········· operating model cho agent (task loop + gate + thứ tự đọc)
    ├── docs/ ············· tri thức harness (bảng bên dưới) — DUY NHẤT 1 cây docs được-track
    ├── .claude/ ········· tự động hoá SHIP: commands + agent + hooks
    ├── scripts/ ········· install-harness.sh + harness-verify-gate.sh
    ├── .githooks/ ······· pre-commit + pre-push (gate fail-closed, không bypass)
    └── templates/ ······· scaffold: stack (Mode A) + steady-state (Mode B) + ops-board + doc-stubs (gồm lessons-log)
```

> **Ranh giới cứng (chuẩn dài hạn):** `harness/` là SẢN PHẨM, **tự-đủ tuyệt đối** (self-contained — không trỏ/phụ thuộc ra ngoài chính nó) — docs trong đó KHÔNG `../../` ra ngoài cây; khi cài đi đâu cũng chạy. Mọi thứ ở root là XƯỞNG (workshop — làm ra harness): `plans/` chứa lessons-log (sổ bài học) + team-playbook (công thức tái dùng của team) + reports CỦA harness; `.claude/` là config phiên dev (gitignore phần cá nhân). Tri thức "cho dự án" (VD lessons-log của dự án) là 1 **template** (khung mẫu) trong `harness/docs/templates/`, không phải lessons-log dev của harness.

## `harness/docs/` — tri thức (4 nhóm, phân theo VAI TRÒ + AI ĐỌC)

> `ls docs/` ra nhiều file loose (rời, không nằm trong thư mục con) là bình thường: chúng KHÔNG gom vào 1 folder (foldering = sửa ~250 path máy-móc tham chiếu, lợi 0 hành vi) mà gom bằng bảng dưới đây. Mỗi nhóm ghi rõ **ai đọc** để tra ngay "file này là gì, cho ai". 14 file loose = ① 6 + ② 5 + ④ 3.

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
| `templates/` | >40 (gồm `locale-vi/` fork song ngữ) | mẫu file dự án (build-manifest, srs-lite, bao-gia, STAGE.md…) | `templates/README.md` |
| `design-system/` | 3 | quy tắc UI 3-tier (floorplan/action/modal) | `design-system/README.md` |

**④ Meta / tham chiếu — HỖN HỢP (không thuộc xương sống lẫn máy-móc):**
| File | Vai trò | Ai đọc |
|---|---|---|
| `README.md` | Crosswalk (bảng ánh xạ): process-folder của harness → doc trong `CLAUDE.md` toàn cục + thứ tự đọc doc. | người + máy |
| `DOC-STANDARD.md` | Rubric (thước đo) C1-C10 để viết/refactor bất kỳ doc; có When-To-Run. | người (tác giả doc) |
| `HARNESS_CHANGELOG.md` | Version log (nhật ký phiên bản) của CHÍNH mô hình harness (docs/playbook/gate/template); **dòng `Current version:` ở đầu file là NGUỒN DUY NHẤT** — `run-log.mjs` đọc chính dòng đó, nên đừng chép số version sang file khác. State dự án KHÔNG ở đây. | tham chiếu |

## `harness/.claude/` — tự động hoá (index: `.claude/README.md`)
- `commands/`: **`/stage-next`** (chạy bước kế), **`/build-phase`** (vòng code phase), **`/gate-check`**.
- `agents/stage-runner.md`: subagent (agent con) chạy 1 bước trong context riêng (isolated — cô lập).
- `hooks/`: `stage-deliver`, `qa-deliver`, `context-monitor` (cảnh báo 40/60/80/95% token), `notify`.
- `settings.json` + `scripts/notifier-send.sh`.

## `harness/scripts/` + `.githooks/` — gate + cài đặt (index: `scripts/README.md`)
- `install-harness.sh`: bê toàn bộ `harness/` vào dự án mới + init git + bật verify-gate (cổng kiểm chứng không bỏ qua được).
- `harness-verify-gate.sh` + `pre-commit`/`pre-push`: **gate fail-closed (mặc định CHẶN khi nghi ngờ/lỗi) không bypass (không bỏ qua được)** (chặn commit lỗi lint/typecheck/register).
- `wait-workers.sh`: ctl chờ bg-worker tới tín hiệu DONE (PR MERGEABLE hoặc worker terminal) — thay vòng poll tự chế.
- `run-log.mjs`: **cái cân** — 1 dòng JSONL / 1 lần dispatch, `report` so các bản harness. Ghi NGOÀI git (`~/.claude/loop-harness/run-log.jsonl`), dùng chung mọi repo.

## `harness/templates/` — 3 scaffold
- `stack-pnpm-nest-next/`: khung app **Mode A (chế độ A — Build)** (walking skeleton (bộ xương biết đi) — NestJS+Prisma+Postgres+Next.js+CI+e2e+docker). Dùng ở bước 2.4.
- `steady-state/` (trạng thái vận hành ổn định sau go-live): kit (bộ đồ nghề) **Mode B** — `issue-state.mjs` (đặt state + **ép cạnh chuyển hợp lệ**), `qc-checklist.mjs`, `push-retry.sh` (Recover (tự-sửa khi lỗi) R2), `ship-and-verify.sh` (Recover R3), `bug-report.md`, `regression-checklist.md`. Copy vào dự án khi go-live (thời điểm app lên môi trường thật).
- `ops-board/`: **mặt phẳng trạng thái nội bộ** (internal status surface) đã đặc tả ở `HARNESS.md` § Status Artifact — 1 file HTML tự-đủ + `Dockerfile` nginx. Đọc `run-log.jsonl` + `board.json` đặt cạnh nó; thiếu file thì rơi về dữ liệu mẫu và **nói thẳng trên banner**. Nhãn `experimental` — chưa chạy trên dữ liệu thật. KHÔNG đưa cho khách (mặt khách là file/URL riêng — D4).

## 4 kho tri thức — VỊ TRÍ ("cất gì vào đâu" xem [`UNDERSTANDING-loop-harness.md`](./UNDERSTANDING-loop-harness.md) §5)
| Kho | Ở đâu |
|---|---|
| **playbook** | `harness/docs/playbooks/` |
| **runbook** | `docs/runbook/` của TỪNG dự án |
| **lessons-log** | mỗi dự án `docs/lessons-log.md`; của chính harness `plans/lessons-log.md` |
| **memory** | `~/.claude/projects/<key>/memory/` (fact riêng dự án ở key dự án đó, không ở key harness) |
