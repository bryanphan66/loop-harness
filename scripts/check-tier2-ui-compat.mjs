#!/usr/bin/env node
/**
 * check-tier2-ui-compat.mjs - gate `tier2-ui-compat` (macro-2 buoc 2.0)
 *
 * Hoi dung mot cau: tier-2 token cua du an co chay duoc voi thu vien UI da chon
 * khong. Chay TRUOC 2.4, luc `src/` con rong - luc do sua gan nhu 0 cong. Sau
 * 2.4/2.6 thi moi man da bam vao cach viet token cu, sua tot ~1 tuan.
 *
 * Lich su: MD-01. autocontent dinh dung reno-ui, reno-ui bat buoc Tailwind v4,
 * con tier-2 sinh o buoc 1.10 la kieu v3 (triplet HSL tran + tailwind.config.ts).
 * Khong ai bat duoc vi macro-2 khong co buoc nao hoi cau nay.
 *
 * Cach dung:
 *   node check-tier2-ui-compat.mjs <thu-muc-thu-vien-ui> <file-css-tier2> [--json]
 *
 * Vi du:
 *   node scripts/check-tier2-ui-compat.mjs \
 *     ../reno-ui docs/design/design-tokens/globals.css
 *
 * Kiem 3 thu:
 *   1. Phien ban tailwindcss cua thu vien vs cua du an (major phai khop).
 *      Du an chua co package.json -> canh bao, khong chan (chua toi 2.4).
 *   2. Moi token thu vien DOC (var(--x) trong khoi @theme) phai co trong tier-2.
 *   3. Tier-2 khong con cu phap v3 khi thu vien doi v4: triplet tran,
 *      hsl(var(--x)), --tw-ring-*.
 *
 * Exit 0 = xanh. Exit 1 = co loi chan. Canh bao khong lam do gate.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const [, , libDirArg, tier2Arg, ...rest] = process.argv;
const asJson = rest.includes("--json");

if (!libDirArg || !tier2Arg) {
  console.error(
    "dung: node check-tier2-ui-compat.mjs <thu-muc-thu-vien-ui> <file-css-tier2> [--json]",
  );
  process.exit(2);
}

const libDir = resolve(libDirArg);
const tier2Path = resolve(tier2Arg);
const errors = [];
const warnings = [];

/** Doc file, tra chuoi rong neu khong co. */
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

/**
 * Bo comment CSS truoc khi quet cu phap.
 * Khong bo thi header cua chinh file token ("da doi hsl(var(--x)) -> var(--x)")
 * bi dem la loi. Da dinh that o autocontent lan chay dau.
 */
const stripCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Duyet cay thu muc tim file theo duoi, bo qua node_modules va .git. */
function walk(dir, ext, out = [], depth = 0) {
  if (depth > 6 || !existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, ext, out, depth + 1);
    else if (name.endsWith(ext)) out.push(full);
  }
  return out;
}

// --- 1) Phien ban build tool -----------------------------------------------

const libPkg = read(join(libDir, "package.json"));
let libTw = null;
if (libPkg) {
  const pkg = JSON.parse(libPkg);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  libTw = deps.tailwindcss ?? null;
}

// package.json cua du an: cwd la goc du an khi chay tu git hook
const projPkgPath = join(process.cwd(), "package.json");
const projPkg = read(projPkgPath);
let projTw = null;
if (projPkg) {
  const pkg = JSON.parse(projPkg);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  projTw = deps.tailwindcss ?? null;
}

const major = (v) => (v ? String(v).replace(/^[^\d]*/, "").split(".")[0] : null);

if (!libTw) {
  warnings.push(`khong doc duoc phien ban tailwindcss cua thu vien tai ${libDir}`);
} else if (!projTw) {
  warnings.push(
    `du an chua co package.json/tailwindcss (chua toi 2.4). Thu vien doi tailwindcss ${libTw} - buoc 2.4 phai cai dung major ${major(libTw)}.`,
  );
} else if (major(libTw) !== major(projTw)) {
  errors.push(
    `phien ban tailwindcss lech major: thu vien ${libTw}, du an ${projTw}. Thu vien khong co che do tuong thich nguoc.`,
  );
}

