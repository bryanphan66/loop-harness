// Nguồn duy nhất cho toàn bộ chữ nghĩa: lời đọc (VO) + chữ trên màn hình.
// scripts/build-vo.mjs và các component Remotion cùng đọc file này,
// nên không bao giờ lệch giữa tiếng đọc và chữ hiện ra.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Khoảng lặng đầu mỗi cảnh trước khi có tiếng (giây).
export const LEAD_SEC = 0.27;
// Đệm sau khi dứt tiếng để hình không bị cắt (giây).
export const TAIL_SEC = 1.8;

export const CLINIC = {
  name: 'Phòng khám Đa khoa Hạnh Ngọc',
  address:
    '1017A, Quốc lộ 91, Ấp Mỹ Phó, Xã Mỹ Đức, Huyện Châu Phú, An Giang',
  phones: ['0296 6262 692', '0398 451 001'],
  hours: '7h00 – 17h00, Thứ 2 đến Thứ 7',
  web: 'hanhngoc.com',
  facebook: 'facebook.com/phongkhamhanhngoc',
};

// Bắt buộc hiện suốt video — ràng buộc nội dung ngành y tế.
export const DISCLAIMER = 'Nội dung tham khảo, không thay thế việc thăm khám';

/**
 * Thẻ kết có hai biến thể — đổi một chữ ở đây là đổi cả ba video.
 *
 *   'giao-duc' — CHỈ nội dung giáo dục sức khoẻ. Không địa chỉ, không số điện
 *                thoại, không giờ mở cửa. Tên phòng khám chỉ còn ở thanh trên
 *                (ghi nguồn). Đây là biến thể ít chạm vào luật quảng cáo dịch
 *                vụ khám chữa bệnh nhất.
 *
 *   'lien-he'  — Thêm thẻ đầy đủ: địa chỉ, 2 số điện thoại, giờ, web, fanpage.
 *                Có mời gọi dùng dịch vụ, nên nhiều khả năng bị xem là quảng
 *                cáo dịch vụ khám chữa bệnh → phải hỏi pháp chế / Sở Y Tế
 *                TRƯỚC khi đăng.
 *
 * Không tự quyết hộ phòng khám: mặc định để bản an toàn hơn.
 */
export const END_CARD_MODE = 'giao-duc';

