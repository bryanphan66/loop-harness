# Harness v5 — Non-CRUD Delivery Capability (BS7)

**Date:** 2026-07-10 · **Scope:** `harness/` only (project-agnostic, Independence Principle intact) · **Trigger:** elearning-platform Macro-2 gap — the frozen client prototype mandates a full video pipeline (large upload → async HLS multi-bitrate transcode → R2 storage + CDN → signed-URL player) plus async cert/invoice PDF + SES/Zalo email, and the harness stack-template (`db+api+web`) + build-manifest (CRUD-only phase block) + playbooks (only payment + seed) have **no mechanism** for any of it → prime Macro-2 stall (the exact class auto-script improvised).

Evidence: prototype screens `C2 video-player-learning-screen` (`HLS 1080p · CDN R2`), `D1.4 LessonUploadProcessing` (`248MB → HLS 480/720/1080, 72%`), `D1.4 LessonUploadError` (max 2GB), `D1.5 cert-template → PDF+QR`; SRS `SC-016..022`, `nfr.md PERF.04–06`, `IF.DB.02` (queue), `PLF.STORAGE.01` (R2), `CT.ISSUE.01` (async PDF).

## Root cause (why CRUD-only harness stalls here)
Build-manifest phase block assumes every phase = entities + endpoints + screens (CRUD). A REQ-ID whose work is **async job / media pipeline / external integration / object storage** has no slot → 2.3 compile silently folds it into a CRUD phase → the build agent improvises the risky infra per-phase, unproven, and phase-acceptance can't assert the right NFRs.

## Design — 4 coherent additions

### 1. Manifest `Phase-type` (routing so non-CRUD can't be dropped)
- Add `Phase-type` field to the phase block: enum `crud` (default) `| async-job | media-pipeline | external-integration | storage`.
- For non-CRUD types, `Entities/API/Screens` become optional; the block instead carries type-specific fields + **type-specific acceptance categories** (below) that REPLACE/EXTEND the CRUD trio (functional + negative + visual-fidelity).
- `build-manifest-compilation.md` (2.3): a compile rule — a REQ-ID citing async/media/storage/integration NFRs (grep signals: transcode, HLS, upload, queue, webhook, signed-url, storage, PDF-render, email-blast) MUST get a non-CRUD phase-type; folding it into a CRUD phase = a 2.3 defect. Add to Coverage checklist.

### 2. Four new playbooks (added directly — protocol: new playbooks are files, not markers), composed (see `playbook-composition-pattern.md`), mirroring `payment-integration.md` rigor:
- `async-job-queue.md` — BullMQ+Redis primitive. Acceptance categories: **idempotency-key**, **retry/backoff + dead-letter**, **status-polling API**, **failure surfaces real cause** (no silent swallow). Underlies transcode / cert-PDF / email-blast.
- `object-storage.md` — S3/R2 adapter primitive. Categories: **signed PUT/GET**, **entitlement (unauth GET denied)**, **lifecycle/cleanup-on-delete**, **quota**, **local-dev parity (minio)**. Used by video + cert-PDF + invoice + attachments (cross-cutting → own playbook, DRY).
- `media-pipeline.md` — composes async-job + object-storage + ffmpeg. Categories: **large/resumable upload**, **transcode atomicity + multi-bitrate ladder present**, **HLS manifest served via signed-URL/CDN**, **progress/status surfaced**, **storage cleanup on lesson delete**.
- `external-integration.md` — generic 3rd-party (SES/Zalo/webhook providers). Categories: **credential resolution (sandbox vs prod)**, **webhook signature verify**, **idempotent webhook handling**, **retry + provider-error surfaced**, **adapter abstraction (provider swappable)**. (payment-integration stays; this generalizes its webhook+abstraction rigor.)

### 3. Stack-template tier-2 services (opt-in — walking skeleton stays `db+api+web`; these wire in only when a non-CRUD phase exists — YAGNI for simple projects)
`templates/stack-pnpm-nest-next/`:
- Redis service in `docker-compose` (opt-in profile).
- `apps/api/src/common/queue/` — BullMQ module wrapper (enqueue + status).
- `apps/api/src/common/storage/` — storage adapter **interface** + S3/R2 driver + local (minio) driver.
- `apps/worker/` (or worker bootstrap) — consumes the queue; ships one **real** sample job (transcode-stub that runs a documented ffmpeg HLS command) proving the wiring end-to-end.
- Must: `pnpm -r build` green + verify-gate green + a smoke test for enqueue→worker→status. Bump template `TEMPLATE_VERSION`.

### 4. Wire NFR/acceptance + go-live
- `phase-acceptance.md`: non-CRUD phase-types assert their type-specific categories (§2) against the running preview — streaming NFR (first-byte, signed-URL entitlement, multi-bitrate) checked AT the media phase, not only 2.11.
- `STAGE_GOALS.md` 2.2 (stack pick surfaces tier-2 when media/async/storage/integration in scope) + 2.3 (compile routes phase-types) + go-live aggregation reference.
- `WORKFLOW.md` Canonical Gate List / 2.6 note reference (first-class edit, we are the maintainer).
- `playbooks/README.md` index rows; `HARNESS.md` growth note; `HARNESS_CHANGELOG.md` **v5** entry (design + trade-off + cite elearning prototype evidence).

## Files touched (est.)
New: `docs/playbooks/{async-job-queue,object-storage,media-pipeline,external-integration}.md` · stack `apps/worker/**`, `apps/api/src/common/{queue,storage}/**`, compose Redis.
Modified: `docs/mau-tai-lieu/build-manifest.md`, `docs/playbooks/build-manifest-compilation.md`, `docs/gates/phase-acceptance.md`, `docs/process/STAGE_GOALS.md` (2.2/2.3), `docs/process/WORKFLOW.md`, `docs/playbooks/README.md`, `docs/about/HARNESS.md`, `docs/about/HARNESS_CHANGELOG.md`, stack `docker-compose*`, `TEMPLATE_VERSION`.

## Success criteria
- A build-manifest can express a media/async/storage/integration phase with runnable, type-correct acceptance.
- Stack template compiles + verify-gate green WITH tier-2 wired; simple projects unaffected (tier-2 opt-in).
- No operating-contract dialect (edits are first-class maintainer edits, not org EXT markers).
- Independence Principle: no new hard ck-* dep.

## Open decision (for user)
**Depth:** playbook-only (knowledge, project generates infra each time) vs playbook + shipped tier-2 stack code (proven infra, wire-not-architect). Recommend the latter — matches the "stop improvising risky bits / hasi-hub grade" mission — but it is the larger build + maintenance surface.

## Unresolved
- PDF-render (cert/invoice): fold as a composition example in `async-job-queue` + `object-storage`, or its own thin playbook? (lean: composition example.)
- ffmpeg in CI: transcode smoke may need ffmpeg on the CI image — gate the smoke behind a tier-2 profile so the base template CI stays lean.
