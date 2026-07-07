# Auto Script — UAT-Fix Round 2 summary (brand tokens + SePay live QR)

**Date:** 2026-07-07 · **Branch:** `worktree-macro2-build` · **Deployed image:** `d8f68fb` (Dokploy compose `EBvEqNSqJES3xRjhyQB_S`)
Full report: `auto-script/plans/reports/macro2-uat-fix-round2-report.md`. STAGE.md still 2.12 (ACCEPTANCE pending).

## Done

- **VIỆC 1 — portal brand teal (design-system-compliance).** APP/ADM zone (workspace + admin) shipped the scaffold's zinc `@theme` in `apps/web/src/app/globals.css` instead of the frozen Cyber-heritage teal (PUB zone was already correct). Fixed by swapping only the 7 token VALUES → teal (`primary 191 85% 36%`), light + latent dark; no component markup changed (all colors already token-driven, 0 hardcoded hex). Commit `2ea30ca`.
  - **Live proof:** served CSS `--color-primary:#0e8daa` (light) + `#29bfe0` (dark), zinc gone; Playwright screenshots of dashboard + feed + admin-login all teal (`auto-script/plans/reports/assets/teal-*.png`), contrast intact.
- **VIỆC 2 — SePay live QR (CR-20, BILL.GW.01).** Checkout was `SEPAY_MODE=mock` → no QR. Now live mode builds the real, keyless public VietQR `qr.sepay.vn/img?acc=…&bank=…&amount=…&des=<memo>` (endpoint verified 200 image/png); panel renders it inline. `SEPAY_MODE` flipped to `live` on staging. Commit `d8f68fb`.

## Verify + deploy

- Verify gate green each commit (lint + typecheck + 172 unit/17 snapshot + build) via pre-commit & pre-push; billing e2e 8/8.
- Pushed to `origin/worktree-macro2-build`; Dokploy `compose.update` (SEPAY_MODE=live) + `compose.deploy`; containers recreated 16:29:40 (+07); `GET /health` 200, web `/` 200, `/admin/login` 200.
- Live checkout smoke: `POST /billing/subscribe` → 201, returns safe sandbox fallback (no error) because bank account not yet set.

## ⚠️ VIỆC 2 NEEDS OPERATOR — bank account

**Yes — operator must provide a bank account for a payable QR.** The public VietQR image needs the operator's SePay-linked destination account, which is NOT in `~/.secrets` and could NOT be auto-derived (both SePay userapi tokens 401 = invalid; not fabricated). Supply in Dokploy compose env:

- **`SEPAY_BANK_ACCOUNT`** — bank account number
- **`SEPAY_BANK_CODE`** — bank short name (e.g. `Vietcombank`, `MBBank`, `ACB`)

Setting them (a Dokploy env change auto-redeploys) makes the same checkout endpoint return a real `qr.sepay.vn/img` QR — no code change. Until then checkout returns a non-payable sandbox URL. CR-19 webhook (payment confirmation) is unaffected and still live.

## Other notes

- `SEPAY_API_KEY` env dropped (was only used by the removed `userapi/qr-generate` path); still present in Dokploy but ignored.
- APP/ADM dark tokens are in place but no dark toggle wired in that zone yet (latent) — wire only if operator wants dark mode in the portal.
- Optional: a valid `my.sepay.vn` userapi token if webhook-reconciliation polling is later wanted (not required for launch).
