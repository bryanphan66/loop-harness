# Macro-2 (Build & Go-live) — spine 1 bảng

> **Đây là chỗ DUY NHẤT nhìn phát rõ Macro-2.** Mỗi bước dùng playbook nào (cách
> làm) + qua gate nào (cổng kiểm) + điền mẫu tài liệu nào + chạy script/lệnh nào +
> xong khi nào. Muốn CHI TIẾT 1 bước: mở playbook/gate ở cột tương ứng. Muốn mục
> tiêu-text cho agent: `STAGE_GOALS.md` cùng bước.
>
> Neo xuyên suốt = **REQ-ID** (mã yêu cầu). Đọc `TRACE_SPEC.md`.
> Refactor 2026-09-01: gộp 2.5→2.4, 2.7→2.10, 2.11→2.13; security 1 lần verify ở 2.9.

## Luật của bảng này - đọc trước khi sửa bất cứ dòng nào

Mỗi bước khai **đúng 4 ô**, cả 4 máy kiểm được:

| Ô | Nghĩa | Máy kiểm gì |
|---|---|---|
| **VÀO** | artifact phải có trước khi chạy | file tồn tại? |
| **RA** | artifact bước này sinh ra | file tồn tại sau khi chạy? |
| **GATE** | script nào chặn, **và chặn LÚC NÀO** | script tồn tại + chạy được? |
| **ENGINE** | skill có thật, hoặc `—` khi playbook đã đủ | skill có trong bộ đang cài? |

**Thời điểm của GATE** là bắt buộc, không được bỏ trống. Bốn giá trị:
`@một-lần` (chạy đúng một lần ở bước đó) · `@mỗi-phase` (2.6, lặp) ·
`@pre-commit` · `@pre-push`. Không ghi thời điểm thì không ai biết nối gate vào đâu,
và nó sẽ nằm đó không ai gọi.

**ENGINE ghi `—` là hợp lệ.** Một bước cần **một trong ba**: script cơ học, playbook,
hoặc skill. Skill là loại đắt nhất và ít cần nhất - `WORKFLOW.md` từng gọi 22 engine
trong khi chỉ 9 tồn tại, mà gần như không bước nào bị chặn thật, vì playbook và gate
đã gánh. Đừng bịa tên cho đủ cột.

### Luật bất biến

> Mọi file trong `../playbooks/`, `../gates/`, `../mau-tai-lieu/` **phải được bảng này
> gọi tên**. Không được gọi = không thuộc repo này.

Gate `dangling-refs --two-way` kiểm **hai chiều** (cờ này chỉ bật ở **repo harness**;
dự án không bật, vì dự án có playbook Macro 1 nó đã dùng thật, không bị bảng macro-2
gọi tên là đúng): tên trong bảng phải có file, và file phải có
tên trong bảng. Một chiều thì repo tích tụ được đồ mồ côi mà không ai biết - đã đo
2026-09-05: 12/33 playbook, 4/25 mẫu tài liệu không người tiêu thụ.

### Chống phình khi nâng cấp

Mọi nâng cấp phải rơi vào **một trong 4 ô**. Không rơi vào đâu được = chưa chín, ghi
vào `macro-2-deltas.md` chờ, đừng nhét vào bảng.

**Cấm thêm cột.** Cột mới là tầng mới, tầng mới là chỗ hai nguồn bắt đầu lệch - MD-10
(PB-G3/G4 đảo nghĩa) và MD-11 (lệch danh sách bước) đều sinh ra đúng kiểu đó.

Delta phải có cột **"lòi ra ở đâu"**. Không dự án thật nào lòi ra thì đó là ý tưởng,
không phải delta.

## Bảng bước → file

