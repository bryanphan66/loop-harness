import { SetMetadata } from '@nestjs/common';
import type { Role } from '@__PROJECT_SLUG__/shared-types';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
