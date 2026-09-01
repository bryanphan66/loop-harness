# loop-harness — Hiểu, vận hành & mở rộng (đọc ĐẦU TIÊN)

*Gồm cả phần "cất tri thức mới ở đâu + tái dùng + mở rộng" (trước ở EXTENDING.md, đã gộp về đây).*

Đây là bản **dẫn dắt tường minh** cho người mới (dev hoặc chính bạn khi quên). Đọc 1 mạch là nắm toàn cảnh: loop-harness LÀ GÌ, chạy THẾ NÀO, phần nào **đã chứng minh** vs **còn nợ**. Khác 2 file kia: [`KEYWORD-MAP.md`](./KEYWORD-MAP.md) = từ điển tra cứu; [`OPERATING-MODES.md`](./OPERATING-MODES.md) = đặc tả chính xác 2 mode. File này = **câu chuyện + đánh giá thành thật**, trỏ về 2 file đó khi cần chi tiết.

> **Sự thật cần biết trước:** loop-harness được **bồi đắp sau mỗi dự án + đúc kết kinh nghiệm**, KHÔNG phải chuẩn thiết kế sạch từ đầu. Nên có phần rất vững (đã dogfood — tự dùng sản phẩm mình làm để kiểm), có phần còn nặng/vay mượn, có phần chưa build. File này gắn nhãn rõ để bạn biết tin phần nào tới đâu.

## Nhãn thành thật (đọc mọi mục theo nhãn này)
- **PROVEN** (đã kiểm chứng) — đã chạy thật, kiểm chứng trên dự án (elearning/hasi-hub). Tin được.
- **PATCHED** (vá-từ-bài-học) — sinh ra từ 1 lần bị đau rồi vá thành luật; đúng nhưng có thể còn nặng/đặc thù.
- **ASPIRATIONAL** (chưa-làm) — mới thiết kế, **chưa build**. Đừng tưởng đã có.

---

## 1. loop-harness là gì (1 đoạn)

Một **harness** (khung vận hành cho AI agent) biến 1 spec (đặc tả yêu cầu) thành app chạy được, rồi nuôi app đó tiến hoá. **Đích thành công**: sản phẩm ngang chất lượng hasi-hub (pnpm monorepo, NestJS+Prisma+Postgres, Next.js, CI (Continuous Integration — tự động tích hợp) xanh, deploy được). Nó chạy trên **agent + git + bash trần** — skill chỉ tăng tốc, không bắt buộc.

## 2. XƯƠNG SỐNG DUY NHẤT: 2 chế độ, cắt tại go-live

Trước đây harness mô tả vòng đời bằng **3 cách chồng nhau** (3-macro, 2-mode, 4-bậc) → gây rối. **Từ nay lấy 2-mode (mode = chế độ) làm xương sống chính**; 2 cái kia hạ vai (xem §6).

Tóm: **Mode A** = spec→app chạy được, đơn vị = 1 **PHASE**, lệnh `/stage-next`+`/build-phase`. **Mode B** = nuôi app sống, đơn vị = 1 **ISSUE**, vòng lặp trên bảng issue. Cắt tại **go-live**. → **Sơ đồ đầy đủ (drivers/trackers/gates) ở [`OPERATING-MODES.md`](./OPERATING-MODES.md)** — file này không vẽ lại.

**Điểm dễ lẫn NHẤT — nhớ kỹ:** *"quy tắc tạo issue theo AC (Acceptance Criteria — tiêu chí nghiệm thu) từng module"* nằm ở **Mode B**, KHÔNG ở Mode A. Mode A chạy theo **phase** (pha/giai đoạn build), không theo issue (phiếu việc/vấn đề trên bảng theo dõi). Chỉ sau go-live (thời điểm app lên môi trường thật) mọi thay đổi mới thành issue.

---

## 3. Mode A — Build (chi tiết + nhãn)

