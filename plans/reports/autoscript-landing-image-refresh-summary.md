# auto-script — Landing Image Refresh (PUB) — summary

**Date:** 2026-07-07 20:23 (+07) · **Branch:** `worktree-macro2-build` · **Commit:** `3e1ff85` · **Deploy:** Dokploy compose `EBvEqNSqJES3xRjhyQB_S` (redeploy from branch HEAD) · **STAGE.md:** 2.12 (untouched)

## What / Why
Landing (PUB) hero + 3 feature shots were captured from the round-1 **flat** UI. Feed/app-shell/dashboard since ported to the new teal 2-col "Cyber-heritage" UI (feed `6e605ca`, shell `544ad8c`, dashboard `e515602`), so the landing product shots were stale. Re-shot from the **live** deployment (new UI) and overwrote the same `/pub` files in place — landing markup (`apps/web/src/app/[locale]/page.tsx`) untouched (REQ PUB landing captures, UAT U1 / NFR.SEO.02). VI + EN landing share these locale-independent shots; pricing uses none.

## Method (no secrets in repo)
- Session: seeded owner `owner@example.com`. SMTP transport live (OTP not logged) → inserted one `otp_codes` row with a known bcrypt hash via db container, verified through real `POST /auth/otp/verify` → real access/refresh tokens (row single-use, consumed).
- Recapture: reused committed `apps/web/scripts/capture-pub-product-shots.mjs` (Playwright headless, viewport 1440×920 @2x, locale vi-VN) against `https://autoscript…sslip.io` (web) / `https://api-autoscript…sslip.io` (api). Routes shot: `/app/feed` (hero + feature), `/app/scripts/{id}`, `/app/brand`. WebP q82, same slot aspect crops.
- Gate: `pnpm validate:quick` clean; pre-commit + pre-push harness verify-gate ran full `validate` (lint+typecheck+api 172 / web 12 tests + build) — all green, not bypassed.
- Redeploy: Dokploy `compose.deploy` (HTTP 200, "Deployment queued") via SSH→localhost:3000 (API key kept off argv/repo, remote temp header file shredded).

## Images replaced (all 4, in place, same filenames)
| file (`apps/web/public/pub/`) | before B | after B | md5 changed | source screen (new UI) |
|---|---|---|---|---|
| `hero-outlier-feed.webp` | 129762 | 116614 | yes | Feed Outlier — 2-col board |
| `feature-outlier-feed.webp` | 82908 | 77322 | yes | Feed Outlier — 2-col board |
| `feature-script-editor.webp` | 100948 | 99524 | yes | Script editor (app-shell) |
| `feature-brand-blueprint.webp` | 98808 | 110794 | yes | Brand Blueprint (app-shell) |

Visual diff verified: all 4 are teal 2-col board / app-shell UI, no flat round-1 remnants.

## Post-deploy smoke (live)
- Landing 200: `/` (vi), `/en`, `/pricing`, `/en/pricing`.
- `/pub/*.webp` all serve new byte-sizes above, `content-type: image/webp` (matches local exactly).
- Landing hero renders the new 2-col Feed Outlier shot + float cards → `plans/reports/assets/autoscript-landing-after-deploy-260707.png`.

## Guardrails honored
Worked in existing worktree `.claude/worktrees/macro2-build`; secrets never entered git (only 4 binary webp staged); verify-gate not bypassed; STAGE.md still 2.12; no other project's containers touched; no mid-run questions.

## Unresolved
None.
