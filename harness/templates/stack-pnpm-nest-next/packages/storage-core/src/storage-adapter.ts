import type { Readable } from 'node:stream';

export interface PutOptions {
  contentType?: string;
}

/** Body a driver accepts — matches what the S3 SDK's Body field actually accepts. */
export type PutBody = Buffer | Uint8Array | Readable;

/**
 * Object storage abstraction — one interface, swappable driver (s3/r2 or
 * local-dev). Entitlement note (object-storage playbook): access control is
 * enforced by WHO gets handed a `signedGetUrl` — never expose a public/
 * unsigned read path in front of this adapter, or the entitlement check is
 * bypassed entirely.
 */
export interface StorageAdapter {
  put(key: string, body: PutBody, opts?: PutOptions): Promise<void>;
  signedGetUrl(key: string, ttlSec: number): Promise<string>;
  signedPutUrl(key: string, ttlSec: number): Promise<string>;
  delete(key: string): Promise<void>;
}
