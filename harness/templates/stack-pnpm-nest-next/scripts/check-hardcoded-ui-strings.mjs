#!/usr/bin/env node
/**
 * Hardcoded-UI-string gate (closes the i18n hole that mirrors the prototype
 * re-draw problem: the frozen export mockups hardcode Vietnamese copy, and a
 * worker "adopting" a screen transcribes those literals straight into JSX
 * instead of routing them through the i18n layer — `t('...')` + messages/vi.json
 * + en.json). No existing gate caught this, so hardcoded copy shipped.
 *
 * Scope discipline: only CHANGED admin/marketing screen files (git diff vs the
 * merge base with origin/dev) are checked, so the gate flags NEW hardcoded copy
 * without failing the whole build on pre-existing i18n debt. A file that touches
 * UI must move new user-facing Vietnamese text into i18n keys.
 *
 * A line is an offender when it carries Vietnamese-specific letters (ăâđêôơư +
 * tone-marked vowels) AND is either JSX text (`>Chào<`) or a user-facing string
 * prop (placeholder / aria-label / title / label / alt / tooltip / hint / cta),
 * and is NOT already inside a `t(` / `useTranslations` call, a comment, or an
 * import. Test/spec/story files and the message bundles themselves are exempt.
 *
 *   node scripts/check-hardcoded-ui-strings.mjs
 *   node scripts/check-hardcoded-ui-strings.mjs --all   # scan all files, not just changed
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['apps/web/src/app/admin/', 'apps/web/src/app/marketing/'];
// Vietnamese-specific letters (beyond plain ASCII + the acute/grave that also
// occur in other latin text) — presence signals Vietnamese UI copy.
const VN = /[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/;
const UI_PROP = /\b(placeholder|aria-label|title|label|alt|tooltip|hint|cta|ctaLabel|description|subtitle|heading|emptyText)\s*=\s*["'][^"']*$/;

function changedFiles() {
  const set = new Set();
  const add = (cmd) => {
    try {
      execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).split('\n').map((s) => s.trim()).filter(Boolean).forEach((f) => set.add(f));
    } catch {
      /* ignore */
    }
  };
  try {
    const base = execSync('git merge-base origin/dev HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
    add(`git diff --name-only ${base}...HEAD`); // committed since branch point
  } catch {
    /* no origin/dev ref — fall back to working-tree only */
  }
  add('git diff --name-only HEAD'); // unstaged + staged working-tree changes
  return [...set];
}
function allFiles() {
  try {
    return execSync(`git ls-files ${SCAN_DIRS.join(' ')}`, { cwd: ROOT, encoding: 'utf8' })
      .split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function isScreenFile(f) {
  return f.endsWith('.tsx') && SCAN_DIRS.some((d) => f.startsWith(d)) && !/\.(test|spec|stories)\.tsx$/.test(f);
}

/** true if the line has Vietnamese copy in JSX text or a UI string prop, not inside t()/comment/import */
function offendingLine(line) {
  const s = line.trim();
  if (s.startsWith('//') || s.startsWith('*') || s.startsWith('/*') || s.startsWith('import ')) return false;
  if (!VN.test(line)) return false;
  // already routed through i18n on this line
  if (/\bt\(\s*['"]/.test(line) || /useTranslations/.test(line)) return false;
  // JSX text node: >...VN...<
  const jsxText = />[^<>{}]*[^\s<>{}][^<>{}]*</.test(line) && VN.test(line.replace(/<[^>]*>/g, ''));
  // user-facing string prop with a VN literal value
  const propText = new RegExp(
    '\\b(placeholder|aria-label|title|label|alt|tooltip|hint|cta|ctaLabel|description|subtitle|heading|emptyText)\\s*=\\s*["\'][^"\']*' + VN.source,
  ).test(line);
  return jsxText || propText;
}

const all = process.argv.includes('--all');
const files = (all ? allFiles() : changedFiles()).filter(isScreenFile);

const offenders = [];
for (const f of files) {
  const p = resolve(ROOT, f);
  if (!existsSync(p)) continue;
  const lines = readFileSync(p, 'utf8').split('\n');
  lines.forEach((ln, i) => {
    if (offendingLine(ln)) offenders.push(`${f}:${i + 1}  ${ln.trim().slice(0, 90)}`);
  });
}

if (offenders.length) {
  console.error(`\n✗ [hardcoded-ui-strings] ${offenders.length} hardcoded Vietnamese UI string(s) in ${all ? 'all' : 'changed'} admin/marketing screens:\n`);
  for (const o of offenders) console.error('  ' + o);
  console.error(`\n  Move user-facing copy into i18n: t('namespace.key') + apps/web/messages/{vi,en}.json.`);
  console.error(`  The prototype export hardcodes VN copy because it is a MOCKUP — adopt the layout,`);
  console.error(`  but route every string through the i18n layer, never transcribe the literal.\n`);
  process.exit(1);
}
console.log(`✓ [hardcoded-ui-strings] ${files.length} changed screen file(s) — no new hardcoded Vietnamese UI copy`);
process.exit(0);
