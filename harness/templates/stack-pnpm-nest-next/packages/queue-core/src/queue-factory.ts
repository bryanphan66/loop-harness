import { Queue, Worker, type Processor, type QueueOptions, type WorkerOptions } from 'bullmq';
import { parseRedisConnection, type QueueConfig } from './queue-config';

/** Single BullMQ queue; job "name" (transcode, ...) discriminates the payload. */
export const QUEUE_NAME = 'jobs';

/**
 * Durable ledger of jobs that exhausted every retry — BullMQ evicts failed
 * jobs from the main queue after `removeOnFail.age`, so this queue is the
 * long-lived record an operator can inspect/replay (async-job-queue playbook:
 * "failure surfaces real cause", never a silent swallow).
 */
export const DEAD_LETTER_QUEUE_NAME = 'jobs-dead-letter';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 86400 },
} as const;

export function createQueue(config: QueueConfig, options?: Partial<QueueOptions>): Queue {
  return new Queue(QUEUE_NAME, {
    connection: parseRedisConnection(config.REDIS_URL),
    ...options,
  });
}

export function createDeadLetterQueue(config: QueueConfig, options?: Partial<QueueOptions>): Queue {
  return new Queue(DEAD_LETTER_QUEUE_NAME, {
    connection: parseRedisConnection(config.REDIS_URL),
    ...options,
  });
}

export function createWorker<DataType = unknown, ResultType = unknown, NameType extends string = string>(
  config: QueueConfig,
  processor: Processor<DataType, ResultType, NameType>,
  options?: Partial<WorkerOptions>,
): Worker<DataType, ResultType, NameType> {
  return new Worker<DataType, ResultType, NameType>(QUEUE_NAME, processor, {
    connection: parseRedisConnection(config.REDIS_URL),
    concurrency: 2,
    ...options,
  });
}
