import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { contentTypeFor, walkDir } from './walk-dir';

describe('walkDir', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'walk-dir-test-'));
    await writeFile(join(dir, 'master.m3u8'), 'x');
    await mkdir(join(dir, '480p'), { recursive: true });
    await writeFile(join(dir, '480p', 'playlist.m3u8'), 'x');
    await writeFile(join(dir, '480p', 'segment_000.ts'), 'x');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('lists every file recursively, relative to the root', async () => {
    const files = (await walkDir(dir)).sort();
    expect(files).toEqual(
      ['480p/playlist.m3u8', '480p/segment_000.ts', 'master.m3u8'].sort(),
    );
  });
});

describe('contentTypeFor', () => {
  it('maps .m3u8 to the HLS playlist mime type', () => {
    expect(contentTypeFor('480p/playlist.m3u8')).toBe('application/vnd.apple.mpegurl');
  });

  it('maps .ts to the MPEG transport stream mime type', () => {
    expect(contentTypeFor('480p/segment_000.ts')).toBe('video/mp2t');
  });

  it('returns undefined for an unrecognized extension', () => {
    expect(contentTypeFor('notes.txt')).toBeUndefined();
  });
});
