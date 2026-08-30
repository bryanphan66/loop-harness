#!/usr/bin/env node
/**
 * Object-level-authz test-PRESENCE gate (Leg-16 / IDOR, made mechanical).
 *
 * A structural lint CANNOT prove object ownership is enforced — "does this query
 * filter by the principal's org/owner" is semantic and would false-positive
 * across every legitimate write. So this gate enforces the CONVENTION instead:
 * every controller that exposes an id-addressed route (`@Get(':id')`,
 * `@Patch(':id')`, … — a row addressed by a client-supplied id/slug/token) and
 * is not fully public MUST have a negative-authz test. The behavioural check
 * (foreign-owner id → 403/404, no PII leak) stays with the verifier agent; this
 * gate closes the hole where that check was silently skipped because no test
 * existed to run.
 *
 * A controller is COVERED when some `*authz*.spec.ts` / `*.authz.spec.ts`
 * anywhere in the repo references the controller's base route (`@Controller('x')`
 * → 'x') or its filename resource slug.
 *
 * Exemptions: a controller whose class is `@Public()` (or whose id-addressed
 * methods are ALL `@Public()`) needs no ownership test; and any resource slug /
 * controller file listed in gate-config.json → authzTest.allowlist.
 *
 *   node scripts/check-authz-test-present.mjs
 */
import { resolve, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, walk, readSafe } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT).authzTest ?? {};
const ALLOWLIST = Array.isArray(cfg.allowlist) ? cfg.allowlist : [];

const API_SRC = resolve(ROOT, 'apps/api/src');

// Fail-soft: no API controllers yet (bare skeleton / non-Nest stack).
const controllers = walk(API_SRC, (n) => n.endsWith('.controller.ts'));
if (controllers.length === 0) {
  console.log('✓ [authz-test] no API controllers yet — skipped');
  process.exit(0);
}

// authz specs (repo-wide): any *authz*.spec.ts / *authz*.e2e-spec.ts
const authzSpecs = walk(ROOT, (n) => /authz.*(?:\.spec|-spec)\.ts$/.test(n)).map(readSafe);

// id-addressed method decorator: @Get(':id'), @Patch('x/:id'), @Delete(':slug') …
const ID_ROUTE = /@(?:Get|Post|Patch|Put|Delete)\s*\(\s*[`'"][^`'"]*:[A-Za-z_]/;
const PUBLIC = /@Public\s*\(/;

/** resource slug from @Controller('users') or the filename (users.controller.ts) */
function resourceSlug(file, src) {
  const m = src.match(/@Controller\s*\(\s*[`'"]([^`'"]*)[`'"]/);
  if (m && m[1]) return m[1].split('/').filter(Boolean).pop() ?? m[1];
  return basename(file).replace(/\.controller\.ts$/, '');
}

function isAllowlisted(file, slug) {
  const rel = relative(ROOT, file);
  return ALLOWLIST.some((e) => e === slug || e === rel || e === basename(file));
}

const uncovered = [];
for (const file of controllers) {
  const src = readSafe(file);
  const lines = src.split('\n');

  // collect id-addressed route method blocks; skip a controller with none
  const idRouteLines = lines.filter((l) => ID_ROUTE.test(l));
  if (idRouteLines.length === 0) continue;

  // fully-public controller → no ownership boundary to test. The class
  // decorators sit just above `export class X` — a @Public() among them makes
  // the whole controller public.
  const classIdx = lines.findIndex((l) => /export\s+class\s+\w+/.test(l));
  const classDecorators = classIdx >= 0 ? lines.slice(Math.max(0, classIdx - 6), classIdx) : [];
  const classPublic = classDecorators.some((l) => PUBLIC.test(l));
  if (classPublic) continue;
  // or every id-addressed method individually @Public (decorator on the line above)
  const allMethodsPublic = idRouteLines.every((l) => {
    const idx = lines.indexOf(l);
    return lines.slice(Math.max(0, idx - 3), idx).some((p) => PUBLIC.test(p));
  });
  if (allMethodsPublic) continue;

  const slug = resourceSlug(file, src);
  if (isAllowlisted(file, slug)) continue;

  const token = slug.toLowerCase();
  const covered = authzSpecs.some((body) => body.toLowerCase().includes(token));
  if (!covered) uncovered.push({ file: relative(ROOT, file), slug });
}

if (uncovered.length) {
  console.error(`\n✗ [authz-test] ${uncovered.length} controller(s) expose an id-addressed route with NO negative-authz test (object-level IDOR is unproven):\n`);
  for (const u of uncovered) {
    console.error(`  ${u.file}`);
    console.error(`     -> add a ${u.slug}-authz.spec.ts: owner-A creates, non-owner-B requests A's id → expect 403/404 (no PII/QR/token leak)`);
  }
  console.error(`\n  A genuinely public resource marks the route @Public(); a real exception goes in`);
  console.error(`  scripts/gate-config.json → authzTest.allowlist.\n`);
  process.exit(1);
}

console.log(`✓ [authz-test] every id-addressed controller has a negative-authz spec`);
