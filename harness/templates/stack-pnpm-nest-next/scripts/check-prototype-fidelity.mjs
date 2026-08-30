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
 * This gate does the COMPONENT-PRESENCE half of visual-fidelity Tooth A. The
 * PIXEL/AESTHETIC half (side-by-side glance, exact spacing/theme) stays with the
 * verifier + human — a machine cannot judge "looks like the export", only that
 * the structural building blocks the export implies are present.
 *
 *   node scripts/check-prototype-fidelity.mjs
 *   node scripts/check-prototype-fidelity.mjs --selftest   # fixture pass/fail/skip
 */
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, walk, readSafe } from './gate-lib.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

// Default shared-component import roots. A required component must be imported
// from one of these to count as "reused" (not re-drawn inline). Substring match.
const DEFAULT_SHARED_ROOTS = ['@/components', 'components/ui', 'components/', '~/components', '@components'];

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
  'data-grid': [/<DataGrid[\s/>]/],
  'grid': [/<DataGrid[\s/>]/],
  'table': [/<DataGrid[\s/>]/],
  'filter-bar': [/<FilterBar[\s/>]/, /<Toolbar[\s/>]/],
  'toolbar': [/<Toolbar[\s/>]/, /<FilterBar[\s/>]/],
  'detail-panel': [/<DetailPanel[\s/>]/, /<SidePanel[\s/>]/],
  'empty-state': [/<EmptyState[\s/>]/],
};

/** collect the screen source for a route: its page.tsx + every sibling .tsx in the route dir */
function screenSource(root, pageFile) {
  const dir = dirname(pageFile);
  const tsx = walk(dir, (n) => n.endsWith('.tsx'));
  return tsx.map((p) => readSafe(p)).join('\n/* --- */\n');
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
  return new RegExp('<' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s/>]').test(source);
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

    // forbidPatterns — the ANTI-TRANSCRIPTION backstop. The prototype export is
    // authored in its OWN mock primitives (a raw `<table className="tbl">`, a
    // div-bar chart, an inline `muted fz11` helper, a bare modal). "Adopt the
    // prototype" means MAP each mock primitive to the project's real component
    // (DataGrid, the chart component, InfoTooltip, the shared Dialog) — NOT copy
    // the export's markup verbatim. Any pattern here is a tell-tale that the mock
    // markup was transcribed instead of mapped; it fires even when forbidRawTable
    // was switched off for a legit reason (e.g. an object-page with a preview),
    // because the mock CLASS still must never survive into shipped code. Sources:
    // top-level map.forbidPatterns (applies to every mapped route) + per-route
    // entry.forbidPatterns. Each item is a regex string or {pattern, message}.
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
        continue; // a malformed pattern must not crash the gate
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
// Self-test: build 3 throwaway fixtures (pass / fail / skip) and assert exit
// codes. Runs the SAME runGate() the real check uses.
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

  // Case PASS — courses screen adopts DataGrid + StatCard + PageHead-tabs.
  const passRoot = join(tmp, 'pass');
  writeFixture(passRoot, {
    'scripts/fidelity-map.json': JSON.stringify({
      routes: [{
        route: '/admin/courses',
        prototypeFile: 'docs/visuals/prototype/exports/app-v1/screens-courses.jsx',
        requiredComponents: ['DataGrid', 'StatCard', 'PageHead'],
        requiredSections: ['kpi-row', 'object-page-tabs'],
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
            <DataGrid rows={[]} columns={[]} />
          </>
        );
      }`,
  });
  const r1 = runGate(passRoot);
  assert('PASS fixture exits 0', r1.code === 0);
  assert('PASS fixture reports 1 screen checked', r1.out.join('\n').includes('1 mapped screen'));

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

  // Case FORBID-PATTERN — a mapped route with forbidRawTable:false (a legit
  // object-page preview) must STILL not transcribe the prototype's mock table
  // class; the global forbidPatterns backstop fires even with the table guard off.
  const forbidRoot = join(tmp, 'forbid');
  writeFixture(forbidRoot, {
    'scripts/fidelity-map.json': JSON.stringify({
      forbidPatterns: [{ pattern: 'className="tbl"', message: 'mock table class tbl transcribed' }],
      routes: [{ route: '/admin/crm/customers/[id]', requiredComponents: [], forbidRawTable: false }],
    }),
    'apps/web/src/app/admin/crm/customers/[id]/page.tsx':
      'export default function P(){ return <table className="tbl"><tbody/></table>; }',
  });
  const r5 = runGate(forbidRoot);
  assert('FORBID-PATTERN fires with forbidRawTable:false', r5.code === 1);
  assert('FORBID-PATTERN uses custom message', r5.err.join('\n').includes('mock table class tbl transcribed'));

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
