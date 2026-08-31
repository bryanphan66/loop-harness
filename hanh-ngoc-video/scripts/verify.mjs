#!/usr/bin/env node
/**
 * Nghiệm thu tự động — chạy: node scripts/verify.mjs [Id]
 *
 *  1. Kích thước 1080x1920, có luồng audio, thời lượng khớp tổng SLOTS/30
 *  2. mean volume nằm trong khoảng -16..-24 dB
 *  3. Trích khung giữa mỗi cảnh ra out/frames/ để soi dấu tiếng Việt + mép hình
 *  4. Không cảnh nào bị lời đọc tràn sang cảnh sau
 *  5. Nhắc lại engine đã dùng (giọng phải nghe bằng tai, máy không chấm được)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slots = JSON.parse(readFileSync(path.join(ROOT, 'src', 'slots.json'), 'utf8'));
const FPS = slots.fps;

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
// ffmpeg viết kết quả volumedetect ra stderr kể cả khi chạy thành công.
const shErr = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  return (r.stderr || '') + (r.stdout || '');
};

let failures = 0;
const ok = (m) => console.log(`   \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => { failures++; console.log(`   \x1b[31m✗\x1b[0m ${m}`); };

const only = process.argv[2];
const ids = only ? [only] : Object.keys(slots.videos);

// ── 0. Ràng buộc nội dung ngành y tế ────────────────────────────────────────
// Ngành y tế bị phạt nếu quảng cáo quá lời, nên chặn ngay từ file chữ,
// không đợi tới lúc con người soi.
const CAM = [
  'khỏi hẳn', 'dứt điểm', 'cam kết', 'hiệu quả 100', 'thay thế thuốc',
  'chữa khỏi', 'đảm bảo khỏi', 'trước và sau', 'không tái phát',
];
{
  console.log('\n══ Ràng buộc nội dung');
  const { VIDEOS, DISCLAIMER } = await import('../src/content.mjs');

  // Chỉ soi chữ mà NGƯỜI XEM đọc/nghe được — không soi tham số kỹ thuật
  // (vd rate '-8%' không phải con số hiệu quả điều trị).
  const visible = [];
  for (const v of Object.values(VIDEOS)) {
    visible.push(v.title);
    for (const s of v.scenes) {
      for (const k of ['vo', 'heading', 'note', 'meta']) if (s[k]) visible.push(s[k]);
      for (const k of ['lines', 'bullets', 'chips']) if (s[k]) visible.push(...s[k]);
    }
  }
  const low = visible.join(' \n ').toLowerCase();

  const hits = CAM.filter((w) => low.includes(w));
  hits.length === 0 ? ok(`không có từ cấm trong ${visible.length} chuỗi chữ/lời đọc`)
                    : bad(`có từ cấm: ${hits.join(', ')}`);

  const pct = low.match(/\d+\s*%/g);
  !pct ? ok('không có con số hiệu quả điều trị')
       : bad(`có con số dạng phần trăm: ${pct.join(', ')}`);

  DISCLAIMER.toLowerCase().includes('không thay thế việc thăm khám')
    ? ok(`dòng chữ nhỏ bắt buộc: "${DISCLAIMER}"`)
    : bad('THIẾU dòng chữ nhỏ "Nội dung tham khảo, không thay thế việc thăm khám"');

  // Giọng đọc là người dẫn chuyện của phòng khám, không tự xưng bác sĩ.
  const xung = /\b(tôi là bác sĩ|bác sĩ của chúng tôi|tôi khuyên)\b/.test(low);
  !xung ? ok('lời đọc không tự xưng là bác sĩ')
        : bad('lời đọc có chỗ tự xưng là bác sĩ');

  for (const id of ids) {
    const last = slots.videos[id].scenes.at(-1);
    last.kind === 'outro' ? ok(`${id}: cảnh kết là thẻ dẫn đi khám`)
                          : bad(`${id}: cảnh kết không phải thẻ kết`);
  }
}

for (const id of ids) {
  const plan = slots.videos[id];
  const mp4 = path.join(ROOT, 'out', `${id}.mp4`);
  console.log(`\n══ ${id} — ${plan.title}`);
  if (!existsSync(mp4)) { bad(`chưa có ${path.relative(ROOT, mp4)} — chạy node scripts/render-all.mjs ${id}`); continue; }

  // ── 1. khung hình, audio, thời lượng ──
  const probe = JSON.parse(sh('ffprobe', ['-v', 'error', '-print_format', 'json',
    '-show_streams', '-show_format', mp4]));
  const v = probe.streams.find((s) => s.codec_type === 'video');
  const a = probe.streams.find((s) => s.codec_type === 'audio');

  (v && v.width === 1080 && v.height === 1920)
    ? ok(`1080×1920 (${v.codec_name})`)
    : bad(`kích thước sai: ${v ? `${v.width}×${v.height}` : 'không có luồng video'}`);

  a ? ok(`có audio (${a.codec_name}, ${a.sample_rate} Hz, ${a.channels}ch)`)
    : bad('KHÔNG có luồng audio');

  const expected = plan.durationInFrames / FPS;
  const actual = Number(probe.format.duration);
  const drift = Math.abs(actual - expected);
  // Bộ mã hoá AAC luôn đệm thêm vài chục ms ở cuối — chấp nhận trong 0.1s.
  drift <= 0.1
    ? ok(`thời lượng ${actual.toFixed(2)}s khớp tổng SLOTS ${plan.durationInFrames}/${FPS} = ${expected.toFixed(2)}s`)
    : bad(`thời lượng ${actual.toFixed(2)}s lệch ${drift.toFixed(3)}s so với SLOTS (${expected.toFixed(2)}s)`);

  const sum = plan.scenes.reduce((s, x) => s + x.frames, 0);
  sum === plan.durationInFrames
    ? ok(`tổng SLOTS = durationInFrames = ${sum}`)
    : bad(`tổng SLOTS ${sum} ≠ durationInFrames ${plan.durationInFrames}`);

  // ── 2. âm lượng ──
  const vd = shErr('ffmpeg', ['-hide_banner', '-i', mp4, '-af', 'volumedetect', '-f', 'null', '-']);
  const mean = Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(vd)?.[1]);
  const max = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(vd)?.[1]);
  (mean <= -16 && mean >= -24)
    ? ok(`mean volume ${mean} dB (trong khoảng -16..-24), đỉnh ${max} dB`)
    : bad(`mean volume ${mean} dB NGOÀI khoảng -16..-24 dB`);

  // ── 3. trích khung giữa mỗi cảnh ──
  const outDir = path.join(ROOT, 'out', 'frames', id);
  mkdirSync(outDir, { recursive: true });
  for (const s of plan.scenes) {
    const at = (s.startFrame + s.frames / 2) / FPS;
    sh('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', at.toFixed(2),
      '-i', mp4, '-frames:v', '1', '-q:v', '2', path.join(outDir, `${s.id}.jpg`)]);
  }
  ok(`đã trích ${plan.scenes.length} khung giữa cảnh → out/frames/${id}/ (soi bằng mắt)`);

  // ── 4. lời đọc không tràn cảnh ──
  let worst = Infinity; let worstId = null;
  for (const s of plan.scenes) {
    const margin = s.frames / FPS - (s.leadSec + s.audioSec);
    if (margin < worst) { worst = margin; worstId = s.id; }
  }
  worst >= 0.5
    ? ok(`không cảnh nào bị tràn tiếng — đệm hẹp nhất ${worst.toFixed(2)}s ở cảnh ${worstId}`)
    : bad(`cảnh ${worstId} chỉ còn ${worst.toFixed(2)}s sau khi dứt tiếng`);

  // ── 5. giọng ──
  plan.placeholder
    ? bad(`GIỌNG TẠM (engine "${plan.engine}") — chưa được đem giao, phải chạy lại --engine edge`)
    : ok(`giọng ${plan.voice} rate ${plan.rate ?? 'mặc định'} (engine ${plan.engine}) — vẫn phải nghe lại bằng tai`);
}

console.log(failures === 0
  ? '\n\x1b[32mTẤT CẢ MỤC TỰ ĐỘNG ĐỀU ĐẠT.\x1b[0m'
  : `\n\x1b[31m${failures} mục CHƯA ĐẠT.\x1b[0m`);
process.exit(failures === 0 ? 0 : 1);
