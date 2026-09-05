#!/usr/bin/env node
/**
 * check-ui-region-boundary.mjs — gate `ui-region-boundary` (macro-2 MD-02)
 *
 * Một dự án có hai vùng UI và chúng KHÔNG cùng luật:
 *
 *   public  — custom 100%, bê từ prototype đã freeze. Không dùng thư viện.
 *   portal  — ~99% dùng component thư viện. 1% custom nào tái dùng được thì
 *             đẩy ngược lên thư viện gốc, không để lại trong dự án.
 *
 * Lint chặn màu cứng (`check-no-hardcoded-hex.mjs`, `no-raw-color` của reno-ui)
 * KHÔNG chặn được việc tự viết component mới — và đó mới là rò rỉ thật. Tới phase
 * 3-4 thì portal đầy nút và ô nhập tự chế, mỗi cái lệch token một kiểu, và lần
 * nâng cấp thư viện không mang chúng theo được.
 *
 * Gate này kiểm ba luật:
 *
 *   A. PORTAL — không tự vẽ primitive.  File trong vùng portal không được render
 *      thẳng <button>/<input>/<select>/<textarea>/<dialog> mà phải dùng component
 *      thư viện. Đây là chỗ agent hay "custom cho nhanh".
 *   B. THƯ VIỆN — chỉ chứa đồ thư viện.  Mọi file trong <libraryDir> phải là một
 *      mục có thật của registry. File tự viết lén vào đó sẽ bị lần sync sau ghi
 *      đè mất, im lặng.
 *   C. PUBLIC — chỉ cảnh báo.  Quét màu cứng nhưng KHÔNG chặn: trang public là
 *      custom 100%, màu của nó đến từ bộ HTML khách cung cấp.
 *
 * Cấu hình: khối `uiRegions` trong scripts/gate-config.json. Không khai thì gate
 * bỏ qua với một dòng báo — đừng để nó im lặng xanh.
 *
 * Opt-out cho luật A: thêm comment `ui-ok:` cùng dòng kèm lý do. Ví dụ:
 *   <button ref={triggerRef} className="sr-only" />   // ui-ok: focus trap sentinel
 *
 *   node scripts/check-ui-region-boundary.mjs           # exit 1 nếu vi phạm A hoặc B
 *   node scripts/check-ui-region-boundary.mjs --json
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, basename } from "node:path";

const ROOT = process.cwd();
const asJson = process.argv.includes("--json");

const CONFIG_PATH = join(ROOT, "scripts/gate-config.json");
const cfg = existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, "utf8")) : {};
const regions = cfg.uiRegions ?? null;

/** Primitive mà thư viện chắc chắn đã có — tự vẽ là đi vòng qua thư viện. */
const LIBRARY_PRIMITIVES = ["button", "input", "select", "textarea", "dialog"];

