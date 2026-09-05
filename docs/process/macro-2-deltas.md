# Macro-2 deltas - sổ ghi thay đổi harness, phát hiện từ dự án thật

> Macro-2 đang là bản thử nghiệm. Chạy dự án thật để tìm chỗ thiếu, rồi chốt version.
> File này là chỗ DUY NHẤT ghi các thay đổi đó. Không ghi vào ledger của dự án:
> ledger `autonomous-decision-ledger.md` là quyết định CỦA DỰ ÁN, delta là thay đổi
> CỦA HARNESS, dự án sau cũng phải đọc.

## Cách dùng

**Ghim version trước khi chạy.** Đặt tag git `macro-2-v0.1` lúc bắt đầu một lượt chạy
thật. Không ghim thì cuối lượt không ai biết kết quả do bản nào tạo ra, và con số của
lượt trước thành không so sánh được.

**Ghi ngay, sửa sau.** Thấy vướng thì thêm một dòng vào bảng dưới, mất 1 phút, không
phải quyết định gì. Sửa file harness thì đợi tới **ranh giới phase**. Sửa giữa phase
lúc đang vướng là chắp vá.

**Phân loại trước khi được ghi.** Hỏi đúng 3 câu, theo thứ tự:

1. SRS có nói rõ chưa? Chưa -> lỗi tài liệu dự án. Sửa SRS. **Không phải delta.**
2. Prototype có màn đó chưa? Chưa -> lỗi Macro 1. Ghi vào dự án. **Không phải delta.**
3. Cả 2 đều có, mà harness không có bước hay gate nào bắt làm? -> **giờ mới là delta.**

Bỏ 3 câu này thì mỗi lần vướng đều đổ cho harness, và harness phình lên bằng những
thứ vốn là lỗi SRS.

**Trạng thái:** `mở` (mới ghi) -> `đã sửa` (đã vào file harness, ghi rõ commit) ->
`bỏ` (xét lại thấy không phải lỗi harness, ghi lý do).

## Bảng delta

| ID | Lượt chạy | Lòi ra ở đâu | Vấn đề | Sửa gì | Trạng thái |
|---|---|---|---|---|---|
| MD-01 | autocontent, trước 2.1 | dựng môi trường, đọc `reno-ui/docs/tailwind-v4-requirement.md` | macro-2 không có bước nào kiểm tier-2 token có chạy được với thư viện UI của dự án không | thêm bước 2.0 + gate `tier2-ui-compat` + script `check-tier2-ui-compat.mjs` | **đã sửa** |

| MD-02 | autocontent, trước 2.1 | luật do operator đưa 2026-09-05 | macro-2 không định nghĩa ranh giới UI custom vs UI component, và không có đường đẩy ngược component tái dùng lên thư viện gốc | luật 3 vùng + bước đẩy ngược + gate `ui-region-boundary` ⚙️ ở 2.4 và 2.6 | **đã sửa** |

| MD-03 | autocontent, lúc cài macro 2 | so tên playbook macro-2 gọi với file thật | `macro-2.md` cột 2.10 gọi `e2e-qa-field-by-field`, file thật tên `e2e-qa-field-by-field-verify-with-report.md` - tham chiếu treo, agent tìm không ra | sửa tên + dựng gate `dangling-refs` chặn tái phát | **đã sửa** |
| MD-04 | autocontent, lúc cài macro 2 | 4 link tương đối gãy sau khi copy spine sang dự án | spine giả định layout `docs/process/`; dự án layout phẳng thì `STAGE_GOALS.md`, `WORKFLOW.md`, `TRACE_SPEC.md` gãy. Installer không rewrite đường dẫn | chỉnh tay lúc cài + gate `dangling-refs` bắt link gãy | **đã sửa** |

| MD-05 | autocontent, sau khi cài macro 2 | truy nguồn gốc MD-01: ai sinh ra tier-2 kiểu v3 | bước **1.10 của Macro 1** gọi 2 engine không tồn tại (`ck-brand-guidelines`, `ck-design-system`); engine còn lại `ui-styling` dạy cả v4 lẫn v3, không chốt bản nào | đo lại: Macro 2 còn **0 engine treo**; 10 cái còn lại thuộc Macro 1/3, ngoài phạm vi | **đã giải quyết** |

| MD-06 | autocontent, chạy gate dangling-refs | thiếu **5** script steady-state (ghi ban đầu tưởng 1) | bước 2.13 gọi `ship-and-verify.sh`, script này nằm ở `scaffolds/steady-state/`, mà cài macro 2 chỉ nhúng `scaffolds/stack-pnpm-nest-next` | installer thêm `copy_steady_state_kit()`, nhúng `.harness/steady-state/` | **đã sửa** |

| MD-07 | autocontent, trước 2.1 | thử đọc prototype qua MCP Claude Design rồi qua clone local | macro-2 ghi "Giao diện <- prototype đã freeze" nhưng không nói đọc kiểu gì. Board 2,171,246 ký tự; agent mở cả file là vỡ context rồi bịa | luật đọc theo frame + `extract-frame.mjs` + chốt board chỉ đọc | **đã sửa** |

| MD-08 | autocontent, trước 2.1 | hỏi "gắn thư viện UI vào thì có đủ component không" mà không ai đo được | macro-2 không có bước nào đối chiếu ma trận component của dự án với thư viện UI. Không đo thì tới 2.6 mới vỡ ra thiếu, lúc đó đã có màn code theo cách khác | thêm ánh xạ vào bước 2.0 + mẫu bảng | **đã sửa** |

| MD-09 | autocontent, chuẩn bị ingest board trên Mac | chạy `ingest-archive.sh` trên macOS | script harness viết trên Linux, dùng `find -printf` và `stat -c%s`, cả hai không có trên macOS. Không ai kiểm tính khả chuyển | vá 2 script + cần luật: script harness phải chạy được trên Linux lẫn macOS | **đã sửa ở dự án, harness còn nợ luật** |
| MD-10 | autocontent, so gate doc với harness | đối chiếu `docs/gates/` hai bên | **PB-G3 và PB-G4 đảo nghĩa giữa harness và dự án** - không phải lỗi tên, mà đảo thứ tự tiền/thiết kế | cắt Macro 1 + Macro 3 khỏi loop-harness, để bản của dự án là bản duy nhất | **đã sửa** |