export const VIDEOS = {
  DauLung: {
    slug: 'dau-lung',
    title: '3 động tác giảm đau lưng tại nhà',
    voice: 'vi-VN-HoaiMyNeural',
    rate: '-8%',
    scenes: [
      {
        id: '01',
        kind: 'hook',
        vo: 'Đau lưng mỗi khi đứng lên ngồi xuống?',
        heading: 'Đau lưng mỗi khi\nđứng lên ngồi xuống?',
        figure: 'backache',
      },
      {
        id: '02',
        kind: 'intro',
        vo: 'Ba động tác này làm tại nhà, mỗi ngày một lần.',
        heading: '3 động tác\nlàm tại nhà',
        note: 'Mỗi ngày một lần',
        chips: ['Ôm gối', 'Nghiêng gối', 'Cong lưng'],
        figure: 'mat',
      },
      {
        id: '03',
        kind: 'step',
        vo: 'Động tác một. Nằm ngửa, ôm một bên gối kéo nhẹ về phía ngực. Giữ mười giây rồi đổi bên. Làm ba lần mỗi bên.',
        step: 1,
        heading: 'Ôm gối về ngực',
        lines: [
          'Nằm ngửa, ôm một bên gối',
          'kéo nhẹ về phía ngực',
        ],
        meta: 'Giữ 10 giây · đổi bên · 3 lần mỗi bên',
        figure: 'kneeToChest',
      },
      {
        id: '04',
        kind: 'step',
        vo: 'Động tác hai. Gập hai gối, nghiêng nhẹ sang trái rồi sang phải. Vai giữ sát mặt sàn. Làm mười lần mỗi bên.',
        step: 2,
        heading: 'Nghiêng gối trái – phải',
        lines: [
          'Gập hai gối, nghiêng nhẹ',
          'sang trái rồi sang phải',
          'Vai giữ sát mặt sàn',
        ],
        meta: '10 lần mỗi bên',
        figure: 'kneeRoll',
      },
      {
        id: '05',
        kind: 'step',
        vo: 'Động tác ba. Quỳ chống tay, cong lưng lên rồi hạ xuống thật chậm. Làm mười lần.',
        step: 3,
        heading: 'Cong lưng – hạ lưng',
        lines: [
          'Quỳ chống tay, cong lưng lên',
          'rồi hạ xuống thật chậm',
        ],
        meta: '10 lần',
        figure: 'catCow',
      },
      {
        id: '06',
        kind: 'outro',
        vo: 'Nếu đau kéo dài quá hai tuần, hoặc lan xuống chân, nên đi khám.',
        heading: 'Khi nào nên đi khám?',
        bullets: ['Đau kéo dài quá 2 tuần', 'Đau lan xuống chân'],
      },
    ],
  },

  TaiBien: {
    slug: 'tai-bien',
    title: 'Sau tai biến, tập lại từ lúc nào?',
    voice: 'vi-VN-HoaiMyNeural',
    rate: '-8%',
    scenes: [
      {
        id: '01',
        kind: 'hook',
        vo: 'Người nhà vừa qua cơn tai biến, khi nào thì tập lại được?',
        heading: 'Sau tai biến,\ntập lại từ lúc nào?',
        figure: 'family',
      },
      {
        id: '02',
        kind: 'intro',
        vo: 'Mỗi người một tình trạng khác nhau, nên thời điểm bắt đầu do bác sĩ quyết định.',
        heading: 'Bác sĩ là người\nquyết định thời điểm',
        note: 'Mỗi người một tình trạng',
        chips: ['Khám', 'Đánh giá', 'Hướng dẫn'],
        figure: 'mat',
      },
      {
        id: '03',
        kind: 'step',
        vo: 'Thông thường, khi các dấu hiệu đã ổn định, bác sĩ sẽ cho tập vận động sớm ngay tại giường.',
        step: 1,
        heading: 'Khi dấu hiệu đã ổn định',
        lines: [
          'Bác sĩ cho tập vận động sớm',
          'ngay tại giường',
        ],
        meta: 'Theo chỉ định của bác sĩ',
        figure: 'bedside',
      },
      {
        id: '04',
        kind: 'step',
        vo: 'Giai đoạn đầu chỉ là những việc nhỏ. Trở mình, ngồi dậy có người đỡ, cử động tay chân nhẹ nhàng.',
        step: 2,
        heading: 'Bắt đầu từ việc nhỏ',
        lines: [
          'Trở mình, ngồi dậy có người đỡ',
          'Cử động tay chân nhẹ nhàng',
        ],
        meta: 'Chậm và nhẹ',
        figure: 'assistedSit',
      },
      {
        id: '05',
        kind: 'step',
        vo: 'Quan trọng là tập đều mỗi ngày, và tập đúng cách theo hướng dẫn của kỹ thuật viên.',
        step: 3,
        heading: 'Tập đều, tập đúng cách',
        lines: [
          'Đều đặn mỗi ngày',
          'Theo hướng dẫn của kỹ thuật viên',
        ],
        meta: 'Vật lý trị liệu – phục hồi chức năng',
        figure: 'walkAssist',
      },
      {
        id: '06',
        kind: 'outro',
        vo: 'Nếu chưa rõ nên bắt đầu từ đâu, đưa người nhà đi khám để được đánh giá và hướng dẫn.',
        heading: 'Chưa rõ bắt đầu từ đâu?',
        bullets: ['Đưa người nhà đi khám', 'Được đánh giá và hướng dẫn'],
      },
    ],
  },

  CoVaiGay: {
    slug: 'co-vai-gay',
    title: 'Giãn cổ vai gáy cho người ngồi nhiều',
    voice: 'vi-VN-HoaiMyNeural',
    rate: '-8%',
    scenes: [
      {
        id: '01',
        kind: 'hook',
        vo: 'Ngồi lâu một chỗ, cổ vai gáy mỏi nhức?',
        heading: 'Ngồi lâu một chỗ,\ncổ vai gáy mỏi nhức?',
        figure: 'deskNeck',
      },
      {
        id: '02',
        kind: 'intro',
        vo: 'Ba động tác giãn cơ, làm ngay tại chỗ, mỗi lần chừng một phút.',
        heading: '3 động tác\nlàm ngay tại chỗ',
        note: 'Mỗi lần chừng 1 phút',
        chips: ['Nghiêng cổ', 'Xoay vai', 'Thu cằm'],
        figure: 'mat',
      },
      {
        id: '03',
        kind: 'step',
        vo: 'Động tác một. Ngồi thẳng lưng, nghiêng đầu sang một bên, tay kéo nhẹ. Giữ mười lăm giây rồi đổi bên.',
        step: 1,
        heading: 'Nghiêng cổ sang bên',
        lines: [
          'Ngồi thẳng lưng, nghiêng đầu',
          'sang một bên, tay kéo nhẹ',
        ],
        meta: 'Giữ 15 giây · đổi bên',
        figure: 'neckTilt',
      },
      {
        id: '04',
        kind: 'step',
        vo: 'Động tác hai. Xoay hai vai ra sau mười vòng, rồi ra trước mười vòng. Thở đều.',
        step: 2,
        heading: 'Xoay vai',
        lines: [
          'Xoay hai vai ra sau 10 vòng',
          'rồi ra trước 10 vòng',
        ],
        meta: 'Thở đều',
        figure: 'shoulderRoll',
      },
      {
        id: '05',
        kind: 'step',
        vo: 'Động tác ba. Thu nhẹ cằm về phía sau, giữ năm giây rồi thả. Làm mười lần.',
        step: 3,
        heading: 'Thu cằm',
        lines: [
          'Thu nhẹ cằm về phía sau',
          'giữ 5 giây rồi thả',
        ],
        meta: '10 lần',
        figure: 'chinTuck',
      },
      {
        id: '06',
        kind: 'outro',
        vo: 'Ngồi lâu thì mỗi giờ nên đứng dậy đi lại một chút. Nếu tê tay hoặc đau kéo dài, nên đi khám.',
        heading: 'Khi nào nên đi khám?',
        bullets: ['Tê tay', 'Đau kéo dài'],
      },
    ],
  },
};

export const VIDEO_IDS = Object.keys(VIDEOS);
