import { Test } from '@nestjs/testing';
import { StorageService } from './storage.service';

const mockAdapter = {
  put: jest.fn().mockResolvedValue(undefined),
  signedGetUrl: jest.fn().mockResolvedValue('https://signed.example.com/get'),
  signedPutUrl: jest.fn().mockResolvedValue('https://signed.example.com/put'),
  delete: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@__PROJECT_SLUG__/storage-core', () => ({
  // Keep the real storageConfigSchema/etc — config/env.ts (imported
  // transitively via StorageService) merges it into the api's env schema;
  // only createStorageAdapter is faked for this unit test.
  ...jest.requireActual('@__PROJECT_SLUG__/storage-core'),
  createStorageAdapter: jest.fn(() => mockAdapter),
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({ providers: [StorageService] }).compile();
    service = moduleRef.get(StorageService);
  });

  it('put() delegates to the underlying adapter', async () => {
    const body = Buffer.from('x');
    await service.put('videos/a.mp4', body, { contentType: 'video/mp4' });
    expect(mockAdapter.put).toHaveBeenCalledWith('videos/a.mp4', body, { contentType: 'video/mp4' });
  });

  it('signedGetUrl() delegates and returns the adapter result', async () => {
    const url = await service.signedGetUrl('videos/a.mp4', 60);
    expect(url).toBe('https://signed.example.com/get');
    expect(mockAdapter.signedGetUrl).toHaveBeenCalledWith('videos/a.mp4', 60);
  });

  it('signedPutUrl() delegates and returns the adapter result', async () => {
    const url = await service.signedPutUrl('videos/a.mp4', 60);
    expect(url).toBe('https://signed.example.com/put');
    expect(mockAdapter.signedPutUrl).toHaveBeenCalledWith('videos/a.mp4', 60);
  });

  it('delete() delegates to the underlying adapter', async () => {
    await service.delete('videos/a.mp4');
    expect(mockAdapter.delete).toHaveBeenCalledWith('videos/a.mp4');
  });
});