Dòng chảy 1 chiều biến spec thành app. **Đây là chỗ "3-macro" cũ sống tiếp — nhưng chỉ như SỐ THỨ TỰ BƯỚC bên trong Mode A** (bước 1.x = chuẩn bị, 2.x = build, 3.x = sau go-live), không còn là 1 xương sống riêng.

**Mạch xuyên suốt (4 mắt xích hay bị mơ hồ):**
```
spec → REQ-ID → BUILD MANIFEST → stack template → walking skeleton → /build-phase lặp
```
1. **REQ-ID (mã yêu cầu) / token chain (chuỗi truy vết yêu cầu)** `PATCHED` — đánh số bền mỗi yêu cầu (`CM.CRUD.01`), truy vết `GAP→REQ-ID→SC→TC` (owner [`TRACE_SPEC.md`](./TRACE_SPEC.md)). *Phản biện: đúng cho việc-có-hợp-đồng (chứng minh với khách); với tool nội bộ là nghi thức thừa → dùng **Lane Lite** để bỏ bớt.*
2. **BUILD MANIFEST (bản kê thi công — danh sách pha)** `PROVEN` — `docs/build-manifest.md`, xếp mọi REQ-ID vào các phase P0..PN theo thứ tự thi công. Biến "đống spec" thành "hàng đợi phase".
3. **stack template (khung code mẫu)** `PROVEN (design) / PATCHED (bug)` — `scaffolds/stack-pnpm-nest-next/`, bộ khung code mẫu hình hasi-hub. *Phản biện: 3 bug chỉ lộ khi dogfood proof-run → template chỉ đáng tin SAU khi bị ép chạy thật, không phải vì có mặt.*
4. **walking skeleton (bộ xương biết đi — app tối thiểu chạy được đầu-cuối)** `PROVEN` — app tối thiểu **chạy thật đầu-cuối** (login + 1 CRUD + seed + CI xanh) dựng ở bước 2.4. Chứng minh đường ống thông TRƯỚC khi đắp thịt.
5. **`/build-phase`** `PROVEN` — vòng lặp code 1 phase (code → `validate:quick` → e2e smoke → ghi verification-register → commit). Lặp tới hết manifest.

**Gate (chốt kiểm) Mode A** `PROVEN`: verify-gate (cổng kiểm chứng không bỏ qua được; git-hook không bypass), PB-G1..G4 (paging khách/chủ), DoR/DoD (Definition of Ready/Done — điều kiện sẵn-sàng/hoàn-thành), phase-acceptance. Chi tiết: [`WORKFLOW.md`](../process/WORKFLOW.md).

**Lane (làn quy trình) Full vs Lite** `PATCHED` — Full = việc khách trả tiền (BA (Business Analyst — phân tích nghiệp vụ) đầy đủ); Lite = nội bộ (SRS (Software Requirements Specification — đặc tả yêu cầu phần mềm)-lite 1 file, bỏ REQ-ID nặng). *Phản biện: sự tồn tại của Lite là bằng chứng base process quá nặng nên phải bịa lối tắt.*

## 4. Mode B — the loop (chi tiết + nhãn)

Bắt đầu ngay khi app go-live. Không còn "bước hiện tại"; có **hàng đợi issue ở nhiều state song song**. Đây là **phần VỮNG NHẤT** của harness vì mỗi luật = 1 lần bị đau đã kiểm chứng thực chiến (ghi ở lessons-log (sổ bài học) của dự án — `docs/lessons-log.md`).

**6 nhịp vòng lặp** `PROVEN` (trừ recover): discover (phát hiện việc: bug/change → 1 issue) → dispatch (giao việc cho agent: 1 coder/issue, worktree riêng) → verify (xác minh: verify-at-source + gate + QC (Quality Control — kiểm thử chất lượng) checklist) → **recover** (tự-sửa khi lỗi) → persist (lưu trạng thái: bảng 10-state) → decide-next (quyết việc kế: QC pass thì tiến, fail theo luật vàng (golden rule)). Bản đầy đủ: [`playbooks/steady-state-issue-pipeline.md`](../playbooks/steady-state-issue-pipeline.md).

