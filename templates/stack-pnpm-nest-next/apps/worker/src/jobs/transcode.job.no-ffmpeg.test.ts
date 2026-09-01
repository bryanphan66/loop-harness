import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageDriver } from '@__PROJECT_SLUG__/storage-core';
import type { Job, TranscodeJobPayload, TranscodeJobResult } from '@__PROJECT_SLUG__/queue-core';

/**
 * Proves the ffmpeg-absent guard: with FFMPEG_PATH pointed at a binary that
 * does not exist, the job resolves `{ skipped: true, reason }` instead of
 * throwing — a bare/dev env without ffmpeg installed does not crash the
 * worker or dead-letter the job.
 *
 * FFMPEG_PATH must be set BEFORE `../config/env` is first imported (its env
 * singleton parses process.env once, at import time) — so this file imports
 * `./transcode.job` dynamically, inside the test, after setting the env var,
 * rather than via a static top-level import.
 */
describe('runTranscodeJob without ffmpeg on PATH', () => {
  const previousFfmpegPath = process.env.FFMPEG_PATH;
  let baseDir: string;

  beforeEach(async () => {
    process.env.FFMPEG_PATH = '/no/such/binary-ffmpeg';
    baseDir = await mkdtemp(join(tmpdir(), 'transcode-no-ffmpeg-'));
  });

  afterEach(async () => {
    process.env.FFMPEG_PATH = previousFfmpegPath;
    await rm(baseDir, { recursive: true, force: true });
  });

  it('resolves a skipped result instead of throwing', async () => {
    const { runTranscodeJob } = await import('./transcode.job');
    const storage = new LocalStorageDriver(baseDir);
    const job = {
      data: { sourceKey: 'uploads/source.mp4', outputPrefix: 'hls/lesson-1' },
      updateProgress: vi.fn().mockResolvedValue(undefined),
    } as unknown as Job<TranscodeJobPayload, TranscodeJobResult, 'transcode'>;

    const result = await runTranscodeJob(job, storage);

    expect(result.skipped).toBe(true);
    expect(result.reason).toMatch(/ffmpeg/i);
    expect(result.renditions).toEqual([]);
    expect(job.updateProgress).not.toHaveBeenCalled();
  });
});
