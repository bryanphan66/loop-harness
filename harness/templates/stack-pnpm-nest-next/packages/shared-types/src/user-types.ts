/** Role values mirror the Prisma `Role` enum — keep in sync with apps/api/prisma/schema.prisma */
export type Role = 'ADMIN' | 'MEMBER';

/** Public representation of a user — never includes the password hash. */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  role?: Role;
}
