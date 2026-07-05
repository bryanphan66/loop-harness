# Payment Integration

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Building any feature that takes money: one-time charge, subscription,
> marketplace, in-app credit, refund flow. Provider-agnostic — Stripe, SePay (VN
> VietQR), Paddle, Polar, Creem, bank transfer, anything with a webhook. Covers
> idempotency, refund/dispute, reconciliation, PCI scope minimization, audit-log
> shape. Applies during Build & Go-live **step 2.6** whenever money is in scope.

**Macro-stage / step:** Build & Go-live · 2.6 (code) — and a hard gate that pushes
the feature to the **high-risk lane** (red-team required at 2.9 security).

> The webhook + PCI + audit rules below are authoritative.

## Engine

- **Fast path:** `ck-payment-integration` (checkout / webhook / subscription
  scaffolding for SePay, Polar, Stripe, Paddle, Creem). Pairs with `better-auth`
  when auth + payment are both in scope.
- **Role:** Fullstack Dev (+ DevSecOps for the security review). **Bare-agent
  fallback:** the provider SDK / REST API directly. Per D1 the skill is an
  accelerator.

## When To Run

- A phase introduces or modifies payment behavior (charge, subscription, refund,
  dispute, payout, invoice).
- Integrating a new provider.
- Auditing existing payment behavior for compliance, reconciliation drift, or
  webhook reliability.

Skip when payment is a single "Buy on Gumroad" external link with no callback.

## Webhook Handling (Critical)

Webhooks are the source of truth for state changes. The handler MUST be:

### Idempotent

Same webhook delivered twice → same state.

```text
1. Receive → extract provider's event ID (e.g. evt_xxx).
2. Look up event ID in `webhook_events`.
3. exists + processed → return 200 without re-processing.
4. exists + processing → return 409 (provider retries).
5. new → insert event row (processing) in the SAME transaction as the state
   change. Commit. Update processed.
6. failure → leave failed + error + retry counter. Manual / scheduled retry.
```

Without this, a duplicate webhook = double-charge OR double-refund.

### Verified

Verify the signature BEFORE the handler does anything. Stripe `Stripe-Signature`
per `constructEvent`; SePay bank-transfer hash; Paddle/Polar signed HMAC. Reject
unsigned / invalid-signed with 401 **before any DB read**. Unverified handlers are
how scammers fake "payment received".

### Replay-Safe

Provider may resend out of order. Tolerate missing precursor records (look up by
external ID, create a stub if needed); compare event timestamp to stored state,
ignore stale updates; never assume sequential order.

### Logged

Every receipt + outcome: `action: webhook_received`, `provider`, `event_type`,
`event_id`, `outcome: ok | duplicate | invalid_sig | failed`, `duration_ms`.

## Refund / Dispute Flow

Refunds are state changes, not just provider API calls. Each refund: logs to
`payments` with `type: refund` + link to the original `payment_id`; triggers a
`refund.created` webhook (handler updates internal state); notifies the user;
adjusts downstream state (subscription, credits, access).

Disputes (chargebacks) are higher-stakes: auto-pause the account/subscription on
`dispute.created`; log evidence (timestamps, IPs, fulfillment) to a dispute
record; surface to admin within the provider's deadline (7-21 days). Refund +
dispute UI is admin-facing; customer-facing is "request refund" → ticket → admin.

## Reconciliation

At least daily, reconcile provider state vs internal state:

```text
For each provider account:
  List events / charges since last reconciliation.
  Compare against `payments`.
  Surface drift to admin / monitoring.
```

Drift causes: missed webhook (endpoint down) → reprocess; manual
dashboard refund without internal record → backfill; double-processed webhook →
de-dupe + fix the bug. VN bank-transfer (SePay) reconciliation is daily-or-more —
bank records often lag webhook delivery.

## PCI Scope Minimization

Do NOT touch card numbers / CVV, ever. Store the provider's tokenized references
(`pm_xxx`, `tok_xxx`), not the card.

- **Capture:** provider-hosted (Stripe Elements/Checkout, SePay redirect). Your
  server never sees the raw PAN.
- **Storage:** payment-method ID + last4 + brand + expiry month/year. Nothing else.
- **Logging:** redact anything matching `\d{13,19}` before writing logs.
- **Compliance:** SAQ-A if fully provider-hosted. Drifting into iframes / direct
  API submission jumps scope to SAQ-A-EP or SAQ-D. Verify SAQ scope **before 2.6
  starts** — drift after launch is expensive.

## Provider Abstraction

Wrap SDK calls in a thin interface even if single-provider:

```text
PaymentProvider:
  create_checkout(amount, currency, customer, success_url, cancel_url) → url
  get_payment(id) → Payment
  refund(payment_id, amount?) → Refund
  on_webhook(headers, body) → Event   (after signature verify)
```

Story code calls the interface, not the SDK. Benefits: mock in unit tests; swap
provider (Stripe → Paddle, SePay → VNPay) without touching business logic. VN: SePay
primary for VietQR + a secondary international processor (Stripe / Paddle MoR) for
foreign cards — the abstraction makes per-currency routing clean.

## Test Mode Discipline

Production keys live ONLY in the production secret vault. Local dev + CI run
against provider test mode. Test-mode webhooks point at a CI/dev endpoint
(`cloudflared tunnel` / `ngrok` / provider simulator). E2E tests
(`canonical-e2e-flow-playbook.md`) use test-mode cards (`4242 4242 4242 4242` for
Stripe). NEVER run a "test" against production keys to "see what happens".

## Audit-Log Requirements

Payment events are product records, not just app logs. Row shape: `timestamp` ·
`actor: user|system|admin` · `action: payment_created|payment_succeeded|payment_failed|refund_issued|dispute_opened|subscription_renewed` ·
`payment_id` (internal) · `provider_event_id` (external — grep against the provider
dashboard) · `amount` · `currency` · `user_id` · `result: ok|failed|pending` ·
`metadata`. Retention ≥7 years for tax/dispute defence (jurisdiction-dependent;
verify with counsel).

## Subscription-Specific

If subscriptions are in scope: decide pro-ration on plan change upfront (record as
a decision); the trial→paid webhook must flip access state (test the trial-end
edge explicitly); distinguish "cancel at period end" (default) vs "immediate";
dunning — provider retries, you handle user comms + access state.

## Cross-Tier Behavior

| Lane | Application |
|---|---|
| Tiny | Skip — payment work is never tiny. |
| Normal | Required: webhook idempotency + signature verify + audit log + test mode + reconciliation job. |
| High-Risk | Normal + dispute flow + per-feature decision + provider abstraction + 2-reviewer review. **Auto-block on missing signature verify** (`code-review-scoring.md` Security dimension). |

Any new payment behavior is a hard gate → high-risk lane → red-team required at
the 2.9 security review.

## Variant Section

(Append a Variant block here when this playbook fails or partially works.)

## Related

- `docs/WORKFLOW.md` § 2.6 / 2.9 — code + security gates.
- `docs/decisions/<slug>-stack-selection.md` § External Providers — picks the
  provider (2.2) before this runs.
- `code-review-scoring.md` — Security dimension auto-blocks on missing signature
  verify.
- `canonical-e2e-flow-playbook.md` — E2E tests for payment journeys.
- `ck-security` (engine) — STRIDE+OWASP review for the money surface (2.9).
- `docs/ROLE_MAP.md` — Fullstack Dev + DevSecOps roles + `ck-payment-integration`.
