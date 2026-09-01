#!/usr/bin/env node
/**
 * No-hardcoded-hex lint: no .tsx under apps/web/src may carry a hard-coded hex
 * colour literal (#rgb / #rgba / #rrggbb / #rrggbbaa). Every colour must ride a
 * design token — `hsl(var(--token))` for the HSL-triplet tokens or `var(--token)`
 * for the full-colour status tokens — so the palette stays single-sourced in
 * styles/prototype/tokens.css and a re-theme (public brand override, dark mode)
 * reaches every surface.
 *
 * Why this gate exists: tokens.css already declares the rule ("NO hard-coded
 * hex/px in screen markup") but nothing enforced it, so ported mockup screens
 * kept re-introducing raw Tailwind-palette hexes (course-card status pills, the
 * expiry notice, ...). This makes the machine catch a hex the moment it lands
 * instead of a human finding it on the Nth glance.
 *
 * Comments are ignored (GitHub issue refs like `#835` live there and are not
 * colours); string and template-literal contents ARE scanned (that is where the
 * real colour literals hide, including styled-jsx CSS).
 *
 * Opt-out: colour literals that genuinely cannot be a token — a WYSIWYG canvas
 * builder that stores user-picked hex, a multi-colour brand SVG logo, a browser
 * chrome `themeColor` meta (must be a literal), an error boundary rendered
 * outside the token stylesheet — add a trailing `hex-ok:` comment on the same
 * line explaining why. Example:
 *
 *   nodeColor={(n) => PALETTE[n.type] ?? '#94a3b8'}  // hex-ok: flow-canvas minimap
 *
 *   node scripts/check-no-hardcoded-hex.mjs     # lint (exit 1 on any violation)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIR = resolve(ROOT, 'apps/web/src');

/** recursively collect .tsx files (skip test/spec/story files) */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx$/.test(name) && !/\.(test|spec|stories)\.tsx$/.test(name)) out.push(p);
  }
  return out;
}

/**
 * Blank out comment contents while preserving string / template-literal
 * contents and the line structure (so line numbers stay accurate). This lets
 * the hex scan ignore issue refs in comments yet still see colour literals that
 * live inside strings, JSX attributes and styled-jsx template CSS.
 * @param {string} src @returns {string}
 */
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  // states: 0 code, 1 line-comment, 2 block-comment, 3 single, 4 double, 5 template
  let state = 0;
  while (i < n) {
    const c = src[i];
    const next = i + 1 < n ? src[i + 1] : '';
    if (state === 0) {
      if (c === '/' && next === '/') { out += '  '; i += 2; state = 1; continue; }
      if (c === '/' && next === '*') { out += '  '; i += 2; state = 2; continue; }
      if (c === "'") { out += c; i++; state = 3; continue; }
      if (c === '"') { out += c; i++; state = 4; continue; }
      if (c === '`') { out += c; i++; state = 5; continue; }
      out += c; i++; continue;
    }
    if (state === 1) { // line comment -> blank until newline
      if (c === '\n') { out += c; i++; state = 0; continue; }
      out += ' '; i++; continue;
    }
    if (state === 2) { // block comment -> blank, keep newlines, end on */
      if (c === '*' && next === '/') { out += '  '; i += 2; state = 0; continue; }
      out += c === '\n' ? '\n' : ' '; i++; continue;
    }
    // string / template states: preserve content, respect escapes
    if (c === '\\') { out += c + (next ?? ''); i += 2; continue; }
    out += c;
    if ((state === 3 && c === "'") || (state === 4 && c === '"') || (state === 5 && c === '`')) state = 0;
    i++;
  }
  return out;
}

// #rgb / #rgba / #rrggbb / #rrggbbaa — longest first, word boundary after.
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;

const violations = [];
let files = [];
try {
  files = walk(SCAN_DIR);
} catch {
  console.error(`[no-hex] scan dir not found: ${SCAN_DIR}`);
  process.exit(0);
}

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const rawLines = raw.split('\n');
  const codeLines = stripComments(raw).split('\n');
  codeLines.forEach((codeLine, idx) => {
    const original = rawLines[idx] ?? '';
    if (original.includes('hex-ok')) return; // explicit opt-out
    const found = codeLine.match(HEX);
    if (found) {
      violations.push({ file: relative(ROOT, file), line: idx + 1, hex: found.join(', '), text: original.trim().slice(0, 120) });
    }
  });
}

if (violations.length) {
  console.error(`\n✗ [no-hex] ${violations.length} hard-coded hex colour(s) in .tsx — every colour must ride a design token:\n`);
  for (const v of violations) console.error(`  ${v.file}:${v.line}  [${v.hex}]\n     ${v.text}`);
  console.error(`\n  Fix: replace with a token — hsl(var(--token)) or var(--token) (see styles/prototype/tokens.css).`);
  console.error(`  If it truly cannot be a token (canvas builder, brand SVG logo, themeColor meta), add a trailing  // hex-ok: <reason>  comment.\n`);
  process.exit(1);
}

console.log(`✓ [no-hex] ${files.length} .tsx file(s) — no hard-coded hex colours`);
