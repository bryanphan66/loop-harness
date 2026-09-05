#!/usr/bin/env node
/**
 * ui-sync.mjs — kéo component UI từ registry reno-ui xuống dự án.
 *
 * Dự án này KHÔNG tự viết component thư viện. Mọi primitive (button, input,
 * dialog...) là bản sao lấy từ registry dùng chung; sửa ở đây thì lần sync sau
 * ghi đè mất. Thiếu hay cần nâng thì nâng ở repo reno-ui gốc rồi kéo xuống.
 *
 * Nguồn sự thật: apps/web/reno-ui.manifest.json (danh sách component dự án dùng).
 *
 *   node scripts/ui-sync.mjs              cài theme + mọi component trong manifest,
 *                                         ghi lại apps/web/reno-registry.lock.json
 *   node scripts/ui-sync.mjs --check      không mạng, không sửa file: đối chiếu
 *                                         manifest <-> file thật <-> lock. Lệch thì thoát 1.
 *   node scripts/ui-sync.mjs --add badge  thêm tên vào manifest rồi cài
 *
 * Lock file giữ TOÀN BỘ tên mục của registry (không chỉ cái đã cài) để gate
 * check-ui-region-boundary.mjs đối chiếu được mà không cần mạng.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'apps/web');
const MANIFEST = join(WEB, 'reno-ui.manifest.json');
const LOCK = join(WEB, 'reno-registry.lock.json');
const LIB_DIR = join(WEB, 'src/components/ui');
const LIB_MISC_DIR = join(WEB, 'src/lib');
const HOOKS_DIR = join(WEB, 'src/hooks');

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const addIdx = args.indexOf('--add');
const toAdd = addIdx === -1 ? [] : args.slice(addIdx + 1).filter((a) => !a.startsWith('--'));

const fail = (msg) => {
  console.error(`ui-sync: ${msg}`);
  process.exit(1);
};

if (!existsSync(MANIFEST)) fail(`không thấy ${MANIFEST}. Dự án chưa khai component thư viện.`);
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const ns = manifest.namespace ?? '@reno';

if (toAdd.length) {
  const set = new Set(manifest.components ?? []);
  for (const c of toAdd) set.add(c);
  manifest.components = [...set].sort();
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`ui-sync: thêm vào manifest: ${toAdd.join(', ')}`);
}

/**
 * File/thư mục trong thư mục thư viện, bỏ test/spec. Một mục registry:ui có
 * thể cài thành file phẳng (`button.tsx`) HOẶC thư mục có `index.tsx`
 * (`chart/index.tsx`, `sidebar/index.tsx`) — cả hai đều hợp lệ, đếm theo tên
 * (không phải phần mở rộng).
 */
function libraryFiles() {
  if (!existsSync(LIB_DIR)) return [];
  const names = new Set();
  for (const f of readdirSync(LIB_DIR)) {
    const full = join(LIB_DIR, f);
    if (/\.(tsx|jsx)$/.test(f) && !/\.(test|spec)\.(tsx|jsx)$/.test(f)) {
      names.add(basename(f).replace(/\.(tsx|jsx)$/, ''));
    } else if (statSync(full).isDirectory() && existsSync(join(full, 'index.tsx'))) {
      names.add(f);
    }
  }
  return [...names];
}

/** Tên file .ts (bỏ .test/.spec) trực tiếp trong một thư mục — dùng cho registry:lib/hook. */
function flatTsFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.ts$/.test(f))
    .filter((f) => !/\.(test|spec)\.ts$/.test(f))
    .map((f) => basename(f).replace(/\.ts$/, ''));
}

// ---------------------------------------------------------------- --check
if (CHECK) {
  const problems = [];
  if (!existsSync(LOCK)) {
    problems.push(`thiếu ${basename(LOCK)} — chạy \`pnpm ui:sync\` một lần để sinh ra.`);
  }
  const lock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : { items: [] };
  const typeByName = new Map((lock.items ?? []).map((i) => [i.name, i.type]));
  const known = new Set(typeByName.keys());
  const onDiskUi = libraryFiles();
  const onDiskLib = flatTsFiles(LIB_MISC_DIR);
  const onDiskHooks = flatTsFiles(HOOKS_DIR);
  const wanted = manifest.components ?? [];

  for (const c of wanted) {
    const type = typeByName.get(c);
    const onDisk =
      type === 'registry:lib'
        ? onDiskLib.includes(c)
        : type === 'registry:hook'
          ? onDiskHooks.includes(c)
          : // unknown type (lock stale/missing) — accept any location as a fallback
            onDiskUi.includes(c) || onDiskLib.includes(c) || onDiskHooks.includes(c);
    if (!onDisk) problems.push(`manifest khai "${c}" nhưng chưa có file — chạy \`pnpm ui:sync\`.`);
  }
  for (const f of onDiskUi) {
    if (known.size && !known.has(f)) {
      problems.push(
        `"${f}" nằm trong thư mục thư viện nhưng không phải mục của registry — nâng ở repo reno-ui rồi kéo xuống, đừng viết tay.`,
      );
    }
  }
  if (problems.length) {
    console.error('ui-sync --check: LỆCH');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`ui-sync --check: OK (${onDiskUi.length} component, lock ${lock.fetchedAt ?? '?'})`);
  process.exit(0);
}

// ---------------------------------------------------------------- cài
const items = [manifest.theme, ...(manifest.components ?? [])]
  .filter(Boolean)
  .map((n) => `${ns}/${n}`);
console.log(`ui-sync: cài ${items.length} mục từ ${manifest.url}`);
const res = spawnSync('pnpm', ['dlx', 'shadcn@latest', 'add', ...items, '--yes', '--overwrite'], {
  cwd: WEB,
  stdio: 'inherit',
});
if (res.status !== 0) {
  fail(
    `shadcn add thoát mã ${res.status}. Kiểm mạng và apps/web/components.json (khoá "registries").`,
  );
}

// ---------------------------------------------------------------- lock
const indexUrl = manifest.index ?? manifest.url?.replace('{name}', 'registry');
let lockItems = [];
try {
  const r = await fetch(indexUrl, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const reg = await r.json();
  lockItems = (reg.items ?? []).map((i) => ({ name: i.name, type: i.type }));
} catch (e) {
  fail(
    `không lấy được danh mục registry ở ${indexUrl}: ${e.message}. Component đã cài nhưng lock chưa ghi — gate luật B sẽ tắt.`,
  );
}
writeFileSync(
  LOCK,
  `${JSON.stringify(
    {
      _doc: 'Danh mục registry reno-ui chụp lại lúc sync. Gate check-ui-region-boundary.mjs đọc file này để biết tên nào là đồ thư viện. Sinh ra bởi scripts/ui-sync.mjs — đừng sửa tay.',
      namespace: ns,
      index: indexUrl,
      fetchedAt: new Date().toISOString(),
      installed: [manifest.theme, ...(manifest.components ?? [])].filter(Boolean),
      items: lockItems,
    },
    null,
    2,
  )}\n`,
);
console.log(`ui-sync: xong. lock ghi ${lockItems.length} tên mục -> apps/web/${basename(LOCK)}`);
