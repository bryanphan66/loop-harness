# Media Pipeline

**Lifecycle:** experimental · **First use:** TBD · **Verified by:** none

> A REQ-ID that ingests large media and serves it back streamed — the video-lesson
> path (large upload → async multi-bitrate HLS transcode → object storage + CDN →
> signed-URL player), audio, or any "upload → process → stream" flow. This is a
> **meta-playbook**: it composes `async-job-queue.md` + `object-storage.md` + ffmpeg
> per `../UNDERSTANDING-loop-harness.md` § 10 (composition). Applies during Build & Go-live **step
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
`../UNDERSTANDING-loop-harness.md` § 10 (composition):

| Step | Playbook | Input | Output | Skip-when |
|---|---|---|---|---|
| 1. Ingest | `object-storage.md` | signed PUT to `apps/api/src/common/storage/` | raw object key (`uploads/<id>/source`) | no upload leg (re-processing an existing key) |
| 2. Transcode | `async-job-queue.md` | raw object key via `enqueue('transcode', …)` | HLS renditions written back to storage | source already transcoded (idempotency-key hit) |
| 3. Serve | `object-storage.md` | rendition keys | signed-GET / CDN manifest URL to the player | — |

The `apps/worker/` transcode processor runs ffmpeg; it reads the source via the
storage adapter, writes renditions + the master manifest back through it, and
updates job progress the player polls (`status(jobId)`).

## The documented ffmpeg HLS ladder (480 / 720 / 1080)

**Single source of truth:** `apps/worker/src/jobs/hls-ladder.ts`
(`buildHlsLadderArgs`) — the args below are generated, never hand-copied here;
if this doc and that file ever disagree, the file wins. Renditions (label /
height / bitrates) are `HLS_RENDITIONS` in the same file.

**Never upscale — the ladder is capped by the source.** The 480/720/1080 rungs are
the *maximum* ladder, not a fixed one. The transcode job MUST probe the source
height (an ffprobe `probe-height` sibling to probe-audio/probe-duration) and emit
ONLY rungs whose height ≤ source; a 480p source yields a single 480p rung (never
fake 720/1080), a 720p source yields 480+720, a below-480 source yields one rung at
its own height. Always ≥1 rung. Upscaling a low-res master into higher renditions
ships blurry files + wastes storage/CPU and lies to the player's ABR. The gate
asserts at source: a ≤480p input produces exactly one 480p rung with **no** 720p/
1080p files in storage; a 1080p+ input produces all three. The player badge/DB
carry the **actual** max rendition height, not the ladder's nominal top.

Shape of the generated command (source is a **local file path** — the worker
downloads the signed-GET source to a tmp file before invoking ffmpeg, so a
long transcode can't 403 on a source URL expiring mid-run; see Atomicity
below):

```bash
ffmpeg -y -i "$LOCAL_SOURCE_FILE" \
  -filter_complex "[0:v]split=3[v0][v1][v2]; \
    [v0]scale=w=-2:h=480[v0out]; [v1]scale=w=-2:h=720[v1out]; [v2]scale=w=-2:h=1080[v2out]" \
  -map "[v0out]" -map 0:a:0? -c:v:0 libx264 -b:v:0 800k  -c:a:0 aac -b:a:0 96k \
  -map "[v1out]" -map 0:a:0? -c:v:1 libx264 -b:v:1 2500k -c:a:1 aac -b:a:1 128k \
  -map "[v2out]" -map 0:a:0? -c:v:2 libx264 -b:v:2 5000k -c:a:2 aac -b:a:2 128k \
  -var_stream_map "v:0,a:0,name:480p v:1,a:1,name:720p v:2,a:2,name:1080p" \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -master_pl_name "master.m3u8" -hls_segment_filename "%v/segment_%03d.ts" \
  "%v/playlist.m3u8"
```

