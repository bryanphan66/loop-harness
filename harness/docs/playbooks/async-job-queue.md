# Async Job Queue

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Any REQ-ID whose work runs **outside the request/response cycle** — transcode,
> PDF/cert render, email-blast, bulk import/export, scheduled recompute, webhook
> fan-out. Provider-agnostic primitive: BullMQ + Redis in the shipped stack, but
> the acceptance categories hold for any queue (SQS, Cloud Tasks, pg-boss).
> Applies during Build & Go-live **step 2.6** whenever a phase's REQ-ID carries an
> async signal (grep: `queue`, `job`, `worker`, `background`, `async`, `retry`,
> `schedule`, `email-blast`, `PDF-render`).

**Macro-stage / step:** Build & Go-live · 2.6 (code). **Gate it serves:** the
non-CRUD leg of `docs/gates/phase-acceptance.md` for an `async-job` phase-type.

> The idempotency + retry + status-surfacing rules below are authoritative for any
> async-job phase.

## Engine

- **Fast path:** `backend-development` (NestJS BullMQ processor + producer
  wiring). Pairs with `object-storage` when the job reads/writes large blobs.
- **Role:** Fullstack Dev (+ DevSecOps for the failure-surface review).
  **Bare-agent fallback:** the BullMQ SDK directly against Redis — same artifact
  shape. Per D1 the skill is an accelerator, never a requirement.

## When To Run

- A phase does work that must not block the HTTP response (>1s, or fan-out, or
  provider-latency-bound).
- A phase schedules recurring/deferred work (cron, delayed retry).
- Auditing an existing background path for lost jobs, silent failure, or
  double-processing.

Skip when the work completes inside the request budget (a normal CRUD write) — do
NOT queue a synchronous op just because you can; that hides latency without buying
reliability.

## Shipped primitive (wire, don't architect)

The stack template ships a queue module — **use it, do not re-invent a producer
per feature**:

- **Module:** `apps/api/src/common/queue/` — `enqueue(name, payload, { idempotencyKey }) -> jobId`
  and `status(jobId) -> { state, progress, result?, failedReason? }`.
- **Worker app:** `apps/worker/` — one process consuming the queue; register one
  processor per job `name`.
- **Redis:** opt-in `docker-compose` profile (tier-2). A project with no async
  phase never boots it (YAGNI).

Story code calls `enqueue`/`status`; it never touches the BullMQ client directly —
so the queue backend is swappable and unit-testable with a fake.

## Acceptance categories (the async-job phase's type-specific AC)

A phase typed `async-job` REPLACES the CRUD trio's "functional" leg with these; the
independent verifier (`phase-acceptance.md`) exercises each against the running
preview:

1. **Idempotency-key** — enqueueing the same logical unit twice (same
   `idempotencyKey`) runs the job **once**; the second `enqueue` returns the
   existing `jobId`. Without this, a retried client request = duplicate transcode /
   double email.
2. **Retry / backoff + dead-letter** — a job that throws is retried with backoff
   (bounded attempts), and on final failure lands in a dead-letter/failed state
   that an operator can list and requeue — never silently dropped.
3. **Status-polling API** — a real endpoint returns the job state
   (`queued | active | completed | failed` + progress) so the UI can poll; the
   verifier drives it from enqueue → terminal state.
4. **Failure surfaces the REAL cause** — a forced job failure (bad input, provider
   down) propagates the real reason to `failedReason` and to the UI/status; a
   generic "something went wrong" = FAIL (no-error-swallow floor rule,
   `code-review-scoring.md`).

Visual-fidelity + negative-path legs still apply to any screen the phase ships
(e.g. an upload-processing / job-status screen ported from its prototype export).

## Failure & Observability

Every job logs: `job_name` · `job_id` · `idempotency_key` · `attempt` ·
`outcome: completed|retrying|dead-letter` · `duration_ms` · `failed_reason`. A
dead-letter row is an operator-actionable record, not a log line to grep for after
the client complains. Poison messages (always-failing) must not block the queue —
bounded attempts then dead-letter.

## Test Mode Discipline

Local dev + CI run the worker against a local Redis (the tier-2 compose profile).
The stack ships one **real** sample processor proving enqueue → worker → status
end-to-end (the template smoke test) — a phase extends it, never re-proves the
wiring from scratch.

## Cross-Tier Behavior

| Lane | Application |
|---|---|
| Tiny | Rare — most tiny apps have no async work. If one job exists, idempotency + status endpoint are still required. |
| Normal | Required: idempotency-key + bounded retry/backoff + dead-letter + status API + real-cause failure surface. |
| High-Risk | Normal + operator requeue UI + alert on dead-letter growth + the job's own negative-path e2e (2.8). |

## Variant Section

(Append a Variant block here when this playbook fails or partially works.)

## Related

- `object-storage.md` — the blob side; async jobs that produce/consume large files
  compose the two.
- `media-pipeline.md` — the meta-playbook composing this + object-storage + ffmpeg.
- `external-integration.md` — webhook handlers are often the enqueue trigger.
- `docs/gates/phase-acceptance.md` — the per-phase gate this playbook's categories feed.
- `docs/templates/build-manifest.md` — the `Phase-type: async-job` block shape.
- `docs/playbooks/code-review-scoring.md` — the no-error-swallow floor rule.
- `docs/ROLE_MAP.md` — Fullstack Dev + DevSecOps roles.
