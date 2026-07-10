import { describe, expect, it, vi } from 'vitest';
import type { Job, Queue } from 'bullmq';
import { enqueueJob, getJobStatus } from './queue-operations';

function fakeQueue(overrides: Partial<Queue> = {}): Queue {
  return {
    getJob: vi.fn().mockResolvedValue(undefined),
    add: vi.fn(),
    ...overrides,
  } as unknown as Queue;
}

describe('enqueueJob', () => {
  it('adds a new job and returns its id', async () => {
    const queue = fakeQueue({ add: vi.fn().mockResolvedValue({ id: 'new-job' } as Job) });

    const jobId = await enqueueJob(queue, 'transcode', { sourceKey: 'a.mp4' });

    expect(jobId).toBe('new-job');
    expect(queue.add).toHaveBeenCalledWith(
      'transcode',
      { sourceKey: 'a.mp4' },
      expect.objectContaining({ attempts: 5 }),
    );
  });

  it('reuses an existing job id when idempotencyKey matches one already enqueued', async () => {
    const queue = fakeQueue({
      getJob: vi.fn().mockResolvedValue({ id: 'existing-job' } as Job),
      add: vi.fn(),
    });

    const jobId = await enqueueJob(queue, 'transcode', { sourceKey: 'a.mp4' }, { idempotencyKey: 'dedup-1' });

    expect(jobId).toBe('existing-job');
    expect(queue.add).not.toHaveBeenCalled();
  });
});

describe('getJobStatus', () => {
  it('returns unknown state for a job that does not exist', async () => {
    const queue = fakeQueue();

    const status = await getJobStatus(queue, 'missing');

    expect(status).toEqual({ state: 'unknown', progress: 0 });
  });

  it('returns state/progress/failedReason for an existing job', async () => {
    const job = {
      getState: vi.fn().mockResolvedValue('failed'),
      progress: 42,
      failedReason: 'ffmpeg exited 1',
    } as unknown as Job;
    const queue = fakeQueue({ getJob: vi.fn().mockResolvedValue(job) });

    const status = await getJobStatus(queue, 'job-1');

    expect(status).toEqual({ state: 'failed', progress: 42, failedReason: 'ffmpeg exited 1' });
  });
});
