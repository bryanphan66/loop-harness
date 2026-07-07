# auto-script UAT-fix round 1 — summary (2026-07-07, fix leg)

Full report: `auto-script` repo (worktree `macro2-build`) `plans/reports/macro2-uat-fix-round1-report.md`. Deployed: Dokploy image at `ddd1047`, health 200, live mode restored. STAGE.md still 2.12 (ACCEPTANCE pending).

| # | Status | One-liner |
|---|---|---|
| U1 | ✅ FIXED + deployed | Landing VI+EN: all 4 slots now REAL captures from live staging (Outlier Feed w/ MrBeast+Veritasium+MKBHD data, Script Editor w/ real Claude script, real Brand Blueprint); logo strip + avatar = token CSS-art. Pricing has no image slots. Capture script committed for regeneration. |
| U2 | ✅ FIXED + deployed | Root cause: PUB switcher read stale `useLocale()` after soft nav → re-prepended `/en`. Now pathname-derived. Double-toggle e2e added; staging smoke: 4× toggle + pricing round-trip, no `/en/en`, no 404. |
| U3 | ✅ (b) fixed + proven / ⏳ (a) operator | Diagnosis (b) confirmed: session cookies were host-only on `api-autoscript.` → silent bounce to signin. New `AUTH_COOKIE_DOMAIN=.160.250.134.226.sslip.io` (Dokploy env + compose + example). Proven in real browser: full flow (mock Google hop) from web domain → cookies cross subdomains → `/app/dashboard`, reload keeps session; live mode restored + entry redirect to Google re-verified. **Remaining = U3a: operator adds self to OAuth Test users (auto-script-501702), then retests real Google login.** |
| U4 | — (already handled) | Brevo SMTP live since CR-17; operator retest J01 OTP email. |

Staging side effects (additive, disclosed in full report): +2 channels + 1 scan (feed now 29 results), +1 brand blueprint, owner@example.com tokenVersion bumped + hasGoogleLinked marked. Verify gate: lint/typecheck/169 unit/build per commit; related e2e 14/14.

**Operator asks:** (1) add Google Test user → retest login; (2) keep/wipe added demo content before formal UAT; (3) fictional partner wordmarks OK for UAT or need real assets pre-launch?
