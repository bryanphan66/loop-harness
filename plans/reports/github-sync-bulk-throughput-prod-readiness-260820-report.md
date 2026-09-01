# GitHub -> Plane sync: bulk throughput + prod-readiness (fork `plane-etl-fix`)

**Ngày:** 2026-08-20
**Repo soi:** `/home/trung/Desktop/Workspace/plane-etl-fix` (nhánh `fix/issue-type-badge-fetch`)
**Phạm vi:** silo (dịch vụ tích hợp GitHub) + transform ETL (Extract-Transform-Load, bóc-biến đổi-nạp dữ liệu). Chỉ đọc code, không sửa.

---

## TL;DR (kết luận nhanh)

- **Gốc của "nghẽn":** mỗi issue tốn ~35s vì handler bắn **~15-20 lượt gọi mạng tuần tự** (round-trip - đi và về 1 lần) sang Plane + GitHub, xếp hàng nối đuôi nhau. CPU rảnh, nên đây là **độ trễ (latency) cộng dồn**, không phải thiếu tài nguyên.
- **~7 lượt trong số đó là tra cứu cấp-project lặp lại** (danh sách states, labels, users x2, issue-types, modules, cycles) - **giống hệt nhau cho mọi issue trong cùng project** nhưng bị fetch lại từ đầu mỗi issue. Đây là mỏ vàng để cache (bộ nhớ đệm).
- **Đường xử lý issue KHÔNG chạy qua RabbitMQ** (hàng đợi bền). Nó chạy qua **Redis key-expiration** (hết-hạn-khoá) - một cơ chế **pub/sub không bền (non-durable)**. Đây là lỗ hổng độ tin cậy lớn nhất: nếu silo mất kết nối / restart đúng lúc khoá hết hạn, **sự kiện mất vĩnh viễn** (GitHub không retry + fork này không có backfill).
- **Mất-hàng-loạt là CÓ THỰC nhưng hiếm** (chỉ khi silo chết đúng cửa sổ hết-hạn). Trường hợp thường gặp hơn là **chậm rề (slow-trickle)** + nguy cơ **xử lý trùng (duplicate)** do khoined (lock) TTL 15s < 35s thời gian xử lý.
- **HTTP 202 trả về NHANH** (chỉ là 1 lệnh Redis SET) - nên GitHub không bao giờ thấy 35s, không bị timeout 10s -> không mất do timeout.
- **Verdict:** Tính năng (feature) **ĐÚNG** - map state/priority/type/module/cycle/parent/ảnh đều hợp lý. Nhưng **độ tin cậy bulk CHƯA vững**. **Chưa nên prod nếu chưa thêm 1 lưới an toàn (backfill/redelivery)** + cache cấp-project. Có điều kiện thì OK (xem mục 6).

---

## 1. Kiểm kê lượt gọi mạng MỖI issue + cái nào cache được

File: `apps/silo/src/apps/github/workers/github/event-handlers/issue.handler.ts` (`syncIssueWithPlane`) + `packages/etl/src/github/etl/transform-to-plane.ts` (`transformGitHubIssue`).

### Gọi sang GitHub (per issue)
| # | Lời gọi | File:line | Ghi chú |
|---|---------|-----------|---------|
| 1 | `ghService.getIssue` | issue.handler.ts:107 | Lấy issue đầy đủ |
| 2 | `ghService.getBodyHtml` | issue.handler.ts:108 | HTML đã render (giữ định dạng) |
| 3 | `ghService.getIssueFields` | issue.handler.ts:115 | Custom fields (States/Priority) + Issue Type |
| 4 | `ghService.getSubIssues` | issue.handler.ts:338 | Sub-issue (parent/child) |
| 5 | `ghService.createIssueComment` | issue.handler.ts:300 | CHỈ khi tạo mới (link-back) |
| + | tải ảnh (download) mỗi ảnh trong body | content-parser.ts:165 | Tuần tự, per-ảnh |