Output layout (relative to the worker's per-job `cwd`, then uploaded via the
storage adapter under the job's `outputPrefix`): `480p/playlist.m3u8` ·
`720p/playlist.m3u8` · `1080p/playlist.m3u8` · `master.m3u8` — **not** the
`hls/%v/index.m3u8` shape (an earlier, never-shipped draft of this doc).

The worker probes the source with `ffprobe` first (`lib/probe-audio.ts`,
`hasAudioStream`) — a silent/screen-capture source with no audio stream skips
audio entirely: no `-map 0:a:0?` / `-c:a:N` / `-b:a:N` args, AND
`-var_stream_map` drops the `a:N` half too (`v:0,name:480p v:1,name:720p
v:2,name:1080p`). Both must change together — `-map 0:a:0?`'s trailing `?`
only makes the *map* optional; a `var_stream_map` that still references a
now-nonexistent `a:N` output fails the whole HLS mux ("Unable to map
stream"). **ffmpeg in CI:** gate the transcode smoke behind the tier-2 profile
so the base template CI stays lean (ffmpeg is only on the media-enabled
image).

## Acceptance categories (the media-pipeline phase's type-specific AC)

A phase typed `media-pipeline` REPLACES the CRUD "functional" leg with these; the
verifier (`phase-acceptance.md`) exercises each against the running preview:

1. **Large / resumable upload** — a large file uploads via signed PUT (multipart /
   resumable where the size warrants) without streaming through the API; the
   documented max-size limit rejects an over-limit file with the real cause.
2. **Transcode atomicity + multi-bitrate ladder present** — a job either produces a
   **complete** rendition set (480/720/1080 + master manifest) or none is ever
   served. **Real contract (no stage→atomic-publish primitive):** the worker
   uploads renditions as ffmpeg produces them, so a running job's manifest key
   IS reachable in storage before it is complete — the consumer MUST gate on
   `status(jobId)` reporting `completed` before exposing the HLS manifest to a
   player; gating on "the manifest key exists" alone is a FAIL. If the upload
   loop itself fails partway (transient storage error), the worker best-effort
   deletes every rendition/segment key this job attempted to write — on this
   attempt, not only once retries are exhausted — so no half ladder is ever
   left reachable, including in the window between retries. The verifier
   confirms all three renditions + the master exist ONLY once `status(jobId)`
   is `completed`, and confirms nothing remains under `outputPrefix` after a
   forced upload failure.
3. **HLS manifest via signed-URL / CDN, delivered through a PROXY route — never a
   raw storage signed-URL handed to the browser.** The master + segment URLs are
   entitlement-protected (signed GET / CDN, NOT a public bucket; an unentitled fetch
   is denied — inherits `object-storage` entitlement). **But the URL the player
   receives is an app HTTP proxy route, not the driver's raw signed URL.** Two ways
   the raw-signed-URL shortcut silently breaks playback: (a) on `STORAGE=local`
   (what a box runs when R2/S3 isn't wired — a "CDN R2" badge can be cosmetic), the
   local driver's `signedGetUrl` returns a **`file://` URL** the browser cannot
   fetch → hls.js spins forever on an infinite spinner; (b) even on S3/R2 a **relative
   child playlist** inside the master loses the presign query string, so the child
   `.m3u8`/`.ts` 403s. Correct shape (uniform across drivers): an **entitlement-gated
   HTTP proxy** route streams the manifest + segments (each child request re-checks
   entitlement), and `signManifest` returns a **root-relative** path
   (`/lessons/:id/video/hls-stream/master.m3u8`) so hls.js resolves child playlists
   and segments **relatively into the same guarded route** — never an absolute
   presigned URL. Add a client **watchdog** (≈15s with no `loadedmetadata` → error
   state) so a broken manifest surfaces an error instead of spinning forever. The
   editor/preview player often works while the student delivery hangs precisely
   because the editor already streams through such a proxy and the student path
   handed over the raw `signedGetUrl` — check the STUDENT delivery, not the editor.
   **Verify-at-source (the video actually plays, not "the endpoint 200s"):**
   OTP-login as an *enrolled* student (passwordless — `POST /auth/otp/request`, read
   the code from Mailpit `/api/v1/messages`, `POST /auth/otp/verify` → bearer), then:
   `playback-url` returns an **HTTP path (not `file://`)`; `hls-stream/master.m3u8`
   returns `#EXTM3U`; a `.ts` segment is **HTTP 200 `video/mp2t`** with real bytes.
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
- `../UNDERSTANDING-loop-harness.md` § 10 (composition) — the hand-off-contract discipline this honors.
- `docs/gates/phase-acceptance.md` — the per-phase gate (incl. the streaming NFR).
- `docs/templates/build-manifest.md` — the `Phase-type: media-pipeline` block shape.
- `media-processing` (engine) — FFmpeg ladder + thumbnails.
- `docs/process/ROLE_MAP.md` — Fullstack Dev + DevSecOps roles.
