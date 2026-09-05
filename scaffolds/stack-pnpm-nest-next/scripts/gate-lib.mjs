/**
 * Shared helpers for the lint:gates scripts (config loading, root resolution,
 * recursive file walk). Kept tiny + dependency-free so every gate stays a plain
 * runnable .mjs. The gates that consume this:
 *   - check-new-screen-fidelity-required.mjs
 *   - check-prototype-fidelity.mjs
 *   - check-manifest-coverage.mjs
 *   - check-authz-test-present.mjs
 *   - check-money-concurrency-test-present.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * Project root the gate lints. Defaults to the template root (one dir up from
 * scripts/). GATE_ROOT overrides it so the gates can be self-tested against a
 * throwaway fixture tree without touching the real project.
 * @param {string} scriptDir absolute dir of the calling script
 */
export function gateRoot(scriptDir) {
  return process.env.GATE_ROOT ? resolve(process.env.GATE_ROOT) : resolve(scriptDir, '..');
}

/**
 * Optional per-project gate config at <root>/scripts/gate-config.json.
 * Absent → {} (gates fall back to their built-in defaults). Invalid JSON is a
 * loud warning, not a crash — a broken config must not silently disable a gate.
 * @param {string} root
 * @returns {Record<string, any>}
 */
export function loadGateConfig(root) {
  const p = resolve(root, 'scripts/gate-config.json');
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`[gate-config] invalid JSON at ${p}: ${e.message} — using defaults`);
    return {};
  }
}

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '.git', 'coverage', 'build', '.turbo']);

/**
 * Recursively collect files under dir whose basename matches `matchFn`.
 * Missing dir → []. Skips build/vendor dirs.
 * @param {string} dir
 * @param {(name: string) => boolean} matchFn
 * @returns {string[]} absolute paths
 */
export function walk(dir, matchFn) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...walk(p, matchFn));
    } else if (matchFn(name)) {
      out.push(p);
    }
  }
  return out;
}

