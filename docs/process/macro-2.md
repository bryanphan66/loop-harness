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
| **2.0** | Kiểm sẵn sàng: tier-2 hợp thư viện UI + tài liệu không gọi tên ma + **ánh xạ component -> thư viện** | — | `tier2-ui-compat` ⚙️ + `dangling-refs` ⚙️ + component-mapping *(người)* **@một-lần**| `component-mapping-<thư-viện>.md`, `dangling-refs-allow.md` | `check-tier2-ui-compat.mjs`, `check-dangling-refs.mjs` | phiên bản build tool khớp major, mọi token thư viện đọc đều có trong tier 2, 0 cú pháp đời cũ, 0 tham chiếu treo, **mọi dòng ma trận component đã phân loại trực tiếp/ghép/thiếu và mỗi cái thiếu đã có PR lên thư viện gốc** |
| **2.1** | Đóng băng ERD (sơ đồ dữ liệu) | — (ck-tech-design) | ERD-frozen *(người phán)* **@một-lần**| `decision.md` | `check-reqid-artifact-coverage.mjs --artifact entity --advisory` | ERD chốt, entity ↔ REQ-ID đủ |
| **2.1b** | Di trú dữ liệu (chỉ brownfield) | `external-integration` | ETL + dry-run *(người)* **@một-lần**| — | — | dry-run cutover pass, hoặc N/A |
| **2.2** | Chọn stack + threat-model | `async-job-queue`, `object-storage`, `media-pipeline` *(khi stack có hàng đợi / lưu tệp / xử lý media)* | stack-justified *(người)* **@một-lần**| `decision.md`, `code-standards.md` | `check-reqid-artifact-coverage.mjs --artifact api --advisory` | ADR stack xong, threat-model ghi (nền cho 2.9) |
| **2.3** | Bản kê thi công + DoR + soạn issue | `build-manifest-compilation`, `feature-issue-ac-demo-standard`, `github-issue-standard` | `check-manifest-coverage` ⚙️ + `dor-build` **@một-lần**| `build-manifest.md`, `spec-intake.md`, `change-request-log.md` | `check-manifest-coverage.mjs` , `setup-issue-board.mjs`| mọi REQ-ID in-scope vào đúng 1 phase, DoR xanh |
| **2.4** | Bộ xương app chạy + seed *(gộp 2.5)* | `seed-data-pattern` | walking-skeleton + secret-scan ⚙️ + `ui-region-boundary` ⚙️ **@một-lần**| `deployment-guide.md`, `config/deploy.yml` *(Kamal)* | `scaffold.sh`, `secret-scan.sh`, `pnpm lint:gates` *(đã gồm `check-ui-region-boundary.mjs`)*, seed | app boot + admin login được, P0 done, **vùng public/portal đã khai trong `gate-config.json`** |
| **2.6** | Code từng phase (vòng lặp) | `build-execution`, `dispatch-modes`, `prototype-export-adoption`, `payment-integration` *(khi phase có luồng tiền)* | fidelity ⚙️, fk-index ⚙️, ui-typography ⚙️, ac-coverage ⚙️, shared-dialog ⚙️, `ui-region-boundary` ⚙️, phase-acceptance **@mỗi-phase** + `issue-coverage` ⚙️| `story.md` | **`/build-phase`**, các `check-*.mjs`, `rtm-status.mjs`, `req-issue-scaffold.mjs` , `.harness/steady-state/scripts/new-issue.mjs`, `.harness/steady-state/scripts/issue-state.mjs`, `check-issue-coverage.mjs` , `check-reqid-artifact-coverage.mjs --phase P<n>` | mỗi phase: validate xanh + e2e smoke + fidelity pass + verifier nghiệm thu + custom tái dùng được đã mở PR ngược lên thư viện UI |
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
- **Soạn issue** = agent đọc SRS → `.harness/steady-state/scripts/new-issue.mjs` (hoặc `req-issue-scaffold.mjs` gom theo REQ-ID). KHÔNG có script sync register→issue.
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

### Kéo component xuống bằng gì

Scaffold không kèm sẵn component nào - `apps/web/src/components/ui/` **trống** cho tới khi
chạy `pnpm ui:sync` ở bước 2.4. Cố ý: có sẵn một bộ primitive tự viết là mời người ta sửa
tại chỗ, rồi lần sync sau mất.

