import { z } from 'zod';

/**
 * Shared storage env schema — merged into api's and worker's own single
 * env module (each process validates independently; field definitions live
 * once here). `s3` also serves S3-compatible endpoints (Cloudflare R2, MinIO)
 * via STORAGE_S3_ENDPOINT + STORAGE_S3_FORCE_PATH_STYLE.
 *
 * Plain ZodObject (no cross-field refinement) on purpose — callers `.merge()`
 * this into their own top-level env schema, and `.merge()` only works on a
 * plain object schema, not a `ZodEffects`. The "S3_* required when
 * STORAGE_DRIVER=s3" rule is instead enforced where it actually matters, at
 * `S3StorageDriver` construction (see s3-storage-driver.ts) — a config that
 * never instantiates the s3 driver never trips it.
 */
export const storageConfigSchema = z.object({
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./.storage-local'),
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_REGION: z.string().default('auto'),
  STORAGE_S3_ENDPOINT: z.string().optional(),
  STORAGE_S3_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
});

export type StorageConfig = z.infer<typeof storageConfigSchema>;

export function loadStorageConfig(source: NodeJS.ProcessEnv = process.env): StorageConfig {
  return storageConfigSchema.parse(source);
}
