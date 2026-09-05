#!/usr/bin/env node
/**
 * check-dangling-refs.mjs - gate `dangling-refs`
 *
 * Hoi mot cau: moi thu BANG QUY TRINH goi ten co ton tai that khong.
 *
 * Lich su: 3 trong 5 delta dau tien cua macro-2 deu la tham chieu treo, cung mot
 * hinh dang - harness goi ten mot thu, thu do khong co, va KHONG CO GI BAO. Agent
 * doc bang, di tim, khong thay, roi im lang lam kieu khac.
 *   MD-03  macro-2.md cot Playbook goi `e2e-qa-field-by-field`, file that ten
 *          `e2e-qa-field-by-field-verify-with-report.md`
 *   MD-04  spine copy sang du an layout khac -> 4 link tuong doi gay
 *   MD-05  WORKFLOW.md buoc 1.10 cot Engine goi `ck-design-system` +
 *          `ck-brand-guidelines`, ca hai khong ton tai trong bo skill dang cai
 *
 * PHAM VI HEP LA CO Y. Ban dau gate quet moi backtick trong moi file markdown va
 * ra 418 ket qua - phan lon la bao cao cu trong plans/ va ten artifact ma DU AN
 * sinh ra (VISION_SCOPE.md, tokens.css, vi.json), harness khong co la dung. Gate
 * on ao thi khong ai doc. Nen no chi soi:
 *   - o CAC FILE QUY TRINH (macro-*.md, WORKFLOW.md, hoac file truyen tay)
 *   - o CAC COT co nghia file (Playbook / Gate / Mau tai lieu / Script / Engine)
 *   - cong voi link tuong doi trong chinh nhung file do
 * Van xuoi ngoai bang khong bi soi: nhac ten mot thu khong phai la tro toi no.
 *
 * Cach dung:
 *   node check-dangling-refs.mjs [thu-muc-goc] [--file <path>]... [--engines <dir>] [--json]
 *
 * Vi du:
 *   node scripts/check-dangling-refs.mjs . --engines ~/.claude
 *   node scripts/check-dangling-refs.mjs . --file docs/WORKFLOW.md --engines ~/.claude
 *
 * Exit 0 = khong co tham chieu treo. Exit 1 = co.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, basename, relative } from "node:path";

const argv = process.argv.slice(2);
const asJson = argv.includes("--json");

const takeAll = (flag) => {
  const out = [];
  for (let i = 0; i < argv.length; i++) if (argv[i] === flag && argv[i + 1]) out.push(argv[i + 1]);
  return out;
};
const flagValues = new Set([...takeAll("--file"), ...takeAll("--engines")]);
const positional = argv.filter((a) => !a.startsWith("--") && !flagValues.has(a));

const root = resolve(positional[0] ?? ".");
const enginesDir = takeAll("--engines")[0]
  ? resolve(takeAll("--engines")[0].replace(/^~/, process.env.HOME ?? "~"))
  : null;

/** Cot bang -> noi phai tim thay. null = tim ca cay theo basename. */
const COLUMN_KIND = [
  { match: /playbook/i, kind: "playbook", dirs: ["docs/playbooks"] },
  { match: /^gate|cổng|cong/i, kind: "gate", dirs: ["docs/gates"] },
  { match: /mẫu tài liệu|mau tai lieu|template/i, kind: "mau", dirs: ["docs/mau-tai-lieu", "docs/templates"] },
  { match: /script|lệnh|lenh/i, kind: "script", dirs: null },
  { match: /engine/i, kind: "engine", dirs: null },
];

const KEEP_DOT_DIRS = new Set([".harness", ".claude", ".githooks"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".next", ".turbo", "coverage", "plans"]);

function walk(dir, out = [], depth = 0) {
  if (depth > 8 || !existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    // .harness/ (stack template nhung luc cai) va .claude/ (lenh) la noi that su
    // chua script + lenh harness goi ten. Bo qua chung = gate bao treo oan.
    if ((name.startsWith(".") && !KEEP_DOT_DIRS.has(name)) || SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out, depth + 1);
    else out.push(full);
  }
  return out;
}

const allFiles = walk(root);
const basenames = new Set(allFiles.map((f) => basename(f)));

