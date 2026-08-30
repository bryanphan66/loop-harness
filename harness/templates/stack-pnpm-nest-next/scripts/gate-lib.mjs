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