**Luật đã đổ máu** (nhớ kỹ, mỗi cái từng gây bug thật):
- **10-state** `PROVEN/⚠️` — Backlog→Ready for Dev→In Dev→Deploying→Ready for Test→QC Testing→Ready for UAT→UAT Testing→Done (+Cancelled). Issue **chỉ đóng ở Done**. Từ v7.3 các **cạnh chuyển được `issue-state.mjs` ÉP** (nhảy cóc kiểu Backlog→Done bị chặn; `--force "<lý do>"` chỉ dành cho người). *Phản biện: 10 state hơi nhiều cho 1 QC solo; nhiều nhóm dùng 4-5.*
- **Luật vàng QC fail** `PROVEN` — lỗi TRONG AC → lùi In Dev sửa issue cũ; lỗi NGOÀI AC → issue mới.
- **Refs-not-Closes** `PROVEN` — tham chiếu `Refs #N` ở CẢ PR body VÀ commit message (squash (gộp các commit thành một khi merge) gộp keyword → `Closes` đóng nhầm).
- **verify-at-source (xác minh tại nguồn — kiểm cái đang CHẠY, không tin CI xanh)** `PROVEN` — sau deploy, container đang chạy phải mang đúng commit. Không tin CI-xanh/HTTP-200.
- **Issue Type vs Label** `PROVEN` — Feature/Bug/Enhancement = **Issue Type**; label CHỈ `github`+`plane`; Module=body; Phase=Milestone. Chuẩn tạo issue: [`playbooks/github-issue-standard.md`](../playbooks/github-issue-standard.md).

**Recover (tự-sửa khi lỗi) (Frontier 1):** R2 `push-retry.sh` `PROVEN` (retry push flaky), R3 `ship-and-verify.sh` `PROVEN` (verify SHA staging, re-trigger 1 lần, mở drift issue), **R1 auto re-dispatch khi BLOCKED** `ASPIRATIONAL` (chưa build — đừng tưởng đã có).

## 5. Kho tri thức — kinh nghiệm/CICD/R2 lưu ở ĐÂU

**Học được gì mới → cất vào đâu?** Nguyên tắc: 1 tri thức = 1 chủ; chọn ĐÚNG 1 dòng theo bản chất cái bạn học.

| Bạn vừa có... | Cất vào | Đường dẫn | Tái dùng thế nào |
|---|---|---|---|
| Cách làm 1 việc, dùng lại MỌI dự án (VD wire object-storage, deploy verify-at-source) | **playbook** | `playbooks/*.md` + dòng `playbooks/README.md` | Agent mở đúng cái khi gặp domain đó |
| Một lần bị đau → rút ra luật ("chart rỗng = lỗi CSS") | **lessons-log** | dự án: `docs/lessons-log.md` · harness: `plans/lessons-log.md` | Phiên sau đọc trước khi lặp sai |
| Cấu hình/vận hành RIÊNG 1 dự án (deploy host, R2 bucket, env, CI/CD) | **runbook** (của dự án) | `<dự-án>/docs/runbook/*.md` | Người vận hành dự án đó đọc; KHÔNG lẫn vào harness |
| Fact bền CONTROL cần nhớ, không suy từ repo (slug/key/host, quyết định business) | **memory** | `~/.claude/projects/<key>/memory/` (key theo dự án) | Tự nạp context phiên sau |
| Loại FILE mới harness kỳ vọng dự án có | **template** | `mau-tai-lieu/*.md` + `mau-tai-lieu/README.md` | scaffold copy vào dự án |
| Chốt chặn / luật cứng mới (phải PASS) | **gate / WORKFLOW** | `gates/*.md` / `WORKFLOW.md` | verify-gate + review chặn khi vi phạm |
| Đổi bản thân harness (cơ chế, version) | **HARNESS_CHANGELOG** | `HARNESS_CHANGELOG.md` | Ghi tiến hoá harness |

**Bẫy (từ lessons-log):** đừng chép luật file A sang B (B chỉ TRỎ) · lessons-log DỰ ÁN ở `docs/`, HARNESS ở `plans/` · fact riêng dự án KHÔNG vào memory harness.

