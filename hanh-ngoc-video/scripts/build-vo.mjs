#!/usr/bin/env node
/**
 * build-vo.mjs — sinh lời đọc + tính khung hình cho toàn bộ video.
 *
 * Chạy:  node scripts/build-vo.mjs [--video DauLung] [--voice vi-VN-NamMinhNeural]
 *                                  [--rate=-8%] [--engine edge|espeak] [--tail 1.8]
 *
 * Các bước (đúng thứ tự trong yêu cầu):
 *   1. Sinh public/vo/<slug>/0X.wav từ text trong src/content.mjs
 *   2. Đo thời lượng từng file bằng ffprobe
 *   3. frames = ceil((LEAD + thời_lượng + TAIL) * FPS)
 *   4. Ghi src/slots.json
 *   5. Root.jsx / các component đọc slots.json (không còn hằng số cứng)
 *
 * Nguyên tắc:
 *   · KHÔNG dùng ffmpeg atempo — muốn nhanh/chậm thì đổi --rate của chính TTS.
 *   · Mỗi câu sinh riêng rồi ghép (né lỗi engine chỉ giữ câu cuối, và cho phép
 *     chèn khoảng lặng giữa câu để bà con nghe kịp).
 *   · Chuẩn âm lượng bằng gain đo được, tính sao cho MEAN của video cuối
 *     rơi đúng vào khoảng nghiệm thu -16..-24 dB.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, writeFile, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

import { VIDEOS, FPS, LEAD_SEC, TAIL_SEC } from '../src/content.mjs';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ─── tham số ────────────────────────────────────────────────────────────────
const GAP_SEC = 0.30;              // khoảng lặng giữa hai câu trong cùng một đoạn
const TARGET_FINAL_MEAN_DB = -20;  // giữa khoảng nghiệm thu -16..-24 dB
const PEAK_CEILING_DB = -3.0;      // trần đỉnh, chừa chỗ cho AAC khỏi chạm 0 dB
const MAX_GAIN_DB = 14;            // không kéo quá tay kẻo nổi tiếng nền
const SAMPLE_RATE = 48000;

function parseArgs(argv) {
  const out = { engine: 'edge', tail: TAIL_SEC, gap: GAP_SEC, video: null, voice: null, rate: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eat = (name) => (a.startsWith(`--${name}=`) ? a.slice(name.length + 3) : argv[++i]);
    if (a === '--video' || a.startsWith('--video=')) out.video = eat('video');
    else if (a === '--voice' || a.startsWith('--voice=')) out.voice = eat('voice');
    else if (a === '--rate' || a.startsWith('--rate=')) out.rate = eat('rate');
    else if (a === '--engine' || a.startsWith('--engine=')) out.engine = eat('engine');
    else if (a === '--tail' || a.startsWith('--tail=')) out.tail = Number(eat('tail'));
    else if (a === '--gap' || a.startsWith('--gap=')) out.gap = Number(eat('gap'));
    else if (a === '--help' || a === '-h') { console.log(HELP); process.exit(0); }
    else throw new Error(`Tham số lạ: ${a}`);
  }
  return out;
}

const HELP = `
node scripts/build-vo.mjs [tuỳ chọn]

  --video <Id>     Chỉ dựng một video (${Object.keys(VIDEOS).join(', ')}). Mặc định: tất cả.
  --voice <name>   Ghi đè giọng, vd vi-VN-HoaiMyNeural | vi-VN-NamMinhNeural
  --rate=-8%       Tốc độ đọc của edge-tts (dùng dấu = vì giá trị có dấu trừ)
  --engine edge    edge-tts (mặc định, giọng thật) | espeak (CHỈ để chèn tạm, giọng máy)
  --tail <giây>    Đệm sau khi dứt tiếng, mặc định ${TAIL_SEC}
  --gap <giây>     Khoảng lặng giữa hai câu, mặc định ${GAP_SEC}
`;

// ─── tiện ích ───────────────────────────────────────────────────────────────
async function ffprobeDuration(file) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', file,
  ]);
  const d = Number(stdout.trim());
  if (!Number.isFinite(d) || d <= 0) throw new Error(`ffprobe không đọc được thời lượng: ${file}`);
  return d;
}

/** Đo mean/max volume (dB) bằng bộ lọc volumedetect. */
async function volumeStats(file) {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-']);
  const mean = /mean_volume:\s*(-?[\d.]+) dB/.exec(stderr);
  const max = /max_volume:\s*(-?[\d.]+) dB/.exec(stderr);
  if (!mean || !max) throw new Error(`Không đọc được volumedetect cho ${file}`);
  return { mean: Number(mean[1]), max: Number(max[1]) };
}

