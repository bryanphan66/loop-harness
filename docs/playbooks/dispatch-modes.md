# Bung việc bằng gì: subagent, phiên nền, headless, worktree

**Lifecycle:** stable · **First use:** Macro 2 step 2.6 · **Verified by:** CLI 2.1.261 trên macOS 2026-09-05

> Chọn sai chế độ chạy là mất giờ vào đúng những chỗ đã có sẵn công cụ: worker treo
> ở prompt xin quyền, hai agent sửa cùng file đá nhau, hoặc dựng tay một thứ CLI
> đã có cờ. Playbook này chốt bốn chế độ và khi nào dùng cái nào.

**Macro-stage / step:** always-on cả ba macro; dùng nhiều nhất ở **2.6** (`/build-phase`)
và **2.9/2.10** (QA). **Gate it serves:** none - đây là cách làm, không phải cổng.

## Trước khi dispatch một lượt chạy KHÔNG NGƯỜI TRỰC - hai thứ, làm trước, không phải sau

**1. Giữ máy thức suốt thời lượng chạy.**

```bash
nohup caffeinate -dimsu -t 21600 >/dev/null 2>&1 &   # 6 tiếng
```

Đo trên một lượt chạy đêm thật: `pmset -g` cho `sleep 1` - máy ngủ sau **một phút** không
dùng. Có `caffeinate` nhưng là loại `-t 300` do công cụ tự bật theo từng thao tác, không
cái nào giữ suốt phiên. Hễ phiên im lặng chờ một lệnh nền (một mẻ 14 lượt gọi API GitHub)
là máy ngủ, và log chỉ để lại đúng một dòng:

```
API Error: Your computer went to sleep mid-response.
```

Xuất hiện **hai lần trong một đêm**. Không có dòng này thì sáng ra nhìn vào khoảng trống hai
tiếng và không hiểu vì sao. Bật `caffeinate` TRƯỚC khi dispatch, không phải sau khi mất bài.

**2. Lệnh mà worker sẽ chạy không được phép treo.**

Script test phải có `--forceExit` (jest) hoặc timeout. Treo vô hạn cộng với watchdog bằng
**agent chết câm**: đo được trên cùng đêm đó, `test:e2e` thiếu `--forceExit` làm **hai agent
build chết đứng liên tiếp** ở đúng một bước (watchdog 600s, mất ~2,5 tiếng), và **không con
nào chẩn được gì** vì chúng chết trước khi kịp báo.

> **Agent chết ở watchdog thì ĐỪNG thả con thứ hai vào cùng chỗ.** Luật "không lặp lại cùng
> cách sau khi BLOCKED" viết cho trường hợp agent BÁO blocked; chết câm thì không có báo cáo
> nào để đọc nên luật không kích hoạt. Điều phối viên phải **tự chạy lệnh cuối cùng nó chạm
> tới** trước khi thả con tiếp theo. Một lượt chạy tay 5 giây tìm ra thứ mà hai agent và 2,5
> tiếng không tìm ra.

## Chạy nhiều luồng cho Macro 2 - mượn nguyên vòng lặp đã chạy tốt của Mode B

Mode B (sau go-live) từ lâu chạy kiểu này và chạy tốt trên VPS thật:

> Control session dispatch **một worker cho một issue, mỗi worker một worktree riêng**; code
> xong thì merge, chạy `ship-and-verify.sh`, rồi **dọn session và worktree**.

Macro 2 (trước go-live) thì đến giờ vẫn chạy **một luồng nối đuôi**. Đo trên một lượt chạy
thật: hai ngày, một worker tại một thời điểm, trong khi `P2.5` chỉ phụ thuộc `P0` - tức chạy
song song được với cả nhánh `P2.2/P2.3/P2.4` **ngay từ đầu** mà vẫn xếp hàng chờ.

**Vì sao lâu nay không mượn được, và vì sao giờ mượn được.** Mode B nhận issue rời rạc, độc
lập sẵn - nhìn là biết cái nào chạy riêng. Macro 2 thì nhóm con nối nhau, và **không ai viết
ra cái nào độc lập**. Không biết độc lập thì không dám tách worktree. Từ khi 2.3 đẻ ra **bản
đồ chạy** (đồ thị chặn + luồng song song + đường găng + điểm gộp), Macro 2 có đúng thứ Mode B
vốn có: một tập việc **biết chắc** là không đụng nhau.

### Vòng lặp

