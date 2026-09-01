# Harness BS6 — Per-Phase Acceptance-Verification Gate (v4)

**Date:** 2026-07-08 · **Scope:** `harness/` only (project-agnostic, Independence Principle intact) · **Trigger:** auto-script Macro-2 token-waste lesson — verify dồn cuối (2.7/2.8/2.9/2.10/2.12) → sai lệch tích lũy → UAT-fix rounds đắt.

## Design (chốt)

**Nguyên tắc:** phase KHÔNG done khi commit xong — done khi Acceptance Criteria được verify trên APP ĐANG CHẠY, trước khi phase kế được phép start.

**Choreography (giữ nguyên atomic stage-boundary commit, thêm verify SAU commit / TRƯỚC phase kế):**

```
/build-phase P<N>:
  1. precondition: phase trước phải có Accepted cell đầy đủ (agent-pass + human-ok nếu Verify-by=both)
  2. stage-runner implement → validate:quick → smoke → self-checks → stage-boundary commit (như cũ; để preview chạy)
  3. ACCEPTANCE VERIFICATION (gate mới docs/gates/phase-acceptance.md):
     a. AGENT VERIFIER — LUÔN chạy, mọi phase, không waive được. Subagent ĐỘC LẬP
        (fresh context, không phải implementer), input = phase block + preview URL +
        screen-inventory rows + export paths + gate file. Verify trên app chạy thật:
        functional AC + visual-fidelity từng screen (side-by-side vs export) +
        negative-path (real cause surfaces). Trả verdict block PASS/FAIL + evidence.
     b. FAIL → fix TRONG CÙNG PHASE (fix leg với Reasons của verifier) → re-verify.
        Cap 3 vòng → BLOCKED, page human. Không bao giờ start phase kế trên FAIL.
     c. PASS → ghi Accepted cell (agent-pass <date>) + TC-NNN row trong TEST_MATRIX,
        1 commit nhỏ test(<scope>) cite TC token (event verify tách khỏi commit implement
        → không vi phạm atomicity rule).
     d. HUMAN CHECKPOINT khi Verify-by=both: emit MANUAL_CHECKPOINT (internal — page
        OPERATOR, không page client) kèm preview URL; phase kế chờ human-ok <date>.
```

**Cadence knob (header build-manifest, set ở 2.3, operator đổi được bất kỳ lúc nào):**

| Cadence | Human checkpoint fires | Dùng khi |
|---|---|---|
| `per-phase` | mọi phase | high-stakes |
| `per-ui-phase` **(default)** | phase có màn UI + phase đóng module/milestone | build thường — phase vặt không page |
| `per-milestone` | chỉ phase đánh dấu Milestone | manifest dài |
| `end-only` | không page trong 2.6 | operator tự chịu — revert về pre-gate |

**Verify-by per phase:** enum `agent | both`, COMPILE từ cadence ở 2.3 (không diễn giải runtime). Không có giá trị human-only — spec gốc ghi `agent|human|both` nhưng mâu thuẫn với "AGENT VERIFIER luôn chạy"; resolve theo invariant mạnh hơn: agent là floor, `both` = agent + human.

**Incremental preview:** compose/dev stack từ P0 phải bootable ở MỌI phase close (manifest header ghi Preview command 1 dòng); staging deploy optional. App un-bootable ở phase boundary = FAIL acceptance bất kể diff. → verifier + operator soi từng module trên app thật, không đợi UAT.

**Hệ quả cho gate cuối:** 2.7/2.8/2.10 vẫn chạy 1 lần khi manifest xong nhưng re-framed = AGGREGATION + cross-phase confirmation, không còn là nơi đầu tiên bắt lỗi phase. DoD block nếu thiếu acceptance record của bất kỳ phase nào (không fill hồi tố).

**Token rationale (ghi trong changelog + gate):** bắt lỗi ở phase N = 1 fix cycle trong context đang loaded; bắt ở cuối = re-discovery + rework xuyên phase + re-verify mọi thứ build đè lên — đắt hơn cỡ bậc. Evidence: auto-script Macro-2 (UI-port, error-swallow, sibling call-sites — mỗi loại 1 UAT-fix round).

## Files changed (tất cả trong harness/)

