import { createWriteStream } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

/**
 * Downloads a signed-GET URL to a local file BEFORE the caller does any
 * long-running work against it. A transcode can run well past a signed URL's
 * TTL (default 3600s in transcode.job.ts); grabbing the bytes once, up front,
 * means a multi-hour ffmpeg run never re-touches the (possibly by-then-
 * expired) source URL mid-job.
 *
 * Handles both real HTTP(S) signed URLs (s3/r2/minio driver) and the local
 * driver's `file://` stub (LocalStorageDriver) — `fetch` does not implement
 * the `file:` scheme, so that case is a direct filesystem copy instead.
 */
export async function downloadToFile(signedUrl: string, destPath: string): Promise<void> {
  if (signedUrl.startsWith('file://')) {
    await copyFile(fileURLToPath(signedUrl), destPath);
    return;
  }

  const response = await fetch(signedUrl);
  if (!response.ok || !response.body) {
    throw new Error(`failed to download transcode source (HTTP ${response.status}): ${signedUrl}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destPath));
}