| MD-11 | autocontent, trước 2.1 | so danh sách bước WORKFLOW.md với macro-2.md | `/stage-next` lấy thứ tự bước từ `WORKFLOW.md` của dự án, mà file đó chưa biết refactor gộp bước 2026-09-01. Bước 2.0 không bao giờ chạy; 2.5/2.7/2.11 chạy vào chỗ trống | đồng bộ khối Macro 2 trong WORKFLOW.md | **đã sửa** |

| MD-12 | autocontent, đo chỉ số gốc trước khi chạy | `rtm-status` báo register 0% trong khi dự án có feature-register | lệch **một ký tự** tên file: script đọc `feature-register.source.json`, dự án có `feature-register-source.json`. Chỉ số gốc sai 60 điểm phần trăm | script nhận cả hai cách đặt tên | **đã sửa** |

| MD-13 | autocontent, kiểm cơ chế cưỡng chế | so hook `.claude` với git hook | `.githooks/pre-commit` gọi `harness-verify-gate.sh`, nhưng `core.hooksPath` nằm trong `.git/config` - **không đi theo repo**. Clone mới là gate tắt câm, không gì báo | không sửa sạch được; ghi lại + kiểm ở 2.0 | **mở, không sửa được sạch** |

## MD-01 - macro-2 không kiểm tương thích tier-2 với thư viện UI

**Lòi ra thế nào.** autocontent chuẩn bị dùng `RenoAI-Labs/reno-ui` cho tier 3.
reno-ui bắt buộc Tailwind v4, ghi thẳng trong `docs/tailwind-v4-requirement.md`:
"hard requirement, not a preference... will not grow a v3 compatibility mode".
Tier-2 của autocontent (`docs/design/design-tokens/`) sinh ở bước 1.10 theo kiểu v3:
triplet HSL trần trong `globals.css` + ánh xạ trong `tailwind.config.ts`.

**Phân loại.** SRS không sai. Prototype không sai. macro-2 không có bước nào bắt kiểm.
-> đúng lỗi harness.

**Vì sao nghiêm trọng.** Nếu không phát hiện trước 2.4, bước 2.4 dựng skeleton bằng
tier-2 kiểu v3, bước 2.6 code vài phase bám theo, rồi mới vỡ. reno-ui ước tính
chuyển đổi tốn khoảng 1 tuần cho một dự án. autocontent lúc phát hiện chưa có dòng
code app nào (`src/` chỉ có `components/README.md`) nên tốn gần như 0 công.

Chênh lệch: **0 công nếu bắt trước 2.4, khoảng 1 tuần nếu bắt sau.** Trên timeline
2 tuần coding thì đó là một nửa.

**Đã làm gì ở autocontent.** Port tier-2 sang v4, giữ nguyên HSL (không đổi sang
OKLCH vì màu `#2563EB` đã được operator duyệt ở AD-42, đổi hệ màu là mở lại quyết
định đã chốt). Kiểm bằng máy: 76 token màu cũ so 78 mới, 0 token đổi giá trị, 0 mất,
đúng 2 thêm (`--overlay`). Sau port phủ đủ 40/40 token reno-ui cần.
Commit: `autocontent@7794cb5`, nhánh `design/tailwind-v4-tokens`.

**Đề xuất sửa harness.** Thêm vào bảng bước của `macro-2.md`, đặt trước 2.4:

| Bước | Làm gì | Gate | Xong khi |
|---|---|---|---|
| 2.0 | Kiểm tier-2 token chạy được với thư viện UI đã chọn | tier2-ui-compat | phiên bản Tailwind khớp, mọi token thư viện đọc đều có trong tier 2, 0 token đổi giá trị khi port |

Kiểm được bằng máy, không cần người phán: đọc yêu cầu phiên bản của thư viện, so
danh sách tên token thư viện đọc với tên token tier 2 đang có, báo phần thiếu.

**Chưa quyết.** Đặt là bước 2.0 hay nhét vào DoR của 2.3. Chờ hết phase 1 của
autocontent rồi chốt, để xem còn delta nào cùng nhóm không.

## MD-02 - macro-2 không định nghĩa ranh giới UI custom vs UI component

**Luật operator đưa (2026-09-05).** Một dự án có 2 loại UI, ranh giới theo VÙNG chứ
không theo cảm tính từng màn:

| Vùng | Luật | Nguồn |
|---|---|---|
| **Public page** | custom 100% | copy thẳng từ prototype Claude Design |
| **Portal / admin** | khoảng 99% dùng component thư viện | reno-ui |
| **1% custom trong portal** | nếu thấy có khả năng dùng lại ở dự án sau thì **đẩy ngược lên reno-ui**, không để lại trong dự án | reno-ui là SOT |

**Phân loại.** SRS không sai, prototype không sai. macro-2 không có dòng nào về ranh
giới này, cũng không có bước nào cho việc đẩy ngược. -> lỗi harness.

**Vì sao nghiêm trọng.** Không có ranh giới rõ theo vùng thì mỗi phase agent tự quyết
"cái này custom cho nhanh", và tới phase 3-4 thì portal đã đầy component inline. Đây
đúng là loại rò rỉ kéo các lượt chạy trước xuống khoảng 60%. Lint `no-raw-color` của
reno-ui chặn được màu cứng nhưng KHÔNG chặn được việc tự viết component mới.

Chiều ngược lại cũng hỏng: custom tái dùng được mà để lại trong dự án thì dự án sau
viết lại từ đầu, và bản nâng cấp reno-ui không mang nó theo.

**Đề xuất sửa harness.**

