#!/usr/bin/env node
/**
 * RTM status — the "where are we, what's missing" matrix (observability + a
 * completeness gate), anchored on the REQ-ID (the sole cross-artifact token).
 *
 * The SRS (docs/requirements/srs) DEFINES the concrete REQ-ID universe. For each
 * REQ-ID this reports whether it is covered in each downstream artifact:
 *
 *   REQ-ID | register(scope) | issue | test | prototype(phase-freeze)
 *
 * ✓ = present, ✗ = missing, ~ = register matched ONLY by a module catch-all (MD-dot-star
 * / CL-dot-star) so the area has no real scope row — treated as not-covered, ? = offline.
 * The SRS column is implicit (every row exists because the SRS defines it).
 *
 * Two modes + filters:
 *   node scripts/rtm-status.mjs                 # print the matrix (Markdown)
 *   node scripts/rtm-status.mjs --gate          # exit 1 if a required column has ✗ or ~
 *   node scripts/rtm-status.mjs --json          # machine output for a dashboard
 *   node scripts/rtm-status.mjs --selftest      # built-in checks
 *   node scripts/rtm-status.mjs --module MD     # only REQ-IDs under MD.
 *   node scripts/rtm-status.mjs --issues-file <dump.json>  # read a gh issue-list dump (avoid gh-live timeout)
 *
 * Config (gate-config.json → rtm.*), all optional with sane defaults:
 *   srsDir       docs/requirements/srs
 *   registerJson docs/scope-baseline/feature-register.source.json
 *   testDirs     ["apps","packages"]
 *   requiredCols ["register","test"]   # columns whose ✗ fails --gate
 *   frozenPhases ["Phase 1"]           # phases whose prototype is frozen
 *   issuesFile   (path to a `gh issue list --json number,body` dump; optional)
 *
 * Missing SRS dir → skipped (not an RTM-driven project yet).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { gateRoot, loadGateConfig, walk, readSafe, resolveRegisterJson } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT).rtm ?? {};
const SRS_DIR = resolve(ROOT, cfg.srsDir ?? 'docs/requirements/srs');
// Nhận cả hai cách đặt tên register - xem resolveRegisterJson trong gate-lib.mjs.
const REGISTER = resolveRegisterJson(ROOT, cfg);
const TEST_DIRS = (cfg.testDirs ?? ['apps', 'packages']).map((d) => resolve(ROOT, d));
const REQUIRED_COLS = cfg.requiredCols ?? ['register', 'test'];
const FROZEN_PHASES = new Set(cfg.frozenPhases ?? ['Phase 1']);
const REQ_ID = /\b[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+\b/g;
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
// `--flag value` or `--flag=value`
const argVal = (f) => {
  const i = args.findIndex((a) => a === f || a.startsWith(f + '='));
  if (i < 0) return null;
  return args[i].includes('=') ? args[i].slice(args[i].indexOf('=') + 1) : (args[i + 1] ?? null);
};
const MODULE_FILTER = argVal('--module');          // e.g. --module MD  → only REQ-IDs under MD.
const ISSUES_FILE = (argVal('--issues-file') || cfg.issuesFile)
  ? resolve(ROOT, argVal('--issues-file') || cfg.issuesFile) : null;   // read a gh dump instead of gh-live

// ---- REQ-ID universe from SRS -------------------------------------------------
function srsReqIds() {
  const ids = new Set();
  walk(SRS_DIR, (p) => p.endsWith('.md')).forEach((p) => {
    (readSafe(p).match(REQ_ID) ?? []).forEach((id) => ids.add(id));
  });
  return ids;
}

// ---- register coverage (explicit vs module catch-all) ------------------------
// A register `reqids` entry is one of:
//   exact       MD.CUST.01      → names one REQ
//   range       MD.CUST.01-10   → a numbered span in an area
//   area glob   MD.CUST.*       → names a sub-area (acceptable per-area scope row)
//   module glob MD.*            → module catch-all — too coarse: it silently makes
//                                 EVERY area look covered even when no per-area row exists.
// Only exact/range/area-glob count as REAL coverage ('✓'). A REQ-ID matched ONLY by a
// module catch-all is '~' (wildcard-only) — not green, so missing per-area scope rows
// stop hiding behind a single MD.* / CL.* line.
function registerMatchers() {
  if (!existsSync(REGISTER)) return [];
  let data;
  try { data = JSON.parse(readFileSync(REGISTER, 'utf8')); } catch { return []; }
  const entries = [];
  (function collect(o) {
    if (Array.isArray(o)) return o.forEach(collect);
    if (o && typeof o === 'object') {
      if (Array.isArray(o.reqids)) o.reqids.forEach((r) => entries.push(String(r)));
      Object.values(o).forEach(collect);
    }
  })(data);
  return entries.map((e) => {
    if (/^[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+$/.test(e)) return { kind: 'explicit', test: (id) => id === e };
    const stem = e.replace(/\.\*+$/, '').replace(/\.\d+(-\d+)?$/, '').replace(/\*/g, '');
    // stem still has a '.' → MODULE.AREA (area-level, explicit enough); no '.' → MODULE-only catch-all
    const kind = stem.includes('.') ? 'explicit' : 'wildcard';
    return { kind, test: (id) => id.startsWith(stem) };
  });
}

