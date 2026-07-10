import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  createQueue,
  enqueueJob,
  getJobStatus,
  type EnqueueOptions,
  type JobStatus,
  type Queue,
} from '@__PROJECT_SLUG__/queue-core';
import { env } from '../../config/env';

/**
 * Tier-2, opt-in: not imported by AppModule by default (the walking skeleton
 * stays db+api+web). A project with an async-job/media-pipeline phase wires
 * this module into its feature module once that phase lands.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queue: Queue;

  constructor() {
    this.queue = createQueue({ REDIS_URL: env.REDIS_URL });
  }

  /** Enqueue a job; `idempotencyKey` dedups re-enqueues of the same logical work. */
  async enqueue<Payload>(
    name: string,
    payload: Payload,
    opts: EnqueueOptions = {},
  ): Promise<string> {
    return enqueueJob(this.queue, name, payload, opts);
  }

  async status(jobId: string): Promise<JobStatus> {
    return getJobStatus(this.queue, jobId);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
