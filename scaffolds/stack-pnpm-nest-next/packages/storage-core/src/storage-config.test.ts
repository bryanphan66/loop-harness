import { describe, expect, it } from 'vitest';
import { loadStorageConfig } from './storage-config';

describe('loadStorageConfig', () => {
  it('defaults to the local driver when unset', () => {
    const config = loadStorageConfig({});
    expect(config.STORAGE_DRIVER).toBe('local');
    expect(config.STORAGE_LOCAL_DIR).toBe('./.storage-local');
  });

  it('accepts an s3 config with all required credentials', () => {
    const config = loadStorageConfig({
      STORAGE_DRIVER: 's3',
      STORAGE_S3_BUCKET: 'videos',
      STORAGE_S3_ACCESS_KEY_ID: 'key',
      STORAGE_S3_SECRET_ACCESS_KEY: 'secret',
    });
    expect(config.STORAGE_DRIVER).toBe('s3');
    expect(config.STORAGE_S3_FORCE_PATH_STYLE).toBe(true);
  });

  it('parses an s3 driver selection even with credentials missing — enforced at driver construction, not here', () => {
    const config = loadStorageConfig({ STORAGE_DRIVER: 's3' });
    expect(config.STORAGE_DRIVER).toBe('s3');
    expect(config.STORAGE_S3_BUCKET).toBeUndefined();
  });
});
