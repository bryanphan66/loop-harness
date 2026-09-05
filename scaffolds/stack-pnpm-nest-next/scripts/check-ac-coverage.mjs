#!/usr/bin/env node
/**
 * AC-coverage FLOOR gate (makes Leg-1 "Functional AC" mechanical — coverage half).
 *
 * phase-acceptance Leg-1 says every numbered acceptance check of a phase must be
 * exercised, but nothing MECHANICAL asserted that each REQ-ID even HAS a test
 * referencing it — the verifier could sign a phase off while some REQ-ID had zero
 * tests. A field run let 10/17 features reach QC on the first pass with gaps of
 * exactly this shape. This gate closes the presence hole: every in-scope REQ-ID
 * covered by the build-manifest phase blocks MUST be referenced by at least one
 * test file (e2e / integration / unit).
 *
 * HONEST LIMIT — this is a COVERAGE FLOOR, not a Requirements-Traceability-Matrix.
 * It proves each REQ-ID appears in >=1 test's source; it does NOT prove:
 *   - that EVERY acceptance criterion under a REQ-ID has its own test (a REQ with
 *     3 ACs and 1 test referencing it passes the floor);
 *   - that the referencing test ASSERTS the AC correctly, or even runs green
 *     (test-integrity is the verifier's Leg / the test-run gate, not this static grep).
 * So a green [ac-coverage] means "no REQ-ID is entirely test-less", the machine
 * floor under Leg-1 — the behavioural check that the AC actually holds against the
 * running app stays with the verifier agent.
 *
 * PHẠM VI ĐO = ĐỢT PHÁT HÀNH, không phải toàn bộ register.
 *
 * Một dự án phát hành làm nhiều đợt (roadmap thật: Phase 1..5, mỗi đợt một mốc
 * thời gian). Bắt DoD của đợt đầu phải phủ cả 401 REQ-ID của toàn dự án là bắt
 * một điều không ai định làm - cổng sẽ đỏ tới tận đợt cuối rồi bị bỏ qua.
 *
 * Khai `acCoverage.releaseScope.phases` trong gate-config.json (vd `["P0","P1"]`)
 * thì gate chỉ đo REQ-ID của các phase đó. Không khai thì đo toàn bộ như cũ.
 *
 * Bộ đọc manifest dùng `reqIdsByPhase` của gate-lib, KHÔNG viết lại. Bản tự viết
 * trước đây dùng regex cũ nên dính đúng hai lỗi đã vá ở nơi khác: nhãn có hậu tố
 * `(7)` và nhãn trải nhiều dòng - lần thứ năm cùng một việc được viết lại.
 *
 * Source of the in-scope REQ-ID set = the build-manifest phase blocks'
 * `**REQ-IDs covered:**` / `**REQ-IDs:**` lines (the SAME contract
 * check-manifest-coverage enforces maps to phases). Ranges/lists are expanded:
 * `IF.AUTH.01–03` -> 01,02,03 ; `MD.CUST.02/06` -> 02,06.
 *
 * Fail-soft (skip, exit 0) — the gate must not block a bare skeleton — when:
 *   - the build-manifest file is absent (not a manifest-driven project yet), or
 *   - no REQ-IDs are declared in any phase block, or
 *   - zero test files exist under the configured test dirs (no tests yet).
 *
 * Config: gate-config.json -> acCoverage.{buildManifest, testDirs, allowlist}.
 * allowlist holds REQ-IDs that legitimately carry no test (pure-infra / verifier-
 * only NFR) — a genuine exception, prefer adding a test.
 *
 * --advisory: run the SAME check but always exit 0, printing the breach as a
 * report instead of blocking. For a repo carrying a pre-existing coverage-floor
 * backlog (a REQ-ID set built before this gate existed) — the chain stays green
 * while the backlog burns down; a new/template project wires it HARD (no flag).
 * Advisory beats stuffing the whole backlog into the allowlist (a fake green).
 *
 *   node scripts/check-ac-coverage.mjs
 *   node scripts/check-ac-coverage.mjs --advisory   # report-only, never blocks
 *   node scripts/check-ac-coverage.mjs --selftest   # fixtures pass/fail/skip/allowlist/range
 */
import { existsSync, readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, walk, readSafe, reqIdsByPhase, inScopeReqIds } from './gate-lib.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

