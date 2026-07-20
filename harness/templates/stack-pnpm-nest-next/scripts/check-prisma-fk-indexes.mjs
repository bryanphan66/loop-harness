#!/usr/bin/env node
/**
 * Prisma schema index lint: every relation scalar (FK) column must be the
 * LEADING column of some @@index/@@unique (or itself @unique/@id), or the
 * check fails -- Postgres does not auto-index FK columns, and an unindexed FK
 * makes both the child-side filter and the parent-side cascade/delete a
 * sequential scan. Wired into the root `validate` script so future schema
 * phases keep the discipline.
 *
 * Modes:
 *   node scripts/check-prisma-fk-indexes.mjs           # lint (exit 1 on gaps)
 *   node scripts/check-prisma-fk-indexes.mjs --fix     # append missing @@index lines
 *   node scripts/check-prisma-fk-indexes.mjs --fix --add-filter-indexes
 *     one-time retrofit: also index the common filter/sort columns
 *     (status, created_at) on every model that has them.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../packages/database/prisma/schema.prisma');
const FIX = process.argv.includes('--fix');
const ADD_FILTER_INDEXES = process.argv.includes('--add-filter-indexes');
const FILTER_COLUMNS = ['status', 'created_at'];

// Fail-soft on a project that has no Prisma schema yet (fresh skeleton, or a
// non-Prisma stack) — the harness must stay runnable on a bare project; this
// gate is a Prisma-specific enrichment, not a universal wall.
if (!existsSync(SCHEMA_PATH)) {
  console.log('prisma-fk-index gate: no Prisma schema found — skipped (not a Prisma project yet)');
  process.exit(0);
}

const source = readFileSync(SCHEMA_PATH, 'utf8');
const lines = source.split('\n');

/** @type {{name:string, start:number, end:number, fkCols:string[][], indexed:string[][], scalarUnique:Set<string>, fields:Set<string>}[]} */
const models = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const open = line.match(/^model (\w+) \{/);
  if (open) {
    current = { name: open[1], start: i, end: -1, fkCols: [], indexed: [], scalarUnique: new Set(), fields: new Set() };
    continue;
  }
  if (!current) continue;
  if (line === '}') {
    current.end = i;
    models.push(current);
    current = null;
    continue;
  }
  const field = line.match(/^ {2}(\w+)\s+(\S+)/);
  if (field && !field[1].startsWith('@')) {
    current.fields.add(field[1]);
    if (/@unique\b/.test(line) || /@id\b/.test(line)) current.scalarUnique.add(field[1]);
  }
  const rel = line.match(/@relation\([^)]*fields:\s*\[([^\]]+)\]/);
  if (rel) current.fkCols.push(rel[1].split(',').map((s) => s.trim()));
  const block = line.match(/^\s*@@(?:index|unique)\(\[([^\]]+)\]/);
  if (block) current.indexed.push(block[1].split(',').map((s) => s.trim()));
}

/** cols is covered when it equals the leading prefix of an existing index. */
function covered(model, cols) {
  if (cols.length === 1 && model.scalarUnique.has(cols[0])) return true;
  return model.indexed.some((idx) => cols.length <= idx.length && cols.every((c, k) => idx[k] === c));
}

const missingFk = [];
const missingFilter = [];
for (const model of models) {
  for (const cols of model.fkCols) {
    if (!covered(model, cols)) {
      missingFk.push({ model, cols });
      model.indexed.push(cols); // avoid duplicate suggestions within one model
    }
  }
  if (ADD_FILTER_INDEXES) {
    for (const col of FILTER_COLUMNS) {
      if (model.fields.has(col) && !covered(model, [col])) {
        missingFilter.push({ model, cols: [col] });
        model.indexed.push([col]);
      }
    }
  }
}

const missing = [...missingFk, ...missingFilter];

if (!FIX) {
  if (missingFk.length === 0) {
    console.log(`prisma-fk-index lint OK: ${models.length} models, every relation scalar column is indexed`);
    process.exit(0);
  }
  console.error(`prisma-fk-index lint FAILED: ${missingFk.length} relation scalar column(s) lack an index:`);
  for (const { model, cols } of missingFk) console.error(`  ${model.name}: @@index([${cols.join(', ')}]) missing`);
  console.error('Add the @@index lines (or run: node scripts/check-prisma-fk-indexes.mjs --fix), then create a migration.');
  process.exit(1);
}

// --fix: append the missing @@index lines just before each model's closing brace.
const insertions = new Map(); // end-line index -> lines to insert
for (const { model, cols } of missing) {
  const list = insertions.get(model.end) ?? [];
  list.push(`  @@index([${cols.join(', ')}])`);
  insertions.set(model.end, list);
}
const output = [];
for (let i = 0; i < lines.length; i++) {
  if (insertions.has(i)) {
    if (output[output.length - 1]?.trim() !== '') output.push('');
    output.push(...insertions.get(i));
  }
  output.push(lines[i]);
}
writeFileSync(SCHEMA_PATH, output.join('\n'));
console.log(`added ${missing.length} @@index lines (${missingFk.length} FK, ${missingFilter.length} filter/sort) across ${new Set(missing.map((m) => m.model.name)).size} models`);
