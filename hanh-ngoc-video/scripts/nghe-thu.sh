#!/usr/bin/env bash
# Nghe thử hai giọng tiếng Việt của edge-tts trước khi dựng cả video.
# Chỉ cần Python, KHÔNG cần node/ffmpeg/Remotion.
#
#   bash scripts/nghe-thu.sh
#
# Nghe xong chọn giọng rồi chạy:
#   node scripts/build-vo.mjs --voice vi-VN-HoaiMyNeural
set -euo pipefail

command -v edge-tts >/dev/null || { echo "Chưa có edge-tts. Chạy: pip install edge-tts"; exit 1; }

OUT="nghe-thu"
mkdir -p "$OUT"

# Đoạn thử có đủ chỗ dễ sai: thanh điệu dày, số đếm viết bằng chữ,
# và hai từ chuyên môn cần nghe kỹ ("thoát vị", "phục hồi chức năng").
DEMO="Đau lưng mỗi khi đứng lên ngồi xuống? Động tác một. Nằm ngửa, ôm một bên gối kéo nhẹ về phía ngực. Giữ mười giây rồi đổi bên. Nếu đau kéo dài quá hai tuần, hoặc lan xuống chân, nên đi khám. Phòng khám có vật lý trị liệu và phục hồi chức năng."

for V in vi-VN-HoaiMyNeural vi-VN-NamMinhNeural; do
  echo "▶ $V"
  edge-tts --voice "$V" --rate=-8% --text "$DEMO" --write-media "$OUT/$V.mp3"
done

echo
echo "Xong. Hai file ở thư mục $OUT/:"
ls -1 "$OUT"
echo
echo "Nghe rồi chọn, sau đó:  node scripts/build-vo.mjs --voice <tên giọng>"
