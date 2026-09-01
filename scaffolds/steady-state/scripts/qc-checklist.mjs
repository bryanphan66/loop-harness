#!/usr/bin/env node
/**
 * Sinh QC checklist (danh sach kiem thu) tu Acceptance Criteria cua 1 GitHub Issue
 * va dang lam comment tren issue do. Phuc vu SOP "Quy trinh code issue"
 * (docs/process/WORKFLOW.md): moi issue khi vao lane test phai co checklist de QC bam-va-tick.
 *
 * Dung:
 *   node scripts/qc-checklist.mjs <issue-number> [--repo owner/name] [--force] [--dry-run]
 * Vi du:
 *   node scripts/qc-checklist.mjs 239
 *
 * Idempotent: comment co marker <!-- qc-checklist -->; neu issue da co checklist thi
 * KHONG dang trung (tru khi --force). Chi thao tac phia GitHub.
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const argOf = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');
const REPO = argOf('--repo') || execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim();
const STAGING = argOf('--staging') || (() => { try { return execFileSync('git', ['config', '--get', 'deploy.stagingurl'], { encoding: 'utf8' }).trim(); } catch { return '<staging-url — set: git config deploy.stagingurl https://...>'; } })();
const MARKER = '<!-- qc-checklist -->';

const positionals = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dry-run' || a === '--force') continue;
  if (a === '--repo') { i++; continue; }
  positionals.push(a);
}
const issueNumber = positionals[0];
const die = (m) => { console.error(`[loi] ${m}`); process.exit(1); };
if (!issueNumber || !/^\d+$/.test(issueNumber)) {
  die('thieu/sai <issue-number>. Dung: node scripts/qc-checklist.mjs <issue-number> [--repo owner/name] [--force] [--dry-run]');
}

const gh = (a, input) => execFileSync('gh', a, { encoding: 'utf8', maxBuffer: 1 << 24, input });

// ---- 1. Doc issue (title, body, comments) ------------------------------------
let issue;
try {
  issue = JSON.parse(gh(['issue', 'view', issueNumber, '--repo', REPO, '--json', 'title,body,comments']));
} catch (e) {
  die(`khong doc duoc issue #${issueNumber} (repo ${REPO}): ${e.message}`);
}

// ---- 2. Idempotent: da co checklist chua? ------------------------------------
const had = (issue.comments || []).some((c) => (c.body || '').includes(MARKER));
if (had && !FORCE) {
  console.log(`[bo qua] #${issueNumber} da co QC checklist (dung --force de dang lai).`);
  process.exit(0);
}

// ---- 3. Rut Acceptance Criteria tu body --------------------------------------
// Tim section co tieu de chua "nghiem thu" hoac "acceptance", lay cac dong checkbox.
// Fallback: moi dong checkbox trong body.
const lines = (issue.body || '').split(/\r?\n/);
const isHeading = (l) => /^#{1,6}\s/.test(l) || /^\*\*.+\*\*\s*$/.test(l.trim());
const checkbox = (l) => /^\s*[-*]\s*\[[ xX]?\]\s+/.test(l);
const stripBox = (l) => l.replace(/^\s*[-*]\s*\[[ xX]?\]\s+/, '').trim();

let ac = [];
let inAc = false;
for (const l of lines) {
  if (isHeading(l)) {
    inAc = /nghi[eệ]m\s*thu|acceptance/i.test(l);
    continue;
  }
  if (inAc && checkbox(l)) ac.push(stripBox(l));
}
if (ac.length === 0) ac = lines.filter(checkbox).map(stripBox); // fallback
ac = ac.slice(0, 12); // gon

// ---- 4. Soan checklist -------------------------------------------------------
const happy = ac.length
  ? ac.map((t) => `- [ ] ${t}`).join('\n')
  : '- [ ] Tinh nang chay dung mo ta trong issue (chua co Acceptance Criteria dang checkbox - kiem tay theo mo ta).';

const body = `${MARKER}
## Checklist QC #${issueNumber}

Moi truong: staging ${STAGING}. Bam thu tren staging, tick o nao PASS. O nao FAIL thi tao bug moi theo mau \`.github/ISSUE_TEMPLATE/bug-report.md\` va ghi so issue vao day.

### Luong thuan + Acceptance Criteria (happy path)
${happy}

### 6 lat cat kiem tra nhanh
- [ ] Boundary (bien): gia tri ranh gioi - rong/dau/cuoi ky/so lon.
- [ ] Negative (sai/xau): nhap bay, thao tac cam, goi thang API -> bi tu choi dung cach.
- [ ] Permission (quyen/vai tro): doi role (Hoc vien/Admin/Nhan vien) xem hanh vi dung phan quyen.
- [ ] Mobile (responsive): man nho, xoay ngang - khong vo layout, van bam duoc.
- [ ] Empty/edge data: 0 ban ghi, danh sach rong - khung van render, khong loi trang.
- [ ] Doi chieu (cross-check): cac so lieu/chuc nang lien quan van dung (fix nay khong lam hong cai khac).

Ket qua: PASS toan bo -> chuyen issue sang Ready for UAT. Co FAIL -> giu QC Testing + link issue bug.`;

if (DRY) {
  console.log(`[dry-run] #${issueNumber} se dang checklist (${ac.length} AC item):\n---\n${body}\n---`);
  process.exit(0);
}

// ---- 5. Dang comment ---------------------------------------------------------
try {
  gh(['issue', 'comment', issueNumber, '--repo', REPO, '--body-file', '-'], body);
} catch (e) {
  die(`dang comment that bai cho #${issueNumber}: ${e.message}`);
}
console.log(`[xong] #${issueNumber}: da dang QC checklist (${ac.length} AC item)${had ? ' [dang lai, --force]' : ''}.`);