| file | vai trò |
|---|---|
| `apps/web/reno-ui.manifest.json` | danh sách component dự án dùng - nguồn sự thật |
| `apps/web/components.json` | khai namespace `@reno` trỏ registry |
| `apps/web/reno-registry.lock.json` | bản chụp danh mục registry, để gate đối chiếu **offline** |
| `scripts/ui-sync.mjs` | `pnpm ui:sync` cài, `--add <tên>` thêm, `--check` soi lệch |

`ui:check` nằm ngay đầu chuỗi `lint:gates`, nên manifest khai một đằng file có một nẻo là
đỏ trước mọi gate khác. Nâng phiên bản thư viện sau này = chạy lại `pnpm ui:sync`, một lệnh.

## Gate đỏ mãi là gate mù

`dangling-refs` từng đỏ 15 dòng ở mọi lượt chạy vì có những tham chiếu treo hợp lệ
(engine của macro khác, output chưa sinh, thứ đã ruled N/A). Agent viết văn giải thích
rồi đi tiếp. Lần sau có một tham chiếu treo **mới**, nó là dòng thứ 16 trong danh sách
đỏ 15 dòng - không ai nhận ra.

Nay ngoại lệ phải **khai** ở `docs/gates/dangling-refs-allow.md`, mỗi dòng một tham
chiếu kèm lý do và nguồn. Khai hết thì gate xanh; còn một dòng chưa khai thì đỏ. Ngoại
lệ hết treo mà vẫn nằm trong file thì gate báo **thừa** - danh sách không phình mãi.

Luật chung rút ra: **một gate không bao giờ xanh được là một gate đã hỏng.** Gặp gate
kiểu đó thì cho nó cơ chế khai ngoại lệ, đừng dạy người đọc bỏ qua nó.

## Chuỗi issue: dựng bảng -> mở issue -> đẩy trạng thái

Ba mắt xích, thiếu mắt đầu thì hai mắt sau không chạy được. Trên một dự án thật, chạy hết
2.0..2.4 mà repo vẫn **0 issue, 0 milestone, 0 nhãn `Module:`** - vì không bước nào giao
việc, dù bảng 2.3 đặt tên bước là *"soạn issue"* và `issue%` được dựng ra để đo đúng cái đó.

| lúc nào | làm gì | bằng gì |
|---|---|---|
| **2.3** dựng bảng | milestone = **phase phát hành** (`Phase 1..N`, có hạn chót) + nhãn `Build: P<n>` (phase thi công) + nhãn `Module: <Tên>` + `plane` | `setup-issue-board.mjs` (mặc định chạy thử, `--apply` mới tạo) |
| **2.6** mở phase | issue cho REQ-ID của phase, gắn `Build: P<n>` + `Module:` + milestone đợt phát hành, state `Ready for Dev` | `.harness/steady-state/scripts/new-issue.mjs` |
| **2.6** runner nhận việc | state `In Dev` - đây là mắt xích cho theo dõi **live** | `.harness/steady-state/scripts/issue-state.mjs <n> "In Dev"` |
| **2.6** verifier PASS | state `Done` | `.harness/steady-state/scripts/issue-state.mjs <n> "Done"` |
| **2.6** đóng phase | cổng kiểm bằng máy | `check-issue-coverage.mjs --phase P<n> --closing` |

**Milestone là mốc phát hành, không phải gói việc.** Đã va tên thật: `ROADMAP.md` dùng
"phase 2" nghĩa đợt phát hành sau, bảng thi công cũng có "Phase 2" nghĩa gói việc thứ hai.
Milestone có hạn chót + thanh tiến độ nên nó thuộc về mốc kinh doanh; phase thi công chỉ là
thứ tự làm nội bộ nên nó là nhãn `Build: P<n>`. Một issue mang **cả hai**: nó thuộc gói việc
nào, và sẽ ra mắt ở đợt nào.

**Vì sao 2.3 dựng bảng chứ không phải 2.6:** 2.3 là lúc **duy nhất** biết đủ danh sách phase
(P0..P20 trong `build-manifest.md`) và module (M1..M20 trong `ROADMAP.md`). Bắt 2.6 dựng thì
phase đầu phải dựng bảng cho 20 phase sau - sai vai.

