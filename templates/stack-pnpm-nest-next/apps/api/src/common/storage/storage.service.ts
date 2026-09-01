import { Injectable } from '@nestjs/common';
import {
  createStorageAdapter,
  type PutBody,
  type PutOptions,
  type StorageAdapter,
} from '@__PROJECT_SLUG__/storage-core';
import { env } from '../../config/env';

/**
 * Tier-2, opt-in: not imported by AppModule by default (the walking skeleton
 * stays db+api+web). A project with a media-pipeline/storage phase wires
 * this module into its feature module once that phase lands.
 *
 * Entitlement note: this service is the ONLY place a signed URL is minted —
 * any controller that calls signedGetUrl() is the actual authorization
 * checkpoint (verify the requester owns/may access `key` before calling it).
 */
@Injectable()
export class StorageService implements StorageAdapter {
  private readonly adapter: StorageAdapter;

  constructor() {
    this.adapter = createStorageAdapter(env);
  }

  put(key: string, body: PutBody, opts?: PutOptions): Promise<void> {
    return this.adapter.put(key, body, opts);
  }

  signedGetUrl(key: string, ttlSec: number): Promise<string> {
    return this.adapter.signedGetUrl(key, ttlSec);
  }

  signedPutUrl(key: string, ttlSec: number): Promise<string> {
    return this.adapter.signedPutUrl(key, ttlSec);
  }

  delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }
}