const SKIP_DIRS = new Set(["node_modules", "dist", ".next", ".turbo", "coverage", "e2e", "e2e-ui"]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

/** Glob rất hẹp: chỉ cần `dir/**` và đường dẫn trần. Không kéo thêm phụ thuộc. */
function matches(relPath, patterns) {
  return (patterns ?? []).some((p) => {
    const base = p.replace(/\/\*\*?$/, "").replace(/\/$/, "");
    return relPath === base || relPath.startsWith(base + "/");
  });
}

/** Bỏ comment để khỏi bắt nhầm ví dụ trong chú thích. */
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const errors = [];
const warnings = [];
const notes = [];

if (!regions) {
  notes.push(
    "gate-config.json chưa khai `uiRegions` — gate không kiểm được gì. Khai public/portal/libraryDir rồi chạy lại.",
  );
} else {
  const libDir = regions.libraryDir ?? "apps/web/src/components/ui";
  const allow = new Set(regions.allowlist ?? []);
  const scanRoots = [...(regions.public ?? []), ...(regions.portal ?? []), libDir]
    .map((p) => p.replace(/\/\*\*?$/, ""))
    .filter((p, i, a) => a.indexOf(p) === i);

  const files = scanRoots.flatMap((r) => walk(resolve(ROOT, r))).map((f) => relative(ROOT, f));

  if (files.length === 0) {
    notes.push(
      `chưa có file .tsx nào trong ${scanRoots.join(", ")} — dự án chưa scaffold (bước 2.4). Gate sẽ có hiệu lực khi có code.`,
    );
  }

  // --- Luật B: thư viện chỉ chứa đồ thư viện ---
  const registryNames = new Set();
  const regPath = regions.registryFile ? resolve(ROOT, regions.registryFile) : null;
  if (regPath && existsSync(regPath)) {
    const reg = JSON.parse(readFileSync(regPath, "utf8"));
    for (const item of reg.items ?? []) registryNames.add(item.name);
  }

  for (const f of files) {
    const rel = f;
    if (!matches(rel, [libDir])) continue;
    if (/\.(test|spec)\.(tsx|jsx)$/.test(rel)) continue; // file test không phải đồ thư viện
    const stem = basename(rel).replace(/\.(tsx|jsx)$/, "");
    if (registryNames.size === 0) continue; // không có registry để đối chiếu
    if (!registryNames.has(stem) && !allow.has(rel)) {
      errors.push({
        rule: "B-thu-vien",
        file: rel,
        note: `"${stem}" không phải mục của registry. File tự viết trong thư mục thư viện sẽ bị lần sync sau ghi đè mất — nâng ở repo thư viện gốc rồi kéo xuống.`,
      });
    }
  }

  // --- Luật A: portal không tự vẽ primitive ---
  for (const f of files) {
    if (!matches(f, regions.portal)) continue;
    if (matches(f, [libDir])) continue;
    const raw = readFileSync(resolve(ROOT, f), "utf8");
    const src = stripComments(raw);
    const lines = raw.split("\n");
    for (const tag of LIBRARY_PRIMITIVES) {
      const re = new RegExp(`<${tag}[\\s/>]`, "g");
      if (!re.test(src)) continue;
      lines.forEach((line, i) => {
        if (!new RegExp(`<${tag}[\\s/>]`).test(line)) return;
        if (line.includes("ui-ok:")) return;
        if (allow.has(f)) return;
        errors.push({
          rule: "A-portal",
          file: `${f}:${i + 1}`,
          note: `vùng portal tự vẽ <${tag}>. Dùng component thư viện; thật sự cần thì thêm comment "ui-ok: <lý do>" cùng dòng.`,
        });
      });
    }
  }

  // --- Luật C: public chỉ cảnh báo màu cứng ---
  const HEX = /#[0-9a-fA-F]{3,8}\b/;
  for (const f of files) {
    if (!matches(f, regions.public)) continue;
    const lines = readFileSync(resolve(ROOT, f), "utf8").split("\n");
    lines.forEach((line, i) => {
      if (!HEX.test(stripComments(line))) return;
      warnings.push({
        rule: "C-public",
        file: `${f}:${i + 1}`,
        note: "màu cứng ở vùng public — chấp nhận được (custom 100%), chỉ nhắc để biết.",
      });
    });
  }
}

const result = {
  gate: "ui-region-boundary",
  configured: Boolean(regions),
  errors,
  warnings: warnings.length,
  notes,
  pass: errors.length === 0,
};

if (asJson) {
  console.log(JSON.stringify({ ...result, warningList: warnings }, null, 2));
} else {
  console.log("[ui-region-boundary]");
  for (const n of notes) console.log(`  GHI CHU: ${n}`);
  for (const e of errors) {
    console.log(`  LOI  [${e.rule}] ${e.file}`);
    console.log(`       ${e.note}`);
  }
  if (warnings.length) {
    console.log(`  CANH BAO: ${warnings.length} màu cứng ở vùng public (không chặn)`);
    for (const w of warnings.slice(0, 5)) console.log(`       ${w.file}`);
    if (warnings.length > 5) console.log(`       ... và ${warnings.length - 5} chỗ nữa`);
  }
  console.log(result.pass ? "[ui-region-boundary] XANH" : `[ui-region-boundary] DO — ${errors.length} vi phạm`);
}

process.exit(result.pass ? 0 : 1);
