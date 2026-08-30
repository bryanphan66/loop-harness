#!/usr/bin/env node
/**
 * New-screen fidelity-REQUIRED gate (closes the hole a field run exposed).
 *
 * `check-universal-fidelity-imports.mjs` only forces a fidelity spec that
 * ALREADY EXISTS to import the shared fixture — it does NOT force a NEW admin
 * screen to have a fidelity spec at all. So a freshly built admin screen with
 * NO `*-fidelity.spec.ts` sailed through `validate` GREEN, skipping the whole
 * U1-U4 + i18n + responsive + a11y + data-state floor. This gate closes that:
 * every admin route (apps/web/src/app/admin/.../page.tsx) MUST have a fidelity
 * spec covering it, or `validate` fails and names the uncovered route.
 *
 * A route is COVERED when some apps/web/e2e-ui/<name>-fidelity.spec.ts either
 *   (a) shares the route's leaf path segment in its filename slug, OR
 *   (b) navigates to the route's static path (the path string appears in the
 *       spec body — a `page.goto('/admin/…')`).
 * The union of the two signals is deliberately permissive: it errs toward NOT
 * failing a route that plainly has a spec, so this gate blocks the real hole
 * (a screen with zero fidelity coverage) without flaky false positives.
 *
 * Exemptions (no screen to assert):
 *   - a redirect-only page (short file that just calls `redirect('/…')`)
 *   - any route listed in gate-config.json → fidelityRequired.allowlist
 *     (canvas/redirect/programmatic routes), matched as an exact route path or
 *     a prefix ending in '/*'.
 *
 *   node scripts/check-new-screen-fidelity-required.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, walk, readSafe } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT).fidelityRequired ?? {};
const ALLOWLIST = Array.isArray(cfg.allowlist) ? cfg.allowlist : [];

const APP_DIR = resolve(ROOT, 'apps/web/src/app');
const ADMIN_DIR = resolve(APP_DIR, 'admin');
const E2E_UI_DIR = resolve(ROOT, 'apps/web/e2e-ui');

// Fail-soft on a project that has not built any admin screens yet (bare
// skeleton) — the gate is an enrichment that bites once admin routes exist.
const pages = walk(ADMIN_DIR, (n) => n === 'page.tsx');
if (pages.length === 0) {
  console.log('✓ [new-screen-fidelity] no admin screens yet — skipped');
  process.exit(0);
}

const specs = walk(E2E_UI_DIR, (n) => n.endsWith('-fidelity.spec.ts')).map((p) => ({
  slug: p.split('/').pop().replace(/-fidelity\.spec\.ts$/, ''),
  body: readSafe(p),
}));

/** app-relative route path for a page.tsx, e.g. /admin/courses/[id] */
function routePath(pageFile) {
  const rel = relative(APP_DIR, pageFile).replace(/\/page\.tsx$/, '');
  const segs = rel.split('/').filter((s) => !/^\(.*\)$/.test(s)); // drop route groups
  return '/' + segs.join('/');
}

/** static segments only (drop dynamic [..] + route groups) */
function staticSegments(route) {
  return route.split('/').filter((s) => s && !/^\[.*\]$/.test(s) && !/^\(.*\)$/.test(s));
}

function isRedirectOnly(pageFile) {
  const body = readSafe(pageFile);
  return body.split('\n').length < 40 && /\bredirect\s*\(\s*['"`]/.test(body);
}

function isAllowlisted(route) {
  return ALLOWLIST.some((entry) => {
    if (entry.endsWith('/*')) return route === entry.slice(0, -2) || route.startsWith(entry.slice(0, -1));
    return route === entry;
  });
}

function isCovered(route) {
  const segs = staticSegments(route);
  const leaf = segs[segs.length - 1] ?? '';
  const staticPath = '/' + segs.join('/');
  return specs.some((s) => {
    // (a) filename slug shares the route's leaf segment
    if (leaf && s.slug.split('-').includes(leaf)) return true;
    // (b) spec body navigates to the route's static path
    if (staticPath.length > 1 && s.body.includes(staticPath)) return true;
    return false;
  });
}

const uncovered = [];
for (const pageFile of pages) {
  const route = routePath(pageFile);
  if (isAllowlisted(route)) continue;
  if (isRedirectOnly(pageFile)) continue;
  if (!isCovered(route)) uncovered.push({ route, file: relative(ROOT, pageFile) });
}

if (uncovered.length) {
  console.error(`\n✗ [new-screen-fidelity] ${uncovered.length} admin screen(s) have NO fidelity spec — a new screen must ship its U1-U4 + i18n + responsive + a11y floor, not skip it:\n`);
  for (const u of uncovered) {
    const suggest = staticSegments(u.route).slice(1).join('-') || 'admin';
    console.error(`  ${u.route}   (${u.file})`);
    console.error(`     -> add apps/web/e2e-ui/${suggest}-fidelity.spec.ts (import ./_universal.fidelity, goto('${'/' + staticSegments(u.route).join('/')}'))`);
  }
  console.error(`\n  A genuine exception (canvas/redirect/programmatic route) can be listed in`);
  console.error(`  scripts/gate-config.json → fidelityRequired.allowlist.\n`);
  process.exit(1);
}

console.log(`✓ [new-screen-fidelity] ${pages.length} admin screen(s) — each has a fidelity spec`);
