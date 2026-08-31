# Video truyền thông — Phòng khám Đa khoa Hạnh Ngọc

Template Remotion dựng video dọc **1080×1920, 30fps** cho Facebook / Reels / TikTok.
Ba video dùng chung một bộ khung; thêm video thứ tư chỉ là thêm một mục trong
`src/content.mjs`.

| Composition | Nội dung | Người xem |
|---|---|---|
| `DauLung` | 3 động tác giảm đau lưng tại nhà | bà con 45–70 tuổi |
| `TaiBien` | Sau tai biến, tập lại từ lúc nào? | con cái của bệnh nhân |
| `CoVaiGay` | Giãn cổ vai gáy cho người ngồi nhiều | nhóm trẻ hơn, lái xe và buôn bán |

## Chạy

```bash
npm install
node scripts/build-vo.mjs          # sinh lời đọc + tính khung hình
npx remotion studio src/index.jsx  # xem thử
node scripts/render-all.mjs        # render cả ba ra out/
node scripts/verify.mjs            # nghiệm thu tự động
```

Render một video: `node scripts/render-all.mjs DauLung`.
Nếu Remotion không tự tìm được Chrome, đặt `REMOTION_BROWSER_EXECUTABLE=<đường dẫn chrome>`
(hoặc thêm `--browser-executable=…` khi gọi `npx remotion render` trực tiếp).

## Bộ khung dùng chung

```
src/
  content.mjs        ← NGUỒN DUY NHẤT: lời đọc + chữ trên màn hình + thông tin phòng khám
  slots.json         ← SINH TỰ ĐỘNG: thời lượng từng cảnh (đừng sửa tay)
  VideoTemplate.jsx  ← bộ dựng dùng chung cho cả ba video
  DauLung.jsx  TaiBien.jsx  CoVaiGay.jsx   ← mỗi file chỉ 3 dòng, không copy-paste
  Root.jsx           ← đăng ký composition, durationInFrames đọc từ slots.json
  brand/
    theme.js         ← màu, cỡ chữ, lề an toàn
    Frame.jsx        ← nền + thanh thương hiệu + DÒNG CHỮ NHỎ + vạch tiến độ
    Cards.jsx        ← 4 kiểu cảnh: hook / intro / step / outro (thẻ kết)
    Figure.jsx       ← hình vẽ dáng người vô danh, dựng từ vài khối cơ bản
```

Muốn đổi màu, đổi thẻ kết hay đổi dòng chữ nhỏ thì sửa trong `brand/` — cả ba video
đổi theo. Muốn thêm động tác mới thì thêm một hàm toạ độ trong `Figure.jsx`.

## Lời đọc

`scripts/build-vo.mjs` làm trọn gói: sinh tiếng → đo bằng `ffprobe` → tính frame →
ghi `src/slots.json`. Lần sau làm video khác chỉ cần chạy lại.

```bash
node scripts/build-vo.mjs                                  # cả ba, giọng nữ
node scripts/build-vo.mjs --video DauLung                   # một video
node scripts/build-vo.mjs --voice vi-VN-NamMinhNeural       # đổi sang giọng nam
node scripts/build-vo.mjs --rate=-12%                       # đọc chậm hơn nữa
node scripts/build-vo.mjs --tail 2.2                        # đệm hình dài hơn
```

Engine mặc định là **edge-tts** (`pip install edge-tts`) — miễn phí, không cần key.
Giọng: `vi-VN-HoaiMyNeural` (nữ) và `vi-VN-NamMinhNeural` (nam).

Ba điều đã sửa so với bản cũ, đừng làm lại:

1. **Không dùng lại piper `vi_VN-vais1000-medium`** — sai thanh điệu.
2. **Không dùng `ffmpeg atempo`.** Muốn nhanh/chậm thì chỉnh `--rate` của chính TTS;
   `atempo` kéo giãn sóng nên méo tiếng.
3. **Mỗi câu sinh riêng rồi ghép**, chèn khoảng lặng `--gap` (mặc định 0.30s) giữa các câu.
   Vừa né lỗi engine chỉ giữ câu cuối, vừa cho bà con nghe kịp.