| Bước | Làm gì (1 câu) | Playbook (cách làm) | Gate (cổng) | Mẫu tài liệu | Script / lệnh | Xong khi |
|---|---|---|---|---|---|---|
| **2.0** | Kiểm sẵn sàng: tier-2 hợp thư viện UI + tài liệu không gọi tên ma + **ánh xạ component -> thư viện** | — | `tier2-ui-compat` ⚙️ + `dangling-refs` ⚙️ + component-mapping *(người)* **@một-lần**| `component-mapping-<thư-viện>.md` | `check-tier2-ui-compat.mjs`, `check-dangling-refs.mjs` | phiên bản build tool khớp major, mọi token thư viện đọc đều có trong tier 2, 0 cú pháp đời cũ, 0 tham chiếu treo, **mọi dòng ma trận component đã phân loại trực tiếp/ghép/thiếu và mỗi cái thiếu đã có PR lên thư viện gốc** |
| **2.1** | Đóng băng ERD (sơ đồ dữ liệu) | — (ck-tech-design) | ERD-frozen *(người phán)* **@một-lần**| `decision.md` | — | ERD chốt, entity ↔ REQ-ID đủ |
| **2.1b** | Di trú dữ liệu (chỉ brownfield) | `external-integration` | ETL + dry-run *(người)* **@một-lần**| — | — | dry-run cutover pass, hoặc N/A |
| **2.2** | Chọn stack + threat-model | — (ck-tech-design) | stack-justified *(người)* **@một-lần**| `decision.md`, `code-standards.md` | — | ADR stack xong, threat-model ghi (nền cho 2.9) |
| **2.3** | Bản kê thi công + DoR + soạn issue | `build-manifest-compilation`, `feature-issue-ac-demo-standard`, `github-issue-standard` | `check-manifest-coverage` ⚙️ + `dor-build` **@một-lần**| `build-manifest.md`, `spec-intake.md`, `change-request-log.md` | `check-manifest-coverage.mjs` | mọi REQ-ID in-scope vào đúng 1 phase, DoR xanh |
| **2.4** | Bộ xương app chạy + seed *(gộp 2.5)* | `seed-data-pattern` | walking-skeleton + secret-scan ⚙️ + `ui-region-boundary` ⚙️ **@một-lần**| `deployment-guide.md` | `scaffold.sh`, `secret-scan.sh`, `check-ui-region-boundary.mjs`, seed | app boot + admin login được, P0 done, **vùng public/portal đã khai trong `gate-config.json`** |
| **2.6** | Code từng phase (vòng lặp) | `build-execution`, `prototype-export-adoption`, `payment-integration` *(khi phase có luồng tiền)* | fidelity ⚙️, fk-index ⚙️, ui-typography ⚙️, ac-coverage ⚙️, shared-dialog ⚙️, `ui-region-boundary` ⚙️, phase-acceptance **@mỗi-phase**| `story.md` | **`/build-phase`**, các `check-*.mjs`, `rtm-status.mjs`, `req-issue-scaffold.mjs` | mỗi phase: validate xanh + e2e smoke + fidelity pass + verifier nghiệm thu + custom tái dùng được đã mở PR ngược lên thư viện UI |
| **2.8** | E2E từ AC + hướng dẫn dùng | `canonical-e2e-flow-playbook`, `user-guide-hdsd-standard` | `check-ac-coverage` ⚙️ **@một-lần**| `validation-report.md` | `check-ac-coverage.mjs` | mọi REQ-ID có ≥1 E2E pass + đường-lỗi + login test |
| **2.9** | Bảo mật — VERIFY (không làm lại) | — (ck-security) | security-sign-off *(người)* **@một-lần**| — | — | 0 Critical/High; đối chiếu threat-model 2.2 + floor 2.6 |
| **2.10** | Review cuối + QA + DoD *(gộp 2.7)* | `code-review-scoring`, `e2e-qa-field-by-field-verify-with-report`, `pre-demo-self-qa-checklist` | `dod-build`, `visual-fidelity` **@một-lần**| `validation-report.md` | `harness-verify-gate.sh` | review ≥7 + DoD gate xanh từng màn |
| **2.12** | Khách nghiệm thu (UAT) | — (ck-uat/signoff) | ACCEPTANCE *(khách ký)* **@một-lần**| `delivery-closure-story/` | — | khách (hoặc chủ) ký |
| **2.13** | Go-live + release *(gộp 2.11)* | `go-live-deploy-verify` | verify-at-source ⚙️ **@một-lần**| `release-note.md` | `ship-and-verify.sh` | container chạy đúng commit đã release; rollback = 1 dòng |

