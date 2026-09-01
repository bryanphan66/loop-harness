#!/usr/bin/env node
/**
 * Dat trang thai (State) cho 1 GitHub Issue trong pipeline 10-buoc.
 *
 * Truong "States" la GitHub org Issue Field (single-select) dung chung cho ca
 * org RenoAI-Labs. Script nay set gia tri States cho 1 issue, phuc vu SOP
 * "Quy trinh code issue" (docs/process/WORKFLOW.md).
 *
 * Dung:
 *   node scripts/issue-state.mjs <issue-number> "<state name>" [--repo owner/name] [--dry-run]
 *                                [--force "<ly do>"] [--advance]
 * Vi du:
 *   node scripts/issue-state.mjs 239 "In Dev"
 *
 * --advance: tu di CAC BUOC HOP LE TIEN toi dich (idempotent) thay vi 1 buoc.
 *   Dung khi dispatch coder: issue co the dang o (chua co)/Backlog/Ready for Dev
 *   -> "In Dev --advance" tu di het duong (chua co)->Ready for Dev->In Dev, khong
 *   can operator nho tung buoc. GIOI HAN: chi tien toi "In Dev" (vung TRUOC deploy);
 *   tu Deploying tro di PHAI do ship-and-verify.sh / QC that set (giu cong QC/UAT
 *   la nguoi). --advance chi di TIEN, khong di lui (QC-fail lui In Dev = set 1 buoc).
 *
 * TRANSITION GUARD (chan nhay coc): bang 10-state khong con chi la quy uoc ghi
 * trong tai lieu — script CHAN buoc chuyen khong hop le (vi du Backlog -> Done,
 * bo qua QC). Bang canh hop le o TRANSITIONS ben duoi, mirror
 * playbooks/steady-state-issue-pipeline.md. Fail-closed: state khong nam trong
 * bang (org doi ten / taxonomy khac) cung bi chan, phai --force.
 *
 * Escape cho NGUOI: --force "<ly do>" (bat buoc co ly do, in ra log). Agent
 * KHONG duoc tu --force de di qua guard — do la luat bypass cua verify-gate,
 * ap dung y het o day.
 *
 * QUAN TRONG - value PATCH la DECLARATIVE (khai bao): gui len issue_field_values
 * nao thi GitHub thay THE toan bo, cac field khong gui bi XOA. Vi vay script
 * DOC gia tri hien tai cua issue (Priority, ...) roi GUI LAI cung voi States
 * moi, tranh xoa nham cac field khac. (Module da chuyen sang nhan `module:` cap
 * repo -> script KHONG re-send Module nua; xem block resolve o duoi.)
 *
 * Field id KHONG hardcode - resolve dong theo ten "States" qua
 * gh api /orgs/<org>/issue-fields (id hien tai 44755813 nhung co the doi).
 *
 * Chi thao tac phia GitHub (khong dong bo Plane).
 */
import { execFileSync } from 'node:child_process';

// ---- Bang canh hop le cua may trang thai 10-buoc --------------------------
// Mirror: playbooks/steady-state-issue-pipeline.md § The unit + § rules that bite.
// Luat vang: QC/UAT fail TRONG AC -> lui "In Dev" tren CHINH issue do;
// fail NGOAI AC -> issue MOI (khong lui trang thai issue da qua).
const TRANSITIONS = {
  '(chua co)':      ['Backlog', 'Ready for Dev', 'Cancelled'], // issue moi tao / chua set States
  'Backlog':        ['Ready for Dev', 'Cancelled'],
  'Ready for Dev':  ['In Dev', 'Backlog', 'Cancelled'],
  'In Dev':         ['Deploying', 'Ready for Dev', 'Cancelled'],
  'Deploying':      ['Ready for Test', 'In Dev', 'Cancelled'],
  'Ready for Test': ['QC Testing', 'In Dev', 'Cancelled'],
  'QC Testing':     ['Ready for UAT', 'In Dev', 'Cancelled'],
  'Ready for UAT':  ['UAT Testing', 'In Dev', 'Cancelled'],
  'UAT Testing':    ['Done', 'In Dev', 'Cancelled'],
  'Done':           [], // terminal — loi phat hien SAU Done = issue MOI, khong mo lai
  'Cancelled':      ['Backlog'],
};
const UNSET = '(chua co)';

const args = process.argv.slice(2);
const argOf = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes('--dry-run');
const FORCE_REASON = argOf('--force');
const FORCED = args.includes('--force');
const ADVANCE = args.includes('--advance');

