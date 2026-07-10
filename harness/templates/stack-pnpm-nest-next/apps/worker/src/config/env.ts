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
    // Override to point at a non-PATH ffmpeg/ffprobe binary; blank uses the
    // PATH lookup. ffprobe ships alongside ffmpeg in every image this
    // template installs it in (Alpine's + Debian/Ubuntu's `ffmpeg` package
    // both bundle it) — used to detect a source with no audio stream so the
    // HLS ladder can build an audio-free var_stream_map instead of failing.
    FFMPEG_PATH: z.string().default('ffmpeg'),
    FFPROBE_PATH: z.string().default('ffprobe'),
  })
  .merge(queueConfigSchema)
  .merge(storageConfigSchema);

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