/** Tách đoạn thành từng câu, giữ lại dấu câu. */
function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function synthSentence(engine, sentence, voice, rate, outWav, tmpDir, idx) {
  if (engine === 'edge') {
    const mp3 = path.join(tmpDir, `s${idx}.mp3`);
    const args = ['--voice', voice, '--text', sentence, '--write-media', mp3];
    if (rate) args.push(`--rate=${rate}`);
    await run('edge-tts', args, { maxBuffer: 1 << 26 });
    // edge-tts có thể thoát mã 0 mà vẫn ghi file rỗng khi mạng chặn — phải tự bắt.
    const st = await stat(mp3).catch(() => null);
    if (!st || st.size < 1024) {
      throw new Error(
        `edge-tts trả về file rỗng cho câu: "${sentence}"\n` +
        `Thường là do không ra được speech.platform.bing.com (mạng/tường lửa chặn).`,
      );
    }
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp3,
      '-ac', '1', '-ar', String(SAMPLE_RATE), '-c:a', 'pcm_s16le', outWav]);
  } else if (engine === 'espeak') {
    // Giọng máy — CHỈ dùng để dựng khung thời lượng, không bao giờ đem giao.
    const raw = path.join(tmpDir, `e${idx}.wav`);
    await run('espeak-ng', ['-v', 'vi-vn-x-south', '-s', '130', '-p', '40', '-w', raw, sentence]);
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', raw,
      '-ac', '1', '-ar', String(SAMPLE_RATE), '-c:a', 'pcm_s16le', outWav]);
  } else {
    throw new Error(`Engine không hỗ trợ: ${engine}`);
  }
}

/** Ghép các câu, chèn khoảng lặng giữa câu. Không đụng tới tốc độ. */
async function concatWithGaps(wavs, gapSec, outFile, tmpDir) {
  if (wavs.length === 1 && gapSec === 0) {
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wavs[0], '-c', 'copy', outFile]);
    return;
  }
  const silence = path.join(tmpDir, 'gap.wav');
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', `anullsrc=r=${SAMPLE_RATE}:cl=mono`,
    '-t', String(gapSec), '-c:a', 'pcm_s16le', silence]);

  const pieces = [];
  wavs.forEach((w, i) => {
    if (i > 0) pieces.push(silence);
    pieces.push(w);
  });
  const listFile = path.join(tmpDir, 'concat.txt');
  await writeFile(listFile, pieces.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outFile]);
}

