# auto-script — OTP login → dashboard "Unauthorized" fix (AUTH.OTP.02)

Date: 2026-07-07 · Branch: `worktree-macro2-build` · Commit: `e88d18f` · Deployed: Dokploy compose `EBvEqNSqJES3xRjhyQB_S` (redeployed + live-smoked)

## Symptom
After OTP login, `/app/dashboard` renders but ALL data cards show "Unauthorized" + Thử lại; KPI stat cards empty. Google login fine.

## Reproduction (live, Playwright)
- **Clean browser profile + OTP login → NO bug.** All data calls 200. The handoff's "requests never reach the API" hypothesis was wrong — requests DO reach the API with a Bearer header; they 401.
- **Poisoned profile → bug reproduced exactly.** Planting stale `access_token`/`refresh_token` cookies scoped `domain=.160.250.134.226.sslip.io` (what a prior dead Google-OAuth session leaves behind), then OTP login → dashboard loads, 4/4 cards "Unauthorized", KPIs "—".

## Root cause — split-brain cookie scopes
Two writers share the same cookie names at different scopes:
- **Google flow**: API `setSessionCookies` (auth.controller) sets them **domain-wide** (`AUTH_COOKIE_DOMAIN=.160.250.134.226.sslip.io`).
- **OTP / admin login / refresh rotation**: web `setSession` (session.ts) set them **host-only** on the web host.

The browser stores both variants as SEPARATE same-name cookies; `document.cookie` lists the OLDER first. Failure chain:
1. Google login → domain-wide cookies.
2. Logout: API `logout` bumps `tokenVersion` (kills all tokens) and calls `res.clearCookie` — but `apiFetch` is a cross-origin fetch **without `credentials:'include'`**, so the browser ignores the response's Set-Cookie → domain cookies survive, now permanently dead.
3. Client `clearSession` only deleted host-only cookies → dead domain cookies still survive.
4. OTP login → `setSession` writes fresh HOST-ONLY cookies → jar now has TWO `access_token`s; `readCookie` first-match returns the DEAD domain one.
5. Every data call: dead Bearer → 401 → refresh attempt uses the dead refresh token → 401 (tokenVersion mismatch) → `clearSession` deletes the FRESH host-only tokens, keeps the dead ones → "Unauthorized" on every card, forever (SSR layout gate still passes because the dead cookie exists).

## Fix (commit `e88d18f`)
- `apps/web/src/lib/auth/session.ts`
  - `purgeCookie()`: every `setSession`/`clearSession` first deletes the token cookies on the host AND every ancestor domain scope (`location.hostname` suffix walk) — exactly one copy ever survives; logout now really clears the OAuth domain cookies.
  - `readCookie()` prefers the LAST (most recently set) occurrence — fresh login shadows any stale leftover even before purge runs (covers Google-after-OTP direction too).
  - `secure` attr on https.
- `apps/api/.../auth.controller.ts`: OAuth session-mirror cookies get matching `secure` when `WEB_APP_URL` is https.
- Google flow untouched otherwise: API still sets domain-wide cookies; client reads them for Bearer; first refresh rotation normalizes to host-only.

## Tests
- Unit `apps/web/src/lib/auth/session.test.ts` (5): duplicate-scope shadowing (last-match), set/clear round-trip, decode. 
- E2E `apps/web/e2e/auth-otp-dashboard-data.spec.ts`: plants a bcrypt-known OTP row via psql (docker `autoscript-db-1`, override `E2E_PSQL`), poisons the jar with stale cookies, OTP login → dashboard, asserts all 4 cards reach real empty/data states, `Unauthorized` count 0, zero 401 responses. PASS.
- Suites: `pnpm validate:quick` clean; api jest 172/172; web vitest 17/17; e2e auth-signin (incl. Google mock OAuth) + overview-dashboard 5/5 PASS. Pre-commit verify gate ran full `pnpm run validate` (lint+typecheck+test+build) — green.

## Deploy + live smoke (after fix)
- Pushed `worktree-macro2-build` → Dokploy `compose.deploy` (via SSH; panel port 3000 not reachable from workstation) → new web/api containers up.
- Smoke (Playwright, poisoned jar + real OTP login as `otp-smoke@reno.ai.vn`, code planted in db):
  - Landed `/app/dashboard`; **14/14 API calls 200** (`/auth/otp/verify`, `/channels`, `/scripts`, `/ideas`, `/usage/me`, `/feed`, `/scans`, `/billing/me`, `/workspaces/me`, `/models`, `/prompts`), **0 "Unauthorized"**.
  - Stale domain-wide cookies confirmed PURGED — final jar: host-only `access_token`/`refresh_token`, `secure=true`.
  - Screenshot: `assets/autoscript-otp-dashboard-after-fix-smoke-260707.png` (KPIs real values, all cards proper empty states).
  - Before-fix evidence is the captured network/body transcript (4× "Unauthorized", cards KPI "—"); its screenshot was lost to a rerun overwrite — mechanism fully documented above.

## Notes
- STAGE.md untouched (still 2.12). No other project containers touched. Secrets stayed in `~/.secrets/autoscript-dokploy.env`.
- Smoke residue in staging db: user/workspace `otp-smoke@reno.ai.vn` + consumed otp_codes rows — harmless; drop before client UAT if a pristine db is wanted.

## Unresolved questions
- Handoff claimed "no /channels|/scripts calls in api logs" pre-fix — not confirmed; Nest doesn't access-log guard-rejected requests, likely observation artifact.
- `logout`'s cross-origin `res.clearCookie` remains a no-op by design (non-credentialed fetch); harmless now that client purge covers all scopes. Optional cleanup: drop those two clearCookie lines.
