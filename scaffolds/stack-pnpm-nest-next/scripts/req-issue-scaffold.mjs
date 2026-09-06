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

// ---- find the REQ-ID's OWN DECLARATION in the SRS ---------------------------
/**
 * Bản cũ trả về MỌI mục có nhắc tới mã - kể cả nhắc chéo trong yêu cầu khác - và
 * không bao giờ kiểm xem mã đó có được KHAI BÁO ở đó không. Đo trên dự án thật:
 * 11 trong 14 REQ-ID của một phase nhận về đoạn trích của yêu cầu KHÁC;
 * `IF.JOBS.07` nhận trích từ 8 file và KHÔNG có lấy một câu `shall` của chính nó.
 *
 * Đây là dạng hỏng thứ ba, và nặng nhất trong ba. Xanh giả thì giấu một lỗ hổng,
 * đỏ giả thì làm người ta sửa tài liệu cho vừa công cụ - cả hai đều NHÌN THẤY
 * được. Cái này là NGUỒN GIẢ: agent đọc nguồn trước đúng như được dặn, không
 * chép code, trích dẫn trung thực đoạn được đưa - và vẫn viết ra tiêu chí chấp
 * nhận của một yêu cầu khác. Không luật nào bị vi phạm nên không gì bắt được.
 *
 * Nên: bám vào DÒNG KHAI BÁO `**<MÃ>**` ở đầu dòng, cắt tới khai báo kế tiếp
 * hoặc heading kế tiếp. File chỉ NHẮC mã mà không khai báo thì trả về như tham
 * chiếu chéo, KHÔNG kèm nội dung - đưa nội dung ra là mời người đọc nhầm.
 *
 * Và khi không tìm thấy khai báo: BÁO LỖI TO, đừng trả về đoạn gần đúng. Trả về
 * một thứ nghe hợp lý chính là cái làm lỗi này tàng hình suốt một lượt chạy.
 */
const ANY_DECL = /^\s*(?:[-*+]\s+)?\*\*[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+\*\*/;

function srsExcerpt(id) {
  // SRS khai mã theo HAI kiểu, và chỉ thử một kiểu là chặn sạch file kia:
  //   platform-services.md:  `**IF.JOBS.07** — Every job that...`   (đầu dòng)
  //   nfr.md:                `- **PLF.PAGE.01** (B17) — Every list...` (gạch đầu dòng)
  // Bản đầu neo cứng `^\*\*` nên từ chối TOÀN BỘ 26 mã của một phase, và vì
  // fail-closed nên nó từ chối rất to - đúng hành vi, sai cái neo. Cho phép dấu
  // gạch đầu dòng và khoảng trắng đứng trước.
  const declRe = new RegExp(`^\\s*(?:[-*+]\\s+)?\\*\\*${id.replace(/\./g, '\\.')}\\*\\*`);
  const decl = [];
  const xref = [];
  walk(SRS_DIR, (p) => p.endsWith('.md')).forEach((p) => {
    const text = readSafe(p);
    if (!text.includes(id)) return;
    const lines = text.split('\n');
    const start = lines.findIndex((ln) => declRe.test(ln));
    if (start === -1) {
      xref.push(relative(ROOT, p));
      return;
    }
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      if (ANY_DECL.test(lines[i]) || /^#{1,6}\s/.test(lines[i])) {
        end = i;
        break;
      }
    }
    decl.push({ file: relative(ROOT, p), excerpt: lines.slice(start, end).join('\n').trim() });
  });
  return { decl, xref };
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
      // Khớp CHÍNH XÁC, hoặc khớp qua ký tự đại diện tường minh (`IF.JOBS.*`).
      // Bản cũ cắt hậu tố số rồi `id.startsWith(stem)`, nên IF.JOBS.04/.05/.06/.08
      // đều rơi vào dòng register ĐẦU TIÊN có gốc IF.JOBS và nhận nhầm tên tính
      // năng của nó - 4/7 REQ-ID của một phase thật bị gợi ý sai tên.
      if (Array.isArray(o.reqids) && o.reqids.some((r) => {
        const spec = String(r).trim();
        if (spec === id) return true;
        if (!spec.includes('*')) return false;
        const re = new RegExp(`^${spec.replace(/[.]/g, '\\.').replace(/\*/g, '[A-Z0-9]+')}$`);
        return re.test(id);
      })) { found = { feature: o.feature, phase: ph, section: sec, scope_in: o.scope_in, scope_out: o.scope_out, goal: o.goal }; return; }
      Object.values(o).forEach((v) => walkO(v, ph, sec));
    }
  })(data, null, null);
  return found;
}

