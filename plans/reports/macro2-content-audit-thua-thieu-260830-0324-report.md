# Macro-2 content audit — THỪA / THIẾU (chạy thật Phase-2 dogfood)

> Ngày 2026-08-30. Nguồn: audit cấu trúc harness `harness/` (WORKFLOW.md, STAGE_GOALS.md, gates/*, commands, playbooks, lessons-log) + run thực nghiệm 2 feature Phase-2 (F-11 Form Builder, F-06 SePay reconcile) qua gate 27-chốt (đang chạy, bổ sung friction sau).

## Kết luận
Macro-2 vấn đề chính = **THỪA (trùng lặp) khủng khiếp**, không phải thiếu. 1 luật bị chép 5-8 lần khắp các file → đó là máy-đẻ-drift (lỗ G1). Thiếu = đúng 3 cái răng thật ở khâu release (2.13) + 1 sự-thật-gate (27 chốt phần lớn là prose không script).

Sự thật nền: bề mặt enforcement thật = **3 script** (`check-universal-fidelity-imports/check-prisma-fk-indexes/check-admin-screen-width-caps.mjs` qua `lint:gates`) + `harness-verify-gate.sh` (grep register). Mọi thứ khác trong gate 27-chốt là hợp đồng prose do verifier-agent thực thi, KHÔNG auto-lint. `visual-fidelity.md:3-15` thừa nhận; các file khác thì không (bẫy L14/L16).

## THỪA — XÓA/GỘP (thay bản chép bằng pointer tới 1 source-of-truth)
| # | Luật bị chép | Chép ở | SoT giữ lại | Rủi ro |
|---|---|---|---|---|
| 1 | "mỗi REQ-ID vào đúng 1 phase, P0 defined" | 8 file (WORKFLOW.md:171/285/363, dor-build.md:21, gate-check.md:57, build-manifest-compilation.md:94, build-manifest.md:150, STAGE_GOALS.md:461) | `dor-build.md:21` | AN TOÀN (giữ luật, bỏ bản chép) |
| 2 | "adopt export as code" (fidelity) | 7 file (WORKFLOW.md:174/250, STAGE_GOALS.md:541, build-phase.md:78, visual-fidelity.md:19, build-manifest-compilation.md:69, build-manifest.md:72) | `visual-fidelity.md` + `build-execution.md` | AN TOÀN |
| 3 | rationale phase-gate (token-curve) | 3 file (WORKFLOW.md:194-211, phase-acceptance.md:16-27, dod-build.md:8-15) | `phase-acceptance.md:16-27` | AN TOÀN |
| 4 | conditional enterprise gates / N-A-by-decision | 7 file | `dod-build.md:38-53` (bảng) | AN TOÀN (D2 load-bearing — giữ 1 bảng, pointer) |
| 5 | "Offline caveat" (2.4 ≈ 2.11) | STAGE_GOALS.md:496-500 ≈ 672-677 | 1 note chung | AN TOÀN |
| 6 | ERD-FROZEN (6×), WALKING-SKELETON (5×), tier-2-primitives (5×), ACCEPTANCE/RTM (4×) | nhiều | bảng gate-check + pointer | AN TOÀN |
| 7 | floor-rule 2.7 chép lại (đã auto-block ở 2.6) | WORKFLOW.md:238-256, STAGE_GOALS.md:582-591 | reframe 2.7 = "sweep hệ thống + điểm tổng" | JUDGMENT (đừng gỡ RĂNG ở 2.6, chỉ bỏ chép ở 2.7) |

**KHÔNG xóa (bí mật load-bearing):** 2.1b + mọi conditional gate (D2); `dod-build.md:27-28` (config-driven-identity + go-live-deploy-verify — chỉ chỗ này gate); mọi mechanic floor-rule thật. 3-macro framing = RELABEL không xóa (tooling parse step-id).

## THIẾU — BỔ SUNG (net-new, không rủi ro xóa)
| # | Thiếu | Thêm vào | Đóng lỗ |
|---|---|---|---|
| 1 HIGH | verify-at-source CHƯA gắn vào 2.13 (release) — deploy prod thật chỉ "smoke health 200" | STAGE_GOALS.md:700-712 + WORKFLOW.md:181: dẫn 5 luật `go-live-deploy-verify.md` (health .status==ok + content-marker, build-ARG rebuilt, reject placeholder-secret, named-endpoint) + Post-Deploy Checklist | L1, FC6 (lessons-log.md:109, HARNESS.md:250) |
| 2 HIGH | không có bước "lật Mode A → Mode B" khi go-live | 2.13/2.13b action: flip STAGE.md → Steady-state, drop current-step, ghi board link (OPERATING-MODES.md:50-56) | handoff không artifact — "mùi graduated nhưng chưa lật mode" |
| 3 HIGH | 27 chốt phần lớn prose không script, doc nói như tự-chặn | banner ENFORCEMENT-STATUS trên phase-acceptance.md (giống visual-fidelity.md:3-15): chốt nào auto-script (3) vs người-kiểm (còn lại) | L14/L16 "hứa răng không có răng" |
| 4 MED | 2.13 Manual?=no mâu thuẫn deploy-standard (prod = named-endpoint human) | WORKFLOW.md:181 → MANUAL_CHECKPOINT | Rule 5 go-live-deploy-verify.md:94 |
| 5 MED | không có migration-plan template + không có `migration` phase-type | `docs/templates/migration-plan.md` + thêm `migration` vào build-manifest.md:120 | handoff 2.1→2.1b→2.6 |
| 6 MED | DoR coverage kiểm tay (mechanical được) | `check-manifest-coverage.mjs` (feature-register REQ-ID ⟷ manifest) vào lint:gates | G3/G4 |
| 7-8 LOW | Lite QA-video waiver ẩn; threat-ID ⟷ 2.9-disposition không trace | surface ở WORKFLOW 2.10; artifact trace 2.2→2.9 | — |

## Quyết định cần chủ dự án
- Q1: sản phẩm live (Mode B) có bao giờ chạy 2.1b (migration lớn)? Nếu không → hạ 2.1b thành phụ lục (giải phóng 1 row).
- Q2: 27 chốt prose → (a) script hoá dần / (b) hạ thành "checklist người kiểm" + banner trung thực. (a=code, b=doc).
- Q3 (tự quyết): SoT conditional-gate = `dod-build.md`.

## Thực thi
- Batch AN TOÀN (THỪA #1-6 + THIẾU #1-4): 1 pass sửa harness gốc → PR → re-propagate xuống elearning.
- Batch JUDGMENT (THỪA #7, THIẾU #5-6, Q1/Q2): chờ chủ dự án chốt.
