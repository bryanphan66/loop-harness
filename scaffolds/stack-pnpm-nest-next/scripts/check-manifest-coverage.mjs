#!/usr/bin/env node
/**
 * Manifest-coverage gate (closes G4 — makes REQ-ID ⟷ phase coverage MECHANICAL).
 *
 * The build-manifest's own "Coverage checklist" says every in-scope REQ-ID must
 * appear in exactly one phase, but nothing CHECKED it — a field run built a
 * feature twice because no driver flagged that its REQ-ID was already covered.
 * This gate parses the frozen scope baseline (feature-register) against the
 * build-manifest phase blocks and fails when:
 *   - an in-scope REQ-ID (disposition `in-MVP`, or any token in
 *     `manifestCoverage.inScopeTokens`) is covered by ZERO phases, or
 *   - the SAME REQ-ID is covered by MORE THAN ONE phase (duplicate build risk), or
 *   - no P0 phase is defined.
 * A REQ-ID a manifest phase covers that is NOT in-scope in the register is a
 * WARNING (platform/infra reqs at P0 legitimately are not register lines), not
 * a failure — the gate enforces the forward direction (every in-scope req is
 * built once) without false-failing on infra.
 *
 * Paths come from gate-config.json → manifestCoverage.{featureRegister,buildManifest}
 * (defaults docs/scope-baseline/feature-register.md + docs/build-manifest.md).
 *
 * FAIL-CLOSED ON A VACUOUS PARSE. The register is a human document and its
 * shape varies: a real project's register was written entirely in Vietnamese,
 * carried no REQ-ID column at all, and used its own disposition wording. This
 * gate found zero in-scope REQ-IDs, compared zero of them against the manifest,
 * found zero mismatches and printed GREEN — a pass that proved nothing, and one
 * that a measurement script then copied into the run's evidence logbook as if it
 * were a real result. Zero parsed rows is now an ERROR: a gate that cannot see
 * its input must say so, never pass.
 *
 * The register may also be JSON (`feature-register-source.json` /
 * `feature-register.source.json` — both spellings exist in the wild, see the
 * same trap in rtm-status.mjs), which is preferred when present: `sections[]
 * .rows[]` carry the in-scope REQ-IDs and a top-level `out_of_scope` block
 * carries the rest.
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
// Prefer a JSON register when one sits beside the markdown: it states scope in
// structure instead of in prose, so no wording convention has to be guessed.
const inScope = new Set();
let registerSource = REGISTER;

const jsonRegister = ['feature-register-source.json', 'feature-register.source.json']
  .map((n) => resolve(dirname(REGISTER), n))
  .find((p) => existsSync(p));

if (jsonRegister) {
  registerSource = jsonRegister;
  const data = JSON.parse(readSafe(jsonRegister));
  const outOfScope = new Set(
    (JSON.stringify(data.out_of_scope ?? []).match(REQ_ID) ?? []),
  );
  for (const id of JSON.stringify(data.sections ?? []).match(REQ_ID) ?? []) {
    if (!outOfScope.has(id)) inScope.add(id);
  }
} else {
  // A markdown register row is in-scope when it carries a REQ-ID AND a
  // disposition token. `in-MVP` is the default; a register written in another
  // language declares its own token in gate-config rather than being rewritten.
  const tokens = cfg.inScopeTokens ?? ['in-MVP'];
  for (const line of readSafe(REGISTER).split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    if (!tokens.some((t) => line.includes(t))) continue;
    const ids = line.match(REQ_ID);
    if (ids) ids.forEach((id) => inScope.add(id));
  }
}

// A register that parses to nothing is a broken parse, not an empty scope.
if (inScope.size === 0) {
  console.error('\n✗ [manifest-coverage] read the register but found ZERO in-scope REQ-IDs — this is a BROKEN PARSE, not a pass.\n');
  console.error(`  register: ${registerSource}`);
  if (!jsonRegister) {
    console.error(`  looked for table rows containing one of: ${(cfg.inScopeTokens ?? ['in-MVP']).join(', ')}`);
    console.error('  and a REQ-ID matching MODULE.AREA.NN on the same row.');
    console.error('\n  Fix one of: point manifestCoverage.featureRegister at the file that really');
    console.error('  carries REQ-IDs, set manifestCoverage.inScopeTokens to this register\'s own');
    console.error('  wording, or add a machine-readable feature-register-source.json beside it.\n');
  } else {
    console.error('  expected REQ-IDs under sections[].rows[]; found none.\n');
  }
  process.exit(1);
}

// --- parse REQ-ID -> phases from the build-manifest phase blocks ----------------
const reqToPhases = new Map(); // REQ-ID -> Set(phaseId)
const claimedFiles = new Map(); // source file -> Set(phaseId)
let p0Defined = false;
let currentPhase = null;
let inReqBlock = null;
let reqBlockText = '';
let phaseOfBlock = null;

/** Pull the REQ-IDs a phase's "REQ-IDs covered" block declares, by either form. */
function absorbReqBlock(text, phase) {
  if (!phase) return;
  const add = (id) => {
    if (!reqToPhases.has(id)) reqToPhases.set(id, new Set());
    reqToPhases.get(id).add(phase);
  };
  for (const id of text.match(REQ_ID) ?? []) add(id);

  // by-source-file form. Only a file the block names as ITS OWN source counts:
  // "all 68 in `assets.md`". A block also mentions other files to say the
  // opposite - "dedup against ids already homed in `assets.md`" - and reading
  // those as claims invented two duplicate phases that did not exist. Cut the
  // text at the first such clause, then take only `in \`<file>\`` forms.
  const own = text.split(/\b(?:dedup|minus|cross-referenc|already homed|see also|see )/i)[0];
  for (const m of own.matchAll(/\bin\s+`([^`]*\/)?([a-z0-9-]+\.md)`/g)) {
    const file = `${m[1] ?? ''}${m[2]}`;
    const abs = resolve(ROOT, file.includes('/') ? file : `docs/requirements/srs/${file}`);
    if (!existsSync(abs)) continue;
    if (!claimedFiles.has(file)) claimedFiles.set(file, new Set());
    claimedFiles.get(file).add(phase);
    // A REQ-ID is DECLARED where it appears bold; a backticked mention is a
    // cross-reference. Same convention the project's own scripts verified.
    for (const d of readSafe(abs).matchAll(/\*\*([A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+)\*\*/g)) {
      add(d[1]);
    }
  }
}
for (const line of readSafe(MANIFEST).split('\n')) {
  const head = line.match(/^#{2,4}\s+(P\d+)\b/);
  if (head) {
    currentPhase = head[1];
    if (currentPhase === 'P0') p0Defined = true;
    continue;
  }
  // phase REQ lines: "- **REQ-IDs covered:** `X`, `Y`" (and P0's "**REQ-IDs:**")
  if (/\*\*REQ-IDs?(?:\s+covered)?:\*\*/.test(line) && currentPhase) {
    inReqBlock = currentPhase;
    phaseOfBlock = currentPhase;
    reqBlockText = line;
    continue;
  }
  // A phase may declare coverage BY SOURCE FILE instead of by enumeration -
  // "all bold-declared REQ-IDs in `docs/requirements/srs/campaign.md`". A real
  // manifest wrote it that way: 401 REQ-IDs across 21 phases is unreadable as a
  // list, and the rule is the thing a reviewer actually checks. The declaration
  // stays the source of truth either way; this gate expands it so the machine
  // sees the same set the reader does. Continuation lines belong to the block.
  if (inReqBlock) {
    if (/^\s*-\s\*\*/.test(line) || /^#{2,4}\s/.test(line)) {
      inReqBlock = null;
    } else {
      reqBlockText += `\n${line}`;
    }
  }
  if (!inReqBlock && reqBlockText) {
    absorbReqBlock(reqBlockText, phaseOfBlock);
    reqBlockText = '';
  }
}

if (reqBlockText) absorbReqBlock(reqBlockText, phaseOfBlock);

// --- evaluate ------------------------------------------------------------------
const errors = [];
if (!p0Defined) errors.push('no P0 phase (walking skeleton) is defined in the build-manifest');
// A source file claimed by two phases is the duplicate-build risk in by-file form.
for (const [file, phases] of claimedFiles) {
  if (phases.size > 1) {
    errors.push(`source file ${file} is claimed by MULTIPLE phases: ${[...phases].sort().join(', ')}`);
  }
}

if (reqToPhases.size === 0) {
  errors.push(
    'the build-manifest exists but no phase block lists a REQ-ID — expected lines shaped ' +
      '"- **REQ-IDs covered:** `X`, `Y`" under a "## P<n>" heading. Nothing was compared.',
  );
}

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
  const shown = orphanPhaseReqs.sort().slice(0, 15);
  const more = orphanPhaseReqs.length - shown.length;
  console.warn(
    `⚠ [manifest-coverage] ${orphanPhaseReqs.length} REQ-ID(s) in a phase but not in-MVP in the register ` +
      `(ok for P0/infra and for business-rule ids; check if scope drifted): ${shown.join(', ')}` +
      (more > 0 ? ` … +${more} more` : ''),
  );
}

if (errors.length) {
  console.error(`\n✗ [manifest-coverage] scope baseline ⟷ build-manifest mismatch (${inScope.size} in-scope REQ-IDs):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error(`\n  Every in-MVP REQ-ID must be built in exactly one phase. Add the missing`);
  console.error(`  REQ-ID to a phase block's "REQ-IDs covered:" line, or split the duplicate.\n`);
  process.exit(1);
}

console.log(
  `✓ [manifest-coverage] ${inScope.size} in-scope REQ-ID(s) (from ${registerSource.replace(`${ROOT}/`, '')}) ` +
    `each covered by exactly one phase; P0 defined`,
);
