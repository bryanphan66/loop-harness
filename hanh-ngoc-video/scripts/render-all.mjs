#!/usr/bin/env node
/** Render toàn bộ (hoặc một) composition. Tự dò Chrome nếu máy không có sẵn. */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slots = JSON.parse(readFileSync(path.join(ROOT, 'src', 'slots.json'), 'utf8'));

const CANDIDATES = [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const chrome = CANDIDATES.find((p) => existsSync(p));

const only = process.argv[2];
const ids = only ? [only] : Object.keys(slots.videos);
mkdirSync(path.join(ROOT, 'out'), { recursive: true });

for (const id of ids) {
  const args = ['remotion', 'render', 'src/index.jsx', id, `out/${id}.mp4`, '--concurrency=1'];
  if (chrome) args.push(`--browser-executable=${chrome}`);
  console.log(`\n▶ render ${id}${chrome ? '' : '  (dùng Chrome mà Remotion tự tìm)'}`);
  execFileSync('npx', args, { cwd: ROOT, stdio: 'inherit' });
}
