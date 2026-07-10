import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Job, TranscodeJobPayload, TranscodeJobResult } from '@__PROJECT_SLUG__/queue-core';
import type { StorageAdapter } from '@__PROJECT_SLUG__/storage-core';
import { env } from '../config/env';
import { isFfmpegAvailable } from '../lib/ffmpeg-guard';
import { runFfmpeg } from '../lib/run-ffmpeg';
import { contentTypeFor, walkDir } from '../lib/walk-dir';
import { HLS_RENDITIONS, buildHlsLadderArgs } from './hls-ladder';

/**
 * Real HLS multi-bitrate transcode: signed-GET the uploaded source, run the
 * documented ffmpeg ladder command (hls-ladder.ts), upload every output
 * file via the storage adapter, report progress throughout. Guarded: if
 * ffmpeg is unavailable (bare/dev env), resolves `{ skipped: true, reason }`
 * instead of throwing so the queue/worker stay healthy.
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

  const workDir = await mkdtemp(join(tmpdir(), 'transcode-'));
  try {
    await Promise.all(HLS_RENDITIONS.map((r) => mkdir(join(workDir, r.label), { recursive: true })));
    await job.updateProgress(15);

    await runFfmpeg(env.FFMPEG_PATH, buildHlsLadderArgs(inputUrl), workDir);
    await job.updateProgress(70);

    const outputFiles = await walkDir(workDir);
    let uploaded = 0;
    for (const relativeFile of outputFiles) {
      const body = await readFile(join(workDir, relativeFile));
      await storage.put(`${outputPrefix}/${relativeFile}`, body, {
        contentType: contentTypeFor(relativeFile),
      });
      uploaded += 1;
      await job.updateProgress(70 + Math.round((uploaded / outputFiles.length) * 30));
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
    await rm(workDir, { recursive: true, force: true });
  }
}
