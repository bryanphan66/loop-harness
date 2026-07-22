# Config-Driven Business Identity

**Lifecycle:** verified · **First use:** elearning Macro-2 hardcode sweep (2026-07) · **Verified by:** elearning cert-PDF/invoice/email/SEO de-hardcode batch

> A go-live **floor**: every piece of **business identity** renders from CONFIG (a
> `site_configs`/settings store), never a code literal. Applies to any surface that
> shows the brand, company legal entity, contact, canonical URL, or SEO identity —
> generated documents, transactional email, SEO structured data, page chrome.
> Cross-cutting (cert + invoice + email + web all show identity) → its own playbook
> (DRY), a sweep at go-live, not re-derived per feature. Grep signals for the sweep:
> the brand name, company legal name, tax code, `mailto:`, the product domain, the
> copyright string, a hardcoded year.

**Macro-stage / step:** Build & Go-live · 2.6 (build) + a 2.10 sweep. **Gate it
serves:** the **Config-driven business identity** leg of `docs/gates/dod-build.md`.

> The identity-source rule and the sweep below are authoritative at go-live.

## Engine

- **Fast path:** `ck-scout` / `ck-security-scan` for the literal sweep;
  `backend-development` + `frontend-development` for the config wiring.
- **Role:** Fullstack Dev. **Bare-agent fallback:** `grep -r` the identity literals
  + a settings loader — same artifact shape. Per D1 the skill is an accelerator.

## The failure mode it prevents

A hardcoded brand/company literal **passes a demo glance** because the seeded config
value HAPPENS to equal the literal — cert says "Nhất Nghệ", config says "Nhất Nghệ",
looks fine. It breaks the instant the client edits the value in Settings: the cert
PDF, invoice, email footer, SEO tag, and copyright still show the OLD identity while
the settings screen shows the new one. The defect is invisible until the client
personalises — i.e. right after handover.

## Rule — identity comes from config, not a literal

Every surface below reads identity from the config store (fail-soft to the current
value), never a hardcoded string:

| Surface | Reads from config | NOT a literal |
|---|---|---|
| **Generated document — certificate** | the admin-designed template: `fields_config` (which fields, align) + the uploaded background/design asset | a fixed navy/gold layout with baked title + brand |
| **Generated document — invoice** | `company.legal_name` + `tax_code` + `address` + `phone` + `email` (the seller block) | "Công ty …" + a missing/typed tax code |
| **Transactional email** (OTP / welcome / cert / receipt) | `brand.site_name` in subject + body; a company footer from `company.*` | "Nhất Nghệ" in the greeting/subject |
| **SEO structured data** (json-ld) | `provider.name` from `brand.site_name`; `provider.url` from the canonical base URL | `name:'Brand', url:'https://brand.tld'` |
| **Page chrome** | copyright `company.legal_name` + a **dynamic** year; support `mailto:` from `company.email` | "© 2026 Brand JSC" + a dead year + a hardcoded support mail |

Implementation notes:
- The config loader is **cached** (short TTL) and reachable from the **worker** —
  documents and emails render there, not only in the API. A worker that can't read
  `site_configs` will hardcode by necessity.
- **Fail-soft**: config unavailable → the current identity as a safe default; never
  crash a cert issue / email send on a settings lookup.
- A generated document adopts the **admin-designed template**, not a renderer-baked
  layout — the same "adopt, don't re-draw" discipline as UI fidelity (a cert PDF
  that ignores the designed template is redraw-by-code).

## The go-live sweep (2.10)

1. **Grep** the identity literals across the whole repo: brand name, company legal
   name, tax code, product domain, `mailto:`, the copyright string, any hardcoded
   year. Include `apps/worker` and PDF/email builders — the usual offenders.
2. Every hit in a document / email / SEO / chrome surface is a **defect** → wire to
   config. A hit in seeded DATA (a demo row, a fixture) is fine — it's data.
3. **Prove it flips**: change a brand/company value in the staging Settings screen,
   re-issue a cert / trigger an email / reload a public page, confirm the new value
   appears. A value that doesn't flip is still hardcoded.

## Marketing copy is NOT hardcode — don't downgrade it

A rounded social-proof number ("9.000+ students", "4.9★") is **marketing copy**, not
a live metric. Two legitimate resolutions — never a silent third:
- Wire it to a **real** DB-derived count (real students / published courses), OR
- Keep the rounded figure with a `// marketing copy, not a live count` comment and
  a recorded **business decision** by the owner.

Do NOT silently replace an aspirational rounded figure with an ugly small real
number — that's a business/marketing call for the owner, surfaced, not auto-applied.

## Anti-Patterns

- Brand/company/legal string typed into a cert PDF, invoice, email, json-ld, or footer.
- A certificate renderer with a baked layout that ignores the admin-designed template.
- Config loader that lives in the API only, so the worker's documents/emails hardcode.
- Copyright with a literal year, or a hardcoded support `mailto:`.
- Auto-lowering a marketing social-proof number to the raw DB value without asking.

## Addendum (2026-07-22) — secrets flow + OAuth verify (Kamal example)

- **Split config by sensitivity.** Non-secret identity values (OAuth client id,
  redirect URI, public URLs) go in the deploy config's `env.clear` (committed).
  Secrets (client secret, DB URL, JWT keys) are listed by NAME in `env.secret`, with
  the VALUE stored as a CI/repo secret and materialized into the gitignored
  `.kamal/secrets` by a CI step at deploy time. Never commit a secret value.
- **Verify OAuth landed (not the dev-stub).** After deploy, `GET /auth/google`
  must 302 to `accounts.google.com/...` with the real `client_id` + `redirect_uri`.
  If the env vars are unset the app silently falls back to a dev-stub — a 200/"button
  present" check is not enough; assert the redirect target.
