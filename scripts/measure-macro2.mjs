#!/usr/bin/env node
/**
 * measure-macro2.mjs — đo lại 4 chỉ số của một lượt chạy Macro 2 và ghi vào sổ.
 *
 * Vì sao cần: một lượt chạy Macro 2 chỉ có giá trị làm bằng chứng nếu đo được
 * ĐẦU và CUỐI bằng CÙNG một phép đo. Đo tay thì lần sau không lặp lại được, và
 * một con số 0 đọc sai chỗ (xem MD-12 - lệch đúng một ký tự trong tên file) đủ
 * để gán nhầm 60 điểm phần trăm công của Macro 1 cho Macro 2.
 *
 *   node scripts/measure-macro2.mjs --step 2.0
 *   node scripts/measure-macro2.mjs --step 2.13 --note "sau UAT"
 *   node scripts/measure-macro2.mjs --step 2.3 --dry     # in ra, không ghi sổ
 *
 * Ghi một dòng vào docs/macro2-run-log.md. Sổ này là append-only: không sửa
 * dòng cũ, vì cái đang đo chính là ĐỘ CHÊNH giữa các dòng.
 *
 * GATE_ROOT: mọi script gate suy ra gốc từ vị trí của chính nó, nên khi kit còn
 * nằm trong .harness/stack-template/ thì không đặt biến này là đo nhầm bộ
 * scaffold thay vì dự án.
 */
import { existsSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = process.env.GATE_ROOT
  ? resolve(process.env.GATE_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const flag = (name, dflt = null) => {
  const i = args.indexOf(name);
  return i === -1 || !args[i + 1] || args[i + 1].startsWith("--") ? dflt : args[i + 1];
};
const STEP = flag("--step", "?");
const NOTE = flag("--note", "");
const DRY = args.includes("--dry");
const LOG = join(ROOT, "docs/macro2-run-log.md");

/** Kit có thể nằm ở scripts/ (sau 2.4) hoặc .harness/stack-template/scripts/ (trước 2.4). */
function findScript(name) {
  for (const dir of ["scripts", ".harness/stack-template/scripts"]) {
    const p = join(ROOT, dir, name);
    if (existsSync(p)) return p;
  }
  return null;
}

function run(name, extra = []) {
  const path = findScript(name);
  if (!path) return { found: false, out: "", code: null };
  const r = spawnSync("node", [path, ...extra], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, GATE_ROOT: ROOT },
    timeout: 180000,
  });
  return { found: true, out: `${r.stdout ?? ""}${r.stderr ?? ""}`, code: r.status };
}

// ---------------------------------------------------------------- 1. RTM
const rtm = run("rtm-status.mjs", ["--json"]);
let reqTotal = 0;
const pct = { register: "-", test: "-", issue: "-", prototype: "-" };
if (rtm.found && rtm.out.trim().startsWith("{")) {
  const data = JSON.parse(rtm.out);
  const rows = data.rows ?? [];
  reqTotal = rows.length;
  for (const col of Object.keys(pct)) {
    if (!rows.length) continue;
    // "✓" = có; "~" = chỉ khớp catch-all, KHÔNG tính là có; "?" = nguồn offline.
    const offline = rows.some((r) => r[col] === "?");
    const hit = rows.filter((r) => r[col] === "✓").length;
    pct[col] = offline && hit === 0 ? "n/a" : `${Math.round((hit / rows.length) * 100)}%`;
  }
} else if (rtm.found) {
  pct.register = "chưa đo được";
}

// ------------------------------------------------- 2..4. ba gate phủ/trung thực
/** Một dòng gọn: xanh / đỏ / bỏ qua kèm lý do, để đọc sổ không cần mở log gate. */
function verdict(res) {
  if (!res.found) return "thiếu script";
  const line = res.out.split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? "";
  const short = line.replace(/^[✓✗\-\s]*/, "").slice(0, 72);
  if (/skipped|chưa có|no .* yet|not .* yet/i.test(res.out)) return `bỏ qua: ${short}`;
  return `${res.code === 0 ? "xanh" : "ĐỎ"}${short ? `: ${short}` : ""}`;
}
const manifest = verdict(run("check-manifest-coverage.mjs"));
const ac = verdict(run("check-ac-coverage.mjs", ["--advisory"]));
const fidelity = verdict(run("check-prototype-fidelity.mjs"));

// ---------------------------------------------------------------- ghi sổ
const now = new Date().toISOString().slice(0, 16).replace("T", " ");
const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" });
const sha = (head.stdout ?? "").trim() || "?";
const row = `| ${now} | ${STEP} | ${sha} | ${reqTotal} | ${pct.register} | ${pct.test} | ${pct.issue} | ${pct.prototype} | ${manifest} | ${ac} | ${fidelity} | ${NOTE} |`;

const HEADER = `# Sổ đo Macro 2

> Mỗi dòng là một lần đo, ghi bằng \`node scripts/measure-macro2.mjs --step <bước>\`.
> **Append-only** - không sửa dòng cũ, vì thứ đang đo là độ chênh giữa các dòng.
>
> Đọc cột: \`register\` và \`prototype\` là di sản Macro 1, lượt chạy này không
> làm chúng tăng. Hai cột phải tiến là \`test\` và \`issue\`. Một con số 0 chỉ có
> nghĩa khi biết đó là "chưa làm" hay "đọc sai chỗ" - xem MD-12.

| thời điểm | bước | commit | REQ-ID | register | test | issue | prototype | phủ bản kê | phủ tiêu chí | trung thực prototype | ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|
`;

console.log(row);
if (DRY) process.exit(0);
if (!existsSync(LOG)) writeFileSync(LOG, HEADER);
appendFileSync(LOG, `${row}\n`);
console.log(`-> ghi vào docs/macro2-run-log.md`);
