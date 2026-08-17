#!/usr/bin/env node
/**
 * run-log.mjs — CAI CAN cua harness. Ghi 1 dong / 1 lan dispatch, de tra loi
 * duoc cau hoi ma hien tai KHONG tra loi duoc: "ban va harness vua roi co
 * lam moi thu tot len that khong, hay chi la cam giac?"
 *
 * Van de no giai: harness da di toi v7.x, moi lan va deu co ly do hop ly,
 * nhung khong co con so nao chung minh version moi tot hon version cu. Hau qua:
 * kho doc chi dam THEM luat, khong dam BO luat nao -> phinh dan.
 * Nganh goi cai thieu nay la `evals` + `observability`; day la buoc 1.
 *
 * KHONG ghi vao repo du an (tranh xung dot merge + ban repo khach). Log nam
 * NGOAI git, dung chung cho MOI repo, vi cau hoi can tra loi la lien-du-an:
 *   $LOOP_HARNESS_RUNLOG  hoac  ~/.claude/loop-harness/run-log.jsonl
 *
 * Dung:
 *   # 1. luc GIAO viec cho bg worker -> in ra run id
 *   node run-log.mjs start --issue 123 --worker 1a2b3c4d --task "fix upload"
 *
 *   # 2. luc worker XONG (hoac chet)
 *   node run-log.mjs end --run <id> --outcome done --qc-fails 1 --retries 0
 *
 *   # 3. bat cu luc nao — xem harness co tot len khong
 *   node run-log.mjs report
 *   node run-log.mjs report --by repo --since 2026-08-01
 *
 * outcome hop le: done | blocked | failed | abandoned
 *   done      = ra duoc ket qua dung AC
 *   blocked   = worker dung lai cho nguoi (BLOCKED/NEEDS_CONTEXT)
 *   failed    = chay xong nhung sai / gate do khong sua duoc
 *   abandoned = bo giua chung (het gio, giet worker, doi huong)
 *
 * Nguyen tac: KHONG doan. Truong nao khong biet thi bo trong, dung bia so —
 * mot cai can noi doi con te hon khong co can.
 */
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOG = process.env.LOOP_HARNESS_RUNLOG
  || join(homedir(), '.claude', 'loop-harness', 'run-log.jsonl');

const args = process.argv.slice(2);
const cmd = args[0];
const argOf = (f, d = null) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const die = (msg) => { console.error(`[loi] ${msg}`); process.exit(1); };

const OUTCOMES = ['done', 'blocked', 'failed', 'abandoned'];

// ---- doan ngu canh (best-effort, khong bao gio lam script chet) --------------
const quiet = (fn, d = null) => { try { return fn(); } catch { return d; } };

