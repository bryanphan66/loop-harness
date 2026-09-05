#!/usr/bin/env node
/**
 * Cổng: chuỗi trạng thái issue mà tài liệu quy trình DẶN phải đi được thật.
 *
 * Vì sao có: bảng `TRANSITIONS` trong `issue-state.mjs` là luật, và nó fail-closed -
 * đi một nước không có trong bảng là bị chặn cứng. Nhưng goal-text lại viết bằng
 * văn xuôi, không ai đối chiếu. Hai lỗi thật tìm được bằng cách đọc tay:
 *
 *   - 2.13 dặn "bắt đầu deploy -> `Deploying`; xong -> `Done`". Vào 2.13 issue đang ở
 *     `UAT Testing`, mà từ đó KHÔNG có đường sang `Deploying`, và `Deploying` cũng
 *     không có đường sang `Done`. Làm đúng lời dặn là bị chặn hai lần.
 *   - Giữa 2.6 (`In Dev`) và 2.10 (`QC Testing`) không bước nào nhận hai nấc
 *     `Deploying` và `Ready for Test`, nên đường khai báo là `In Dev -> QC Testing` -
 *     cũng là một nước bảng cấm.
 *
 * Cả hai không ai phát hiện vì 2.10 và 2.13 CHƯA TỪNG CHẠY THẬT. Một lỗi chỉ lộ khi
 * chạy tới thì phải bắt được bằng đọc, không thì nó nằm đó tới đúng ngày go-live.
 *
 *   node scripts/check-issue-state-path.mjs
 *
 * Nguồn luật là `issue-state.mjs` - đọc thẳng bảng từ đó, KHÔNG chép lại. Hai nơi
 * cùng trả lời một câu hỏi thì phải dùng chung một nguồn (bài học MD-12).
 *
 * Fail-closed: đọc ra 0 trạng thái ở tài liệu, hoặc 0 dòng ở bảng, đều là ĐỎ.
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateRoot, readSafe } from './gate-lib.mjs';

function docsRoot(start) {
  let d = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(resolve(d, 'docs/process'))) return d;
    const up = dirname(d);
    if (up === d) break;
    d = up;
  }
  return start;
}
const ROOT = docsRoot(gateRoot(dirname(fileURLToPath(import.meta.url))));

// --- luật: bảng TRANSITIONS, đọc từ issue-state.mjs -------------------------
const STATE_SRC = ['.harness/steady-state/scripts/issue-state.mjs', 'scaffolds/steady-state/scripts/issue-state.mjs']
  .map((p) => resolve(ROOT, p))
  .find(existsSync);
if (!STATE_SRC) {
  console.error('✗ [state-path] không thấy issue-state.mjs - không đọc được bảng luật, cổng mù. Dừng.');
  process.exit(1);
}
const block = readSafe(STATE_SRC).match(/const TRANSITIONS = \{([\s\S]*?)\n\};/);
const EDGES = new Map();
for (const line of (block?.[1] ?? '').split('\n')) {
  const m = line.match(/'([^']+)':\s*\[([^\]]*)\]/);
  if (!m) continue;
  EDGES.set(
    m[1],
    [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]),
  );
}
if (EDGES.size === 0) {
  console.error(`✗ [state-path] đọc ${STATE_SRC} ra 0 dòng luật - hình dạng bảng đổi, cổng mù. Sửa cổng trước khi tin.`);
  process.exit(1);
}
const STATES = [...new Set([...EDGES.keys(), ...[...EDGES.values()].flat()])];

// --- lời dặn: chuỗi trạng thái theo thứ tự bước ------------------------------
const goals = resolve(ROOT, 'docs/process/STAGE_GOALS.md');
const goalsAlt = resolve(ROOT, 'docs/STAGE_GOALS.md');
const GOAL_FILE = existsSync(goals) ? goals : goalsAlt;
if (!existsSync(GOAL_FILE)) {
  console.error('✗ [state-path] không thấy STAGE_GOALS.md - không có lời dặn để đối chiếu.');
  process.exit(1);
}
const parts = readSafe(GOAL_FILE).split(/\n### Step (2\.\d+\w?) /);
const seq = [];
for (let i = 1; i < parts.length; i += 2) {
  for (const m of parts[i + 1].matchAll(/"([^"]{2,20})"/g)) {
    if (!STATES.includes(m[1])) continue;
    if (seq.length && seq[seq.length - 1][1] === m[1]) continue;
    seq.push([parts[i], m[1]]);
  }
}
if (seq.length === 0) {
  console.error('✗ [state-path] không đọc ra trạng thái nào trong STAGE_GOALS.md - quét trượt, cổng mù.');
  process.exit(1);
}

console.log(`[state-path] ${seq.map(([s, st]) => `${s}:${st}`).join(' -> ')}`);
const bad = [];
for (let i = 1; i < seq.length; i++) {
  const [pStep, from] = seq[i - 1];
  const [step, to] = seq[i];
  if (!(EDGES.get(from) ?? []).includes(to)) bad.push({ pStep, from, step, to });
}
if (bad.length) {
  for (const b of bad) {
    console.error(
      `  CẤM: ${b.pStep} để issue ở "${b.from}", ${b.step} dặn đẩy sang "${b.to}" - ` +
        `từ "${b.from}" bảng chỉ cho: ${(EDGES.get(b.from) ?? []).join(', ') || '(không đường nào)'}`,
    );
  }
  console.error(
    `✗ [state-path] ${bad.length} nước đi tài liệu dặn mà bảng TRANSITIONS cấm. ` +
      'Agent làm đúng lời dặn sẽ bị gate chặn cứng. Sửa goal-text, hoặc sửa bảng - đừng để hai bên nói khác nhau.',
  );
  process.exit(1);
}
console.log(`✓ [state-path] ${seq.length} nấc, mọi nước đi đều hợp lệ theo TRANSITIONS`);
