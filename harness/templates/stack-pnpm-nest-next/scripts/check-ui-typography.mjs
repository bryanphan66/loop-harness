#!/usr/bin/env node
/**
 * UI-typography lint: no "AI typography" glyphs or decorative emoji may live in
 * the user-facing locale bundles apps/web/messages/{vi,en}.json. Every value in
 * those files renders to a real screen, so a stray em-dash / curly quote /
 * middot / decorative emoji reads as machine-generated copy to the user.
 *
 * Why this gate exists: the house style writes UI copy the way a person types it
 * by hand - straight quotes, plain hyphens, "->" instead of an arrow glyph, no
 * emoji icons (a real icon belongs in <Icon> SVG, not baked into a string). The
 * cleanup was done once by hand; without a gate the same glyphs drift back in
 * every time a new message is pasted from a design doc. This makes the machine
 * catch it the moment it lands.
 *
 * Kept on purpose (NOT flagged): the legal symbols © ® ™ - they are content,
 * not typography, and belong in copyright / trademark lines.
 *
 *   node scripts/check-ui-typography.mjs         # lint (exit 1 on any violation)
 *   node scripts/check-ui-typography.mjs --fix   # rewrite the bundles in place
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['apps/web/messages/vi.json', 'apps/web/messages/en.json'].map((f) => resolve(ROOT, f));
const FIX = process.argv.includes('--fix');

// Legal/content symbols that must survive - they are not "AI typography".
const KEEP = new Set(['©', '®', '™']);
// One decorative-emoji glyph + any trailing variation-selector / ZWJ sequence.
const EMOJI = /(\p{Extended_Pictographic}(?:[\u{FE0F}\u{200D}]\p{Extended_Pictographic}?)*)/gu;

/**
 * Replace the "AI typography" glyphs and strip decorative emoji from one string.
 * Mirrors the render-time clean() in scripts/feature-issues-sync.mjs, extended to
 * also drop decorative emoji icons (kept there, dropped here).
 * @param {string} s @returns {string}
 */
function cleanValue(s) {
  let out = s
    // special spaces (nbsp / thin / hair) -> normal space; zero-width -> gone
    .replace(/[    ]/g, ' ').replace(/[​﻿]/g, '')
    // em / en dash
    .replace(/\s*[—–]\s*/g, ' - ')
    // middot
    .replace(/\s*·\s*/g, ', ')
    // arrows
    .replace(/\s*[→⇒]\s*/g, ' -> ').replace(/\s*[←⇐]\s*/g, ' <- ').replace(/\s*[↔⇔]\s*/g, ' <-> ')
    // ellipsis
    .replace(/…/g, '...')
    // comparison operators
    .replace(/\s*≥\s*/g, ' >= ').replace(/\s*≤\s*/g, ' <= ')
    // curly quotes -> straight
    .replace(/[“”„]/g, '"').replace(/[‘’‚]/g, "'")
    // bullets
    .replace(/\s*[•▪‣◦]\s*/g, ' - ')
    // prime marks
    .replace(/[′]/g, "'").replace(/[″]/g, '"')
    // multiplication sign between values -> x
    .replace(/\s*×\s*/g, ' x ');
  // decorative emoji (keep © ® ™) -> gone
  out = out.replace(EMOJI, (m) => (m.length === 1 && KEEP.has(m) ? m : ''));
  // collapse the spaces an emoji/arrow left behind, then trim edges
  return out.replace(/ {2,}/g, ' ').trim();
}

/** Recursively map every string leaf of a JSON value through fn. */
function mapStrings(node, fn) {
  if (typeof node === 'string') return fn(node);
  if (Array.isArray(node)) return node.map((v) => mapStrings(v, fn));
  if (node && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node)) out[k] = mapStrings(node[k], fn);
    return out;
  }
  return node;
}

let totalViolations = 0;
let totalFixed = 0;

const presentFiles = FILES.filter((f) => existsSync(f));
if (presentFiles.length === 0) {
  console.log('✓ [ui-typography] no locale bundle yet (apps/web/messages/{vi,en}.json) — skipped');
  process.exit(0);
}
for (const file of presentFiles) {
  const raw = readFileSync(file, 'utf8');
  const json = JSON.parse(raw);

  if (FIX) {
    let changed = 0;
    const cleaned = mapStrings(json, (s) => {
      const c = cleanValue(s);
      if (c !== s) changed++;
      return c;
    });
    if (changed) {
      // preserve the file's trailing-newline convention
      const nl = raw.endsWith('\n') ? '\n' : '';
      writeFileSync(file, JSON.stringify(cleaned, null, 2) + nl);
    }
    totalFixed += changed;
    console.log(`  ${relative(ROOT, file)}: ${changed} value(s) cleaned`);
    continue;
  }

  const bad = [];
  mapStrings(json, (s) => {
    if (cleanValue(s) !== s) bad.push(s);
    return s;
  });
  if (bad.length) {
    totalViolations += bad.length;
    console.error(`\n${relative(ROOT, file)}: ${bad.length} value(s) with AI-typography/emoji`);
    for (const s of bad.slice(0, 20)) console.error(`  - ${JSON.stringify(s.slice(0, 100))}`);
    if (bad.length > 20) console.error(`  ... and ${bad.length - 20} more`);
  }
}

if (FIX) {
  console.log(`\nUI-typography fix: ${totalFixed} value(s) rewritten.`);
  process.exit(0);
}

if (totalViolations) {
  console.error(`\nUI-typography gate FAILED: ${totalViolations} value(s). Run: node scripts/check-ui-typography.mjs --fix`);
  process.exit(1);
}
console.log('UI-typography gate OK: no AI-typography/emoji in locale bundles.');
