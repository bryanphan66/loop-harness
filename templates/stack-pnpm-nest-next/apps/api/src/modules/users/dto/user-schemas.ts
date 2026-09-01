import { z } from 'zod';
import type { CreateUserRequest, UpdateUserRequest } from '@__PROJECT_SLUG__/shared-types';

const roleSchema = z.enum(['ADMIN', 'MEMBER']);

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  role: roleSchema.optional(),
}) satisfies z.ZodType<CreateUserRequest>;

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).max(120).optional(),
  role: roleSchema.optional(),
}) satisfies z.ZodType<UpdateUserRequest>;
