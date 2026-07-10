import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageDriver } from '@__PROJECT_SLUG__/storage-core';
import type { Job, TranscodeJobPayload, TranscodeJobResult } from '@__PROJECT_SLUG__/queue-core';
import { runTranscodeJob } from './transcode.job';

/**
 * Real ffmpeg smoke proving the `-map 0:a:0?` optional-audio fix
 * (hls-ladder.ts): a video-only source — no audio stream at all, the
 * silent/screen-capture upload case — must still transcode instead of
 * failing the whole job on a hard `-map 0:a:0`. Skips (not fails) when
 * ffmpeg isn't on PATH.
 */
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

function fakeJob(data: TranscodeJobPayload): Job<TranscodeJobPayload, TranscodeJobResult, 'transcode'> {
  return {
    data,
    updateProgress: vi.fn().mockResolvedValue(undefined),
  } as unknown as Job<TranscodeJobPayload, TranscodeJobResult, 'transcode'>;
}

describe.skipIf(!hasFfmpeg)('runTranscodeJob (real ffmpeg, no-audio source)', () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'transcode-no-audio-'));
    // Video-only lavfi source — no second `-i sine=...` input, so the
    // container carries zero audio streams.
    execFileSync('ffmpeg', [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=duration=1:size=320x240:rate=10',
      '-c:v',
      'libx264',
      join(baseDir, 'source-silent.mp4'),
    ]);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('transcodes a video-only source instead of failing on the missing audio stream', async () => {
    const storage = new LocalStorageDriver(baseDir);
    await storage.put('uploads/source-silent.mp4', await readFile(join(baseDir, 'source-silent.mp4')));

    const job = fakeJob({ sourceKey: 'uploads/source-silent.mp4', outputPrefix: 'hls/lesson-silent' });

    const result = await runTranscodeJob(job, storage);

    expect(result.skipped).toBeUndefined();
    expect(result.manifestKey).toBe('hls/lesson-silent/master.m3u8');
    expect(result.renditions.map((r) => r.label)).toEqual(['480p', '720p', '1080p']);

    const master = await readFile(join(baseDir, 'hls/lesson-silent/master.m3u8'), 'utf8');
    expect(master).toContain('#EXTM3U');
  });
});
