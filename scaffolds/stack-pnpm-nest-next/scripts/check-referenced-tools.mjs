#!/usr/bin/env node
/**
 * Cổng: mọi công cụ mà tài liệu quy trình GỌI TÊN phải có thật trong bộ kit.
 *
 * Vì sao có: `harness-drift.sh` được tài liệu nhắc tới nhưng **không nằm trong
 * bộ kit** - nó chỉ tồn tại trong MỘT dự án, vì người viết viết nó ở đó rồi
 * không đẩy ngược lên. Dự án thứ hai chạy Macro 2 sẽ gặp "command not found".
 *
 * Lỗi này không thấy được bằng mắt: tài liệu đọc rất hợp lý, script chạy rất
 * tốt - ở cái máy đã có nó. Chỉ máy thứ hai mới lộ.
 *
 * Công cụ có thể nằm ở BA chỗ và cổng phải chấp nhận cả ba: gốc repo (danh
 * sách skeleton của installer, ví dụ `scripts/measure-macro2.mjs`), bộ khung
 * stack (`scaffolds/stack-pnpm-nest-next/`), và kit steady-state. Chỉ tìm một
 * chỗ rồi kết luận "thiếu" là báo động giả - đúng cái bẫy tôi đã dính khi viết
 * cổng này, tưởng `measure-macro2.mjs` thiếu vì chỉ nhìn trong `scaffolds/`.
 *
 *   node scripts/check-referenced-tools.mjs
 *
 * Quét `node <path>` và `bash <path>` trong tài liệu quy trình, đối chiếu với
 * file có thật. Fail-closed: quét ra 0 lời gọi cũng là ĐỎ - tài liệu không thể
 * không gọi công cụ nào, nên 0 nghĩa là regex hỏng chứ không phải sạch.
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateRoot, readSafe, walk } from './gate-lib.mjs';

// Script này chạy ở HAI nơi: trong dự án đã cài kit, và trong chính repo harness
// (nơi kit còn nằm dưới `scaffolds/`). `gateRoot` dừng ở gốc kit, mà ở repo
// harness gốc kit là `scaffolds/stack-pnpm-nest-next/` - chỗ không có
// `docs/process/`. Nên leo tiếp lên tới thư mục CÓ tài liệu quy trình.
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
// Quét cả `docs/about/` và các file .md ở gốc repo (CLAUDE.md, AGENTS.md,
// README.md): lời gọi công cụ hay nằm đúng ở đó, và bỏ sót chúng thì cổng lại
// xanh trên một lỗ thật - lần đầu chạy cổng này nó xanh đúng như vậy.
const DOC_DIRS = ['docs/process', 'docs/gates', 'docs/playbooks', 'docs/about'];
const ROOT_DOCS = ['CLAUDE.md', 'AGENTS.md', 'README.md'];
const CALL = /\b(?:node|bash)\s+([A-Za-z0-9_./-]+\.(?:mjs|sh))/g;

const calls = new Map(); // path -> [doc]
for (const d of DOC_DIRS) {
  const abs = resolve(ROOT, d);
  if (!existsSync(abs)) continue;
  for (const f of walk(abs, (p) => p.endsWith('.md'))) {
    for (const m of readSafe(f).matchAll(CALL)) {
      const p = m[1];
      if (!calls.has(p)) calls.set(p, []);
      const rel = f.replace(`${ROOT}/`, '');
      if (!calls.get(p).includes(rel)) calls.get(p).push(rel);
    }
  }
}
for (const name of ROOT_DOCS) {
  const abs = resolve(ROOT, name);
  if (!existsSync(abs)) continue;
  for (const m of readSafe(abs).matchAll(CALL)) {
    const p = m[1];
    if (!calls.has(p)) calls.set(p, []);
    if (!calls.get(p).includes(name)) calls.get(p).push(name);
  }
}

if (calls.size === 0) {
  console.error(
    '✗ [referenced-tools] quét ra 0 lời gọi công cụ trong tài liệu quy trình. ' +
      'Tài liệu không thể không gọi công cụ nào - regex hỏng, cổng đang mù. Sửa cổng trước khi tin.',
  );
  process.exit(1);
}

// Nơi một đường dẫn được nhắc trong tài liệu có thể nằm: gốc repo (dự án đã cài
// kit), hoặc trong scaffold (repo harness, kit chưa bung ra).
const candidates = (p) => [
  resolve(ROOT, p),
  resolve(ROOT, 'scaffolds/stack-pnpm-nest-next', p),
  resolve(ROOT, 'scaffolds/steady-state', p.replace(/^\.harness\/steady-state\//, '')),
  resolve(ROOT, p.replace(/^\.harness\/stack-template\//, '')),
];

const missing = [];
for (const [p, docs] of [...calls].sort()) {
  if (!candidates(p).some(existsSync)) missing.push([p, docs]);
}

console.log(`[referenced-tools] ${calls.size} công cụ được tài liệu gọi tên`);
if (missing.length) {
  for (const [p, docs] of missing) console.error(`  THIẾU: ${p}  <- gọi trong ${docs.join(', ')}`);
  console.error(
    `✗ [referenced-tools] ${missing.length} công cụ được gọi mà không có trong kit. ` +
      'Viết nó, hoặc bỏ lời gọi khỏi tài liệu - đừng để tài liệu hứa một thứ chỉ có trên một máy.',
  );
  process.exit(1);
}
console.log(`✓ [referenced-tools] cả ${calls.size} công cụ đều có thật trong kit`);