/** Engine da cai. */
const engines = new Set();
if (enginesDir) {
  for (const sub of ["skills", "agents", "commands"]) {
    const d = join(enginesDir, sub);
    if (!existsSync(d)) continue;
    for (const name of readdirSync(d)) engines.add(name.replace(/\.md$/, ""));
  }
}

/** File quy trinh: mac dinh macro-*.md + WORKFLOW.md, cong file truyen tay. */
const processFiles = [
  ...allFiles.filter((f) => /\/(macro-\d+|WORKFLOW)\.md$/.test(f)),
  ...takeAll("--file").map((f) => resolve(root, f)),
].filter((f, i, a) => existsSync(f) && a.indexOf(f) === i);


/**
 * Duong dan trong tai lieu co the tinh tu goc repo ("docs/gates/x.md") HOAC tu
 * vi tri file ("../STAGE_GOALS.md"). Chap nhan neu MOT trong hai giai duoc -
 * lan chay dau gate bao nham 20 link vi chi thu mot goc.
 */
const resolvesEither = (fromFile, ref) => {
  const a = resolve(dirname(fromFile), ref);
  const b = resolve(root, ref);
  return existsSync(a) || existsSync(b) ? (existsSync(a) ? a : b) : null;
};

/** Bo qua: glob, slash-command, placeholder <slug>, bien moi truong. */
const isNotAPath = (s) =>
  s.includes("*") ||
  /^\/[a-z][a-z0-9-]*$/.test(s) ||
  s.includes("<") ||
  /^[A-Z0-9_]+$/.test(s) ||
  s.includes("==") ||
  s.includes(":");

