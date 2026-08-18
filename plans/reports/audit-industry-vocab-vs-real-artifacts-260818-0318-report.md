# Audit: từ khoá ngành (industry keyword) đã có artifact THẬT trong repo chưa?

**Ngày:** 2026-08-18 · **Phạm vi:** verify từng dòng `harness/docs/KEYWORD-MAP.md § H` (bảng "tên nhà <-> tên ngành") xem có artifact thật cưỡng chế khái niệm hay chỉ là chữ trong doc · **Cách:** quét read-only harness/ (docs, scripts, templates, .claude/commands, hooks).

## Kết luận 1 dòng
Phần lớn (9/12) **CÓ THẬT = có code cưỡng chế**, không mơ hồ. Mơ hồ thật chỉ 2 chỗ (evals/observability, build-side vs product-side) + 1 nửa vời (hill-climbing loop). 5 thứ repo TỰ NHẬN chưa có -> trung thực, không giấu.

> **✅ CẬP NHẬT 2026-08-18 — đã HẠ NHÃN cả 3 chỗ mơ-hồ trong `KEYWORD-MAP §H`** (khớp audit này):
> - `run-log` #10: `evals` -> **`tiền-evals (logger)`** (commit `bfff054`).
> - hill-climbing #5: -> **`hướng tới hill-climbing (chưa tự-động)`** (commit `3151a0b`).
> - build/product-side #12: ghi rõ **mới là GHI CHÚ, chưa có gate cưỡng chế** (commit `3151a0b`).
> Đã push cả `origin` (bryanphan66) + mirror `reno` (RenoAI-Labs). Đọc bảng §H giờ không còn tưởng harness có thứ chưa có.

## Bảng phán (keyword ngành <- artifact repo khai)

| # | keyword ngành | verdict | bằng chứng |
|---|---|---|---|
| 1 | Spec-Driven Development (Mode A: spec->REQ-ID->manifest->phase) | CÓ THẬT | REQ-ID grammar `MODULE.AREA.NN` (`docs/TRACE_SPEC.md:16,21`), khoá bởi D3; compile manifest (`playbooks/build-manifest-compilation.md`, sizing <=10 file/phase); command `stage-next.md` + `build-phase.md` |
| 2 | event-driven loop / steady-state (Mode B) | CÓ THẬT | `playbooks/steady-state-issue-pipeline.md` + `new-issue.mjs` (DoD 13-mục hằng trong code + `--check` fail-closed) + `issue-state.mjs`; trigger = 1 issue |
| 3 | agent loop (`/build-phase`) | CÓ THẬT | `.claude/commands/build-phase.md`: 1 invocation = 1 phase, spawn stage-runner, verifier độc lập vòng 2, cap 3 vòng fix |
| 4 | verification loop (verify-gate + verify-at-source + QC-vs-AC) | CÓ THẬT | `scripts/harness-verify-gate.sh` (git-hook không bypass, self-check FAIL CLOSED; Gate 2 chặn row fail/never-run/register rỗng); verify-at-source ở DoD item 11 + `ship-and-verify.sh` |
| 5 | hill-climbing loop (Growth Rule + run-log) | CÓ THẬT (chỉ nhạc-cụ đo) | `scripts/run-log.mjs` thật (start/end/report, đọc version động, cảnh báo <5 run). NHƯNG vòng Growth Rule chưa tự-động-hoá; `UNDERSTANDING:102` tự khai "chưa có dữ liệu thật". Cân có, chưa cân gì. |
| 6 | supervisor pattern (CONTROL->N bg) | CÓ THẬT (cơ chế Mode A; quy-ước Mode B) | dispatch `OPERATING-MODES.md:36` + `Task()` trong 2 command + `wait-workers.sh` + run-log kẹp. N-song-song không có script riêng; isolation = `bypassPermissions` (lỗ hổng tự khai) |
| 7 | constitution (Locked Decisions D1-D6) | CÓ THẬT | `docs/HARNESS.md:190-202` liệt kê D1-D6 có version, cited xuyên docs; D3/D6 có code backing. Cưỡng chế = doc + gate, chưa full máy |
| 8 | harness template (stack + steady-state kit) | CÓ THẬT | `templates/stack-pnpm-nest-next/` (monorepo thật + 3 check-*.mjs) + `templates/steady-state/scripts/*` + `templates/ops-board/` |
| 9 | context engineering (CONTEXT_RULES + context-monitor) | CÓ THẬT | `docs/CONTEXT_RULES.md` + `.claude/hooks/context-monitor.sh` WIRED (UserPromptSubmit hook: tính %, band 40/60/80/95, ghi PENDING_NEXT_SESSION.md) |
| 10 | evals / observability / tracing (run-log) | **MƠ HỒ** | `run-log.mjs` chỉ logger/aggregator, code tự khai "day la buoc 1" — KHÔNG scoring vs expected (không phải evals), KHÔNG trace/run (`OPERATING-MODES.md:121` "no continuous trace per run") |
| 11 | state machine / graph engineering (issue-state.mjs) | CÓ THẬT | `issue-state.mjs`: bảng TRANSITIONS 10-state + guard `isLegal` fail-closed + `--self-test` + `--force` chỉ cho người. Ép thật, chặn Backlog->Done. Graph layer rộng = cố ý không có (đã "priced") |
| 12 | build-side vs product-side agent | **MƠ HỒ** | Chỉ nêu `KEYWORD-MAP.md:119` + note changelog "cần giữ tách". KHÔNG dùng làm ranh giới vận hành/gate ở đâu. Mention thuần |

