import { z } from 'zod';
import { queueConfigSchema } from '@__PROJECT_SLUG__/queue-core';
import { storageConfigSchema } from '@__PROJECT_SLUG__/storage-core';

/**
 * Single source of truth for API environment config, validated once at startup.
 * Secrets have dev-only defaults so the skeleton boots without a .env file;
 * override them in any real deployment.
 *
 * Tier-2 (queue + storage) fields are merged in from the shared packages so
 * their definitions live once and are reused by apps/worker's own env module
 * — opt-in: unset, they fall back to dev-safe defaults (local driver,
 * localhost redis), so the base api boots fine without Redis/S3 configured.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z
      .string()
      .default('postgresql://postgres:postgres@localhost:5432/app?schema=public'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    JWT_ACCESS_SECRET: z.string().min(8).default('dev-access-secret'),
    JWT_REFRESH_SECRET: z.string().min(8).default('dev-refresh-secret'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('7d'),
  })
  .merge(queueConfigSchema)
  .merge(storageConfigSchema);

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
