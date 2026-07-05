import type { AuthTokens } from '@__PROJECT_SLUG__/shared-types';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Client-side cookie session. Cookies (not localStorage) so the server layout
 * in (app) can gate routes. Walking-skeleton simplicity: not httpOnly — swap for
 * a server-side session route when the project needs hardened auth.
 */
export function setSession(tokens: AuthTokens): void {
  const attrs = 'path=/; samesite=lax; max-age=604800';
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(tokens.accessToken)}; ${attrs}`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(tokens.refreshToken)}; ${attrs}`;
}

export function clearSession(): void {
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) {
    document.cookie = `${name}=; path=/; max-age=0`;
  }
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
