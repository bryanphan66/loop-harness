import { z } from 'zod';

/**
 * Shared queue env schema — the api process and the standalone worker process
 * each merge this into their own single-source-of-truth env module (DRY: the
 * field definitions live once here, validated independently by every process
 * that reads them since api and worker are deployed/scaled separately).
 */
export const queueConfigSchema = z.object({
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

export type QueueConfig = z.infer<typeof queueConfigSchema>;

export function loadQueueConfig(source: NodeJS.ProcessEnv = process.env): QueueConfig {
  return queueConfigSchema.parse(source);
}

/** bullmq/ioredis connection options, parsed once from a REDIS_URL. */
export interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  // Required by BullMQ's blocking commands (Worker/QueueEvents) — see bullmq docs.
  maxRetriesPerRequest: null;
}

export function parseRedisConnection(redisUrl: string): RedisConnectionOptions {
  const url = new URL(redisUrl);
  const db = url.pathname.replace(/^\//, '');
  return {
    host: url.hostname || 'localhost',
    port: url.port ? Number(url.port) : 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    db: db ? Number(db) : undefined,
    maxRetriesPerRequest: null,
  };
}
