import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageDriver } from '@__PROJECT_SLUG__/storage-core';
import type { Job, TranscodeJobPayload, TranscodeJobResult } from '@__PROJECT_SLUG__/queue-core';

// ffmpeg itself is mocked out — this test isolates ONE thing: does the job
// download the source to a local file BEFORE handing anything to ffmpeg, so
// a long-running real transcode never re-touches the (possibly by-then-
// expired) signed source URL. `isFfmpegAvailable` is mocked true so the
// guard doesn't short-circuit before that download ever happens.
const runFfmpegMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../lib/run-ffmpeg', () => ({ runFfmpeg: runFfmpegMock }));
vi.mock('../lib/ffmpeg-guard', () => ({ isFfmpegAvailable: () => true }));

describe('runTranscodeJob source download', () => {
  let baseDir: string;

  beforeEach(async () => {
    runFfmpegMock.mockClear();
    baseDir = await mkdtemp(join(tmpdir(), 'transcode-src-dl-'));
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('downloads the source to a local tmp file before invoking ffmpeg, so the source disappearing afterward does not matter', async () => {
    const { runTranscodeJob } = await import('./transcode.job');
    const storage = new LocalStorageDriver(baseDir);
    const sourceBytes = Buffer.from('fake-source-bytes');
    await storage.put('uploads/source.mp4', sourceBytes);

    const job = {
      data: { sourceKey: 'uploads/source.mp4', outputPrefix: 'hls/lesson-1' },
      updateProgress: vi.fn().mockResolvedValue(undefined),
    } as unknown as Job<TranscodeJobPayload, TranscodeJobResult, 'transcode'>;

    // Read the local copy's bytes INSIDE the (mocked) ffmpeg call — the job's
    // `finally` deletes its tmp dirs once `runTranscodeJob` returns, so this
    // is the only point at which the downloaded file is guaranteed to still
    // exist on disk.
    let bytesSeenByFfmpeg: Buffer | undefined;
    runFfmpegMock.mockImplementationOnce(async (_ffmpegPath: string, args: string[]) => {
      const localSourcePath = args[args.indexOf('-i') + 1];
      bytesSeenByFfmpeg = await readFile(localSourcePath);
      // Simulate the source becoming unavailable mid-run (signed URL expiry,
      // or the object itself being cycled out) — must not affect the job:
      // ffmpeg already has its own local copy by this point.
      await storage.delete('uploads/source.mp4');
    });

    await runTranscodeJob(job, storage);

    expect(runFfmpegMock).toHaveBeenCalledTimes(1);
    const [, args, cwd] = runFfmpegMock.mock.calls[0] as [string, string[], string];
    const localSourcePath = args[args.indexOf('-i') + 1];

    // Not the signed-URL string the old code passed straight to ffmpeg.
    expect(localSourcePath.startsWith('file://')).toBe(false);
    expect(localSourcePath.startsWith('http')).toBe(false);
    // A genuine separate tmp copy, not the storage-backed path reused as-is.
    expect(localSourcePath.startsWith(baseDir)).toBe(false);
    // Lives outside ffmpeg's own output/cwd dir too, so it can never be
    // picked up by the output-upload walk (walk-dir.ts) as a "rendition".
    expect(localSourcePath.startsWith(cwd)).toBe(false);
    expect(bytesSeenByFfmpeg).toEqual(sourceBytes);
  });
});
