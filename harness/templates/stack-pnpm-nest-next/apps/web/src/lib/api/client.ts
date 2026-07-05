import type { AuthTokens } from '@__PROJECT_SLUG__/shared-types';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSession,
  readCookie,
  setSession,
} from '@/lib/auth/session';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function rawFetch<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.message ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Typed fetch with bearer auth; on 401 it tries one refresh-token rotation, then retries. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, init, readCookie(ACCESS_TOKEN_COOKIE));
  } catch (error) {
    const refreshToken = readCookie(REFRESH_TOKEN_COOKIE);
    if (!(error instanceof ApiError) || error.status !== 401 || !refreshToken) {
      throw error;
    }
    try {
      const tokens = await rawFetch<AuthTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      setSession(tokens);
      return await rawFetch<T>(path, init, tokens.accessToken);
    } catch {
      clearSession();
      throw error;
    }
  }
}
