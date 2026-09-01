#!/usr/bin/env node
/**
 * Money-mutation concurrency test-PRESENCE gate (Leg-20, made mechanical).
 *
 * Proving a write-path is race-free (TOCTOU / check-then-act atomic) is
 * semantic — a static lint that flags every `count()→create()` would drown a
 * real project in false positives. So this gate enforces the CONVENTION: any
 * Prisma model that holds money (a BigInt column named amount/price/total/…)
 * MUST have a concurrency test naming it. The verifier still drives the actual
 * `Promise.all([submit, submit])` race and asserts exactly one effect; this gate
 * closes the hole where that test was never written and the race went unproven.
 *
 * A money model is COVERED when some `*-concurrency.spec.ts` / `*.concurrency.spec.ts`
 * references the model name (case-insensitive whole word) or its @@map table name.
 *
 * Config (gate-config.json → moneyConcurrency):
 *   - moneyColumns: extra column-name substrings to treat as money (defaults
 *     amount/price/total/balance/vnd/fee/cost/paid/refund/payout)
 *   - allowlist: model names exempt (e.g. an append-only ledger already covered)
 * No Prisma schema, or no money models → skipped.
 *
 *   node scripts/check-money-concurrency-test-present.mjs
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, walk, readSafe } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT).moneyConcurrency ?? {};
const EXTRA_COLS = Array.isArray(cfg.moneyColumns) ? cfg.moneyColumns.map((s) => String(s).toLowerCase()) : [];
const ALLOWLIST = new Set((Array.isArray(cfg.allowlist) ? cfg.allowlist : []).map(String));

// Prisma schema lives at packages/database (multi-package layout) OR apps/api
// (skeleton layout) depending on the project; check both, config can override.
const SCHEMA_CANDIDATES = [
  cfg.schemaPath,
  'packages/database/prisma/schema.prisma',
  'apps/api/prisma/schema.prisma',
].filter(Boolean).map((p) => resolve(ROOT, p));
const SCHEMA = SCHEMA_CANDIDATES.find((p) => existsSync(p));
if (!SCHEMA) {
  console.log('✓ [money-concurrency] no Prisma schema — skipped');
  process.exit(0);
}

const MONEY_NAME = new RegExp(`(?:${['amount', 'price', 'total', 'balance', 'vnd', 'fee', 'cost', 'paid', 'refund', 'payout', ...EXTRA_COLS].join('|')})`, 'i');

// --- find money models (a BigInt column whose name reads as money) --------------
const lines = readSafe(SCHEMA).split('\n');
const moneyModels = []; // { name, table }
let current = null;
for (const line of lines) {
  const open = line.match(/^model\s+(\w+)\s*\{/);
  if (open) {
    current = { name: open[1], table: null, isMoney: false };
    continue;
  }
  if (!current) continue;
  if (line.trim() === '}') {
    if (current.isMoney) moneyModels.push(current);
    current = null;
    continue;
  }
  const map = line.match(/@@map\s*\(\s*[`'"]([^`'"]+)[`'"]/);
  if (map) current.table = map[1];
  const field = line.match(/^\s+(\w+)\s+(\w+)/);
  if (field && field[2] === 'BigInt' && MONEY_NAME.test(field[1])) current.isMoney = true;
}

if (moneyModels.length === 0) {
  console.log('✓ [money-concurrency] no money models (no BigInt money column) — skipped');
  process.exit(0);
}

// --- concurrency specs ---------------------------------------------------------
const specs = walk(ROOT, (n) => /concurrency.*(?:\.spec|-spec)\.ts$/.test(n)).map((p) => readSafe(p).toLowerCase());

function isCovered(model) {
  const name = model.name.toLowerCase();
  const table = (model.table ?? '').toLowerCase();
  const nameWord = new RegExp(`\\b${name}\\b`);
  return specs.some((body) => nameWord.test(body) || (table && body.includes(table)));
}

const uncovered = moneyModels.filter((m) => !ALLOWLIST.has(m.name) && !isCovered(m));

if (uncovered.length) {
  console.error(`\n✗ [money-concurrency] ${uncovered.length} money model(s) have NO concurrency test — a money write-path race (double-charge / oversell) is unproven:\n`);
  for (const m of uncovered) {
    const slug = m.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    console.error(`  model ${m.name}${m.table ? ` (@@map ${m.table})` : ''}`);
    console.error(`     -> add a ${slug}-concurrency.spec.ts: fire the mutation twice via Promise.all → expect exactly ONE row/charge`);
  }
  console.error(`\n  Back the invariant with a DB unique/partial-index or a locking tx. A model`);
  console.error(`  already covered elsewhere can be listed in scripts/gate-config.json → moneyConcurrency.allowlist.\n`);
  process.exit(1);
}

console.log(`✓ [money-concurrency] ${moneyModels.length} money model(s) — each has a concurrency spec`);
