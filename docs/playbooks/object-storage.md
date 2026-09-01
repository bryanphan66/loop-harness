# Object Storage

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> Any REQ-ID that stores or serves **binary blobs** — user uploads, generated
> PDFs/certs, invoices, media, attachments, exports. Provider-agnostic adapter:
> S3/R2 in the shipped stack, minio for local dev. Cross-cutting (video + cert +
> invoice + attachments all use it) → its own playbook (DRY), never re-derived per
> feature. Applies during Build & Go-live **step 2.6** whenever a phase's REQ-ID
> carries a storage signal (grep: `upload`, `storage`, `signed-url`, `S3`, `R2`,
> `bucket`, `attachment`, `download`, `PDF`, `blob`).

**Macro-stage / step:** Build & Go-live · 2.6 (code). **Gate it serves:** the
non-CRUD leg of `docs/gates/phase-acceptance.md` for a `storage` phase-type.

> The signed-URL + entitlement + cleanup rules below are authoritative for any
> storage phase.

## Engine

- **Fast path:** `backend-development` (NestJS storage module + guard wiring);
  `devops` for the bucket/CDN provisioning.
- **Role:** Fullstack Dev (+ DevSecOps for the entitlement review).
  **Bare-agent fallback:** the `@aws-sdk/client-s3` presigner directly (S3 & R2
  share the API) — same artifact shape. Per D1 the skill is an accelerator.

## When To Run

- A phase accepts a file upload or serves a stored file.
- A phase generates a document (PDF cert/invoice) that must be downloadable later.
- Auditing existing blob handling for public-bucket leakage, orphaned objects, or
  unbounded storage growth.

Skip when the "file" is a small text field that belongs in the DB — do NOT push
tiny structured data through object storage.

## Shipped primitive (wire, don't architect)

The stack template ships a storage adapter — **use the interface, never call the
SDK from story code**:

- **Module:** `apps/api/src/common/storage/` — interface
  `StorageAdapter { put(key, body, opts); signedGetUrl(key, ttlSec); signedPutUrl(key, ttlSec); delete(key) }`.
- **Drivers:** `s3` (AWS S3, Cloudflare R2, or a local MinIO endpoint — same
  driver code, only `STORAGE_S3_ENDPOINT`/credentials change) + `local`
  (filesystem, zero-dependency dev; its signed URLs are unauthenticated
  `file://` stubs with no real expiry — see category 5 below). Selected by env;
  story code is driver-agnostic.
- **minio:** a real S3-compatible service under the opt-in `docker-compose`
  `tier2` profile (`docker compose --profile tier2 up -d`, console at
  `http://localhost:9001`). Set `STORAGE_DRIVER=s3` + the `STORAGE_S3_*` vars
  (`.env.example`) to point the `s3` driver at it — this is how local dev + CI
  exercise the real signed-URL/entitlement path without a cloud account.

Uploads go **direct to storage via a signed PUT** (browser → bucket), never
streamed through the API process. Downloads go via a signed GET or a CDN URL —
never a public bucket.

## Acceptance categories (the storage phase's type-specific AC)

A phase typed `storage` REPLACES the CRUD trio's "functional" leg with these; the
verifier (`phase-acceptance.md`) exercises each against the running preview:

1. **Signed PUT / GET** — upload uses a short-TTL signed PUT (browser → bucket
   directly); retrieval uses a signed GET (or CDN) URL. The verifier drives a real
   upload then a real fetch.
2. **Entitlement** — an **unauthenticated / unentitled** GET is DENIED. Objects are
   NOT world-readable; the URL that grants access is minted only for a caller the
   authz layer approved. This is the category most often missed → data leak.
   Exercised with `STORAGE_DRIVER=s3` against MinIO/R2/S3 (a real signature +
   TTL to deny); `n/a` on `STORAGE_DRIVER=local` — its `file://` stub URLs
   never expire and carry no signature, so this category cannot fail-closed on
   that driver (dev-only, never the target of the entitlement check).
3. **Lifecycle / cleanup-on-delete** — deleting the owning entity deletes (or
   tombstones) its objects; no orphaned blobs accrue. The verifier deletes a record
   and confirms the object is gone / inaccessible.
4. **Quota** — per-user/per-tenant size or count limits are enforced at upload; an
   over-quota upload is rejected with the real reason (not a silent truncate).
5. **Local-dev parity (minio)** — the `s3` driver runs unmodified against the
   tier2 MinIO container locally and against S3/R2 in prod (only endpoint +
   credentials differ); no `if (prod)` fork in story code.

Visual-fidelity + negative-path legs still apply to any screen the phase ships
(upload widget, file list, error states) ported from its prototype export.

## Security notes

- Never make a bucket public to "make downloads work" — mint signed GETs.
- Validate content-type + size **before** issuing the signed PUT; re-validate the
  stored object's declared type on first read where it matters (e.g. reject an
  executable masquerading as an image).
- Redact object keys that embed user identifiers from logs where they are
  sensitive.

## Cross-Tier Behavior

| Lane | Application |
|---|---|
| Tiny | If a single upload exists: signed PUT/GET + entitlement + cleanup are still required (a public bucket is never acceptable). |
| Normal | Required: signed PUT/GET + entitlement (unauth GET denied) + cleanup-on-delete + quota + minio parity. |
| High-Risk | Normal + content-type/AV validation + per-tenant quota alerting + entitlement negative-path e2e (2.8). |

## Variant Section

(Append a Variant block here when this playbook fails or partially works.)

## Related

- `async-job-queue.md` — background jobs that produce/consume stored blobs
  (PDF render, transcode) compose the two.
- `media-pipeline.md` — the meta-playbook composing this + async-job + ffmpeg.
- `docs/gates/phase-acceptance.md` — the per-phase gate this playbook's categories feed.
- `docs/templates/build-manifest.md` — the `Phase-type: storage` block shape.
- `docs/ROLE_MAP.md` — Fullstack Dev + DevSecOps roles.
