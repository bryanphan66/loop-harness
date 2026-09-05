# Macro-2 deltas - sổ ghi thay đổi harness, phát hiện từ dự án thật

> Macro-2 đang là bản thử nghiệm. Chạy dự án thật để tìm chỗ thiếu, rồi chốt version.
> File này là chỗ DUY NHẤT ghi các thay đổi đó. Không ghi vào ledger của dự án:
> ledger `autonomous-decision-ledger.md` là quyết định CỦA DỰ ÁN, delta là thay đổi
> CỦA HARNESS, dự án sau cũng phải đọc.

## Cách dùng

**Ghim version trước khi chạy.** Đặt tag git `macro-2-v0.1` lúc bắt đầu một lượt chạy
thật. **Đã ghim 2026-09-05** tại `4c473ac`, trước lượt chạy đầu trên autocontent -
`git show macro-2-v0.1` liệt kê đúng những gì bản này gồm và những gì chưa từng chạy thử. Không ghim thì cuối lượt không ai biết kết quả do bản nào tạo ra, và con số của
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

| MD-14 | autocontent, ngay trước khi chạy | soát `STAGE_GOALS.md` sau khi đồng bộ WORKFLOW | **nguồn sự thật thứ ba** cũng lệch: chỉ 2/12 bước có goal text (2.12, 2.13), còn lại là một dòng kết bằng `*[next increment]*`; vẫn theo danh sách bước CŨ (có 2.5/2.7/2.11, không có 2.0) | viết goal text cho các bước sắp chạy | **mở** |

| MD-15 | so scaffold với elearning trước khi chạy | đối chiếu cây thư mục hai bên | scaffold có 3 Dockerfile nhưng **không có `.dockerignore`**; thiếu 4 script mà elearning đã dùng thật | thêm `.dockerignore` ngay; 4 script chờ đúng bước | **đã sửa một phần** |

| MD-16 | operator soát sau MD-15 | *"đã bảo dựa vào elearning để học hỏi thì đương nhiên chọn Kamal"* + `STAGE_GOALS` vẫn còn Macro 1/3 | tôi cắt Macro 1/3 khỏi `WORKFLOW.md` và `macro-2.md` nhưng **quên `STAGE_GOALS.md`** - để lại đúng bẫy MD-10/MD-11; và bỏ Kamal vì cho là "elearning tự chọn" trong khi nó là chuẩn đã qua thử lửa | cắt STAGE_GOALS còn Macro 2 + mang chuẩn Kamal vào scaffold | **đã sửa** |

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

## MD-14 - `STAGE_GOALS.md` là nguồn sự thật thứ ba, cũng lệch

MD-11 sửa lệch giữa `WORKFLOW.md` và `macro-2.md`. Soát tiếp thì `STAGE_GOALS.md`
cũng lệch, theo đúng kiểu đó.

```
block "### Step 2.x" đầy đủ:  2  (chỉ 2.12 và 2.13)
2.1 -> 2.11:                  một dòng, kết bằng *[next increment]*
danh sách bước:               CŨ - còn 2.5 / 2.7 / 2.11, KHÔNG có 2.0
```

Chính file đó tự khai: *"The full `/goal` text for 2.1-2.11 is built in the next
macro-stage increment"*.

**Vì sao quan trọng.** `/stage-next` ghi: *"Prefer the `## Step <id>` block in
`docs/STAGE_GOALS.md` if it exists. Otherwise extract the step's row intent from
`docs/WORKFLOW.md`"*. Với 2.0 đến 2.10 thì không có block, nên nó rơi xuống đọc **một
ô bảng**. Agent nhận một dòng thay vì một mục tiêu.

Đây là lần thứ ba cùng một hình dạng: MD-10 (PB-G3/G4), MD-11 (danh sách bước),
MD-14 (goal text). **Ba file cùng mô tả một quy trình thì sẽ lệch** - luật 4 ô và gate
hai chiều chặn được chiều "gọi tên thứ không có", nhưng không chặn được chiều "ba file
cùng nói một chuyện".

**Đề nghị, chống phình:** viết goal text cho **2.0, 2.1, 2.2, 2.3** thôi - đúng những
bước sắp chạy. Không viết 2.4-2.10 trước. Lý do: lượt chạy này sinh ra để rút kinh
nghiệm; viết goal cho bước chưa chạy là đoán, và đoán xong thì phải sửa lại, đó chính
là chắp vá. Viết tới đâu chạy tới đó.

**Chưa sửa** - cần phán đoán nghiệp vụ, không tự quyết.

## MD-15 - scaffold thiếu vài thứ elearning đã có và đã dùng thật

Operator hỏi: cấu trúc sườn scaffold có nên tham khảo elearning không, vì bên đó khởi
tạo khá ổn. Đối chiếu cây thư mục hai bên.

**Phần lớn "elearning có mà scaffold không" là đồ của harness, không phải của scaffold:**
`.claude`, `.githooks`, `AGENTS.md`, `CLAUDE.md`, `docs/`, `plans/`, `STAGE.md` -
`install-harness.sh` mang xuống. `harness-verify-gate.sh`, `install-harness.sh`,
`new-issue.mjs`, `issue-state.mjs`, `qc-checklist.mjs`, `push-retry.sh`,
`ship-and-verify.sh` - đến từ skeleton + bộ steady-state (MD-06). Không phải lỗ.

**Lỗ thật, đã sửa ngay:**

`.dockerignore` **không có** trong scaffold, trong khi scaffold có đủ **3 Dockerfile**
(`apps/web`, `apps/api`, `apps/worker`) - y hệt elearning. Thiếu nó thì mỗi lần đóng gói
image gửi cả `node_modules`, `.next`, `.git` sang daemon: chậm và phình image. Đã thêm,
lấy từ elearning (dự án đang live staging) và mở rộng thêm `dist`, `.turbo`, `coverage`,
`playwright-report`, `test-results`, giữ `.env.example`.

**Lỗ thật, chờ đúng bước - cố ý không thêm bây giờ:**

| Script | elearning dùng ở | Chờ tới |
|---|---|---|
| `restore-drill.sh` | diễn tập khôi phục | **2.13** - gate nhắc DR + RTO/RPO, runbook `backup-restore-drill.md` đã có nhưng không có script |
| `gen-user-guide-index.mjs` | mục lục HDSD | **2.8** - bước sinh user manual |
| `compute-beta-version.mjs` + `test-compute-version.mjs` | đánh version bản beta | **2.13** - release |
| `fetch-prototype-media.sh` | kéo media từ prototype | **2.6** - fidelity |

Lý do chờ: bốn cái này gắn với một bước cụ thể. Thêm bây giờ là **nhét vào scaffold thứ
chưa ai gọi tới** - đúng cái luật bất biến vừa dựng để cấm, và đúng cách 24 file mồ côi
đã tích tụ. Khi chạy tới bước đó mà thấy cần thì mang sang, kèm một dòng delta.

**Không mang sang:** `dev.sh` + `docker-compose.dev.yml` (tiện dụng khi chạy nhiều dự án
một máy, không phải gate), `.kamal` (elearning chọn Kamal; scaffold để 2.4 tự quyết nơi
triển khai), `config/`, `demo/` (nghiệp vụ riêng elearning).

## MD-16 - hai chỗ tôi làm chưa tới, operator bắt được

**1. `STAGE_GOALS.md` vẫn còn cả ba macro.**

Cắt Macro 1/3 khỏi `macro-1.md`, `macro-3.md`, `WORKFLOW.md` (MD-10) nhưng quên
`STAGE_GOALS.md`. Kết quả: `WORKFLOW.md` còn 1 macro, `STAGE_GOALS.md` còn 3 -
**đúng cái bẫy MD-10 và MD-11 vừa dựng luật để cấm**, do chính tôi để lại.

Đã cắt: **922 -> 468 dòng**, còn 15 block Step 2.x, 0 block Macro 1/3.

**2. Bỏ Kamal là sai.**

MD-15 tôi ghi *"`.kamal` - elearning chọn Kamal; scaffold để 2.4 tự quyết nơi triển
khai"*. Operator bác: đã lấy elearning làm chuẩn để học thì Kamal chính là cái phải
học - nó **đã chạy live staging thật**, không phải lựa chọn trên giấy.

Đã mang vào scaffold:
- `config/deploy.yml` (87 dòng) - cắt từ elearning, thay giá trị riêng bằng
  `__PROJECT_SLUG__` và `TODO`. Giữ nguyên phần đáng giá: proxy SSL + healthcheck,
  registry cache `mode=max`, `env.clear.COMMIT_SHA` nhúng commit (2.13 đọc lại để
  kiểm at-source), accessories postgres + redis khớp `docker-compose.yml` của scaffold.
- `.kamal/secrets-common` (18 dòng) - kèm nguyên bài học: với `-d <destination>` Kamal
  đọc `secrets-common` và **bỏ qua** `.kamal/secrets` phẳng; đặt nhầm ra
  *"Secret 'KAMAL_REGISTRY_PASSWORD' not found"*. elearning mất một vòng để tìm ra.
- `macro-2.md` thêm mục "Triển khai: Kamal", cột Mẫu tài liệu của 2.4 thêm
  `config/deploy.yml`.

**Vẫn không mang workflow deploy** (611 dòng): nó phụ thuộc destination, registry và
quy ước tag của từng dự án. Ghi rõ trong `macro-2.md` là chép từ
`elearning-platform/.github/workflows/deploy.yml` ở 2.4, đừng dựng lại từ đầu. Đây
không phải né việc - đây là ranh giới giữa **chuẩn** (mô tả deploy thế nào, mang vào)
và **pipeline cụ thể** (deploy đi đâu, để dự án quyết ở 2.4).

---

## MD-17 - scaffold không hề biết thư viện UI tồn tại

Operator hỏi trước khi chạy: đã đảm bảo dự án dùng 100% component từ repo thư viện
chưa. Đi soi thì câu trả lời là **chưa, và không có đường nào để làm**.

```
grep -r "reno-ui|ui.reno.ai.vn|shadcn" scaffolds/stack-pnpm-nest-next/  ->  0 kết quả
apps/web/components.json                                               ->  không có
gate-config.json  "registryFile": ""                                   ->  luật B TẮT
goal-text 2.4                                                          ->  không nhắc registry
apps/web/src/components/ui/{button,card,dialog,input,table}.tsx         ->  TỰ VIẾT
```

Chạy 2.4 như cũ thì agent dựng dự án có sẵn 5 primitive tự viết, thấy đủ dùng, và code
tiếp trên đó. Hai tuần nữa thư viện lên v2 thì **không sync được** - đúng thứ operator
muốn tránh.

**Đã sửa - scaffold nối thẳng vào registry:**

| việc | chi tiết |
|---|---|
| xoá 5 primitive tự viết | `button` `card` `dialog` `input` `table` - đối chiếu trước: cả 5 có trong registry, mọi symbol dùng ở scaffold (`DialogFooter`, `TableHead`, `CardAction`...) đều được export, variant `destructive`/`ghost`/`outline` đều có |
| `form-field.tsx` chuyển ra `components/forms/` | không phải mục registry - để trong thư mục thư viện là sai ranh giới, và luật B sẽ bắt |
| `button.test.tsx` chuyển ra `components/__tests__/` | + gate bỏ qua `*.test.tsx`/`*.spec.tsx` trong thư mục thư viện (luật B trước đó soi cả file test, stem `button.test` không phải tên registry) |
| `apps/web/components.json` | khai namespace `@reno` |
| `apps/web/reno-ui.manifest.json` | danh sách component dự án dùng |
| `scripts/ui-sync.mjs` | `ui:sync` cài, `--add` thêm, `--check` soi lệch. Ghi `reno-registry.lock.json` để gate đối chiếu **offline** |
| `gate-config.json` | `registryFile` trỏ lock -> **luật B bật** |
| `globals.css` | 16 dòng cắm 7 màu cứng -> khung tier-2 rỗng, `ui:sync` cài `@reno/theme-base` vào đó |
| `lint:gates` | `ui:check` đứng **đầu chuỗi** |
| goal-text 2.4 | 3 ràng buộc + đối chiếu bảng mapping của 2.0 |