**Vì sao issue mở theo phase chứ không dựng hết ở 2.3:** dựng 400 issue ở 2.3 là 400 issue
chết nằm chờ hàng tuần; phạm vi còn đổi thì sửa hàng loạt. Mở theo phase thì issue sống đúng
lúc có người làm, và khớp cách Mode B (Macro 3) vận hành sau go-live.

## Tiêu chí quy mô máy: đo trước, chặn sau

Bước 2.1 đòi *mọi REQ-ID map >=1 thực thể*, 2.2 đòi *API contract phủ mọi REQ-ID có API*.
Cả hai là tiêu chí quy mô máy (401 mã, 601 mục) giao cho **gate người phán** trong 15 lượt,
và **không có script**. Trên dự án thật agent chỉ còn hai lối: nhận vống, hoặc hạ mức kiểm
rồi ghi lại là đã hạ.

Đo lần đầu bằng máy: **ERD phủ 22%**, **API contract phủ 17%** (mức `area`). Không phải hai
tài liệu sai 78%, mà là chúng **chưa từng ghi trích dẫn REQ-ID**. Bắt đủ 100% ngay tại
2.1/2.2 là bắt viết ~130 dòng trích dẫn trong một bước 15 lượt - cổng sẽ đỏ mãi rồi bị bỏ
qua, đúng bệnh "gate đỏ mãi là gate mù".

**Cách làm:** đo ở 2.1/2.2 (`--advisory`, ghi số vào ghi chép), **chặn ở 2.6 theo từng
phase** (`--phase P<n>`). Mở phase nào thì viết trích dẫn cho phase đó. Phase cuối đóng
xong là phủ tự đủ 100%, không ai phải viết một lượt.

Kiểm chứng: `P1.1` chạy chế độ chặn -> **xanh, 4/4 REQ-ID có thực thể**. Nợ chia nhỏ thì
trả được.

## 10 nấc trạng thái issue = bản sao của chính các bước Macro 2

Trường `States` của tổ chức có **10 nấc**, và chúng không phải trang trí - chúng là Macro 2
nhìn từ phía một REQ-ID:

| nấc | ai đẩy | bước |
|---|---|---|
| `Backlog` | `new-issue.mjs` lúc tạo | 2.6 mở phase |
| `Ready for Dev` | tiêu chí chấp nhận đủ | 2.6 |
| `In Dev` | runner nhận việc | 2.6 |
| `Ready for Test` | code xong, chờ verifier | 2.6 đóng phase con |
| `QC Testing` | verifier độc lập đang chạy | **2.10** |
| `Ready for UAT` | QA pass | **2.10** |
| `UAT Testing` | khách đang nghiệm thu | **2.12** |
| `Deploying` | đang go-live | **2.13** |
| `Done` | đã lên sóng + verify-at-source | **2.13** |
| `Cancelled` | phạm vi bị cắt | bất kỳ, kèm CR |

**Đo lần đầu trên dự án thật: goal-text chỉ đẩy tới `In Dev` rồi thôi.** Bảy nấc sau không
bước nào chạm tới - pipeline đứng yên tới hết dự án, và Macro 3 (chạy bằng issue-pipeline)
sẽ nhận bàn giao một bảng nói dối.

**Cách giữ cho hồ sơ khớp thực tế:** mỗi bước sau 2.6 kiểm bằng
`check-issue-coverage.mjs --expect "<nấc>"`. 2.10 đòi `Ready for UAT`, 2.12 đòi
`UAT Testing`, 2.13 đòi `Done` trước khi flip sang Mode B. Nhảy nấc là nói dối về việc **ai
đã kiểm cái gì**, nên cổng chặn.

## Bù, đừng tua lại

Phát hiện một bước **trước đó** thiếu sản phẩm - như trường hợp bảng issue trên - thì:

1. **Chạy bù đúng phần thiếu ở bước hiện tại.** Dữ liệu để dựng nó thường đã có sẵn.
2. **Ghi một quyết định (AD)** nói rõ đang bù cho bước nào, vì sao thiếu.
3. **Sửa goal-text** của bước đó để dự án sau không thiếu nữa.

