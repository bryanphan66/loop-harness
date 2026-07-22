# Go-Live Deploy & Verify-at-Source

**Lifecycle:** verified · **First use:** elearning Macro-2 go-live (2026-07) · **Verified by:** elearning prod deploys (cert-PDF + brand batch, dokploy)

> The **Go-live** half of Macro-Stage 2: moving a DoD-passed build onto a running
> host and *proving the running artifact is the released one*. Owns the deploy +
> post-deploy verification recipe. Applies whenever a phase's output is pushed to a
> staging/prod box (grep: `deploy`, `compose`, `Dockerfile`, `redeploy`, `health`,
> `NEXT_PUBLIC`, `env`, `secret`). Cross-refs the org deploy standard (verify-at-
> source, fail-closed, version-push-as-gate).

**Macro-stage / step:** Build & Go-live · 2.11–2.12 (deploy + confirm). **Gate it
serves:** the deploy corollary of `docs/gates/dod-build.md` and the client
ACCEPTANCE gate (a staging URL the client can actually UAT must be the built code).

> The five rules below are authoritative for any deploy of a harness build.

## Engine

- **Fast path:** `devops` (compose/Docker/CI + host deploy); `ck-deploy` where the
  target is a PaaS.
- **Role:** DevSecOps. **Bare-agent fallback:** `docker compose` + the host's
  deploy API (dokploy `compose.deploy`, Fly `deploy`, etc.) directly — same
  artifact shape. Per D1 the skill is an accelerator.

## Rule 1 — Build-time-inlined env is a build ARG, never only a runtime env

Frameworks that **inline** env at build time (Next.js `NEXT_PUBLIC_*` into the JS
bundle, Vite `VITE_*`, CRA `REACT_APP_*`, and any SSR file that reads the value at
build — e.g. `sitemap.ts`, canonical/OG tags, json-ld) bake the value into the
artifact. A runtime `environment:` entry is **too late** — the wrong value is
already compiled in.

- Pass the value as a Docker **build ARG** (`ARG NEXT_PUBLIC_SITE_URL` + `ENV … =$…`
  *before* the `RUN … build`), fed from `compose … build.args`. Set it in BOTH
  `build.args` and `environment` (runtime code that also reads it).
- **Redeploy of the same commit reuses the image-layer cache** → the new ARG value
  does NOT take unless the layer is invalidated. A value-only change needs a
  source-changing rebuild (or `--no-cache`). "I set the env and redeployed" ≠ "the
  bundle changed."
- Symptom this catches: prod still emits `localhost:3000` in `sitemap.xml`/OG after
  the domain env was "set" — because it was set as a runtime env on a cached image.

## Rule 2 — Verify at the SOURCE, by health + content marker, not a proxy

A green CI run, an HTTP 200, and a version field are all **liars** for "the new
build is live": a 200 can be the OLD container still serving; CI green only proves
the image built; a `commitSha`/version can be pinned or `local-dev` on the box.

- Confirm **health** at the running box: `.status==ok` (+ `.database==ok`,
  `.redis==ok` where applicable). Health-red → the deploy broke; auto-rollback.
- Confirm a **content marker** that only the new build produces — a value the new
  code changed that is observable in the served HTML/API (a config-driven brand now
  showing in json-ld, a new route returning 200, a removed literal now absent). The
  marker is the flip proof; health alone only proves *a* container is up.
