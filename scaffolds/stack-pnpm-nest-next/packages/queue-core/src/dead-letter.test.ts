import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import type { Job, Queue, Worker } from 'bullmq';
import { wireDeadLetter } from './dead-letter';

function fakeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    name: 'transcode',
    data: { sourceKey: 'videos/a.mp4' },
    attemptsMade: 5,
    opts: { attempts: 5 },
    ...overrides,
  } as Job;
}

describe('wireDeadLetter', () => {
  it('pushes to the dead-letter queue once attempts are exhausted', () => {
    const worker = new EventEmitter() as unknown as Worker;
    const deadLetterQueue = { add: vi.fn().mockResolvedValue(undefined) } as unknown as Queue;

    wireDeadLetter(worker, deadLetterQueue);
    worker.emit('failed', fakeJob(), new Error('ffmpeg exited 1'), 'active');

    expect(deadLetterQueue.add).toHaveBeenCalledWith(
      'transcode',
      expect.objectContaining({ originalJobId: 'job-1', failedReason: 'ffmpeg exited 1', attemptsMade: 5 }),
    );
  });

  it('does not dead-letter a job that will still retry', () => {
    const worker = new EventEmitter() as unknown as Worker;
    const deadLetterQueue = { add: vi.fn().mockResolvedValue(undefined) } as unknown as Queue;

    wireDeadLetter(worker, deadLetterQueue);
    worker.emit(
      'failed',
      fakeJob({ attemptsMade: 2, opts: { attempts: 5 } }),
      new Error('transient'),
      'active',
    );

    expect(deadLetterQueue.add).not.toHaveBeenCalled();
  });

  it('ignores a failed event with no job', () => {
    const worker = new EventEmitter() as unknown as Worker;
    const deadLetterQueue = { add: vi.fn() } as unknown as Queue;

    wireDeadLetter(worker, deadLetterQueue);
    worker.emit('failed', undefined, new Error('no job'), 'active');

    expect(deadLetterQueue.add).not.toHaveBeenCalled();
  });
});