**Chốt R2 cho hết mơ hồ:** *mẫu tái dùng* R2/R3 ở **harness** (playbook/template); *R2 đã wire thật của elearning* ở **repo elearning** (runbook). "Cách làm chung" ở harness; "cấu hình cụ thể 1 dự án" ở repo dự án đó.

### 5b. Chuẩn RUNBOOK — đã có mẫu `PROVEN` ở elearning (đính chính)
**Đính chính thành thật:** trước đó tôi nói runbook là "phần harness đang nợ / ASPIRATIONAL" — **SAI, do chưa nhìn kỹ**. Thực tế **elearning đã có sẵn runbook tier trưởng thành**, dùng làm **MẪU CHUẨN**. Chuẩn = đúng hình dạng thật của elearning (`elearning-platform/docs/runbook/`):
- Thư mục `docs/runbook/` + `README.md` nêu **quy tắc đặt tên + quy tắc nội dung**.
- **1 file = 1 THỦ TỤC vận hành** (procedure — quy trình thao tác), kebab-case (đặt tên nối bằng gạch ngang) — KHÔNG phải 1 file / 1 chủ đề tuỳ hứng. Bộ có sẵn: `deploy-and-rollback.md`, `incident-response.md`, `backup-restore-drill.md`, `monitoring-review.md`.
- **Quy tắc nội dung:** mỗi runbook là thủ tục **đánh số, chạy được**: preconditions (điều kiện tiên quyết) → steps → verification → rollback (quay lui về bản trước). Rollback release = 1 dòng (`kamal rollback` / `IMAGE_TAG`) nơi hỗ trợ.
- Tham chiếu đọc ngay: `deploy-and-rollback.md` (env, deploy Kamal, release channel = CI/CD (Continuous Integration/Delivery — tự động tích hợp/giao hàng), config/deploy.yml + tên secret, verify-at-source, rollback prod).
> Runbook = sổ vận hành RIÊNG dự án (thủ tục cụ thể của HẠ TẦNG dự án đó). Playbook = cách làm chung tái dùng ở harness. Khi 1 runbook lặp ở nhiều dự án → cất lên thành playbook. **KHÔNG tạo file trùng cạnh runbook có sẵn** (VD `deploy.md` cạnh `deploy-and-rollback.md`) — cập nhật file sở hữu chủ đề đó.

## 6. Hai xương sống cũ giờ ở đâu (không xoá, chỉ hạ vai)

- **3-macro (Pre/Build/Post)** — hạ thành **số thứ tự bước bên trong Mode A/B** (1.x/2.x = Mode A; 3.x = go-live + Mode B). KHÔNG còn là mô hình ngang hàng. *Phản biện: đây là tầng cũ nhất, nặng nhất; giữ số bước cho tiện tra WORKFLOW, bỏ vai "xương sống".*
- **Loop / Graph / Harness engineering (3 lớp bọc nhau: `model+prompt ⊂ loop ⊂ graph ⊂ harness`)** — là **hộp tư duy để CHẨN ĐOÁN** "hỏng ở lớp nào", không phải bước phải chạy. Thiếu lớp nào ra triệu chứng nấy: không loop → không dừng · không graph → **không thấy vì sao** · không harness → chạm được mọi thứ. *Lưu ý: v7.3 từng ghi NGƯỢC (loop ngoài cùng, theo LangChain); v7.4 sửa sang harness-ngoài-cùng vì nó xếp theo **quyền chạm** — và sự cố thật của ta (L15, `bypassPermissions`) đều là sự cố quyền, không phải sự cố dừng. Lý do đầy đủ: [`decisions/layer-nesting-harness-outermost.md`](../decisions/layer-nesting-harness-outermost.md).*

## 7. Scorecard thành thật (đưa dev khác xem cái này)

