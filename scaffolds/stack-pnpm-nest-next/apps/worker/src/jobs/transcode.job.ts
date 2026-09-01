import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import type { Job, TranscodeJobPayload, TranscodeJobResult } from '@__PROJECT_SLUG__/queue-core';
import type { StorageAdapter } from '@__PROJECT_SLUG__/storage-core';
import { env } from '../config/env';
import { downloadToFile } from '../lib/download-source';
import { isFfmpegAvailable } from '../lib/ffmpeg-guard';
import { hasAudioStream } from '../lib/probe-audio';
import { runFfmpeg } from '../lib/run-ffmpeg';
import { contentTypeFor, walkDir } from '../lib/walk-dir';
import { HLS_RENDITIONS, buildHlsLadderArgs } from './hls-ladder';

/**
 * Real HLS multi-bitrate transcode: downloads the signed-GET source to a
 * local tmp file FIRST (so a run that outlives the signed URL's TTL never
 * re-touches it), probes it for an audio stream (probe-audio.ts — a silent/
 * screen-capture source has none), runs the documented ffmpeg ladder command
 * (hls-ladder.ts) against that local file, uploads every output file via the
 * storage adapter, reports progress throughout. Guarded: if ffmpeg is
 * unavailable (bare/dev env), resolves `{ skipped: true, reason }` instead of
 * throwing so the queue/worker stay healthy.
 *
 * Atomicity note (media-pipeline playbook): this primitive does NOT
 * stage-then-atomically-publish — renditions land in storage as ffmpeg
 * produces them, so a consumer MUST gate on `status(jobId)` reporting
 * `completed` before serving the manifest. If the upload loop itself fails
 * partway (e.g. a transient network error to S3/MinIO), every key this job
 * attempted to write is best-effort deleted so no half rendition ladder is
 * left reachable — `delete()` on a key that was never uploaded is a no-op on
 * every shipped driver, so this is safe to run unconditionally on failure.
 */
export async function runTranscodeJob(
  job: Job<TranscodeJobPayload, TranscodeJobResult, 'transcode'>,
  storage: StorageAdapter,
): Promise<TranscodeJobResult> {
  if (!isFfmpegAvailable(env.FFMPEG_PATH)) {
    return { manifestKey: '', renditions: [], skipped: true, reason: 'ffmpeg not available on PATH' };
  }

  const { sourceKey, outputPrefix } = job.data;
  await job.updateProgress(5);
  const inputUrl = await storage.signedGetUrl(sourceKey, 3600);

  const sourceDir = await mkdtemp(join(tmpdir(), 'transcode-src-'));
  const workDir = await mkdtemp(join(tmpdir(), 'transcode-out-'));
  const sourcePath = join(sourceDir, `source${extname(sourceKey)}`);

  try {
    await downloadToFile(inputUrl, sourcePath);
    await job.updateProgress(15);

    await Promise.all(HLS_RENDITIONS.map((r) => mkdir(join(workDir, r.label), { recursive: true })));
    const hasAudio = hasAudioStream(env.FFPROBE_PATH, sourcePath);
    await runFfmpeg(env.FFMPEG_PATH, buildHlsLadderArgs(sourcePath, HLS_RENDITIONS, hasAudio), workDir);
    await job.updateProgress(70);

    const outputFiles = await walkDir(workDir);
    try {
      let uploaded = 0;
      for (const relativeFile of outputFiles) {
        const body = await readFile(join(workDir, relativeFile));
        await storage.put(`${outputPrefix}/${relativeFile}`, body, {
          contentType: contentTypeFor(relativeFile),
        });
        uploaded += 1;
        await job.updateProgress(70 + Math.round((uploaded / outputFiles.length) * 30));
      }
    } catch (err) {
      await Promise.all(
        outputFiles.map((relativeFile) =>
          storage.delete(`${outputPrefix}/${relativeFile}`).catch(() => undefined),
        ),
      );
      throw err;
    }

    await job.updateProgress(100);
    return {
      manifestKey: `${outputPrefix}/master.m3u8`,
      renditions: HLS_RENDITIONS.map((r) => ({
        label: r.label,
        playlistKey: `${outputPrefix}/${r.label}/playlist.m3u8`,
      })),
    };
  } finally {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(workDir, { recursive: true, force: true });
  }
}
