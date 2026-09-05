#!/usr/bin/env node
/**
 * Cổng: bản `.md` của feature-register phải nói ĐÚNG cái mà bản `.json` nói -
 * từng dòng, ở cột Phase.
 *
 * Vì sao có: register là nguồn sự thật về PHẠM VI (macro-2.md § Ba nguồn sự
 * thật). Nhưng nó tồn tại ở HAI bản - `.json` là bản máy đọc, `.md` là bản
 * người đọc - và không có script nào sinh bản này từ bản kia. Trên lượt chạy
 * thật, `.json` khai `"phase": "Phase 2"` ở cấp DÒNG cho 8 tính năng (đè lên
 * `phase` cấp section), bản `.md` bỏ qua khoá cấp dòng và in cả 8 thành
 * `Phase 1`. Một dòng còn tự nói ra trong chính tên nó: "Kết nối và đăng video
 * lên TikTok - hoãn sang giai đoạn 2", mà cột Phase vẫn ghi Phase 1.
 *
 * Hậu quả không phải lý thuyết: `IF.PROVIDER.07` nằm trong 8 dòng đó, và đã
 * được code xong ở P1.2 - xây một thứ khách đã hoãn, không cổng nào kêu.
 *
 * Nguồn sự thật ở đây là `.json` (bản khai), `.md` là bản render. Lệch thì SỬA
 * `.md`, không sửa `.json` cho khớp - đó là bẻ khai báo phạm vi theo bản in.
 *
 *   node scripts/check-register-phase.mjs
 *
 * Fail-closed: parse ra 0 dòng ở một trong hai bản là ĐỎ, không phải xanh rỗng.
 * Bài học `check-manifest-coverage`: một cổng đọc trượt rồi báo xanh nguy hiểm
 * hơn hẳn một cổng đỏ oan.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateRoot, loadGateConfig, resolveRegisterJson } from './gate-lib.mjs';

const root = gateRoot(dirname(fileURLToPath(import.meta.url)));
const cfg = loadGateConfig(root);
const say = (m) => console.log(m);
const fail = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};
const ok = (m) => {
  console.log(`✓ ${m}`);
  process.exit(0);
};
const jsonPath = resolveRegisterJson(root, cfg.register ?? {});
if (!existsSync(jsonPath)) fail(`register-phase: không thấy bản .json: ${jsonPath}`);

// Bản .md nằm cạnh, cùng tên, bỏ hậu tố nguồn.
const mdName = basename(jsonPath).replace(/[-.]source\.json$/, '.md');
const mdPath = cfg.register?.registerMd
  ? join(root, cfg.register.registerMd)
  : join(dirname(jsonPath), mdName);
if (!existsSync(mdPath)) fail(`register-phase: không thấy bản .md: ${mdPath}`);

/** phase hiệu lực của một dòng = phase cấp dòng nếu có, không thì phase của section. */
function rowsFromJson(data) {
  const out = new Map();
  const groups = [...(data.sections ?? []), ...(data.out_of_scope ? [data.out_of_scope] : [])];
  for (const g of groups) {
    const secPhase = String(g.phase ?? '').trim();
    for (const r of g.rows ?? []) {
      const name = String(r.feature ?? r.name ?? '').trim();
      if (!name) continue;
      out.set(name, String(r.phase ?? secPhase).trim());
    }
  }
  return out;
}

/** dòng bảng markdown: | # | Tính năng | Mô tả | Phase | Xác nhận | */
function rowsFromMd(text) {
  const out = new Map();
  for (const line of text.split('\n')) {
    if (!line.startsWith('| ')) continue;
    const c = line.split('|');
    if (c.length < 6) continue;
    const name = c[2].trim();
    const phase = c[4].trim();
    if (!name || !/^Phase\s/.test(phase)) continue;
    out.set(name, phase);
  }
  return out;
}

const fromJson = rowsFromJson(JSON.parse(readFileSync(jsonPath, 'utf8')));
const fromMd = rowsFromMd(readFileSync(mdPath, 'utf8'));

if (fromJson.size === 0)
  fail(
    `register-phase: đọc ${jsonPath} ra 0 dòng - cấu trúc đổi, gate mù. Sửa gate trước khi tin.`,
  );
if (fromMd.size === 0)
  fail(`register-phase: đọc ${mdPath} ra 0 dòng có cột Phase - cấu trúc bảng đổi, gate mù.`);

const mismatch = [];
const missingInMd = [];
for (const [name, phase] of fromJson) {
  if (!fromMd.has(name)) {
    missingInMd.push(name);
    continue;
  }
  if (fromMd.get(name) !== phase) mismatch.push([name, phase, fromMd.get(name)]);
}
const extraInMd = [...fromMd.keys()].filter((n) => !fromJson.has(n));

say(`[register-phase] .json ${fromJson.size} dòng, .md ${fromMd.size} dòng có Phase`);
for (const [n, j, m] of mismatch) say(`  lệch: "${n}" - .json=${j}, .md=${m}`);
for (const n of missingInMd) say(`  chỉ có trong .json: "${n}"`);
for (const n of extraInMd) say(`  chỉ có trong .md: "${n}"`);

if (mismatch.length) {
  fail(
    `register-phase: ${mismatch.length} dòng lệch cột Phase giữa .json và .md. ` +
      `Nguồn là .json - sửa bản .md cho khớp, đừng sửa ngược.`,
  );
}
if (missingInMd.length) {
  fail(
    `register-phase: ${missingInMd.length} dòng có trong .json mà bản .md không in ra - người đọc không thấy chúng.`,
  );
}
if (extraInMd.length) {
  say(
    `[register-phase] cảnh báo: ${extraInMd.length} dòng chỉ có trong .md (CR thêm sau chưa ghi ngược vào .json)`,
  );
}
ok(`[register-phase] ${fromJson.size} dòng khớp cột Phase giữa hai bản`);
