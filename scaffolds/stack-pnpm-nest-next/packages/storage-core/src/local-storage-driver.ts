import { createWriteStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { pipeline } from 'node:stream/promises';
import type { PutBody, PutOptions, StorageAdapter } from './storage-adapter';

/**
 * Filesystem-backed driver for local dev / CI parity with the S3 driver —
 * no MinIO container required to exercise the StorageAdapter contract.
 *
 * Signed URLs are STUBBED per the object-storage playbook's local-dev-parity
 * category: there is no local HTTP server fronting this driver, so
 * signedGetUrl/signedPutUrl return a `file://` URL and ignore `ttlSec`
 * (nothing expires). This is intentionally NOT wired to enforce entitlement
 * — do not use the local driver for anything where signed-URL expiry is a
 * security requirement; swap STORAGE_DRIVER=s3 (e.g. against MinIO) for that.
 */
export class LocalStorageDriver implements StorageAdapter {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = resolve(baseDir);
  }

  private resolveKeyPath(key: string): string {
    const target = resolve(this.baseDir, key);
    if (target !== this.baseDir && !target.startsWith(this.baseDir + sep)) {
      throw new Error(`storage key escapes base dir: ${key}`);
    }
    return target;
  }

  async put(key: string, body: PutBody, _opts?: PutOptions): Promise<void> {
    const path = this.resolveKeyPath(key);
    await mkdir(dirname(path), { recursive: true });
    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
      await writeFile(path, body);
      return;
    }
    await pipeline(body, createWriteStream(path));
  }

  async signedGetUrl(key: string, _ttlSec: number): Promise<string> {
    return pathToFileURL(this.resolveKeyPath(key)).toString();
  }

  async signedPutUrl(key: string, _ttlSec: number): Promise<string> {
    return pathToFileURL(this.resolveKeyPath(key)).toString();
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKeyPath(key), { force: true });
  }
}

// Re-exported for callers that need to join a key under the local base dir
// without going through the adapter (e.g. reading back a fixture in tests).
export function localStoragePath(baseDir: string, key: string): string {
  return join(resolve(baseDir), key);
}
