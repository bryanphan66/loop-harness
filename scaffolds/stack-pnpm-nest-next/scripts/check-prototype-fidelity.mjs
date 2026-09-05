#!/usr/bin/env node
/**
 * Prototype-fidelity STRUCTURAL gate (closes the WORST Macro-2 hole: a screen
 * built by RE-DRAWING the UI instead of ADOPTING the frozen prototype through
 * the project's existing components).
 *
 * The older fidelity gates only prove a `*-fidelity.spec.ts` EXISTS and imports
 * the universal fixture (`check-universal-fidelity-imports.mjs`,
 * `check-new-screen-fidelity-required.mjs`). Neither proves the built screen
 * actually USES the shared components the prototype implies — so a screen that
 * hand-rolls a `<table>` + inline stat divs instead of reusing `DataGrid` +
 * `StatCard` sailed through GREEN while diverging ~20% from the export. This
 * gate makes the adopt-via-existing-components rule MECHANICAL:
 *
 *   For each route listed in scripts/fidelity-map.json (authored when the
 *   prototype is frozen), read the built screen (its page.tsx + co-located
 *   .tsx under the same route dir) and ASSERT:
 *     - requiredComponents  — each is IMPORTED from a shared components root
 *       (not defined inline) AND used as `<Comp` in JSX. A component used but
 *       imported from a local/relative non-shared path is a re-draw → FAIL.
 *     - requiredSections    — each prototype section is structurally present
 *       (heuristics: <StatCard> ⇒ kpi-row, <PageHead tabs=…> ⇒ object-page-tabs,
 *       <Timeline> ⇒ timeline, <DataGrid> ⇒ grid, …; unknown keys fall back to a
 *       token-in-source check). Extensible via fidelity-map sectionHeuristics.
 *     - no raw <table> on a grid screen — a grid MUST render through DataGrid,
 *       never a re-drawn HTML table (per-route forbidRawTable, default true).
 *
 * Scope discipline (matches the sibling gates):
 *   - STRICT for a route that IS in the map (the prototype was frozen for it).
 *   - Fail-SOFT for a route NOT in the map (baseline — a screen the prototype
 *     never covered is governed by the design-system fallback, not this gate).
 *   - A mapped route whose page.tsx does not exist yet → SKIP + warn (not built
 *     yet; the walking skeleton must stay runnable). manifest-coverage enforces
 *     that it eventually gets built.
 *   - No fidelity-map.json at all → skipped (not a prototype-mapped project yet).
 *
 * A route's screen source is scoped to its OWN app-router segment: the .tsx
 * files directly in the route dir plus private/group co-location folders, but
 * NOT a child route segment (a subdir that owns its own page.tsx — e.g. a
 * `customers/` list route does NOT swallow the `customers/[id]/` object page).
 * Without that boundary the list route would inherit the object page's small
 * per-tab tables and falsely trip forbidRawTable.
 *
 * This gate does the COMPONENT-PRESENCE half of visual-fidelity Tooth A. The
 * PIXEL/AESTHETIC half (side-by-side glance, exact spacing/theme) stays with the
 * verifier + human — a machine cannot judge "looks like the export", only that
 * the structural building blocks the export implies are present.
 *
 *   node scripts/check-prototype-fidelity.mjs
 *   node scripts/check-prototype-fidelity.mjs --selftest   # fixture pass/fail/skip
 */
import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, readSafe } from './gate-lib.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

// Default shared-component import roots. A required component must be imported
// from one of these to count as "reused" (not re-drawn inline). Substring match.
const DEFAULT_SHARED_ROOTS = ['@/components', 'components/ui', 'components/', '~/components', '@components'];

// Vendor/build dirs never walked when collecting a route's screen source.
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '.git', 'coverage', 'build', '.turbo']);

// A JSX-usage / heuristic boundary that also accepts a generic type argument, so
// `<DataGrid<Customer>` (component used with a generic) counts as used, not just
// `<DataGrid ` / `<DataGrid/>` / `<DataGrid>`.
const JSX_BOUNDARY = '[\\s/><]';