| File | Đổi gì |
|---|---|
| `docs/gates/phase-acceptance.md` | **MỚI** — gate định nghĩa 2 leg, verdict block, cadence table, auto-block rule, incremental preview |
| `docs/templates/build-manifest.md` | header: cadence knob + Preview command; Progress table: cột Verify-by + Accepted; AC nâng thành 3 hạng mục BẮT BUỘC (functional + negative-path + visual-fidelity / `n/a — no screens`); phase block field Verify-by; coverage checklist 2 dòng mới |
| `.claude/commands/build-phase.md` | step 2 precondition (refuse khi phase trước chưa accepted); step 5 mới ACCEPTANCE VERIFICATION (a-d); step 6 report; Rules thêm "verifier ≠ implementer"; packet nhắc preview |
| `.claude/agents/stage-runner.md` | 2.6: không tự certify acceptance / không tự fill Accepted cell; để preview bootable; nếu được invoke LÀM verifier thì theo verdict block, không đụng code |
| `docs/process/STAGE_GOALS.md` § 2.6 | Gate line + goal text: acceptance verification sau commit; Manual? = cadence-driven (page operator) |
| `docs/process/WORKFLOW.md` | TL;DR; hàng 2.6 (engine + gate + manual cell); Gate rebalance note rewrite (per-phase acceptance + 2.7/2.8/2.10 = aggregation); Canonical Gate List thêm **Phase Acceptance** |
| `docs/playbooks/build-execution.md` | § Incremental Preview (mới) + § Per-Phase Acceptance Verification (mới) + Related link |
| `docs/playbooks/build-manifest-compilation.md` | step 5 AC 3 hạng mục + Verify-by; step 6 mới (set knobs, derive Verify-by, re-derive khi operator retune); gate step; Related |
| `docs/gates/dor-build.md` | dòng mới: mọi phase có AC 3 hạng mục + Verify-by; header khai cadence + preview — DoR yêu cầu trước khi build start |
| `docs/gates/dod-build.md` | dòng mới: acceptance record đầy đủ mọi phase (không hồi tố); rebalance note update |
| `docs/gates/README.md` | index row + đoạn mô tả (walked by `/build-phase`, không phải `/gate-check`) |
| `docs/templates/STAGE.md` | cell gate 2.6 |
| `AGENTS.md` | bullet 2.6 invoke |
| `docs/about/HARNESS_CHANGELOG.md` | **v4** entry — thiết kế + trade-off + token rationale + cite auto-script |

## Cách operator chỉnh nhịp human checkpoint

1. Mở `docs/build-manifest.md` của dự án → header `Human checkpoint cadence:` → đổi giá trị (`per-phase` / `per-ui-phase` / `per-milestone` / `end-only`).
2. Re-derive cột `Verify-by` cho các phase CHƯA chạy theo cadence mới (phase đã accepted giữ nguyên record).
3. Agent verifier không tắt được bằng knob — chỉ nhịp human đổi. `end-only` = không page trong 2.6 (2.10/2.12 vẫn còn) — dùng khi operator chấp nhận rủi ro kiểu cũ.
4. Khi bị page: mở preview URL trong MANUAL_CHECKPOINT → soi module theo AC của phase → trả "OK" (ghi `human-ok <date>` vào Accepted cell) hoặc liệt kê defect → fix trong cùng phase → re-verify.

## Verification

- grep pass: mọi ref `phase-acceptance.md` resolve (14 files); không script nào parse bảng Progress (verify-gate/hooks không đụng manifest) → đổi cột an toàn; `AGENTS.md § Manual Checkpoint Signaling` tồn tại.
- Không đụng app/auto-script/stack-template; template stack không đổi.

## Unresolved questions

1. Spec gốc yêu cầu ghi preview mechanism vào "prod-readiness playbook" — file này KHÔNG tồn tại trong harness (2.11 dùng skill `ck-prod-readiness`, không có playbook nội bộ). Đã ghi vào `build-execution.md` § Incremental Preview + gate + STAGE_GOALS; nếu muốn playbook prod-readiness riêng thì là leg khác.
2. Enum Verify-by collapse `agent|human|both` → `agent|both` (human-only mâu thuẫn "agent verifier luôn chạy") — confirm nếu operator muốn giữ nguyên chữ.
3. `/gate-check` chưa có `--gate PHASE-ACCEPTANCE` (gate này walked by `/build-phase` giữa các phase, per-phase chứ không per-step) — có thể thêm sau nếu cần assert hồi tố.
