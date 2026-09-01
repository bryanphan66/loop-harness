import { z } from 'zod';
import type { LoginRequest, RefreshRequest } from '@__PROJECT_SLUG__/shared-types';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
}) satisfies z.ZodType<LoginRequest>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
}) satisfies z.ZodType<RefreshRequest>;