/**
 * Tên module dùng cho nhãn `Module: <Tên>`.
 *
 * PHẢI lấy từ bảng M1..MN trong docs/ROADMAP.md - đó là nơi `setup-issue-board.mjs`
 * dựng nhãn thật. Bản cũ lấy tên section của register (tiếng Việt) nên gợi ý
 * `Module: Nền tảng kỹ thuật & Nhà cung cấp AI` trong khi nhãn thật trên repo là
 * `Module: AI provider platform` - gắn vào là gh báo không có nhãn đó.
 *
 * Hai danh sách khác nhau thì phải chọn MỘT làm nguồn cho nhãn, không được mỗi
 * script đọc một nơi.
 */
function moduleOf(section, phase) {
  const roadmap = resolve(ROOT, 'docs/ROADMAP.md');
  if (existsSync(roadmap)) {
    const n = String(phase ?? '').match(/(\d+)/)?.[1];
    if (n) {
      for (const line of readFileSync(roadmap, 'utf8').split('\n')) {
        const m = line.match(/^\|\s*M(\d+)\s*\|\s*([^|]+?)\s*\|/);
        if (m && m[1] === n) return m[2].replace(/^[^\p{L}\p{N}]+/u, '').trim();
      }
    }
  }
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
  if (!hits.decl.length) { console.error(`✗ [scaffold] REQ-ID '${checkId}' KHÔNG có trong SRS (${relative(ROOT, SRS_DIR)}) — không được tạo issue với mã này (chống bịa)`); process.exit(1); }
  const ret = retirementNote(checkId);
  if (ret) { console.error(`✗ [scaffold] REQ-ID '${checkId}' đã RETIRED (${ret.file}: "${ret.line}") — không tạo issue cho mã đã khai tử (chống bịa)`); process.exit(1); }
  // `hits` là { decl, xref } từ MD-52 - bản vá đó sửa chỗ đếm `.length` nhưng bỏ
  // sót dòng này, nên đường CHẤP NHẬN của --check ném TypeError suốt. Thử chiều
  // đỏ (mã bịa) thì thấy đúng; đường xanh chưa ai chạy. Cả hai chiều nghĩa là cả
  // hai chiều của TỪNG lối đi, không phải một lối đi hai chiều.
  console.log(`✓ [scaffold] '${checkId}' có trong SRS: ${hits.decl.map((h) => h.file).join(', ')}`);
  process.exit(0);
}

const id = argOf('--reqid');
if (!id) { console.error('dùng: --reqid <REQ-ID> | --check <REQ-ID> | --selftest'); process.exit(2); }
if (!existsSync(SRS_DIR)) { console.error(`✗ không thấy SRS dir ${relative(ROOT, SRS_DIR)}`); process.exit(1); }

const found = srsExcerpt(id);
const excerpts = found.decl;
if (!excerpts.length) {
  if (found.xref.length) {
    console.error(
      `✗ REQ-ID '${id}' được NHẮC ở ${found.xref.join(', ')} nhưng KHÔNG được KHAI BÁO ` +
        `(không dòng nào bắt đầu bằng **${id}**) ở bất kỳ file SRS nào — dừng. ` +
        `Nhắc chéo không phải yêu cầu; scaffold theo nó là viết AC cho yêu cầu khác.`,
    );
  } else {
    console.error(`✗ REQ-ID '${id}' KHÔNG có trong SRS — chống bịa, dừng.`);
  }
  process.exit(1);
}
const retired = retirementNote(id);
if (retired) { console.error(`✗ REQ-ID '${id}' đã RETIRED (${retired.file}: "${retired.line}") — không scaffold mã đã khai tử.`); process.exit(1); }
const row = registerRow(id);

const scaffold = {
  reqid: id,
  title_hint: row?.feature ? `[${id}] ${row.feature}` : `[${id}] (điền tên tính năng)`,
  module: moduleOf(row?.section, row?.phase),
  phase: row?.phase ?? '(chưa gán phase trong register)',
  scope_in: row?.scope_in ?? null,
  scope_out: row?.scope_out ?? null,
  goal_hint: row?.goal ?? null,
  srs_excerpts: excerpts,            // agent viết AC TỪ ĐÂY (bám SRS)
  links: [
    ...excerpts.map((h) => `SRS: ${h.file} (${id}, khai báo)`),
    ...found.xref.map((f) => `SRS tham chiếu chéo (KHÔNG phải nguồn của ${id}): ${f}`),
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
