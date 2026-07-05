import { z } from 'zod';

/**
 * Single source of truth for API environment config, validated once at startup.
 * Secrets have dev-only defaults so the skeleton boots without a .env file;
 * override them in any real deployment.
 */
const envSchema = z.object({
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
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