// ─── luồng chính ────────────────────────────────────────────────────────────
async function buildVideo(id, cfg, opts) {
  const voice = opts.voice || cfg.voice;
  const rate = opts.rate ?? cfg.rate;
  const outDir = path.join(ROOT, 'public', 'vo', cfg.slug);
  await mkdir(outDir, { recursive: true });

  const tmpDir = await mkdirTmp();
  const staged = [];

  console.log(`\n▶ ${id} — ${cfg.title}`);
  console.log(`  giọng: ${voice}   tốc độ: ${rate ?? 'mặc định'}   engine: ${opts.engine}`);

  // ── Bước 1+2: sinh từng câu, ghép, đo thời lượng ──
  for (const scene of cfg.scenes) {
    const sentences = splitSentences(scene.vo);
    const partWavs = [];
    for (let i = 0; i < sentences.length; i++) {
      const w = path.join(tmpDir, `${scene.id}_${i}.wav`);
      await synthSentence(opts.engine, sentences[i], voice, rate, w, tmpDir, `${scene.id}_${i}`);
      partWavs.push(w);
    }
    const rawWav = path.join(tmpDir, `${scene.id}_raw.wav`);
    await concatWithGaps(partWavs, opts.gap, rawWav, tmpDir);

    const dur = await ffprobeDuration(rawWav);
    const vol = await volumeStats(rawWav);
    staged.push({ scene, rawWav, dur, vol, sentences: sentences.length });
    console.log(`  ${scene.id}  ${sentences.length} câu  ${dur.toFixed(2)}s  mean ${vol.mean.toFixed(1)}dB`);
  }

  // ── Bước 3: số frame mỗi cảnh ──
  const scenes = [];
  let startFrame = 0;
  for (const s of staged) {
    const frames = Math.ceil((LEAD_SEC + s.dur + opts.tail) * FPS);
    scenes.push({ ...s, frames, startFrame });
    startFrame += frames;
  }
  const total = startFrame;

  // ── Chuẩn âm lượng: chọn mean cho từng file sao cho MEAN video cuối = mục tiêu ──
  const voSeconds = scenes.reduce((a, s) => a + s.dur, 0);
  const videoSeconds = total / FPS;
  const perFileTarget = TARGET_FINAL_MEAN_DB - 10 * Math.log10(voSeconds / videoSeconds);

  // Trần đỉnh dạng tuyến tính cho alimiter (-1.5 dBFS ≈ 0.841).
  const limit = Math.pow(10, PEAK_CEILING_DB / 20).toFixed(4);

  const manifest = [];
  for (const s of scenes) {
    let gain = perFileTarget - s.vol.mean;
    if (gain > MAX_GAIN_DB) {
      console.warn(`  ! cảnh ${s.scene.id} cần +${gain.toFixed(1)}dB, chặn ở +${MAX_GAIN_DB}dB`);
      gain = MAX_GAIN_DB;
    }
    const outFile = path.join(outDir, `${s.scene.id}.wav`);
    // Kéo mức tới mục tiêu rồi CHẶN ĐỈNH bằng alimiter — không hạ cả đoạn xuống
    // chỉ vì một hai đỉnh nhọn. pan=stereo giữ nguyên mức khi Remotion trộn ra
    // 2 kênh (để ffmpeg tự đổi mono→stereo là mất đúng 3 dB).
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', s.rawWav,
      '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=${limit}:attack=5:release=60:level=disabled,pan=stereo|c0=c0|c1=c0`,
      '-ar', String(SAMPLE_RATE), '-c:a', 'pcm_s16le', outFile]);

    const finalDur = await ffprobeDuration(outFile);
    const finalVol = await volumeStats(outFile);
    manifest.push({
      id: s.scene.id,
      kind: s.scene.kind,
      file: `vo/${cfg.slug}/${s.scene.id}.wav`,
      sentences: s.sentences,
      audioSec: Number(finalDur.toFixed(3)),
      leadSec: LEAD_SEC,
      tailSec: opts.tail,
      frames: s.frames,
      startFrame: s.startFrame,
      meanDb: Number(finalVol.mean.toFixed(1)),
      maxDb: Number(finalVol.max.toFixed(1)),
    });
  }

  await rm(tmpDir, { recursive: true, force: true });

  const sum = manifest.reduce((a, m) => a + m.frames, 0);
  if (sum !== total) throw new Error(`Tổng frame lệch: ${sum} != ${total}`);

  console.log(`  → ${total} frame = ${(total / FPS).toFixed(2)}s   ` +
    `mean video dự kiến ≈ ${TARGET_FINAL_MEAN_DB} dB`);

  return {
    title: cfg.title,
    slug: cfg.slug,
    voice,
    rate: rate ?? null,
    engine: opts.engine,
    placeholder: opts.engine !== 'edge',
    voSeconds: Number(voSeconds.toFixed(3)),
    durationInFrames: total,
    durationSec: Number((total / FPS).toFixed(3)),
    scenes: manifest,
  };
}

async function mkdirTmp() {
  const d = path.join(os.tmpdir(), `vo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await mkdir(d, { recursive: true });
  return d;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const ids = opts.video ? [opts.video] : Object.keys(VIDEOS);
  for (const id of ids) if (!VIDEOS[id]) throw new Error(`Không có video "${id}"`);

  if (opts.engine === 'espeak') {
    console.warn(
      '\n' + '!'.repeat(72) +
      '\n!! ĐANG DÙNG ESPEAK — GIỌNG MÁY, CHỈ ĐỂ DỰNG KHUNG THỜI LƯỢNG.' +
      '\n!! Bản này KHÔNG được đem giao. Chạy lại với --engine edge để lấy giọng thật.' +
      '\n' + '!'.repeat(72),
    );
  }

  // Giữ nguyên các video khác nếu chỉ dựng lại một cái.
  const slotsPath = path.join(ROOT, 'src', 'slots.json');
  let prev = { videos: {} };
  if (existsSync(slotsPath)) {
    prev = JSON.parse(await (await import('node:fs/promises')).readFile(slotsPath, 'utf8'));
  }

  const videos = { ...(prev.videos || {}) };
  for (const id of ids) videos[id] = await buildVideo(id, VIDEOS[id], opts);

  const slots = {
    $comment: 'SINH TỰ ĐỘNG bởi scripts/build-vo.mjs — đừng sửa tay.',
    fps: FPS,
    generatedAt: new Date().toISOString(),
    videos,
  };
  await writeFile(slotsPath, JSON.stringify(slots, null, 2) + '\n', 'utf8');
  console.log(`\n✓ Đã ghi src/slots.json (${Object.keys(videos).join(', ')})`);
}

main().catch((err) => {
  console.error('\n✗ build-vo thất bại:\n  ' + (err.stderr || err.message));
  process.exit(1);
});
