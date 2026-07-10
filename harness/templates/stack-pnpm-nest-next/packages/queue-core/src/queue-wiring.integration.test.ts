import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createQueue, createWorker } from './queue-factory';
import { enqueueJob, getJobStatus } from './queue-operations';
import type { QueueConfig } from './queue-config';

/**
 * Real end-to-end smoke: spawns an actual `redis-server` (no mocks) and
 * proves enqueue -> worker consumption -> status polling -> idempotent
 * re-enqueue. Skips cleanly (not a failure) when `redis-server` isn't on
 * PATH — CI images that lack it still build/typecheck/unit-test this
 * package; only this one wiring proof is conditional on the real binary.
 */
const hasRedis = spawnSync('redis-server', ['--version']).status === 0;
const PORT = 16391;
const config: QueueConfig = { REDIS_URL: `redis://127.0.0.1:${PORT}` };

function waitForRedisReady(port: number, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryPing = (): void => {
      const ping = spawnSync('redis-cli', ['-p', String(port), 'ping']);
      if (ping.stdout?.toString().trim() === 'PONG') return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error('redis-server did not become ready'));
      setTimeout(tryPing, 100);
    };
    tryPing();
  });
}

describe.skipIf(!hasRedis)('enqueue -> worker -> status wiring (real redis-server)', () => {
  let redisProcess: ChildProcess;

  beforeAll(async () => {
    redisProcess = spawn('redis-server', ['--port', String(PORT), '--save', '', '--daemonize', 'no'], {
      stdio: 'ignore',
    });
    await waitForRedisReady(PORT);
  });

  afterAll(() => {
    redisProcess.kill();
  });

  it('a worker consumes an enqueued job and status reflects completion', async () => {
    const queue = createQueue(config);
    const worker = createWorker<{ n: number }, { doubled: number }>(config, async (job) => ({
      doubled: job.data.n * 2,
    }));
    await worker.waitUntilReady();

    try {
      const jobId = await enqueueJob(queue, 'double', { n: 21 }, { idempotencyKey: 'smoke-double-21' });
      expect(jobId).toBeTruthy();

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('job did not complete in time')), 8000);
        worker.on('completed', (job) => {
          if (job.id === jobId) {
            clearTimeout(timer);
            resolve();
          }
        });
      });

      const status = await getJobStatus<{ doubled: number }>(queue, jobId);
      expect(status.state).toBe('completed');
      expect(status.result).toEqual({ doubled: 42 });

      // Idempotency: re-enqueueing the same key returns the SAME job, no duplicate created.
      const dedupedId = await enqueueJob(queue, 'double', { n: 999 }, { idempotencyKey: 'smoke-double-21' });
      expect(dedupedId).toBe(jobId);
    } finally {
      await worker.close();
      await queue.close();
    }
  });
});
