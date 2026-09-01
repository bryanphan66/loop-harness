# Kế hoạch refactor XOÁ-TRƯỚC — harness (trọng tâm Macro-2 + luồng tạo issue)

> **TRẠNG THÁI 2026-09-01: ĐÃ THỰC THI (branch `refactor/harness-macro2-delete-first`, 7 commit).**
> - N0 `macro-2.pipeline.yaml` (spec máy-đọc) ✅
> - Dọn dối: register-SOT/sync-script/F-NNN, reset gate pb-g2, changelog, README, STRUCTURE ✅
> - N2 `rtm-status.mjs` (observability + gate "đủ", chạy thật elearning 816 REQ-ID) ✅
> - Doc-merge: STAGE_GOALS + WORKFLOW trỏ pipeline.yaml, tag 3 bước gộp ✅
> - N1 `req-issue-scaffold.mjs` (neo REQ-ID, chống bịa, thay sync chết) ✅
> - Canonical propagate: elearning 15 gate -> template + fail-soft ✅
> - N5: routing Bug/UAT/CR (3 thứ Nghĩa cần) ✅
> - X1/X2: xoá 2 script chết ở elearning (PR #1084 merged) ✅
> **Còn (polish, không chặn):** gộp 3 gate fidelity thành 1 CLI (G1, tối ưu); wire `rtm --gate` vào lint:gates khi register phase-2 đủ; propagate fail-soft 2 gate về elearning.

> 2026-09-01. Gom từ 3 audit song song (scripts / docs / Macro-2). Mọi mục có file:line làm chứng. Nguyên tắc: XOÁ + GỘP trước, không chắp vá. Không đụng tay tới khi Trung duyệt từng nhóm.

## 0. Phát hiện cốt lõi (đọc trước)

**Tin tốt: xương sống harness ĐÚNG và nhất quán.** `WORKFLOW.md`, `TRACE_SPEC.md`, `HARNESS.md §Source Hierarchy`, `STAGE_GOALS.md` đều đặt **SRS + REQ-ID (docs/requirements) là hợp đồng yêu cầu ở TRÊN**, **feature-register là view DẪN XUẤT** (đóng băng scope tại PB-G2). Khớp thực tế đã verify (SRS sống 23 commit/phase-2, register chỉ là ảnh chụp scope). Nên nỗi lo "register là SOT" - xương sống vốn KHÔNG nói vậy.

**Chỗ thối khu trú ở 1 cụm:** `feature-issue-ac-demo-standard.md` + script `feature-issues-sync.mjs`. Cụm này:
- Lật ngược mô hình: coi feature-register là SOT sinh ra mọi thứ (mâu thuẫn xương sống).
- Đẻ token song song `F-NNN` (không có trong grammar chuẩn D3 = GAP/REQ-ID/SC/TC/CR).
- Mô tả 1 script đồng bộ **không tồn tại** như thể đang chạy.
- Bị echo sang `HARNESS_CHANGELOG.md`, `playbooks/README.md`.

Đây đúng cái Trung bắt: "hỏi thì bảo dùng script, thực tế agent soạn từ SRS". Diệt cụm này là dọn 80% mơ hồ.

## 1. XOÁ NGAY (chết / trùng / nói dối)

| # | Xoá gì | Bằng chứng | Kèm dọn |
|---|---|---|---|
| X1 | `elearning-platform/scripts/feature-issues-sync.mjs` | 1/200 issue có marker; header tự xưng "SoT register->issue"; không tồn tại trong harness | input `docs/scope-baseline/feature-register.source.json` (chỉ script này đọc — GIỮ file, nó vẫn là scope-view), comment `check-ui-typography.mjs:36` |
| X2 | `elearning-platform/scripts/check-hardcoded-ui-strings.mjs` | không nằm trong `lint:gates` -> chạy chơi; đã bị `check-ui-typography` + `check-no-hardcoded-hex` thay | — |
| X3 | Khối "SUPERSEDED 2026-07-24" trong `HARNESS_CHANGELOG.md:58` | tự đánh dấu superseded, nợ kỹ thuật | — |
| X4 | Dữ liệu 1 dự án rò vào gate template `gates/pb-g2-scope-frozen.md:15-41` (BLK-01..04, Supadata, "123 features", ngày 2026-06-12) | các gate pb-g1/g3/g4 để trống, chỉ file này bẩn | RESET về checklist trống như sibling |

## 2. VIẾT-LẠI (nói sai thực tế / mâu thuẫn)

| # | File:line | Sai gì | Sửa thành |
|---|---|---|---|
| R1 | `feature-issue-ac-demo-standard.md:14,33` | tham chiếu `feature-issues-sync.mjs` như có thật | bỏ; nói thẳng issue soạn tay qua `new-issue.mjs` (đường thật), hoặc trỏ tới generator mới (mục 5) |
| R2 | `feature-issue-ac-demo-standard.md:24,29` "Feature-register = Source of Truth, everything derives" | mâu thuẫn `HARNESS.md §Source Hierarchy` + `TRACE_SPEC.md` | "register = view scope đông cứng ở PB-G2, KHÔNG phải nguồn sinh; SRS+REQ-ID ở trên" |
| R3 | `feature-issue-ac-demo-standard.md:26-29,81` + echo `playbooks/README.md:99`, `HARNESS_CHANGELOG.md:80` | token `F-NNN` không có trong D3 | CHỐT: bỏ `F-NNN`, dùng REQ-ID làm neo duy nhất (khớp `TRACE_SPEC.md:13-19`). (Hoặc Trung quyết hợp thức hoá F-NNN vào D3 — nhưng nên bỏ) |
| R4 | `HARNESS_CHANGELOG.md:44` "feature-issues-sync now maps 23 sections..." | mô tả runtime script không tồn tại | gỡ/sửa |
| R5 | `playbooks/README.md:24-25` "All playbooks ship experimental" | sai — 8 playbook đã `verified` | sửa dòng lifecycle |
| R6 | `STRUCTURE.md:52-54` "playbooks 33/gates 10/templates 27" | thực tế 34/12/>40 | cập nhật số |
| R7 | 3 gate `check-authz-test-present`, `check-money-concurrency-test-present`, phần `check-ac-coverage` | chỉ chứng "có file test" + có allowlist né -> không chứng minh hành vi | siết (kiểm nội dung test) HOẶC hạ kỳ vọng (đừng coi là bằng chứng hành vi) — Trung quyết |

## 3. GỘP (giảm trùng, không mất chức năng)

**Scripts:**
- G1 — Họ fidelity 3 script (`check-universal-fidelity-imports` + `check-new-screen-fidelity-required` + `check-prototype-fidelity`) -> 1 CLI đa-mode (giảm 3 lần spawn node/commit).

**Macro-2 bước (audit Macro-2):**
- G2 — **2.5 -> 2.4**: "walking skeleton" và "seed + P0 done" là cùng mốc P0. 1 bước "P0: skeleton boots + seeded-admin login".
- G3 — **2.7 -> 2.10**: review 6-dim và DoD chạy cùng floor rules mà 2.6 đã auto-check per-phase; doc tự thú 2.7 chỉ còn "aggregation". 1 "manifest-complete review+DoD gate".
- G4 — **2.11 -> 2.13**: prod-boot rehearse (2.11) + real (2.13) làm 2 lần; gộp readiness + rollback-rehearse vào release contract 2.13.
- G5 — **Security về 1 lần ở 2.9, khai báo VERIFY không REDO**: security lặp 3 chỗ (2.2 threat-model + 2.6 Leg-6 + 2.9). Viết 2.9 = "đối chiếu mitigation 2.2/2.6 + red-team bề mặt mới", đừng làm lại STRIDE từ đầu.

**Docs single-source (không xoá, 1 owner + trỏ tới):**
- G6 — floorplan rule restate 4 nơi -> 1 owner. Issue label/field rules restate 4 nơi -> owner = `github-issue-standard.md`. 3-layer/Independence chép giữa HARNESS ↔ AGENTS -> AGENTS trỏ về HARNESS.

## 4. GATE GIẢ (nói cơ học nhưng thật ra prose/agent phán) — thật-hoá hoặc bỏ nhãn

- 2.1 "ERD FROZEN", 2.4 "WALKING-SKELETON gate" (`gates/README.md:19` bảo có `/gate-check --gate WALKING-SKELETON` nhưng **không có gate file**). -> hoặc viết script thật, hoặc bỏ nhãn "mechanical", gọi đúng là "orchestrator phán".
- **G2 lỗ lớn nhất (biết rồi, Trung hoãn):** mọi lint:gates chỉ local-hook, gh-merge bypass. Mọi "gate cơ học" thực chất advisory tới khi có server-side.

## 5. 2.3 — bước lệch nặng nhất, phải tách vai

Hiện 2.3 gánh 2 vai mâu thuẫn: (a) compile build-manifest cho build tuyến tính; (b) cửa re-entry cho change-control kiểu-issue. Thực tế phase-2 chạy đường (b) - issue, không qua manifest (manifest cố ý loại phase-2). Sửa:
- Tách rõ 2 vai trong doc.
- Thừa nhận phase-2 chạy Mode-B-style (issue), hoặc sửa thực tế cho khớp manifest — đừng để 2 mô hình cùng tồn tại.
- Nối vào việc XÂY MỚI dưới.

## 6. XÂY MỚI (thay cái vừa xoá — từ debate với Nghĩa)

Sau khi diệt `feature-issues-sync` (di sản), xây đúng cách team làm:
- **N1 — Generator neo REQ-ID (hướng B):** với mỗi REQ-ID: scope từ register + AC từ SRS + link giao diện từ prototype -> issue. Thay hẳn `feature-issues-sync`.
- **N2 — RTM status + gate:** bảng REQ-ID × [register, SRS, prototype-freeze, issue, test, code, state]; ô đỏ = thiếu. Vừa observability ("chạy đến đâu biết đó") vừa gate "đủ". **Làm TRƯỚC N1.**
- **N3 — Anti-bịa:** check "REQ-ID trong issue phải có trong SRS" + verifier-agent kiểm chéo AC vs SRS.
- **N4 — Ép mục Links bắt buộc:** mỗi field issue phải có ref nguồn (SRS/scope/prototype) + check ref tồn tại. Đây là phần máy đo "đúng".
- **N5 — 3 thứ Nghĩa cần harness chưa có:** UAT 3-loại, nhánh CR-nhỏ bỏ báo giá, luật DoD-bắt-buộc-SRS.

## 7. Thứ tự thực thi đề xuất

1. **Dọn dối trước (X1-X4, R1-R6)** - rẻ, gỡ mơ hồ ngay, không rủi ro logic.
2. **N2 (RTM status+gate)** - nền quan sát + kiểm mọi thứ sau.
3. **N1 + N3 + N4 (generator neo REQ-ID + anti-bịa + Links)** - thay đường tạo issue.
4. **GỘP Macro-2 (G2-G5)** - cắt bước thừa.
5. **Template↔elearning: chốt bản canonical 15-gate rồi propagate** (drift đang ngược).
6. **R7 + gate-giả + N5** - siết gate yếu, bù thứ Nghĩa cần.

## 8. Cần Trung/Nghĩa quyết
- Chốt bỏ token `F-NNN`, dùng REQ-ID duy nhất (R3)? (khuyên: bỏ)
- Gate `*-test-present` yếu: siết (kiểm hành vi) hay hạ kỳ vọng (R7)?
- Bản canonical gate: lấy elearning (15 gate, mới) làm chuẩn rồi propagate ngược harness template - đồng ý?
- Thứ tự mục 7 - giữ hay đổi.
- Bắt đầu từ nhóm 1 (dọn dối) luôn không, hay duyệt cả kế hoạch trước.

## Unresolved
- `restore-drill.sh`: chưa thấy call CI, chỉ runbook nhắc - xác nhận có chạy tay theo lịch DR không trước khi kết luận orphan.
- 2 bộ `delivery-closure-story/` + `project-closure-story/` (+ fork VN) chồng nhau về closure - đáng rà gộp nhưng cần đọc kỹ trước khi xoá.
