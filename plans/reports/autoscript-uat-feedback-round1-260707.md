# auto-script UAT feedback — round 1 (operator, 2026-07-07 10:39)

Source: operator first look at https://autoscript.160.250.134.226.sslip.io. To be minted as CR-NN / fix items by the next fix leg (run AFTER CR leg `8e2a656b` finishes — same worktree, never parallel).

| # | Issue | Diagnosis (control session) | Fix direction |
|---|---|---|---|
| U1 | Landing/PUB images are placeholders ("Ảnh — Outlier Feed" etc.) | Prototype v3 export ships `<Slot>` placeholders; build ported as-is. Known playbook rule violated: "Real assets required — placeholders do not port" | Capture REAL screenshots of the live app (feed has real YouTube data) for product shots; generate hero/brand imagery if needed; wire into PUB pages |
| U2 | Locale switcher stacks prefix → `/en/en` (404) on repeated clicks | Switcher prepends locale instead of swapping path segment | Fix switcher to swap locale segment; add e2e for double-toggle |
| U3 | Google login fails | Server OAuth entry verified correct (302 → Google, right client_id + registered redirect_uri). Either (a) operator not in OAuth Test users (External/Testing) → 403 access_denied, or (b) post-callback cross-subdomain cookie issue (api-autoscript vs autoscript) | (a) operator adds Test users; (b) if still failing after that: fix session cookie domain (`.160.250.134.226.sslip.io`) / token handoff |
| U4 | OTP email not sent | NOT a new bug — OTP mocked pending CR-A (SMTP transport), in flight in CR leg | CR-A deploys Brevo SMTP; retest J01 |

Awaiting from operator: exact Google error screen text (403 access_denied vs redirect_uri_mismatch vs silent bounce) to disambiguate U3.
