import type { Job, Queue, Worker } from 'bullmq';

/**
 * Wire a worker's `failed` event to the dead-letter queue once a job has
 * exhausted every retry attempt (attemptsMade >= attempts configured on the
 * job). Call once per worker instance right after `createWorker(...)`.
 */
export function wireDeadLetter(worker: Worker, deadLetterQueue: Queue): void {
  worker.on('failed', (job: Job | undefined, error: Error) => {
    if (!job) return;
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return; // will retry — not dead yet
    void deadLetterQueue.add(job.name, {
      originalJobId: job.id,
      name: job.name,
      payload: job.data,
      failedReason: error?.message ?? 'unknown error',
      attemptsMade: job.attemptsMade,
      failedAt: new Date().toISOString(),
    });
  });
}
