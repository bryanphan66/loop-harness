# auto-script — SePay webhook response envelope fix (CR-19 / BILL.GW.02)

**Status:** DONE — shipped to staging, real smoke PASS.
**Date:** 2026-07-07 · **Branch/worktree:** `worktree-macro2-build` (`.claude/worktrees/macro2-build`) · **Commit:** `2c47e53`

## Problem
SePay test-mode rejected the webhook: "Response không đúng quy cách — Body thiếu `{"success": true}`". Endpoint returned 200 `{"ok":true}`; SePay strictly requires `{"success": true}` in the 200 body. Auth (Apikey) + transaction processing were already correct.

## Fix
Single change point — `BillingWebhookController.handle` in `apps/api`. Service `process()` either throws (401 bad auth) or resolves for **every** other branch (activate / duplicate no-op / content+amount mismatch / unknown workspace / unrecognised event), and the controller has one shared 200 return. So changing that one return covers all "must-200" branches at once.

- `apps/api/src/modules/billing/controllers/billing-webhook.controller.ts` — return `{ success: true, ok: true }` (was `{ ok: true }`); return type + comment updated. `ok:true` kept for legacy internal-simulator back-compat; `success:true` is the mandatory field.
- Web proxy `apps/web/src/app/api/billing/sepay/webhook/route.ts` — **unchanged**; it forwards the upstream API body/status verbatim, so the new envelope flows through to SePay untouched. (This is the URL registered in the SePay panel: `.../api/billing/sepay/webhook` → proxies to API `POST /billing/webhooks/sepay`.)
- `apps/api/test/billing-webhook-idempotency.e2e-spec.ts` — added `expect(body.success).toBe(true)` on the accept, duplicate-replay, and amount-mismatch paths.

## Verification
- `validate:quick` (lint + typecheck, all 4 workspaces): PASS.
- Pre-commit + pre-push full verify gate (`lint && typecheck && test && build`): PASS — api 172 unit tests, web 12, both builds green.
- Billing webhook e2e (real Postgres): 8/8 PASS incl. new `success` asserts. Unit `billing-webhook.service.spec`: 5/5 PASS.

## Ship + deploy
- Pushed `561a016..2c47e53` → `origin/worktree-macro2-build`.
- Dokploy redeploy compose `EBvEqNSqJES3xRjhyQB_S` via `POST /api/compose.deploy` (over `ssh deploy@160.250.134.226:2222`) → HTTP 200; API container `auto-script-app-qeyjyx-api-1` recreated.

## Real smoke (deployed staging)
`POST https://autoscript.160.250.134.226.sslip.io/api/billing/sepay/webhook`
Header `Authorization: Apikey <SEPAY_WEBHOOK_SECRET>` (read from deployed container env), SePay real-shape payload with a benign non-order memo (auth passes → 200, memo doesn't match any order → no mutation):

```
attempt 1 → HTTP=200 body={"success":true,"ok":true}  → SMOKE_PASS
```

Confirms: real-shape detected, Apikey auth passed, 200 + `success:true`, zero side effect.

## Hard-rule compliance
Secrets never entered git (read from container env / job tmp, temp shredded). Verify gate not bypassed. `STAGE.md` still 2.12 (untouched). No other project's container modified (only read env from auto-script's own `-api-1`).

## Unresolved questions
None.