// Built-in section presence heuristics. Each section key → list of regexes; the
// section is present when ANY matches the concatenated screen source. A key not
// found here (and not overridden in the map's sectionHeuristics) falls back to a
// literal token-in-source check, so the map author can name ad-hoc sections.
const DEFAULT_SECTION_HEURISTICS = {
  'kpi-row': [/<StatCard[\s/>]/],
  'kpi': [/<StatCard[\s/>]/],
  'stat-row': [/<StatCard[\s/>]/],
  'object-page-tabs': [/<PageHead[^>]*\btabs\s*=/, /<Tabs[\s/>]/],
  'tabs': [/<PageHead[^>]*\btabs\s*=/, /<Tabs[\s/>]/],
  'timeline': [/<Timeline[\s/>]/],
  'data-grid': [/<DataGrid[\s/><]/],
  'grid': [/<DataGrid[\s/><]/],
  'table': [/<DataGrid[\s/><]/],
  'filter-bar': [/<FilterBar[\s/>]/, /<Toolbar[\s/>]/],
  'toolbar': [/<Toolbar[\s/>]/, /<FilterBar[\s/>]/],
  'detail-panel': [/<DetailPanel[\s/>]/, /<SidePanel[\s/>]/],
  'empty-state': [/<EmptyState[\s/>]/],
};

/**
 * Collect the .tsx files that make up a route's OWN screen: files directly in
 * the route dir + recursion into private (`_x`) / route-group (`(x)`) folders,
 * but NOT into a child route segment (a subdir that owns its own page.tsx). This
 * keeps a list route from inheriting its `[id]/` object-page source.
 */
function collectScreenTsx(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      // A subdir that owns a page.tsx/page.ts is a DIFFERENT route segment — its
      // source belongs to that route, not this one.
      if (existsSync(join(p, 'page.tsx')) || existsSync(join(p, 'page.ts'))) continue;
      out.push(...collectScreenTsx(p));
    } else if (name.endsWith('.tsx')) {
      out.push(p);
    }
  }
  return out;
}

/** collect the screen source for a route: its page.tsx + every co-located .tsx in the route segment */
function screenSource(root, pageFile) {
  const dir = dirname(pageFile);
  return collectScreenTsx(dir)
    .map((p) => readSafe(p))
    .join('\n/* --- */\n');
}

/** the route's page.tsx path — explicit `page` override, else derived under apps/web/src/app */
function resolvePageFile(root, entry) {
  if (entry.page) return resolve(root, entry.page);
  const rel = entry.route.replace(/^\//, '');
  return resolve(root, 'apps/web/src/app', rel, 'page.tsx');
}

/** parse import bindings → map of importedName → Set(module specifiers it came from) */
function importSources(source) {
  const map = new Map();
  const re = /import\s+(?:type\s+)?([^;]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(source))) {
    const bindings = m[1];
    const spec = m[2];
    // named { A, B as C }, default D, namespace * as NS — collect every local ident
    for (const id of bindings.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || []) {
      if (id === 'type' || id === 'as') continue;
      if (!map.has(id)) map.set(id, new Set());
      map.get(id).add(spec);
    }
  }
  return map;
}

function importedFromShared(imports, name, sharedRoots) {
  const specs = imports.get(name);
  if (!specs) return false;
  for (const spec of specs) if (sharedRoots.some((r) => spec.includes(r))) return true;
  return false;
}

function usedInJsx(source, name) {
  return new RegExp('<' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + JSX_BOUNDARY).test(source);
}

function sectionPresent(source, key, overrides) {
  const raw = (overrides && overrides[key]) || DEFAULT_SECTION_HEURISTICS[key];
  if (raw) {
    const regexes = raw.map((r) => (r instanceof RegExp ? r : new RegExp(r)));
    return regexes.some((re) => re.test(source));
  }
  // fallback: literal token (kebab or spaced) appears somewhere in the source
  const token = key.toLowerCase();
  const s = source.toLowerCase();
  return s.includes(token) || s.includes(token.replace(/-/g, ''));
}

/**
 * Run the gate against `root`. Pure (no process.exit) so --selftest can drive it
 * against throwaway fixtures. Returns {code, out:[], err:[]}.
 */
