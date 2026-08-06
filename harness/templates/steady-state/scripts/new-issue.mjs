#!/usr/bin/env node
/**
 * Tao / kiem 1 GitHub Issue DUNG CHUAN (github-issue-standard.md).
 *
 * Van de nham: agent (PM, QC, hay ai phat hien loi) tu go body issue bang tay
 * -> hay paraphrase khoi DoD -> ra issue lech chuan (vd DoD 5 dong thay vi 13
 * muc co dinh). Script nay lam KHOI CO DINH (DoD 13 muc + header 5 khoi) thanh
 * hang-so trong code -> "tao la chuan" theo nghia den: agent chi truyen phan
 * BIEN (title / boi canh / pham vi / AC), phan co dinh script tu ghi, khong the
 * sai. Che do --check lam GATE fail-closed cho issue tao bang tay.
 *
 * Dung:
 *   # Sinh body ra stdout (agent xem/dan):
 *   node scripts/new-issue.mjs --input issue.json
 *   # Tao that tren GitHub (dat label plane + Module:, Issue Type, assignee, milestone):
 *   node scripts/new-issue.mjs --input issue.json --create [--repo owner/name]
 *   # Kiem 1 issue da co co dung chuan khong (exit 1 neu lech):
 *   node scripts/new-issue.mjs --check <issue-number> [--repo owner/name]
 *
 * issue.json (phan BIEN, agent dien):
 *   {
 *     "title": "Man hoc bi cat ben phai tren mobile",
 *     "module": "Learning & Certificates",     // -> nhan "Module: <...>"
 *     "type": "Bug",                            // Feature | Bug | Enhancement
 *     "assignee": "bryanphan66",                // optional
 *     "milestone": "Phase 1",                   // optional
 *     "context": "1-3 cau hien trang + vi sao can doi...",
 *     "scopeIn":  ["muc trong pham vi 1", "..."],
 *     "scopeOut": ["muc ngoai pham vi 1", "..."],
 *     "ac": ["Given ... When ... Then ...", "Given ... When ... Then ..."],
 *     "links": ["Refs #123", "link staging ..."]  // optional, ngoai cac dong mac dinh
 *   }
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const argOf = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const has = (f) => args.includes(f);
const die = (msg) => { console.error(`[loi] ${msg}`); process.exit(1); };
const gh = (a, input) => execFileSync('gh', a, { encoding: 'utf8', maxBuffer: 1 << 24, input });
const REPO = argOf('--repo') || gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).trim();

// ---- KHOI CO DINH (single source of truth) -----------------------------------
// DoD = 13 muc, GIONG mọi issue. Muc khong ap dung: agent doi "- [ ] X" thanh
// "- [ ] X - N/A - <ly do>" (KHONG xoa dong). Giu dau tieng Viet (vao body).
const DOD_ITEMS = [
  'Xong toàn bộ AC ở trên (mỗi AC QC-pass được trên staging)',
  'Lint pass (CI) - (link)',
  'Unit test pass, coverage đạt ngưỡng (dự án tự đặt) - (link)',
  'Integration test pass - (link)',
  'E2E test pass - (link)',
  'Security test (OWASP / NFR bảo mật) - (link)',
  'Regression - không phá chức năng/số liệu liên quan (kiểm hồi quy sau khi lên staging)',
  'Mobile 375px + WCAG AA (nếu có UI) - (link)',
  'HDSD tính năng đầy đủ (user guide cả tính năng) - (link)',
  'Cập nhật tài liệu liên quan trong source - (commit)',
  'Deploy staging + verify-at-source (health ok, SHA == commit đã merge) - (link)',
  'QC pass (human) - (ghi chú)',
  'UAT khách đạt (mirror sang PM-tool) - (link)  -> mới chuyển Done',
];
// Cac substring ON DINH de --check nhan dien tung muc DoD (khop long).
const DOD_KEYS = [
  'Xong toàn bộ AC', 'Lint pass', 'Unit test', 'Integration test', 'E2E test',
  'Security test', 'Regression', 'Mobile 375px', 'HDSD', 'Cập nhật tài liệu',
  'verify-at-source', 'QC pass', 'UAT khách',
];
const SECTIONS = ['Bối cảnh', 'Phạm vi', 'Acceptance Criteria', 'Definition of Done', 'Liên kết'];

// ---- Sinh body tu phan BIEN --------------------------------------------------
function buildBody(d) {
  const acLines = (d.ac && d.ac.length ? d.ac : ['Given <bối cảnh> When <thao tác> Then <kết quả kiểm được>'])
    .map((a) => `- [ ] ${a}.  Demo: <điền khi QC xong> | HDSD: <điền khi QC xong>`);
  const inLines = (d.scopeIn && d.scopeIn.length ? d.scopeIn : ['<điền>']).map((s) => `- ${s}`);
  const outLines = (d.scopeOut && d.scopeOut.length ? d.scopeOut : ['<điền>']).map((s) => `- ${s}`);
  const dod = DOD_ITEMS.map((x) => `- [ ] ${x}`);
  const links = (d.links && d.links.length ? d.links : ['Commit / PR: dùng `Refs #N` (KHÔNG Closes/Fixes/Resolves)'])
    .map((l) => `- ${l}`);
  return [
    '## Bối cảnh', '', (d.context || '<hiện trạng + vì sao cần đổi>'), '',
    '## Phạm vi', '', '**Trong phạm vi:**', ...inLines, '', '**Ngoài phạm vi:**', ...outLines, '',
    '## Tiêu chí nghiệm thu (Acceptance Criteria - AC)', '', ...acLines, '',
    '## Định nghĩa hoàn thành (Definition of Done - DoD)', '',
    '> Mỗi mục xong đính thông số/link. Mục không áp dụng: ghi `N/A - <lý do>` (ĐỪNG xoá dòng).',
    ...dod, '',
    '## Liên kết', '', ...links, '',
  ].join('\n');
}

// ---- Mode --check: GATE fail-closed ------------------------------------------
if (has('--check')) {
  const n = argOf('--check');
  if (!n || !/^\d+$/.test(n)) die('--check can <issue-number>. VD: node scripts/new-issue.mjs --check 389');
  let body, labels;
  try {
    const j = JSON.parse(gh(['issue', 'view', n, '--repo', REPO, '--json', 'body,labels']));
    body = j.body || '';
    labels = (j.labels || []).map((l) => l.name);
  } catch (e) { die(`khong doc duoc issue #${n}: ${e.message}`); }

  const problems = [];
  for (const s of SECTIONS) if (!body.includes(s)) problems.push(`thieu khoi "## ${s}"`);
  const dodMissing = DOD_KEYS.filter((k) => !body.includes(k));
  if (dodMissing.length) problems.push(`DoD thieu ${dodMissing.length}/13 muc: ${dodMissing.join(' | ')}`);
  if (!/- \[[ x]\].*(Given|When|Then)/is.test(body)) problems.push('AC khong co dong checkbox Given-When-Then');
  if (!labels.includes('plane')) problems.push('thieu nhan "plane"');
  if (!labels.some((l) => /^Module: /.test(l))) problems.push('thieu nhan "Module: <Ten>"');
  if (labels.includes('github')) problems.push('con nhan "github" (da bo khoi chuan)');
  if (/\b(Closes|Fixes|Resolves)\s+#\d+/i.test(body)) problems.push('body dung Closes/Fixes/Resolves (phai Refs #N)');

  if (problems.length) {
    console.error(`[FAIL] issue #${n} LECH chuan (${problems.length}):`);
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log(`[OK] issue #${n} dung chuan (5 khoi + DoD 13 muc + label plane/Module + khong Closes).`);
  process.exit(0);
}

// ---- Mode sinh / tao ---------------------------------------------------------
const inFile = argOf('--input');
if (!inFile) die('thieu --input <file.json> (hoac --check <n>). Xem header script.');
let d;
try { d = JSON.parse(readFileSync(inFile, 'utf8')); } catch (e) { die(`khong doc duoc ${inFile}: ${e.message}`); }
if (!d.title) die('issue.json thieu "title".');

const body = buildBody(d);

if (!has('--create')) { process.stdout.write(body + '\n'); process.exit(0); }

// --create: tao issue that + set field
const createArgs = ['issue', 'create', '--repo', REPO, '--title', d.title, '--body', body, '--label', 'plane'];
if (d.module) createArgs.push('--label', `Module: ${d.module}`);
if (d.assignee) createArgs.push('--assignee', d.assignee);
if (d.milestone) createArgs.push('--milestone', d.milestone);
let url;
try { url = gh(createArgs).trim(); } catch (e) { die(`gh issue create that bai: ${e.message}`); }
const num = (url.match(/\/issues\/(\d+)/) || [])[1];
console.log(`[tao] ${url}`);

// Issue Type (Feature/Bug/Enhancement) = truong rieng, set qua REST
if (d.type && num) {
  try {
    gh(['api', '--method', 'PATCH', `/repos/${REPO}/issues/${num}`, '-f', `type=${d.type}`]);
    console.log(`[type] #${num} -> ${d.type}`);
  } catch (e) { console.error(`[canh bao] set Issue Type that bai: ${e.message}`); }
}
// Tu kiem lai (fail-closed): tao xong PHAI dung chuan
if (num) {
  try { execFileSync(process.argv[0], [process.argv[1], '--check', num, '--repo', REPO], { stdio: 'inherit' }); }
  catch { die(`issue #${num} vua tao KHONG qua --check. Sua body cho dung chuan.`); }
}
