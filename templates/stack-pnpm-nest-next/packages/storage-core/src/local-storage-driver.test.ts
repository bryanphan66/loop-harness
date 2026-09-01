import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageDriver } from './local-storage-driver';

describe('LocalStorageDriver', () => {
  let baseDir: string;
  let driver: LocalStorageDriver;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'storage-core-test-'));
    driver = new LocalStorageDriver(baseDir);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('writes a buffer under a nested key and reads it back from disk', async () => {
    await driver.put('videos/lesson-1/source.mp4', Buffer.from('fake-video-bytes'));

    const written = await readFile(join(baseDir, 'videos/lesson-1/source.mp4'));
    expect(written.toString()).toBe('fake-video-bytes');
  });

  it('signedGetUrl returns a file:// URL pointing at the stored object (stubbed, no expiry)', async () => {
    await driver.put('a.txt', Buffer.from('hi'));

    const url = await driver.signedGetUrl('a.txt', 60);

    expect(url).toMatch(/^file:\/\//);
    expect(url).toContain('a.txt');
  });

  it('signedPutUrl also returns a file:// URL (stubbed)', async () => {
    const url = await driver.signedPutUrl('upload/b.txt', 60);
    expect(url).toMatch(/^file:\/\//);
  });

  it('delete removes the object; missing keys do not throw', async () => {
    await driver.put('c.txt', Buffer.from('bye'));
    await driver.delete('c.txt');
    await expect(readFile(join(baseDir, 'c.txt'))).rejects.toThrow();

    await expect(driver.delete('never-existed.txt')).resolves.toBeUndefined();
  });

  it('rejects a key that escapes the base directory', async () => {
    await expect(driver.put('../../etc/passwd', Buffer.from('x'))).rejects.toThrow(
      /escapes base dir/,
    );
  });
});