const findings = [];
const warnings = [];
const REF = /`([^`\s|]+)`/g;

/** Ten co ve la file harness so huu (khong phai artifact du an sinh ra). */
const isFileRef = (s) => /\.(md|mjs|sh|ts|py)$/.test(s);
const isEngineRef = (s) => /^ckm?[-:][a-z0-9][a-z0-9-]*$/.test(s);

for (const file of processFiles) {
  const raw = readFileSync(file, "utf8");
  const text = raw.replace(/```[\s\S]*?```/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const lines = text.split("\n");

  let colKinds = null; // index -> kind cua bang dang doc

  for (const line of lines) {
    const isRow = /^\s*\|/.test(line);
    if (!isRow) {
      colKinds = null;
      // link tuong doi ngoai bang van kiem (muc "Doc them" cua spine - loai MD-04)
      for (const m of line.matchAll(REF)) {
        const ref = m[1];
        if (!isFileRef(ref) || !ref.includes("/") || isNotAPath(ref)) continue;
        if (!resolvesEither(file, ref)) {
          findings.push({
            kind: "link-tuong-doi",
            ref,
            file: relative(root, file),
            note: "khong giai duoc tu goc repo lan tu vi tri file",
          });
        }
      }
      continue;
    }

    const cells = line.split("|").slice(1, -1);
    if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue; // dong gach ngang

    if (colKinds === null) {
      // dong dau tien cua bang = header
      colKinds = cells.map((h) => COLUMN_KIND.find((c) => c.match.test(h.trim()))?.kind ?? null);
      continue;
    }

    cells.forEach((cell, i) => {
      const kind = colKinds[i];
      if (!kind) return;
      for (const m of cell.matchAll(REF)) {
        const ref = m[1];
        if (isNotAPath(ref) && !isEngineRef(ref)) continue;

        if (kind === "engine" || isEngineRef(ref)) {
          if (!isEngineRef(ref)) continue;
          if (!enginesDir) continue;
          const bare = ref.replace(/^ckm?[-:]/, "");
          const ok = ["", "ck-", "ckm-"].some((p) => engines.has(p + bare)) || engines.has(ref) || engines.has(bare);
          if (!ok) {
            findings.push({ kind: "engine", ref, file: relative(root, file), note: "khong co trong bo skill dang cai" });
          }
          continue;
        }

        // Cot Gate chua ca ten gate co hoc (= script, kiem o cot Script) lan
        // duong dan tai lieu gate. Chi soi cai co duoi .md.
        if (kind === "gate" && !isFileRef(ref)) continue;

        const name = isFileRef(ref) ? ref : `${ref}.md`;
        if (ref.includes("/")) {
          const cfgDirs = COLUMN_KIND.find((c) => c.kind === kind)?.dirs ?? [];
          const inCfgDir = cfgDirs.some((d) => existsSync(join(root, d, ref.replace(/\/$/, ""))));
          if (!inCfgDir && !resolvesEither(file, ref.replace(/\/$/, ""))) {
            findings.push({ kind, ref, file: relative(root, file), note: "khong giai duoc tu goc repo lan tu vi tri file" });
          }
          continue;
        }

        const cfg = COLUMN_KIND.find((c) => c.kind === kind);
        const anywhere = basenames.has(name) || basenames.has(ref);
        if (cfg?.dirs) {
          const inDir = cfg.dirs.some((d) => existsSync(join(root, d, name)));
          if (!inDir && !anywhere) {
            // TREO that: khong co o dau ca
            findings.push({ kind, ref, file: relative(root, file), note: `khong co file nao ten ${name} trong cay` });
          } else if (!inDir) {
            // co nhung nam cho khac - nhe hon, chi canh bao
            warnings.push({ kind, ref, file: relative(root, file), note: `co ton tai nhung khong nam trong ${cfg.dirs.join(" hoac ")}` });
          }
        } else if (!anywhere) {
          findings.push({ kind, ref, file: relative(root, file), note: "khong co file nao ten nay trong cay" });
        }
      }
    });
  }
}


// --- CHIEU NGUOC: file co ma khong ai goi ---
// Muc luc (README, KEYWORD-MAP) va changelog KHONG tinh la nguoi tieu thu - chung la
// danh muc, khong dieu khien viec chay. Nguoi tieu thu = file quy trinh + gate doc.
const OWNED_DIRS = ["docs/playbooks", "docs/gates", "docs/mau-tai-lieu"];
const orphans = [];
{
  const consumerFiles = [
    ...processFiles,
    ...(existsSync(join(root, "docs/gates"))
      ? readdirSync(join(root, "docs/gates"))
          .filter((f) => f.endsWith(".md"))
          .map((f) => join(root, "docs/gates", f))
      : []),
  ].filter((f, i, a) => a.indexOf(f) === i);
  const consumerText = consumerFiles.map((f) => readFileSync(f, "utf8")).join("\n");

  for (const d of OWNED_DIRS) {
    const dir = join(root, d);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".md") || name === "README.md") continue;
      const stem = name.slice(0, -3);
      if (consumerText.includes(stem)) continue;
      orphans.push({ kind: "mo-coi", ref: stem, file: `${d}/${name}`, note: "khong file quy trinh nao goi ten - theo luat bat bien cua macro-2.md, no khong thuoc repo nay" });
    }
  }
}

const grouped = new Map();
for (const x of findings) {
  const k = `${x.kind}|${x.ref}`;
  if (!grouped.has(k)) grouped.set(k, { ...x, files: [] });
  grouped.get(k).files.push(x.file);
}
const rows = [...grouped.values(), ...orphans].sort((a, b) => a.kind.localeCompare(b.kind) || a.ref.localeCompare(b.ref));

const result = {
  gate: "dangling-refs",
  root,
  enginesDir,
  processFiles: processFiles.map((f) => relative(root, f)),
  dangling: rows.length,
  orphans: orphans.length,
  rows,
  warnings,
  pass: rows.length === 0,
};

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`[dangling-refs] goc: ${root}`);
  console.log(`[dangling-refs] file quy trinh: ${result.processFiles.join(", ") || "(khong co)"}`);
  console.log(`[dangling-refs] engine: ${enginesDir ?? "khong kiem"}`);
  for (const r of rows) {
    console.log(`  ${r.kind.padEnd(15)} ${r.ref}`);
    console.log(`  ${" ".repeat(15)} ${r.note}`);
    console.log(`  ${" ".repeat(15)} o: ${[...new Set(r.files)].join(", ")}`);
  }
  const wrows = [...new Map(warnings.map((w) => [`${w.kind}|${w.ref}`, w])).values()];
  for (const w of wrows) console.log(`  CANH BAO ${w.kind} \`${w.ref}\` - ${w.note} (o ${w.file})`);
  console.log(result.pass ? "[dangling-refs] XANH" : `[dangling-refs] DO - ${rows.length - orphans.length} tham chieu treo + ${orphans.length} file mo coi`);
}

process.exit(result.pass ? 0 : 1);
