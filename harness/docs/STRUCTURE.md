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
    └── templates/ ······· scaffold: stack (Mode A) + steady-state (Mode B) + doc-stubs (gồm lessons-log)
```

> **Ranh giới cứng (chuẩn dài hạn):** `harness/` là SẢN PHẨM, **tự-đủ tuyệt đối** — docs trong đó KHÔNG `../../` ra ngoài cây; khi cài đi đâu cũng chạy. Mọi thứ ở root là XƯỞNG (làm ra harness): `plans/` chứa lessons-log + team-playbook + reports CỦA harness; `.claude/` là config phiên dev (gitignore phần cá nhân). Tri thức "cho dự án" (VD lessons-log của dự án) là 1 **template** trong `harness/docs/templates/`, không phải lessons-log dev của harness.

## `harness/docs/` — tri thức (3 lớp)

**① Xương sống (đọc theo thứ tự này):**
| File | Vai trò |
|---|---|
| `UNDERSTANDING-loop-harness.md` | Narrative onboarding + scorecard thành thật (PROVEN/PATCHED/ASPIRATIONAL). **Đọc đầu.** |
| `KEYWORD-MAP.md` | Từ điển điều hướng mọi keyword → file owner. |
| `OPERATING-MODES.md` | Đặc tả chính xác **2-mode** (xương sống) + Loop-Engineering lens. |
| `WORKFLOW.md` | Bảng bước 1.x/2.x/3.x (bên trong 2 mode) + gate + lane. **Load-bearing.** |
| `HARNESS.md` | Operating model + Independence Principle + quyết định đã khoá. |
| `STRUCTURE.md` | (file này) bản đồ cấu trúc. |

**② Chi tiết bước (load-bearing — máy móc harness đọc):**
| File | Vai trò |
|---|---|
| `STAGE_GOALS.md` | Text mục tiêu chạy được của từng bước (dùng bởi `/stage-next`). |
| `CONTEXT_RULES.md` | Context-engineering: đọc gì / bỏ gì mỗi bước ở token thấp nhất (pair với hook `context-monitor`). |
| `TRACE_SPEC.md` | Grammar token chain `GAP→REQ-ID→SC→TC` + luật RTM. |
| `ROLE_MAP.md` | Vai trò SDLC theo bước (được ~6 file máy móc tham chiếu). |
| `TEST_MATRIX.md` | Register test/verify (đọc ở mỗi 2.x close; ~8 file tham chiếu). |

**③ Thư viện (thư mục):**
| Thư mục | Số | Vai trò |
|---|---|---|
| `playbooks/` | 35 | công thức TÁI DÙNG (1 bước macro / 1 domain); index `playbooks/README.md` |
| `gates/` | 10 | định nghĩa gate (PB-G, DoR, DoD, phase-acceptance, visual-fidelity…) |
| `templates/` | 28 | mẫu file dự án (build-manifest, srs-lite, bao-gia, STAGE.md…); index `templates/README.md` |
| `design-system/` | 3 | quy tắc UI 3-tier (floorplan/action/modal) |

## `harness/.claude/` — tự động hoá
- `commands/`: **`/stage-next`** (chạy bước kế), **`/build-phase`** (vòng code phase), **`/gate-check`**.
- `agents/stage-runner.md`: subagent chạy 1 bước trong context riêng (isolated).
- `hooks/`: `stage-deliver`, `qa-deliver`, `context-monitor` (cảnh báo 40/60/80/95% token), `notify`.
- `settings.json` + `scripts/notifier-send.sh`.

## `harness/scripts/` + `.githooks/` — gate + cài đặt
- `install-harness.sh`: bê toàn bộ `harness/` vào dự án mới + init git + bật verify-gate.
- `harness-verify-gate.sh` + `pre-commit`/`pre-push`: **gate fail-closed không bypass** (chặn commit lỗi lint/typecheck/register).

## `harness/templates/` — 2 scaffold
- `stack-pnpm-nest-next/`: khung app **Mode A** (walking skeleton — NestJS+Prisma+Postgres+Next.js+CI+e2e+docker). Dùng ở bước 2.4.
- `steady-state/`: kit **Mode B** — `issue-state.mjs`, `qc-checklist.mjs`, `push-retry.sh` (Recover R2), `ship-and-verify.sh` (Recover R3), `bug-report.md`, `regression-checklist.md`. Copy vào dự án khi go-live.

## 4 kho tri thức (ai lưu gì ở đâu)
| Kho | Ở đâu | Chứa |
|---|---|---|
| **playbook** | `harness/docs/playbooks/` | cách làm chung, tái dùng mọi dự án |
| **runbook** | `docs/runbook/` của TỪNG dự án (VD elearning) | vận hành riêng dự án (deploy/config/cicd/seed) |
| **lessons-log** | mỗi dự án: `docs/lessons-log.md` (template ở `harness/docs/templates/`). Của chính harness: `plans/lessons-log.md` | sai lầm → luật |
| **memory** | `~/.claude/projects/<key>/memory/` | fact bền qua phiên; **fact riêng dự án ở key dự án đó, không ở key harness** |
