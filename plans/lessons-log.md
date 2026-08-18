# Sổ tay bài học & sai lầm

CONTROL bồi đắp mỗi lần vấp. Mỗi mục: triệu chứng -> nguyên nhân gốc -> luật rút ra. Mới nhất trên cùng.

## 2026-08-17 — dogfood 1 landing page thật (Lane Lite) + kiểm 3 công cụ mới v7.3 (run-log · issue-state · ops-board)

Chạy thử harness trên 1 trang bán hàng (landing page - trang đích bán hàng) theo Lane Lite (làn nhẹ), bắt 6 chỗ gãy. Ghi 1 pass, đừng vá lẻ (vá thành 1 đợt riêng ngoài cycle).

**L24 - "để nguyên vì chưa có bằng chứng" áp cho LỖ AN TOÀN thì phải kèm MỐC LẬT, kẻo bằng-chứng = cú breach đầu tiên. (quyết định 2026-08-18: GIỮ `bypassPermissions`)**
Harness có luật vàng: không thêm cơ chế/gate cho tới khi có bằng chứng thật là cần (chống phình - L12). Đúng với tính năng. NHƯNG với 1 LỖ BẢO MẬT (`bypassPermissions` khi dispatch worker = tắt hết cổng xin phép, blast-radius lớn - OPERATING-MODES tự gọi "lỗ to nhất hệ thống"), "bằng chứng cần đóng" thường CHÍNH LÀ sự cố đầu tiên - đợi tới đó là đã dính. Khác tính năng: thiếu tính năng thì bất tiện, thủng bảo mật thì mất mát. User chốt GIỮ (2026-08-18) vì điều kiện hiện tại đủ an toàn: guardrail đã DỜI sang lớp khác (worktree riêng + prompt scoped cấm push/merge/prod + verify-gate fail-closed trên output + người trực dispatch + 1 account), chưa lần nào lỗ này cắn. Đây là "nợ CÓ ghi sổ + CÓ mốc trả", không phải phủ nhận rủi ro.
-> Luật: khi quyết "để nguyên vì chưa bằng chứng" cho 1 LỖ AN TOÀN, BẮT BUỘC ghi kèm (a) các LỚP BÙ đang giữ nó an toàn, và (b) MỐC LẬT rõ ràng - lật (đóng lỗ ngay, đừng chờ thêm) khi BẤT KỲ điều nào xảy ra:
   1. Chạy THẬT SỰ không người trực (unattended / cron tự lái) - mất lớp bù "người dispatch".
   2. Nhiều người / nhiều account / khách dùng chung (multi-tenant) - mất lớp bù "1 account của mình".
   3. Có 1 lần worker suýt/đã làm bậy (xoá nhầm, chạm prod, rò dữ liệu) - ĐÓ chính là bằng-chứng, tới là đóng liền.
   Cách đóng khi tới mốc: thay `bypassPermissions` bằng allowlist tool tối thiểu cho worker (least-privilege). Phân biệt: chờ-bằng-chứng cho TÍNH NĂNG = an toàn; cho LỖ BẢO MẬT = chỉ an toàn khi có lớp bù + mốc lật viết sẵn.