// Duong TIEN happy-path (chi 1 buoc/state) — dung cho --advance. Chi toi truoc
// deploy; Deploying tro di do actor that (ship-and-verify/QC) set, khong auto-jump.
const FORWARD = {
  '(chua co)':     'Ready for Dev',
  'Backlog':       'Ready for Dev',
  'Ready for Dev': 'In Dev',
};
const ADVANCE_MAX = ['Backlog', 'Ready for Dev', 'In Dev'];

// Quyet dinh hop le: CA HAI dau phai co trong bang, va canh phai ton tai.
const isLegal = (from, to) => Object.prototype.hasOwnProperty.call(TRANSITIONS, from)
  && Object.prototype.hasOwnProperty.call(TRANSITIONS, to)
  && TRANSITIONS[from].includes(to);

// ---- 0. --self-test: kiem chung bang canh, KHONG can gh / mang -----------------
// Chay duoc o CI hoac tay: `node scripts/issue-state.mjs --self-test`
if (args.includes('--self-test')) {
  const cases = [
    // [from, to, ky vong hop le?]
    ['(chua co)', 'Backlog', true],
    ['(chua co)', 'Done', false],          // issue moi khong nhay thang Done
    ['Backlog', 'Ready for Dev', true],
    ['Backlog', 'Done', false],            // nhay coc bo qua ca QC lan UAT
    ['Backlog', 'In Dev', false],          // phai qua triage (Ready for Dev)
    ['Ready for Dev', 'In Dev', true],
    ['In Dev', 'Deploying', true],
    ['In Dev', 'Ready for Test', false],   // chua deploy thi chua test duoc
    ['Deploying', 'Ready for Test', true],
    ['Ready for Test', 'QC Testing', true],
    ['QC Testing', 'Ready for UAT', true],
    ['QC Testing', 'In Dev', true],        // luat vang: fail TRONG AC -> lui
    ['QC Testing', 'Done', false],         // bo qua UAT
    ['Ready for UAT', 'UAT Testing', true],
    ['UAT Testing', 'Done', true],
    ['Done', 'In Dev', false],             // Done la terminal -> loi moi = issue MOI
    ['Done', 'Backlog', false],
    ['Cancelled', 'Backlog', true],        // hoi sinh issue da huy
    ['In Dev', 'Khong Ton Tai', false],    // state la (taxonomy khac) -> fail-closed
    ['State La', 'In Dev', false],
  ];
  let bad = 0;
  for (const [from, to, want] of cases) {
    const got = isLegal(from, to);
    if (got !== want) { console.error(`[FAIL] "${from}" -> "${to}": mong ${want}, nhan ${got}`); bad++; }
  }
  // Moi state (tru terminal/unset) phai co duong ve "Cancelled".
  for (const [s, outs] of Object.entries(TRANSITIONS)) {
    if (s === 'Done' || s === 'Cancelled') continue;
    if (!outs.includes('Cancelled')) { console.error(`[FAIL] "${s}" khong co duong -> "Cancelled"`); bad++; }
  }
  // Moi dich den phai la state co that trong bang (khong go sai ten).
  for (const [s, outs] of Object.entries(TRANSITIONS)) {
    for (const t of outs) {
      if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, t)) { console.error(`[FAIL] "${s}" -> "${t}": dich khong ton tai trong bang`); bad++; }
    }
  }
  // Moi canh TIEN (--advance) phai la 1 transition HOP LE (advance khong duoc lach guard).
  for (const [from, to] of Object.entries(FORWARD)) {
    if (!isLegal(from, to)) { console.error(`[FAIL] FORWARD "${from}" -> "${to}" khong hop le trong TRANSITIONS`); bad++; }
  }
  // --advance chi duoc tien toi vung truoc-deploy.
  for (const s of ADVANCE_MAX) {
    if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, s)) { console.error(`[FAIL] ADVANCE_MAX "${s}" khong co trong bang`); bad++; }
  }
  if (bad) { console.error(`[self-test] ${bad} case sai.`); process.exit(1); }
  console.log(`[self-test] OK — ${cases.length} case + bat buoc Cancelled + tinh toan ven cua bang.`);
  process.exit(0);
}

const REPO = argOf('--repo') || execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim();
const ORG = REPO.split('/')[0];

