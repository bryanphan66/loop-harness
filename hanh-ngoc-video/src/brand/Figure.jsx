import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { C } from './theme.js';

/**
 * Bộ hình vẽ dáng người VÔ DANH — không mặt mũi, không danh tính,
 * không phải bác sĩ hay bệnh nhân của phòng khám. Chỉ là hình minh hoạ động tác.
 *
 * Mọi tư thế đều dựng từ vài khối cơ bản (đầu / thân / chi) nên thêm động tác
 * mới chỉ là thêm một hàm toạ độ, không phải vẽ lại SVG.
 */

const VB = { w: 600, h: 400 };

// ─── khối cơ bản ────────────────────────────────────────────────────────────
const Limb = ({ from, to, w = 26, color = C.figure, opacity = 1 }) => (
  <line
    x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
    stroke={color} strokeWidth={w} strokeLinecap="round" opacity={opacity}
  />
);

const Head = ({ at, r = 33, color = C.figure }) => (
  <circle cx={at[0]} cy={at[1]} r={r} fill={color} />
);

const Spine = ({ points, w = 34, color = C.figure }) => {
  const [a, c, b] = points;
  return (
    <path
      d={`M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${b[0]} ${b[1]}`}
      stroke={color} strokeWidth={w} strokeLinecap="round" fill="none"
    />
  );
};

const Floor = ({ y = 340, color = C.figureSoft }) => (
  <line x1={40} y1={y} x2={560} y2={y} stroke={color} strokeWidth={8} strokeLinecap="round" />
);

const Mat = ({ y = 336 }) => (
  <rect x={60} y={y} width={480} height={18} rx={9} fill={C.mat} />
);

const Ache = ({ at, t }) => {
  const o = interpolate(t, [0, 0.5, 1], [0.25, 0.9, 0.25]);
  return (
    <g opacity={o} stroke={C.accent} strokeWidth={7} fill="none" strokeLinecap="round">
      <path d={`M ${at[0] - 6} ${at[1] - 26} q 14 12 0 24`} />
      <path d={`M ${at[0] + 12} ${at[1] - 34} q 20 18 0 34`} />
    </g>
  );
};