> ⚙️ = gate CƠ HỌC (script chặn thật, chạy ở git-hook local). Còn lại *(người)* =
> orchestrator/người phán. **Lỗ đã biết:** gate cơ học chỉ chạy hook local — `gh
> merge`/web-edit bypass được (chưa có server-side).

## Nguồn nội dung issue (neo REQ-ID)
- **Scope** (feature nào) ← `feature-register` *(view scope đông băng PB-G2, KHÔNG phải SOT)*.
- **Chi tiết + AC** ← `docs/requirements/srs/` *(SOT thật, sống)*.
- **Giao diện** ← prototype đã freeze. **Đọc theo TỪNG FRAME, không mở cả file.**
  Board là một file HTML rất lớn (autocontent: 2,171,246 ký tự, 121 frame, ảnh
  base64 chiếm 34%). Mở cả file là vỡ ngân sách context, mà vỡ context thì agent bịa.
  Dùng `extract-frame.mjs`: `--list` để xem mục lục, `sNN` để lấy một frame
  (7.5K-17K ký tự), `--trace` để lấy route + floorplan + REQ-ID + UC + CR của frame đó.
- **Board trên Claude Design là CHỈ ĐỌC.** Prototype đã freeze ở PB-G4; bản dùng để
  so fidelity là clone trong repo, không phải board. Board sửa được nên không được
  dùng làm mốc. Không bao giờ ghi lên board từ trong lượt chạy.
- **Soạn issue** = agent đọc SRS → `new-issue.mjs` (hoặc `req-issue-scaffold.mjs` gom theo REQ-ID). KHÔNG có script sync register→issue.
- **Đủ chưa / ở đâu** = `rtm-status.mjs` (bảng REQ-ID × register/issue/test/prototype).

## UI: custom hay component (ranh giới theo VÙNG, không theo cảm tính từng màn)

| Vùng | Luật | Ghi chú |
|---|---|---|
| **Trang public** | custom 100% | copy thẳng từ prototype đã freeze |
| **Portal / admin** | ~99% dùng component thư viện UI | thư viện là SOT, không code inline |
| **1% custom trong portal** | tái dùng được thì **đẩy ngược lên thư viện gốc**, rồi kéo xuống | không để lại trong dự án |

- **Không sửa file trong `components/ui/` tại chỗ.** Đó là file thư viện sinh ra;
  lần sync bản mới sẽ ghi đè mất. Thiếu gì thì nâng ở repo thư viện.
- Ai phán "cái này tái dùng được": agent đề xuất, **người duyệt ở mốc đóng phase**,
  vì nó ảnh hưởng dự án khác.
- Lint chặn màu cứng (vd `no-raw-color` của reno-ui) **không** chặn được việc tự viết
  component mới. Gate `ui-region-boundary` ⚙️ (`check-ui-region-boundary.mjs`) lo chỗ đó:
  vùng portal cấm tự vẽ `<button>/<input>/<select>/<textarea>/<dialog>`; thư mục thư viện
  chỉ được chứa mục có thật của registry; vùng public chỉ **cảnh báo** màu cứng, không chặn.
  Dự án khai vùng trong `scripts/gate-config.json` khối `uiRegions`. Chưa khai hoặc chưa
  scaffold thì gate báo rõ lý do chứ không im lặng xanh.

## Đọc thêm (chi tiết, không lặp ở đây)
- Mục tiêu-text từng bước cho agent: `STAGE_GOALS.md`.
- Bảng mọi bước 3 macro + lane: `WORKFLOW.md`.
- Danh sách script gate: `../gates/lint-gates-registry.md`.
- Thay đổi harness phát hiện từ dự án thật: `macro-2-deltas.md`.
