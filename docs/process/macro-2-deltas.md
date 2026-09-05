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
| MD-01 | autocontent, trước 2.1 | dựng môi trường, đọc `reno-ui/docs/tailwind-v4-requirement.md` | macro-2 không có bước nào kiểm tier-2 token có chạy được với thư viện UI của dự án không | thêm bước kiểm tương thích trước 2.4 | mở |

| MD-02 | autocontent, trước 2.1 | luật do operator đưa 2026-09-05 | macro-2 không định nghĩa ranh giới UI custom vs UI component, và không có đường đẩy ngược component tái dùng lên thư viện gốc | thêm luật 3 vùng + gate lint theo vùng + bước đẩy ngược | mở |

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
