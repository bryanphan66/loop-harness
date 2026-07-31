# Hiểu loop-harness (đọc từ trên xuống)

Đây là bản **dẫn dắt tường minh** cho người mới (dev hoặc chính bạn khi quên). Đọc 1 mạch là nắm toàn cảnh: loop-harness LÀ GÌ, chạy THẾ NÀO, phần nào **đã chứng minh** vs **còn nợ**. Khác 2 file kia: [`KEYWORD-MAP.md`](./KEYWORD-MAP.md) = từ điển tra cứu; [`OPERATING-MODES.md`](./OPERATING-MODES.md) = đặc tả chính xác 2 mode. File này = **câu chuyện + đánh giá thành thật**, trỏ về 2 file đó khi cần chi tiết.

> **Sự thật cần biết trước:** loop-harness được **bồi đắp sau mỗi dự án + đúc kết kinh nghiệm**, KHÔNG phải chuẩn thiết kế sạch từ đầu. Nên có phần rất vững (đã dogfood), có phần còn nặng/vay mượn, có phần chưa build. File này gắn nhãn rõ để bạn biết tin phần nào tới đâu.

## Nhãn thành thật (đọc mọi mục theo nhãn này)
- **PROVEN** — đã chạy thật, kiểm chứng trên dự án (elearning/hasi-hub). Tin được.
- **PATCHED** — sinh ra từ 1 lần bị đau rồi vá thành luật; đúng nhưng có thể còn nặng/đặc thù.
- **ASPIRATIONAL** — mới thiết kế, **chưa build**. Đừng tưởng đã có.

---

## 1. loop-harness là gì (1 đoạn)

Một **harness** (khung vận hành cho AI agent) biến 1 spec thành app chạy được, rồi nuôi app đó tiến hoá. **Đích thành công**: sản phẩm ngang chất lượng hasi-hub (pnpm monorepo, NestJS+Prisma+Postgres, Next.js, CI xanh, deploy được). Nó chạy trên **agent + git + bash trần** — skill chỉ tăng tốc, không bắt buộc.

## 2. XƯƠNG SỐNG DUY NHẤT: 2 chế độ, cắt tại go-live

Trước đây harness mô tả vòng đời bằng **3 cách chồng nhau** (3-macro, 2-mode, 4-bậc) → gây rối. **Từ nay lấy 2-mode làm xương sống chính**; 2 cái kia hạ vai (xem §6).

```
   MODE A — BUILD (hữu hạn)                 ┃  MODE B — THE LOOP (vô hạn)
   spec → app chạy được, deploy được        ┃  nuôi app sống, mỗi thay đổi = 1 issue
   đơn vị việc: 1 PHASE                      ┃  đơn vị việc: 1 ISSUE (có AC)
   lệnh: /stage-next, /build-phase           ┃  lệnh: dispatch coder/issue → QC → đổi state
   theo dõi: STAGE.md "bước hiện tại"        ┃  theo dõi: bảng issue (10 state)
   ───────────────────────── GO-LIVE ─────────────────────────
                    (app deploy lên env thường trực đầu tiên = điểm tốt nghiệp)
```

**Điểm dễ lẫn NHẤT — nhớ kỹ:** *"quy tắc tạo issue theo AC từng module"* nằm ở **Mode B**, KHÔNG ở Mode A. Mode A chạy theo **phase**, không theo issue. Chỉ sau go-live mọi thay đổi mới thành issue.

---

## 3. Mode A — Build (chi tiết + nhãn)

Dòng chảy 1 chiều biến spec thành app. **Đây là chỗ "3-macro" cũ sống tiếp — nhưng chỉ như SỐ THỨ TỰ BƯỚC bên trong Mode A** (bước 1.x = chuẩn bị, 2.x = build, 3.x = sau go-live), không còn là 1 xương sống riêng.