### Số frame mỗi cảnh

```
frames = ceil((0.27 + thời_lượng_lời_đọc + đệm) × 30)
```

`0.27s` là khoảng lặng trước khi có tiếng, đệm mặc định `1.8s` để hình không cắt ngay
khi dứt tiếng. `durationInFrames` của mỗi composition đọc thẳng từ tổng `frames` trong
`slots.json`, nên **tổng SLOTS luôn bằng `durationInFrames`** — `VideoTemplate.jsx` còn
ném lỗi ngay lúc dựng nếu hai số này lệch.

### Âm lượng

Mức được tính ngược từ mục tiêu: mỗi file được kéo tới mức sao cho **mean của video
cuối rơi vào khoảng nghiệm thu −16…−24 dB**, rồi `alimiter` chặn đỉnh ở −3 dBFS.
Hai cái bẫy đã xử lý sẵn:

* `alimiter` mặc định **bật auto-level**, nó kéo ngược tín hiệu lên sát 0 dBFS và xoá
  mức mình vừa đặt → phải `level=disabled`.
* File lời đọc xuất ra **stereo** (`pan=stereo|c0=c0|c1=c0`). Để ffmpeg tự đổi mono→stereo
  là mất đúng **3 dB**.

## Nghiệm thu

`node scripts/verify.mjs` chạy các mục sau và trả mã lỗi khác 0 nếu có mục hỏng:

* **Ràng buộc nội dung** — quét toàn bộ chữ người xem đọc/nghe được: không có
  "khỏi hẳn / dứt điểm / cam kết / thay thế thuốc / trước và sau…", không có con số
  hiệu quả điều trị, có dòng chữ nhỏ bắt buộc, cảnh kết là thẻ dẫn đi khám.
* **Kỹ thuật** — 1080×1920, có luồng audio, thời lượng khớp tổng SLOTS/30.
* **Âm lượng** — mean trong khoảng −16…−24 dB.
* **Khung hình** — trích khung giữa mỗi cảnh ra `out/frames/<Video>/` để soi dấu tiếng
  Việt và mép hình bằng mắt.
* **Tràn tiếng** — không cảnh nào bị lời đọc lấn sang cảnh sau.
* **Giọng** — nếu `slots.json` ghi `placeholder: true` thì báo hỏng ngay, không cho
  đem giao.

## Ràng buộc nội dung (ngành y tế — vi phạm là bị phạt)

Bắt buộc giữ:

* Dòng chữ nhỏ **"Nội dung tham khảo, không thay thế việc thăm khám"** hiện suốt video.
* Cảnh kết dẫn về **việc đi khám**, không dẫn về việc mua gói.

Tuyệt đối không thêm: "khỏi hẳn", "dứt điểm", "cam kết", "hiệu quả 100%",
"thay thế thuốc"; con số hiệu quả điều trị; hình trước–sau; lời chứng thực bệnh nhân;
nhân vật được giới thiệu là bác sĩ hoặc bệnh nhân của phòng khám.

Hình trong video là **hình vẽ dáng người vô danh, không mặt mũi** — giữ nguyên như vậy.
Giọng đọc là **người dẫn chuyện của phòng khám**, không tự xưng bác sĩ.

## Chữ tiếng Việt

Dùng `Liberation Sans` / `DejaVu Sans` vì có đủ dấu tiếng Việt. Đã kiểm tra bảng mã của
cả hai font: có đủ `Ữ ữ Ợ ợ Ẳ ẳ Đ ệ ỗ ự ỡ ậ`. **Đổi font thì phải kiểm lại** — nhiều font
Latin thiếu khối Latin Extended Additional (U+1EA0–U+1EF9) và sẽ vỡ dấu.

Số đếm trong lời đọc viết bằng chữ ("mười giây") vì TTS đọc số Ả Rập hay sai; chữ trên
màn hình vẫn dùng số ("10 giây") cho dễ liếc.

## Yêu cầu môi trường

Node 22, `ffmpeg` + `ffprobe`, một bản Chrome cho Remotion, và `edge-tts` cho lời đọc.