1. Ghi luật 3 vùng vào `macro-2.md` (mục "Nguồn nội dung issue", cạnh dòng "Giao diện
   <- prototype đã freeze").
2. **Gate lint theo vùng, không lint toàn repo một kiểu.** Dự án phải khai đường dẫn
   nào là public, nào là portal. Vùng portal: cấm định nghĩa component UI mới ngoài
   `components/ui/` do thư viện sinh. Vùng public: chỉ áp `no-raw-color` ở mức cảnh
   báo, không chặn.
3. Thêm việc **đẩy ngược** vào vòng lặp 2.6: mỗi lần đóng phase, rà custom vừa viết
   trong portal, cái nào tái dùng được thì mở PR sang reno-ui trước, rồi dự án
   `shadcn add` xuống. KHÔNG sửa file trong `components/ui/` tại chỗ - lần sync bản
   mới sẽ ghi đè mất.

**Chưa quyết.** Ai phán "cái này tái dùng được" - agent tự quyết hay người. Đề nghị:
agent đề xuất, người duyệt ở mốc đóng phase, vì đây là quyết định ảnh hưởng dự án khác.

### MD-01 - đã sửa (2026-09-05)

`macro-2.md` có bước **2.0** với gate cơ học `tier2-ui-compat`, script
`scripts/check-tier2-ui-compat.mjs`. Script kiểm 3 thứ: phiên bản build tool khớp
major, mọi token thư viện đọc đều có trong tier 2, và không còn cú pháp đời cũ.

Đã test hai chiều, không chỉ đọc code:
- bản autocontent SAU port -> **XANH**, exit 0
- bản autocontent TRƯỚC port (`562f95c`) -> **ĐỎ**, exit 1, bắt đúng 4 lỗi:
  thiếu `--overlay` + `--sidebar`, 76 token viết kiểu v3, 9 chỗ `hsl(var(--x))`,
  không có khối `@theme`

Lần chạy đầu script báo nhầm 3 lỗi nằm trong comment của chính file token. Đã vá
bằng cách bỏ comment trước khi quét. Ghi lại vì đây là loại lỗi gate dễ tái phát:
gate quét văn bản thì phải bỏ comment trước.

### MD-02 - đã sửa một phần (2026-09-05)

Đã vào `macro-2.md`: mục "UI: custom hay component (ranh giới theo VÙNG)" với bảng
3 vùng, luật không sửa file trong `components/ui/` tại chỗ, và ai phán "tái dùng
được". Cột "Xong khi" của 2.6 thêm điều kiện custom tái dùng phải mở PR ngược.

**Còn nợ: gate lint theo vùng.** Chưa dựng được vì dự án chưa có app và chưa có
eslint config - `autocontent/src/` mới có `components/README.md`. Dựng ở **2.4**
cùng lúc scaffold. Yêu cầu: dự án khai đường dẫn nào là public, nào là portal;
vùng portal cấm định nghĩa component UI mới ngoài `components/ui/`; vùng public
chỉ cảnh báo màu cứng, không chặn.

## MD-03 - tham chiếu playbook treo trong macro-2.md

`macro-2.md` cột Playbook của bước 2.10 ghi `e2e-qa-field-by-field`. File thật tên
`e2e-qa-field-by-field-verify-with-report.md`. Agent đọc bảng rồi đi tìm file sẽ
không thấy, và im lặng bỏ qua playbook đó - không có gì báo.

Lòi ra khi đối chiếu từng tên playbook macro-2 gọi với file thật trong hai repo,
lúc chuẩn bị cài macro 2 vào autocontent.

**Đã sửa.** Đổi thành tên đầy đủ.

**Chống tái phát:** nên có kiểm cơ học "mọi tên file macro-2.md nhắc đều tồn tại".
Rẻ, và cùng loại lỗi với MD-04. Chưa làm, gộp vào lần dựng gate tiếp theo.

## MD-04 - copy spine sang dự án layout khác làm gãy link tương đối

`macro-2.md` sống ở `docs/process/` trong harness, cạnh `STAGE_GOALS.md` và
`WORKFLOW.md`, nên viết link tương đối trần: `STAGE_GOALS.md`, `WORKFLOW.md`,
`TRACE_SPEC.md`.

autocontent layout phẳng: hai file đó ở `docs/`, không có `docs/process/`. Copy
spine vào `docs/process/` xong thì 4 link gãy hết. Không có gì báo - file markdown
không ai kiểm link.

**Đã xử lý ở dự án:** chỉnh tay thành `../STAGE_GOALS.md`, `../WORKFLOW.md`,
`../TRACE_SPEC.md`, và thêm header ghi rõ SOT là bản ở harness, cấm sửa tại chỗ.
Commit `autocontent@95892b9`.

**Còn nợ ở harness.** Chỉnh tay không chống được tái phát: dự án sau cài lại là
gãy lại. Hai hướng:
- (a) `install-harness.sh` rewrite đường dẫn tương đối khi copy, theo layout đích
- (b) spine dùng đường dẫn tính từ gốc `docs/` thay vì tương đối, để copy đi đâu
  cũng đúng miễn đặt dưới `docs/`

Nghiêng về (b): rẻ hơn, không phải viết logic rewrite, và làm spine đọc được ở cả
hai layout. Chốt sau khi autocontent chạy xong phase 1, cùng lúc với MD-02.

## MD-05 - bước 1.10 gọi engine không tồn tại, và không chốt bản Tailwind

**Lòi ra thế nào.** Truy nguồn gốc MD-01: ai sinh ra tier-2 kiểu v3. Header
`autocontent/docs/design/design-tokens/globals.css` ghi "Generated by
`ck:design-system` v1.1.0". Đi tìm nó.

**Không tìm thấy.** Quét 4 chỗ:

| Nơi | `ck-design-system` | `ck-brand-guidelines` |
|---|---|---|
| `RenoAI-Labs/claudekit` (toàn cây) | không có | không có |
| `~/.claude/skills` (91 skill) | không có | không có |
| `~/.claude/agents` | không có | không có |
| `~/.claude/commands`, `plugins` | không có | không có |

`autocontent/docs/WORKFLOW.md:95` bước 1.10 ghi engine là
`ck-brand-guidelines` -> `ck-design-system` . `ui-styling`. **Hai trong ba engine
không tồn tại.**

**`ckm:design` KHÔNG phải bản đổi tên.** Đã kiểm: skill `design` của claudekit tên
thật `ckm:design` v2.1.0, các mục là Logo Design, CIP Design, Slides, Banner Design,
Icon Design, Social Photos. Nó sinh ảnh nhận diện thương hiệu, **không sinh
`globals.css` hay cấu hình Tailwind**. Khác việc, không phải đổi tên.

**Engine duy nhất còn tồn tại là `ui-styling`, và nó không chốt bản.**
`~/.claude/skills/ui-styling/SKILL.md` dòng 192 dạy `@theme` (cú pháp v4), dòng 226
lại dạy "Generate tailwind.config.js" (v3). `references/tailwind-customization.md`
có cả hai. Agent đọc skill này có thể ra v3 hoặc v4 tuỳ nó bắt vào đoạn nào.

**Vì sao nghiêm trọng.** Hai hệ quả, cả hai đều im lặng:

1. Agent chạy 1.10 ở dự án sau không tìm ra engine, tự làm kiểu khác. Không có gì báo.
2. Tier-2 sinh ra có thể lại là v3 -> **MD-01 tái phát ở mọi dự án mới**. Gate 2.0
   sẽ bắt được, nhưng bắt ở triệu chứng, và mỗi dự án phải port một lần.

**Chưa sửa.** Bước 1.10 thuộc Macro 1, operator dặn không đụng. Chỉ ghi nhận.

**Đề xuất khi được phép sửa:**
- kiểm cơ học "mọi engine `WORKFLOW.md` gọi tên đều tồn tại trong bộ skill đang cài" -
  cùng loại với MD-03 (tham chiếu treo), gộp làm một gate
- chốt bản Tailwind ngay trong bước 1.10, hoặc sửa `ui-styling` bỏ phần v3
- tìm lại `ck-design-system` (khả năng ở máy Nghĩa, cùng chỗ `vibecode-harness`),
  hoặc bỏ hẳn nó khỏi bảng nếu không còn dùng

## Gate `dangling-refs` - đóng MD-03 và MD-04, đo được MD-05

`scripts/check-dangling-refs.mjs`. Hỏi một câu: mọi thứ **bảng quy trình** gọi tên
có tồn tại thật không. Soi cột Playbook / Gate / Mẫu tài liệu / Script / Engine,
cộng link tương đối trong chính file đó.

**Phạm vi hẹp là có ý.** Bản đầu quét mọi backtick trong mọi file markdown và ra
**418** kết quả - phần lớn là báo cáo cũ trong `plans/` và tên artifact mà *dự án*
sinh ra (`VISION_SCOPE.md`, `tokens.css`, `vi.json`), harness không có là đúng.
Gate ồn thì không ai đọc. Thu về đúng chỗ đẻ ra MD-03/04/05 còn **23**.

Bốn lỗi của chính gate, tìm ra bằng cách chạy thật rồi soi từng dòng:
- đường dẫn `docs/...` trong tài liệu là tính từ **gốc repo**, không phải từ vị trí
  file. Chỉ thử một gốc thì báo oan 20 link.
- `.harness/` và `.claude/` là thư mục ẩn nhưng **chính là nơi chứa script + lệnh**
  harness gọi tên. Bỏ qua chúng thì báo oan 6 script.
- glob (`check-*.mjs`), slash-command (`/build-phase`), placeholder (`<slug>`),
  hằng (`IMAGE_TAG`) không phải đường dẫn.
- "treo" phải nghĩa là **không có ở đâu cả**. File có thật nhưng nằm sai thư mục
  chỉ là cảnh báo, không chặn.

**Chạy trong dự án, không phải trong harness.** Trong harness, mọi đường dẫn output
của dự án đều treo và đó là đúng. Chỉ khi chạy ở repo dự án, nơi harness asset và
artifact dự án cùng tồn tại, con số mới có nghĩa.

### Kết quả chạy trên autocontent

23 tham chiếu treo:

| Loại | Số | Đáng chú ý |
|---|---|---|
| engine | **17** | `ck-tech-design`, `ck-ux-design`, `ck-uat`, `ck-qa`, `ck-signoff`, `ck-seed`, `ck-e2e-flow`, `ck-handover`, `ck-hypercare`, `ck-prod-readiness`, `ck-rri`, `ck-intake-file`, `ck-bien-ban`, `ck-brand-guidelines`, `ck-design-system`, `ck-scope-confirmation`, `ck-client-prep-checklist` |
| gate | 2 | `audit_placeholders.py`, `extract_scope_boundary.py` |
| link | 3 | `docs/bao-gia/02-dieu-khoan-bao-hanh.md`, `scripts/export-client-bundle.sh` |
| script | 1 | `ship-and-verify.sh` -> MD-06 |

Chỉ **9** skill `ck-*` tồn tại thật: `ck-autoresearch`, `ck-code-review`, `ck-debug`,
`ck-graphify`, `ck-loop`, `ck-plan`, `ck-predict`, `ck-scenario`, `ck-security`.

**Chặn ngay trước mắt:** bước **2.1** (đóng băng ERD) - chỗ autocontent đang đứng -
gọi `ck-tech-design`, không tồn tại. Bước 2.2 cũng vậy.

## MD-07 - macro-2 không nói cách đọc prototype

**Lòi ra thế nào.** Thử đọc board `AutoContent Prototype` hai đường.

Qua MCP Claude Design: kết nối được (`canEdit: true`), liệt kê được 90+ file, nhưng
`get_file` có **ngưỡng cứng 256 KiB**. Board 2.24 MB nên trả về `truncated: true`,
đúng 262,144 byte = **11.7%**, cắt giữa chuỗi base64. Bóc hết ảnh ra thì markup vẫn
**1,431,017 ký tự**, gấp 5.5 lần ngưỡng. Không lần đọc nào lấy trọn được.

Qua clone local: đọc đủ. 2,242,107 byte, đóng `</html>`, 3 zone / 121 frame / 52 màn.

**Clone có trung thực với board không - đã kiểm, không đoán.** So byte-với-byte
262,144 byte đầu: lệch ở byte 153,207. Nguyên nhân là board có thêm một
`data-comment-anchor="f23fdba937-a"` mà clone không có - dấu neo Claude Design gắn
khi ai đó để lại bình luận. Bỏ đúng thuộc tính đó ra thì **257,677 ký tự đầu giống
hệt nhau**. Clone trung thực; drift duy nhất là metadata bình luận, không phải nội
dung thiết kế.

**Vấn đề thật.** `macro-2.md` ghi "Giao diện <- prototype đã freeze" mà không nói đọc
kiểu gì. Agent ở 2.6 đọc câu đó rồi mở `index.html` là nuốt 2.17 triệu ký tự - vỡ
ngân sách context (subagent ~200K token). Vỡ context thì agent bịa. Cùng họ với
MD-03/04/05: harness gọi tên một thứ, không nói cách tới nó, và không có gì báo.

**Đã sửa.**
- `scripts/extract-frame.mjs`: `--list` in mục lục 121 frame; `sNN` lấy một frame;
  `NN` lấy mọi state của một màn; `--trace` chỉ lấy route + floorplan + REQ-ID + UC
  + CR; ảnh base64 mặc định thay bằng chỗ giữ chỗ.
  Một frame **7.5K-17K ký tự** so với 2.17M cả file - chênh hơn 100 lần.
- `macro-2.md` mục "Nguồn nội dung issue": thêm luật đọc theo frame, và chốt
  **board trên Claude Design là chỉ đọc** (board sửa được nên không được làm mốc
  so fidelity; mốc là clone trong repo).

Test thật: `--list` ra đúng 121 frame / 3 zone; `s08a --trace` trả về
`APP · 08 · /app · Overview Page · ... · RPT.DASH.01/.02 · UC-21 · §4.4 card dashboard`;
`18 --trace` trả về đúng 4 state của màn Campaign timeline.

## MD-08 - macro-2 không đối chiếu ma trận component với thư viện UI

**Lòi ra thế nào.** Operator hỏi thẳng: gắn reno-ui vào rồi thì prototype có dựng
được không, hay thiếu component. Không ai trả lời được, vì không có bước nào đo.

Thử đoán bằng khớp tên tự động: 43 khớp / 36 không. **Con số 36 đó sai.** "Toast"
thực ra là `sonner`, "Destructive confirm" là `alert-dialog`, "Wizard" là `stepper`,
"Filter bar / facets" là `data-grid-toolbar` + `combobox`. Khớp tên không đo được
độ phủ - phải đọc mô tả từng component.

**Đo thật, 79 dòng x 60 component:**

| Loại | Số |
|---|---|
| trực tiếp | 31 |
| ghép | 44 |
| **thiếu thật** | **3** |
| N/A (trang public custom 100%) | 1 |

Ba cái thiếu ở autocontent: `File upload`, `Audio player`, `Number / quantity stepper`
(`stepper` của reno là **chỉ báo bước wizard**, không phải ô nhập số - đọc mô tả mới
biết, đọc tên thì nhầm).

**32 component domain KHÔNG phải thiếu.** Chúng vốn là phần riêng của dự án, ghép từ
primitive. Một thư viện dùng chung mà có `Payment panel (SePay/VietQR)` thì dự án sau
phải mang theo nghiệp vụ của dự án này.

**Vì sao phải đo ở 2.0, không phải 2.6.** Ba lỗ hổng kia nếu phát hiện lúc đang code
phase thì màn đã dựng theo cách khác rồi, và người code sẽ tự viết component trong
`src/components/` - lần sync thư viện sau ghi đè mất, đúng cái MD-02 cấm.

**Đã sửa.** Bước 2.0 thêm việc ánh xạ + gate `component-mapping` *(người phán)*.
"Xong khi": mọi dòng ma trận đã phân loại trực tiếp/ghép/thiếu, và **mỗi cái thiếu
đã có PR lên thư viện gốc** - không được vá trong dự án.

Bảng của autocontent: `docs/design/component-mapping-reno-ui.md`, commit `8c711b9`.

**Ghi thêm, vì dễ tái phát:** đọc `data-grid.tsx` (288 dòng) thấy 0 dấu hiệu
`editable`/`onCellEdit`/`isEditing`. Mô tả trong `registry.json` không nói có hay
không. Ánh xạ chỉ đáng tin khi mở code, không phải khi đọc mô tả.

## MD-09 - script harness chỉ chạy trên Linux

**Lòi ra thế nào.** Operator export board rồi định chạy `ingest-archive.sh` trên Mac.

```
find "$TMP" -maxdepth 3 -name index.html -printf '%h\n'   -> macOS find không có -printf
sz=$(stat -c%s index.html)                                -> stat: illegal option -- c
```

`prune-unreferenced-uploads.sh` dính đúng lỗi `stat -c%s`. Cả hai chạy tốt trên VPS
suốt, nên không ai biết.

**Đã sửa ở dự án** (`autocontent@5da84a2`): `dirname $(find ... | head -1)` và `wc -c`.
Test đầu-cuối trên macOS bằng zip giả - unpack đúng, bỏ đúng bộ repo-canonical, guard
262,144 byte vẫn chặn.

**Harness còn nợ một luật:** script harness phải chạy được trên **cả Linux lẫn macOS**.
Team đang chuyển sang Mac; mỗi script viết bằng GNU-ism là một lần vấp. Rẻ nhất là
ghi vào `CONTRIBUTING`/`docs/about/` một dòng cấm `find -printf`, `stat -c`, `sed -i`
không hậu tố, `date -d`, `readlink -f`.

## MD-10 - PB-G3 và PB-G4 đảo nghĩa giữa harness và dự án

Không phải lỗi đặt tên. **Đảo thứ tự nghiệp vụ.**

| | PB-G3 | PB-G4 |
|---|---|---|
| **loop-harness** `macro-1.md` *(đã xoá 2026-09-05)* | 1.13 chốt prototype (khách duyệt) | 1.15 hợp đồng + đặt cọc |
| **autocontent** `WORKFLOW.md` | 1.14 contract + deposit *(money hard line)* | 1.15 review loop -> freeze *(EXIT)* |

harness ghi thẳng: *"prototype chốt TRƯỚC báo giá"*.
autocontent ghi ngược: *"loop (1.15) starts only after PB-G3 (no unpaid deep design iteration)"* - tức **cọc trước, rồi mới lặp thiết kế sâu**.

Hai câu trả lời trái nhau cho cùng một câu hỏi kinh doanh: có làm thiết kế sâu trước
khi khách trả tiền không.

**Không chặn lượt này** - autocontent đã bắn cả G3 lẫn G4 rồi. Nhưng:
- điều kiện vào Macro 2 ghi *"Entry: PB-G3 passed and PB-G4 passed"*, người đọc không
  biết G3 là cái nào
- dự án sau cài harness sẽ chạy theo thứ tự ngược với autocontent
- tên file cũng đảo: harness có `pb-g3-prototype-frozen.md` + `pb-g4-contract-deposit.md`,
  autocontent có `pb-g3-contract-deposit.md` + `pb-g4-prototype-frozen.md`

**Cần operator chốt một thứ tự.** Đây là quyết định kinh doanh, không phải kỹ thuật -
không tự quyết được.

### MD-10 - đã sửa (2026-09-05): cắt Macro 1 và Macro 3 khỏi loop-harness

Operator chốt: loop-harness chỉ là bộ **tượng trưng** cho Macro 2; bộ chạy thật của
autocontent bootstrap từ `vibecode-harness`. Giữ hai định nghĩa Macro 1 song song là
mời người đọc chọn nhầm ở đúng chỗ nặng nhất - thứ tự tiền và thiết kế.

Đã làm:
- xoá `docs/process/macro-1.md`, `docs/process/macro-3.md`
- `docs/process/WORKFLOW.md` viết lại thành **macro-2 only**: 386 -> 268 dòng. Bỏ mục
  Macro-Stage 1, Macro-Stage 3, mục Lanes (lane chỉ quyết định Macro 1 nặng nhẹ, Macro 2
  chạy như nhau); Canonical Gate List bỏ hàng PB-G1..G4 và HANDOVER; Token Chain cắt
  phần thượng nguồn, bắt đầu từ REQ-ID mà Macro 1 của dự án giao xuống
- thêm mục **"Ranh giới - đọc trước"** nói thẳng: điều kiện VÀO (PB-G3/G4) và RA
  (handover, hypercare) do workflow của dự án định nghĩa; loop-harness chịu trách
  nhiệm từ 2.0 đến 2.13
- `README.md` và `loop.md` bỏ link tới hai file đã xoá

**Cách giải quyết mâu thuẫn: bỏ một bên, không hoà giải.** Bản của dự án thắng vì đó
là bản đang chạy thật. Nếu sau này cần một định nghĩa Macro 1 dùng chung thì viết mới,
đừng hồi sinh bản cũ.

**Lưu ý cho người đọc MD-05:** cắt Macro 1 khỏi loop-harness **không** đụng tới 22
engine `ck-*` treo - chúng nằm trong `autocontent/docs/WORKFLOW.md`, bootstrap từ
vibecode-harness ở commit `ba08c40`, đã có đủ 22 từ lúc clone `562f95c`. Hai việc khác
nhau, đừng nhầm là một.

**Hệ quả cho MD-05, đo lại sau khi cắt:** gate `dangling-refs` chạy trên loop-harness
rơi từ **20 engine treo xuống 7**. Bảy cái còn lại là engine THẬT SỰ của Macro 2:

`ck-tech-design` · `ck-seed` · `ck-e2e-flow` · `ck-qa` · `ck-signoff` · `ck-uat` · `ck-prod-readiness`

Mười cái kia (`ck-intake-file`, `ck-ux-design`, `ck-brand-guidelines`,
`ck-design-system`, `ck-scope-package`, `ck-rri`, `ck-handover`, `ck-hypercare`,
`ck-bien-ban`, `ck-client-prep-checklist`) thuộc Macro 1/3 và **không chặn lượt chạy
này**. MD-05 vì vậy hẹp hơn nhiều so với lúc ghi: cần lấp 7, không phải 17. Trong đó
`ck-tech-design` là cái duy nhất chặn cứng, vì 2.1 và 2.2 đều gọi nó.

## MD-05 - đã giải quyết (2026-09-05), và bài học không phải cái ta tưởng

Ghi ban đầu là "17 engine treo, `ck-tech-design` chặn cứng bước 2.1". Sai ở chỗ chưa
đọc kỹ chính cột Engine.

**Ba lần thu hẹp:**

| | Còn lại | Vì sao |
|---|---|---|
| ghi ban đầu | 17 | đếm thô mọi `ck-*` không có trong bộ skill |
| sau khi cắt Macro 1/3 khỏi loop-harness | 7 | 10 cái kia thuộc Macro 1/3, **không chặn lượt này** |
| sau khi đọc cột Engine | **0** | tên gộp, không phải skill thiếu |

**`ck-tech-design` không phải skill.** Cột Engine ghi thẳng chỉ dẫn trong ngoặc:

```
2.1   ck-tech-design (databases) + tech-graph
2.2   ck-tech-design + ck-predict
```

`ck:databases` ("Design schemas... database design, indexes, migrations", có
`db-design.md` riêng), `ck:tech-graph` ("production-quality SVG+PNG technical
diagrams - architecture, data flow"), `ck:predict` ("5 expert personas debate
proposed changes... architectural, security, performance") - **cả ba đều có trên
máy**. Người viết WORKFLOW đã lường trước; `ck-tech-design` chỉ là nhãn gộp.

Bốn engine còn lại cũng không chặn: 2.8 và 2.10 có playbook + script cơ học gánh;
2.12 là gate **khách ký**, người phán chứ không phải skill; 2.5 và 2.11 **đã bị gộp
mất**, không còn là bước.

**Bài học, và nó rộng hơn MD-05:** *một bước không nhất thiết cần skill.* Nó cần
**một trong ba**: script cơ học (kiểm được bằng máy), playbook (chỉ cách làm), hoặc
skill (chỉ khi cần năng lực agent không tự có). Skill là loại đắt nhất và ít cần
nhất. WORKFLOW gọi 22 engine mà chỉ 9 tồn tại, vậy mà gần như không bước nào bị chặn
thật - vì playbook và gate đã gánh. **Nhồi skill vào mọi bước chính là cách harness
phình lên mà chất lượng không tăng.**

Nguyên tắc đã ghi vào `autocontent/docs/WORKFLOW.md` dưới bảng Macro 2: ghi skill
thật khi bước cần năng lực chuyên biệt; ghi `—` khi playbook + gate đã đủ hoặc khi
người là người phán. Không bịa tên cho đủ cột.

**Còn lại, ngoài phạm vi:** 10 engine Macro 1/3 (`ck-intake-file`, `ck-ux-design`,
`ck-brand-guidelines`, `ck-design-system`, `ck-scope-confirmation`, `ck-rri`,
`ck-handover`, `ck-hypercare`, `ck-bien-ban`, `ck-client-prep-checklist`). Macro 1 đã
ra sản phẩm - SRS, prototype p1 v6, tier-2 token, feature-register đều nằm trong repo.
Skill là cái *làm ra* chúng; artifact tồn tại độc lập. Không có đường quay lại Macro 1
trong lượt này: CR giữa build vào lại ở **2.3** dưới dạng phase mới của manifest.
**Đừng mở lại mục này.**

## MD-11 - WORKFLOW.md của dự án lệch danh sách bước với macro-2.md

**Lòi ra thế nào.** Đang kiểm MD-05 thì thấy `/stage-next` ghi ở dòng 33:
*"advance per the `docs/WORKFLOW.md` order"* - tức thứ tự bước lấy từ file của **dự
án**, không phải từ spine của harness. So hai bên:

```
WORKFLOW.md   ... 2.4  2.5  2.6  2.7  2.8 ... 2.11 2.12 2.13   (14 bước)
macro-2.md    2.0  2.4       2.6       2.8 ...      2.12 2.13   (12 bước)
```

`macro-2.md` ghi *"Refactor 2026-09-01: gộp 2.5→2.4, 2.7→2.10, 2.11→2.13"*, nhưng
`WORKFLOW.md` của dự án chưa biết chuyện đó.

**Vì sao nghiêm trọng.** Hai hậu quả, cả hai đều im lặng:
1. **Bước 2.0 không bao giờ chạy.** Hai gate `tier2-ui-compat` + `dangling-refs` và
   bảng ánh xạ 79 component vừa dựng xong sẽ bị bỏ qua sạch - cài vào một bước mà bộ
   điều phối không đọc tới.
2. **2.5, 2.7, 2.11 chạy vào chỗ trống** - WORKFLOW bảo chạy, spine không có dòng nào,
   agent không có hướng dẫn.

Đây là loại lỗi tệ nhất trong cả sổ này: **không phải thiếu thứ gì, mà là hai nguồn
sự thật cùng tồn tại và không ai đối chiếu.** Cùng họ với MD-10 (PB-G3/G4 đảo nghĩa).

**Đã sửa** (`autocontent@1b47053`): đồng bộ khối Macro 2 trong `WORKFLOW.md` - thêm
2.0, gộp 2.5/2.7/2.11, dọn số hiệu cũ ở TL;DR và danh sách gate điều kiện, viết lại
cột Engine bỏ tên gộp. Danh sách bước hai bên nay khớp hoàn toàn.

**Luật rút ra cho harness:** khi spine đổi danh sách bước, **phải re-propagate xuống
`WORKFLOW.md` của mọi dự án đang chạy** - đó là file `/stage-next` đọc. Sửa spine mà
không đồng bộ xuống thì thay đổi không có hiệu lực, và tệ hơn là không có gì báo.

## MD-06 - đã sửa (2026-09-05): installer không nhúng bộ steady-state

**Ghi ban đầu sai một chữ số.** Tưởng thiếu **1** script (`ship-and-verify.sh`), hoá
ra thiếu **cả 5**:

```
ship-and-verify.sh   new-issue.mjs   issue-state.mjs   qc-checklist.mjs   push-retry.sh
```

Cả năm nằm trong `scaffolds/steady-state/`, mà `install-harness.sh` chỉ nhúng
`scaffolds/stack-pnpm-nest-next`. Nghĩa là **mọi dự án installer từng cài đều gọi tên
năm script này trong workflow và không có cái nào** - im lặng, suốt từ đầu.

**Vì sao gate chỉ bắt được 1/5.** `dangling-refs` soi **cột bảng quy trình**;
`ship-and-verify.sh` nằm ở cột Script của bước 2.13 nên bị bắt. Bốn cái kia chỉ xuất
hiện trong **văn xuôi** (mục "Nguồn nội dung issue"), mà gate cố ý không soi văn xuôi
- nhắc tên một thứ không phải là trỏ tới nó. Đây là giới hạn đã biết của gate, không
phải lỗi: nới ra là quay lại 418 kết quả nhiễu. Bù bằng việc người đọc kiểm khi cài.

**Đã sửa.** `install-harness.sh` thêm `copy_steady_state_kit()` đặt cạnh
`copy_stack_template()`, cùng luật sở hữu: `.harness/` là của harness, wipe wholesale
mỗi lần (re)install. Đích: `.harness/steady-state/`. Test riêng hàm: 7 file, script
`.sh` có quyền thực thi.

autocontent đã áp tay (không chạy lại được installer trên dự án đang chạy). Gate sau
đó: **15 -> 14 tham chiếu treo, loại `script` biến mất hoàn toàn.**

**Phát hiện phụ, chưa sửa:** `install-harness.sh` **không chạy được headless** - kể cả
với `--dry-run` nó vẫn chạm `/dev/tty` (dòng 118), nên trong job nền hoặc CI là chết
với `Device not configured`. `can_prompt()` có kiểm `[ -r /dev/tty ]` nhưng trên macOS
điều kiện đó đúng trong khi mở file lại lỗi. Việc này chặn mọi ý định chạy installer
tự động. Ghi lại, chưa xử vì không cản lượt chạy hiện tại.

### MD-02 - phần còn nợ đã xong (2026-09-05): gate `ui-region-boundary`

`scaffolds/stack-pnpm-nest-next/scripts/check-ui-region-boundary.mjs`, gắn vào cột
Gate của **2.4** (lúc scaffold) và **2.6** (mỗi phase).

Ba luật, đúng ba vùng:

| Luật | Vùng | Chặn? |
|---|---|---|
| **A** không tự vẽ `<button>/<input>/<select>/<textarea>/<dialog>` | portal | ✅ chặn |
| **B** thư mục thư viện chỉ chứa mục có thật của registry | `libraryDir` | ✅ chặn |
| **C** quét màu cứng | public | ⚠️ chỉ cảnh báo |

Luật B là chỗ đáng giá nhất mà lint màu không với tới: một file tự viết lén vào
`components/ui/` sẽ **bị lần sync thư viện sau ghi đè mất, im lặng**. Gate đối chiếu
tên file với `registry.json` của thư viện nên bắt được ngay.

Opt-out từng dòng bằng comment `ui-ok: <lý do>` — cố ý bắt phải viết lý do, không cho
tắt cả file.

**Test trên cây giả, đủ bốn nhánh:**
- portal có `<button>` + `<input>` -> bắt 2 lỗi, đúng số dòng
- portal có `<button>` kèm `ui-ok:` -> bỏ qua, đúng
- `components/ui/my-custom-thing.tsx` không có trong registry -> bắt; `button.tsx` có
  trong registry -> bỏ qua
- public có `#0B1942` -> **cảnh báo**, không tính là lỗi; `<button>` ở public cũng
  không bị bắt, đúng vì public là custom 100%

**Hai nhánh fail-soft, đều báo rõ lý do chứ không im lặng xanh:** chưa scaffold (chưa
có `.tsx` nào) và chưa khai `uiRegions` trong `gate-config.json`.

`gate-config.json` thêm khối `uiRegions` với `public` / `portal` / `libraryDir` /
`registryFile` / `allowlist`, mặc định trỏ đúng cây `apps/web/src/app/(public)`,
`(app)`, `(admin)`.

## MD-12 - chỉ số gốc sai 60 điểm phần trăm vì lệch một ký tự tên file

**Lòi ra thế nào.** Đo 4 chỉ số gốc trước khi chạy Macro 2. `rtm-status` báo:

```
629 REQ-ID · register 0% · test 0% · issue 0% · prototype-frozen 0%
```

`register 0%` vô lý: autocontent đã đóng băng feature-register từ PB-G2. Đi tìm.

**Nguyên nhân.** Script đọc `docs/scope-baseline/feature-register.source.json`
(dấu **chấm**), dự án có `docs/scope-baseline/feature-register-source.json` (dấu
**gạch ngang**). Lệch đúng một ký tự.

**Số thật sau khi trỏ đúng:**

```
629 REQ-ID · register 60% · test 0% · issue 0% · prototype-frozen 56%
```

**Vì sao đây là chuyện lớn.** Nếu chạy Macro 2 mà không đo trước, mốc gốc ghi lại
sẽ là **0%**. Cuối lượt đo lại được 60% thì **60 điểm phần trăm đó là giả** - nó
vốn đã có từ Macro 1, không phải do Macro 2 làm ra. Cả phép đo "60% -> 99%" mà lượt
chạy này sinh ra để chứng minh sẽ sai ngay từ số đầu tiên.

Đây chính là lý do phải đo mốc gốc **trước** khi chạy, chứ không đo sau rồi suy ngược.

**Đã sửa.** `rtm-status.mjs` nhận cả hai cách đặt tên (thử `.source.json` trước, rồi
`-source.json`), vẫn ưu tiên `cfg.registerJson` nếu dự án khai. Không đổi tên artifact
của Macro 1 - đó là vùng đã đóng băng, và đổi tên file là việc rủi ro hơn nhận hai tên.

**Chưa rõ, để lại:** `prototype-frozen 56%` nghĩa là 44% REQ-ID chưa map được sang
phase đã freeze. Có thể đúng (Phase 1 không phủ hết scope) hoặc lại là một lệch map
nữa. Chưa đủ dữ kiện để kết luận; ghi lại để 2.3 khi dựng build-manifest thì đối chiếu.

## MD-13 - `core.hooksPath` không đi theo clone, gate tắt câm

`.githooks/pre-commit` gọi `scripts/harness-verify-gate.sh` - cổng fail-closed của
harness. Nhưng lệnh bật nó là `git config core.hooksPath .githooks`, ghi vào
`.git/config`, mà file đó **không nằm trong repo**. Clone autocontent về Mac là mất.

Đo được: `core.hooksPath` chưa set. Nghĩa là **toàn bộ commit của phiên 2026-09-05
đều không qua gate nào**. Bật rồi chạy thử thì gate xanh (`verify` register clean ·
`design-system` all screens classified · `identity` claimed) - nên không phải gate
hỏng, mà là gate **không được gọi**.

`install-harness.sh` có set (dòng 811-812) nhưng chỉ lúc cài. Dự án clone lại là mất.

**Không sửa sạch được** - git thiết kế `.git/config` là per-clone, không có cách nào
làm nó đi theo repo. Ba lựa chọn, đều không kín:
- kiểm trong gate `dangling-refs` ở 2.0: chỉ bắt được nếu ai đó chạy 2.0
- hook `SessionStart` của `~/.claude`: chỉ giúp người có dotfiles đó, đồng nghiệp
  không có thì không thấy - và nó nhét luật dự án vào cấu hình per-máy, đúng cái
  "cưỡng chế bung ra" mà MD-10/MD-11 đã cho thấy hậu quả
- README: không ai đọc

Chọn cách một, chấp nhận không kín. Ghi ở đây để người sau biết là đã cân nhắc, không
phải bỏ sót.

## Chuẩn hoá cấu trúc macro-2 (2026-09-05)

Không phải delta - đây là hệ quả rút từ MD-03, 04, 05, 06, 10, 11. Sáu delta đó cùng
một hình dạng: **bảng cho phép ghi một cái tên mà không ai kiểm**, hoặc **hai nơi cùng
mô tả một thứ**.

Đã làm:

1. **Luật 4 ô** vào đầu `macro-2.md`: VÀO / RA / GATE / ENGINE, cả 4 máy kiểm được.
   Cột GATE bắt buộc có **thời điểm** (`@một-lần` · `@mỗi-phase` · `@pre-commit` ·
   `@pre-push`) - không có thời điểm thì gate nằm đó không ai gọi.
2. **Luật bất biến**: mọi file trong `playbooks/`, `gates/`, `mau-tai-lieu/` phải được
   bảng gọi tên. Không được gọi = không thuộc repo này.
3. **Gate `dangling-refs` hai chiều**. Chiều xuôi đã có (tên -> file). Thêm chiều ngược
   (file -> tên). Một chiều thì repo tích tụ đồ mồ côi mà không ai biết.
4. **Dọn theo kết quả gate**: 24 file mồ côi -> giữ 4, xoá 20.
   - giữ + thêm vào bảng: `feature-issue-ac-demo-standard` và `github-issue-standard`
     (2.3, cả hai `verified` ở elearning), `payment-integration` (2.6, autocontent có
     SePay/VietQR), `change-request-log` (2.3, CR vào lại dưới dạng phase mới)
   - xoá: 17 file của Macro 1/3 (loop-harness không còn sở hữu sau khi cắt), 2 mẫu meta
     (`lessons-log`, `process-annex`), 1 playbook `patch-extension-protocol` -
     `experimental`, *"First use: TBD, Verified by: none"*, chưa ai dùng
5. **Sửa cột Engine của `WORKFLOW.md`** giống bên autocontent: bỏ 7 tên gộp không tồn
   tại, ghi skill thật hoặc `—`.

Kết quả gate: **33 -> 2 tham chiếu treo, 0 file mồ côi.** Hai cái còn lại là
`docs/build-manifest.md` và `docs/ROADMAP.md` - đường dẫn output của dự án, harness
không có là đúng.

**Cấm thêm cột.** Nâng cấp phải rơi vào 1 trong 4 ô, hoặc thành delta chờ.