const gitRepo = () => quiet(() => basename(execFileSync('git', ['rev-parse', '--show-toplevel'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()), null) || basename(process.cwd());

const gitSha = () => quiet(() => execFileSync('git', ['rev-parse', '--short', 'HEAD'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), null);

// Version harness doc tu chinh HARNESS_CHANGELOG.md canh script nay — khong
// hardcode, khong phai nho tay khai. Do la truong QUAN TRONG NHAT cua ca file:
// no la thu ta dung de so "truoc va sau khi va".
const harnessVersion = () => {
  const f = join(HERE, '..', 'docs', 'HARNESS_CHANGELOG.md');
  if (!existsSync(f)) return null;
  const m = readFileSync(f, 'utf8').match(/Current version:\s*\*\*(v[\d.]+)\*\*/);
  return m ? m[1] : null;
};

const append = (rec) => {
  mkdirSync(dirname(LOG), { recursive: true });
  appendFileSync(LOG, `${JSON.stringify(rec)}\n`);
};

const readLog = () => {
  if (!existsSync(LOG)) return [];
  return readFileSync(LOG, 'utf8').split('\n').filter(Boolean)
    .map((l) => quiet(() => JSON.parse(l), null)).filter(Boolean);
};

// ---- start ---------------------------------------------------------------------
if (cmd === 'start') {
  const issue = argOf('--issue');
  const runId = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, '0')}`;
  const rec = {
    phase: 'start',
    run: runId,
    ts: new Date().toISOString(),
    repo: argOf('--repo', gitRepo()),
    issue: issue ? Number(issue) : null,
    worker: argOf('--worker'),
    model: argOf('--model'),
    task: argOf('--task'),
    harness: argOf('--harness', harnessVersion()),
    sha: gitSha(),
  };
  append(rec);
  console.log(runId); // stdout = CHI run id, de ctl gan thang vao bien
  console.error(`[run-log] start ${runId} · ${rec.repo}${rec.issue ? ` #${rec.issue}` : ''} · harness ${rec.harness || '?'}`);
  process.exit(0);
}

// ---- end -----------------------------------------------------------------------
if (cmd === 'end') {
  const run = argOf('--run') || die('thieu --run <id> (lay tu lenh start)');
  const outcome = argOf('--outcome') || die(`thieu --outcome (${OUTCOMES.join('|')})`);
  if (!OUTCOMES.includes(outcome)) die(`--outcome "${outcome}" khong hop le. Hop le: ${OUTCOMES.join(', ')}`);

  const started = readLog().find((r) => r.phase === 'start' && r.run === run);
  if (!started) die(`khong tim thay run "${run}" trong ${LOG} (goi 'start' truoc, hoac sai id).`);

  const num = (f) => { const v = argOf(f); return v === null ? null : Number(v); };
  const rec = {
    phase: 'end',
    run,
    ts: new Date().toISOString(),
    outcome,
    minutes: Math.round((Date.now() - Date.parse(started.ts)) / 60000),
    qc_fails: num('--qc-fails'),
    retries: num('--retries'),
    tokens: num('--tokens'),
    note: argOf('--note'),
  };
  append(rec);
  console.error(`[run-log] end ${run} · ${outcome} · ${rec.minutes} phut`);
  process.exit(0);
}

// ---- report --------------------------------------------------------------------
if (cmd === 'report') {
  const by = argOf('--by', 'harness');
  if (!['harness', 'repo', 'model'].includes(by)) die('--by chi nhan: harness | repo | model');
  const since = argOf('--since'); // YYYY-MM-DD

  const rows = readLog();
  if (!rows.length) {
    console.log(`Chua co du lieu (${LOG}).`);
    console.log('Ghi dong dau tien: node run-log.mjs start --issue <N> --worker <id> --task "<viec>"');
    process.exit(0);
  }

  const starts = new Map();
  for (const r of rows) if (r.phase === 'start') starts.set(r.run, r);
  const runs = [];
  for (const r of rows) {
    if (r.phase !== 'end') continue;
    const s = starts.get(r.run);
    if (!s) continue;
    if (since && s.ts.slice(0, 10) < since) continue;
    runs.push({ ...s, ...r });
  }
  const openCount = starts.size - new Set(rows.filter((r) => r.phase === 'end').map((r) => r.run)).size;

  if (!runs.length) {
    console.log(`Chua co run nao KET THUC${since ? ` tu ${since}` : ''} (dang mo: ${openCount}). Nho goi 'end'.`);
    process.exit(0);
  }

  const med = (xs) => {
    const a = xs.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((p, q) => p - q);
    if (!a.length) return null;
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
  };
  const avg = (xs) => {
    const a = xs.filter((x) => typeof x === 'number' && !Number.isNaN(x));
    return a.length ? Math.round((a.reduce((p, q) => p + q, 0) / a.length) * 10) / 10 : null;
  };
  const show = (v, unit = '') => (v === null ? '—' : `${v}${unit}`);

  const groups = new Map();
  for (const r of runs) {
    const k = String(r[by] ?? '(khong ro)');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }

  console.log(`\nRUN-LOG · nhom theo "${by}"${since ? ` · tu ${since}` : ''} · ${runs.length} run da xong` + (openCount > 0 ? ` (+${openCount} dang mo)` : ''));
  console.log(`nguon: ${LOG}\n`);
  const head = ['nhom', 'run', 'xong', 'ket', 'phut(med)', 'QCfail(tb)', 'retry(tb)', 'token(med)'];
  const w = [16, 5, 6, 6, 10, 11, 10, 11];
  const line = (cells) => cells.map((c, i) => String(c).padEnd(w[i])).join(' ');
  console.log(line(head));
  console.log(w.map((n) => '─'.repeat(n)).join(' '));

  const keys = [...groups.keys()].sort();
  for (const k of keys) {
    const g = groups.get(k);
    const done = g.filter((r) => r.outcome === 'done').length;
    const stuck = g.filter((r) => r.outcome === 'blocked').length;
    console.log(line([
      k.slice(0, 16), g.length,
      `${Math.round((done / g.length) * 100)}%`,
      `${Math.round((stuck / g.length) * 100)}%`,
      show(med(g.map((r) => r.minutes))),
      show(avg(g.map((r) => r.qc_fails))),
      show(avg(g.map((r) => r.retries))),
      show(med(g.map((r) => r.tokens))),
    ]));
  }

  console.log('\nxong = % ra ket qua dung AC · ket = % dung cho nguoi (blocked)');
  if (keys.length < 2) {
    console.log('CANH BAO: moi co 1 nhom — chua so sanh duoc gi. Can it nhat 2 nhom (vi du 2 version harness).');
  }
  if (runs.length < 5) {
    console.log(`CANH BAO: moi ${runs.length} run — con qua it de ket luan. Dung ra quyet dinh bo/them luat harness voi so nay.`);
  }
  process.exit(0);
}

console.error(`run-log.mjs — cai can cua harness. Log: ${LOG}

  node run-log.mjs start  --issue <N> [--worker <id>] [--task "<viec>"] [--model <m>] [--repo <r>]
  node run-log.mjs end    --run <id> --outcome ${OUTCOMES.join('|')}
                          [--qc-fails <n>] [--retries <n>] [--tokens <n>] [--note "<...>"]
  node run-log.mjs report [--by harness|repo|model] [--since YYYY-MM-DD]
`);
process.exit(2);
