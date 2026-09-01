# User-Guide (HDSD) Route-Based Standard

**Lifecycle:** verified · **First use:** elearning 2026-07 · **Verified by:** hasi-hub (reference impl)

> The in-app user guide (Vietnamese: Hướng dẫn sử dụng / HDSD) MUST be route-based
> (`/huong-dan/[slug]`), one route per section, NOT a single long page split by
> `#section` anchors. Owns the user-guide slice of any UI phase + 2.10 QA evidence.

**Macro-stage / step:** Build & Go-live, step 2.6 (per user-facing feature) + 2.10.
**Gate it serves:** DoD (user-guide present + navigable). Shape: **structural framework**.

## Engine

- **Fast path:** `frontend-development` — scaffolds the `[slug]` route + registry.
- **Bare-agent fallback:** the global frontend agent mirrors the reference structure below.

## When To Run

Build or refactor the in-app user guide. **Skip when:** the product has no end-user
guide requirement, or the guide is an external docs site (different playbook).

## The standard (mirror the reference implementation)

The guide is **N routes, one per section**, statically generated:

```
app/(public)/huong-dan/page.tsx          index — lists sections grouped by role, links to routes
app/(public)/huong-dan/[slug]/page.tsx   detail — generateStaticParams() over the registry (SSG)
lib/guides/guides-registry.ts            single source: sections {slug, title, role, blocks}
components/public/guides/guides-sidebar  navigates to ROUTES (not #anchors)
components/public/guides/guide-step-card + guide-pager   step blocks + next/prev
```

- **One route per section**, slug = the section id (keep existing slugs stable; they
  are deep-linkable and cited from the client UAT sheet as `/huong-dan/<slug>`).
- **SSG** via `generateStaticParams()` over the registry — routes are pre-rendered
  (fast, cached), unlike a `force-dynamic` single page.
- **Sidebar navigates to routes**, not in-page `#anchors`. Pager gives next/prev.

## Labels never expose internal codes

The guide is end-user facing. A step/criterion label MUST read as a task
("Email chưa có tài khoản: nhận OTP, tự tạo tài khoản"), NOT carry the internal
acceptance-criterion code ("AC1 - ..."). Fix this at the DATA layer (the registry
`label` field) so both code and UI are clean. A per-block anchor id (e.g. the AC id)
MAY remain as a hidden deep-link target, but the visible label carries no code.

## Section -> slug mapping

Each guide section maps to exactly one feature/AC cluster (token-chain, see
`feature-issue-ac-demo-standard.md` and `TRACE_SPEC.md`). Keep the section slug
human-readable and stable; the UAT deliverable links to the section route.

## Verification gate

- Every registry section resolves to a reachable `/huong-dan/<slug>` route (SSG build
  emits it); the index links all of them; sidebar links are routes not anchors.
- No visible label contains an internal code (grep the registry for `AC\d`, `REQ`, id
  prefixes in `label`).
- `next build` succeeds with the `[slug]` static params.

## Cross-Project Use

Portable. Any project's user guide adopts the route + registry + SSG shape; only the
slugs and copy are project-specific.
