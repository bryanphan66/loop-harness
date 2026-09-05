#!/usr/bin/env node
/**
 * Dựng bảng issue của repo: milestone `Phase N` + nhãn `Module: <Tên>` + nhãn `plane`.
 *
 * Vì sao cần: chuẩn issue (docs/playbooks/github-issue-standard.md) nói Phase là
 * MILESTONE và Module là NHÃN CẤP REPO. `gh issue create --milestone "Phase 1"
 * --label "Module: X"` sẽ ĐỎ nếu hai thứ đó chưa tồn tại. Trên một dự án thật,
 * không bước nào của Macro 2 dựng chúng: repo chỉ có 9 nhãn mặc định của GitHub,
 * 0 milestone - nên mọi lệnh tạo issue chuẩn đều hỏng trước khi kịp chạy.
 *
 * Nguồn dữ liệu là thứ bước 2.3 vừa sinh ra, không phải khai lại:
 *   - docs/build-manifest.md  bảng phase  `| P0 | Tên | ... |`   -> milestone
 *   - docs/ROADMAP.md         bảng module `| M1 | Tên | ... |`   -> nhãn Module:
 *
 * MẶC ĐỊNH LÀ CHẠY THỬ. Đây là hành động ra ngoài trên repo tổ chức, nên phải
 * gõ `--apply` mới thật sự tạo. Chạy lại được: thứ đã có thì bỏ qua, không tạo trùng.
 *
 *   node scripts/setup-issue-board.mjs                 # in ra sẽ tạo gì
 *   node scripts/setup-issue-board.mjs --apply         # tạo thật
 *   node scripts/setup-issue-board.mjs --repo owner/x  # chỉ định repo
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { gateRoot, loadGateConfig } from './gate-lib.mjs';

const ROOT = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(ROOT).issueBoard ?? {};
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const repoFlag = args.indexOf('--repo');
const MANIFEST = resolve(ROOT, cfg.buildManifest ?? 'docs/build-manifest.md');
const ROADMAP = resolve(ROOT, cfg.roadmap ?? 'docs/ROADMAP.md');

function repoSlug() {
  if (repoFlag !== -1 && args[repoFlag + 1]) return args[repoFlag + 1];
  const r = spawnSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], {
    cwd: ROOT, encoding: 'utf8',
  });
  return (r.stdout ?? '').trim();
}
const REPO = repoSlug();
if (!REPO) {
  console.error('setup-issue-board: không xác định được repo. Truyền --repo owner/name.');
  process.exit(1);
}

/** Bỏ emoji dẫn đầu và khoảng trắng thừa - nhãn để đọc, không để trang trí. */
const clean = (s) => s.replace(/^[^\p{L}\p{N}]+/u, '').trim();

function rowsOf(file, re) {
  if (!existsSync(file)) return [];
  const out = new Map(); // id -> name (giữ lần xuất hiện ĐẦU: bảng chính đứng trước)
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(re);
    if (m && !out.has(m[1])) out.set(m[1], clean(m[2]));
  }
  return [...out.entries()].map(([id, name]) => ({ id, name }));
}

const phases = rowsOf(MANIFEST, /^\|\s*(P\d+)\s*\|\s*([^|]+?)\s*\|/);
const modules = rowsOf(ROADMAP, /^\|\s*(M\d+)\s*\|\s*([^|]+?)\s*\|/);

if (!phases.length) {
  console.error(`setup-issue-board: không đọc được phase nào từ ${MANIFEST}.`);
  console.error('  Mong bảng có dòng dạng: | P0 | Tên phase | ... |');
  process.exit(1);
}
if (!modules.length) {
  console.error(`setup-issue-board: không đọc được module nào từ ${ROADMAP}.`);
  console.error('  Mong bảng có dòng dạng: | M1 | Tên module | ... |');
  process.exit(1);
}

const gh = (a) => spawnSync('gh', a, { cwd: ROOT, encoding: 'utf8' });

// --- đang có gì -------------------------------------------------------------
const haveLabels = new Set(
  (gh(['label', 'list', '--repo', REPO, '--limit', '300', '--json', 'name', '-q', '.[].name']).stdout ?? '')
    .split('\n').map((s) => s.trim()).filter(Boolean),
);
const haveMilestones = new Set(
  (gh(['api', `repos/${REPO}/milestones?state=all&per_page=100`, '--jq', '.[].title']).stdout ?? '')
    .split('\n').map((s) => s.trim()).filter(Boolean),
);

const wantLabels = ['plane', ...modules.map((m) => `Module: ${m.name}`)];
const wantMilestones = phases.map((p) => ({ title: `Phase ${p.id.slice(1)}`, desc: p.name }));

const newLabels = wantLabels.filter((l) => !haveLabels.has(l));
const newMilestones = wantMilestones.filter((m) => !haveMilestones.has(m.title));

console.log(`repo ${REPO}`);
console.log(`  đọc được ${phases.length} phase, ${modules.length} module`);
console.log(`  nhãn:      có sẵn ${wantLabels.length - newLabels.length}/${wantLabels.length}, cần tạo ${newLabels.length}`);
console.log(`  milestone: có sẵn ${wantMilestones.length - newMilestones.length}/${wantMilestones.length}, cần tạo ${newMilestones.length}`);

if (!APPLY) {
  for (const l of newLabels) console.log(`  + nhãn      ${l}`);
  for (const m of newMilestones) console.log(`  + milestone ${m.title}  (${m.desc})`);
  console.log('\nCHẠY THỬ - chưa tạo gì. Gõ --apply để tạo thật.');
  process.exit(0);
}

let failed = 0;
for (const l of newLabels) {
  const color = l === 'plane' ? 'ededed' : '1d76db';
  const r = gh(['label', 'create', l, '--repo', REPO, '--color', color, '--description', 'macro-2 issue board']);
  if (r.status === 0) console.log(`  tạo nhãn      ${l}`);
  else { failed++; console.error(`  LỖI nhãn      ${l}: ${(r.stderr ?? '').trim().slice(0, 120)}`); }
}
for (const m of newMilestones) {
  const r = gh(['api', `repos/${REPO}/milestones`, '-f', `title=${m.title}`, '-f', `description=${m.desc}`]);
  if (r.status === 0) console.log(`  tạo milestone ${m.title}`);
  else { failed++; console.error(`  LỖI milestone ${m.title}: ${(r.stderr ?? '').trim().slice(0, 120)}`); }
}
console.log(failed ? `\nXong nhưng ${failed} mục lỗi.` : '\nXong, bảng issue đã dựng đủ.');
process.exit(failed ? 1 : 0);
