import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StorageConfig } from './storage-config';

const send = vi.fn().mockResolvedValue({});
const getSignedUrlMock = vi.fn().mockResolvedValue('https://signed.example.com/object');

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send })),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ input, __cmd: 'put' })),
  GetObjectCommand: vi.fn().mockImplementation((input) => ({ input, __cmd: 'get' })),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ input, __cmd: 'delete' })),
}));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: getSignedUrlMock,
}));

const config: StorageConfig = {
  STORAGE_DRIVER: 's3',
  STORAGE_LOCAL_DIR: './.storage-local',
  STORAGE_S3_BUCKET: 'videos',
  STORAGE_S3_REGION: 'auto',
  STORAGE_S3_ENDPOINT: 'https://r2.example.com',
  STORAGE_S3_ACCESS_KEY_ID: 'key',
  STORAGE_S3_SECRET_ACCESS_KEY: 'secret',
  STORAGE_S3_FORCE_PATH_STYLE: true,
};

describe('S3StorageDriver', () => {
  beforeEach(() => {
    send.mockClear();
    getSignedUrlMock.mockClear();
  });

  it('throws when required S3 credentials are missing', async () => {
    const { S3StorageDriver } = await import('./s3-storage-driver');
    expect(() => new S3StorageDriver({ ...config, STORAGE_S3_BUCKET: undefined })).toThrow();
  });

  it('put() sends a PutObjectCommand for the given bucket/key', async () => {
    const { S3StorageDriver } = await import('./s3-storage-driver');
    const driver = new S3StorageDriver(config);

    await driver.put('videos/a.mp4', Buffer.from('x'), { contentType: 'video/mp4' });

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command.__cmd).toBe('put');
    expect(command.input).toMatchObject({ Bucket: 'videos', Key: 'videos/a.mp4', ContentType: 'video/mp4' });
  });

  it('signedGetUrl / signedPutUrl delegate to the presigner with ttlSec', async () => {
    const { S3StorageDriver } = await import('./s3-storage-driver');
    const driver = new S3StorageDriver(config);

    const getUrl = await driver.signedGetUrl('videos/a.mp4', 120);
    const putUrl = await driver.signedPutUrl('videos/a.mp4', 300);

    expect(getUrl).toBe('https://signed.example.com/object');
    expect(putUrl).toBe('https://signed.example.com/object');
    expect(getSignedUrlMock).toHaveBeenNthCalledWith(1, expect.anything(), expect.anything(), {
      expiresIn: 120,
    });
    expect(getSignedUrlMock).toHaveBeenNthCalledWith(2, expect.anything(), expect.anything(), {
      expiresIn: 300,
    });
  });

  it('delete() sends a DeleteObjectCommand', async () => {
    const { S3StorageDriver } = await import('./s3-storage-driver');
    const driver = new S3StorageDriver(config);

    await driver.delete('videos/a.mp4');

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].__cmd).toBe('delete');
  });
});
