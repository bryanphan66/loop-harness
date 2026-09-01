import { LocalStorageDriver } from './local-storage-driver';
import { S3StorageDriver } from './s3-storage-driver';
import type { StorageAdapter } from './storage-adapter';
import type { StorageConfig } from './storage-config';

export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  if (config.STORAGE_DRIVER === 's3') {
    return new S3StorageDriver(config);
  }
  return new LocalStorageDriver(config.STORAGE_LOCAL_DIR);
}
