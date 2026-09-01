import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PutBody, PutOptions, StorageAdapter } from './storage-adapter';
import type { StorageConfig } from './storage-config';

/**
 * S3-compatible driver — AWS S3 and any S3-compatible endpoint (Cloudflare
 * R2, MinIO) via STORAGE_S3_ENDPOINT + forcePathStyle.
 */
export class S3StorageDriver implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: StorageConfig) {
    if (!config.STORAGE_S3_BUCKET || !config.STORAGE_S3_ACCESS_KEY_ID || !config.STORAGE_S3_SECRET_ACCESS_KEY) {
      throw new Error('S3StorageDriver requires STORAGE_S3_BUCKET/ACCESS_KEY_ID/SECRET_ACCESS_KEY');
    }
    this.bucket = config.STORAGE_S3_BUCKET;
    this.client = new S3Client({
      region: config.STORAGE_S3_REGION,
      endpoint: config.STORAGE_S3_ENDPOINT,
      forcePathStyle: config.STORAGE_S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: config.STORAGE_S3_ACCESS_KEY_ID,
        secretAccessKey: config.STORAGE_S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async put(key: string, body: PutBody, opts?: PutOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: opts?.contentType,
      }),
    );
  }

  async signedGetUrl(key: string, ttlSec: number): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: ttlSec,
    });
  }

  async signedPutUrl(key: string, ttlSec: number): Promise<string> {
    return getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: ttlSec,
    });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