### Gọi sang Plane (per issue)
| # | Lời gọi | File:line | Cache được? |
|---|---------|-----------|-------------|
| 1 | `issue.getIssueWithExternalId` (check tồn tại) | issue.handler.ts:132 | Không (per-issue) |
| 2 | `users.list` | issue.handler.ts:140 | **CÓ (project-level)** |
| 3 | `state.list` (trong transform) | transform-to-plane.ts:119 | **CÓ (project-level)** |
| 4 | `state.create` (nếu State chưa có) | transform-to-plane.ts:150 | Ghi, hiếm - sau lần đầu thì cache |
| 5 | `users.list` **LẶP LẠI** | issue.handler.ts:165 | **TRÙNG #2** - bỏ hẳn được |
| 6 | `label.list` | issue.handler.ts:168 | **CÓ (project-level)** |
| 7 | `label.create` x N (mỗi label mới) | issue.handler.ts:193 | Ghi, sau lần đầu cache |
| 8 | `issueType.fetch` | issue.handler.ts:425 | **CÓ (project-level)** |
| 9 | `issueType.create` (nếu type chưa có) | issue.handler.ts:428 | Ghi, hiếm |
| 10 | `issue.create` **hoặc** `issue.update` | issue.handler.ts:257/268 | Không (per-issue, bắt buộc) |
| 11 | `issue.createLink` | issue.handler.ts:279 | Chỉ tạo mới |
| 12 | `project.getProject` | issue.handler.ts:290 | **CÓ (project-level)**, chỉ tạo mới |
| 13 | mỗi sub-issue: `getIssueWithExternalId` (+ `issue.update` nếu đổi parent) | issue.handler.ts:342/349 | Không (per-child) |
| 14 | `modules.list` | issue.handler.ts:382 | **CÓ (project-level)** |
| 15 | `modules.create` (nếu module chưa có) | issue.handler.ts:389 | Ghi, hiếm |
| 16 | `modules.addIssues` (nếu chưa là thành viên) | issue.handler.ts:398 | Ghi (per-issue) |
| 17 | `cycles.list` | issue.handler.ts:457 | **CÓ (project-level)** |
| 18 | `cycles.create` (nếu cycle chưa có) | issue.handler.ts:464 | Ghi, hiếm |
| 19 | `cycles.addIssues` (nếu chưa là thành viên) | issue.handler.ts:479 | Ghi (per-issue) |
| + | mỗi ảnh: `assets.uploadAsset` | content-parser.ts:169 | Ghi, per-ảnh |

**Tổng steady-state (issue update, có module + cycle + 1 sub-issue, không ảnh, không label mới):** ~4 lượt GitHub + ~12-14 lượt Plane = **~16-18 round-trip TUẦN TỰ**. Ở ~1.5-2s/lượt tới Plane staging -> ~30-35s. Khớp số đo.

