import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageDriver } from '@__PROJECT_SLUG__/storage-core';
import type { Job, TranscodeJobPayload, TranscodeJobResult } from '@__PROJECT_SLUG__/queue-core';
import { runTranscodeJob } from './transcode.job';

/**
 * Real ffmpeg smoke (no mocks): generates a tiny synthetic source video with
 * ffmpeg's own lavfi test sources, runs the ACTUAL transcode job against it,
 * and asserts the HLS ladder landed on disk via the real LocalStorageDriver.
 * Skips (not fails) when ffmpeg isn't on PATH.
 */
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

function fakeJob(data: TranscodeJobPayload): Job<TranscodeJobPayload, TranscodeJobResult, 'transcode'> {
  return {
    data,
    updateProgress: vi.fn().mockResolvedValue(undefined),
  } as unknown as Job<TranscodeJobPayload, TranscodeJobResult, 'transcode'>;
}

describe.skipIf(!hasFfmpeg)('runTranscodeJob (real ffmpeg)', () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'transcode-test-'));
    execFileSync('ffmpeg', [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=duration=1:size=320x240:rate=10',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=1',
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-shortest',
      join(baseDir, 'source.mp4'),
    ]);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('produces a master playlist + all three renditions and uploads them via the storage adapter', async () => {
    const storage = new LocalStorageDriver(baseDir);
    await storage.put('uploads/source.mp4', await readFile(join(baseDir, 'source.mp4')));

    const job = fakeJob({ sourceKey: 'uploads/source.mp4', outputPrefix: 'hls/lesson-1' });

    const result = await runTranscodeJob(job, storage);

    expect(result.skipped).toBeUndefined();
    expect(result.manifestKey).toBe('hls/lesson-1/master.m3u8');
    expect(result.renditions.map((r) => r.label)).toEqual(['480p', '720p', '1080p']);

    const master = await readFile(join(baseDir, 'hls/lesson-1/master.m3u8'), 'utf8');
    expect(master).toContain('#EXTM3U');

    for (const rendition of result.renditions) {
      const playlist = await readFile(join(baseDir, rendition.playlistKey), 'utf8');
      expect(playlist).toContain('#EXTM3U');
    }

    expect(job.updateProgress).toHaveBeenCalledWith(100);
  });
});
