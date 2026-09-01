import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LocalStorageDriver,
  localStoragePath,
  type PutBody,
  type PutOptions,
  type StorageAdapter,
} from '@__PROJECT_SLUG__/storage-core';
import type { Job, TranscodeJobPayload, TranscodeJobResult } from '@__PROJECT_SLUG__/queue-core';
import { runTranscodeJob } from './transcode.job';

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

/**
 * Wraps a real LocalStorageDriver, failing every `put()` from the Nth call
 * onward — proves the media-pipeline atomicity fix (best-effort delete of
 * every rendition this job attempted to write when the upload loop fails
 * partway) against real uploaded bytes, not a fully faked storage layer.
 */
class FlakyAfterN implements StorageAdapter {
  private calls = 0;
  readonly succeededKeys: string[] = [];

  constructor(
    private readonly inner: StorageAdapter,
    private readonly failFrom: number,
  ) {}

  async put(key: string, body: PutBody, opts?: PutOptions): Promise<void> {
    this.calls += 1;
    if (this.calls >= this.failFrom) throw new Error('simulated transient storage error');
    await this.inner.put(key, body, opts);
    this.succeededKeys.push(key);
  }

  signedGetUrl(key: string, ttlSec: number): Promise<string> {
    return this.inner.signedGetUrl(key, ttlSec);
  }

  signedPutUrl(key: string, ttlSec: number): Promise<string> {
    return this.inner.signedPutUrl(key, ttlSec);
  }

  delete(key: string): Promise<void> {
    return this.inner.delete(key);
  }
}

describe.skipIf(!hasFfmpeg)('runTranscodeJob upload-failure cleanup (real ffmpeg)', () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'transcode-cleanup-'));
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

  it('deletes already-uploaded renditions when a later upload in the same job fails', async () => {
    const inner = new LocalStorageDriver(baseDir);
    await inner.put('uploads/source.mp4', await readFile(join(baseDir, 'source.mp4')));
    // The ladder always produces 7+ output files (master + 3 playlists + 1+
    // segment per rendition) — failing on the 3rd put reliably exercises a
    // PARTIAL upload (some already succeeded, more remained).
    const storage = new FlakyAfterN(inner, 3);

    const job = {
      data: { sourceKey: 'uploads/source.mp4', outputPrefix: 'hls/lesson-cleanup' },
      updateProgress: vi.fn().mockResolvedValue(undefined),
    } as unknown as Job<TranscodeJobPayload, TranscodeJobResult, 'transcode'>;

    await expect(runTranscodeJob(job, storage)).rejects.toThrow('simulated transient storage error');

    expect(storage.succeededKeys.length).toBeGreaterThan(0);
    for (const key of storage.succeededKeys) {
      await expect(readFile(localStoragePath(baseDir, key))).rejects.toThrow();
    }
  });
});
