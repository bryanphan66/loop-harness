import {
  createDeadLetterQueue,
  createWorker,
  wireDeadLetter,
  QUEUE_NAME,
  type Job,
  type TranscodeJobPayload,
  type TranscodeJobResult,
} from '@__PROJECT_SLUG__/queue-core';
import { createStorageAdapter } from '@__PROJECT_SLUG__/storage-core';
import { env } from './config/env';
import { runTranscodeJob } from './jobs/transcode.job';

const storage = createStorageAdapter(env);

// Single job type today (transcode) — extend with a switch on job.name (and a
// discriminated payload union in queue-core's job-types.ts) as more land.
async function processJob(
  job: Job<TranscodeJobPayload, TranscodeJobResult, string>,
): Promise<TranscodeJobResult> {
  if (job.name === 'transcode') {
    return runTranscodeJob(job as Job<TranscodeJobPayload, TranscodeJobResult, 'transcode'>, storage);
  }
  throw new Error(`worker received unknown job name: ${job.name}`);
}

function bootstrap(): void {
  const worker = createWorker<TranscodeJobPayload, TranscodeJobResult, string>(env, processJob);
  const deadLetterQueue = createDeadLetterQueue(env);
  wireDeadLetter(worker, deadLetterQueue);

  worker.on('error', (err) => {
    // BullMQ/ioredis retries transient connection errors on their own — log
    // and keep the process alive rather than crash (e.g. redis not up yet).
    console.error('[worker] connection error:', err.message);
  });
  worker.on('completed', (job) => {
    console.log(`[worker] job ${job.id} (${job.name}) completed`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[worker] job ${job?.id ?? 'unknown'} (${job?.name ?? 'unknown'}) failed:`, err.message);
  });

  console.log(`[worker] listening on queue "${QUEUE_NAME}" via ${env.REDIS_URL}`);

  const shutdown = async (): Promise<void> => {
    await worker.close();
    await deadLetterQueue.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

bootstrap();