**Mạch xuyên suốt (4 mắt xích hay bị mơ hồ):**
```
spec → REQ-ID → BUILD MANIFEST → stack template → walking skeleton → /build-phase lặp
```
1. **REQ-ID / token chain** `PATCHED` — đánh số bền mỗi yêu cầu (`CM.CRUD.01`), truy vết `GAP→REQ-ID→SC→TC` (owner [`TRACE_SPEC.md`](./TRACE_SPEC.md)). *Phản biện: đúng cho việc-có-hợp-đồng (chứng minh với khách); với tool nội bộ là nghi thức thừa → dùng **Lane Lite** để bỏ bớt.*
2. **BUILD MANIFEST** `PROVEN` — `docs/build-manifest.md`, xếp mọi REQ-ID vào các phase P0..PN theo thứ tự thi công. Biến "đống spec" thành "hàng đợi phase".
3. **stack template** `PROVEN (design) / PATCHED (bug)` — `harness/templates/stack-pnpm-nest-next/`, bộ khung code mẫu hình hasi-hub. *Phản biện: 3 bug chỉ lộ khi dogfood proof-run → template chỉ đáng tin SAU khi bị ép chạy thật, không phải vì có mặt.*
4. **walking skeleton** `PROVEN` — app tối thiểu **chạy thật đầu-cuối** (login + 1 CRUD + seed + CI xanh) dựng ở bước 2.4. Chứng minh đường ống thông TRƯỚC khi đắp thịt.
5. **`/build-phase`** `PROVEN` — vòng lặp code 1 phase (code → `validate:quick` → e2e smoke → ghi verification-register → commit). Lặp tới hết manifest.

**Gate Mode A** `PROVEN`: verify-gate (git-hook không bypass), PB-G1..G4 (paging khách/chủ), DoR/DoD, phase-acceptance. Chi tiết: [`WORKFLOW.md`](./WORKFLOW.md).

**Lane Full vs Lite** `PATCHED` — Full = việc khách trả tiền (BA đầy đủ); Lite = nội bộ (SRS-lite 1 file, bỏ REQ-ID nặng). *Phản biện: sự tồn tại của Lite là bằng chứng base process quá nặng nên phải bịa lối tắt.*

## 4. Mode B — the loop (chi tiết + nhãn)

Bắt đầu ngay khi app go-live. Không còn "bước hiện tại"; có **hàng đợi issue ở nhiều state song song**. Đây là **phần VỮNG NHẤT** của harness vì mỗi luật = 1 lần bị đau đã kiểm chứng trên elearning (xem [`../../docs/lessons-log.md`](../../docs/lessons-log.md)).

**6 nhịp vòng lặp** `PROVEN` (trừ recover): discover (bug/change → 1 issue) → dispatch (1 coder/issue, worktree riêng) → verify (verify-at-source + gate + QC checklist) → **recover** → persist (bảng 10-state) → decide-next (QC pass thì tiến, fail theo luật vàng). Bản đầy đủ: [`playbooks/steady-state-issue-pipeline.md`](./playbooks/steady-state-issue-pipeline.md).

**Luật đã đổ máu** (nhớ kỹ, mỗi cái từng gây bug thật):
- **10-state** `PROVEN/⚠️` — Backlog→Ready for Dev→In Dev→Deploying→Ready for Test→QC Testing→Ready for UAT→UAT Testing→Done (+Cancelled). Issue **chỉ đóng ở Done**. *Phản biện: 10 state hơi nhiều cho 1 QC solo; nhiều nhóm dùng 4-5.*
- **Luật vàng QC fail** `PROVEN` — lỗi TRONG AC → lùi In Dev sửa issue cũ; lỗi NGOÀI AC → issue mới.
- **Refs-not-Closes** `PROVEN` — tham chiếu `Refs #N` ở CẢ PR body VÀ commit message (squash gộp keyword → `Closes` đóng nhầm).
- **verify-at-source** `PROVEN` — sau deploy, container đang chạy phải mang đúng commit. Không tin CI-xanh/HTTP-200.
- **Issue Type vs Label** `PROVEN` — Feature/Bug/Enhancement = **Issue Type**; label CHỈ `github`+`plane`; Module=body; Phase=Milestone. Chuẩn tạo issue: [`playbooks/github-issue-standard.md`](./playbooks/github-issue-standard.md).

**Recover (Frontier 1):** R2 `push-retry.sh` `PROVEN` (retry push flaky), R3 `ship-and-verify.sh` `PROVEN` (verify SHA staging, re-trigger 1 lần, mở drift issue), **R1 auto re-dispatch khi BLOCKED** `ASPIRATIONAL` (chưa build — đừng tưởng đã có).

## 5. Kho tri thức — kinh nghiệm/CICD/R2 lưu ở ĐÂU

4 kho, mỗi kho 1 vai. Đây là chỗ hay nhầm "chấp vá" — thực ra chỉ cần nhớ ranh giới:

