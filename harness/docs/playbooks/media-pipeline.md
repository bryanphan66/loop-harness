# Media Pipeline

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> A REQ-ID that ingests large media and serves it back streamed — the video-lesson
> path (large upload → async multi-bitrate HLS transcode → object storage + CDN →
> signed-URL player), audio, or any "upload → process → stream" flow. This is a
> **meta-playbook**: it composes `async-job-queue.md` + `object-storage.md` + ffmpeg
> per `playbook-composition-pattern.md`. Applies during Build & Go-live **step
> 2.6** when a phase's REQ-ID carries a media signal (grep: `transcode`, `HLS`,
> `stream`, `bitrate`, `ffmpeg`, `video`, `player`, `CDN`).

**Macro-stage / step:** Build & Go-live · 2.6 (code). **Gate it serves:** the
non-CRUD leg of `docs/gates/phase-acceptance.md` for a `media-pipeline`
phase-type; the streaming NFR (first-byte, multi-bitrate) is checked AT this phase,
not deferred to 2.11.

> The atomicity + multi-bitrate-ladder + signed-manifest rules below are
> authoritative for any media phase.

## Engine

- **Fast path:** `media-processing` (FFmpeg HLS ladder, thumbnails, probing).
- **Role:** Fullstack Dev (+ DevSecOps for the signed-manifest entitlement review).
  **Bare-agent fallback:** the ffmpeg CLI directly (command below) inside a queue
  processor — same artifact shape. Per D1 the skill is an accelerator.

## When To Run

- A phase accepts large media (video/audio) and must serve it streamed to a player.
- A phase adds a transcode/thumbnail/waveform step to existing media.
- Auditing an existing media path for stalled uploads, half-transcoded artifacts,
  or public/unsigned manifests.

Skip when the "media" is a single small image with no processing — that is a plain
`object-storage` upload, not a pipeline.

## Composition (hand-off contract)

This meta-playbook chains three steps; each declares Input / Output / Skip-when per
`playbook-composition-pattern.md`:

| Step | Playbook | Input | Output | Skip-when |
|---|---|---|---|---|
| 1. Ingest | `object-storage.md` | signed PUT to `apps/api/src/common/storage/` | raw object key (`uploads/<id>/source`) | no upload leg (re-processing an existing key) |
| 2. Transcode | `async-job-queue.md` | raw object key via `enqueue('transcode', …)` | HLS renditions written back to storage | source already transcoded (idempotency-key hit) |
| 3. Serve | `object-storage.md` | rendition keys | signed-GET / CDN manifest URL to the player | — |

The `apps/worker/` transcode processor runs ffmpeg; it reads the source via the
storage adapter, writes renditions + the master manifest back through it, and
updates job progress the player polls (`status(jobId)`).

## The documented ffmpeg HLS ladder (480 / 720 / 1080)

The shipped transcode-stub runs this command (the ladder projects extend, never
re-derive):

```bash
ffmpeg -i "$SOURCE" \
  -filter_complex "[0:v]split=3[v1][v2][v3]; \
    [v1]scale=w=854:h=480[v1out]; [v2]scale=w=1280:h=720[v2out]; [v3]scale=w=1920:h=1080[v3out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 1400k -maxrate:v:0 1498k -bufsize:v:0 2100k \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 2800k -maxrate:v:1 2996k -bufsize:v:1 4200k \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 5000k -maxrate:v:2 5350k -bufsize:v:2 7500k \
  -map a:0 -map a:0 -map a:0 -c:a aac -b:a 128k -ac 2 \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "hls/%v/seg_%03d.ts" \
  -master_pl_name "master.m3u8" \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" "hls/%v/index.m3u8"
```

Output: three renditions (480/720/1080) + a `master.m3u8` the adaptive player
selects from. **ffmpeg in CI:** gate the transcode smoke behind the tier-2 profile
so the base template CI stays lean (ffmpeg is only on the media-enabled image).

## Acceptance categories (the media-pipeline phase's type-specific AC)

A phase typed `media-pipeline` REPLACES the CRUD "functional" leg with these; the
verifier (`phase-acceptance.md`) exercises each against the running preview:

1. **Large / resumable upload** — a large file uploads via signed PUT (multipart /
   resumable where the size warrants) without streaming through the API; the
   documented max-size limit rejects an over-limit file with the real cause.
2. **Transcode atomicity + multi-bitrate ladder present** — a job either produces a
   **complete** rendition set (480/720/1080 + master manifest) or none; a
   half-transcoded artifact is never served. The verifier confirms all three
   renditions + the master exist.
3. **HLS manifest via signed-URL / CDN** — the master + segment URLs are served
   through signed GETs or a CDN, NOT a public bucket; an unentitled fetch is denied
   (inherits `object-storage` entitlement).
4. **Progress / status surfaced** — the upload-processing screen polls
   `status(jobId)` and shows real progress (e.g. `248MB → HLS, 72%`) and terminal
   success/failure — the real failure cause on error.
5. **Storage cleanup on delete** — deleting the lesson/media entity removes the
   source + all renditions + manifest (inherits `object-storage`
   cleanup-on-delete); no orphaned segments accrue.

**Streaming NFR (asserted at this phase):** player first-byte within the NFR budget,
signed-URL entitlement holds, and the multi-bitrate ladder is present — these are
verified here, not only at the 2.11 NFR/load gate.

Visual-fidelity + negative-path legs still apply to the player + upload-processing
screens, ported from their prototype exports.

## Cross-Tier Behavior

| Lane | Application |
|---|---|
| Tiny | Effectively never — a media pipeline is inherently Normal+. |
| Normal | Required: all five categories + the streaming NFR check at this phase. |
| High-Risk | Normal + AV scan on ingest + per-tenant transcode quota + player entitlement negative-path e2e (2.8) + DR for the media bucket. |

## Variant Section

(Append a Variant block here when this playbook fails or partially works.)

## Related

- `async-job-queue.md` · `object-storage.md` — the two primitives this composes.
- `playbook-composition-pattern.md` — the hand-off-contract discipline this honors.
- `docs/gates/phase-acceptance.md` — the per-phase gate (incl. the streaming NFR).
- `docs/templates/build-manifest.md` — the `Phase-type: media-pipeline` block shape.
- `media-processing` (engine) — FFmpeg ladder + thumbnails.
- `docs/ROLE_MAP.md` — Fullstack Dev + DevSecOps roles.