// REQ-ID grammar: MODULE.AREA.NN (e.g. IF.AUTH.01, MD.CUST.02, NFR.PERF.08),
// with an optional trailing range/list suffix: `.01–03`, `.02/06`, `.01-04`.
const REQ_ID_RUN = /\b([A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*)\.(\d+)((?:\s*[-–/]\s*\d+)*)/g;

const DEFAULT_TEST_DIRS = ['apps/web/e2e', 'apps/web/e2e-ui', 'apps/api/src', 'apps/api/test'];
const TEST_FILE = /\.(?:spec|e2e-spec|test)\.ts$/;

/**
 * Extract every REQ-ID from `text`, expanding range (`-`/`–`) and list (`/`)
 * suffixes into individual zero-padded ids. Returns a Set of `PREFIX.NN`.
 * Used symmetrically on BOTH sides (manifest REQ-IDs + test corpus) so a range
 * written one way (`IF.AUTH.01–03`) matches ids written the other (`IF.AUTH.02`).
 */
export function extractReqIds(text) {
  const ids = new Set();
  const pad = (n) => String(n).padStart(2, '0');
  let m;
  REQ_ID_RUN.lastIndex = 0;
  while ((m = REQ_ID_RUN.exec(text)) !== null) {
    const prefix = m[1];
    let prev = parseInt(m[2], 10);
    ids.add(`${prefix}.${pad(prev)}`);
    const tail = m[3] || '';
    const seg = /([-–/])\s*(\d+)/g;
    let s;
    while ((s = seg.exec(tail)) !== null) {
      const sep = s[1];
      const num = parseInt(s[2], 10);
      if (sep === '/') {
        ids.add(`${prefix}.${pad(num)}`); // list item
      } else if (num > prev) {
        for (let i = prev + 1; i <= num; i++) ids.add(`${prefix}.${pad(i)}`); // range
      } else {
        ids.add(`${prefix}.${pad(num)}`); // malformed range — take literal
      }
      prev = num;
    }
  }
  return ids;
}


/**
 * Run the gate against `root`. Pure (no process.exit) so --selftest can drive it
 * against throwaway fixtures. Returns {code, out:[], err:[]}.
 */
export function runGate(root) {
  const out = [];
  const err = [];
  const cfg = loadGateConfig(root).acCoverage ?? {};
  const manifestPath = resolve(root, cfg.buildManifest ?? 'docs/build-manifest.md');
  const testDirs = Array.isArray(cfg.testDirs) && cfg.testDirs.length ? cfg.testDirs : DEFAULT_TEST_DIRS;
  const allowlist = new Set(Array.isArray(cfg.allowlist) ? cfg.allowlist : []);

  if (!existsSync(manifestPath)) {
    out.push('✓ [ac-coverage] no build-manifest yet — skipped');
    return { code: 0, out, err };
  }

  const { byPhase } = reqIdsByPhase(root, manifestPath);
  // Mảng RỖNG nghĩa là "không lọc", không phải "đợt không có phase nào". Bản đầu
  // của tôi coi `[]` là danh sách hợp lệ nên chế độ toàn bộ lọc ra 0 mục rồi báo
  // XANH - đúng bệnh xanh giả vừa vá ở gate khác, tự tay dựng lại.
  const scopeCfg = cfg.releaseScope ?? {};
  const scopePhases = Array.isArray(scopeCfg.phases) && scopeCfg.phases.length ? scopeCfg.phases : null;
  const fromManifest = new Set();
  for (const [phase, ids] of byPhase) {
    if (phase.includes('.')) continue;                       // phase con đã gộp lên cha
    if (scopePhases && !scopePhases.includes(phase)) continue;
    for (const id of ids) fromManifest.add(id);
  }
  // Giao với register: bỏ luật nghiệp vụ (BR.*) và thứ ngoài phạm vi, giữ đúng
  // những REQ-ID mà dự án đã cam kết xây.
  const registered = inScopeReqIds(root, loadGateConfig(root).rtm ?? {});
  const inScope = registered.size
    ? new Set([...fromManifest].filter((id) => registered.has(id)))
    : fromManifest;
  const scopeLabel = scopePhases ? `đợt "${scopeCfg.name ?? scopePhases.join('+')}"` : 'toàn bộ';
  if (inScope.size === 0) {
    // Manifest tồn tại mà lọc ra 0 REQ-ID là ĐỌC HỎNG hoặc đợt khai sai, không
    // phải "chưa có gì". So sánh 0 mục rồi báo xanh là cách một cổng thành vô nghĩa.
    if (existsSync(manifestPath)) {
      err.push(`\n✗ [ac-coverage] đọc ${relative(root, manifestPath)} nhưng lọc ra 0 REQ-ID (phạm vi ${scopeLabel}) — đọc hỏng hoặc đợt phát hành khai sai phase, KHÔNG phải phạm vi trống.`);
      return { code: 1, out, err };
    }

    out.push('✓ [ac-coverage] build-manifest declares no REQ-IDs yet — skipped');
    return { code: 0, out, err };
  }

  // Build the test-corpus REQ-ID set (same extractor, so range-notation matches).
  const testFiles = [];
  for (const d of testDirs) testFiles.push(...walk(resolve(root, d), (n) => TEST_FILE.test(n)));
  if (testFiles.length === 0) {
    out.push(`✓ [ac-coverage] no test files under ${testDirs.join(', ')} yet — skipped (${inScope.size} REQ-ID ${scopeLabel} pending tests)`);
    return { code: 0, out, err };
  }
  const tested = new Set();
  for (const f of testFiles) for (const id of extractReqIds(readSafe(f))) tested.add(id);

  const uncovered = [];
  for (const req of inScope) {
    if (allowlist.has(req)) continue;
    if (!tested.has(req)) uncovered.push(req);
  }

  if (uncovered.length) {
    err.push(`\n✗ [ac-coverage] ${uncovered.length} in-scope REQ-ID(s) have NO test referencing them (phạm vi ${scopeLabel}, coverage floor breached, of ${inScope.size} in-scope across ${testFiles.length} test files):\n`);
    for (const req of uncovered.sort()) err.push(`  - ${req}`);
    err.push(`\n  Add a test (e2e/integration/unit) that names the REQ-ID (in a describe/comment/title)`);
    err.push(`  so the AC has a mechanical home. A REQ-ID that is verifier-only / pure-infra with no`);
    err.push(`  automatable test goes in scripts/gate-config.json -> acCoverage.allowlist (last resort).`);
    err.push(`  NOTE: this floor only proves a REQ-ID is REFERENCED — the verifier still proves each AC holds.\n`);
    return { code: 1, out, err };
  }

  out.push(`✓ [ac-coverage] ${inScope.size - allowlist.size} REQ-ID ${scopeLabel} đều có >=1 test (${testFiles.length} test files) — coverage floor met`);
  return { code: 0, out, err };
}

// --------------------------------------------------------------------------
// Self-test: build throwaway fixtures and assert exit codes. Runs the SAME
// runGate() the real check uses.
// --------------------------------------------------------------------------
function writeFixture(base, files) {
  for (const [rel, content] of Object.entries(files)) {
    const p = join(base, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
}

function selftest() {
  const tmp = mkdtempSync(join(tmpdir(), 'ac-coverage-selftest-'));
  let pass = 0;
  let fail = 0;
  const assert = (name, ok) => {
    if (ok) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.error(`  ✗ ${name}`); }
  };

  const MANIFEST_PASS = [
    '## P1 — Auth',
    '- **REQ-IDs covered:** `AB.CD.01`, `AB.CD.02`, `EF.GH.01–02`',
    '- **Acceptance checks:**',
    '',
    '## P2 — Orders',
    '- **REQ-IDs:** `IJ.KL.01`',
  ].join('\n');

  // Case PASS — every REQ-ID (incl. the expanded EF.GH.01–02 range) has a test ref.
  const passRoot = join(tmp, 'pass');
  writeFixture(passRoot, {
    'docs/build-manifest.md': MANIFEST_PASS,
    'apps/web/e2e/auth.spec.ts': `describe('AB.CD.01 + AB.CD.02 login', () => { it('EF.GH.01', () => {}); it('EF.GH.02', () => {}); });`,
    'apps/api/src/orders.e2e-spec.ts': `// covers IJ.KL.01\nit('orders', () => {});`,
  });
  const r1 = runGate(passRoot);
  assert('PASS fixture exits 0', r1.code === 0);
  assert('PASS reports coverage floor met', r1.out.join('\n').includes('coverage floor met'));
  assert('PASS emits no failure lines', !r1.err.join('\n').includes('✗'));

  // Case FAIL — AB.CD.03 declared but no test names it.
  const failRoot = join(tmp, 'fail');
  writeFixture(failRoot, {
    'docs/build-manifest.md': '## P1\n- **REQ-IDs covered:** `AB.CD.01`, `AB.CD.03`',
    'apps/web/e2e/x.spec.ts': `it('AB.CD.01', () => {});`,
  });
  const r2 = runGate(failRoot);
  const r2err = r2.err.join('\n');
  assert('FAIL fixture exits 1', r2.code === 1);
  assert('FAIL flags the uncovered AB.CD.03', r2err.includes('AB.CD.03'));
  assert('FAIL does NOT flag the covered AB.CD.01', !/- AB\.CD\.01\b/.test(r2err));

  // Case FAIL-RANGE — a range id in the middle (EF.GH.02) is untested.
  const rangeRoot = join(tmp, 'range');
  writeFixture(rangeRoot, {
    'docs/build-manifest.md': '## P1\n- **REQ-IDs:** `EF.GH.01–03`',
    'apps/web/e2e/r.spec.ts': `it('EF.GH.01', () => {}); it('EF.GH.03', () => {});`,
  });
  const r3 = runGate(rangeRoot);
  assert('FAIL-RANGE exits 1 (EF.GH.02 untested)', r3.code === 1);
  assert('FAIL-RANGE flags exactly EF.GH.02', r3.err.join('\n').includes('EF.GH.02') && !r3.err.join('\n').includes('EF.GH.01\n'));

  // Case ALLOWLIST — the uncovered id is allowlisted → pass.
  const allowRoot = join(tmp, 'allow');
  writeFixture(allowRoot, {
    'docs/build-manifest.md': '## P1\n- **REQ-IDs covered:** `AB.CD.01`, `IN.OPS.01`',
    'apps/web/e2e/a.spec.ts': `it('AB.CD.01', () => {});`,
    'scripts/gate-config.json': JSON.stringify({ acCoverage: { allowlist: ['IN.OPS.01'] } }),
  });
  const r4 = runGate(allowRoot);
  assert('ALLOWLIST fixture exits 0 (IN.OPS.01 waived)', r4.code === 0);

  // Case SKIP-NO-MANIFEST — no build-manifest → no-op.
  const skip1 = join(tmp, 'skip1');
  writeFixture(skip1, { 'apps/web/e2e/z.spec.ts': `it('x', () => {});` });
  const r5 = runGate(skip1);
  assert('SKIP (no manifest) exits 0', r5.code === 0 && r5.out.join('\n').includes('no build-manifest'));

  // Case SKIP-NO-TESTS — manifest with REQ-IDs but zero test files → no-op
  // (bare skeleton must stay runnable, like the sibling coverage gates).
  const skip2 = join(tmp, 'skip2');
  writeFixture(skip2, { 'docs/build-manifest.md': '## P1\n- **REQ-IDs:** `AB.CD.01`' });
  const r6 = runGate(skip2);
  assert('SKIP (no tests) exits 0', r6.code === 0 && r6.out.join('\n').includes('no test files'));

  // Case CONTINUATION — REQ-IDs wrapped onto an indented follow-on line are parsed.
  const contRoot = join(tmp, 'cont');
  writeFixture(contRoot, {
    'docs/build-manifest.md': '## P1\n- **REQ-IDs:** `AB.CD.01`,\n  `AB.CD.02` (register rows #1, #2)\n- **Entities:** x',
    'apps/web/e2e/c.spec.ts': `it('AB.CD.01', () => {});`,
  });
  const r7 = runGate(contRoot);
  assert('CONTINUATION parses wrapped AB.CD.02 → FAIL (untested)', r7.code === 1 && r7.err.join('\n').includes('AB.CD.02'));

  rmSync(tmp, { recursive: true, force: true });

  console.log(`\n[ac-coverage selftest] ${pass} passed, ${fail} failed`);
  return fail === 0 ? 0 : 1;
}

// --------------------------------------------------------------------------
const isSelftest = process.argv.includes('--selftest');
const isAdvisory = process.argv.includes('--advisory');
if (isSelftest) {
  process.exit(selftest());
} else {
  const { code, out, err } = runGate(gateRoot(SCRIPT_DIR));
  for (const l of out) console.log(l);
  for (const l of err) console.error(l);
  if (code !== 0 && isAdvisory) {
    console.error('⚠ [ac-coverage] ADVISORY mode — coverage-floor breach reported above, NOT blocking. Burn the backlog down, then drop --advisory to make it a hard gate.');
    process.exit(0);
  }
  process.exit(code);
}
