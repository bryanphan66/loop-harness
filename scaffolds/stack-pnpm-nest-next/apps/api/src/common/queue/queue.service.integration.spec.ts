import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { Test } from '@nestjs/testing';

type QueueCoreModule = typeof import('@__PROJECT_SLUG__/queue-core');
type QueueServiceModule = typeof import('./queue.service');

/**
 * Real end-to-end smoke against the NestJS-facing QueueService (not mocked):
 * a real `redis-server`, a real BullMQ worker (via queue-core), the actual
 * enqueue()/status() surface a controller would call. Skips (not fails) when
 * `redis-server` isn't on PATH.
 *
 * QueueService reads `REDIS_URL` via the api's env singleton, parsed once at
 * first import — so this test sets process.env.REDIS_URL and only THEN
 * requires queue.service / queue-core (dynamic require, not a static top-level
 * import) so the singleton picks up the ephemeral test port.
 */
const hasRedis = spawnSync('redis-server', ['--version']).status === 0;
const PORT = 16392;

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

(hasRedis ? describe : describe.skip)('QueueService (real redis-server)', () => {
  let redisProcess: ChildProcess;
  let service: InstanceType<QueueServiceModule['QueueService']>;
  let createWorker: QueueCoreModule['createWorker'];

  beforeAll(async () => {
    redisProcess = spawn('redis-server', ['--port', String(PORT), '--save', '', '--daemonize', 'no'], {
      stdio: 'ignore',
    });
    await waitForRedisReady(PORT);

    process.env.REDIS_URL = `redis://127.0.0.1:${PORT}`;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { QueueService }: QueueServiceModule = require('./queue.service');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ createWorker } = require('@__PROJECT_SLUG__/queue-core') as QueueCoreModule);

    const moduleRef = await Test.createTestingModule({ providers: [QueueService] }).compile();
    service = moduleRef.get(QueueService);
  }, 10000);

  afterAll(async () => {
    await service.onModuleDestroy();
    redisProcess.kill();
  });

  it('enqueue() -> worker consumes -> status() reflects completion, idempotently', async () => {
    const worker = createWorker<{ n: number }, { doubled: number }>(
      { REDIS_URL: `redis://127.0.0.1:${PORT}` },
      async (job) => ({ doubled: job.data.n * 2 }),
    );
    await worker.waitUntilReady();

    try {
      const jobId = await service.enqueue('double', { n: 10 }, { idempotencyKey: 'itest-double-10' });

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('job did not complete in time')), 8000);
        worker.on('completed', (job) => {
          if (job.id === jobId) {
            clearTimeout(timer);
            resolve();
          }
        });
      });

      const status = await service.status(jobId);
      expect(status.state).toBe('completed');
      expect(status.result).toEqual({ doubled: 20 });

      const dedupedId = await service.enqueue('double', { n: 999 }, { idempotencyKey: 'itest-double-10' });
      expect(dedupedId).toBe(jobId);
    } finally {
      await worker.close();
    }
  }, 15000);
});
