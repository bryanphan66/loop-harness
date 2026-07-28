#!/usr/bin/env node
/**
 * Dat trang thai (State) cho 1 GitHub Issue trong pipeline 10-buoc.
 *
 * Truong "States" la GitHub org Issue Field (single-select) dung chung cho ca
 * org RenoAI-Labs. Script nay set gia tri States cho 1 issue, phuc vu SOP
 * "Quy trinh code issue" (docs/WORKFLOW.md).
 *
 * Dung:
 *   node scripts/issue-state.mjs <issue-number> "<state name>" [--repo owner/name] [--dry-run]
 * Vi du:
 *   node scripts/issue-state.mjs 239 "In Dev"
 *
 * QUAN TRONG - value PATCH la DECLARATIVE (khai bao): gui len issue_field_values
 * nao thi GitHub thay THE toan bo, cac field khong gui bi XOA. Vi vay script
 * DOC gia tri hien tai cua issue (Module, Priority, ...) roi GUI LAI cung voi
 * States moi, tranh xoa nham cac field khac.
 *
 * Field id KHONG hardcode - resolve dong theo ten "States" qua
 * gh api /orgs/<org>/issue-fields (id hien tai 44755813 nhung co the doi).
 *
 * Chi thao tac phia GitHub (khong dong bo Plane).
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const argOf = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes('--dry-run');
const REPO = argOf('--repo') || execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim();
const ORG = REPO.split('/')[0];

// Doi so vi tri (bo qua cac flag --xxx va gia tri di kem chung).
const positionals = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dry-run') continue;
  if (a === '--repo') { i++; continue; }
  positionals.push(a);
}
const issueNumber = positionals[0];
const stateName = positionals[1];

const die = (msg) => { console.error(`[loi] ${msg}`); process.exit(1); };

if (!issueNumber || !/^\d+$/.test(issueNumber)) {
  die('thieu/ sai <issue-number>. Dung: node scripts/issue-state.mjs <issue-number> "<state name>" [--repo owner/name] [--dry-run]');
}
if (!stateName) {
  die('thieu "<state name>". Dung: node scripts/issue-state.mjs <issue-number> "<state name>"');
}

const gh = (ghArgs, input) => execFileSync('gh', ghArgs, {
  encoding: 'utf8', maxBuffer: 1 << 24, input,
});

// ---- 1. Resolve field "States" (id + danh sach option hop le) DONG -----------
let statesFieldId, validStates;
try {
  const fields = JSON.parse(gh(['api', `/orgs/${ORG}/issue-fields`]));
  const states = fields.find((f) => f.name === 'States');
  if (!states) die(`org ${ORG} chua co issue-field ten "States".`);
  statesFieldId = states.id;
  validStates = (states.options || []).map((o) => o.name);
} catch (e) {
  die(`khong doc duoc /orgs/${ORG}/issue-fields (gh loi hoac chua login?): ${e.message}`);
}

// ---- 2. Validate ten state -----------------------------------------------------
if (!validStates.includes(stateName)) {
  die(`state "${stateName}" khong hop le. Hop le: ${validStates.join(', ')}`);
}

// ---- 3. Doc field values hien tai cua issue (de re-send, tranh xoa nham) -------
let current;
try {
  current = JSON.parse(gh([
    'api', '-H', 'Accept: application/vnd.github.full+json',
    `/repos/${REPO}/issues/${issueNumber}`,
  ]));
} catch (e) {
  die(`khong doc duoc issue #${issueNumber} (repo ${REPO}): ${e.message}`);
}

// Gom moi field DANG CO gia tri, gui lai nguyen ven (PATCH declarative se xoa
// field nao khong gui). single_select -> ten option; con lai -> .value.
const existing = current.issue_field_values || [];
const valueOf = (fv) => (fv.data_type === 'single_select'
  ? (fv.single_select_option && fv.single_select_option.name)
  : fv.value);

const payloadValues = [];
let statesReplaced = false;
for (const fv of existing) {
  if (fv.issue_field_id === statesFieldId) {
    payloadValues.push({ field_id: statesFieldId, value: stateName }); // ghi de States
    statesReplaced = true;
    continue;
  }
  const v = valueOf(fv);
  if (v !== null && v !== undefined && v !== '') {
    payloadValues.push({ field_id: fv.issue_field_id, value: v }); // giu nguyen field khac
  }
}
if (!statesReplaced) payloadValues.push({ field_id: statesFieldId, value: stateName }); // issue chua co States

const body = JSON.stringify({ issue_field_values: payloadValues });
const kept = payloadValues
  .filter((p) => p.field_id !== statesFieldId)
  .map((p) => p.value)
  .join(', ') || '(khong co)';
console.log(`[issue #${issueNumber}] States -> "${stateName}" (giu lai: ${kept})${DRY ? ' [DRY-RUN]' : ''}`);

if (DRY) { console.log(`[dry-run] payload: ${body}`); process.exit(0); }

// ---- 4. PATCH ------------------------------------------------------------------
let after;
try {
  after = JSON.parse(gh([
    'api', '--method', 'PATCH',
    '-H', 'Accept: application/vnd.github.full+json',
    `/repos/${REPO}/issues/${issueNumber}`,
    '--input', '-',
  ], body));
} catch (e) {
  die(`PATCH that bai cho issue #${issueNumber}: ${e.message}`);
}

const summary = (after.issue_field_values || [])
  .map((fv) => `${fv.issue_field_name}=${valueOf(fv)}`)
  .join(', ');
console.log(`[xong] #${issueNumber} field values: ${summary}`);
