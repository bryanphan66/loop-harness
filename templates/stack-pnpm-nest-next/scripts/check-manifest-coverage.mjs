#!/usr/bin/env node
/**
 * Manifest-coverage gate (closes G4 — makes REQ-ID ⟷ phase coverage MECHANICAL).
 *
 * The build-manifest's own "Coverage checklist" says every in-scope REQ-ID must
 * appear in exactly one phase, but nothing CHECKED it — a field run built a
 * feature twice because no driver flagged that its REQ-ID was already covered.
 * This gate parses the frozen scope baseline (feature-register) against the
 * build-manifest phase blocks and fails when:
 *   - an in-scope REQ-ID (disposition `in-MVP`) is covered by ZERO phases, or
 *   - the SAME REQ-ID is covered by MORE THAN ONE phase (duplicate build risk), or
 *   - no P0 phase is defined.
 * A REQ-ID a manifest phase covers that is NOT in-scope in the register is a
 * WARNING (platform/infra reqs at P0 legitimately are not register lines), not
 * a failure — the gate enforces the forward direction (every in-scope req is
 * built once) without false-failing on infra.
 *
 * Paths come from gate-config.json → manifestCoverage.{featureRegister,buildManifest}
 * (defaults docs/scope-baseline/feature-register.md + docs/build-manifest.md).
 * Missing either file → skipped (not a manifest-driven project yet).
 *
 *   node scripts/check-manifest-coverage.mjs
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, readSafe } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT).manifestCoverage ?? {};
const REGISTER = resolve(ROOT, cfg.featureRegister ?? 'docs/scope-baseline/feature-register.md');
const MANIFEST = resolve(ROOT, cfg.buildManifest ?? 'docs/build-manifest.md');

// REQ-ID grammar: MODULE.AREA.NN (e.g. IF.AUTH.01, ORD.STATUS.02, NFR.PERF.08)
const REQ_ID = /\b[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+\b/g;

if (!existsSync(REGISTER) || !existsSync(MANIFEST)) {
  console.log('✓ [manifest-coverage] no feature-register + build-manifest yet — skipped');
  process.exit(0);
}

// --- parse in-scope REQ-IDs from the feature register --------------------------
// A register row is in-scope when it carries a REQ-ID AND the `in-MVP`
// disposition token (defer / out / needs-consult are excluded from THIS build).
const inScope = new Set();
for (const line of readSafe(REGISTER).split('\n')) {
  if (!line.trim().startsWith('|')) continue;
  if (!/\bin-MVP\b/.test(line)) continue;
  const ids = line.match(REQ_ID);
  if (ids) ids.forEach((id) => inScope.add(id));
}

// --- parse REQ-ID -> phases from the build-manifest phase blocks ----------------
const reqToPhases = new Map(); // REQ-ID -> Set(phaseId)
let p0Defined = false;
let currentPhase = null;
for (const line of readSafe(MANIFEST).split('\n')) {
  const head = line.match(/^#{2,4}\s+(P\d+)\b/);
  if (head) {
    currentPhase = head[1];
    if (currentPhase === 'P0') p0Defined = true;
    continue;
  }
  // phase REQ lines: "- **REQ-IDs covered:** `X`, `Y`" (and P0's "**REQ-IDs:**")
  if (/\*\*REQ-IDs?(?:\s+covered)?:\*\*/.test(line) && currentPhase) {
    const ids = line.match(REQ_ID);
    if (ids) {
      for (const id of ids) {
        if (!reqToPhases.has(id)) reqToPhases.set(id, new Set());
        reqToPhases.get(id).add(currentPhase);
      }
    }
  }
}

// --- evaluate ------------------------------------------------------------------
const errors = [];
if (!p0Defined) errors.push('no P0 phase (walking skeleton) is defined in the build-manifest');

const missing = [];
const duplicated = [];
for (const req of inScope) {
  const phases = reqToPhases.get(req);
  if (!phases || phases.size === 0) missing.push(req);
  else if (phases.size > 1) duplicated.push({ req, phases: [...phases].sort() });
}
if (missing.length) errors.push(`${missing.length} in-scope REQ-ID(s) covered by NO phase: ${missing.sort().join(', ')}`);
for (const d of duplicated) errors.push(`REQ-ID ${d.req} covered by MULTIPLE phases (duplicate-build risk): ${d.phases.join(', ')}`);

// forward-only: a phase covering a non-in-scope REQ is a warning, not a fail
const orphanPhaseReqs = [...reqToPhases.keys()].filter((r) => !inScope.has(r));
if (orphanPhaseReqs.length) {
  console.warn(`⚠ [manifest-coverage] ${orphanPhaseReqs.length} REQ-ID(s) in a phase but not in-MVP in the register (ok for P0/infra; check if scope drifted): ${orphanPhaseReqs.sort().join(', ')}`);
}

if (errors.length) {
  console.error(`\n✗ [manifest-coverage] scope baseline ⟷ build-manifest mismatch (${inScope.size} in-scope REQ-IDs):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error(`\n  Every in-MVP REQ-ID must be built in exactly one phase. Add the missing`);
  console.error(`  REQ-ID to a phase block's "REQ-IDs covered:" line, or split the duplicate.\n`);
  process.exit(1);
}

console.log(`✓ [manifest-coverage] ${inScope.size} in-scope REQ-ID(s) each covered by exactly one phase; P0 defined`);