/** read a file, '' on any error (missing/permission) so callers stay simple. */
export function readSafe(p) {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Đường dẫn tới register dạng JSON, nhận CẢ HAI cách đặt tên.
 *
 * `feature-register.source.json` và `feature-register-source.json` cùng tồn tại
 * ngoài thực tế. Lệch một ký tự, và hậu quả không nhỏ: trên một dự án thật nó làm
 * register đọc ra 0% trong khi thật là 60% (MD-12). Chỗ đó đã vá cho rtm-status,
 * NHƯNG req-issue-scaffold đọc đúng file ấy lại không được vá - nên lỗi quay lại
 * lần thứ hai, lần này làm mọi bản nháp issue mất phần neo phạm vi (MD-32).
 *
 * Vá một chỗ cho một script là vá triệu chứng. Mọi script đọc register phải gọi
 * hàm này, đừng tự viết đường dẫn mặc định.
 */
export function resolveRegisterJson(root, cfg = {}) {
  if (cfg.registerJson) return resolve(root, cfg.registerJson);
  for (const name of ['feature-register.source.json', 'feature-register-source.json']) {
    const p = resolve(root, 'docs/scope-baseline', name);
    if (existsSync(p)) return p;
  }
  return resolve(root, 'docs/scope-baseline/feature-register.source.json');
}

/**
 * REQ-ID của từng phase, đọc từ build-manifest.
 *
 * Một phase khai phủ theo hai cách: liệt kê thẳng REQ-ID, hoặc khai theo FILE
 * NGUỒN - "all 68 in `assets.md`". Cách thứ hai là cách manifest thật dùng, vì
 * 401 REQ-ID liệt kê ra thì không ai đọc nổi. Hàm này hiểu cả hai.
 *
 * Hai bẫy đã dính khi viết:
 *   - Coi mọi `.md` trong khối là file được nhận -> đọc mệnh đề "dedup against
 *     ids already homed in `assets.md`" thành lời nhận, bịa ra hai phase trùng.
 *     Nên: chỉ nhận dạng ``in `<file>` `` và cắt trước các mệnh đề phủ định.
 *   - REQ-ID trong backtick là THAM CHIẾU CHÉO; chỉ bản IN ĐẬM mới là khai.
 *
 * Mọi script cần "phase này gồm REQ-ID nào" phải gọi hàm này. Viết lại lần hai
 * là cách MD-12 quay lại thành MD-32.
 */
export function reqIdsByPhase(root, manifestPath) {
  const RE = /\b[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+\b/g;
  const byPhase = new Map();
  const claimedFiles = new Map();
  let p0Defined = false;
  if (!existsSync(manifestPath)) return { byPhase, claimedFiles, p0Defined };

  let phase = null, inBlock = null, text = '', blockPhase = null;
  const add = (id, p) => {
    if (!p) return;
    if (!byPhase.has(p)) byPhase.set(p, new Set());
    byPhase.get(p).add(id);
  };
  const absorb = (t, p) => {
    if (!p || !t) return;
    for (const id of t.match(RE) ?? []) add(id, p);
    const own = t.split(/\b(?:dedup|minus|cross-referenc|already homed|see also|see )/i)[0];
    for (const m of own.matchAll(/\bin\s+`([^`]*\/)?([a-z0-9-]+\.md)`/g)) {
      const file = `${m[1] ?? ''}${m[2]}`;
      const abs = resolve(root, file.includes('/') ? file : `docs/requirements/srs/${file}`);
      if (!existsSync(abs)) continue;
      if (!claimedFiles.has(file)) claimedFiles.set(file, new Set());
      claimedFiles.get(file).add(p);
      for (const d of readFileSync(abs, 'utf8').matchAll(/\*\*([A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+)\*\*/g)) add(d[1], p);
    }
  };

  for (const line of readFileSync(manifestPath, 'utf8').split('\n')) {
    const head = line.match(/^#{2,4}\s+(P\d+)\b/);
    if (head) {
      absorb(text, blockPhase); text = '';
      phase = head[1];
      if (phase === 'P0') p0Defined = true;
      inBlock = null;
      continue;
    }
    if (/\*\*REQ-IDs?\b[^*]*:\*\*/.test(line) && phase) {
      absorb(text, blockPhase); text = line; inBlock = phase; blockPhase = phase;
      continue;
    }
    if (inBlock) {
      if (/^\s*-\s\*\*/.test(line) || /^#{2,4}\s/.test(line)) inBlock = null;
      else { text += `\n${line}`; continue; }
    }
    if (!inBlock && text) { absorb(text, blockPhase); text = ''; }
  }
  absorb(text, blockPhase);
  return { byPhase, claimedFiles, p0Defined };
}

/**
 * REQ-ID đang trong phạm vi, đọc từ register.
 *
 * Ưu tiên register JSON: nó khai phạm vi bằng CẤU TRÚC (`sections[].rows[]` là
 * trong phạm vi, `out_of_scope` là ngoài), nên không phải đoán quy ước chữ. Bản
 * markdown thì nhận diện bằng token, và token đó phải cấu hình được: một register
 * viết tiếng Việt không có chữ `in-MVP` nào, và gate đọc ra 0 dòng rồi báo XANH.
 *
 * Trả về Set rỗng chỉ khi register KHÔNG tồn tại. Register có mà đọc ra rỗng là
 * lỗi của người gọi phải xử - đọc ra 0 mục không bao giờ là "phạm vi trống".
 */
export function inScopeReqIds(root, cfg = {}) {
  const RE = /\b[A-Z][A-Z0-9]*\.[A-Z][A-Z0-9]*\.\d+\b/g;
  const out = new Set();
  const json = resolveRegisterJson(root, cfg);
  if (existsSync(json) && json.endsWith('.json')) {
    const data = JSON.parse(readFileSync(json, 'utf8'));
    const outOfScope = new Set(JSON.stringify(data.out_of_scope ?? []).match(RE) ?? []);
    for (const id of JSON.stringify(data.sections ?? []).match(RE) ?? []) {
      if (!outOfScope.has(id)) out.add(id);
    }
    if (out.size) return out;
  }
  const md = resolve(root, cfg.featureRegister ?? 'docs/scope-baseline/feature-register.md');
  if (!existsSync(md)) return out;
  const tokens = cfg.inScopeTokens ?? ['in-MVP'];
  for (const line of readFileSync(md, 'utf8').split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    if (!tokens.some((t) => line.includes(t))) continue;
    for (const id of line.match(RE) ?? []) out.add(id);
  }
  return out;
}