// ---- issues (optional) --------------------------------------------------------
function issueReqIds() {
  let body = '';
  if (ISSUES_FILE && existsSync(ISSUES_FILE)) {
    try { JSON.parse(readFileSync(ISSUES_FILE, 'utf8')).forEach((i) => (body += ' ' + (i.body || ''))); }
    catch { return null; }
  } else {
    const repo = cfg.repo || '';
    try {
      const out = execFileSync('gh', ['issue', 'list', ...(repo ? ['--repo', repo] : []),
        '--state', 'all', '--limit', '800', '--json', 'body'], { encoding: 'utf8', timeout: 60000 });
      JSON.parse(out).forEach((i) => (body += ' ' + (i.body || '')));
    } catch { return null; } // gh offline / no auth → column becomes '?'
  }
  return new Set(body.match(REQ_ID) ?? []);
}

// ---- tests --------------------------------------------------------------------
function testReqIds() {
  const ids = new Set();
  TEST_DIRS.forEach((d) => walk(d, (p) => /\.(spec|test)\.[tj]sx?$/.test(p))
    .forEach((p) => (readSafe(p).match(REQ_ID) ?? []).forEach((id) => ids.add(id))));
  return ids;
}

// ---- prototype phase-freeze (coarse: by the REQ-ID's module → its feature phase)
// We can only say freeze at the PHASE level; map REQ-ID → phase via the register,
// then a phase is frozen iff it's in FROZEN_PHASES.
function phaseOfReqId() {
  const map = new Map();
  if (!existsSync(REGISTER)) return map;
  let data; try { data = JSON.parse(readFileSync(REGISTER, 'utf8')); } catch { return map; }
  (function collect(o, phase) {
    if (Array.isArray(o)) return o.forEach((x) => collect(x, phase));
    if (o && typeof o === 'object') {
      const ph = o.phase ?? phase;
      if (Array.isArray(o.reqids)) o.reqids.forEach((r) => {
        const stem = String(r).replace(/\.\*+$/, '').replace(/\.\d+(-\d+)?$/, '').replace(/\*/g, '');
        map.set(stem, ph);
      });
      Object.values(o).forEach((v) => collect(v, ph));
    }
  })(data, null);
  return map;
}

