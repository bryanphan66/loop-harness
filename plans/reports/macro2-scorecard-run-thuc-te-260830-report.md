# Macro-2 SCORECARD — chạy thật Phase-2 dogfood (2026-08-30)

> Ghép 2 nguồn: (1) audit cấu trúc thừa/thiếu (`macro2-content-audit-thua-thieu-260830-0324-report.md`), (2) run thực nghiệm 2 feature (F-11 Form Builder #1003, F-06 SePay reconcile #1004) build slice thật qua gate 27-chốt + nhật ký instrument.

## Điểm: ~6 → ~8 (sau vá đợt này). Lên 9 cần P2+P3.

## Bằng chứng thực nghiệm (2 run độc lập TRÙNG kết luận)
- **Gate 2.6 "bite" thật ~30% bằng máy** = `lint:gates` (7 script: universal-fidelity-imports, prisma-fk-indexes, admin-width-caps, ui-typography, huong-dan-shots, no-hex, shared-dialog) + typecheck + test + `next build`. Phần này **có răng thật, message lỗi cụ thể, cải thiện được design của slice**.
- **~70% còn lại (≈6-19/27 leg) chỉ là hợp đồng prose** mà chỉ verifier-agent chạy trên running-app mới kiểm được (L1/L2/L5/L6/L12/L16/L17/L20/L27). Ở tầng worker chúng **tụt xuống tự-khai**. Nguyên văn: "gate bites IFF the orchestrator actually runs Leg-1 against a live preview — the file alone does not compel it". → xác nhận đúng THIẾU #3 (banner trung thực).
- **G6 gate-flakiness: KHÔNG flaky** trong 2 run (~3 vòng sửa nhỏ per-package, full validate xanh vòng 1). Nhẹ hơn lo ngại.

## 2 lỗ MỚI thực nghiệm phát hiện (audit chưa chỉ ra)
1. **Screen mới KHÔNG bị ép phải có fidelity spec** (L2/L5): `check-universal-fidelity-imports.mjs` chỉ kiểm file `*-fidelity.spec.ts` ĐÃ tồn tại phải import fixture — KHÔNG ép screen mới PHẢI có spec. → 1 màn mới build thiếu fidelity/universal-floor mà `validate` VẪN XANH. Lỗ gate rõ ràng. **Fix: thêm script ép mỗi route admin mới có 1 fidelity spec (backlog P2).**
2. **Scope-discovery không có driver → rủi ro build trùng** (sepay): không manifest/driver nào báo feature đã build một phần; worker phải tự grep `sepay` + diff SRS để tìm đúng 1 gap thật (BR.CO.04). "Biggest friction + biggest risk of a dumb duplicate." → xác nhận G3 (không driver) + G4 (manifest-coverage không cơ học).

## Đã VÁ đợt này (merged main 9ba9da0)
- **THỪA:** gộp 6 nhóm trùng lặp (REQ-ID/fidelity/rationale/conditional-gates/offline-caveat/ERD-skeleton) về source-of-truth + pointer → **giết máy-đẻ-drift (G1)**.
- **THIẾU:** verify-at-source vào 2.13 (L1/FC6), bước lật Mode A→B, banner ENFORCEMENT-STATUS trung thực trên 27 chốt (L14/L16), 2.13 → MANUAL_CHECKPOINT, note 2.1b N/A-greenfield.
- Trước đó: P1 re-propagate gate 27-chốt mạnh xuống elearning (#983).

## Còn lại để lên 9 (P2/P3)
- **P2 (script hoá răng):** ép fidelity-spec cho screen mới (lỗ #1), script Leg-16 IDOR + Leg-20 concurrency + manifest-coverage (feature-register REQ-ID ⟷ manifest), gate server-side (branch protection) đóng lỗ "1 cửa".
- **P3 (driver tự chạy):** `/build-macro2` loop (build→verify→advance/fix/BLOCKED) + run-log mỗi phase. Đêm qua stall + friction scope-discovery của sepay = 2 bằng chứng thực tế G3 tốn tiền.

## 2 slice code thực nghiệm (thật, gate xanh) — quyết định
- #1003 form-builder-core (forms module + public submit + throttle + 11 test), #1004 sepay hold-partial-credits (BR.CO.04). Đều real + validate xanh. Có thể merge vào Phase-2 hoặc giữ như artifact chấm điểm — chờ chủ dự án.
