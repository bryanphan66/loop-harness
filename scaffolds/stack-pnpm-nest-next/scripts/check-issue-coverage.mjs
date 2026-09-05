#!/usr/bin/env node
/**
 * Cổng: phase đang mở đã có issue chưa, và issue có được đẩy trạng thái không.
 *
 * Vì sao cần: chuỗi neo của Macro 2 là REQ-ID -> issue -> test -> UAT, và Macro 3
 * chạy bằng issue-pipeline. Trên một dự án thật, chạy hết 2.0..2.4 mà repo vẫn 0
 * issue: bảng bước 2.3 hứa "soạn issue", goal-text nhắc 0 lần, cổng không kiểm ->
 * không ai làm. Chỉ số `issue%` được dựng ra để đo đúng cái đó và đứng yên ở 0
 * suốt bốn lần đo mà không gì đỏ (MD-33).
 *
 * KHÔNG BAO GIỜ XANH RỖNG. Phase có REQ-ID mà tìm ra 0 issue là ĐỎ. Không đọc
 * được trường trạng thái cũng là ĐỎ - một cổng không nhìn thấy đầu vào phải nói
 * ra, không được đi qua (MD-22).
 *
 *   node scripts/check-issue-coverage.mjs --phase P1
 *   node scripts/check-issue-coverage.mjs --phase P1 --closing   # thêm: hết trạng thái mở đầu
 *   node scripts/check-issue-coverage.mjs --phase P1 --repo owner/name
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { gateRoot, loadGateConfig, reqIdsByPhase, inScopeReqIds } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT);
const boardCfg = cfg.issueBoard ?? {};
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i === -1 ? null : args[i + 1] ?? null; };
const PHASE = flag('--phase');
const CLOSING = args.includes('--closing');
const MANIFEST = resolve(ROOT, boardCfg.buildManifest ?? 'docs/build-manifest.md');
/** Trạng thái coi là "chưa ai đụng tới" - phase không được đóng khi còn issue nằm đây. */
const START_STATES = boardCfg.startStates ?? ['Backlog', 'Ready for Dev'];

if (!PHASE) {
  console.error('dùng: node scripts/check-issue-coverage.mjs --phase P<n> [--closing] [--repo owner/name]');
  process.exit(1);
}
if (!existsSync(MANIFEST)) {
  console.log(`✓ [issue-coverage] chưa có ${boardCfg.buildManifest ?? 'docs/build-manifest.md'} — bỏ qua`);
  process.exit(0);
}

const gh = (a) => spawnSync('gh', a, { cwd: ROOT, encoding: 'utf8' });
const REPO = flag('--repo')
  ?? (gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).stdout ?? '').trim();
if (!REPO) { console.error('issue-coverage: không xác định được repo. Truyền --repo owner/name.'); process.exit(1); }

// --- REQ-ID trong phạm vi của phase này ----------------------------------------
const { byPhase } = reqIdsByPhase(ROOT, MANIFEST);
const inScope = inScopeReqIds(ROOT, cfg.rtm ?? {});
const phaseIds = [...(byPhase.get(PHASE) ?? new Set())].filter((id) => !inScope.size || inScope.has(id));

if (!phaseIds.length) {
  console.error(`\n✗ [issue-coverage] ${PHASE} không có REQ-ID nào trong phạm vi — đọc hỏng, không phải phase rỗng.`);
  console.error(`  manifest: ${MANIFEST}`);
  console.error(`  phase đọc được: ${[...byPhase.keys()].join(', ') || '(không có)'}`);
  process.exit(1);
}

// --- issue đang có -------------------------------------------------------------
const raw = gh(['issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '800',
  '--json', 'number,title,body,milestone,state']);
if (raw.status !== 0) {
  console.error(`\n✗ [issue-coverage] không đọc được issue của ${REPO}: ${(raw.stderr ?? '').trim().slice(0, 160)}`);
  process.exit(1);
}
const issues = JSON.parse(raw.stdout || '[]');
const RE = /\b[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+\b/g;
const covered = new Map(); // REQ-ID -> [issue]
for (const it of issues) {
  for (const id of `${it.title}\n${it.body ?? ''}`.match(RE) ?? []) {
    if (!covered.has(id)) covered.set(id, []);
    covered.get(id).push(it);
  }
}

const errors = [];
const missing = phaseIds.filter((id) => !covered.has(id));
if (missing.length) {
  errors.push(`${missing.length}/${phaseIds.length} REQ-ID của ${PHASE} chưa có issue nào: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ` … +${missing.length - 12}` : ''}`);
}

// milestone phải là Phase <n>
const wantMilestone = `Phase ${PHASE.slice(1)}`;
const phaseIssues = [...new Set(phaseIds.flatMap((id) => covered.get(id) ?? []))];
const noMilestone = phaseIssues.filter((it) => (it.milestone?.title ?? '') !== wantMilestone);
if (noMilestone.length) {
  errors.push(`${noMilestone.length} issue của ${PHASE} không gắn milestone "${wantMilestone}": ${noMilestone.slice(0, 8).map((i) => `#${i.number}`).join(', ')}`);
}

// --- trạng thái, chỉ khi đóng phase --------------------------------------------
if (CLOSING && phaseIssues.length) {
  const stuck = [];
  let unreadable = 0;
  for (const it of phaseIssues) {
    const r = gh(['api', `repos/${REPO}/issues/${it.number}`, '--jq',
      '[.issue_field_values[]? | select(.issue_field.name=="States") | .single_select_option.name] | first // ""']);
    if (r.status !== 0) { unreadable++; continue; }
    const st = (r.stdout ?? '').trim();
    if (!st) { unreadable++; continue; }
    if (START_STATES.includes(st)) stuck.push(`#${it.number}=${st}`);
  }
  if (unreadable) {
    errors.push(`không đọc được trạng thái của ${unreadable} issue — cổng KHÔNG được xanh khi không nhìn thấy đầu vào. Kiểm quyền gh và trường org "States".`);
  }
  if (stuck.length) {
    errors.push(`${stuck.length} issue còn ở trạng thái mở đầu khi đóng ${PHASE}: ${stuck.slice(0, 10).join(', ')} — đẩy bằng scripts/issue-state.mjs`);
  }
}

if (errors.length) {
  console.error(`\n✗ [issue-coverage] ${PHASE}: ${phaseIds.length} REQ-ID trong phạm vi, ${phaseIssues.length} issue liên quan\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\n  Mở issue bằng scripts/new-issue.mjs (chuẩn: docs/playbooks/github-issue-standard.md),');
  console.error('  dựng nhãn + milestone trước bằng scripts/setup-issue-board.mjs --apply.\n');
  process.exit(1);
}
console.log(`✓ [issue-coverage] ${PHASE}: ${phaseIds.length}/${phaseIds.length} REQ-ID có issue, milestone "${wantMilestone}" đủ${CLOSING ? ', không issue nào còn ở trạng thái mở đầu' : ''}`);