// --- 2) Token thu vien doc vs token tier-2 co ------------------------------

const libCssFiles = walk(libDir, ".css");
const themeBlocks = [];
for (const f of libCssFiles) {
  const css = read(f);
  const m = stripCss(css).match(/@theme[^{]*\{([\s\S]*?)\n\}/);
  if (m) themeBlocks.push({ file: f, body: m[1] });
}

if (themeBlocks.length === 0) {
  warnings.push(`khong tim thay khoi @theme trong ${libDir} - bo qua buoc so ten token`);
}

const needed = new Set();
for (const { body } of themeBlocks) {
  for (const m of body.matchAll(/var\(--([a-z0-9-]+)\)/g)) needed.add(m[1]);
}

const tier2 = read(tier2Path);
const tier2Code = stripCss(tier2);
if (!tier2) {
  errors.push(`khong doc duoc file tier-2: ${tier2Path}`);
}
const have = new Set([...tier2Code.matchAll(/^\s*--([a-z0-9-]+)\s*:/gm)].map((m) => m[1]));

const missing = [...needed].filter((t) => !have.has(t)).sort();
if (missing.length) {
  errors.push(
    `tier-2 thieu ${missing.length} token thu vien doc: ${missing.map((t) => "--" + t).join(", ")}`,
  );
}

// --- 3) Cu phap v3 con sot khi thu vien doi v4 -----------------------------

if (major(libTw) === "4" && tier2Code) {
  const triplets = [...tier2Code.matchAll(/^\s*--[a-z0-9-]+:\s*[\d.]+\s+[\d.]+%\s+[\d.]+%\s*;/gm)];
  if (triplets.length) {
    errors.push(
      `tier-2 con ${triplets.length} token viet kieu v3 (triplet tran, vd "221 83% 53%"). v4 can gia tri mau day du: hsl(221 83% 53%).`,
    );
  }
  const wrapped = (tier2Code.match(/hsl\(var\(/g) || []).length;
  if (wrapped) {
    errors.push(`tier-2 con ${wrapped} cho dung hsl(var(--x)) - v4 thi var(--x) da la mau day du.`);
  }
  const twRing = (tier2Code.match(/--tw-ring-/g) || []).length;
  if (twRing) {
    warnings.push(`tier-2 con ${twRing} cho dung --tw-ring-* (bien noi bo cua v3, v4 khong co).`);
  }
  if (!/@theme/.test(tier2Code)) {
    errors.push(
      `tier-2 khong co khoi @theme. v4 khong doc tailwind.config.ts nua - anh xa ten utility phai nam trong css.`,
    );
  }
}

// --- Bao cao ---------------------------------------------------------------

const result = {
  gate: "tier2-ui-compat",
  uiLibrary: libDir,
  tier2: tier2Path,
  libTailwind: libTw,
  projectTailwind: projTw,
  tokensNeeded: needed.size,
  tokensHave: have.size,
  missing,
  errors,
  warnings,
  pass: errors.length === 0,
};

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`[tier2-ui-compat] thu vien: ${libDir}`);
  console.log(`[tier2-ui-compat] tier-2:   ${tier2Path}`);
  console.log(
    `[tier2-ui-compat] tailwindcss: thu vien ${libTw ?? "?"} | du an ${projTw ?? "chua co"}`,
  );
  console.log(`[tier2-ui-compat] token: thu vien doc ${needed.size}, tier-2 co ${have.size}`);
  for (const w of warnings) console.log(`  CANH BAO: ${w}`);
  for (const e of errors) console.log(`  LOI: ${e}`);
  console.log(result.pass ? "[tier2-ui-compat] XANH" : "[tier2-ui-compat] DO");
}

process.exit(result.pass ? 0 : 1);