**Đã thử thật, không phải viết ra rồi tin:** scaffold ra thư mục tạm, `pnpm install`,
`pnpm ui:sync` -> shadcn kéo 6 file vào `components/ui/`, cập nhật `lib/utils.ts`, chèn
`@theme inline` + `:root` + `.dark` vào `globals.css` (16 -> 453 dòng, 305 dòng token).
14 gate xanh, `ui-region-boundary` XANH, `ui:check` OK.

## MD-18 - registry của thư viện đang hỏng, và không ai biết

Cùng lúc thử MD-17, `pnpm typecheck` đỏ: `Cannot find module 'lucide-react'`. Hai lỗi
độc lập, cả hai chỉ lộ ra khi cài registry vào một dự án trắng:

**1. 7 item ship source import package mà không khai.** `command`, `context-menu`,
`dialog`, `dropdown-menu`, `sheet` (lucide-react), `alert`
(class-variance-authority), `date-picker` (react-day-picker). `shadcn add` chỉ cài thứ
item khai, nên dự án nhận source mà thiếu package rồi đỏ ngay lần typecheck đầu, trong
file nó không viết. Script `sync-item-deps.mjs` bên đó chỉ **ghim phiên bản** cho dep
đã khai - **chưa bao giờ đọc source**, nên không cái gì nhìn thấy được lỗ này.

**2. CI thư viện đỏ từ lúc merge 3 component mới -> site kẹt.** `/r/number-input.json`,
`/r/file-upload.json`, `/r/audio-player.json` trả **404**. Bảng mapping ở 2.0 ghi 3 dòng
`thiếu` đó là "đã bổ sung" - đúng trong repo, sai trên site. Hai nguyên nhân: trang
`/components` tràn ngang (mô tả item `form` có chuỗi 73 ký tự `Form/FormField/...` rộng
hơn thẻ card 358px, kéo giãn cột lưới) và demo audio nạp URL cố tình hỏng + CDN ngoài
(gate render đọc console error là trang lỗi).

