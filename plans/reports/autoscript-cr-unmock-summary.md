# auto-script — CR Unmock Leg Summary (2026-07-07)

**Goal:** operator decision 09:08 "release 100% real, no mock" — remove the 3 remaining mocked points found by the staging deploy leg. **Done + redeployed + smoked live.** STAGE.md untouched (still 2.12 awaiting ACCEPTANCE); CRs are UAT prerequisites.

Change-control per WORKFLOW 3.5: minted **CR-17/18/19** in `docs/requirements/change-requests/change-request-log.md`, re-entered 2.6, one commit per CR (`2d4b480` mint → `ceb1a33` CR-17 → `a322dfe` CR-18 → `076bea5` CR-19 → `dd61ad6` CR-18 fix), each through the full verify gate; e2e 146/146. Deployed commit `dd61ad6` on Dokploy (branch `worktree-macro2-build`).

| CR | Change | Live smoke result |
| --- | --- | --- |
| CR-17 EMAIL | SMTP transport (nodemailer STARTTLS 587) beside Resend; `EMAIL_TRANSPORT` + `SMTP_*`/`EMAIL_FROM` env; Brevo creds in Dokploy panel | OTP request → 200 in 1.8s (real SMTP round-trip, no `[mock-email]`); **real code email sent to admin@reno.ai.vn — operator confirm inbox** |
| CR-18 AI | anthropic + deepseek served over the OpenAI-shape omniroute gateway (one client; `ANTHROPIC_BASE_URL`→fallback `OPENAI_BASE_URL`); LOCKED prompts untouched, snapshots byte-identical | Real script-gen: 7,966-char VI script on `claude-sonnet-4-6`, tokens 3813/5206 `token_source=api`; deepseek-chat real completion. **Smoke caught a real bug:** gateway 504s non-streaming >30s → client now streams + re-aggregates SSE (`dd61ad6`) |
| CR-19 SEPAY | Real SePay webhook payload + `Authorization: Apikey` auth normalized onto internal contract; legacy HMAC curl simulation kept; web proxy forwards auth header | Wrong key 401 · real payload (bank-wrapped memo, 179,000₫) 200 → subscription **pro active** + ledger row · duplicate 200 no-op |

Still mocked (only remaining): SePay **checkout** QR (`SEPAY_MODE=mock` — real webhook path works regardless) and Supadata transcripts (no key). Full detail + UAT data side-effects + 3 open operator questions: `auto-script` repo `plans/reports/macro2-cr-unmock-report.md`.
