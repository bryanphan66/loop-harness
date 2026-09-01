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
 * ✓ = present, ✗ = missing, ? = source not available this run (e.g. gh offline).
 * The SRS column is implicit (every row exists because the SRS defines it).
 *
 * Two modes:
 *   node scripts/rtm-status.mjs                 # print the matrix (Markdown)
 *   node scripts/rtm-status.mjs --gate          # exit 1 if a required column has ✗
 *   node scripts/rtm-status.mjs --json          # machine output for a dashboard
 *   node scripts/rtm-status.mjs --selftest      # built-in checks
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
import { gateRoot, loadGateConfig, walk, readSafe } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT).rtm ?? {};
const SRS_DIR = resolve(ROOT, cfg.srsDir ?? 'docs/requirements/srs');
const REGISTER = resolve(ROOT, cfg.registerJson ?? 'docs/scope-baseline/feature-register.source.json');
const TEST_DIRS = (cfg.testDirs ?? ['apps', 'packages']).map((d) => resolve(ROOT, d));
const REQUIRED_COLS = cfg.requiredCols ?? ['register', 'test'];
const FROZEN_PHASES = new Set(cfg.frozenPhases ?? ['Phase 1']);
const ISSUES_FILE = cfg.issuesFile ? resolve(ROOT, cfg.issuesFile) : null;

const REQ_ID = /\b[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+\b/g;
const args = process.argv.slice(2);
const has = (f) => args.includes(f);

// ---- REQ-ID universe from SRS -------------------------------------------------
function srsReqIds() {
  const ids = new Set();
  walk(SRS_DIR, (p) => p.endsWith('.md')).forEach((p) => {
    (readSafe(p).match(REQ_ID) ?? []).forEach((id) => ids.add(id));
  });
  return ids;
}

// ---- register coverage (wildcard/range aware) --------------------------------
// register `reqids` entries can be exact (MD.CUST.01), a range (MD.CUST.01-10),
// or a wildcard (MD.* / MD.CUST.*). A SRS REQ-ID is "in register" if ANY entry
// matches it. Ranges/wildcards are treated as prefix matches on the MODULE.AREA
// stem (coarse but honest — the register is a scope index, not a per-REQ list).
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
    const exact = e.match(/^[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+$/);
    if (exact) return (id) => id === e;
    // wildcard or range → prefix on the part before '.*', '.NN-MM', or trailing '.*'
    const stem = e.replace(/\.\*+$/, '').replace(/\.\d+(-\d+)?$/, '').replace(/\*/g, '');
    return (id) => id.startsWith(stem);
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
  const reqIds = [...srsReqIds()].sort();
  const regMatch = registerMatchers();
  const issues = issueReqIds();      // Set | null
  const tests = testReqIds();
  const phaseMap = phaseOfReqId();
  const rows = reqIds.map((id) => {
    const inReg = regMatch.some((m) => m(id));
    const inIssue = issues === null ? '?' : (issues.has(id) ? '✓' : '✗');
    const inTest = tests.has(id) ? '✓' : '✗';
    const stem = id.replace(/\.\d+$/, '');
    const phase = phaseMap.get(stem) ?? null;
    const proto = phase == null ? '?' : (FROZEN_PHASES.has(phase) ? '✓' : '⚠');
    return { id, register: inReg ? '✓' : '✗', issue: inIssue, test: inTest, prototype: proto, phase };
  });
  return { rows, hasIssues: issues !== null };
}

function fails(rows) {
  return rows.filter((r) => REQUIRED_COLS.some((c) => r[c] === '✗'));
}

// ---- selftest -----------------------------------------------------------------
if (has('--selftest')) {
  const m = registerMatchers.length; // presence
  const stem = 'MD.CUST.*'.replace(/\.\*+$/, '').replace(/\.\d+(-\d+)?$/, '').replace(/\*/g, '');
  const ok = stem === 'MD.CUST' && 'MD.CUST.01'.startsWith(stem) && !'MD.TAG.01'.startsWith(stem);
  console.log(ok ? '✓ [rtm-selftest] wildcard/prefix matching OK' : '✗ [rtm-selftest] FAILED');
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
  console.log(`register ${pct('register')}%  ·  test ${pct('test')}%  ·  issue ${hasIssues ? pct('issue') + '%' : 'n/a (gh offline)'}  ·  prototype-frozen ${pct('prototype')}%\n`);
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
