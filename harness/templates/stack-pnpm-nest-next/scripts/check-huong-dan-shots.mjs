#!/usr/bin/env node
/**
 * Guard the User Guide screenshot set (public/huong-dan/shots/*.webp) against BOTH
 * failure directions:
 *   - MISSING: a guide points at a shot that is not on disk -> broken image.
 *   - ORPHAN: a shot sits on disk that no guide references -> dead weight that
 *     nobody notices is safe to delete (and nobody notices when it is not).
 *
 * The subtle part is that a shot is referenced two DIFFERENT ways, and checking
 * only one wrongly flags the other set as orphan:
 *   1. Per-AC screenshots — content/*.ts `shots: ['/huong-dan/shots/<name>.webp']`
 *      captured per acceptance criterion (e.g. f004-ac1.webp).
 *   2. Per-section hero shots — guide-illustration.tsx serves
 *      `/huong-dan/shots/<section-id>.webp` for every id in its `SHOTS` set, via a
 *      TEMPLATE literal. A plain filename grep of content/*.ts never sees these,
 *      so they look orphaned when they are in fact rendered on every guide page.
 *
 * This gate unions both sources before deciding. Run in `lint:gates` (part of
 * `validate`), so a genuinely orphaned or missing shot fails CI.
 *
 *   node scripts/check-huong-dan-shots.mjs
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HUONG_DAN = resolve(ROOT, 'apps/web/src/app/huong-dan');
const CONTENT_DIR = resolve(HUONG_DAN, 'content');
const ILLUSTRATION = resolve(HUONG_DAN, 'guide-illustration.tsx');
const SHOTS_DIR = resolve(ROOT, 'apps/web/public/huong-dan/shots');

if (!existsSync(HUONG_DAN) || !existsSync(SHOTS_DIR)) {
  console.log('✓ [huong-dan-shots] no User Guide yet (apps/web/src/app/huong-dan) — skipped');
  process.exit(0);
}

/** All `<name>.webp` files present under public/huong-dan/shots. */
function shotsOnDisk() {
  return new Set(readdirSync(SHOTS_DIR).filter((f) => f.endsWith('.webp')));
}

/** `<name>.webp` referenced by any per-AC `shots:` path in content/*.ts. */
function referencedByContent() {
  const refs = new Set();
  for (const file of readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.ts'))) {
    const src = readFileSync(resolve(CONTENT_DIR, file), 'utf8');
    for (const m of src.matchAll(/\/huong-dan\/shots\/([a-z0-9-]+\.webp)/g)) refs.add(m[1]);
  }
  return refs;
}

/** `<section-id>.webp` for every id in guide-illustration.tsx's `SHOTS` set —
 * the per-section hero shots served via `src={`/huong-dan/shots/${id}.webp`}`. */
function referencedByIllustration() {
  const src = readFileSync(ILLUSTRATION, 'utf8');
  const block = src.match(/const SHOTS = new Set<string>\(\[([\s\S]*?)\]\)/);
  if (!block) {
    console.error('check-huong-dan-shots: không tìm thấy khối `SHOTS` trong guide-illustration.tsx.');
    console.error('Nếu cơ chế ảnh hero đổi, cập nhật script này cho khớp.');
    process.exit(1);
  }
  const refs = new Set();
  for (const m of block[1].matchAll(/'([a-z0-9-]+)'/g)) refs.add(`${m[1]}.webp`);
  return refs;
}

const onDisk = shotsOnDisk();
const referenced = new Set([...referencedByContent(), ...referencedByIllustration()]);

const orphans = [...onDisk].filter((f) => !referenced.has(f)).sort();
const missing = [...referenced].filter((f) => !onDisk.has(f)).sort();

if (orphans.length === 0 && missing.length === 0) {
  console.log(
    `check-huong-dan-shots: OK - ${onDisk.size} ảnh đều được tham chiếu (per-AC + hero), không mồ côi, không thiếu.`,
  );
  process.exit(0);
}

if (missing.length) {
  console.error(`\ncheck-huong-dan-shots: ${missing.length} ảnh được tham chiếu nhưng THIẾU trên đĩa:`);
  for (const f of missing) console.error(`  - public/huong-dan/shots/${f}`);
}
if (orphans.length) {
  console.error(`\ncheck-huong-dan-shots: ${orphans.length} ảnh MỒ CÔI (trên đĩa, không content nào tham chiếu):`);
  for (const f of orphans) console.error(`  - public/huong-dan/shots/${f}`);
  console.error('Xóa ảnh mồ côi, hoặc tham chiếu chúng từ content/*.ts / SHOTS set nếu vẫn cần.');
}
process.exit(1);