export function runGate(root) {
  const out = [];
  const err = [];
  const cfg = loadGateConfig(root).prototypeFidelity ?? {};
  const mapPath = resolve(root, cfg.mapFile ?? 'scripts/fidelity-map.json');

  if (!existsSync(mapPath)) {
    // Dự án khai `prototypeFidelity.required: true` (có prototype đã đóng băng)
    // thì THIẾU map là ĐỎ, không phải bỏ qua: ở bước 2.10 thiếu map nghĩa là
    // chưa ai làm việc đối chiếu, mà gate lại đi qua - đúng hình dạng xanh giả.
    if (cfg.required) {
      err.push('✗ [prototype-fidelity] dự án khai có prototype đóng băng nhưng KHÔNG có scripts/fidelity-map.json — chưa làm, không phải được miễn');
      return { code: 1, out, err };
    }
    out.push('✓ [prototype-fidelity] no scripts/fidelity-map.json yet — skipped');
    return { code: 0, out, err };
  }

  let map;
  try {
    map = JSON.parse(readFileSync(mapPath, 'utf8'));
  } catch (e) {
    // a broken map must not silently disable the gate — but it also cannot block
    // every unrelated commit; treat as a loud skip so the author fixes the JSON.
    err.push(`⚠ [prototype-fidelity] invalid JSON at ${relative(root, mapPath)}: ${e.message} — skipped`);
    return { code: 0, out, err };
  }

  const routes = Array.isArray(map.routes) ? map.routes : [];
  const sharedRoots = Array.isArray(map.sharedImportRoots) && map.sharedImportRoots.length
    ? map.sharedImportRoots
    : DEFAULT_SHARED_ROOTS;

  if (routes.length === 0) {
    // Cùng lý do như nhánh thiếu file: map RỖNG cũng là chưa làm, không phải
    // được miễn. Hai đường bỏ qua thì phải chặn cả hai, không thì vá nửa vời.
    if (cfg.required) {
      err.push('✗ [prototype-fidelity] dự án khai có prototype đóng băng nhưng fidelity-map KHÔNG có route nào — chưa làm, không phải được miễn');
      return { code: 1, out, err };
    }
    out.push('✓ [prototype-fidelity] fidelity-map has no routes yet — skipped');
    return { code: 0, out, err };
  }

  const failures = []; // {route, reasons:[]}
  let checked = 0;
  let skipped = 0;

  for (const entry of routes) {
    if (!entry || !entry.route) continue;
    const pageFile = resolvePageFile(root, entry);
    if (!existsSync(pageFile)) {
      skipped++;
      err.push(`⚠ [prototype-fidelity] ${entry.route} — not built yet (${relative(root, pageFile)} missing); skipped`);
      continue;
    }
    checked++;
    const source = screenSource(root, pageFile);
    const imports = importSources(source);
    const reasons = [];

    for (const comp of entry.requiredComponents || []) {
      const used = usedInJsx(source, comp);
      const shared = importedFromShared(imports, comp, sharedRoots);
      if (!used) {
        reasons.push(`required component <${comp}> is never used (prototype adopts it — do not re-draw it inline)`);
      } else if (!shared) {
        reasons.push(`<${comp}> is used but NOT imported from a shared components root (${sharedRoots.join(', ')}) — a re-drawn/local copy defeats reuse`);
      }
    }

    for (const sec of entry.requiredSections || []) {
      if (!sectionPresent(source, sec, entry.sectionHeuristics || map.sectionHeuristics)) {
        reasons.push(`prototype section "${sec}" not structurally present`);
      }
    }

    const forbidRawTable = entry.forbidRawTable !== false; // default true
    if (forbidRawTable && /<table[\s>]/.test(source)) {
      reasons.push(`raw <table> found — a grid MUST render through DataGrid, not a re-drawn HTML table`);
    }

    // forbidPatterns — ANTI-TRANSCRIPTION backstop. The prototype export is drawn
    // in its OWN mock primitives (raw `<table className="tbl">`, div-bar chart,
    // inline `muted fzNN` helper, bare modal). "Adopt" means MAP each mock to the
    // project component (DataGrid / chart / InfoTooltip / Dialog) — never copy the
    // export markup. Any pattern here fires even when forbidRawTable is off for a
    // legit preview, so the mock CLASS can never survive into shipped code.
    // Sources: top-level map.forbidPatterns (every route) + entry.forbidPatterns.
    const forbidPatterns = [
      ...(Array.isArray(map.forbidPatterns) ? map.forbidPatterns : []),
      ...(Array.isArray(entry.forbidPatterns) ? entry.forbidPatterns : []),
    ];
    for (const fp of forbidPatterns) {
      const spec = typeof fp === 'string' ? { pattern: fp } : fp;
      if (!spec || !spec.pattern) continue;
      let re;
      try {
        re = spec.pattern instanceof RegExp ? spec.pattern : new RegExp(spec.pattern);
      } catch {
        continue;
      }
      if (re.test(source)) {
        reasons.push(
          spec.message ||
            `forbidden prototype-mock markup /${spec.pattern}/ present — map the export's mock primitive to the project component, do not transcribe it`,
        );
      }
    }

    if (reasons.length) failures.push({ route: entry.route, file: relative(root, pageFile), proto: entry.prototypeFile, reasons });
  }

  if (failures.length) {
    err.push(`\n✗ [prototype-fidelity] ${failures.length} mapped screen(s) diverge from the frozen prototype (structural adopt-via-existing-components check):\n`);
    for (const f of failures) {
      err.push(`  ${f.route}   (${f.file})${f.proto ? `  vs ${f.proto}` : ''}`);
      for (const r of f.reasons) err.push(`     - ${r}`);
    }
    err.push(`\n  Adopt the prototype through EXISTING components: grep components/ui/ first, reuse`);
    err.push(`  DataGrid/StatCard/PageHead-tabs/…; add a MISSING primitive to components/ui/ (shared,`);
    err.push(`  not a per-screen copy). A genuine exception can drop a requirement in`);
    err.push(`  scripts/fidelity-map.json (per-route requiredComponents/requiredSections/forbidRawTable).\n`);
    return { code: 1, out, err };
  }

  out.push(`✓ [prototype-fidelity] ${checked} mapped screen(s) adopt the prototype via existing components${skipped ? ` (${skipped} not built yet — skipped)` : ''}`);
  return { code: 0, out, err };
}

