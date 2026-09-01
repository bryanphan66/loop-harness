#!/usr/bin/env node
//
// test-check-canonical-redirect-manifest.mjs — unit tests for the manifest/env
// comparison in scripts/check-canonical-redirect-manifest.mjs.
//
// No test framework: this file is a peer of the script it tests and the repo
// root has no runner of its own (`pnpm test` fans out to the workspaces).
//
// Run: node scripts/test-check-canonical-redirect-manifest.mjs
//      (wired into the root `test` script)

import assert from 'node:assert/strict';

import { diffCanonicalManifest } from './check-canonical-redirect-manifest.mjs';

const TO = 'https://nhatnghe.net';
const FROM = 'elearning.nhatnghe.net,www.nhatnghe.net';

// Next always emits this trailing-slash normalization rule; it has no host
// `has` condition and must be ignored by the check in every case.
const TRAILING_SLASH = {
  source: '/:path+/',
  destination: '/:path+',
  internal: true,
  statusCode: 308,
  regex: '^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$',
};

const hostRule = (host, { to = TO, statusCode = 301 } = {}) => ({
  source: '/:path*',
  destination: `${to}/:path*`,
  statusCode,
  regex: '^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?(?:/)?$',
  has: [{ type: 'host', value: host }],
});

const cases = [];
const test = (name, fn) => cases.push({ name, fn });

// --- feature OFF -------------------------------------------------------------

test('off: no host rules (only trailing-slash) => no errors', () => {
  const errors = diffCanonicalManifest({}, [TRAILING_SLASH]);
  assert.deepEqual(errors, []);
});

test('off: empty redirects / undefined => no errors', () => {
  assert.deepEqual(diffCanonicalManifest({}, []), []);
  assert.deepEqual(diffCanonicalManifest({}, undefined), []);
});

test('off: a stale host rule is flagged (would 301 live traffic)', () => {
  const errors = diffCanonicalManifest({}, [TRAILING_SLASH, hostRule('elearning.nhatnghe.net')]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /OFF/);
  assert.match(errors[0], /elearning\.nhatnghe\.net/);
});

test('off: only one var set counts as off, and an existing rule is flagged', () => {
  const errors = diffCanonicalManifest(
    { CANONICAL_REDIRECT_TO: TO }, // FROM missing => off
    [hostRule('elearning.nhatnghe.net')],
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /OFF/);
});

// --- feature ON --------------------------------------------------------------

const ON = { CANONICAL_REDIRECT_FROM: FROM, CANONICAL_REDIRECT_TO: TO };

test('on: exactly one correct 301 rule per host => no errors', () => {
  const errors = diffCanonicalManifest(ON, [
    TRAILING_SLASH,
    hostRule('elearning.nhatnghe.net'),
    hostRule('www.nhatnghe.net'),
  ]);
  assert.deepEqual(errors, []);
});

test('on: a missing host rule is reported (the runtime-env trap)', () => {
  // What the broken build produced: env set at runtime, manifest empty.
  const errors = diffCanonicalManifest(ON, [TRAILING_SLASH]);
  assert.equal(errors.length, 2);
  assert.ok(errors.every((e) => /missing/.test(e)));
  assert.ok(errors.some((e) => /elearning\.nhatnghe\.net/.test(e)));
  assert.ok(errors.some((e) => /www\.nhatnghe\.net/.test(e)));
});

test('on: wrong statusCode (308) is reported', () => {
  const errors = diffCanonicalManifest(ON, [
    hostRule('elearning.nhatnghe.net', { statusCode: 308 }),
    hostRule('www.nhatnghe.net'),
  ]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /statusCode 308.*expected 301/);
});

test('on: destination not starting at TO is reported', () => {
  const errors = diffCanonicalManifest(ON, [
    hostRule('elearning.nhatnghe.net', { to: 'https://wrong.example' }),
    hostRule('www.nhatnghe.net'),
  ]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /destination/);
  assert.match(errors[0], /does not start with TO/);
});

test('on: a duplicate rule for one host is reported', () => {
  const errors = diffCanonicalManifest(ON, [
    hostRule('elearning.nhatnghe.net'),
    hostRule('elearning.nhatnghe.net'),
    hostRule('www.nhatnghe.net'),
  ]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /2 redirect rules.*expected exactly 1/);
});

test('on: a host-scoped rule not in FROM is drift and is flagged', () => {
  const errors = diffCanonicalManifest(ON, [
    hostRule('elearning.nhatnghe.net'),
    hostRule('www.nhatnghe.net'),
    hostRule('old.nhatnghe.net'), // not in FROM
  ]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /unexpected canonical redirect for host "old\.nhatnghe\.net"/);
});

test('on: whitespace in FROM/TO is trimmed like the builder does', () => {
  const errors = diffCanonicalManifest(
    { CANONICAL_REDIRECT_FROM: ' elearning.nhatnghe.net , www.nhatnghe.net ', CANONICAL_REDIRECT_TO: `  ${TO}  ` },
    [hostRule('elearning.nhatnghe.net'), hostRule('www.nhatnghe.net')],
  );
  assert.deepEqual(errors, []);
});

let failed = 0;
for (const { name, fn } of cases) {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}\n     ${err.message}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
