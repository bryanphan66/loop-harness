# Regression checklist (TEMPLATE — replace with THIS project's core flows)

Run before **every large deploy** to catch a change silently breaking a flow that already worked. This is the safety net for the whole app; per-issue QC is separate. Replace the example rows below with your project's real core flows; keep the shape.

- Environment: staging (set `git config deploy.stagingurl https://...`).
- How: click each item, tick PASS. Any FAIL -> file a bug via `.github/ISSUE_TEMPLATE/bug-report.md`, link it here.
- **[P0]** = blocker; a FAIL there blocks the release.

## 1. Authentication [P0]
- [ ] Sign up a new account -> receive verification (email/OTP) -> activate.
- [ ] Log in (password + any SSO) -> lands on the right home.
- [ ] Wrong credentials -> clear error, no access.
- [ ] Log out -> session ends, protected routes blocked.

## 2. Core transaction (money / order / booking — if any) [P0]
- [ ] Happy path completes end to end.
- [ ] Amount/price is the one captured at creation, not re-priced mid-flow.
- [ ] On success the entitlement/record appears where the user expects it.

## 3. Core workflow (the app's main verb) [P0]
- [ ] The primary user journey works start to finish.
- [ ] Progress/state persists correctly across steps.
- [ ] A user without permission cannot reach gated content.

## 4. Admin / RBAC [P0]
- [ ] CRUD + publish on the main managed entity -> reflects on the user side.
- [ ] A lower-privilege account cannot perform higher-privilege actions (no IDOR / privilege escalation).

## 5. Reports / dashboard
- [ ] KPIs + charts show correct numbers; a chart total ties to its KPI tile.
- [ ] Date/segment filters change the data correctly; empty range renders (no crash).

## 6. Notifications / email [P0]
- [ ] Transactional emails/notifications fire with correct content (read them on staging's mail catcher).

---
Note: after QC-ing a flow by hand, have a coder add an e2e test (Playwright) so next time it runs automatically — this list should shrink toward "flows not yet automated".