const rot = (p, o, deg) => {
  const a = (deg * Math.PI) / 180;
  const dx = p[0] - o[0];
  const dy = p[1] - o[1];
  return [o[0] + dx * Math.cos(a) - dy * Math.sin(a), o[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};

// ─── các tư thế ─────────────────────────────────────────────────────────────
// t chạy 0→1→0 liên tục; mỗi tư thế tự quyết dùng t thế nào.
const POSES = {
  // Đứng, tay chống lưng dưới — cảnh mở đầu bài đau lưng
  // Đứng, tay chống lưng dưới — cảnh mở đầu bài đau lưng
  backache: (t) => {
    const lean = interpolate(t, [0, 1], [0, 6]);
    const neck = [286, 118];
    const hip = [286 - lean, 240];
    return (
      <g>
        <Floor />
        <Limb from={[300, 244]} to={[318, 316]} w={24} color={C.figureSoft} />
        <Limb from={[318, 316]} to={[324, 384]} w={24} color={C.figureSoft} />
        <Head at={[286 + lean * 0.7, 72]} />
        <Spine points={[neck, [278, 180], hip]} />
        <Limb from={hip} to={[278, 316]} />
        <Limb from={[278, 316]} to={[274, 384]} />
        <Limb from={neck} to={[248, 188]} w={20} />
        <Limb from={[248, 188]} to={[276, 238]} w={20} />
        <Ache at={[336, 226]} t={t} />
      </g>
    );
  },

  // Ngồi xếp bằng trên thảm — cảnh giới thiệu
  mat: (t) => {
    const b = interpolate(t, [0, 1], [0, -6]);
    return (
      <g>
        <Mat />
        <Head at={[300, 128 + b]} />
        <Spine points={[[300, 172 + b], [304, 220 + b], [300, 268]]} />
        <Limb from={[300, 268]} to={[368, 300]} w={24} />
        <Limb from={[368, 300]} to={[300, 326]} w={24} />
        <Limb from={[300, 268]} to={[232, 300]} w={24} color={C.figureSoft} />
        <Limb from={[232, 300]} to={[300, 326]} w={24} color={C.figureSoft} />
        <Limb from={[300, 186 + b]} to={[246, 250 + b]} w={19} />
        <Limb from={[300, 186 + b]} to={[354, 250 + b]} w={19} color={C.figureSoft} />
      </g>
    );
  },

  // Nằm ngửa, ôm một bên gối kéo về ngực
  kneeToChest: (t) => {
    const pull = interpolate(t, [0, 1], [0, 26]);
    const hip = [356, 286];
    const knee = [312 - pull * 0.5, 196 - pull * 0.5];
    const ankle = [252 - pull, 236 - pull * 0.4];
    return (
      <g>
        <Mat />
        <Head at={[136, 262]} />
        <Spine points={[[180, 274], [270, 284], hip]} />
        <Limb from={hip} to={[452, 292]} w={24} color={C.figureSoft} />
        <Limb from={[452, 292]} to={[534, 300]} w={24} color={C.figureSoft} />
        <Limb from={hip} to={knee} />
        <Limb from={knee} to={ankle} />
        <Limb from={[196, 272]} to={[250, 226]} w={19} />
        <Limb from={[250, 226]} to={knee} w={19} />
      </g>
    );
  },

  // Nằm ngửa, gập hai gối, nghiêng trái – phải
  kneeRoll: (t) => {
    const deg = interpolate(t, [0, 1], [-26, 26]);
    const hip = [356, 286];
    const knee = rot([320, 190], hip, deg);
    const ankle = rot([386, 214], hip, deg);
    return (
      <g>
        <Mat />
        <Head at={[136, 268]} />
        <Spine points={[[180, 278], [270, 288], hip]} />
        <Limb from={[190, 272]} to={[150, 320]} w={19} color={C.figureSoft} />
        <Limb from={[190, 282]} to={[152, 232]} w={19} />
        <Limb from={hip} to={knee} />
        <Limb from={knee} to={ankle} />
        <Limb from={hip} to={[knee[0] + 16, knee[1] + 10]} w={22} color={C.figureSoft} />
        <Limb from={[knee[0] + 16, knee[1] + 10]} to={[ankle[0] + 16, ankle[1] + 10]} w={22} color={C.figureSoft} />
      </g>
    );
  },

  // Quỳ chống tay, cong lưng lên rồi hạ xuống
  catCow: (t) => {
    const arch = interpolate(t, [0, 1], [232, 150]);
    const headY = interpolate(t, [0, 1], [210, 246]);
    return (
      <g>
        <Mat />
        <Spine points={[[228, 200], [318, arch], [412, 200]]} />
        <Head at={[168, headY]} r={31} />
        <Limb from={[228, 204]} to={[218, 328]} />
        <Limb from={[412, 204]} to={[424, 268]} />
        <Limb from={[424, 268]} to={[398, 328]} />
        <Limb from={[416, 206]} to={[444, 268]} w={22} color={C.figureSoft} />
        <Limb from={[444, 268]} to={[420, 328]} w={22} color={C.figureSoft} />
      </g>
    );
  },

  // Hai người: một người đứng đỡ một người — cảnh mở đầu bài tai biến
  family: (t) => {
    const b = interpolate(t, [0, 1], [0, -5]);
    return (
      <g>
        <Floor />
        <Head at={[232, 96 + b]} r={31} color={C.figureSoft} />
        <Spine points={[[232, 138 + b], [230, 200], [234, 252]]} />
        <Limb from={[234, 252]} to={[220, 320]} w={24} color={C.figureSoft} />
        <Limb from={[220, 320]} to={[216, 384]} w={24} color={C.figureSoft} />
        <Limb from={[232, 154 + b]} to={[292, 196]} w={19} color={C.figureSoft} />
        <Head at={[368, 118]} />
        <Spine points={[[368, 160], [362, 214], [366, 262]]} />
        <Limb from={[366, 262]} to={[352, 324]} />
        <Limb from={[352, 324]} to={[348, 384]} />
        <Limb from={[366, 262]} to={[392, 324]} w={24} color={C.figureSoft} />
        <Limb from={[392, 324]} to={[396, 384]} w={24} color={C.figureSoft} />
        <Limb from={[368, 176]} to={[300, 200]} w={19} />
      </g>
    );
  },

  // Nằm trên giường, đầu giường nâng nhẹ
  // Nằm trên giường, đầu giường nâng nhẹ
  bedside: (t) => {
    const lift = interpolate(t, [0, 1], [0, -12]);
    return (
      <g>
        <rect x={76} y={286} width={452} height={30} rx={12} fill="#fff" stroke={C.figureSoft} strokeWidth={6} />
        <rect x={96} y={316} width={16} height={56} rx={8} fill={C.figureSoft} />
        <rect x={492} y={316} width={16} height={56} rx={8} fill={C.figureSoft} />
        <rect x={96} y={252} width={78} height={40} rx={18} fill={C.figureSoft} />
        <Head at={[172, 238 + lift]} />
        <Spine points={[[214, 252 + lift], [300, 272], [386, 282]]} />
        <Limb from={[386, 282]} to={[452, 286]} w={24} />
        <Limb from={[452, 286]} to={[508, 288]} w={24} />
        <Limb from={[226, 258 + lift]} to={[300, 268]} w={19} color={C.figureSoft} />
      </g>
    );
  },

  // Ngồi dậy ở mép giường, có người đỡ
  assistedSit: (t) => {
    const up = interpolate(t, [0, 1], [0, -12]);
    return (
      <g>
        <rect x={230} y={300} width={310} height={22} rx={11} fill={C.figureSoft} />
        <Head at={[336, 150 + up]} />
        <Spine points={[[336, 192 + up], [338, 244], [340, 296]]} />
        <Limb from={[340, 296]} to={[392, 336]} />
        <Limb from={[392, 336]} to={[384, 386]} />
        <Limb from={[336, 208 + up]} to={[286, 258]} w={19} />
        <Head at={[186, 128]} r={30} color={C.figureSoft} />
        <Spine points={[[186, 168], [184, 226], [188, 274]]} />
        <Limb from={[188, 274]} to={[176, 330]} w={23} color={C.figureSoft} />
        <Limb from={[176, 330]} to={[172, 384]} w={23} color={C.figureSoft} />
        <Limb from={[186, 184]} to={[266, 232]} w={19} color={C.figureSoft} />
      </g>
    );
  },

  // Tập đi có điểm tựa
  walkAssist: (t) => {
    const step = interpolate(t, [0, 1], [-16, 16]);
    return (
      <g>
        <Floor />
        <rect x={392} y={168} width={16} height={200} rx={8} fill={C.figureSoft} />
        <rect x={330} y={168} width={100} height={16} rx={8} fill={C.figureSoft} />
        <Head at={[276, 92]} />
        <Spine points={[[276, 134], [272, 194], [278, 250]]} />
        <Limb from={[278, 250]} to={[262 + step, 316]} />
        <Limb from={[262 + step, 316]} to={[256 + step, 382]} />
        <Limb from={[278, 250]} to={[296 - step, 316]} w={24} color={C.figureSoft} />
        <Limb from={[296 - step, 316]} to={[302 - step, 382]} w={24} color={C.figureSoft} />
        <Limb from={[276, 150]} to={[352, 178]} w={19} />
      </g>
    );
  },

  // Ngồi lâu, cổ chúi về trước
  // Ngồi lâu, cổ chúi về trước
  deskNeck: (t) => {
    const fwd = interpolate(t, [0, 1], [0, 14]);
    return (
      <g>
        <rect x={344} y={236} width={196} height={16} rx={8} fill={C.figureSoft} />
        <rect x={520} y={252} width={14} height={116} rx={7} fill={C.figureSoft} />
        <rect x={196} y={288} width={132} height={16} rx={8} fill={C.figureSoft} />
        <rect x={196} y={182} width={14} height={112} rx={7} fill={C.figureSoft} />
        <rect x={230} y={304} width={14} height={64} rx={7} fill={C.figureSoft} />
        <Head at={[286 + fwd, 132]} />
        <Spine points={[[282 + fwd * 0.5, 176], [268, 232], [272, 284]]} />
        <Limb from={[272, 284]} to={[344, 294]} w={24} />
        <Limb from={[344, 294]} to={[352, 366]} w={24} />
        <Limb from={[280 + fwd * 0.4, 192]} to={[358, 232]} w={19} />
        <Ache at={[322, 152]} t={t} />
      </g>
    );
  },

  // Nghiêng đầu sang bên, tay kéo nhẹ (nhìn thẳng)
  // Nghiêng đầu sang bên, tay kéo nhẹ (nhìn thẳng)
  neckTilt: (t) => {
    const deg = interpolate(t, [0, 1], [0, 18]);
    return (
      <g>
        <rect x={244} y={314} width={112} height={16} rx={8} fill={C.figureSoft} />
        <rect x={252} y={330} width={14} height={48} rx={7} fill={C.figureSoft} />
        <rect x={334} y={330} width={14} height={48} rx={7} fill={C.figureSoft} />
        <Limb from={[240, 202]} to={[360, 202]} w={30} />
        <Spine points={[[300, 202], [300, 258], [300, 312]]} />
        <Limb from={[244, 206]} to={[226, 282]} w={19} color={C.figureSoft} />
        {/* đầu + cổ nghiêng quanh gốc cổ, tay bên kia vòng qua đỉnh đầu kéo nhẹ */}
        <g transform={`rotate(${deg} 300 202)`}>
          <Limb from={[300, 202]} to={[300, 168]} w={24} />
          <Head at={[300, 132]} />
        </g>
        <Limb from={[356, 200]} to={[392, 142]} w={19} />
        <Limb from={[392, 142]} to={[330 + deg * 1.1, 104 + deg * 0.5]} w={19} />
      </g>
    );
  },

  // Xoay hai vai (nhìn thẳng)
  // Xoay hai vai (nhìn thẳng) — dùng pha liên tục p để vai chạy vòng tròn
  shoulderRoll: (_t, p) => {
    const a = p * Math.PI * 2;
    const dx = Math.cos(a) * 13;
    const dy = Math.sin(a) * 13;
    const sl = [246 + dx, 206 + dy];
    const sr = [354 + dx, 206 + dy];
    return (
      <g>
        <rect x={244} y={314} width={112} height={16} rx={8} fill={C.figureSoft} />
        <rect x={252} y={330} width={14} height={48} rx={7} fill={C.figureSoft} />
        <rect x={334} y={330} width={14} height={48} rx={7} fill={C.figureSoft} />
        <Spine points={[[300, 210], [300, 262], [300, 312]]} />
        <Limb from={sl} to={sr} w={30} />
        <Limb from={[300, 206]} to={[300, 172]} w={24} />
        <Head at={[300, 136]} />
        <Limb from={sl} to={[sl[0] - 26, sl[1] + 74]} w={19} />
        <Limb from={sr} to={[sr[0] + 26, sr[1] + 74]} w={19} color={C.figureSoft} />
        <g stroke={C.accent} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.85}>
          <path d="M 186 178 a 30 30 0 1 1 6 34" />
          <path d="M 186 212 l -12 -14 M 186 212 l 16 -6" />
          <path d="M 414 178 a 30 30 0 1 0 -6 34" />
          <path d="M 414 212 l 12 -14 M 414 212 l -16 -6" />
        </g>
      </g>
    );
  },

  // Thu cằm về sau (nhìn nghiêng)
  // Thu cằm về sau (nhìn nghiêng)
  chinTuck: (t) => {
    const back = interpolate(t, [0, 1], [20, -4]);
    return (
      <g>
        <rect x={244} y={306} width={130} height={16} rx={8} fill={C.figureSoft} />
        <rect x={252} y={322} width={14} height={52} rx={7} fill={C.figureSoft} />
        <rect x={244} y={196} width={14} height={116} rx={7} fill={C.figureSoft} />
        <Spine points={[[286, 194], [280, 246], [284, 304]]} />
        <Limb from={[284, 304]} to={[356, 312]} w={24} />
        <Limb from={[356, 312]} to={[364, 378]} w={24} />
        <Limb from={[286, 206]} to={[306, 272]} w={19} color={C.figureSoft} />
        <Limb from={[288 + back * 0.5, 190]} to={[290 + back, 168]} w={24} />
        <Head at={[292 + back, 130]} />
        <g stroke={C.accent} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.9}>
          <path d="M 398 78 h -62" />
          <path d="M 350 66 l -14 12 l 14 12" />
        </g>
      </g>
    );
  },
};

export const Figure = ({ name, cycleSec = 2.6, height = 400 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pose = POSES[name];
  if (!pose) return null;

  // t đi 0→1→0 để động tác lặp mượt, không giật khi quay lại đầu chu kỳ.
  const p = (frame % (cycleSec * fps)) / (cycleSec * fps);
  const t = p < 0.5 ? p * 2 : (1 - p) * 2;
  const eased = t * t * (3 - 2 * t);

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      width="100%"
      height={height}
      style={{ display: 'block', overflow: 'visible' }}
      role="presentation"
    >
      {pose(eased, p)}
    </svg>
  );
};

export const FIGURE_NAMES = Object.keys(POSES);
