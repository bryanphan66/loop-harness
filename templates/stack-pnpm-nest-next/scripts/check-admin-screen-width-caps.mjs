#!/usr/bin/env node
/**
 * Admin-screen width-cap lint: no ADMIN page/screen under apps/web/src/app/admin
 * may carry a HARD content-column cap: a LARGE inline `maxWidth: <px>` (>= 480)
 * or a Tailwind `max-w-[<px>]` (>= 480). The AdminShell content region
 * (`.page` / `.page-body`) owns the content column; every admin page must fill
 * it consistently. Small caps (a badge, an avatar, a truncated cell) and
 * `minWidth` on filter/search controls are fine — they don't cap the page.
 *
 * Why this gate exists: the frozen Claude-Design export screens are drawn as
 * centered narrow columns (a mockup-canvas convention), so each ported screen
 * tends to re-introduce its own `maxWidth: 720/760`. Removing that cap one
 * screen at a time is whack-a-mole — the same "not full width" defect surfaced
 * on the chapter editor AND then the lesson editor. This makes the machine catch
 * a ported-in width cap the moment it lands, instead of the human finding it on
 * the Nth glance.
 *
 * Allowed: percentage / viewport caps (`maxWidth: '100%'`, `max-w-full`) and
 * responsive `max-w-screen-*` — those constrain, they don't pin a narrow column.
 * A genuinely intentional narrow admin column (rare) can opt out with a trailing
 *   // width-cap-ok: <reason>
 * comment on the same line.
 *
 *   node scripts/check-admin-screen-width-caps.mjs     # lint (exit 1 on any cap)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_DIR = resolve(ROOT, 'apps/web/src/app/admin');

/** recursively collect .tsx files */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

// a content-column cap is a LARGE max-width (>= this many px); smaller maxWidths
// on individual elements (badges, avatars, cells) are legitimate.
const COLUMN_CAP_PX = 480;

// inline `maxWidth: 760` / `maxWidth:760` — only flag when the value is large.
const INLINE_CAP = /\bmaxWidth\s*:\s*(\d{3,})\b/;
// Tailwind arbitrary pixel cap: max-w-[760px] — only flag when large.
const TW_CAP = /\bmax-w-\[\s*(\d{3,})px/;

/** @param {string} line @returns {boolean} */
function hasColumnCap(line) {
  const inline = line.match(INLINE_CAP);
  if (inline && Number(inline[1]) >= COLUMN_CAP_PX) return true;
  const tw = line.match(TW_CAP);
  if (tw && Number(tw[1]) >= COLUMN_CAP_PX) return true;
  return false;
}

const violations = [];
let files = [];
try {
  files = walk(ADMIN_DIR);
} catch {
  console.error(`[width-caps] admin dir not found: ${ADMIN_DIR}`);
  process.exit(0); // nothing to lint yet
}

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('width-cap-ok')) return; // explicit opt-out
    if (hasColumnCap(line)) {
      violations.push({ file: relative(ROOT, file), line: i + 1, text: line.trim().slice(0, 120) });
    }
  });
}

if (violations.length) {
  console.error(`\n✗ [width-caps] ${violations.length} hard content-width cap(s) in admin screens — the shell owns the width, ported mockup caps must go:\n`);
  for (const v of violations) console.error(`  ${v.file}:${v.line}\n     ${v.text}`);
  console.error(`\n  Fix: drop the cap so the page fills .page-body (like /admin/users, /admin/courses).`);
  console.error(`  If a narrow column is truly intended, add a trailing  // width-cap-ok: <reason>  comment.\n`);
  process.exit(1);
}

console.log(`✓ [width-caps] ${files.length} admin screen(s) — no hard content-width caps`);
