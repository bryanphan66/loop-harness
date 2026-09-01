# Macro-2 (Build & Go-live) — spine 1 bảng

> **Đây là chỗ DUY NHẤT nhìn phát rõ Macro-2.** Mỗi bước dùng playbook nào (cách
> làm) + qua gate nào (cổng kiểm) + điền mẫu tài liệu nào + chạy script/lệnh nào +
> xong khi nào. Muốn CHI TIẾT 1 bước: mở playbook/gate ở cột tương ứng. Muốn mục
> tiêu-text cho agent: `STAGE_GOALS.md` cùng bước.
>
> Neo xuyên suốt = **REQ-ID** (mã yêu cầu). Đọc `TRACE_SPEC.md`.
> Refactor 2026-09-01: gộp 2.5→2.4, 2.7→2.10, 2.11→2.13; security 1 lần verify ở 2.9.

## Bảng bước → file

| Bước | Làm gì (1 câu) | Playbook (cách làm) | Gate (cổng) | Mẫu tài liệu | Script / lệnh | Xong khi |
|---|---|---|---|---|---|---|
| **2.1** | Đóng băng ERD (sơ đồ dữ liệu) | — (ck-tech-design) | ERD-frozen *(người phán)* | `decision.md` | — | ERD chốt, entity ↔ REQ-ID đủ |
| **2.1b** | Di trú dữ liệu (chỉ brownfield) | `external-integration` | ETL + dry-run *(người)* | — | — | dry-run cutover pass, hoặc N/A |
| **2.2** | Chọn stack + threat-model | — (ck-tech-design) | stack-justified *(người)* | `decision.md`, `code-standards.md` | — | ADR stack xong, threat-model ghi (nền cho 2.9) |
| **2.3** | Bản kê thi công + DoR | `build-manifest-compilation` | `check-manifest-coverage` ⚙️ + `dor-build` | `build-manifest.md`, `spec-intake.md` | `check-manifest-coverage.mjs` | mọi REQ-ID in-scope vào đúng 1 phase, DoR xanh |
| **2.4** | Bộ xương app chạy + seed *(gộp 2.5)* | `seed-data-pattern` | walking-skeleton + secret-scan ⚙️ | `deployment-guide.md` | `scaffold.sh`, `secret-scan.sh`, seed | app boot + admin login được, P0 done |
| **2.6** | Code từng phase (vòng lặp) | `build-execution`, `prototype-export-adoption` | fidelity ⚙️, fk-index ⚙️, ui-typography ⚙️, ac-coverage ⚙️, shared-dialog ⚙️, phase-acceptance | `story.md` | **`/build-phase`**, các `check-*.mjs`, `rtm-status.mjs`, `req-issue-scaffold.mjs` | mỗi phase: validate xanh + e2e smoke + fidelity pass + verifier nghiệm thu |
| **2.8** | E2E từ AC + hướng dẫn dùng | `canonical-e2e-flow-playbook`, `user-guide-hdsd-standard` | `check-ac-coverage` ⚙️ | `validation-report.md` | `check-ac-coverage.mjs` | mọi REQ-ID có ≥1 E2E pass + đường-lỗi + login test |
| **2.9** | Bảo mật — VERIFY (không làm lại) | — (ck-security) | security-sign-off *(người)* | — | — | 0 Critical/High; đối chiếu threat-model 2.2 + floor 2.6 |
| **2.10** | Review cuối + QA + DoD *(gộp 2.7)* | `code-review-scoring`, `e2e-qa-field-by-field`, `pre-demo-self-qa-checklist` | `dod-build`, `visual-fidelity` | `validation-report.md` | `harness-verify-gate.sh` | review ≥7 + DoD gate xanh từng màn |
| **2.12** | Khách nghiệm thu (UAT) | — (ck-uat/signoff) | ACCEPTANCE *(khách ký)* | `delivery-closure-story/` | — | khách (hoặc chủ) ký |
| **2.13** | Go-live + release *(gộp 2.11)* | `go-live-deploy-verify` | verify-at-source ⚙️ | `release-note.md` | `ship-and-verify.sh` | container chạy đúng commit đã release; rollback = 1 dòng |

> ⚙️ = gate CƠ HỌC (script chặn thật, chạy ở git-hook local). Còn lại *(người)* =
> orchestrator/người phán. **Lỗ đã biết:** gate cơ học chỉ chạy hook local — `gh
> merge`/web-edit bypass được (chưa có server-side).

## Nguồn nội dung issue (neo REQ-ID)
- **Scope** (feature nào) ← `feature-register` *(view scope đông băng PB-G2, KHÔNG phải SOT)*.
- **Chi tiết + AC** ← `docs/requirements/srs/` *(SOT thật, sống)*.
- **Giao diện** ← prototype đã freeze.
- **Soạn issue** = agent đọc SRS → `new-issue.mjs` (hoặc `req-issue-scaffold.mjs` gom theo REQ-ID). KHÔNG có script sync register→issue.
- **Đủ chưa / ở đâu** = `rtm-status.mjs` (bảng REQ-ID × register/issue/test/prototype).

## Đọc thêm (chi tiết, không lặp ở đây)
- Mục tiêu-text từng bước cho agent: `STAGE_GOALS.md`.
- Bảng mọi bước 3 macro + lane: `WORKFLOW.md`.
- Danh sách script gate: `../gates/lint-gates-registry.md`.