- **Pick the marker deliberately.** A literal that appears in seeded DATA (a CDN
  image URL on the vendor's real domain) is NOT a code-flip marker — it never flips
  and you wait forever on a false negative. Grep the served page to see WHERE the
  literal sits before trusting it.

## Rule 3 — A placeholder default that PASSES the fail-closed check is worse than a missing one (extends v6.14)

v6.14: a new fail-closed prod secret must ship with its deploy-env value or the
deploy crash-loops. The dual failure: a compose default like
`${SEPAY_API_KEY:-sandbox-…}` / `${SEPAY_ACCOUNT_NUMBER:-0000000001}` is **non-empty**,
so it **sails through** a presence-only fail-closed check — and prod boots GREEN on
a **fake money/identity config** (payments route to account `0000000001`, the
sandbox key never confirms webhooks). A silent wrong-config is worse than a loud
crash.

- For **money/identity/legal** secrets, the fail-closed guard rejects **known
  placeholders** in production, not just empty — blacklist `sandbox*`, `*placeholder*`,
  all-zero account numbers, `changeme*`. Presence is not validity.
- Do **not** inject a plausible-looking default for those secrets in the deploy
  compose — an unset var should fail closed, loudly. Non-secret **display** values
  (bank name, QR endpoint, from-name) may keep a `:-default` so the box still boots.

## Rule 4 — Fail-closed hardening ships to REAL prod, not the shared demo box

A hardening that rejects placeholder creds (Rule 3) will **crash-loop** the
dev/staging/demo box that *intentionally* runs on placeholders (mailpit, seed
admin, `ALLOW_PROD_SEED`). Deploying it there takes the demo down.

- Sequence for real-prod cutover: **set the real creds in the deploy env FIRST**,
  *then* deploy the hardening. Verify the box refuses to boot when the real cred is
  absent (fail-closed proven at source).
- Keep the hardening on its own branch, un-deployed to the demo box, until the
  real-prod moment. Record it in the report as "deploy env the control must set
  before this ships" (the v6.14 corollary). Confirm which box you're on before you
  ship a fail-closed change — demo vs real-prod is a deploy decision, not a code one.

## Rule 5 — The prod deploy is an explicit, named-endpoint human decision

The deliberate act of deploying (or pushing the release tag) IS the release
decision — an agent surfaces it for a human to approve against the **named target**,
never fires it silently. A generic "deploy" with no named endpoint/host is not an
approval. (An auto-mode classifier enforcing exactly this is a feature, not a
blocker: name the endpoint, then ship.)

## Post-Deploy Checklist (fill at 2.12)

- [ ] Health at source `.status==ok` (+ db/redis) on the actual box.
- [ ] Content marker for THIS build observed in the served artifact (not CI/200/version).
- [ ] Build-time env values correct in the served bundle (Rule 1) — rebuilt, not cached.
- [ ] Money/identity/legal secrets: real values in deploy env, fail-closed proven (Rule 3/4).
- [ ] Deploy fired against the named target with human go-ahead (Rule 5).
- [ ] Rollback path known (flip the image/version pin; git-reset the agent).

## Anti-Patterns

- "CI is green / it returned 200 / commitSha shows the tag" → deployed. (Rule 2.)
- Setting a `NEXT_PUBLIC_*` as a runtime env and redeploying the same commit. (Rule 1.)
- A compose `${MONEY_SECRET:-plausible-placeholder}` default. (Rule 3.)
- Shipping a fail-closed hardening to the demo box that runs on placeholders. (Rule 4.)
- An agent auto-firing a prod deploy with no named endpoint. (Rule 5.)

## Addendum (2026-07-22) — two-environment model + mechanism-specific verify

A project commonly runs **two deploy environments with different tools**. Do not
assume one deploy path.

| Env | Tool | Branch | Verify-at-source |
|---|---|---|---|
| DEV | Dokploy (docker compose) | dev-env branch | behavioral route/asset probe |
| STAGING (client UAT) | Kamal 2 + GitHub Actions | staging branch | container name carries git SHA |

- **`redeploy` != `deploy`.** Dokploy `compose.redeploy` only RESTARTS the existing
  containers (old image) — new code 404s. Use `compose.deploy` to pull + rebuild
  from git. Same trap shape exists on any tool that separates "restart" from "rebuild".
- **Verify-at-source depends on the mechanism.** Kamal names containers with the
  deployed git SHA (`<service>-web-<sha>`) — SSH `docker ps`, match the tag to the
  merged commit. The health `commitSha` field is frequently useless (`local-dev` /
  `unknown` because the build never injected it) — do NOT trust it. When no reliable
  version stamp exists, verify **behaviorally**: probe a route/asset that exists ONLY
  in the new commit and confirm 404 -> 200. Never trust CI-green or an HTTP 200 alone.
- **DNS has no wildcard by default.** `app.example` and `api.app.example` resolving
  does NOT mean `mail.app.example` resolves — each subdomain is an explicit record.
  Exposing a new accessory (webmail, admin tool) needs a DNS record from ops first.
- **Cold-start after deploy:** the first hit to each dynamic route after a fresh
  deploy can take several seconds (server warms the route); subsequent hits are fast.
  See `build-execution.md` (ISR) for the fix, and diagnose before blaming auth.
