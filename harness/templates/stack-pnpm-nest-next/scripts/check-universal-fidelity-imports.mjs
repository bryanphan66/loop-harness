#!/usr/bin/env node
/**
 * Universal-fidelity gate: every apps/web/e2e-ui/*-fidelity.spec.ts MUST
 * import the shared checklist fixture (_universal.fidelity.ts) -- that is how
 * a new screen inherits the U1-U4 + i18n + responsive + a11y + data-state
 * invariants by construction. A fidelity spec that skips the import fails
 * `validate` outright.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E_UI_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/e2e-ui');
const IMPORT_MARKER = /from ['"]\.\/_universal\.fidelity['"]/;

const specs = readdirSync(E2E_UI_DIR).filter((f) => f.endsWith('-fidelity.spec.ts'));
const offenders = specs.filter((f) => !IMPORT_MARKER.test(readFileSync(join(E2E_UI_DIR, f), 'utf8')));

if (offenders.length > 0) {
  console.error('universal-fidelity gate FAILED — these fidelity specs do not import ./_universal.fidelity:');
  for (const f of offenders) console.error(`  apps/web/e2e-ui/${f}`);
  console.error('Import the shared helpers (expectAppShell, expectA11yFloor, …) and call them for the screen.');
  process.exit(1);
}
console.log(`universal-fidelity gate OK: ${specs.length} fidelity spec(s) all import _universal.fidelity`);