| Vững (PROVEN, tin được) | Còn nặng/đặc thù (PATCHED) | Chưa build (ASPIRATIONAL) |
|---|---|---|
| Mode B loop + 6 luật đổ máu | 3-macro legacy (đã hạ vai) | R1 auto re-dispatch khi BLOCKED |
| build-manifest, walking skeleton, runbook tier (mẫu elearning §5b) | REQ-ID nặng cho nội bộ (→Lane Lite) | least-privilege cho bg worker (đang `bypassPermissions`) |
| R2/R3, verify-at-source | 10-state hơi nhiều cho QC solo (v7.3 đã ép cạnh) | proof deploy qua pipeline từ xa (mới chỉ prod-stack local) |
| stack template (sau khi dogfood) | Loop Engineering (dán nhãn lại) | |
| — | `run-log.mjs` (v7.3, **mới — chưa có dữ liệu thật**) | evals/observability đầy đủ (run-log mới là bước 1) |

> **Nhãn cho `run-log.mjs` phải đọc kỹ:** script chạy được + self-test xanh, nhưng **chưa có run thật nào** trong log. Nó là *dụng cụ đo*, chưa phải *kết quả đo*. Đừng trích nó như bằng chứng harness tốt lên — nó mới chỉ khiến câu hỏi đó **trả lời được**. Mốc chuyển sang `PROVEN`: ≥2 nhóm version, ≥5 run/nhóm.

## 8. Dev mới bắt đầu thế nào
1. Mở session (phiên làm việc): `cd ~/Desktop/Workspace/loop-harness && claude` (context tự nạp từ `CLAUDE.md`).
2. Đọc theo thứ tự: file này → [`OPERATING-MODES.md`](./OPERATING-MODES.md) → [`WORKFLOW.md`](../process/WORKFLOW.md) → [`playbooks/README.md`](../playbooks/README.md).
3. Dựng dự án mới: `scripts/install-harness.sh --bootstrap --spec ./spec.md ./my-project` → chạy `/stage-next` lặp tới go-live → chuyển sang vòng lặp issue.
4. Tra nhanh 1 keyword: [`KEYWORD-MAP.md`](./KEYWORD-MAP.md).

**Dev đóng góp ngược lại:** làm dự án bằng harness → gặp bài học/công thức mới → theo bảng §5 cất đúng chỗ → commit vào repo loop-harness → `git push`. Kho lớn dần, mọi dự án sau hưởng.

## 9. Giữ sạch khi mở rộng (đừng để chấp vá quay lại)
- **Self-containment (tự-đủ):** thêm gì vào `harness/` thì KHÔNG trỏ `../../` ra ngoài cây harness (link chết khi cài vào dự án khác).
- **Bảo thủ khi xoá:** nghi 2 file trùng → ĐỌC (hoặc giao subagent) rồi mới quyết; phần lớn "nghi trùng" là biên-giới có chủ ý.
- **Định kỳ dedup-audit** khi kho doc phình: scan(tên+ref-count) → cluster → đọc-hết → verify. Chuẩn viết doc: [`DOC-STANDARD.md`](./DOC-STANDARD.md).

## 10. Khi nào GỘP nhiều playbook thành 1 (composition)
Gộp thành 1 **meta-playbook** (playbook-cha điều phối chuỗi) **CHỈ khi cả 3 đúng:** (1) cùng 3+ playbook chạy cùng thứ tự ở **2+ dự án**; (2) output bước này = input bước kia; (3) đã **ĐO** được friction (quên thứ tự / bỏ bước / sai). Thiếu 1 → **giữ ATOMIC** (rời).
- **Đừng pre-build meta-playbook cho "gọn"** — aggregator nảy ra từ friction THẬT, không phải instinct "trông ngăn nắp". Pre-compose ẩn điểm-quyết-định + khó recovery.
- Mỗi bước khai **Hand-Off Contract:** Input (artifact cần) · Output (artifact đẻ ra, đặt tên để bước sau grep) · Skip-when (điều kiện bỏ qua).
- Meta-playbook DUY NHẤT hiện có = `playbooks/solo-dev-client-delivery.md`.