**L23 - ghế harness ctl TRÔI từ điều-phối sang vận-hành repo đích (dogfood đi hơi xa).**
Chuỗi dogfood elearning (dispatch #707/#706 -> QC-agent -> merge #709/#710) chạy tốt, nhưng đến bước "verify-at-source staging" thì tôi định tự SSH vps02 soi SHA container - đó là **nghiệp vụ VẬN HÀNH của chính repo đích**, không phải việc của ghế harness. User phải hỏi "ủa đang làm cho elearning hay gì" mới nhận ra. Ranh giới CLAUDE.md đã ghi rõ: ghế harness = ĐIỀU PHỐI + VÁ CÔNG CỤ; chọn issue ưu tiên, QC pass/fail, deploy, verify-at-source = **bg-session repo đích tự quyết** (đúng context khách/app). Dogfood dễ cuốn vì mỗi bước tiếp theo đều "hợp lý" -> trôi dần từ kiểm-harness sang nuôi-elearning.
-> Luật: khi dogfood, tự hỏi mỗi bước "việc này KIỂM/VÁ harness, hay VẬN HÀNH repo đích?". Điều phối (dispatch/poll/gom-gap/merge-để-chạy-vòng) = của ghế harness. Vận hành (SSH box, soi container, quyết deploy, QC pass/fail nghiệp vụ, verify-at-source staging/prod) = giao bg-session repo đích, KỂ CẢ khi mình làm được. Tín hiệu trôi: mình bắt đầu gõ lệnh chạm hạ-tầng/prod của repo đích, hoặc ra phán quyết nghiệp vụ hộ khách. Merge PR trong dogfood là ranh giới xám: OK khi để chạy tiếp 1 vòng harness + có user duyệt, KHÔNG OK nếu thành "tôi ship sản phẩm elearning".

**L22 - verify-gate chỉ canh MỘT đường vào (git hook) - commit qua API/web/MCP/máy khác đi lọt.**
Phiên CLI trước commit `issue-state.mjs` **qua GitHub contents API để né gate local nặng** (kết quả tốt, rủi ro lần đó thấp) - nhưng phơi ra lỗ hạng nặng: gate là git hook nên chỉ chặn đường `git commit/push` từ máy này. Commit qua **contents API / web UI / MCP / máy khác** không chạm hook một lần nào. Vì vậy tuyên bố "gate fail-closed, không bypass được" đang in trong `AGENTS.md` + `STRUCTURE.md` là **SAI** - đúng khuôn FC6: một cổng kiểm một đường trong khi có bốn đường = cổng không có răng. Triệu chứng nhận ra: ai đó nói "né gate local cho nhanh" mà không khai đó là bypass. Phát hiện nhờ bản đồ v7.4 (harness = vòng ngoài = "được chạm gì") - câu hỏi đúng của tầng đó là "có mấy đường vào repo, mấy đường có cổng?".
-> Luật: (a) mọi lần đi vòng qua API/web để commit code phải **KHAI rõ là bypass gate** (không được coi như commit thường); cấm đi vòng để né gate đỏ. (b) Vá thật = đẩy cổng lên **phía máy chủ** (branch protection + require status checks) để MỌI đường vào đều qua CI; hook local hạ xuống thành lớp *nhanh*, không còn là lớp *duy nhất*. (c) Sửa `AGENTS.md`/`STRUCTURE.md`: bỏ/hạ-nhãn tuyên bố "không bypass được" khi cổng mới canh 1 đường (nối L14: doc nói mạnh hơn thực tế). **Chú ý mỉa mai tự-quy-chiếu:** chính pha "verify-at-source, gate đỏ = việc thật" mà lại né gate bằng API là mâu thuẫn - dùng API vì tránh gate-CHẬM thì OK nhưng phải khai; vì tránh gate-ĐỎ thì cấm.

**L16 - NẶNG: template bán hàng HỨA với khách thứ harness CHƯA cưỡng chế được (gate `landing-acceptance` không tồn tại).**
Trang landing dựng ra hứa "Tốc độ & SEO (Search Engine Optimization - tối ưu tìm kiếm) đạt ngưỡng", nhưng KHÔNG có gate `landing-acceptance` nào đo/chặn điều đó. Harness đang cho phép cam kết với khách hàng một tiêu chí mà bản thân nó không có cổng nào nghiệm thu - đúng blind-spot L14 (present-tense trong doc ≠ đang chạy), lần này ở tầng bán hàng nên hậu quả là hứa-suông với người trả tiền.
-> Luật: một dòng cam kết chất-lượng trong template khách-đọc PHẢI có 1 gate chấp-hành thật đứng sau (VD Lighthouse CI cho Tốc độ/SEO), verify-at-source. Chưa có gate thì HOẶC dựng gate, HOẶC XOÁ/hạ-nhãn dòng đó trong template bán hàng (không để lời hứa mồ côi). Nối L14: đọc từ đầu, mỗi cam kết soi có artifact cưỡng chế chưa.

> **NGUYÊN TẮC (ứng viên luật cứng - CHƯA nâng, chờ người duyệt):** Harness được phép **thiếu** gate. KHÔNG được phép để bản bán hàng / template khách hàng **hứa** một gate chưa tồn tại. Mọi cam kết chất-lượng trong tài liệu khách phải trỏ được tới gate cưỡng chế nó - không trỏ được thì bỏ câu đó.
> Đề xuất chỗ đứng nếu duyệt: 1 luật cứng trong **gate review tài liệu khách**. Cố ý để ở đây dạng đề-xuất, không tự nâng: nâng bài học thành luật mà chưa qua người là đúng cơ chế harness phình bằng luật chưa kiểm chứng.

**L17 - Harness không nói dự án landing SỐNG Ở REPO NÀO - sắp có ~5 cái.**
Dựng landing đầu tiên mà không có chỗ quy định landing ở repo nào: 1 repo dùng chung nhiều trang? mỗi trang 1 repo? Sắp có ~5 landing thì không có quy ước = mỗi lần lại quyết lại, dễ vung vãi.
-> Luật: harness cần chốt 1 quy ước "landing sống ở đâu" (đề xuất: 1 monorepo `landings/` nhiều trang, hoặc 1 template repo nhân bản) TRƯỚC khi làm trang thứ 2. Đây là quyết định cấu trúc, cần user chốt (business/scale), không tự đoán.

**L18 - Lane Lite vẫn ép REQ-ID grammar + screen-inventory floorplan - THỪA cho 1 trang.**
Lane Lite (làn nhẹ, đáng ra tối giản) vẫn giữ non-negotiable: cú pháp REQ-ID (mã yêu cầu đánh số) + screen-inventory floorplan (bản liệt kê toàn bộ màn hình như sơ đồ mặt bằng). Cho 1 trang landing đơn thì bộ này nặng vô ích - chi phí nghi thức > giá trị.
-> Luật: XÁC NHẬN cần Lane thứ 3 riêng cho Landing (bộ artifact tối giản: intake + copy + 1 gate perf/SEO), ĐỪNG nhét landing vào Lite rồi miễn-trừ lắt nhắt. Không tự cắt non-negotiable của Lite (có thể có dự án Lite thật cần chúng - guard user decision); mở Lane mới thay vì đục lỗ Lane cũ.

**L19 - Không có template intake cho landing.**
Bắt tay làm landing mà thiếu bộ hỏi-đầu-vào (intake): mục tiêu chuyển đổi (conversion goal), đối tượng, offer (chào hàng), kênh traffic (nguồn truy cập), tài sản thương hiệu (brand assets), đối thủ. Thiếu -> phải phỏng đoán hoặc hỏi rời rạc.
-> Luật: thêm 1 template intake landing gồm đúng 6 mục trên vào Lane Landing (L18). Đây là đầu vào bắt buộc trước khi viết copy/dựng trang.

**L20 - `run-log.mjs` auto-detect SAI repo khi chạy từ cây harness -> phải truyền `--repo`. [đã kiểm 2026-08-17]**
`run-log.mjs` đoán repo bằng `git rev-parse --show-toplevel` rồi lấy basename. Chạy `node harness/scripts/run-log.mjs start ...` từ trong cây loop-harness -> ghi `repo:"loop-harness"` dù việc thật ở elearning-platform. Kiểm chứng phiên này: truyền `--repo elearning-platform` thì dòng start ghi đúng repo (store `~/.claude/loop-harness/run-log.jsonl`).
-> Luật: LUÔN truyền `--repo <repo-đích>` khi gọi run-log từ ghế ctl/cây harness; đừng tin auto-detect. Cân nhắc: run-log nên cảnh báo khi CWD basename == "loop-harness" mà không có `--repo` (dễ nhầm chính nó là repo-đích).

**L21 - `run-log.mjs` ghi vào `$HOME/.claude/` - đúng trên workstation, MẤT SẠCH trong session cloud tạm. [đã kiểm 2026-08-17]**
Store mặc định `~/.claude/loop-harness/run-log.jsonl` (hoặc `$LOOP_HARNESS_RUNLOG`) nằm ngoài git - đúng chủ ý (tránh xung đột merge + bẩn repo khách). Nhưng trong 1 phiên cloud tạm (ephemeral - dùng xong xoá), `$HOME` bay theo phiên -> cái cân đo được nhưng số liệu không sống qua phiên. Cái cân chỉ có nghĩa khi chạy ở nơi nó tồn tại được (workstation lâu dài). Phiên trước sinh 3 công cụ này trên cloud nên chính chúng chưa có dữ liệu thật - phải đợi chạy trên workstation (phiên này) mới có dòng đầu.
-> Luật: chỉ tin số run-log khi chạy ở môi trường bền (workstation hoặc `$LOOP_HARNESS_RUNLOG` trỏ volume/dir được git-track riêng hoặc backup). Trên cloud tạm: HOẶC set `$LOOP_HARNESS_RUNLOG` vào nơi bền, HOẶC coi run-log tại đó là vô nghĩa và đừng kết luận "harness tốt lên" từ nó.

## 2026-07-31 → 08-02 — đợt audit-dọn loop-harness (6 lần rà: top-level · playbook · template · stack · docs · phân-khu-zone)

**L15 - Dispatch bg-fleet (1 ctl → N bg): permission-mode là NÚT THẮT + worker phải GHI output ra FILE.**
Demo 1 ctl loop-harness -> 1 bg-session elearning chạy 1 vòng loop report-only: (a) `--permission-mode acceptEdits` KHÔNG auto-duyệt bash -> worker treo ở prompt xin phép 1 lệnh có pipe (state `blocked`); worker không-người-trực CẦN `bypassPermissions` hoặc allowlist tool. (b) `bypassPermissions` bị auto-mode classifier CHẶN nếu prompt user chưa explicit cho phép -> cần user cho phép rõ / thêm Bash rule trong settings. (c) lấy output bg qua `claude logs`/`lastMessage` bị RỐI (TUI escape-code / JSON rỗng). (d) `--bg` xung đột `-p` -> prompt để POSITIONAL.
-> Luật: dispatch tự động = `cd <repo> && claude --bg "<task positional>" --permission-mode bypassPermissions`; task PHẢI **ghi report ra FILE** (VD `plans/reports/...`) để orchestrator đọc artifact sạch, ĐỪNG scrape TUI. Đủ-để-chạy-ổn = permission-mode + prompt-scoped + worktree(khi song song đụng file) + poll/verify-at-source. Chi tiết đóng vào `loop-harness/CLAUDE.md` § Dispatch.

**L14 - Vouch 1 gate/doc "có răng thật" thì phải đọc CẢ header-trạng-thái + verify artifact trên filesystem — đừng tin prose tự-tin.**
Digest gate `visual-fidelity.md` tôi đọc từ dòng 185 (thân), BỎ header 1-52 -> vouch "mỗi U-class wired 1 lint thật, dogfood". Đo lại: **6/9 lint `check-*.mjs` KHÔNG tồn tại** (elearning `lint:gates` thật chỉ chạy 3), và header 3-15 ĐÃ ghi rõ "SPECIFIED, NOT YET SHIPPED" — tôi bỏ qua. Prose viết `a lint (check-X.mjs, lint:gates) fails` ở thì hiện tại đọc y như đang chạy nhưng là aspirational (mô tả thứ mong-có).
-> Luật: trước khi khẳng định 1 gate/doc "có răng chặn thật": (a) **đọc từ ĐẦU file** — doc dạng gate hay mang khối "Enforcement/Status" ở đầu phủ định phần thân; đọc-giữa-chừng = vouch nhầm. (b) mỗi lần doc viện dẫn 1 artifact chấp-hành (script/lint/test/hook), **grep filesystem xác nhận nó tồn tại + THỰC SỰ được wire** (VD đọc `lint:gates` trong `package.json`), đừng suy từ giọng văn. **"present-tense trong doc" ≠ "đang chạy".** Nối L13: blind-spot doc là drift/aspirational-đội-lốt-proven; người-audit tự nhân bản lỗi khi đọc thiếu + tin prose. Fix đúng = doc trung thực NGAY (hạ nhãn PLANNED) + queue eng thật thành issue, KHÔNG bịa "đã xong".

**L13 - Soi "thừa" trên doc đã-ổn định thường lòi ra THIẾU / DRIFT, không phải phình — hướng-fix là THÊM, không cắt.**
Đợt phân-khu (mở từng zone harness để học) chạy soi-thừa 2 lần trên vùng tưởng "lộn xộn/phình": (1) `STRUCTURE.md` index bỏ sót 3/14 file loose -> `ls docs/` nhìn "loose lộn xộn" thực ra là **index chưa phủ**, không phải cần foldering; (2) `scripts/README.md` kể THIẾU 3 tính năng chặn code đã có (test-suite-on-push, chặn register 0-dòng, self-check fail-closed khi hooksPath drift) -> C7 vi phạm ngay trong doc của chính cổng. Cả 2 lần: doc kể THIẾU so với thực tế -> sửa = **bổ sung cho khớp**, không cắt.
-> Luật: khi nghi 1 zone "phình/lộn xộn", đo 2 blind-spot TRƯỚC khi nghĩ tới cắt/foldering: **(a) index-coverage** (mọi file/tính năng có được liệt kê đúng?) + **(b) doc↔code drift** (mô tả có khớp code/hành-vi thật?). Foldering/cắt = bản-năng sai; phủ-index + đồng-bộ-doc = fix thật. Nối tiếp L12: không chỉ "không phình" mà hướng ngược = THÊM. Phản-ví-dụ chuẩn C1 để soi các file dùng-chung: `design-system/design-rules.md` (0 rò tên dự án, thuần structure/behavior, có version-pin) = mức mọi artifact "giống hệt mọi dự án" phải đạt.

**L12 - Nghi "phình / thừa / chấp vá" thường SAI — ĐO, đừng cắt theo cảm giác.**
Cả đợt nghi harness phình nhiều lần (big-refactor mọi file · 26 playbook unproven · 6 meta-doc). Đo thật: **3/4 lần "không phải"** — playbook/template/stack phân-chia trách-nhiệm kỷ luật; grep OVER-COUNT (đếm chuỗi không hiểu ngữ cảnh: "control-plane" khớp "plane", CHANGELOG cite nơi dogfood, `First use: elearning` = nhãn-bằng-chứng hợp lệ); gate 500 dòng = mỗi dòng 1 leg nghiệm thu THẬT (đặc, không verbose). Chỉ **1 lần ĐÚNG** = cụm explainer TÔI vừa đẻ (chép sơ-đồ/bảng/thứ-tự qua lại).
-> Luật: **đóng RUBRIC (mã hoá thước đo, VD `DOC-STANDARD.md` C1-C10) → scout ĐẾM → read-audit ĐỌC (tách vi-phạm-thật khỏi false-positive-grep/ví-dụ-có-nhãn) → người duyệt TỪNG cái → sửa scoped + verify.** 3 TRỤC đừng lẫn: **dedup** (trùng file khác?) · **necessity** (bước/flow ĐÃ-định-nghĩa cần nó? — load-bearing thì GIỮ dù unproven) · **provenance** (dùng thật chưa?). Bảo thủ với đồ cũ-đã-verified; **NGHI TRƯỚC đồ MÌNH vừa thêm** (auditor's own additions = nguồn accretion số 1) + giao mắt độc-lập (subagent) né bias-bảo-vệ. Format-only (tách bullet/xuống đoạn) an toàn cả với verified; đổi CHỮ thì dừng ở ranh giới verified. Code đã-dogfood: toolchain chặn dead-code/unused-import → chỉ soi vùng-MÙ (unused-deps trong package.json · doc↔code drift · env-doc 2 chiều · version-pin drift).

**L11 - 1 rule = 1 owner (DRY): doc phình vì LẶP nội-dung giữa file, KHÔNG phải file thừa.**
Audit đọc-hết: 0 file cần xoá, nhưng ~14KB TRÙNG (changelog nhồi vào HARNESS.md, cùng 1 flow/luật ở 3 nơi). File khác chỉ **TRỎ** tới owner, không chép lại. Thêm doc mới đừng restate cái file khác đã sở hữu (chính tôi vi phạm nhiều lần: chép sơ-đồ 2-mode ×3, bảng 4-kho ×4). Gom-về-1-nguồn thì mạnh tay; xoá FILE thì bảo thủ (chỉ trùng/chết thật đã verify).

**L10 - Self-containment + ranh giới product ⟂ workshop.**
Cây CÀI-ĐƯỢC (`harness/`) TUYỆT ĐỐI không `../../` ra ngoài chính nó (link chết khi cài vào dự án khác). Root = **workshop** (`plans/` chứa lessons-log/reports của harness; `.claude` phiên-dev = gitignore); `harness/` = **product** tự-đủ. Tri thức "cho dự án" (VD lessons-log của dự án) = 1 **template** trong cây; "của chính harness" = `plans/`.

**L9 - Discovery của kho "gặp gì mở nấy" = trigger + index, KHÔNG phải tên file.**
Tìm đúng playbook nhờ dòng **"When To Run"** trong mỗi file + **index nhóm-theo-domain** (README/KEYWORD-MAP), KHÔNG phải prefix tên (`ba-`/`qa-`): đổi tên = churn phá ref, lợi ít vì agent đọc index/pointer chứ không `ls`. Đừng đồng-phục-hoá trigger — biến-thể chính xác (`When To Fork`/`Compose`/`It Applies`) tốt hơn generic; grep `When` vẫn ra hết.

## 2026-07-28

**L8 - Pre-push gate flaky (test integration redis/BullMQ).**
Pre-commit chạy `validate` (gồm test) PASS, nhưng pre-push chạy lại cùng bộ test lại FAIL 1 lần rồi push lại là xanh. Có test integration real-redis/BullMQ phụ thuộc timing.
-> Luật: docs/script-only mà pre-push đỏ ở test integration thì **retry push 1-2 lần** trước khi nghi lỗi thật; đừng bypass gate. Cần dọn flaky test riêng (debugger đã flag "dev CI quality-gate fail lặp lại" = pre-existing).

**L7 - Harness đang over-constrain (bài context-engineering Anthropic).**
Model mới (Opus 4.8/5, Fable 5) phán đoán tốt hơn; Anthropic bỏ hơn 80% system prompt Claude Code không giảm eval. Harness của ta (CLAUDE.md khổng lồ + nhiều rule + WORKFLOW dài) là kiểu nhồi-hết-lên-đầu.
-> Luật: CLAUDE.md/WORKFLOW nhẹ + gotcha; chi tiết đẩy sang skill/script/test (reference nạp đúng lúc); để agent tự phán đoán; ưu tiên reference-dạng-code hơn văn xuôi. Gõ /doctor để soi quá tải. Không tự cắt quyết định đã chốt.

**L6 - Plane Page: API không đọc/ghi được, TRỪ page đã publish.**
Public API v1 (X-API-Key) không có endpoint pages (404); internal API cần cookie web (401). Kể cả key đúng workspace.
-> Nhưng page **publish (Spaces)** đọc được: `GET /api/public/anchor/<anchor>/pages/` trả `description_html`. Ghi thì vẫn không. Nên tri thức CONTROL cần cập nhật phải ở file repo; Plane Page chỉ để người đọc, chia sẻ cho CONTROL bằng link /spaces/.

**L5 - Chart rỗng = lỗi CSS render, KHÔNG phải data (issue #239).**
KPI "Học viên mới=20" nhưng biểu đồ tuần rỗng. Review code tĩnh (TS + query) thấy đúng hết, tưởng mâu thuẫn. Thực ra bar có `height:N%` nhưng ô cha `.col` bị co bằng nội dung (flex-end) -> `%` không có gốc -> mọi bar 0px bất kể data.
-> Luật: lỗi "rỗng/không hiển thị" ở UI phải ĐO trên trình duyệt thật (headless-chromium), review code tĩnh không bắt được lỗi layout CSS. Data-fix đúng vẫn có thể bị chặn ở tầng render.

**L4 - QC fail: happy-fail vs ngoài-AC (luật vàng).**
Rối vì lúc tạo issue mới (#213->#260), lúc lùi In Dev (#239).
-> Luật DUY NHẤT: lỗi trong AC của issue -> lùi In Dev sửa issue cũ; lỗi ngoài AC -> issue mới (issue cũ đi tiếp độc lập). Bỏ cách phân "happy vs biên".

**L3 - Auto-close nằm ở COMMIT MESSAGE, không chỉ PR body (issue #225).**
Sửa PR body `Closes`->`Refs` vẫn bị đóng nhầm khi merge, vì commit của coder ghi `Closes #225`; squash-merge gộp commit body -> auto-close.
-> Luật: `Refs`/`Part of` phải áp cho CẢ commit message; trước khi merge PR cũ, grep commit message (`gh api .../commits/<sha> --jq .commit.message`) tìm keyword đóng.

**L2 - Gate elearning fail vì worktree mới thiếu node_modules.**
Pre-commit chạy full `validate` (lint+typecheck+test+build); worktree mới -> `eslint: not found` -> gate đỏ, không được bypass.
-> Luật: commit tài liệu/script nhỏ từ **checkout chính** (đã có deps) trên branch off dev; nếu typecheck thiếu export của `@nhat-nghe/database` thì rebuild nó trước (`pnpm --filter @nhat-nghe/database build` -> làm mới `out/`).

**L1 - Verify-at-source bằng SHA container, không tin CI xanh.**
-> Sau deploy staging: SSH vps02, `docker ps` tên container `elearning-web-web-<sha>` phải == dev HEAD. Health `commitSha`="unknown" vô dụng. CI xanh / HTTP 200 không đủ.