// --------------------------------------------------------------------------
// Self-test: build throwaway fixtures (pass / fail / skip / route-scope) and
// assert exit codes. Runs the SAME runGate() the real check uses.
// --------------------------------------------------------------------------
function writeFixture(base, files) {
  for (const [rel, content] of Object.entries(files)) {
    const p = join(base, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
}

function selftest() {
  const tmp = mkdtempSync(join(tmpdir(), 'prototype-fidelity-selftest-'));
  let pass = 0;
  let fail = 0;
  const assert = (name, ok) => {
    if (ok) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.error(`  ✗ ${name}`); }
  };

  // Case PASS — courses screen adopts DataGrid (with a generic type arg) +
  // StatCard + PageHead-tabs.
  const passRoot = join(tmp, 'pass');
  writeFixture(passRoot, {
    'scripts/fidelity-map.json': JSON.stringify({
      routes: [{
        route: '/admin/courses',
        prototypeFile: 'docs/visuals/prototype/exports/app-v1/screens-courses.jsx',
        requiredComponents: ['DataGrid', 'StatCard', 'PageHead'],
        requiredSections: ['kpi-row', 'object-page-tabs', 'grid'],
      }],
    }),
    'apps/web/src/app/admin/courses/page.tsx': `
      import { DataGrid } from '@/components/ui/data-grid';
      import { StatCard } from '@/components/ui/stat-card';
      import { PageHead } from '@/components/ui/page-head';
      export default function Page() {
        return (
          <>
            <PageHead title="Courses" tabs={[{ label: 'All' }]} />
            <StatCard label="Total" value={12} />
            <DataGrid<Row> rows={[]} columns={[]} />
          </>
        );
      }`,
  });
  const r1 = runGate(passRoot);
  assert('PASS fixture exits 0', r1.code === 0);
  assert('PASS fixture reports 1 screen checked', r1.out.join('\n').includes('1 mapped screen'));
  assert('PASS matches generic <DataGrid<Row>', !r1.err.join('\n').includes('DataGrid'));

  // Case FAIL — orders screen re-draws a raw <table>, misses DataGrid + StatCard,
  // and imports a locally re-drawn PageHead (not from a shared root).
  const failRoot = join(tmp, 'fail');
  writeFixture(failRoot, {
    'scripts/fidelity-map.json': JSON.stringify({
      routes: [{
        route: '/admin/orders',
        requiredComponents: ['DataGrid', 'StatCard', 'PageHead'],
        requiredSections: ['kpi-row', 'object-page-tabs'],
      }],
    }),
    'apps/web/src/app/admin/orders/page.tsx': `
      import { PageHead } from './_local/page-head';
      export default function Page() {
        return (
          <div>
            <PageHead title="Orders" />
            <table><thead><tr><th>ID</th></tr></thead></table>
          </div>
        );
      }`,
  });
  const r2 = runGate(failRoot);
  const r2err = r2.err.join('\n');
  assert('FAIL fixture exits 1', r2.code === 1);
  assert('FAIL flags missing DataGrid', r2err.includes('<DataGrid>'));
  assert('FAIL flags missing StatCard', r2err.includes('<StatCard>'));
  assert('FAIL flags locally-imported PageHead', /PageHead>.*NOT imported from a shared/.test(r2err));
  assert('FAIL flags raw <table>', r2err.includes('raw <table>'));
  assert('FAIL flags missing kpi-row section', r2err.includes('"kpi-row"'));
  assert('FAIL flags missing object-page-tabs section', r2err.includes('"object-page-tabs"'));

  // Case SKIP — no fidelity-map.json → gate is a no-op (bare/early project).
  const skipRoot = join(tmp, 'skip');
  writeFixture(skipRoot, { 'apps/web/src/app/admin/x/page.tsx': 'export default function P(){return null;}' });
  const r3 = runGate(skipRoot);
  assert('SKIP fixture exits 0', r3.code === 0);
  assert('SKIP fixture reports skipped', r3.out.join('\n').includes('skipped'));

  // Case ROUTE-SCOPE — a list route MUST NOT inherit its child [id] object
  // page's raw <table>; the list itself is a clean DataGrid grid.
  const scopeRoot = join(tmp, 'scope');
  writeFixture(scopeRoot, {
    'scripts/fidelity-map.json': JSON.stringify({
      routes: [{
        route: '/admin/things',
        requiredComponents: ['DataGrid'],
        requiredSections: ['grid'],
      }],
    }),
    'apps/web/src/app/admin/things/page.tsx': `
      import { DataGrid } from '@/components/ui/data-grid';
      export default function Page() { return <DataGrid<Row> rows={[]} columns={[]} />; }`,
    // child route segment — owns its own page.tsx and a raw <table>; must be
    // excluded from the list route's source.
    'apps/web/src/app/admin/things/[id]/page.tsx': `
      export default function Detail() { return <table className="tbl"><tbody /></table>; }`,
  });
  const r4 = runGate(scopeRoot);
  assert('ROUTE-SCOPE list route exits 0 (child [id] table not inherited)', r4.code === 0);
  assert('ROUTE-SCOPE reports 1 screen checked', r4.out.join('\n').includes('1 mapped screen'));

  // Guard against false-positive floods: the PASS fixture must produce ZERO
  // failure lines (a gate that fails a correct screen is worse than useless).
  assert('PASS fixture emits no failure lines', !r1.err.join('\n').includes('✗'));

  rmSync(tmp, { recursive: true, force: true });

  console.log(`\n[prototype-fidelity selftest] ${pass} passed, ${fail} failed`);
  return fail === 0 ? 0 : 1;
}

// --------------------------------------------------------------------------
const isSelftest = process.argv.includes('--selftest');
if (isSelftest) {
  process.exit(selftest());
} else {
  const ROOT = gateRoot(SCRIPT_DIR);
  const { code, out, err } = runGate(ROOT);
  for (const l of out) console.log(l);
  for (const l of err) console.error(l);
  process.exit(code);
}
