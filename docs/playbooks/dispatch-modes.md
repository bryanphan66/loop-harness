# Bung việc bằng gì: subagent, phiên nền, headless, worktree

**Lifecycle:** stable · **First use:** Macro 2 step 2.6 · **Verified by:** CLI 2.1.261 trên macOS 2026-09-05

> Chọn sai chế độ chạy là mất giờ vào đúng những chỗ đã có sẵn công cụ: worker treo
> ở prompt xin quyền, hai agent sửa cùng file đá nhau, hoặc dựng tay một thứ CLI
> đã có cờ. Playbook này chốt bốn chế độ và khi nào dùng cái nào.

**Macro-stage / step:** always-on cả ba macro; dùng nhiều nhất ở **2.6** (`/build-phase`)
và **2.9/2.10** (QA). **Gate it serves:** none - đây là cách làm, không phải cổng.

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
