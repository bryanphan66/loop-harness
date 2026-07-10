import { z } from 'zod';
import { queueConfigSchema } from '@__PROJECT_SLUG__/queue-core';
import { storageConfigSchema } from '@__PROJECT_SLUG__/storage-core';

/**
 * Single source of truth for the worker's env, validated once at startup —
 * same pattern as apps/api/src/config/env.ts. Deployed/scaled independently
 * from the api, so it validates its own process.env rather than importing
 * api's env module (each process owns its own config).
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Override to point at a non-PATH ffmpeg binary; blank uses `ffmpeg` from PATH.
    FFMPEG_PATH: z.string().default('ffmpeg'),
  })
  .merge(queueConfigSchema)
  .merge(storageConfigSchema);

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