// ---- build the matrix ---------------------------------------------------------
function build() {
  if (!existsSync(SRS_DIR)) return null;
  let reqIds = [...srsReqIds()].sort();
  if (MODULE_FILTER) {
    const mf = MODULE_FILTER.replace(/\.+$/, '');
    reqIds = reqIds.filter((id) => id === mf || id.startsWith(mf + '.'));
  }
  const regMatch = registerMatchers();
  const issues = issueReqIds();      // Set | null
  const tests = testReqIds();
  const phaseMap = phaseOfReqId();
  const rows = reqIds.map((id) => {
    const explicit = regMatch.some((m) => m.kind === 'explicit' && m.test(id));
    const wildcard = regMatch.some((m) => m.kind === 'wildcard' && m.test(id));
    const register = explicit ? '✓' : (wildcard ? '~' : '✗');
    const inIssue = issues === null ? '?' : (issues.has(id) ? '✓' : '✗');
    const inTest = tests.has(id) ? '✓' : '✗';
    const stem = id.replace(/\.\d+$/, '');            // MODULE.AREA
    const phase = phaseMap.get(stem) ?? phaseMap.get(id.split('.')[0]) ?? null;  // fall back to MODULE-level (catch-all rows)
    const proto = phase == null ? '?' : (FROZEN_PHASES.has(phase) ? '✓' : '⚠');
    return { id, register, issue: inIssue, test: inTest, prototype: proto, phase };
  });
  return { rows, hasIssues: issues !== null };
}

// '~' (register matched only by a module catch-all) counts as NOT covered — it is the
// silent-green case we want the gate to flag, not pass.
function fails(rows) {
  return rows.filter((r) => REQUIRED_COLS.some((c) => r[c] === '✗' || r[c] === '~'));
}

// ---- selftest -----------------------------------------------------------------
if (has('--selftest')) {
  const kindOf = (e) => {
    if (/^[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+$/.test(e)) return 'explicit';
    const stem = e.replace(/\.\*+$/, '').replace(/\.\d+(-\d+)?$/, '').replace(/\*/g, '');
    return stem.includes('.') ? 'explicit' : 'wildcard';
  };
  const ok =
    kindOf('MD.CUST.01') === 'explicit' &&
    kindOf('MD.CUST.01-10') === 'explicit' &&
    kindOf('MD.CUST.*') === 'explicit' &&      // area-level glob = explicit enough
    kindOf('CL.*') === 'wildcard' &&           // module catch-all = wildcard-only
    'MD.CUST.01'.startsWith('MD.CUST') && !'MD.TAG.01'.startsWith('MD.CUST');
  console.log(ok ? '✓ [rtm-selftest] register classify (explicit vs module-catch-all) + prefix OK' : '✗ [rtm-selftest] FAILED');
  process.exit(ok ? 0 : 1);
}

const res = build();
if (res === null) { console.log('✓ [rtm-status] no SRS dir yet — skipped'); process.exit(0); }
const { rows, hasIssues } = res;
const bad = fails(rows);

if (has('--json')) {
  console.log(JSON.stringify({ total: rows.length, breaching: bad.length, requiredCols: REQUIRED_COLS, rows }, null, 2));
} else {
  const pct = (c) => rows.length ? Math.round(100 * rows.filter((r) => r[c] === '✓').length / rows.length) : 0;
  console.log(`# RTM status — ${rows.length} REQ-ID (nguồn: SRS)\n`);
  console.log(`register ${pct('register')}%  ·  test ${pct('test')}%  ·  issue ${hasIssues ? pct('issue') + '%' : 'n/a (gh offline — dùng --issues-file <dump>)'}  ·  prototype-frozen ${pct('prototype')}%`);
  console.log('_✓=có · ✗=thiếu · ~=chỉ khớp module catch-all (chưa có scope-row riêng cho area) · ?=nguồn offline_\n');
  console.log('| REQ-ID | register | issue | test | prototype | phase |');
  console.log('|---|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.id} | ${r.register} | ${r.issue} | ${r.test} | ${r.prototype} | ${r.phase ?? '?'} |`);
  console.log(`\n**Thiếu (cột bắt buộc ${REQUIRED_COLS.join('+')}): ${bad.length}/${rows.length}**`);
}

if (has('--gate')) {
  if (bad.length) {
    console.error(`✗ [rtm-gate] ${bad.length} REQ-ID thiếu ở cột bắt buộc (${REQUIRED_COLS.join(', ')}): ${bad.slice(0, 15).map((r) => r.id).join(', ')}${bad.length > 15 ? '…' : ''}`);
    process.exit(1);
  }
  console.log(`✓ [rtm-gate] ${rows.length} REQ-ID đều đủ ở cột bắt buộc (${REQUIRED_COLS.join(', ')})`);
}
