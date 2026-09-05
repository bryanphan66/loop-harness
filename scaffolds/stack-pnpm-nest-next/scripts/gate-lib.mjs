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
