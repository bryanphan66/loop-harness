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