```
điều phối đọc bản đồ chạy của phase
  → mỗi luồng: dựng worktree + nhánh riêng, giao MỘT nhóm con
  → luồng xong: merge về nhánh chính, XÁC NHẬN đã merge, rồi mới xoá worktree + session
  → tới điểm gộp: chạy verifier độc lập, sửa STAGE.md, đóng phase
```

### Ba chỗ phải sửa khi bê từ Mode B sang, đừng bê nguyên xi

1. **Đơn vị giao việc là NHÓM CON, không phải issue.** Mode B giao một issue vì mỗi issue là
   một việc rời. Macro 2 giao một nhóm con - mà sau khi gom (`STAGE_GOALS.md` § 2.6) nhóm con
   chính là một issue, nên hai bên khớp nhau, không phải sửa gì.

2. **`STAGE.md` chỉ được sửa ở ĐIỂM GỘP.** Đây là chỗ vênh thật giữa hai mode. Macro 2 đòi mỗi
   phase đóng bằng một commit **có advance `STAGE.md`**; ba luồng cùng sửa file đó là đụng nhau
   ngay. Luồng chỉ commit code và issue của nó; `STAGE.md` do điểm gộp sửa, một lần.

3. **Dọn dẹp CHỈ sau khi đã xác nhận merge.** `claude rm <id>` **xoá luôn worktree và nhánh**
   của session - đã mất việc chưa merge vài lần trên dự án thật (`~/.claude/LESSONS.md`). Thứ
   tự bắt buộc: merge → kiểm đã merge (`git branch --merged` hoặc so SHA) → rồi mới xoá. Đảo
   thứ tự là mất code, và mất im lặng.

### Cạm bẫy: `.harness/` KHÔNG theo worktree

`.harness/` nằm trong `.gitignore` (nó là hiện vật cài đặt, không phải mã nguồn). Nên
`git worktree add` **không mang nó sang**. Trong worktree mới:

- `check-referenced-tools` và `check-issue-state-path` **đỏ giả** - chúng tìm
  `.harness/steady-state/scripts/*` không thấy;
- **husky pre-commit chặn MỌI commit** trong worktree đó, vì `lint:gates` đỏ.

Người gặp sẽ tưởng code mình sai. Thật ra là thiếu một thư mục mà git cố tình không chép.

**Sau mỗi `git worktree add`, chép `.harness/` từ cây chính sang:**

```bash
git worktree add .claude/worktrees/<ten> -b lane/<ten>
cp -R .harness .claude/worktrees/<ten>/          # gitignored, không vào commit
```

Đừng "sửa" bằng cách bỏ `.harness/` khỏi `.gitignore`: nó là bản NHÚNG của bộ kit, và bản
nhúng vào git thì bắt đầu trôi khác bản đang dùng - đúng con bệnh `EMBED-DRIFT` mà
`harness-drift.sh` sinh ra để bắt.

### Rộng bao nhiêu

Đường găng trong bản đồ chạy là **sàn**: thêm luồng nữa không làm phase ngắn hơn nó. Chia
luồng theo **thư mục mỗi luồng đụng tới**, không theo số nhóm con - hai luồng cùng sửa
`apps/api` là hai luồng đá nhau dù bản đồ nói chúng không chặn nhau.

## Chọn nhanh

| Cần gì | Dùng | Vì sao |
|---|---|---|
| Chẻ một việc, muốn báo cáo chứ không muốn đống file đổ vào ngữ cảnh | **subagent** (Agent tool) | cùng phiên, không cần cấp quyền gì thêm |
| Việc dài, muốn bỏ đi làm chuyện khác rồi quay lại | **`claude --bg`** | trả id ngay, `claude agents` liệt kê, `attach` xem lại |
| Một câu hỏi / một file sinh ra, gọi từ script hay CI | **`claude -p`** | in kết quả rồi thoát, ghép pipe được |
| Nhiều việc sửa **cùng** file | **`--worktree`** | mỗi việc một cây làm việc riêng, không đá nhau |
| Ngồi trực nhiều repo | **`ctl <repo>`** | tmux: cửa 0 phiên claude, cửa 1 màn theo dõi. Đây là **ghế ngồi**, không phải chế độ chạy |

## 1. Subagent - mặc định, rẻ nhất

`/build-phase` dùng cái này (`subagent_type: stage-runner`). Chạy **trong phiên**, có
ngữ cảnh riêng 200K, trả về báo cáo chứ không đổ file vào ngữ cảnh của phiên chính.

- **Không cần `settings.local.json`, không cần permission-mode.** Đây là lý do 2.6
  chạy được ngay cả khi máy chưa cấu hình quyền gì.
