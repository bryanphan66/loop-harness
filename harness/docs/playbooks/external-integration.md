# External Integration

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> A REQ-ID that calls a **third-party provider** — transactional email (SES /
> Resend), messaging (Zalo / Twilio / Telegram), a webhook-driven partner, an
> external data/AI API. Generalizes the webhook + provider-abstraction rigor of
> `payment-integration.md` to any non-payment integration. `payment-integration.md`
> stays as the concrete money instance; this is the generic pattern for everything
> else. Applies during Build & Go-live **step 2.6** when a phase's REQ-ID carries
> an integration signal (grep: `webhook`, `provider`, `SES`, `Zalo`, `Twilio`,
> `SMTP`, `email-blast`, `SMS`, `3rd-party`, `callback`, `API-key`).

**Macro-stage / step:** Build & Go-live · 2.6 (code). **Gate it serves:** the
non-CRUD leg of `docs/gates/phase-acceptance.md` for an `external-integration`
phase-type.

> The credential-resolution + webhook-verify + idempotency + provider-abstraction
> rules below are authoritative for any external-integration phase.

## Engine

- **Fast path:** `backend-development` (NestJS adapter module + webhook controller +
  signature guard).
- **Role:** Fullstack Dev (+ DevSecOps for the credential + webhook-verify review).
  **Bare-agent fallback:** the provider SDK / REST API directly behind the adapter
  interface — same artifact shape. Per D1 the skill is an accelerator.

## When To Run

- A phase sends through or receives callbacks from a third-party provider.
- A phase adds a second provider for an existing capability (fail-over, per-region).
- Auditing an existing integration for hardcoded prod keys, unverified webhooks, or
  duplicate callback processing.

Skip when the provider is a single fire-and-forget outbound link with no callback
and no credential (e.g. a public "share on X" URL).

## Provider Abstraction (wire, don't couple)

Wrap the provider behind a thin adapter interface even for a single provider — story
code calls the interface, never the SDK:

```text
IntegrationProvider:
  send(message | request) -> providerRef        (outbound)
  verifyWebhook(headers, rawBody) -> Event       (inbound, signature-checked first)
  resolveCredentials(env) -> Credentials         (sandbox vs prod)
```

Benefits: mock in unit tests; swap SES → Resend, Zalo → Twilio without touching
business logic. When outbound sends are bulk/deferred (email-blast), enqueue them
via `async-job-queue.md` rather than sending inline.

## Acceptance categories (the external-integration phase's type-specific AC)

A phase typed `external-integration` REPLACES the CRUD "functional" leg with these;
the verifier (`phase-acceptance.md`) exercises each against the running preview:

1. **Credential resolution (sandbox vs prod)** — prod keys live ONLY in the prod
   secret vault; local dev + CI resolve **sandbox/test** credentials. No hardcoded
   key, no prod key reachable from a test path. The verifier confirms the sandbox
   path is used locally.
2. **Webhook auth verify — to the provider's ACTUAL scheme, read from their docs,
   not a guessed default.** Inbound callbacks are authenticated **before any DB
   read**; unauthenticated → reject (401) before the handler runs. But CHECK how
   the specific provider actually authenticates its webhook — the schemes differ:
   an HMAC-SHA256 body signature in a header (Stripe-style `x-…-signature`), OR a
   shared **API key in the `Authorization: Apikey <key>` header** (SePay), OR a
   basic-auth secret, OR mTLS. Building the generic HMAC assumption when the
   provider actually sends `Authorization: Apikey` means **every real webhook is
   401'd** and payments/events never confirm — a silent integration break that a
   mocked test passes. Verify against the provider's documentation AND at source
   (a real/sandbox callback from the provider gets past auth; a wrong/missing
   credential 401s). Keep it behind the provider port so the scheme is one adapter
   detail. (Learned when a SePay webhook was built HMAC-first; SePay uses Apikey.)
3. **Idempotent webhook handling** — the same callback delivered twice → same state
   (dedupe on the provider event id, same discipline as `payment-integration.md`).
4. **Retry + provider-error surfaced** — an outbound call that fails is retried with
   bounded backoff; on final failure the **real provider error** surfaces to the
   user/operator (no generic "failed to send") — the no-error-swallow floor rule.
5. **Adapter abstraction (provider swappable)** — business logic calls the interface,
   not the SDK; a unit test proves the flow with a mock provider.

Visual-fidelity + negative-path legs still apply to any screen the phase ships
(provider-connect form, delivery-status view) ported from its prototype export.

## Test Mode Discipline

Local dev + CI run against provider **sandbox** mode; inbound webhooks point at a
CI/dev endpoint (tunnel / provider simulator). NEVER run a "test" against prod
credentials to see what happens. Log every outbound + inbound event:
`provider` · `event_type` · `provider_ref` · `outcome: ok|retry|failed|invalid_sig`
· `duration_ms`.

## Cross-Tier Behavior

| Lane | Application |
|---|---|
| Tiny | If any callback exists: signature verify + idempotency are still required. Fire-and-forget outbound with no callback may drop the webhook categories. |
| Normal | Required: sandbox/prod credential split + webhook signature verify + idempotent handling + bounded retry with real-error surface + adapter abstraction. |
| High-Risk | Normal + secret rotation at handover + provider-error alerting + webhook-verify + duplicate-callback negative-path e2e (2.8). |

## Variant Section

(Append a Variant block here when this playbook fails or partially works.)

## Related

- `payment-integration.md` — the concrete money instance of this pattern (webhook +
  PCI + reconciliation); this generalizes its webhook + abstraction rigor.
- `async-job-queue.md` — bulk/deferred outbound (email-blast) enqueues here.
- `docs/gates/phase-acceptance.md` — the per-phase gate this playbook's categories feed.
- `docs/templates/build-manifest.md` — the `Phase-type: external-integration` block shape.
- `docs/playbooks/code-review-scoring.md` — the no-error-swallow floor rule.
- `docs/ROLE_MAP.md` — Fullstack Dev + DevSecOps roles.