// Doi so vi tri (bo qua cac flag --xxx va gia tri di kem chung).
const positionals = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dry-run') continue;
  if (a === '--repo') { i++; continue; }
  if (a === '--force') { i++; continue; }
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
// Module da chuyen sang nhan `module:<slug>` cap repo (khong con la org field).
// Resolve id Module (neu org field cu con ton tai) de KHONG re-send -> PATCH
// declarative se drop gia tri org field Module cu con sot lai.
let statesFieldId, validStates, moduleFieldId = null;
try {
  const fields = JSON.parse(gh(['api', `/orgs/${ORG}/issue-fields`]));
  const states = fields.find((f) => f.name === 'States');
  if (!states) die(`org ${ORG} chua co issue-field ten "States".`);
  statesFieldId = states.id;
  validStates = (states.options || []).map((o) => o.name);
  const moduleField = fields.find((f) => f.name === 'Module');
  moduleFieldId = moduleField ? moduleField.id : null;
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

// ---- 3b. TRANSITION GUARD (fail-closed) ----------------------------------------
// Bang 10-state phai la BARIE that, khong phai vach son. Chan moi buoc chuyen
// khong co trong TRANSITIONS; nguoi muon di tat thi --force "<ly do>".
const currentStateFv = existing.find((fv) => fv.issue_field_id === statesFieldId);
const fromState = (currentStateFv && valueOf(currentStateFv)) || UNSET;

if (FORCED && !FORCE_REASON) {
  die('--force phai kem ly do: --force "<ly do>" (luat bypass giong verify-gate: nguoi bypass phai noi ro vi sao).');
}

// ---- 3c. --advance: tu di cac buoc hop le TIEN toi dich ------------------------
// Bind vao dispatch: 1 lenh idempotent dua issue toi "In Dev" du dang o dau (truoc
// deploy). Moi hop la 1 lan goi lai chinh script (khong --advance) -> tai su dung
// nguyen guard/patch o duoi, khong nhan doi logic.
if (ADVANCE) {
  if (!ADVANCE_MAX.includes(stateName)) {
    die(`--advance chi tien toi "In Dev" (vung truoc deploy). "${stateName}" tro di phai do ship-and-verify.sh / QC that set.`);
  }
  if (fromState === stateName) {
    console.log(`[issue #${issueNumber}] da o "${stateName}" san — khong doi gi.`);
    process.exit(0);
  }
  const path = [];
  let cur = fromState, guard = 0;
  while (cur !== stateName) {
    const nxt = FORWARD[cur];
    if (!nxt || guard++ > 10) {
      die(`--advance: khong co duong TIEN tu "${fromState}" toi "${stateName}" (chi di tien, khong di lui). QC-fail lui "In Dev" thi set 1 buoc khong --advance.`);
    }
    path.push(nxt);
    cur = nxt;
  }
  for (const hop of path) {
    const hopArgs = [process.argv[1], issueNumber, hop, '--repo', REPO];
    if (DRY) hopArgs.push('--dry-run');
    execFileSync(process.argv[0], hopArgs, { stdio: 'inherit' });
  }
  process.exit(0);
}

if (fromState === stateName) {
  console.log(`[issue #${issueNumber}] da o "${stateName}" san — khong doi gi.`);
  process.exit(0);
}

const allowed = TRANSITIONS[fromState];
const known = allowed !== undefined && Object.prototype.hasOwnProperty.call(TRANSITIONS, stateName);

if (!isLegal(fromState, stateName)) {
  const why = !known
    ? `state "${!allowed ? fromState : stateName}" khong co trong bang chuyen (org doi ten state? taxonomy khac?)`
    : `"${fromState}" -> "${stateName}" KHONG hop le. Tu "${fromState}" chi di duoc: ${allowed.length ? allowed.map((s) => `"${s}"`).join(', ') : '(khong di dau — trang thai cuoi)'}`;

  if (!FORCED) {
    console.error(`[chan] ${why}`);
    console.error('       Luat vang: QC/UAT fail TRONG AC -> lui "In Dev" tren chinh issue nay;');
    console.error('                  fail NGOAI AC -> tao issue MOI (issue nay di tiep doc lap).');
    console.error('                  Loi phat hien SAU "Done" -> LUON la issue moi, khong mo lai.');
    console.error(`       Nguoi (khong phai agent) muon di tat: them --force "<ly do>".`);
    process.exit(1);
  }
  console.error(`[force] bo qua guard: ${why}`);
  console.error(`[force] ly do: ${FORCE_REASON}`);
}

const payloadValues = [];
let statesReplaced = false;
for (const fv of existing) {
  if (fv.issue_field_id === statesFieldId) {
    payloadValues.push({ field_id: statesFieldId, value: stateName }); // ghi de States
    statesReplaced = true;
    continue;
  }
  if (moduleFieldId && fv.issue_field_id === moduleFieldId) continue; // Module -> nhan module: cap repo, khong re-send (drop gia tri org field cu)
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
console.log(`[issue #${issueNumber}] States "${fromState}" -> "${stateName}" (giu lai: ${kept})${DRY ? ' [DRY-RUN]' : ''}`);

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
