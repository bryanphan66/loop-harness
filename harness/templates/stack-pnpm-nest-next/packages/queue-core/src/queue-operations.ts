import type { Queue } from 'bullmq';
import { DEFAULT_JOB_OPTIONS } from './queue-factory';
import type { JobStatus } from './job-types';

export interface EnqueueOptions {
  /** Dedup key: re-enqueuing the same key returns the existing job's id instead of a duplicate. */
  idempotencyKey?: string;
}

/**
 * Enqueue a job, returning its id. Idempotent when `idempotencyKey` is given:
 * BullMQ dedups on `jobId`, but we probe first so a caller can tell "reused an
 * existing job" apart from a brand-new enqueue in logs/tests.
 */
export async function enqueueJob<Payload>(
  queue: Queue,
  name: string,
  payload: Payload,
  opts: EnqueueOptions = {},
): Promise<string> {
  if (opts.idempotencyKey) {
    const existing = await queue.getJob(opts.idempotencyKey);
    if (existing) return existing.id as string;
  }
  const job = await queue.add(name, payload, {
    ...DEFAULT_JOB_OPTIONS,
    jobId: opts.idempotencyKey,
  });
  return job.id as string;
}

/** Status lookup — `unknown` (not `failedReason: 'not found'`) so callers can 404 cleanly. */
export async function getJobStatus(queue: Queue, jobId: string): Promise<JobStatus> {
  const job = await queue.getJob(jobId);
  if (!job) return { state: 'unknown', progress: 0 };
  const state = await job.getState();
  return {
    state,
    progress: job.progress ?? 0,
    failedReason: job.failedReason || undefined,
  };
}