### Nhóm cache được (giống hệt mọi issue trong 1 project)
`users.list` (đang gọi **2 lần** - #2 và #5, riêng cái này bỏ được 1), `state.list`, `label.list`, `issueType.fetch`, `modules.list`, `cycles.list`, `project.getProject` = **~7 lượt/issue có thể fetch 1 lần rồi tái dùng cho cả lô**. Cache 1 lô 50 issue -> tiết kiệm ~7 x 50 = **~350 lượt gọi thừa**.

---

## 2. Mô hình worker / hàng đợi / dedup (tuần tự hay song song? có rớt/mất không?)

### Điểm mấu chốt: issue KHÔNG đi qua RabbitMQ
Controller phân 2 nhánh (`apps/silo/src/apps/github/controllers/index.ts`):
- `issues` và `pull_request` -> **`registerStoreTask`** (đường **Redis store**), controllers/index.ts:823, 843.
- Các event khác -> `registerTask` (đường **RabbitMQ**), controllers/index.ts:863.

`registerStoreTask` (`worker/manager.ts:299-309`) chỉ làm **1 lệnh Redis SET** với TTL = `DEDUP_INTERVAL` (mặc định **3 giây**), `NX=false`:
```
key = silo:github-webhook:issues:issues:{JSON.stringify(data)}   // data có issueNumber
store.set(key, "1", 3, false)
```
Vì key nhúng `JSON.stringify(data)` (chứa `issueNumber`), **mỗi issue khác nhau = key khác nhau**. Cùng 1 issue bị sửa dồn dập -> cùng key -> mỗi webhook **reset lại TTL** (NX=false) -> **debounce (gộp nảy)**: chỉ xử lý 1 lần, 3s SAU sự kiện cuối cùng.

### Xử lý xảy ra khi KEY HẾT HẠN, không phải khi nhận webhook
`store.ts:90-100`: bật `notify-keyspace-events=Ex`, subscribe kênh `__keyevent@0__:expired`. Khi key `silo...` hết hạn, Redis phát sự kiện -> Store emit `"ready"` -> `manager.ts:140` gọi `this.handleTask(props)`.

### Tuần tự hay song song?
**SONG SONG.** Listener `"ready"` (manager.ts:140-147) gọi `handleTask(props)` **KHÔNG await**. Khi 50 key hết hạn gần như đồng thời, 50 promise `handleTask` chạy **đồng thời** (fire-and-forget). Vậy 50 issue KHÔNG mất 50x35s tuần tự - chúng chồng lấn. NHƯNG:
- Mỗi issue vẫn ~35s (nội bộ tuần tự).
- 50 issue x ~16 lượt gọi Plane đồng thời = **~800 request dồn vào Plane API cùng lúc** -> tự gây nghẽn/đuối ở Plane (dù CPU silo rảnh).
- **`MQ_PREFETCH_COUNT` (=5) KHÔNG chi phối issue** (nó chỉ giới hạn consumer RabbitMQ - queue.ts:41-42). Chỉnh prefetch **vô ích** cho throughput issue.
- **`BATCH_SIZE` (=50) là config CHẾT** - không chỗ nào trong `apps/silo/src` dùng.

### Khoá per-entity (dedup đa-container) - có kẽ hở
`manager.ts:219-242`: mỗi sự kiện tạo `Lock` key `silo:lock:{entity}` **TTL 15 giây** (lock.ts:30 nhận `ttl:15`). Mục đích: nhiều replica silo cùng nhận sự kiện expired (pub/sub broadcast) -> chỉ 1 replica xử lý.
- **Kẽ hở:** xử lý mất ~35s **>** lock TTL 15s -> lock **tự hết hạn giữa chừng** -> replica thứ 2 (hoặc cùng replica sự kiện sau) có thể **giành lại lock và xử lý TRÙNG** -> tạo/update trùng, comment link-back trùng. Trong bulk có tranh chấp đẩy thời gian >15s, trùng dễ xảy ra.
- Còn có `setTimeout(random*200ms)` jitter (manager.ts:237) - giảm va chạm chút ít, không giải quyết gốc.

### Nguy cơ MẤT / rớt tin
1. **Sự kiện expired là pub/sub KHÔNG BỀN.** Redis chỉ giao sự kiện expired cho subscriber **đang kết nối tại thời điểm hết hạn**. Nếu silo restart/mất kết nối Redis đúng cửa sổ đó -> **sự kiện mất vĩnh viễn**, không có nơi lưu lại (store.ts:90-100). Đây là điểm yếu nghiêm trọng nhất.
2. **DLX (dead-letter exchange) KHÔNG cứu issue.** `mq.ts:197-221` dựng DLX, nhưng issue đi đường Redis nên **DLX không bảo vệ issue** - chỉ bảo vệ event RabbitMQ.
3. **`MQ_CONSUMER_TIMEOUT` (25 phút, manager.ts:18)** áp cho đường MQ; đường store không có cơ chế tương đương - handleTask lỗi thì chỉ log, không đẩy vào DLX, không retry.

### Echo-suppression `silo:issue:*` - có thể nuốt nhầm sự kiện thật trong bulk?
- Chiều Plane->GitHub: sau khi ghi GitHub, worker set `silo:issue:{githubNumber}` TTL `ECHO_TTL` (=60s) (`workers/plane/event-handlers/issue.handler.ts:132`).
- Chiều GitHub->Plane: `issue.handler.ts:48` đọc `silo:issue:{data.issueNumber}`, nếu có thì **bỏ qua + xoá** (coi là echo của chính mình).
- **Rủi ro bulk (hẹp nhưng thực):** nếu trong 60s vừa có 1 lượt Plane->GitHub ghi lên đúng issue #N, rồi user **thật sự** sửa #N trên GitHub trong bulk -> sự kiện thật **bị nuốt** như echo. Chỉ nuốt 1 lần/khoá (có `del`), lần sau qua. Xác suất thấp trừ khi 2 chiều churn cùng lúc.
- Lưu ý so-le namespace: chiều GitHub set key theo **Plane UUID** (`silo:issue:{issue.id}`, issue.handler.ts:266/307) còn check theo **GitHub number** (dòng 48) - hai không gian tên khác nhau, nên cái set ở 266/307 là để chặn echo ở worker **Plane** (đọc `silo:issue:{payload.id}` = UUID). Logic nhất quán chéo-chiều, không phải bug.

---

## 3. Diễn tiến khi bulk-edit 50 issue trong vài giây

1. GitHub bắn 50 webhook `issues.edited` gần như đồng thời.
2. Mỗi webhook: controller check nhãn `plane` -> `registerStoreTask` -> **1 Redis SET** -> **trả 202 ngay** (dưới vài ms). GitHub hài lòng, **không timeout**.
3. 50 key (khác nhau vì khác issueNumber) đặt TTL 3s. (Sự kiện dồn cùng issue -> reset TTL -> debounce.)
4. ~3s sau sự kiện cuối, 50 key hết hạn trong ~1 giây -> 50 `"ready"` -> **50 `handleTask` chạy song song**.
5. Mỗi handleTask bắn ~16-18 lượt Plane/GitHub tuần tự (~35s). 50 cái đồng thời -> **~800 request đồng thời dội vào Plane API** -> Plane API chậm dần, một số lượt có thể lỗi/timeout.
6. Lock TTL 15s < 35s -> nếu có replica thứ 2 hoặc sự kiện lặp, **xử lý trùng**.
7. Nếu handler ném lỗi (Plane 5xx do quá tải) -> `github.worker.ts:42-52` bắt lỗi, **finally luôn return true** -> **coi như xong dù thất bại** -> **không retry, không DLX** -> issue đó **âm thầm không sync**. GitHub không gửi lại (no-retry). Fork không có backfill -> **mất cho tới khi có ai sửa lại issue đó**.

**=> Trong bulk, thất bại từng phần bị NUỐT** (finally return true), và **không có lưới hứng**.

---

## 4. 202 nhanh (enqueue) hay chặn (blocking)?

**NHANH - chỉ enqueue.** Webhook handler (`controllers/index.ts:797-880`) chỉ gọi `registerStoreTask` = 1 Redis SET rồi `res.status(202)`. **Toàn bộ 35s việc nặng chạy TRỄ** (khi key hết hạn), **ngoài** vòng đời request HTTP. Vì vậy:
- GitHub **không bao giờ** thấy 35s, **không** chạm timeout ~10s, **không** mất do timeout 500.
- Event loop **không** bị chặn bởi việc nặng ở khâu nhận (khâu nhận cực nhẹ).
- Hệ quả: mất-hàng-loạt **không** đến từ đường HTTP nhận webhook. Nó đến từ (a) sự kiện expired pub/sub không bền, (b) finally-return-true nuốt lỗi, (c) không backfill.

---

## 5. Verdict prod-readiness

### Tính năng (feature) có ĐÚNG không? **CÓ.**
Map GitHub->Plane hợp lý và phòng thủ tốt: States/Priority/Issue Type/Module/Cycle/parent/ảnh đều resolve-or-create; các quan hệ hậu-ghi (module/cycle/parent) bọc try/catch best-effort không làm hỏng sync chính; HTML seed từ body đã render (giữ định dạng); echo-suppression chéo chiều nhất quán. Về đúng-đắn dữ liệu, code chắc tay.

### Độ tin cậy bulk có VỮNG không? **CHƯA.** (kèm cảnh báo no-retry + no-backfill)
Ba lỗ cộng hưởng:
1. **Vận chuyển không bền:** issue chạy qua Redis key-expiration (pub/sub), **mất vĩnh viễn** nếu silo down đúng cửa sổ hết hạn.
2. **Nuốt lỗi:** `github.worker.ts` finally luôn `return true` -> thất bại từng phần biến mất, không retry, không DLX.
3. **Không mạng lưới hồi phục:** GitHub App **không retry** ("giving up after 1 attempt") + fork **đã gỡ backfill Python cũ** -> không cách nào tự bù issue đã rớt.
Cộng thêm: lock TTL 15s < 35s -> **xử lý trùng**; 50 issue song song -> **~800 request dội Plane** tự gây đuối.

**Mất-hàng-loạt là thật hay chỉ chậm-nhỏ-giọt?**
- **Trường hợp thường:** **chậm nhỏ giọt** - mọi issue rồi cũng sync, chỉ mất ~35s/issue và dội tải Plane. Không mất dữ liệu.
- **Trường hợp mất thật:** **có thực nhưng cần trùng cửa sổ** - chỉ khi silo restart/mất-Redis đúng lúc key hết hạn, HOẶC Plane trả lỗi giữa bulk (bị finally nuốt). Khi đó issue rớt **âm thầm, vĩnh viễn** (no-retry + no-backfill). Rủi ro thấp-tần-suất nhưng **hậu quả nặng + không phát hiện được**.

### Prod so với staging
- **Prod SẼ nặng y hệt.** Độ nặng ~35s là **nội tại của code** (số lượt round-trip tuần tự per issue), **không phụ thuộc hạ tầng**. Bản stable đang chạy prod nhẹ vì **không có** rich-sync này; một khi fork lên prod, prod gánh đúng ~16-18 lượt/issue.
- **Hạ tầng prod giúp phần nào nhưng không đổi bản chất:** Plane API prod mạnh hơn -> mỗi round-trip nhanh hơn chút, nhưng vẫn là chuỗi tuần tự -> vẫn hàng chục giây/issue. Latency mạng giữa silo<->Plane mới là biến chính, không phải CPU.
- **Lỗ độ tin cậy là nội tại, môi trường không chữa:** pub/sub không bền, finally-nuốt-lỗi, thiếu backfill - đúng như nhau ở mọi môi trường. Prod thậm chí **rủi ro hơn** nếu chạy **nhiều replica silo** (khuếch đại đua-lock -> trùng).

**Khuyến nghị:** **Chưa bật cho prod chừng nào chưa có ít nhất 1 lưới an toàn** (mục 6, hạng A). Có lưới đó + cache cấp-project thì **OK cho prod với điều kiện** giám sát.

---

## 6. Tối ưu cụ thể (xếp hạng theo lợi ích/công sức)

### Hạng A - Chặn mất dữ liệu (làm TRƯỚC khi prod)
| # | Việc | Công sức | Lợi ích |
|---|------|----------|---------|
| A1 | **Bỏ `finally { return true }` nuốt lỗi** ở `github.worker.ts:49-52`; để lỗi ném ra và ghi vào một cơ chế retry/DLX. Chí ít log-cảnh-báo + đếm metric để phát hiện rớt. | Thấp (vài dòng) | Cao - biến mất-âm-thầm thành phát-hiện-được |
| A2 | **Thêm lưới hồi phục:** hoặc (a) dựa GitHub **redelivery** (gọi lại API redeliver các delivery lỗi), hoặc (b) **cron reconcile** quét issue có nhãn `plane` sửa gần đây rồi so với Plane, sync cái thiếu. | Trung bình (b: 1-2 ngày) | Cao - đóng lỗ no-retry + no-backfill |
| A3 | **Nâng lock TTL > thời gian xử lý** (vd 60-90s, hoặc gia hạn lock định kỳ) ở `manager.ts:224`. Sửa để lock không hết hạn giữa chừng. | Thấp | Cao - hết xử-lý-trùng đa-replica |

### Hạng B - Cắt độ trễ (giảm ~35s -> mục tiêu ~10-15s)
| # | Việc | Công sức | Tăng tốc kỳ vọng |
|---|------|----------|------------------|
| B1 | **Cache cấp-project cho 1 lô:** fetch `state.list`, `label.list`, `users.list`, `issueType.fetch`, `modules.list`, `cycles.list` **1 lần/project** rồi tái dùng (TTL ngắn, vd 30-60s). Truyền cache vào transform thay vì gọi `state.list` bên trong. | Trung bình | Cắt ~7 lượt/issue (~10-14s/issue); ~350 lượt thừa/lô-50 |
| B2 | **Bỏ `users.list` gọi lần 2** (issue.handler.ts:165 trùng dòng 140) - dùng lại kết quả dòng 140. | Rất thấp (1 dòng) | Cắt 1 lượt/issue ngay |
| B3 | **Song song hoá các lượt độc lập:** gộp `getIssue`+`getBodyHtml`+`getIssueFields` (3 GitHub) vào `Promise.all`; gộp các list-đọc Plane độc lập vào `Promise.all`. | Thấp-Trung bình | Cắt thời gian tường ~30-50% phần đọc |
| B4 | **Song song hoá xử lý ảnh** (content-parser.ts:198, 231 đang `for...await` tuần tự) bằng `Promise.all` có giới hạn concurrency. | Thấp | Tăng tốc issue nhiều ảnh tuyến tính theo số ảnh |

### Hạng C - Bảo vệ Plane API khỏi dội tải bulk
| # | Việc | Công sức | Lợi ích |
|---|------|----------|---------|
| C1 | **Giới hạn concurrency đường store** (vd p-limit N=5-10 khi fan-out `handleTask` ở manager.ts:140) để bulk 50 không dội ~800 request đồng thời sang Plane. | Thấp | Tránh Plane đuối -> giảm lỗi/timeout -> giảm rớt |
| C2 | **Cân nhắc chuyển issue sang đường RabbitMQ bền** (thay Redis-expiration) để có DLX + retry + ack thật cho issue. Đây là sửa gốc cho lỗ "vận chuyển không bền" nhưng đụng kiến trúc. | Cao | Cao - nhưng cân nhắc kỹ, thay debounce hiện có |
| C3 | **Dọn config chết:** `BATCH_SIZE` không dùng; ghi rõ `MQ_PREFETCH_COUNT` không áp cho issue để người vận hành khỏi chỉnh nhầm mong tăng throughput issue. | Rất thấp | Tránh hiểu nhầm vận hành |

**Đường ngắn nhất tới prod:** A1 + A2 + A3 (lưới an toàn) rồi B1 + B2 + C1 (cắt trễ + chống dội). B3/B4 là tối ưu thêm.

---

## Câu hỏi còn treo
- Prod có chạy **nhiều replica silo** không? Nếu có, đua-lock (A3) và xử-lý-trùng thành ưu tiên cao hơn.
- Chọn lưới hồi phục theo GitHub **redelivery** hay **cron reconcile** (A2) - cần quyết định vận hành (redelivery đơn giản hơn, reconcile chắc hơn).
- Có chấp nhận đổi cơ chế issue từ Redis-expiration sang RabbitMQ (C2) không, hay giữ debounce hiện tại và chỉ vá A1-A3?
