#!/usr/bin/env node
/**
 * REQ-ID-anchored issue scaffold — the honest replacement for the register->issue
 * "sync script" that never existed. It does NOT pretend to author an issue by
 * itself (AC come from SRS prose — an LLM job). It does the DETERMINISTIC part:
 *
 *   given a REQ-ID → gather { scope from register, detail excerpt from SRS,
 *   prototype/phase ref } → emit a scaffold with a traceable `## Liên kết` block.
 *
 * The agent then writes the Given-When-Then AC FROM the SRS excerpt the scaffold
 * pulled in — it cannot invent a REQ-ID (this refuses one absent from the SRS)
 * and its AC are grounded in the excerpt shown, with Links proving each source.
 * That is the script/agent boundary, stated plainly (the thing the old doc lied
 * about).
 *
 *   node scripts/req-issue-scaffold.mjs --reqid MD.CUST.01        # scaffold one
 *   node scripts/req-issue-scaffold.mjs --reqid MD.CUST.01 --json # machine form
 *   node scripts/req-issue-scaffold.mjs --check MD.CUST.01        # exists in SRS? (anti-fabrication gate)
 *   node scripts/req-issue-scaffold.mjs --selftest
 *
 * Config (gate-config.json → rtm.* reused): srsDir, registerJson.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, walk, readSafe, resolveRegisterJson } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT).rtm ?? {};
const SRS_DIR = resolve(ROOT, cfg.srsDir ?? 'docs/requirements/srs');
const REGISTER = resolveRegisterJson(ROOT, cfg);
const REQ_ID_G = /\b[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+\b/g;

const args = process.argv.slice(2);
const argOf = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

// ---- find the REQ-ID in the SRS, return the enclosing markdown section --------
function srsExcerpt(id) {
  const hits = [];
  walk(SRS_DIR, (p) => p.endsWith('.md')).forEach((p) => {
    const text = readSafe(p);
    if (!text.includes(id)) return;
    // split into heading-delimited sections; keep those mentioning the id
    const lines = text.split('\n');
    let secStart = 0;
    const sections = [];
    lines.forEach((ln, i) => { if (/^#{1,6}\s/.test(ln)) { sections.push([secStart, i]); secStart = i; } });
    sections.push([secStart, lines.length]);
    for (const [a, b] of sections) {
      const block = lines.slice(a, b).join('\n');
      if (block.includes(id)) hits.push({ file: relative(ROOT, p), excerpt: block.trim().slice(0, 1200) });
    }
  });
  return hits;
}

// ---- find the register row (scope) whose reqids match the id ------------------
function registerRow(id) {
  if (!existsSync(REGISTER)) return null;
  let data; try { data = JSON.parse(readFileSync(REGISTER, 'utf8')); } catch { return null; }
  let found = null;
  (function walkO(o, phase, section) {
    if (found) return;
    if (Array.isArray(o)) return o.forEach((x) => walkO(x, phase, section));
    if (o && typeof o === 'object') {
      const ph = o.phase ?? phase, sec = o.section ?? section;
      if (Array.isArray(o.reqids) && o.reqids.some((r) => {
        const s = String(r);
        if (s === id) return true;
        const stem = s.replace(/\.\*+$/, '').replace(/\.\d+(-\d+)?$/, '').replace(/\*/g, '');
        return id.startsWith(stem);
      })) { found = { feature: o.feature, phase: ph, section: sec, scope_in: o.scope_in, scope_out: o.scope_out, goal: o.goal }; return; }
      Object.values(o).forEach((v) => walkO(v, ph, sec));
    }
  })(data, null, null);
  return found;
}

function moduleOf(section) {
  // coarse: use the section name as the module hint (owner rule in github-issue-standard)
  return (section || '').replace(/^[^A-Za-zÀ-ỹ]*/, '').trim() || '(chưa rõ Module)';
}

// ---- retired-REQ guard: "appears in SRS" is not enough — a REQ-ID can still be
// RETIRED (e.g. `REVISED (CR-032): MD.PROD.01/02 are retired`). Anti-fab must refuse
// scaffolding a killed requirement, else the agent re-mints a dead feature.
const RETIRE_RE = /\b(retired|deprecated|removed from scope|no longer (in )?scope|withdrawn)\b|khai tử|(đã )?bỏ khỏi scope/i;
function lineRetires(id, ln) {
  return new RegExp(id.replace(/[.]/g, '\\.') + '(?!\\d)').test(ln) && RETIRE_RE.test(ln);
}
function retirementNote(id) {
  for (const p of walk(SRS_DIR, (x) => x.endsWith('.md'))) {
    const text = readSafe(p);
    if (!text.includes(id)) continue;
    for (const ln of text.split('\n')) if (lineRetires(id, ln)) return { file: relative(ROOT, p), line: ln.trim().slice(0, 160) };
  }
  return null;
}