| Kho | Chứa | Ví dụ R2/CICD | Ở đâu |
|---|---|---|---|
| **playbook** `PROVEN` | công thức **TÁI DÙNG** mọi dự án | *cách deploy verify-at-source, cách wire S3, mẫu R2/R3* | `harness/docs/playbooks/` + `harness/templates/steady-state/scripts/` |
| **runbook** `ASPIRATIONAL` | cấu hình/kinh nghiệm **RIÊNG 1 dự án** | elearning's **CICD thật, bucket R2 thật, deploy host, biến `deploy.*`** | trong repo dự án đó (`docs/` + `scripts/` + `git config`) |
| **lessons-log** `PROVEN` | sai lầm→nguyên nhân→luật | *chart rỗng = lỗi CSS không phải data* | `loop-harness/docs/lessons-log.md` |
| **memory** `PROVEN` | fact bền của CONTROL qua phiên | *elearning deploy 2 env Dokploy+Kamal* | `~/.claude/.../memory/` |

**Chốt R2 cho hết mơ hồ:** *mẫu tái dùng* R2/R3 ở **harness** (playbook/template); *R2 đã wire thật của elearning* ở **repo elearning** (runbook). "Cách làm chung" ở harness; "cấu hình cụ thể 1 dự án" ở repo dự án đó.

### 5b. Chuẩn hoá RUNBOOK (phần harness đang NỢ — `ASPIRATIONAL`)
Hiện runbook **chưa có định nghĩa + index**, nằm rải rác trong docs mỗi dự án → đây chính là "chấp vá" bạn cảm nhận. Chuẩn từ nay: **mỗi dự án phải có thư mục `docs/runbook/`** với tối thiểu:
- `deploy.md` — env nào, deploy bằng gì, verify-at-source cách nào, rollback 1-dòng.
- `config.md` — biến môi trường + secret NAMES (không value), object-storage/R2 bucket, external key names.
- `cicd.md` — pipeline chạy gì, gate nào chặn, cách chạy lại.
- `seed-and-data.md` — seed thế nào, reset thế nào, tài khoản mẫu.
> Runbook = "sổ vận hành riêng của dự án này". Playbook = "cách làm chung ai cũng dùng". Khi 1 runbook lặp lại ở nhiều dự án → cất lên thành playbook.

## 6. Hai xương sống cũ giờ ở đâu (không xoá, chỉ hạ vai)

- **3-macro (Pre/Build/Post)** — hạ thành **số thứ tự bước bên trong Mode A/B** (1.x/2.x = Mode A; 3.x = go-live + Mode B). KHÔNG còn là mô hình ngang hàng. *Phản biện: đây là tầng cũ nhất, nặng nhất; giữ số bước cho tiện tra WORKFLOW, bỏ vai "xương sống".*
- **Loop Engineering (4 bậc: prompt→context→harness→loop)** — hạ thành **hộp tư duy để CHẨN ĐOÁN** "harness trưởng thành tới đâu, thiếu tầng nào" (VD Recover yếu = bậc loop chưa đầy). Là **cái kính nhìn**, không phải bước phải chạy. *Phản biện: mới thêm tuần trước, chủ yếu dán nhãn lại; hữu ích để định vị, đừng để ngang hàng mô hình vận hành.*

## 7. Scorecard thành thật (đưa dev khác xem cái này)

| Vững (PROVEN, tin được) | Còn nặng/đặc thù (PATCHED) | Chưa build (ASPIRATIONAL) |
|---|---|---|
| Mode B loop + 6 luật đổ máu | 3-macro legacy (đã hạ vai) | R1 auto re-dispatch khi BLOCKED |
| build-manifest, walking skeleton | REQ-ID nặng cho nội bộ (→Lane Lite) | runbook tier (định nghĩa ở §5b) |
| R2/R3, verify-at-source | 10-state hơi nhiều cho QC solo | proof deploy qua pipeline từ xa (mới chỉ prod-stack local) |
| stack template (sau khi dogfood) | Loop Engineering (dán nhãn lại) | |

## 8. Dev mới bắt đầu thế nào
1. Mở session: `cd ~/Desktop/Workspace/loop-harness && claude` (context tự nạp từ `CLAUDE.md`).
2. Đọc theo thứ tự: file này → [`OPERATING-MODES.md`](./OPERATING-MODES.md) → [`WORKFLOW.md`](./WORKFLOW.md) → [`playbooks/README.md`](./playbooks/README.md).
3. Dựng dự án mới: `harness/scripts/install-harness.sh --bootstrap --spec ./spec.md ./my-project` → chạy `/stage-next` lặp tới go-live → chuyển sang vòng lặp issue.
4. Tra nhanh 1 keyword: [`KEYWORD-MAP.md`](./KEYWORD-MAP.md).
