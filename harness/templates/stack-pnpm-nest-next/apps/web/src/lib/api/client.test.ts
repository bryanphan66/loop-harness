import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './client';

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('apiFetch', () => {
  beforeEach(() => {
    document.cookie = 'access_token=test-token; path=/';
    document.cookie = 'refresh_token=; path=/; max-age=0';
  });

  afterEach(() => {
    document.cookie = 'access_token=; path=/; max-age=0';
    vi.restoreAllMocks();
  });

  it('attaches the bearer token from the cookie', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(mockResponse(200, { hello: 'world' }));

    const result = await apiFetch<{ hello: string }>('/health');

    expect(result.hello).toBe('world');
    const [, init] = fetchMock.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
  });

  it('throws ApiError with the server message on non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse(403, { message: 'Insufficient role' }),
    );

    await expect(apiFetch('/users', { method: 'POST' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: 'Insufficient role',
    });
    await expect(apiFetch('/users')).rejects.toBeInstanceOf(ApiError);
  });
});