## Nhóm repo TỰ NHẬN "CHƯA có" (§H cuối) — xác nhận đúng

| mục | verdict | ghi chú |
|---|---|---|
| evals (đầy đủ) | CHƯA (đúng) | run-log = bước 1 logger, không scoring |
| observability / tracing | CHƯA (đúng) | không trace/run; tự khai `OPERATING-MODES.md:121` |
| least-privilege / permissions | CHƯA (đúng) | dispatch chạy `bypassPermissions` = "largest open hole" (`OPERATING-MODES.md:106`). (`permissions.md` trong SRS là RBAC product-side, khác) |
| durable execution | CHƯA (đúng) | không artifact. `claude daemon` = session-persist, không phải durable-execution engine |
| memory engineering | CHƯA (đúng) | `memory/` = thư mục ngoài git (quy-ước), không có engineering artifact |

Không có manh mối ẩn mâu thuẫn self-report -> repo trung thực ở phần "chưa có".

## Đánh giá thẳng

- **Vững nhất (code cưỡng chế khái niệm, không phải chữ):** #11 `issue-state.mjs` (guard fail-closed + self-test), #4 `harness-verify-gate.sh`, #9 `context-monitor.sh` (hook wired thật).
- **Rủi ro tự-lừa cao nhất:** #10 — §H đặt dấu bằng `run-log.mjs = evals · observability/tracing`, nhưng comment trong chính script thừa nhận mới "bước 1", chưa scoring/trace. Dễ tưởng "mình có evals rồi" nhất. **Nên hạ nhãn trong §H:** run-log = "tiền-evals (logger), CHƯA evals".
- **Mềm thứ nhì:** #5 cân có nhưng chưa cân gì (0 dữ liệu tự-động); #12 distinction thuần-doc.
- Điểm hệ thống: tầng Mode A + gate = code cưỡng chế (mạnh); tầng supervisor/loop (Mode B autonomy + isolation) vẫn là quy-ước + lỗ `bypassPermissions` — repo tự khai đúng, không giấu.

## Câu chưa giải quyết
- ✅ ĐÃ XỬ: hạ nhãn #10 (evals), #5 (hill-climbing), #12 (build/product-side) trong KEYWORD-MAP §H — user duyệt 2026-08-18, commit `bfff054` + `3151a0b`, push origin + reno.
- Còn mở (không gấp): 5 thứ backlog (evals đầy đủ · tracing · least-privilege thay `bypassPermissions` · durable execution · memory engineering) vẫn CHƯA có artifact — khi nào ưu tiên là quyết định của user, không tự khởi.
