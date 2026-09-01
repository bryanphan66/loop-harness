import { Test } from '@nestjs/testing';
import { QueueService } from './queue.service';

const mockQueue = { close: jest.fn().mockResolvedValue(undefined) };
const enqueueJob = jest.fn().mockResolvedValue('job-123');
const getJobStatus = jest
  .fn()
  .mockResolvedValue({ state: 'completed', progress: 100, result: { manifestKey: 'hls/x/master.m3u8' } });

jest.mock('@__PROJECT_SLUG__/queue-core', () => ({
  // Keep the real queueConfigSchema/etc — config/env.ts (imported transitively
  // via QueueService) merges it into the api's env schema; only the
  // queue-runtime pieces below are faked for this unit test.
  ...jest.requireActual('@__PROJECT_SLUG__/queue-core'),
  createQueue: jest.fn(() => mockQueue),
  enqueueJob: (...args: unknown[]) => enqueueJob(...args),
  getJobStatus: (...args: unknown[]) => getJobStatus(...args),
}));

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({ providers: [QueueService] }).compile();
    service = moduleRef.get(QueueService);
  });

  it('enqueue() delegates to enqueueJob against the underlying queue', async () => {
    const jobId = await service.enqueue('transcode', { sourceKey: 'a.mp4' }, { idempotencyKey: 'k-1' });

    expect(jobId).toBe('job-123');
    expect(enqueueJob).toHaveBeenCalledWith(
      mockQueue,
      'transcode',
      { sourceKey: 'a.mp4' },
      { idempotencyKey: 'k-1' },
    );
  });

  it('status() delegates to getJobStatus', async () => {
    const status = await service.status('job-123');

    expect(status).toEqual({
      state: 'completed',
      progress: 100,
      result: { manifestKey: 'hls/x/master.m3u8' },
    });
    expect(getJobStatus).toHaveBeenCalledWith(mockQueue, 'job-123');
  });

  it('onModuleDestroy() closes the underlying queue connection', async () => {
    await service.onModuleDestroy();
    expect(mockQueue.close).toHaveBeenCalledTimes(1);
  });
});