Đã sửa ở repo thư viện (PR RenoAI-Labs/reno-ui#2), **không vá trong dự án** - đúng luật
"thiếu thì nâng ở gốc". `sync-item-deps.mjs` giờ đọc source của item và bổ sung cái nó
import, `--check` đỏ khi còn thiếu; bỏ qua thân comment (nếu không, doc block của
`code-editor` khai nhầm `@codemirror/lang-css`).

**Bài học cho harness:** bảng mapping ở 2.0 hỏi "thư viện có component này không" nhưng
**không hỏi "cài xuống có chạy không"**. Một registry xanh trong repo của nó vẫn có thể
404 với người dùng. Bước 2.0 phải cài thử vào dự án trắng, không chỉ đọc `registry.json`.

## MD-19 - chạy xong thì lấy gì làm bằng chứng

Operator hỏi: chạy Macro 2 thì có gì để theo dõi, hay cứ thế mà chạy. Soi thì có
`STAGE.md`, commit ranh giới bước, 16 gate - nhưng gate chỉ báo đỏ/xanh **tại lúc chạy**,
không lưu lại; `docs/lessons-log.md` và `docs/runbooks` không tồn tại; mốc gốc 4 chỉ số
đo bằng lệnh gõ tay, lần sau không lặp lại được.

Tức là chạy hết 12 bước xong, thứ để sửa Macro 2 chỉ còn git log và trí nhớ.

**Đã thêm hai sổ:**

- `scripts/measure-macro2.mjs` -> `docs/macro2-run-log.md`. Chạy `rtm-status --json` và
  3 gate phủ với `GATE_ROOT` đúng, ghi một dòng. Đo ở 2.0 / 2.4 / 2.6 / 2.13.
  Kiểm chứng: chạy trên autocontent ra đúng mốc đã đo tay - `629 · 60% · 0% · 0% · 56%`.
- `docs/mau-tai-lieu/macro2-friction-log.md` -> chép thành `docs/macro2-friction-log.md`.
  Sáu loại ma sát (`goal-mo-ho`, `gate-sai`, `thieu-cong-cu`, `lam-tay`, `lap-lai`,
  `so-lech`), ghi **ngay lúc vướng**. Cuối lượt mỗi dòng thành một `MD-NN` hoặc bị đóng
  kèm lý do.

Cả hai cắm vào goal-text: mở ở 2.0, chốt ở 2.13.

## MD-20 - ba con trỏ bước trỏ vào bước đã bị gộp

Soi `STAGE_GOALS.md` khi cắm chỉ số đo:

```
2.4  kết bằng "Current = 2.5"   -> 2.5 đã gộp vào 2.4
2.6  kết bằng "Current = 2.7"   -> 2.7 đã gộp vào 2.10
2.10 kết bằng "Current = 2.11"  -> 2.11 đã gộp vào 2.13
```

Gộp bước ở MD-10/MD-11 nhưng quên con trỏ "bước kế tiếp" nằm ở **cuối thân mỗi block**,
không nằm trong bảng nên soát bảng không thấy. `/stage-next` đọc `STAGE.md` Current;
agent kết bước 2.4 sẽ ghi `2.5` rồi bước kế nhảy vào một block mở đầu bằng
*(FOLDED into 2.4)*. Đã sửa thành 2.6 / 2.8 / 2.12.

**Cùng loại, cùng lần:** `install-harness.sh` chỉ chép 3 file `scripts/*` cố định, nên
4 script mới (`measure-macro2`, `check-tier2-ui-compat`, `check-dangling-refs`,
`extract-frame`) chỉ có mặt trong autocontent vì **tôi chép tay**. Cài harness vào dự án
thứ hai là mất. Đã đưa cả 4 vào `SKELETON_PATHS`.

**Và một chỗ nữa cùng loại:** bảng bước của `WORKFLOW.md` liệt kê `2.1 ... 2.13` -
**không có 2.0**, trong khi `macro-2.md` và `STAGE_GOALS.md` đều có. Bước 2.0 sinh ra ở
MD-08 nhưng chỉ cắm vào hai trong ba file. Đã bù dòng 2.0 vào `WORKFLOW.md`.

**Luật rút ra:** thêm một script dự án phải chạy -> thêm vào `SKELETON_PATHS` **cùng
commit**. Gộp/xoá/thêm một bước -> soát **cả ba** file (`macro-2.md`, `STAGE_GOALS.md`,
`WORKFLOW.md`) và `grep "Current = "`, không chỉ soát một bảng.

## MD-21 - kiến thức về cách bung việc kẹt ở file vai trò, dự án không thấy

Operator hỏi: subagent, phiên nền, `claude -p` headless - ctl có sẵn rồi, sao không
research cho harness để khỏi vướng. Đi soi thì đúng: kiến thức **có**, nhưng nằm sai chỗ.

```
loop-harness/CLAUDE.md            có mục "Dispatch - cú pháp ĐÚNG (đã test)"
loop-harness/docs/about/*.md      6 file nhắc --bg / bypassPermissions, dạng chẩn đoán
autocontent/docs/about/           KHÔNG TỒN TẠI
```

`CLAUDE.md` là **file vai trò của ghế điều phối**, không phải tài liệu quy trình -
`install-harness.sh` không mang nó xuống dự án. `docs/about/` thì autocontent không có
vì nó cài từ nhánh harness khác (`.harness-provenance`: `/home/nghia/vibecode-harness`).
Kết quả: chạy Macro 2 trong autocontent là chạy **không có** kiến thức đó, và mỗi lần
đụng tới lại phải suy ra từ đầu - đúng lượt này tôi đã lo nhầm rằng 2.6 cần
`settings.local.json`.

**Kiểm chứng lại trên CLI 2.1.261 chứ không tin trí nhớ:**

| khẳng định cũ | kiểm | kết quả |
|---|---|---|
| `-p` xung đột `--bg` | chạy thật `claude -p --bg "…"` | **ĐÚNG** - CLI chặn: *"--print never starts the interactive session that `claude agents` attaches to, so the job would be unattachable"* |
| 2.6 cần `bypassPermissions` | đọc `.claude/commands/build-phase.md` | **SAI** - nó bung **subagent trong phiên** (`subagent_type: stage-runner`), không cần quyền gì thêm |
| chỉ có `bypassPermissions` cho worker nền | `claude --help` | **SAI** - có `--allowed-tools` / `--disallowed-tools`, tức là cấp đúng thứ cần. Đây chính là lỗ hổng `HARNESS_CHANGELOG.md` tự thừa nhận còn mở |
| cách ly song song phải tự dựng | `claude --help` | **SAI** - có `-w/--worktree` và `--tmux` sẵn |

Viết thành `docs/playbooks/dispatch-modes.md` (102 dòng): 4 chế độ + bảng chọn nhanh +
bảng triệu chứng -> nguyên nhân. Cắm vào cột Playbook của **2.6** trong `macro-2.md`
(không thì thành playbook mồ côi, đúng thứ luật chống phình cấm) và thêm mục ngắn ở
`macro-2.md`. `CLAUDE.md` giữ lại phần vận hành ghế điều phối, trỏ sang playbook.

**Luật rút ra:** kiến thức nào dự án cần lúc chạy thì phải nằm trong `docs/` mà
`install-harness.sh` mang xuống. Để trong `CLAUDE.md` là để cho **ghế điều phối** đọc,
không phải cho dự án - hai chỗ khác nhau, đừng nhầm.

---

## MD-22 - gate cho xanh giả, và công cụ đo chép cái xanh giả vào sổ bằng chứng

Lượt chạy thật bắt được ở 2.3. `check-manifest-coverage.mjs` tìm REQ-ID bằng cách đọc
dòng bảng có token `in-MVP` trong `feature-register.md`. Register của dự án viết **100%
tiếng Việt**, dùng "Đưa vào", và **không có cột REQ-ID nào** - REQ-ID nằm ở
`docs/requirements/srs/`. Kết quả:

```
0 REQ-ID đọc được  ->  so sánh 0 mục  ->  0 lỗi  ->  ✓ XANH
```

Rồi `measure-macro2.mjs` chép nguyên dòng đó vào `macro2-run-log.md` thành
*"xanh: 0 in-scope REQ-ID(s) each covered by exactly one phase"*. **Công cụ dựng ra để
làm bằng chứng lại ghi một con số giả vào sổ.** Đúng lỗi MD-12, lần thứ ba trong repo này.

Đã sửa, ba lớp:

1. **Đọc register JSON khi có** (`feature-register-source.json` / `feature-register.source.json`
   - cả hai cách đặt tên đều tồn tại, đúng cái bẫy MD-12). `sections[].rows[]` là
   in-scope, `out_of_scope` bị trừ. Cấu trúc thay cho đoán chữ.
2. **`inScopeTokens` cấu hình được** cho register markdown viết ngôn ngữ khác.
3. **Đọc ra 0 mục = ĐỎ, không phải xanh.** Kèm thông điệp nói rõ nó đã tìm gì ở đâu.
   Đây là luật chung: *một gate không nhìn thấy đầu vào phải nói ra, không được đi qua.*

`measure-macro2.mjs` cũng học luật đó: gate thoát 0 sau khi kiểm 0 mục thì ghi vào sổ là
**`XANH RỖNG (kiểm 0 mục, không chứng minh gì)`**, không ghi "xanh".

Kiểm chứng trên autocontent: trước `✓ 0 in-scope` -> sau `✓ 377 in-scope REQ-ID(s) (từ
feature-register-source.json) mỗi cái đúng một phase`.

## MD-23 - `--help` chạy thật và làm bẩn sổ append-only

`measure-macro2.mjs --help` không có nhánh xử lý nên nó **chạy thật** và ghi một dòng
bước `?` vào `docs/macro2-run-log.md`. Sổ là append-only nên dòng rác nằm đó vĩnh viễn.
Script sinh ra để đo lại làm bẩn chính cái nó đo. Đã thêm nhánh `--help`/`-h` in cách
dùng rồi thoát, kèm nhắc `--dry`.

## MD-24 - gate đỏ mãi là gate mù

`dangling-refs` đỏ 15 dòng ở mọi lượt chạy vì có tham chiếu treo hợp lệ: engine của
Macro 1/3, output bước sau chưa sinh, và thứ đã ruled N/A theo `AD-61`. Agent viết văn
giải thích từng dòng rồi đi tiếp - đúng như goal-text bảo.

Hậu quả: lần sau xuất hiện một tham chiếu treo **mới**, nó là dòng thứ 16 trong một
danh sách đỏ sẵn 15 dòng. Không ai nhận ra. Gate anh em `check-ui-region-boundary.mjs`
có `ui-ok:` và `allowlist`; gate này không có gì.

Đã thêm `docs/gates/dangling-refs-allow.md`: mỗi dòng một tham chiếu **kèm lý do và
nguồn**. Khai hết thì xanh, còn một dòng chưa khai thì đỏ, và ngoại lệ hết treo mà vẫn
nằm trong file thì gate báo **thừa**. Ba nhóm lý do được chấp nhận, ngoài ra thì sửa.
Goal-text 2.0 bỏ đoạn "giải thích từng cái trong ghi chép" - bước đóng khi gate **xanh**,
không phải khi viết xong giải trình.

Thử hai chiều trên autocontent: khai đủ 15 -> XANH; thêm một ngoại lệ ma -> báo thừa.

## MD-25 - manifest khai phủ theo FILE NGUỒN, và một phép đo gần như tautology

Manifest thật không liệt kê 401 REQ-ID theo phase - nó khai theo quy tắc:
*"all 68 in `assets.md`"*. Hợp lý: 401 dòng là không đọc nổi, và quy tắc mới là thứ
người review kiểm. Gate nay bung được dạng khai đó (REQ-ID được **in đậm** trong file
SRS là khai; trong backtick là tham chiếu chéo).

**Một cái bẫy khi nới:** bản nới đầu tiên của tôi coi mọi `.md` trong khối là file được
nhận, nên đọc mệnh đề *"dedup against ids already homed in `assets.md`"* thành "P5 nhận
assets.md" và bịa ra hai phase trùng nhau. Đã siết: chỉ nhận dạng ``in `<file>` `` và
cắt văn bản trước các mệnh đề `dedup|minus|cross-referenc|already homed|see`.

**Ghi lại cho thẳng thắn:** script dự án tự viết (`req-id-phase-coverage.mjs`) báo
"401/401, 0 mồ côi, 0 trùng lặp". Con số đúng, nhưng **0 trùng lặp là bảo đảm bởi cấu
trúc** - nó map tên-file-SRS sang phase bằng một bảng hàm, mỗi file đúng một phase, nên
không thể trùng. Nó chỉ bắt được lỗi "file SRS vắng mặt trong bảng". Giá trị chứng minh
của "0 trùng lặp" gần bằng không. Gate đọc manifest thì bắt được trùng thật, vì manifest
là văn bản người viết.

## MD-26 - đẩy tài liệu xuống dự án phải dịch cả tên thư mục

Goal-text 2.3 trỏ mẫu ở `docs/mau-tai-lieu/build-manifest.md`; dự án để mẫu ở
`docs/templates/`. Hai nhánh harness đặt tên khác nhau, và lúc đẩy goal-text sang tôi
bê nguyên đường dẫn của loop-harness.

Tệ hơn: chính tôi tạo `docs/mau-tai-lieu/` trong dự án chỉ để chứa **một** file mẫu, nên
dự án có hai chỗ chứa mẫu. Số liệu quyết: `docs/templates/` có 38 file được 75 chỗ trỏ
tới, `docs/mau-tai-lieu/` có 1 file được 6 chỗ. Đã gộp về `docs/templates/` và sửa 6 chỗ
trỏ - trong đó có mấy chỗ **vốn đã trỏ sai từ trước**, nay đúng luôn.

**Luật:** propagate không phải copy. Ngoài việc chỉnh `../` cho layout phẳng, phải dịch
tên thư mục mẫu sang tên dự án đang dùng. Kiểm bằng `check-dangling-refs.mjs` sau khi đẩy.

## MD-27 - ba playbook mồ côi mà goal-text lại đi hỏi

Goal-text 2.2 đòi *"names the matching playbook per capability"* cho queue/storage/media.
`async-job-queue.md`, `object-storage.md`, `media-pipeline.md` **có** trong harness nhưng
**không** nằm trong bảng macro-2 - tức là playbook mồ côi theo luật chống phình của chính
harness. Dự án không có chúng, agent tìm không ra, phải trích 2 playbook gần nhất.

Harness tự mâu thuẫn: **goal-text hỏi theo năng lực, bảng liệt kê theo tên file - hai
danh sách khác nhau.** Đã cắm cả ba vào ô Playbook của bước 2.2. Kiểm: 15 playbook bảng
macro-2 gọi tên đều có mặt ở dự án, 0 thiếu.

---

## MD-28 - `scaffold.sh` dựng tại chỗ thì tự cắn repo

Bước 2.4 chạy `scaffold.sh . <slug>` - đích là **gốc repo đang có sẵn**, đúng như
goal-text bảo. Đó là cách dùng THẬT, và nó phá ba thứ:

1. `rsync` đè `.gitignore` và `README.md` gốc repo bằng bản của template (template có
   hai file cùng tên ở gốc). `.gitignore` mất dòng loại trừ `.harness/`.
2. `scaffold.sh` tự chạy `git add -A` ngay sau đó -> gom ~150 file `.harness/` vào index.
3. Phần thay `__PROJECT_SLUG__` quét cả `.harness/stack-template/` - **sửa vào chính
   thư mục nguồn của nó**.

Agent phát hiện và khôi phục trước khi commit nên repo không hỏng, nhưng script vẫn sai.

**Vì sao tôi không bắt được:** tôi thử `scaffold.sh` vào một **thư mục tạm trống**. Đường
đó luôn xanh. Cách dùng thật là dựng **tại chỗ** trong repo có sẵn - tôi chưa thử lần nào.
Bài học chung: thử một script ở điều kiện dễ nhất rồi tuyên bố "đã kiểm chứng" là một
dạng xanh giả khác.

Đã vá: nhận diện `IN_PLACE` bằng sự tồn tại của `$TARGET_DIR/.harness`; khi dựng tại chỗ
thì (a) `--exclude` mọi file gốc dự án đã có (`.gitignore`, `README.md`, `AGENTS.md`,
`CLAUDE.md`), (b) `--exclude .harness`, (c) `grep --exclude-dir=.harness` khi thay slug,
(d) **không** `git add -A` - repo có sẵn tự lo việc stage.

Đã thử đúng kịch bản đó: repo giả có `.harness` + 3 file gốc -> dựng tại chỗ -> README
nguyên, `.gitignore` còn dòng `.harness/`, `AGENTS.md` nguyên, **0 file bị stage**,
**0 file trong `.harness` bị sửa**, `apps/` dựng đủ.

## MD-29 - hai script của tôi không nhận component dạng thư mục

Registry cài `chart`, `sidebar`, `data-grid`, `rich-text`, `video-player`, `code-editor`
thành **thư mục nhiều file** (`chart/index.tsx`), và cài mục `registry:lib` / `registry:hook`
ra `src/lib`, `src/hooks`. `ui-sync.mjs --check` và luật B của `check-ui-region-boundary.mjs`
chỉ quét file `.tsx` **phẳng** trong `components/ui/` nên soi sai cả sáu.

Agent tự sửa trong dự án ở 2.4. Đã nhấc bản đó lên harness làm chuẩn - nó là bản đã chạy
thật với 54 mục.

## MD-30 - `validate:quick` được 4 tài liệu gọi tên nhưng không tồn tại

`build-manifest.md`, `STAGE_GOALS.md` §2.6/§2.10, `phase-acceptance.md`,
`visual-fidelity.md` đều đặt tên lệnh xác minh là `pnpm validate:quick`. `package.json`
của template chỉ có `validate` (không chạy `test`). Không có script nào tên vậy.

Đã thêm vào template: `validate:quick = lint && typecheck && test`. Cùng loại lỗi với
MD-20 (tên gọi trong tài liệu không có bản thật) - khác chỗ đây là **tên lệnh**, không
phải tên file, nên `check-dangling-refs` không soi tới. Cần một gate soi tên lệnh trong
tài liệu đối chiếu `package.json` - **chưa làm**, ghi lại đây.

## MD-31 - "Offline boot caveat (§ below)" trỏ vào hư không

Goal-text 2.4 và 2.13 đều trích *"follow the shared **Offline boot caveat** (§ below)"*.
Grep toàn bộ `docs/`: **không có section nào tên vậy**. Hai chỗ trích, không chỗ nào có
đích. Cả hai đoạn tự nó đã nói cách thay bằng chứng, nên caveat "chung" chưa bao giờ được
viết ra - chỉ được nhắc tới.

Đã viết `## Offline boot caveat` ở cuối `STAGE_GOALS.md` và sửa hai chỗ trỏ. Nội dung:
không chặn cổng vì mạng, nhưng phải đủ ba việc - thay bằng chứng, ghi caveat, hẹn chỗ
trả nợ trước go-live. Thiếu một là cổng đỏ.

---

## MD-32 - MD-12 quay lại, vì lần trước chỉ vá một script

`req-issue-scaffold.mjs` đọc register mặc định ở `feature-register**.**source.json`
(dấu chấm); file thật là `feature-register**-**source.json` (gạch ngang). **Lệch đúng
một ký tự** - y hệt MD-12.

Hậu quả thấy ngay khi chạy thử: mọi bản nháp issue in ra `**Module:** (chưa rõ Module)`,
`**Phase:** (chưa gán phase trong register)`, kèm cảnh báo *"REQ-ID này KHÔNG có dòng
register"* bắn cho **cả REQ-ID đang in-scope thật**. Ai tin cảnh báo đó sẽ đi thêm dòng
register trùng lặp cho thứ đã có.

**Vì sao quay lại:** MD-12 vá `rtm-status.mjs` bằng một vòng lặp thử hai tên file, viết
thẳng trong file đó. `req-issue-scaffold.mjs` đọc **cùng một register** nhưng không được
vá - không ai đi tìm xem còn script nào đọc file đó nữa. **Vá một chỗ cho một script là
vá triệu chứng.**

Đã đưa `resolveRegisterJson(root, cfg)` vào `gate-lib.mjs` - thư viện chung mà cả hai
script vốn đã import. Cả hai nay gọi hàm đó; bản tự viết trong `rtm-status` bị bỏ. Script
nào đọc register sau này phải gọi hàm này, cấm tự viết đường dẫn mặc định.

Kiểm chứng trên autocontent: trước `Module:` và `Phase:` rỗng -> sau
`**Module:** Nền tảng kỹ thuật & Nhà cung cấp AI | **Phase:** Phase 1`, hết cảnh báo sai.

**Chỗ này lộ ra nhờ chọn chạy thử trước khi đẩy.** Nếu tạo issue thật luôn thì đã đúc ra
một loạt issue mất phần neo phạm vi, mà số issue trên GitHub không xoá lại được.

## MD-33 - không bước nào giao việc tạo issue, dù chỉ số đo đúng cái đó

Operator hỏi giữa lượt chạy: sao chưa thấy issue nào trên repo. Kiểm bằng máy:

```
gh issue list --state all            -> 0
goal-text 2.3 nhắc "issue"           -> 0 lần
docs/gates/dor-build.md nhắc "issue" -> 0 lần
ô Script của 2.3 có script tạo issue -> không
bước nào trong 11 bước giao việc này -> KHÔNG BƯỚC NÀO
```

Trong khi `macro-2.md` dòng 2.3 **đặt tên bước** là *"Bản kê thi công + DoR + soạn issue"*
và cột Playbook liệt kê `feature-issue-ac-demo-standard` + `github-issue-standard`.

Chuỗi đứt: **bảng hứa -> goal-text không giao -> cổng không kiểm -> không ai làm.** Agent
đọc goal-text để biết làm gì và đọc gate để biết khi nào đóng bước; cả hai đều im.

Nặng vì `issue%` là một trong hai cột được dựng ra để chứng minh Macro 2 có tác dụng, và
vì chuỗi neo `REQ-ID -> issue -> test -> UAT` đứt một mắt thì Macro 3 (chạy bằng
issue-pipeline) không có gì để nhận bàn giao.

**ĐÃ VÁ** - operator chốt: dựng bảng ở 2.3, mở issue theo phase ở 2.6. Xem MD-34.

Một chỗ tôi nói sai và sửa lại: `new-issue.mjs` **có** trong kit, nằm ở
`scaffolds/steady-state/scripts/` chứ không ở stack-template. Tôi chỉ tìm một thư mục.

---

## MD-34 - chuỗi issue: ba mắt xích, không mắt nào có chủ

Operator hỏi liên tiếp ba câu, mỗi câu lột thêm một tầng:

1. *"sao không thấy tạo issue trên repo"* -> MD-33: không bước nào giao việc tạo issue.
2. *"2.6 có cập nhật trạng thái issue sau khi worker làm không"* -> goal-text 2.6 nhắc
   "issue" **0 lần**; `issue-state.mjs` chỉ nằm trong kit steady-state (Macro 3), không bước
   nào của Macro 2 gọi.
3. *"tạo phase và module trên GitHub ở step nào"* -> **không step nào**. Repo thật: 0
   milestone, 0 nhãn `Module:`, 0 nhãn `plane`, chỉ có 9 nhãn mặc định của GitHub.

Mắt thứ ba là mắt chặn: chuẩn issue quy định Phase = **milestone**, Module = **nhãn cấp
repo**. Thiếu chúng thì `gh issue create --milestone --label` ĐỎ, nên kể cả sửa xong lỗi
đường dẫn register (MD-32) thì lệnh tạo issue vẫn hỏng. Bản chạy thử chưa chạm tới đó vì
gãy sớm hơn.

**Đã vá, ba mắt xích thành một chuỗi:**

| bước | việc | công cụ |
|---|---|---|
| 2.3 | dựng milestone `Phase 0..N` + nhãn `Module:` + `plane` | `setup-issue-board.mjs` mới, **mặc định chạy thử**, `--apply` mới tạo, chạy lại được |
| 2.6 mở phase | issue cho REQ-ID của phase, state `Ready for Dev` | `new-issue.mjs` |
| 2.6 nhận việc | state `In Dev` | `issue-state.mjs` |
| 2.6 đóng phase | cổng máy kiểm | `check-issue-coverage.mjs --closing` mới |

Cổng mới **fail-closed đúng bài học MD-22**: phase có REQ-ID mà 0 issue là ĐỎ (đọc hỏng,
không phải "phase không cần issue"); không đọc được trường org `States` cũng ĐỎ.

Kiểm chứng trên autocontent: `setup-issue-board` chạy thử đọc đúng **21 phase + 20 module**
(đã bỏ emoji khỏi tên nhãn); `check-issue-coverage --phase P1` báo **20/20 REQ-ID chưa có
issue** - khớp con số 20 mà chính manifest ghi cho P1.

**Chia việc theo lúc dữ liệu có sẵn:** 2.3 là lúc duy nhất biết đủ P0..PN và M1..MN nên nó
dựng bảng; 2.6 là lúc duy nhất biết ai đang làm gì nên nó mở issue và đẩy trạng thái. Bắt
2.6 dựng bảng thì phase đầu phải dựng hộ 20 phase sau - sai vai.

**Và một luật viết vào `macro-2.md`: "Bù, đừng tua lại."** Phát hiện bước trước thiếu sản
phẩm thì chạy bù đúng phần thiếu ở bước hiện tại, ghi AD nói rõ bù cho bước nào, rồi sửa
goal-text. **Không đặt lại con trỏ bước** - tua về 2.3 là dựng lại `build-manifest.md` đã
đóng và cổng DoR đã thông, phá thứ đang đứng vững để lấy một sản phẩm phụ.

Phần đọc manifest và đọc register in-scope đã dồn vào `gate-lib.mjs`
(`reqIdsByPhase`, `inScopeReqIds`) thay vì chép sang script mới - đúng luật MD-32.

---

## MD-35 - gate ĐỎ GIẢ: regex đòi đúng một cách viết

`check-manifest-coverage.mjs` (và `reqIdsByPhase` trong `gate-lib`) nhận diện dòng khai
REQ-ID của phase bằng `/\*\*REQ-IDs?(?:\s+covered)?:\*\*/` - **đòi đúng chuỗi**. Manifest
viết `**REQ-IDs covered (7):**` - kèm số lượng, cách viết hoàn toàn tự nhiên - thì regex
trượt, cả khối bị bỏ qua, và gate báo **20 REQ-ID của P1 "covered by NO phase"**.

Trong khi `req-id-phase-coverage.mjs` (script khác, cùng dự án) vẫn PASS - **hai script
không chung quy ước**, nên hai câu trả lời trái ngược cho cùng một câu hỏi.

**Đỏ giả nguy hơn xanh giả ở chỗ nó bảo người ta đi sai đường.** Agent gặp gate đỏ sẽ sửa
*tài liệu* cho vừa regex - và đúng là nó đã làm vậy: chuyển `(7)` ra ngoài dấu đóng đậm.
Tài liệu bị bẻ cong theo công cụ, thay vì công cụ đọc được tài liệu người viết.

Đã nới thành `/\*\*REQ-IDs?\b[^*]*:\*\*/` - nhận mọi chữ giữa `REQ-ID(s)` và `:**`. Thử cả
hai cách viết trên một manifest giả: cả hai đều đọc ra đúng REQ-ID.

**Luật rút ra:** gate đọc **tài liệu người viết** phải nhận nhiều cách viết của cùng một ý.
Chỉ siết chặt khi cái đọc là **đầu ra của máy**. Và khi hai script cùng trả lời một câu hỏi
thì phải dùng chung một hàm - đây là lần thứ ba bài học đó xuất hiện (MD-12, MD-32, giờ là
MD-35), nên `reqIdsByPhase` nằm ở `gate-lib` chứ không chép.

---

## MD-36 - milestone bị đặt sai nghĩa: gói việc kỹ thuật chiếm chỗ mốc phát hành

Operator đưa roadmap kinh doanh: **Phase 1..5**, mỗi phase một khoảng thời gian
(*"Phase 1: Release MVP Vietnam 01/09-31/09"*, *"Phase 2: SEO/ADS/RBAC, Rollout Global
01/10-15/10"*...). Rồi hỏi thẳng: sao lại 21 phase, và *"cái này nên gọi là phase 1 thôi"*.

Operator đúng. MD-34 tôi cho `setup-issue-board.mjs` dựng **21 milestone tên
`Phase 0..Phase 20`** - đó là **phase THI CÔNG** (1 module = 1 gói việc, tiêu chí là ranh
giới module + dev-day). Nó chiếm mất cái tên mà mốc phát hành đang dùng.

**Va tên không phải giả định - nó đã sống sẵn trong repo:** `ROADMAP.md` viết *"TikTok
video deferred phase 2"* và *"it stays a Phase-2 line in the feature register"* theo nghĩa
**đợt phát hành**, trong khi milestone `Phase 2` tôi vừa tạo lại là *"Platform NFRs & UI
standards"* - gói việc thứ hai. Nhìn milestone "Phase 2" không ai biết là nghĩa nào.

**Đã sửa - mỗi thứ về đúng chỗ:**

| thứ | biểu diễn | vì sao |
|---|---|---|
| phase phát hành `Phase 1..N` | **milestone** + hạn chót | milestone GitHub có due date và thanh tiến độ - đúng thứ một mốc phát hành cần, và là thứ người ngoài đội hỏi |
| phase thi công `P0..PN` | nhãn `Build: P<n>` | chỉ là thứ tự làm nội bộ, không có hạn chót riêng |
| module | nhãn `Module: <Tên>` | không đổi |

Một issue mang **cả hai**: nhãn nói nó thuộc gói việc nào, milestone nói nó ra mắt đợt nào.
`check-issue-coverage.mjs` nay kiểm nhãn `Build: P<n>`, và kiểm thêm rằng mọi issue **có một
milestone phát hành** - thiếu milestone nghĩa là chưa ai quyết tính năng đó lên sóng lúc nào.

`setup-issue-board.mjs` đọc mốc phát hành từ `docs/ROADMAP.md` § Release roadmap và **dừng**
nếu không có - milestone là quyết định kinh doanh, không được suy ra từ gói việc kỹ thuật.
Mẫu `docs/mau-tai-lieu/ROADMAP.md` thêm section đó.

**Bài học rộng hơn:** harness mượn từ "phase" cho khái niệm của nó mà không hỏi dự án đã
dùng từ đó chưa. Một từ có sẵn nghĩa trong ngôn ngữ của dự án thì công cụ **không được**
chiếm. Chỗ khác cần soát cùng lý do: "module", "milestone", "release".

---

## MD-37 - ba lỗi trong chính bộ script issue tôi vừa viết, lộ ra khi phase con chạy thật

Bốn tiếng sau khi viết, lượt chạy dùng thật và trả về ba lỗi. Cả ba đều thuộc loại "chỉ
lộ khi có dữ liệu thật", không loại nào bắt được bằng đọc code.

**1. Gate không soi được phase con (chặn đường).** `reqIdsByPhase` bắt tiêu đề bằng
`^#{2,4}\s+(P\d+)\b`, nên `#### P1.1` đọc thành `P1` và `--phase P1.1` trả *"không có
REQ-ID nào trong phạm vi - đọc hỏng"*. Mà P1 đã tách 3 phase con, tức cổng vô dụng đúng
lúc cần nhất. Đã nhận `P\d+(?:\.\d+)?`, và **gộp ngược REQ-ID của phase con lên phase cha**
để hỏi "P1 gồm gì" vẫn ra đủ 20. Kiểm: `P1=20, P1.1=7, P1.2=6, P1.3=7`.

**2. Tên module lấy sai nguồn.** `req-issue-scaffold` trả `Module: Nền tảng kỹ thuật & Nhà
cung cấp AI` (tên section tiếng Việt trong register JSON), còn nhãn THẬT trên repo do
`setup-issue-board` dựng là `Module: AI provider platform` (từ bảng M1..MN của ROADMAP).
Gắn vào là `gh` báo không có nhãn đó. **Hai script đọc hai nơi cho cùng một cái tên** - lại
đúng bài học MD-12/MD-32. Đã chốt ROADMAP là nguồn của nhãn `Module:`, `req-issue-scaffold`
tra theo phase.

**3. Khớp REQ-ID bằng `startsWith` nên gợi ý sai tên cho 4/7.** `registerRow` cắt hậu tố số
rồi so `id.startsWith(stem)`, nên `IF.JOBS.04/.05/.06/.08` đều rơi vào dòng register **đầu
tiên** có gốc `IF.JOBS` và nhận nhầm tên tính năng của nó. Đã đổi sang khớp **chính xác**,
ký tự đại diện phải khai tường minh (`IF.JOBS.*`). Sau khi sửa, `.05` và `.08` ra tên khác
`.01` - đúng.

**Một quyết định kèm theo:** nhãn `Build:` đặt ở mức **phase cha**, không phải phase con.
21 phase × ~3 phase con = 60-100 nhãn thì không ai lọc nổi. Phase con vẫn soi được vì REQ-ID
của nó đọc từ manifest; chỉ nhãn là dùng chung.

**Bài học lặp lại lần thứ tư:** hai script trả lời cùng một câu hỏi thì phải dùng chung một
nguồn. MD-12 (đường dẫn register), MD-32 (cũng đường dẫn register), MD-35 (regex nhãn
REQ-ID), giờ MD-37 (tên module). Mỗi lần đều là "vá chỗ này quên chỗ kia".

---

## MD-38 - nhãn REQ-ID trải nhiều dòng làm cả một phase vô hình

Lượt chạy báo tiếp: **P20 vô hình với cổng**. Nhãn khai của nó trải **ba dòng**:

```
- **REQ-IDs covered (exact 22, no prefix ambiguity — carved out of their
  host files by explicit ID per `.../change-request-log.md`
  § Sign-off):**
```

Bộ đọc soi **từng dòng** và đòi thấy `:**` đóng trên cùng dòng đó, nên không dòng nào
khớp - 22 REQ-ID biến mất **lặng lẽ**, không cảnh báo gì. Đây là MD-35 lần hai: cùng một
regex, lần trước hỏng vì có chữ chen giữa, lần này hỏng vì xuống dòng.

Đã đổi sang nhận diện bằng **đầu khối** (`/^\s*-\s*\*\*REQ-IDs?\b/`) rồi gom cho tới bullet
kế tiếp - không cần thấy dấu đóng. Kiểm: `P20` từ **0 -> 17 REQ-ID**, `P1=20`, `P1.1=7`.

**Luật rút ra, dán vào cạnh MD-35:** gate đọc tài liệu người viết thì **đừng khớp cả một
mẫu dài**. Nhận diện bằng thứ ngắn và ổn định (đầu dòng, đầu khối), rồi mới gom nội dung.
Mẫu càng dài càng nhiều cách viết làm nó trượt, và mỗi lần trượt là một phase biến mất
không kèn không trống.

---

## MD-39 - khối khai REQ-ID nuốt cả lời giải thích, nhắc một mã thành nhận nó

Tách P1.4 ra khỏi P1.1, agent viết trong khối P1.1 câu *"`IF.JOBS.05` đã chuyển sang
P1.4"*. Cổng đọc xong báo **P1.1 có 5 REQ-ID thay vì 4** - chỉ **nhắc** một mã trong lời
giải thích mà thành nhận sở hữu nó.

Nguyên nhân: khối khai chỉ dừng ở bullet in đậm kế tiếp hoặc tiêu đề, nên mọi dòng văn
viết dưới nhãn đều bị gom vào rồi quét token.

Agent lách bằng cách viết *"ba id vòng đời job nay ở P1.4"* - không dùng mã đầy đủ. Lách
được, nhưng người viết sau sẽ lặp lại, vì **không ai đoán được rằng viết tên một mã trong
câu giải thích lại làm phase nhận nó**.

Đã sửa hai lớp:

1. **Khối dừng ở DÒNG TRỐNG** (ngoài bullet kế tiếp và tiêu đề). Dòng trống là ranh giới
   rẻ và ổn định: nhãn trải nhiều dòng không có dòng trống bên trong (xem MD-38), còn văn
   giải thích thì luôn nằm sau một dòng trống.
2. **Cắt trước mệnh đề nói ngược quyền sở hữu**: thêm `chuyển sang|đã sang|moved to|now
   in|thuộc P\d` vào danh sách đã có (`dedup|minus|cross-referenc|already homed|see`).

Kiểm trên manifest giả có đủ ba cái bẫy (câu "đã chuyển sang", đoạn văn tự do nhắc mã,
phase con): `P1.1 -> 2 mã của nó`, `P1.4 -> 2 mã của nó`, `P1 -> gộp đủ 4`. Không rò.

**Đây là dòng `gate-sai` thứ sáu, và cả sáu cùng một gốc:** cổng đọc **tài liệu người
viết** bằng cách khớp mẫu. Người viết có nhiều cách diễn đạt cùng một ý, còn mẫu thì chỉ
biết một. Ba lần trượt đã gặp - có chữ chen giữa (MD-35), xuống dòng (MD-38), và nhắc mã
trong lời giải thích (MD-39).

**Luật đúc kết:** khi cổng phải đọc văn người viết, hãy (a) nhận diện bằng thứ ngắn và ổn
định, (b) **khoanh vùng rõ ràng đâu là khai, đâu là giải thích**, (c) cắt trước mọi mệnh đề
phủ định. Và luôn tự hỏi: *người viết tiếp theo có đoán được luật này không?* Nếu không thì
luật sai, không phải người viết sai.

---

## MD-40 - năm dòng ma sát còn hở, cùng một họ: tiêu chí quy mô máy trong ngân sách người

Đóng sổ ma sát cuối lượt: 19/24 dòng đã vá thành MD-20..MD-39. **Năm dòng còn lại cùng
một gốc:**

- 2.1 - gate đòi *mọi REQ-ID map >=1 thực thể*, **không có script**.
- 2.2 - gate đòi *API contract phủ mọi REQ-ID có API surface* (601 mục), **không có script**.
- 2.3 - playbook đòi *mỗi phase gọn trong một phiên (~10 file)* nhưng ngân sách không đủ
  để chia 401 REQ-ID.
- 2.3 - **vượt ngân sách lượt** thật (quy định 18, dùng nhiều hơn).
- một phần: đối chiếu REQ-ID <-> entity (phần phase đã có `check-issue-coverage`).

Tất cả là **tiêu chí ở quy mô máy giao cho gate người, trong ngân sách lượt đặt cho dự án
nhỏ hơn nhiều**. Đây chính là điều phân bố ma sát đã chỉ từ dòng đầu: `thieu-cong-cu`
chiếm 8/24, nhiều nhất.

### Đo bằng máy lần đầu, và con số nói ngược lại điều tôi tưởng

`check-reqid-artifact-coverage.mjs` (mới) đo phủ REQ-ID -> artifact:

```
mức id    ERD 6%    API contract 4%
mức area  ERD 22%   API contract 17%
```

**Hai tài liệu đó không sai 78%** - chúng **chưa từng ghi trích dẫn REQ-ID**. Tức tiêu chí
như đang viết **chưa bao giờ đạt được và chưa bao giờ được kiểm**; `AD-77`/`AD-78` của lượt
chạy nói đúng sự thật khi khai là chỉ kiểm ở mức module.

Bắt đủ 100% ngay ở 2.1/2.2 nghĩa là bắt viết ~130 dòng trích dẫn trong một bước 15 lượt.
Cổng sẽ đỏ mãi rồi bị bỏ qua - **đúng bệnh MD-24 vừa vá xong ở một gate khác**.

### Cách vá: đo trước, chặn sau

| bước | chế độ | vì sao |
|---|---|---|
| 2.1, 2.2 | `--advisory` - báo cáo con số, không chặn | tài liệu chưa có trích dẫn; ép ngay là ép viết một lượt |
| 2.6 | `--phase P<n>` - **chặn** | mở phase nào viết trích dẫn phase đó; phase cuối đóng là phủ tự đủ |

Kiểm chứng: `--artifact entity --phase P1.1` -> **xanh, 4/4 REQ-ID có thực thể**. Nợ chia
nhỏ theo phase thì trả được; gom một cục thì không.

### Ngân sách lượt: nhân theo cỡ dự án

Mốc `Stop after N turns` vốn đặt cho dự án **~100-150 REQ-ID**. Dự án thật có **401**, và
2.3 vượt ngân sách - phần lớn lượt dùng để đọc dò 21 file SRS.

Luật mới ghi vào đầu `STAGE_GOALS.md`: trên **200 REQ-ID** nhân ngân sách các bước đọc-nhiều
(2.1, 2.2, 2.3) lên **×1.5**, trên **400** thì **×2**. Các bước khác giữ nguyên vì chúng đọc
artifact đã cô đọng.

Và: **vượt ngân sách không phải lỗi, GIẤU mới là lỗi** - vượt thì ghi số thật vào sổ ma sát
để lần sau hiệu chỉnh bằng số, không bằng cảm giác. Tuyệt đối không cắt bớt việc cho vừa
ngân sách; hạ mức kiểm thì phải ghi rõ đã hạ.

---

## MD-41 - chạy khô nửa sau: một script go-live nhận cờ làm số issue, một gate tự miễn

Chạy khô công cụ của **2.8 -> 2.13** trên artifact đang có, **không đóng bước, không đụng
`STAGE.md`**. Mục đích: kiểm *công cụ*, không kiểm *quy trình* - vì 2.6 mới xong 1/21 phase
nên chạy các bước đó như tiến trình thật sẽ đỏ đúng và ép người ta ghi đè.

Nửa sau chỉ có **ba script cơ học** (`check-ac-coverage`, `harness-verify-gate`,
`ship-and-verify`); 2.9 và 2.12 là cổng người. Bắt được hai lỗi.

### 1. `ship-and-verify.sh --help` chạy thật rồi treo

```bash
ISSUE="${1:?usage: ship-and-verify.sh <issue-number> [<commit-sha>]}"
```

`--help` **không bị coi là cờ** - nó thành *số issue*, script chạy tiếp, gọi `gh`/`curl`/ssh
rồi treo. Đây là script **go-live**, và phần thân nó có nhánh *"bắn lại deploy MỘT lần"*.
Một người gõ `--help` để xem cách dùng **không được phép chạm vào đường deploy**.

Cùng lỗi MD-23 (`measure-macro2.mjs --help` chạy thật, ghi dòng rác vào sổ), nhưng hậu quả
nặng hơn nhiều. Soát cả hai kit: **chỉ hai script nhận tham số vị trí** - `ship-and-verify.sh`
và `scaffold.sh` - và **cả hai đều không chặn cờ**. Đã thêm nhánh `-h|--help` in cách dùng
và **từ chối mọi tham số bắt đầu bằng `-`** trước khi đọc tham số vị trí.

**Luật:** script nhận tham số vị trí phải chặn cờ TRƯỚC. Càng nguy hiểm càng phải chặn -
thứ tự đúng là *cái gì đụng tới prod thì kiểm tham số chặt nhất*, không phải lỏng nhất.

### 2. Gate trung thực-prototype tự miễn ở đúng bước cần nó nhất

`check-prototype-fidelity.mjs` bỏ qua khi (a) không có `fidelity-map.json`, hoặc (b) có file
nhưng rỗng route. Ở bước 2.0-2.4 điều đó đúng - chưa có gì để đối chiếu. Nhưng ở **2.10**,
nơi cổng `visual-fidelity` cần nó, thiếu map nghĩa là **chưa ai làm việc đối chiếu**, mà
cổng vẫn đi qua. Xanh giả nằm sẵn ở bước gần go-live nhất.

Đã thêm `prototypeFidelity.required` vào `gate-config.json`: dự án khai một lần rằng mình
có prototype đóng băng, và từ đó **cả hai đường bỏ qua đều thành ĐỎ**. Bật ở **2.6 khi phase
đầu tiên có màn hình** - trước đó bật là chặn nhầm.

Thử hai chiều: `required=true -> exit 1`, `required=false -> exit 0`.

Một lỗi của tôi trong lúc vá, ghi lại vì nó là hình dạng hay gặp: nhánh mới trả
`{ errors, out }` trong khi hàm dùng `{ code, out, err }` - crash `err is not iterable`.
**Chèn nhánh vào hàm có sẵn thì phải đọc hình dạng giá trị trả về của nó trước**, đừng đoán.

### Không bắt được gì ở đâu

`check-ac-coverage` đỏ **đúng** (17 REQ-ID chưa có test - trạng thái thật giữa phase).
`check-huong-dan-shots`, `check-canonical-redirect-manifest`, `check-new-screen-fidelity`
bỏ qua có lý do rõ ràng. `qc-checklist.mjs` tôi tưởng crash, hoá ra tôi gọi sai đường dẫn -
nó nằm ở kit steady-state.

**Giới hạn của chạy khô, nói thẳng:** nó không kiểm được cổng người (2.9 bảo mật, 2.12
nghiệm thu), không kiểm được `harness-verify-gate.sh` ở chế độ đóng bước, và không kiểm
được 2.13 thật vì cần máy chủ. Muốn chốt nửa sau phải chạy trọn trên một dự án nhỏ.

---

## MD-42 - DoD đo cả register trong khi dự án phát hành làm nhiều đợt

Operator muốn chốt nửa sau mà không phải xây hết 21 phase: đóng nốt P1 rồi phát hành một
**đợt nội bộ** gồm `P0+P1`, chạy 2.8 -> 2.13 lên đúng phạm vi đó. Chặn đường: **cổng DoD/AC
đo trên toàn bộ register** (377 REQ-ID trong phạm vi), không có khái niệm đợt nhỏ hơn.

Đây không phải nhu cầu riêng của phép thử: `ROADMAP.md` § Release roadmap có **5 đợt phát
hành**, nên DoD sẽ phải đo theo đợt dù sớm hay muộn.

**Đã thêm** `acCoverage.releaseScope = { name, phases }`. Đo trên dự án thật:

```
toàn bộ        373/377 REQ-ID chưa có test
đợt P0+P1       16/20                        <- con số hành động được
khai sai phase  ĐỎ kèm lý do                 <- không im lặng cho qua
```

**Và một lần nữa, cùng một việc viết lại lần thứ năm.** `check-ac-coverage` có bộ đọc
manifest RIÊNG (`manifestReqIds`), dùng **regex cũ** nên dính đúng hai lỗi đã vá ở nơi
khác: nhãn có hậu tố `(7)` (MD-35) và nhãn trải nhiều dòng (MD-38). Đã xoá nó, dùng
`reqIdsByPhase` của `gate-lib` - vừa hết trùng lặp vừa thừa hưởng cả bốn bản vá.

Danh sách các lần: MD-12, MD-32, MD-35, MD-37, giờ MD-42. **Năm lần cùng một bài học.** Nếu
còn script nào đọc manifest hay register mà không qua `gate-lib` thì nó đang mang lỗi cũ -
đó là chỗ soát đầu tiên khi gặp gate cư xử lạ.

### Một lỗi tôi tự dựng lại trong lúc vá, ghi để nhớ

Bản đầu coi `phases: []` là **danh sách hợp lệ** thay vì "không lọc", nên chế độ toàn bộ
lọc ra 0 mục rồi **báo XANH** - tự tay dựng lại đúng bệnh xanh giả (MD-22) mà tôi vừa vá
hôm nay ở gate khác.

Bắt được là nhờ thử **cả hai chiều** thay vì chỉ thử chiều mình đang quan tâm. Nếu chỉ thử
chế độ theo đợt thì đã merge một cổng luôn xanh ở chế độ mặc định.

**Luật:** giá trị rỗng của một tuỳ chọn phải nghĩa là "không dùng tuỳ chọn này", không bao
giờ là "dùng với tập rỗng". Và cổng nào lọc được thì phải thử ba chiều: không lọc, lọc
đúng, lọc sai.

---
## MD-43 - cổng đọc sai chỗ trong JSON rồi báo "chưa đặt trạng thái"

**Bản đầu của mục này SAI, viết lại.** Operator bác đúng: `Backlog` là trường `States`,
không phải nhãn.

Sự thật, lấy từ dữ liệu thô:

```json
"issue_field_values": [
  { "data_type": "single_select",
    "issue_field_name": "States",
    "single_select_option": { "name": "Backlog" } } ]
```

Khoá là **`issue_field_name` phẳng**, không phải `issue_field.name` lồng. Tôi viết truy vấn
theo dạng lồng - **đoán hình dạng thay vì đổ dữ liệu ra xem** - nên nó trả rỗng, và tôi kết
luận "cả 7 issue chưa được đặt trạng thái". Sai hai lần: sai về dữ liệu, và sai khi nói với
operator rằng cái chip đó chỉ là nhãn.

**Hậu quả nặng hơn lời nói sai:** `check-issue-coverage.mjs` dùng đúng đường dẫn sai đó, nên
cổng báo *"chưa đặt trạng thái"* cho những issue **đang có trạng thái**. Một cổng đọc sai
chỗ còn tệ hơn cổng không đọc được, vì nó nói dối rất tự tin - và nó đẩy người ta đi chạy
`issue-state.mjs` cho thứ đã đặt rồi.

Sau khi sửa, cổng nói đúng việc thật:

```
✗ 4 issue còn ở trạng thái mở đầu khi đóng P1.1:
  #20=Backlog, #21=Backlog, #22=Backlog, #23=Backlog
```

**Phần kết luận vẫn đứng, chỉ khác lý do:** `#20`-`#23` có code và test rồi nhưng trạng thái
vẫn `Backlog` - **chưa ai đẩy**. Trình tự bị đảo một lần: code viết trước, issue mở sau, nên
mốc *"runner nhận việc -> In Dev"* không có ai để chạy.

### Bài học, và nó là bài học tôi vừa tự viết rồi tự vi phạm

MD-41 tôi vừa ghi: *"chèn nhánh vào hàm có sẵn thì đọc hình dạng giá trị trả về trước, đừng
đoán"*. Đây là đúng lỗi đó ở mức API: **đọc một cấu trúc JSON lạ thì đổ nó ra xem trước,
đừng suy từ tên trường.** Viết một luật không làm mình miễn nhiễm với nó.

Và một luật nữa cho gate: **cổng đọc dữ liệu ngoài phải phân biệt được "đọc được, giá trị
trống" với "đọc không ra"**. Ở đây hai ca đó gộp làm một nên cái sai của tôi không lộ - gate
chỉ nói "chưa đặt" cho cả hai. Đã tách thành `apiFail` và `unset` riêng, và chính việc tách
đó làm lỗi lộ ra khi operator hỏi lại.

---

## MD-44 - pipeline 10 nấc, goal-text chỉ đẩy tới nấc thứ ba

Operator hỏi: worker chạy issue có đổi trạng thái không, ví dụ `Backlog -> Ready for Dev ->
In Dev -> Ready for Test`. Đi đo, và câu hỏi lộ ra một lỗ hổng lớn hơn chính nó.

Trường `States` của tổ chức có **10 nấc**:

```
Backlog · Ready for Dev · In Dev · Ready for Test · QC Testing
Ready for UAT · UAT Testing · Deploying · Done · Cancelled
```

**Goal-text của tôi nhắc đúng hai:** `In Dev` và `Done`. Và **không bước nào sau 2.6 nhắc
tới trạng thái issue** - grep 2.8, 2.9, 2.10, 2.12, 2.13 đều ra 0.

Nghĩa là pipeline dừng ở `In Dev` rồi đứng yên tới hết dự án. Bảy nấc giữa - đúng những nấc
ghi lại **ai đã kiểm cái gì** - không ai chạm tới.

### Điều làm phát hiện này đáng giá hơn một bản vá

Mười nấc đó **chính là Macro 2 nhìn từ phía một REQ-ID**: `Ready for Test` là lúc 2.6 đóng
phase, `QC Testing` là 2.10, `UAT Testing` là 2.12, `Deploying` là 2.13. Hai thứ tôi vẫn coi
là riêng biệt - "quy trình bước" và "pipeline issue" - hoá ra là **một thứ, viết hai lần ở
hai chỗ**. Nối chúng lại thì `issue%` không còn là một chỉ số phụ mà là bản đồ tiến độ theo
từng yêu cầu, và Macro 3 nhận bàn giao đúng thứ nó cần.

### Đã vá

- `ISSUE_STATES` (mảng có thứ tự) vào `gate-lib`, kèm `Cancelled` là lối ra ngoài thứ tự.
- `check-issue-coverage.mjs --expect "<nấc>"`: mọi issue trong phạm vi phải tới nấc đó
  hoặc xa hơn. Thử ba chiều: đòi nấc xa -> ĐỎ đúng 4 issue đang `Backlog`; đòi nấc gần ->
  XANH; đòi nấc không tồn tại -> báo lỗi kèm danh sách hợp lệ.
- Goal-text: 2.6 thêm `Ready for Test` (cấm nhảy thẳng `Done`), 2.10 thêm `QC Testing` ->
  `Ready for UAT`, 2.12 thêm `UAT Testing`, 2.13 thêm `Deploying` -> `Done` và bắt
  `--expect "Done"` xanh **trước khi** flip sang Mode B.

### Một rủi ro ghi lại, chưa vá

Script harness sao xuống dự án bị prettier của dự án format lại, nên so byte **luôn lệch** -
9/11 script hiện lệch định dạng dù hành vi khớp (đã kiểm bằng cách chạy cả hai bản trên cùng
dữ liệu, đầu ra giống hệt). Drift thật sẽ lẫn vào nhiễu này. Cách vá: cho script harness vào
`.prettierignore` của dự án. **Chưa làm** - ghi để không quên.

---

## MD-45 - tôi xếp sai thứ tự trạng thái, suýt sửa một bảng đang đúng

Phiên chạy báo chặn: cổng đòi `--expect "Ready for Test"` nhưng nấc đó **không tới được
bằng đường hợp lệ**, vì `TRANSITIONS` trong `issue-state.mjs` xếp `Deploying` ngay sau
`In Dev`. Nó đề nghị đổi bảng đó cho khớp tài liệu, và **từ chối tự sửa** vì file thuộc kit
harness - sửa là tạo bản lệch.

Đọc bảng thì **script đúng, tài liệu của tôi sai**:

```
Backlog -> Ready for Dev -> In Dev -> Deploying -> Ready for Test
        -> QC Testing -> Ready for UAT -> UAT Testing -> Done
```

`Deploying` ở đây **không phải go-live**. Nó là *"đưa lên môi trường để test"* - self-test
của script ghi thẳng: `['In Dev', 'Ready for Test', false] // chua deploy thi chua test
duoc`. Và `--advance` cố ý **chỉ đi tới `In Dev`**; từ `Deploying` trở đi phải do người
hoặc `ship-and-verify.sh` đặt, để giữ cổng QC/UAT là người.

Tôi xếp `Deploying` gần `Done` theo nghĩa quen thuộc của từ đó, **không đọc bảng**. Hậu quả:
`ISSUE_STATES` sai thứ tự, bảng ánh xạ trong `macro-2.md` sai, và goal-text 2.6 đòi một nấc
không tới được - **lượt chạy bị chặn**.

Đã sửa ba chỗ của tôi, **không đụng script**. Goal-text 2.6 nay dừng ở `In Dev` (xa nhất
`--advance` tới được hợp lệ). Thử lại: `--expect "In Dev"` XANH, `--expect "Ready for Test"`
ĐỎ đúng lý do.

### Hai điều đáng giữ

**Phiên chạy từ chối sửa file harness là đúng, và nó cứu tôi.** Nếu nó tự sửa cho khớp tài
liệu thì một bảng có TRANSITION GUARD + self-test đã bị bẻ theo một tài liệu sai, và lỗi sẽ
chỉ lộ ra ở 2.13 khi có người hỏi vì sao issue nhảy thẳng từ UAT sang go-live.

**Đây là lỗi thứ ba cùng một hình dạng trong ngày:** khoá JSON `issue_field_name`, hình dạng
trả về `{code,out,err}`, và giờ là thứ tự `TRANSITIONS`. Cả ba đều là *tôi suy từ tên gọi
thay vì đọc thứ đang có*. Luật đã ghi hai lần rồi vẫn tái phạm, nên ghi thêm một lần nữa,
cụ thể hơn: **khi tài liệu và code nói khác nhau, code có test là nguồn; sửa tài liệu.**

## MD-46 - `--advance --dry-run` chết giữa chừng

Cùng lượt, phiên chạy bắt thêm: `issue-state.mjs --advance --dry-run` tính đường đi một lần
rồi chạy từng chặng bằng tiến trình con. Ở chế độ giả lập trạng thái **không đổi**, nên chặng
thứ hai đọc lại vẫn thấy trạng thái cũ và chết vì "nhảy cóc" (`Backlog -> In Dev`), văng
stack trace Node thô.

Người dùng `--dry-run` là người **cẩn thận nhất** - không được để họ nhận một stack trace.
Đã sửa: giả lập thì chỉ **in đường đi** rồi thoát. Thử: `Ready for Dev -> In Dev, 1 buoc,
khong goi API`.

---

## MD-47 - cổng đặt ở cửa ra nên chỉ bắt được cái đã muộn

Operator hỏi: P1.2 đang chạy rồi mà sao chưa thấy issue nào - *"sao lủng hoài vậy"*.

Kiểm: repo vẫn 7 issue, **6/6 REQ-ID của P1.2 chưa có issue**. Và đây là **lần thứ hai cùng
một chuyện**: P1.1 cũng code trước rồi mới mở issue.

**Nguyên nhân gốc không phải phiên chạy quên, mà là chỗ tôi đặt cổng.**
`check-issue-coverage` chỉ chạy lúc **đóng** phase (`--closing`). Quy trình dặn *"mở phase
-> sinh issue"* bằng **văn**, còn máy thì chỉ kiểm ở **cuối**. Nên runner code trước, tạo
issue sau - hoặc quên hẳn - và không gì bắt được cho tới lúc đóng.

Nhìn lại cả ngày thì **mọi lỗ hổng đều cùng hình dạng đó**: bảng bước hứa việc mà goal-text
không giao (MD-33), goal-text giao mà cổng không kiểm (MD-44), cổng kiểm mà kiểm ở cuối
(chỗ này). Ba tầng, cùng một bệnh: **khoảng cách giữa lời dặn và phép kiểm.**

**Đã vá:** thêm **cổng cửa vào** ở 2.6 - `check-issue-coverage.mjs --phase P<n>` phải xanh
**TRƯỚC** khi giao việc cho runner. Lỗi thành *"không mở được phase"* thay vì *"phát hiện
khi đã muộn"*.

Kiểm ngay trên P1.2 đang chạy: cổng báo `6/6 REQ-ID của P1.2 chưa có issue nào` - đúng thứ
operator vừa hỏi, và nếu có cổng này từ đầu thì P1.2 đã không mở được.

**Luật:** việc nào quy trình bắt làm **trước** một hành động thì phải có cổng chạy **trước**
hành động đó. Cổng cuối để bắt cái **hỏng trong lúc làm**, không dùng để bắt cái **chưa
làm** - tới lúc đó sửa đã đắt.

---

## MD-48 - `new-issue.mjs` không biết nhãn phase thi công

Cổng cửa vào (MD-47) chạy lần đầu và bắt được ngay: 6 issue P1.2 vừa tạo đúng chuẩn nhưng
**thiếu nhãn `Build: P1`**.

Nguyên nhân: `new-issue.mjs` chỉ đặt `plane` và `Module: <Tên>` - nó có từ trước, còn nhãn
`Build: P<n>` là quy ước tôi thêm hôm nay (MD-36). Nên mỗi issue phải gắn nhãn ở **bước tay
thứ hai**, và bước tay là bước bị quên.

Đã sửa: nhận `buildPhase` trong `issue.json` -> `--label "Build: P<n>"`, và `--check` đòi
nhãn đó. Kiểm: `--check #27` và `#32` đều báo `label plane/Module/Build`.

**Luật:** thêm một quy ước mới (nhãn, trường, tên) thì phải sửa **công cụ tạo ra nó** trong
cùng lần, không để lại một bước gắn tay. Bước tay không có cổng nào giữ.

---

## MD-49 - luật "SRS là nguồn" có ghi, nhưng không có thứ tự và không cổng nào giữ

Operator hỏi: các SOT của Macro 2 - SRS, prototype, feature-register - harness còn nhớ cái
nào cai quản cái gì không, và **sao đến giờ vẫn có tư tưởng code thắng SRS**.

Đi kiểm. `macro-2.md` **có** ghi, ở hai gạch đầu dòng:

```
Scope (feature nào)  <- feature-register  (KHÔNG phải SOT)
Chi tiết + AC        <- docs/requirements/srs/  (SOT thật)
```

Đúng, nhưng **thiếu ba thứ**, và cả ba đều là lý do lỗ hổng lọt được:

1. **Không có thứ tự ưu tiên.** Grep "ưu tiên / xung đột / precedence" trong `macro-2.md` và
   `TRACE_SPEC.md` ra **rỗng**. Không chỗ nào nói SRS lệch prototype thì sao, hay code lệch
   SRS thì sao.
2. **Chữ "SOT" bị dùng cho quá nhiều thứ** trong cùng bộ tài liệu: loop-harness là SOT của
   harness, `dor-build.md` là SoT của DoR, manifest reno-ui là "nguồn sự thật", SRS là "SOT
   thật". Đọc xong không biết cái nào phân xử cái nào.
3. **Không cổng nào đọc luật đó.** Nó là văn xuôi trong một mục về nguồn nội dung issue.

Kết quả thực tế: 10 issue của P1.1/P1.2 viết **sau** khi code. Không ai vi phạm một luật
tường minh nào cả - vì luật chưa từng được viết đủ rõ để vi phạm.

**Operator chỉnh lại mô hình ngay sau bản nháp đầu, và bản chỉnh đúng hơn.** Nháp đầu tôi
xếp một hàng dọc: SRS > prototype > register. Sai. Operator nói rõ: *"feature list Register
từ khách là SOT về phạm vi, SRS là SOT về chi tiết chức năng, prototype là SOT về giao
diện"* - tức là **ba nguồn ngang nhau, cai quản ba miền khác nhau**, không phải một xếp
hạng. Xếp hàng dọc thì hỏng ở chỗ: SRS mọc thêm một tính năng không có trong register, mô
hình xếp hạng sẽ bảo "SRS thắng, cứ làm" - trong khi thực tế đó là phình phạm vi, phải quay
lại hỏi khách. Bảng đã viết lại theo miền, và luật thứ tư sinh ra từ chính chỗ đó: **SRS
không phán phạm vi.**

Kết quả: bảng ba dòng (ba nguồn theo miền) + bảng bốn dòng (dẫn xuất, gồm code) trong
`macro-2.md` § Ba nguồn sự thật, tóm tắt ở đầu `STAGE_GOALS.md`. Bốn luật:

- **Code không bao giờ thắng.** Code lệch SRS thì sửa CODE - không sửa SRS, không sửa AC cho
  khớp code, không "ghi nhận thực tế hiện tại". Một dòng SRS bị bẻ theo code là một yêu cầu
  của khách biến mất mà không ai ký.
- **Hai nguồn lệch nhau = CR**, không phải chỗ agent tự chọn. Cả hai đều đã đóng băng và đều
  có người ký.
- **Register không phân xử chi tiết** - nó chỉ trả lời "có làm không".
- **SRS không phân xử phạm vi** - SRS mọc thêm tính năng ngoài register là phình phạm vi.

**Cổng giữ luật:** cổng cửa vào của 2.6 (MD-47). Issue phải tồn tại **trước** khi runner
code; lúc chưa có code thì không có gì để chép, tiêu chí buộc lấy từ SRS. Đây là chỗ duy
nhất luật này kiểm được bằng máy - phần còn lại là thứ tự làm việc, không phải thứ so sánh
được bằng script.

## MD-50 - 2.13 bảo đi một nước cờ mà bảng trạng thái cấm, và bản vá 2.6 chưa hề xuống dự án

Operator hỏi vì sao GitHub có 13 issue trong khi tôi nói 10. Đếm ra: 13 = P1.1 (4, `#20`-`#23`)
+ P1.4 (3, `#24`-`#26`, tạo sớm lúc P1.1 còn ôm cả `IF.JOBS.*`) + P1.2 (6, `#27`-`#32`); P1.3
còn 7 chưa tạo, tổng P1 = 20. Đọc `States` qua `/repos/.../issues/<n>` thì 10 cái ở `In Dev`,
3 cái ở `Ready for Dev` - board tự nó đã tách đúng hai nhóm. Không có lỗi số liệu.

Nhưng đi kiểm cái cổng đọc `States` thì lòi ra **hai lỗi khác nhau**, và cả hai đều là hậu
quả của một bản vá cũ làm nửa vời.

**Lỗi 1 - 2.13 hướng dẫn một nước đi bị `TRANSITIONS` cấm.** Văn bản 2.13 ghi: "Bắt đầu
deploy -> `Deploying`; verify-at-source xong -> `Done`". Vào 2.13 issue đang ở `UAT Testing`,
mà bảng cho phép từ `UAT Testing` chỉ `Done`/`In Dev`/`Cancelled` - **không có `Deploying`**;
và từ `Deploying` cũng không có `Done`. Làm đúng lời dặn thì `issue-state.mjs` chặn cứng hai
lần. Chưa ai phát hiện vì **2.13 chưa từng chạy**. Sửa: 2.13 đi thẳng `UAT Testing -> Done`,
kèm câu giải thích `Deploying` là môi trường TEST và đã tiêu ở 2.6.

**Lỗi 2 - bản vá 2.6 nằm ở harness nhưng chưa xuống autocontent.** Ba tháng trước operator
bắt được chỗ tôi xếp `Deploying` gần `Done`; tôi sửa `macro-2.md` và `STAGE_GOALS.md` của
harness, **và dừng ở đó**. Bản sao trong autocontent vẫn mang mô hình cũ: bước 3 bảo
`In Dev -> Ready for Test` (bỏ qua `Deploying`, là nước đi bất hợp lệ), danh sách chủ sở hữu
ghi "`Deploying` là 2.13", cổng đóng đòi `--expect "Ready for Test"`. Lượt chạy thật đâm
đúng vào đó: phiên chạy phải tự đối chiếu `issue-state.mjs`, phát hiện `Ready for Test`
không tới được, và sửa xuống `"In Dev"` giữa lượt.

**Cùng bản sao đó còn thiếu hẳn cổng cửa vào của MD-47** (10 dòng, mục `0.`). Nên P1.2 lặp
lại y nguyên lỗi trình tự của P1.1 - code trước, mở issue sau - và phiên chạy phải bắt tay
giữa chừng rồi tự ghi một dòng ma sát `goal-mo-ho`. Cổng đã tồn tại, đúng chỗ, chỉ là **chưa
bao giờ tới nơi cần dùng**.

**Bài học, và nó lớn hơn hai lỗi trên:** vá harness mà không re-propagate thì bản vá bằng
không - tệ hơn cả chưa vá, vì mình tưởng đã xong. Hai lần trong lượt chạy này người thật
phải trả giá bằng việc sửa tay giữa dòng cho một lỗi đã có bản vá nằm sẵn cách đó một
thư mục. `harness-drift.sh` báo được file lệch, nhưng không ai bắt buộc chạy nó sau khi
merge một PR harness. Đó là mắt xích còn hở.

## MD-51 - nguồn phạm vi có hai bản, và bản người đọc nói sai

Register là nguồn sự thật về **phạm vi** (MD-49). Nhưng nó tồn tại ở HAI bản -
`feature-register-source.json` (máy đọc) và `feature-register.md` (người đọc) - và
**không script nào sinh bản này từ bản kia**, không cổng nào so chúng.

Trên lượt chạy thật, bản `.json` khai `"phase": "Phase 2"` ở **cấp DÒNG** cho 8 tính năng,
đè lên `phase` cấp section là `Phase 1`. Bản `.md` bỏ qua khoá cấp dòng, in cả 8 thành
`Phase 1`. Một dòng còn tự nói ra trong chính tên nó: *"Kết nối và đăng video lên TikTok -
hoãn sang giai đoạn 2"*, cột Phase vẫn ghi Phase 1.

**Hậu quả đã xảy ra, không phải giả định:** `IF.PROVIDER.07` nằm trong 8 dòng đó,
`build-manifest.md` xếp nó vào P1.2, và nó đã ship (issue `#32`). Xây một thứ khách đã hoãn.
Chủ sản phẩm phán giữ lại và ghi nhận là giao sớm (CR-007) - nhưng không ai *phát hiện*
được nó cho tới khi có người ngồi đếm tay vì sao GitHub có 13 issue mà phạm vi P1.1+P1.2
chỉ 10.

**Ba lớp cùng mù một chỗ:**

1. Bản `.md` mất khoá cấp dòng lúc render.
2. Không cổng nào so hai bản.
3. `inScopeReqIds` (`gate-lib.mjs`) gom REQ-ID bằng `JSON.stringify(data.sections).match(RE)`
   - **không đọc `phase` một lần nào**. Nên gate cũng không phân biệt được Phase 1 với Phase 2.

**Đã vá lớp 1 và 2:** `check-register-phase.mjs` so từng dòng cột Phase giữa hai bản, lệch
là ĐỎ, và nói rõ nguồn là `.json` - lệch thì sửa `.md`, đừng sửa ngược (sửa `.json` cho khớp
bản in là bẻ khai báo phạm vi của khách). Fail-closed: parse ra 0 dòng ở bản nào cũng là ĐỎ.
Thử cả hai chiều trên dự án thật trước khi tin: bẻ lại một dòng -> đỏ đúng dòng đó; sửa
xong -> xanh 160 dòng. Nó cũng nêu 3 dòng CR chỉ có trong `.md` chưa ghi ngược vào `.json`.

**Lớp 3 chưa vá, và nói thẳng vì sao.** Cổng đúng phải là *"REQ-ID có phase phát hành muộn
hơn đợt đang xây thì không được nằm trong build-manifest của đợt này"*. Viết được, nhưng cần
một thứ dự án chưa có: bảng ánh xạ **build phase (P0..P20) -> release phase (Phase 1..5)**.
`ROADMAP.md § Release roadmap` có 5 đợt kinh doanh, build-manifest có 21 phase, không gì
nối chúng. Dựng bảng đó là việc của 2.3, không phải việc nhét vào một cổng. Ghi ra đây làm
mắt xích tiếp theo chứ không im lặng bỏ qua.

## MD-52 - dạng hỏng thứ ba: NGUỒN GIẢ. Công cụ đưa nhầm yêu cầu, mọi luật đều được tuân thủ

`req-issue-scaffold.mjs` là thứ agent dùng để lấy đoạn SRS trước khi viết tiêu chí chấp
nhận. Nó tìm mã trong SRS rồi trả về **mọi mục có nhắc tới mã đó** - kể cả nhắc chéo trong
một yêu cầu khác - và **không bao giờ kiểm xem mã có được KHAI BÁO ở đó không**.

Đo trên dự án thật, 15 REQ-ID của P1: **11 cái nhận về đoạn trích của yêu cầu khác.**
`IF.JOBS.07` nhận trích từ **8 file** và không có lấy một câu `shall` của chính nó.

**Đây là dạng hỏng thứ ba, và nặng nhất trong ba.**

| dạng | chuyện gì xảy ra | nhìn thấy được không |
|---|---|---|
| xanh giả (MD-12) | cổng báo xanh trên 0 mục | không, nhưng để lại lỗ hổng |
| đỏ giả (MD-28) | cổng báo đỏ oan, người đi sửa TÀI LIỆU cho vừa công cụ | có - ai cũng thấy màu đỏ |
| **nguồn giả (đây)** | agent đọc nguồn trước đúng như dặn, không chép code, trích dẫn trung thực - **và viết tiêu chí chấp nhận cho một yêu cầu khác** | **không.** Mọi luật đều được tuân thủ |

Hai dạng đầu còn để lại dấu vết. Dạng này không: không luật nào bị vi phạm, không cổng nào
đỏ, sản phẩm đầu ra trông hoàn toàn hợp lệ. Nó chỉ lộ ra khi có người ngồi hỏi *"đoạn trích
này có thật là của mã đó không"*.

**Bán kính ảnh hưởng trên việc đã commit:** 13 trong 20 issue của P1 viết từ đoạn trích sai
(P1.1 3/4, P1.4 3/3, P1.2 4/6). Đợt rà soát SRS ở `b26f219` cũng dùng chính công cụ này làm
nguồn so sánh - các bản sửa của nó trích đúng văn bản SRS thật nên rõ ràng có đọc thẳng file,
nhưng **các kết luận thì chưa tin được**, nhất là một kết luận *"không lệch"*. 7 issue của
P1.3 sạch, vì agent viết chúng không tin công cụ mà tự `awk` lấy khối khai báo rồi đối chiếu
trước khi tạo.

**Vá hai thứ, không phải một:**

1. Bám vào **dòng khai báo** `**<MÃ>**` ở đầu dòng, cắt tới khai báo kế tiếp hoặc heading
   kế tiếp. File chỉ nhắc mã thì trả về như tham chiếu chéo, **không kèm nội dung**.
2. **Không tìm thấy khai báo thì BÁO LỖI TO**, không trả đoạn gần đúng. Trả về một thứ nghe
   hợp lý chính là cái làm lỗi này tàng hình suốt một lượt chạy. Thử đường lỗi: mã bịa đặt
   -> từ chối; mã quy tắc nghiệp vụ `BR.DATA.12` (chỉ được nhắc, không được khai) -> từ chối
   kèm danh sách 8 file đã nhắc nó.

Đo lại sau khi vá: **20/20 REQ-ID trả đúng một khối khai báo, từ đúng một file.**

**Một lỗ cùng họ, vá luôn:** `check-issue-coverage.mjs` quét REQ-ID trong cả tiêu đề lẫn
thân issue. Thân issue trích nguyên văn SRS, mà một yêu cầu SRS thường nhắc chéo mã của yêu
cầu khác - nên một lần trích dẫn trung thực biến thành lời khai *"mã kia đã có issue"*, và
tới lượt phase của nó thì cổng im. Regex cũng không phân biệt `BR.PLF.01` với REQ-ID thật.
Giờ chỉ mã ở tiêu đề `[REQ-ID]` mới tính là phủ; tiêu đề không theo quy ước thì vẫn lùi về
quét thân bài nhưng in ra là đã lùi. Đo lúc vá: chưa issue nào dính - vá trước khi cháy.

## MD-53 - công cụ bắt lệch vẫn chạy suốt, và chưa từng nhìn thấy gì

Bài học của MD-50 là *"vá harness mà không đẩy xuống thì bản vá bằng không"*. Câu hỏi tiếp
theo phải là: **đã có công cụ nào bắt chuyện đó chưa?** Có. `harness-drift.sh`. Nó vẫn nằm
đó, vẫn chạy được. Đi kiểm thì ra ba tầng hỏng chồng lên nhau.

**Tầng 1 - nó không tìm thấy harness.** Script chỉ đoán tên `vibecode-harness`, cái tên repo
đã đổi. Gõ trần thì in "no harness found" rồi thoát. Provenance cũng không cứu:
`harness_source` ghi `/home/nghia/vibecode-harness` - đường dẫn trên máy của người đã cài
kit, không phải máy đang chạy. Ba đường tìm, chết cả ba.

**Tầng 2 - nó chưa từng nằm trong bộ harness.** File chỉ tồn tại trong một dự án. Dự án khác
không hề có công cụ này. Công cụ chống drift mà bản thân nó không được phát hành.

**Tầng 3 - và đây mới là tầng giết nó. Nó kêu sai quá nhiều.** Chỉ đúng đường dẫn cho nó rồi
chạy: **83 file "cần xử lý"**. Ngồi đọc từng cái thì số lệch thật là **6**, và cả 6 đều
không cần sửa. 77 dòng còn lại là nhiễu, từ ba nguồn:

| nguồn nhiễu | số dòng | nó là gì |
|---|---|---|
| harness dọn lại thư mục (`docs/X.md` -> `docs/about/X.md`) | 51 | file vẫn nằm đó, ở đường dẫn cũ |
| dự án chạy prettier trên markdown, harness thì không | 20 | `*chữ*` -> `_chữ_`, căn lề bảng, `+` -> `-`, định dạng lại code trong tài liệu |
| tài liệu nội bộ của harness | 5 | nói về chính bộ harness, dự án không cần |

**Bản báo cáo kêu sai 77 lần thì lần thứ 78 kêu đúng cũng không ai nghe.** Đó chính xác là
chuyện đã xảy ra: công cụ chạy, in ra 83, mọi người thôi đọc - trong khi một bản vá 2.6 nằm
im không được đẩy xuống suốt nhiều tuần, và lượt chạy thật phải trả giá hai lần.

**Vá bốn thứ:**

1. Tìm harness theo: tham số, `$HARNESS_REPO`, provenance nếu đường dẫn đó có thật, rồi các
   bố cục thường gặp dưới cả hai tên. Không thấy thì **in ra đã thử những đâu** - danh sách
   đoán chỉ có ích khi người ta nhìn được nó.
2. Đưa script vào `scaffolds/` để dự án nào cũng có.
3. **So theo chuỗi ký tự, bỏ hết bố cục.** So theo dòng không bắt được prettier bẻ
   `page.locator(x).filter(y)` thành ba dòng; so theo từ cũng không, vì một từ bị tách làm
   ba. Buồng riêng `FORMAT-ONLY`, không tính vào số phải xử lý. Đánh đổi đã biết và chấp
   nhận: thay đổi chỉ ở dấu câu sẽ bị coi là không đổi - câu hỏi của bản báo cáo này là
   "nội dung có đổi không", còn "byte có đổi không" thì `git diff` trả lời rồi.
4. **Khai tài liệu nội bộ ra một file đọc được** (`docs/about/not-shipped-to-projects.md`),
   không nhét danh sách bỏ qua vào trong script. Danh sách bỏ qua mà không ai biết nó tồn
   tại thì lần sau lại có người đi tìm "sao file này không bao giờ báo thiếu".

**83 -> 6**, cùng một dự án, cùng một thời điểm, không đồng bộ thêm file nào.

**Còn hở, ghi ra chứ không giấu:** một file cổng khi dự án **điền vào** (`dor-build.md` có
dòng "Checklist (AutoContent, filled at step 2.3)" với các ô đã tick) thì nó thành hồ sơ của
dự án, không còn là bản mẫu. Công cụ không có cách nào biết, nên báo `BOTH` mãi. Đè lên là
xoá hồ sơ đã ký. Cần một cách để dự án khai "file này giờ của tôi" - chưa làm.

## MD-54 - phép kiểm mang tên một yêu cầu mà không làm việc của yêu cầu đó

Ba lần trong cùng một tối, cùng một hình dạng:

| chỗ | nó khai gì | sự thật |
|---|---|---|
| `outcome-classifier.ts:39-42` | "lỗi nhà cung cấp không ánh xạ được sẽ phát tín hiệu cho vận hành - chỗ phát là `console.error` trong `generate-job.ts`" | đọc hết `generate-job.ts`, không có chỗ gọi nào |
| AC 5 của issue `#22` | job chưa ở kho lỗi mà gọi chạy lại thì trả 409 | chép đúng hành vi code lúc đó; SRS `IF.JOBS.04` đòi job **đã thành công** phải resolve `already_done`, không phải lỗi |
| `provider-config.ts:73` + 3 test | khối mang nhãn "`IF.PROVIDER.07` boot-time validation" | chỉ khẳng định route có `primary` và `deadlineMs` dương. Nghĩa vụ thật - *"nhà cung cấp không mang nổi ràng buộc thì không được cấu hình làm dự phòng"* - **không kiểm**, và không kiểm được, vì `ProviderAdapter` chưa khai khả năng nào cả |

Ba cái đều đi qua mọi cổng. `check-issue-coverage` chỉ đếm **có** issue cho mỗi REQ-ID.
`new-issue.mjs --check` chỉ đếm đủ 5 khối và 13 mục DoD. `check-ac-coverage` chỉ hỏi có
test nào **nhắc tên** REQ-ID không. Cả ba đều xanh với một phép kiểm sai.

**Một phép kiểm yếu đeo tên của yêu cầu còn tệ hơn một ô trống**, vì ô trống thì nhìn thấy
được. Ô trống bắt người ta đi làm; cái nhãn đúng trên việc sai bắt người ta đi tiếp.

**Và cái này KHÔNG viết được thành script.** Hỏi "test này có khẳng định đúng thứ yêu cầu
đòi không" là câu hỏi ngữ nghĩa. Viết một cổng giả vờ trả lời được nó chính là đẻ thêm một
cái nhãn đúng trên việc sai - đúng con bệnh đang chữa.

**Nên vá ở chỗ đúng: hợp đồng của verifier độc lập** (`docs/gates/phase-acceptance.md`),
nơi vốn dĩ là *"prose contract the agent executes"*. Thêm một nghĩa vụ tường minh: với mỗi
REQ-ID, verifier **mở dòng khai báo trong SRS ra đọc**, rồi hỏi phép kiểm mang tên đó có
khẳng định đúng điều SRS đòi không. Yếu hơn thì là **lỗi**, không phải "làm được một phần" -
và phải gỡ nhãn REQ-ID khỏi nó, để nó quay về là một ô trống nhìn thấy được.

Cùng luật đó áp cho comment: comment tự khai một hành vi thì hành vi đó phải tồn tại, hoặc
comment phải nói thẳng là chưa có.

**Ngân sách lượt của bước rà soát - đo hai lần, sai cả hai.** Bước rà soát ghi 40 lượt;
lượt đầu tốn 50, lượt rà lại tốn 49. Phân bổ lượt hai: 18 lượt chỉ để **đọc nguồn trước khi
mở code** (10 đoạn SRS, 10 body issue, register, bản kê thi công), 15 lượt đọc code, 10 lượt
sửa và thêm test, 6 lượt cổng và ghi sổ. Con số 18 kia không cắt được - nó chính là luật
"đọc nguồn trước". Ngân sách phải trả tiền cho luật của chính nó: **50 lượt cho một lượt rà
soát ~10 REQ-ID**, và ghi rõ 18 trong số đó là đọc nguồn.