**Không đặt lại con trỏ bước.** Tua về 2.3 nghĩa là dựng lại `build-manifest.md` đã đóng và
cổng DoR đã thông - phá thứ đang đứng vững để lấy một sản phẩm phụ. "Bước" là một mốc thời
gian, không phải cái máy bấm nút chạy lại.

## Hai sổ theo dõi một lượt chạy

Mở ở **2.0**, chốt ở **2.13**. Không có chúng thì chạy xong không sửa được Macro 2 - và
sửa Macro 2 chính là lý do chạy thật trên một dự án thật.

| sổ | ghi lúc nào | dùng để |
|---|---|---|
| `docs/macro2-run-log.md` | 2.0, 2.4, 2.6, 2.13 - `node scripts/measure-macro2.mjs --step <bước>` | đo độ chênh 4 chỉ số. Một dòng lẻ không nói gì, **độ chênh** mới là bằng chứng |
| `docs/macro2-friction-log.md` | **ngay lúc vướng**, không gom cuối bước | goal-text mơ hồ / gate bắt nhầm / phải làm tay. Cuối lượt mỗi dòng thành một `MD-NN` hoặc bị đóng kèm lý do |

`register%` và `prototype%` là di sản Macro 1 - Macro 2 không làm chúng tăng, đừng tính
vào công. Hai cột phải tiến là `test%` và `issue%`.

## Bung việc bằng gì

`/build-phase` ở 2.6 dùng **subagent trong phiên**, không phải `claude --bg`. Nghĩa là
2.6 chạy được **không cần** `settings.local.json` hay permission-mode - một lo lắng
từng chặn kế hoạch, hoá ra không có thật.

Bốn chế độ và khi nào dùng cái nào: `../playbooks/dispatch-modes.md`. Ba điều hay
vấp nhất:

- **`-p` không đi với `--bg`.** CLI chặn thẳng: *"--print never starts the interactive
  session that `claude agents` attaches to"*. Prompt để ở vị trí positional.
- **`acceptEdits` không tự duyệt lệnh bash** - worker nền không người trực sẽ treo ở
  prompt và rơi vào `blocked`. Cần `bypassPermissions` hoặc `--allowed-tools`.
- **Sửa song song cùng file thì phải tách worktree** (`claude -w`, hoặc subagent với
  `isolation: worktree`). Không có cách khác.

## Triển khai: Kamal

Chuẩn triển khai của harness là **Kamal**, không phải chọn trên giấy - elearning-platform
đã chạy live staging bằng nó.

- `config/deploy.yml` - mẫu có sẵn trong scaffold, dùng `__PROJECT_SLUG__`. Bước **2.4**
  điền các chỗ `TODO` (org, registry, SSH port, digest của image accessory).
- `.kamal/secrets-common` - **không phải** `.kamal/secrets`. Với `-d <destination>` Kamal
  đọc `secrets-common` và bỏ qua file phẳng; đặt nhầm ra lỗi
  *"Secret 'KAMAL_REGISTRY_PASSWORD' not found"*. Bài học từ elearning, mất một vòng để tìm.
- `env.clear.COMMIT_SHA` nhúng commit vào container. Bước **2.13** `ship-and-verify.sh`
  đọc lại giá trị đó để kiểm at-source - không có nó thì không phân biệt được "deploy xong"
  với "deploy đúng bản".
- **Workflow CI cho deploy không nằm trong scaffold** vì nó phụ thuộc destination, registry
  và quy ước tag của từng dự án. Mẫu đầy đủ 611 dòng (beta tag + release + destination
  chooser): `elearning-platform/.github/workflows/deploy.yml`. Chép và sửa ở 2.4, đừng
  dựng lại từ đầu.

## Đọc thêm (chi tiết, không lặp ở đây)
- Mục tiêu-text từng bước cho agent: `STAGE_GOALS.md`.
- Bảng mọi bước 3 macro + lane: `WORKFLOW.md`.
- Danh sách script gate: `../gates/lint-gates-registry.md`.
- Thay đổi harness phát hiện từ dự án thật: `macro-2-deltas.md`.
