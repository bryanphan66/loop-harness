import type { CreateUserRequest, UserDto } from '@__PROJECT_SLUG__/shared-types';
import { apiFetch } from './client';

export function listUsers(): Promise<UserDto[]> {
  return apiFetch<UserDto[]>('/users');
}

export function createUser(input: CreateUserRequest): Promise<UserDto> {
  return apiFetch<UserDto>('/users', { method: 'POST', body: JSON.stringify(input) });
}
