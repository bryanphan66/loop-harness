# Gate Registry — mechanical gates + enforcement tier (Macro-2)

> Nguồn sự thật DUY NHẤT cho các gate CƠ HỌC (script) + gate quá-trình + tier thực thi.
> `gates/README.md` liệt process-gate (PB-G*/DoR/DoD); file này liệt **script-gate** +
> map bước + **tier thực thi** (quan trọng: nhiều gate chỉ chạy LOCAL, gh-merge bypass).
> Bổ sung sau run thật Phase-2 (2026-08-31).

## Tier thực thi — đọc trước
| Tier | Nghĩa | Bypass được không |
|---|---|---|
| **CI (server-side)** | Chạy trên GitHub Action | Không (nếu required-check) |
| **local-hook** | pre-commit/pre-push (`harness-verify-gate.sh` → `validate` → `lint:gates`) | CÓ — `--no-verify`, **gh-merge**, web-edit |
| **orchestrator** | ctl/verifier-subagent chạy | CÓ (nếu orchestrator bỏ qua) |
| **prose** | verifier-agent phán theo văn bản | CÓ (phụ thuộc diligence) |

⚠️ **G2 (lỗ to nhất, chưa đóng):** MỌI `lint:gates` + verify-gate chỉ **local-hook**. `ci.yml` cố ý KHÔNG chạy `pull_request` → CI post-merge, không gate merge. `gh pr merge` bypass hết. Đóng = branch-protection dev+main + required-check chạy `validate` on pull_request (repo-config, cần admin). Tự-ghi ở `phase-acceptance.md`.

## Script-gate cơ học (`lint:gates`, local-hook)
| Gate script | Bước guard | Bắt gì |
|---|---|---|
| `check-manifest-coverage.mjs` | 2.3 DoR | REQ-ID ⟷ phase (không drop/dup, có P0) |
| `check-ac-coverage.mjs` 🆕 | 2.6 accept (Leg 1) | mỗi AC/REQ-ID có ≥1 test map (coverage-floor heuristic, KHÔNG phải RTM đủ) |
| `check-prototype-fidelity.mjs` | 2.6 (Leg 2) | grid=DataGrid, requiredComponents import-shared+dùng, no raw-table, forbidPatterns; route-scoped |
| `check-hardcoded-ui-strings.mjs` 🆕 | 2.6 | chặn hardcode chuỗi Việt (chép mock prototype); scope changed-files |
| `check-universal-fidelity-imports.mjs` | 2.6 (Leg 5) | fidelity spec import universal fixture |
| `check-new-screen-fidelity-required.mjs` | 2.6 (Leg 5) | mỗi màn admin có fidelity spec |
| `check-prisma-fk-indexes.mjs` | 2.6 (Leg 7) | mọi FK có index |
| `check-admin-screen-width-caps.mjs` | 2.6 | full-width (no hard content-width cap) |
| `check-ui-typography.mjs` | 2.6 (Leg 14) | no AI-typography/emoji trong locale bundle |
| `check-no-hardcoded-hex.mjs` | 2.6 | no màu hex cứng |
| `check-shared-dialog.mjs` | 2.6 | modal qua shared Dialog (no hand-roll) |
| `check-authz-test-present.mjs` | 2.6 (Leg 16) | controller id-addressed có negative-authz spec |
| `check-money-concurrency-test-present.mjs` | 2.6 (Leg 20) | money model có concurrency spec |

## Gate quá-trình / orchestrator
| Gate | Bước | Tier |
|---|---|---|
| freeze PB-G2/G3 (ERD/prototype) | 2.1/pre-build | orchestrator |
| phase-acceptance 27-leg | sau mỗi 2.6 phase | 4 [AUTO] + [AUTO](coverage-floor) Leg1 + còn lại prose/verifier |
| **agent-QC (verifier subagent)** | 2.6 accept + 2.10 DoD QA | orchestrator — vs running app (đã có, KHÔNG phải bolt-on) |
| **merge-verify** 🆕 | trước `gh pr merge` | orchestrator — chạy fidelity + i18n + no-revert trên branch TRƯỚC merge (vì gh-merge bypass hook local; đây là bù-đắp G2 ở tầng ctl tới khi có server-side) |
| go-live verify-at-source | 2.13 | orchestrator/mechanical — health .status==ok + content-marker + SHA==commit |
| UAT sign-off | 2.12 | human (client gate) |

## Mode-B (steady-state) — KHÔNG phải Macro-2
- QC trên staging = **human** (cố ý, `steady-state-issue-pipeline.md`). Auto-QC-thay-human = **Frontier-2 aspiration** (`OPERATING-MODES.md:66-70`): `qc-checklist.mjs` + auto-run e2e ở `Ready for Test → QC Testing`, để dành human cho hành vi mới/visual/business. Lần dogfood 2026-08-31 chạy auto-QC 17 issue = bản thử của frontier này, chưa formalize thành state-transition.

## Observability + completeness (RTM)
| Gate script | Bước guard | Bắt gì |
|---|---|---|
| `rtm-status.mjs` 🆕 | 2.3 + xuyên suốt | bảng REQ-ID × [register, issue, test, prototype-freeze]; `--gate` fail nếu REQ-ID in-scope thiếu cột bắt buộc; `--json` cho dashboard. Neo = REQ-ID (SRS là universe). Đây là câu trả lời cơ học cho "module đủ chưa" + "đang ở đâu". |

## Bổ sung sau Phase-2 run (changelog)
- 🆕 `check-ac-coverage.mjs`, `check-hardcoded-ui-strings.mjs` (2026-08-31).
- fidelity-gate: route-scope `collectScreenTsx` + JSX generic matcher + forbidPatterns (giữ; chỉ gỡ seed `tbl` khỏi map-data vì `tbl` là class adopted dùng chung).
- merge-verify: named ở đây; ctl chạy trước gh-merge.
- Đang chờ: G2 server-side (repo-config), Mode-B auto-QC formalize.