- Song song được, **nhưng chỉ khi các subagent không đụng cùng file**. Đụng cùng file
  thì mỗi đứa một worktree.
- Đưa ngữ cảnh **có phạm vi**: đường dẫn gốc repo, file cần đọc/sửa, tiêu chí xong,
  ràng buộc. Không kể lại lịch sử hội thoại.

## 2. Phiên nền `claude --bg` - việc dài, bỏ đi được

```bash
cd <repo> && claude --bg "<việc đã khoanh vùng>" --permission-mode bypassPermissions
claude agents --json --all     # liệt kê
claude attach <id>             # mở lại trong terminal này
claude logs|stop|rm <id>       # xem log · dừng mềm · giết hẳn
claude --bg --resume <id> "…"  # chạy tiếp chính phiên đó ở nền
```

- **Prompt để ở vị trí positional. KHÔNG kèm `-p`.** CLI chặn thẳng và nói rõ lý do:
  *"--bg and --print conflict: --print never starts the interactive session that
  `claude agents` attaches to, so the job would be unattachable."*
- **Quyền là nút thắt.** `acceptEdits` **không** tự duyệt lệnh bash, nên worker
  không người trực vẫn treo ở prompt xin phép và rơi vào trạng thái `blocked`.
  Worker chạy một mình cần `bypassPermissions` **hoặc** một danh sách cho phép.
- `bypassPermissions` = tắt cổng. Khi tắt, hàng rào dời sang **prompt có phạm vi +
  gate kiểm chứng** - task phải ghi rõ cấm push/merge/prod nếu chưa cho phép.
- **Ít quyền hơn, làm được:** `--allowed-tools` / `--disallowed-tools` cấp đúng thứ
  cần thay vì mở toang. Ví dụ worker chỉ đọc:
  `claude --bg "<việc>" --allowed-tools Read Grep Glob Bash`
- Đăng nhập hết hạn thì **chết cả đàn** - `/login` rồi chạy lại.

## 3. Headless `claude -p` - một phát, ghép pipe

Dùng khi đầu ra là **một kết quả**, không phải một phiên làm việc: tóm tắt log gate,
sinh một file, trả lời một câu trong script CI.

```bash
claude -p "Tóm tắt lỗi trong log này thành 3 gạch đầu dòng" < gate.log
claude -p --output-format stream-json --max-turns 3 "<việc>"
```

- `--output-format json|stream-json` để script đọc máy; `--input-format` nhận đầu vào máy.
- `--max-turns` chặn trần lượt - **luôn đặt** khi gọi từ script, không thì một việc
  hiểu sai đề chạy mãi.
- Hộp thoại tin cậy thư mục bị bỏ qua ở chế độ này. Tiện, nhưng nghĩa là **đừng trỏ
  `-p` vào thư mục lạ**.
- `--bare` bỏ hook, LSP, auto-memory, tự đọc CLAUDE.md - dùng khi muốn một lần chạy
  sạch, không chịu ảnh hưởng cấu hình máy.

## 4. Cách ly: worktree

Hai việc sửa cùng file thì phải tách cây làm việc, không có cách khác.

```bash
claude -w <tên>            # tạo git worktree mới cho phiên này
claude -w <tên> --tmux     # kèm tmux cho cây đó
```

Trong phiên thì dùng `EnterWorktree` / `ExitWorktree`. Subagent chạy song song có
`isolation: "worktree"`.

## Sai lầm đã trả giá

| triệu chứng | nguyên nhân thật |
|---|---|
| worker nền `blocked`, không nhúc nhích | `acceptEdits` không duyệt bash; thiếu quyền -> treo ở prompt |
| `claude agents` không thấy job vừa bung | lỡ kèm `-p` - phiên không tồn tại để gắn vào |
| hai agent ghi đè bài của nhau | sửa cùng file mà không tách worktree |
| cả đàn worker chết cùng lúc | đăng nhập hết hạn |
| dựng tay một cơ chế CLI đã có | không đọc `claude --help` trước |

## Dùng ở đâu trong Macro 2

- **2.6** - `/build-phase` bung **subagent** một phase một lần. Không cần cấu hình quyền.
- **2.9 / 2.10** - QA và kiểm thử có thể gọi `-p` từ script để lấy kết quả về dạng máy đọc.
- **Sửa song song nhiều phase** - mỗi phase một **worktree**, không thì đá nhau.
- **Ngồi trực** - `ctl <repo>`. Không phải chế độ chạy, chỉ là chỗ ngồi.
