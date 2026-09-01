import type { LoginResponse, UserDto } from '@__PROJECT_SLUG__/shared-types';
import { apiFetch } from './client';

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser(): Promise<UserDto> {
  return apiFetch<UserDto>('/auth/me');
}
