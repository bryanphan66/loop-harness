#!/usr/bin/env node
/**
 * Post-build guard for the host-canonical 301 redirect. `next.config.js`
 * `redirects()` (via src/lib/canonical-redirects.js) is evaluated by Next AT
 * BUILD TIME and its result is baked into apps/web/.next/routes-manifest.json.
 * CANONICAL_REDIRECT_FROM / CANONICAL_REDIRECT_TO are read there, so they are
 * effectively build-time inputs — a value set only at runtime lands after the
 * manifest is frozen and silently does nothing.
 *
 * This check reads the freshly-built manifest and asserts it agrees with the
 * env the build actually saw, so the "runtime env does nothing" trap can never
 * ship undetected again:
 *   - both vars set   => the manifest MUST hold exactly one host-scoped rule per
 *     host in FROM, each statusCode 301 with a destination starting at TO;
 *   - either var empty => the manifest MUST hold no host-scoped redirect at all.
 * Next's built-in trailing-slash normalization (no `has` host condition) is
 * ignored — only host-scoped rules are the canonical redirect.
 *
 * Runs automatically as apps/web's `postbuild`, so it fires with the same
 * process env as `next build` in every build path (Docker image, CI, local).
 *
 *   node scripts/check-canonical-redirect-manifest.mjs   # exit 1 on any mismatch
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = resolve(ROOT, 'apps/web/.next/routes-manifest.json');

/** The host value of a redirect's host-scoped `has` condition, or undefined. */
function redirectHost(redirect) {
  if (!redirect || !Array.isArray(redirect.has)) return undefined;
  const cond = redirect.has.find((h) => h && h.type === 'host');
  return cond ? cond.value : undefined;
}

/**
 * Compare the built manifest's redirects against the build-time env. Pure — no
 * IO — so the comparison is unit-testable in isolation.
 *
 * @param {Record<string, string | undefined>} env  the build-time environment
 * @param {Array<object>} redirects  routes-manifest.json `.redirects`
 * @returns {string[]}  human-readable mismatch messages (empty => manifest ok)
 */
export function diffCanonicalManifest(env, redirects) {
  const legacyHosts = String(env.CANONICAL_REDIRECT_FROM ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  const to = String(env.CANONICAL_REDIRECT_TO ?? '').trim();
  const featureOn = to !== '' && legacyHosts.length > 0;

  // Only host-scoped rules are the canonical redirect; the trailing-slash
  // normalization rule Next always emits carries no host `has` and is ignored.
  const hostRules = (Array.isArray(redirects) ? redirects : [])
    .map((r) => ({ host: redirectHost(r), redirect: r }))
    .filter((r) => r.host !== undefined);

  const errors = [];

  if (!featureOn) {
    if (hostRules.length > 0) {
      const hosts = hostRules.map((r) => r.host).join(', ');
      errors.push(
        `env is OFF (CANONICAL_REDIRECT_FROM/TO empty) but the manifest carries ` +
          `${hostRules.length} host-scoped redirect(s): ${hosts}. A stale rule would ` +
          `301 live traffic — rebuild with both vars empty.`,
      );
    }
    return errors;
  }

  // Feature ON: every FROM host needs exactly one 301 rule pointing at TO.
  for (const host of legacyHosts) {
    const matches = hostRules.filter((r) => r.host === host);
    if (matches.length === 0) {
      errors.push(`missing canonical redirect for host "${host}" (FROM set but no manifest rule)`);
      continue;
    }
    if (matches.length > 1) {
      errors.push(`host "${host}" has ${matches.length} redirect rules in the manifest, expected exactly 1`);
    }
    for (const { redirect } of matches) {
      if (redirect.statusCode !== 301) {
        errors.push(
          `host "${host}" redirect has statusCode ${redirect.statusCode ?? '(unset)'}, expected 301`,
        );
      }
      const dest = String(redirect.destination ?? '');
      if (!dest.startsWith(to)) {
        errors.push(`host "${host}" redirect destination "${dest}" does not start with TO "${to}"`);
      }
    }
  }

  // Any host-scoped rule for a host NOT in FROM is drift — flag it too.
  const expected = new Set(legacyHosts);
  for (const { host } of hostRules) {
    if (!expected.has(host)) {
      errors.push(`unexpected canonical redirect for host "${host}" (not in CANONICAL_REDIRECT_FROM)`);
    }
  }

  return errors;
}

// --- CLI entry: only when run directly, not when imported by the test. -------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch (err) {
    console.error(`✗ [canonical-redirect] cannot read ${MANIFEST}: ${err.message}`);
    console.error(`  Run the web build first — this check is meant to run as apps/web postbuild.`);
    process.exit(1);
  }

  const errors = diffCanonicalManifest(process.env, manifest.redirects);
  if (errors.length) {
    console.error(`\n✗ [canonical-redirect] manifest does not match the build-time env:\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error(
      `\n  redirects() is evaluated at BUILD time; the env at build decides the manifest.\n` +
        `  Fix the build args (CANONICAL_REDIRECT_FROM / CANONICAL_REDIRECT_TO) and rebuild.\n`,
    );
    process.exit(1);
  }

  const from = String(process.env.CANONICAL_REDIRECT_FROM ?? '').trim();
  console.log(
    from
      ? `✓ [canonical-redirect] manifest matches env — 301 rules present for: ${from}`
      : `✓ [canonical-redirect] manifest matches env — no canonical redirect (feature off)`,
  );
}
