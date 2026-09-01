#!/usr/bin/env node
/**
 * Shared-Dialog lint: no .tsx under apps/web/src may hand-roll a modal by
 * writing `role="dialog"` markup of its own. Modals must go through the shared
 * <Dialog> (components/ui/dialog.tsx), which owns the one correct backdrop,
 * responsive max-width (no more dialog-overflow-at-375px bugs), focus trap, Esc
 * and Icon close button. One component, one behaviour — the moment a screen
 * re-rolls its own dialog div, the width/focus/escape rules drift again.
 *
 * Why this gate exists: the design system already ships <Dialog>, yet several
 * screens kept building parallel `role="dialog"` overlays with bespoke widths,
 * and those were exactly the surfaces that overflowed on mobile. This makes the
 * machine catch a new hand-rolled dialog the moment it lands.
 *
 * Comments are ignored (a doc comment may mention `role="dialog"` when
 * describing the pattern); only real JSX markup is scanned.
 *
 * NOT a dialog (a floating panel, a banner, a popover — not a focus-trapping
 * modal over dimmed content) legitimately keeps its own `role="dialog"` for
 * assistive tech. Add a `dialog-ok:` comment (on the same line as the element,
 * or within the few lines above it) explaining why. Example: a JSX comment
 * reading  dialog-ok: floating chat panel, not a focus-trapping modal  placed
 * just above the `<div ... role="dialog">` opts that element out.
 *
 *   node scripts/check-shared-dialog.mjs     # lint (exit 1 on any violation)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIR = resolve(ROOT, 'apps/web/src');
// The shared component itself is the ONE allowed hand-rolled dialog.
const SHARED = resolve(SCAN_DIR, 'components/ui/dialog.tsx');
// A `dialog-ok` opt-out comment counts when it sits on the match line or within
// this many raw lines above it (room for a comment block over the element).
const OPT_OUT_WINDOW = 6;

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
 * contents and line structure, so the scan ignores a `role="dialog"` that only
 * appears inside a doc comment yet still sees real JSX markup.
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
    if (state === 1) {
      if (c === '\n') { out += c; i++; state = 0; continue; }
      out += ' '; i++; continue;
    }
    if (state === 2) {
      if (c === '*' && next === '/') { out += '  '; i += 2; state = 0; continue; }
      out += c === '\n' ? '\n' : ' '; i++; continue;
    }
    if (c === '\\') { out += c + (next ?? ''); i += 2; continue; }
    out += c;
    if ((state === 3 && c === "'") || (state === 4 && c === '"') || (state === 5 && c === '`')) state = 0;
    i++;
  }
  return out;
}

// role="dialog" / role='dialog' / role={'dialog'} / role={"dialog"} in real markup.
const ROLE_DIALOG = /role=\s*(?:{?\s*['"]dialog['"]\s*}?)/;

const violations = [];
let files = [];
try {
  files = walk(SCAN_DIR);
} catch {
  console.error(`[shared-dialog] scan dir not found: ${SCAN_DIR}`);
  process.exit(0);
}

for (const file of files) {
  if (resolve(file) === SHARED) continue; // the shared component itself
  const raw = readFileSync(file, 'utf8');
  const rawLines = raw.split('\n');
  const codeLines = stripComments(raw).split('\n');
  codeLines.forEach((codeLine, idx) => {
    if (!ROLE_DIALOG.test(codeLine)) return;
    // Opt-out if a `dialog-ok` marker sits on this line or just above it.
    const from = Math.max(0, idx - OPT_OUT_WINDOW);
    const hasOptOut = rawLines.slice(from, idx + 1).some((l) => l.includes('dialog-ok'));
    if (hasOptOut) return;
    violations.push({ file: relative(ROOT, file), line: idx + 1, text: rawLines[idx].trim().slice(0, 120) });
  });
}

if (violations.length) {
  console.error(`\n✗ [shared-dialog] ${violations.length} hand-rolled role="dialog" outside the shared <Dialog>:\n`);
  for (const v of violations) console.error(`  ${v.file}:${v.line}\n     ${v.text}`);
  console.error(`\n  Fix: render it through the shared <Dialog> (apps/web/src/components/ui/dialog.tsx).`);
  console.error(`  If it truly is not a focus-trapping modal (floating panel, banner, popover), add a`);
  console.error(`  nearby  // dialog-ok: <reason>  comment.\n`);
  process.exit(1);
}

console.log(`✓ [shared-dialog] ${files.length} .tsx file(s) — no hand-rolled dialogs outside shared <Dialog>`);