if (args.includes('--selftest')) {
  const okFns = typeof srsExcerpt === 'function' && typeof registerRow === 'function';
  const okRetire =
    lineRetires('MD.PROD.01', '**REVISED 2026-08-20 (CR-032): MD.PROD.01/02 are retired**') &&
    !lineRetires('MD.PROD.01', 'MD.PROD.01 — SYS shall create a product') &&
    !lineRetires('MD.PROD.01', 'MD.PROD.011 is retired');   // no false match on .011
  const ok = okFns && okRetire;
  console.log(ok ? '✓ [scaffold-selftest] fns + retired-guard OK' : '✗ FAILED');
  process.exit(ok ? 0 : 1);
}

// ---- anti-fabrication gate: does the REQ-ID exist in the SRS? -----------------
const checkId = argOf('--check');
if (checkId) {
  const hits = srsExcerpt(checkId);
  if (!hits.length) { console.error(`✗ [scaffold] REQ-ID '${checkId}' KHÔNG có trong SRS (${relative(ROOT, SRS_DIR)}) — không được tạo issue với mã này (chống bịa)`); process.exit(1); }
  const ret = retirementNote(checkId);
  if (ret) { console.error(`✗ [scaffold] REQ-ID '${checkId}' đã RETIRED (${ret.file}: "${ret.line}") — không tạo issue cho mã đã khai tử (chống bịa)`); process.exit(1); }
  console.log(`✓ [scaffold] '${checkId}' có trong SRS: ${hits.map((h) => h.file).join(', ')}`);
  process.exit(0);
}

const id = argOf('--reqid');
if (!id) { console.error('dùng: --reqid <REQ-ID> | --check <REQ-ID> | --selftest'); process.exit(2); }
if (!existsSync(SRS_DIR)) { console.error(`✗ không thấy SRS dir ${relative(ROOT, SRS_DIR)}`); process.exit(1); }

const excerpts = srsExcerpt(id);
if (!excerpts.length) { console.error(`✗ REQ-ID '${id}' KHÔNG có trong SRS — chống bịa, dừng.`); process.exit(1); }
const retired = retirementNote(id);
if (retired) { console.error(`✗ REQ-ID '${id}' đã RETIRED (${retired.file}: "${retired.line}") — không scaffold mã đã khai tử.`); process.exit(1); }
const row = registerRow(id);

const scaffold = {
  reqid: id,
  title_hint: row?.feature ? `[${id}] ${row.feature}` : `[${id}] (điền tên tính năng)`,
  module: moduleOf(row?.section),
  phase: row?.phase ?? '(chưa gán phase trong register)',
  scope_in: row?.scope_in ?? null,
  scope_out: row?.scope_out ?? null,
  goal_hint: row?.goal ?? null,
  srs_excerpts: excerpts,            // agent viết AC TỪ ĐÂY (bám SRS)
  links: [
    ...excerpts.map((h) => `SRS: ${h.file} (${id})`),
    row ? `Scope: ${relative(ROOT, REGISTER)} (${row.feature ?? id})` : `Scope: (REQ-ID '${id}' CHƯA có dòng register — cân nhắc bổ sung scope)`,
    `Prototype: tra màn theo ${id} (freeze theo phase ${row?.phase ?? '?'})`,
  ],
  agent_todo: 'Viết AC Given-When-Then TỪ srs_excerpts ở trên (không thêm ngoài SRS). Điền title/module/scope vào issue.json rồi chạy new-issue.mjs --create. Mục "## Liên kết" copy nguyên `links`.',
};

if (args.includes('--json')) { console.log(JSON.stringify(scaffold, null, 2)); process.exit(0); }

console.log(`# Scaffold issue cho ${id}\n`);
console.log(`**Title (gợi ý):** ${scaffold.title_hint}`);
console.log(`**Module:** ${scaffold.module}  |  **Phase:** ${scaffold.phase}`);
if (!row) console.log(`\n⚠ REQ-ID này KHÔNG có dòng register — SRS có, scope chưa có. Cân nhắc bổ sung register.`);
console.log(`\n## Trích SRS (viết AC từ đây, bám sát, không thêm)`);
excerpts.forEach((h) => console.log(`\n--- ${h.file} ---\n${h.excerpt}`));
console.log(`\n## Liên kết (copy vào issue)`);
scaffold.links.forEach((l) => console.log(`- ${l}`));
console.log(`\n> ${scaffold.agent_todo}`);
