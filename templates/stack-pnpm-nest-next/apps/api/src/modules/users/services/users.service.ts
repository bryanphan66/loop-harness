import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { CreateUserRequest, UpdateUserRequest, UserDto } from '@__PROJECT_SLUG__/shared-types';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/** Strips the password hash and serializes dates for API responses. */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map(toUserDto);
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return toUserDto(user);
  }

  async create(input: CreateUserRequest, actorId?: string): Promise<UserDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hash(input.password, 10),
        name: input.name,
        role: input.role ?? 'MEMBER',
      },
    });
    await this.audit(actorId, 'user.create', user.id, { email: user.email });
    return toUserDto(user);
  }

  async update(id: string, input: UpdateUserRequest, actorId?: string): Promise<UserDto> {
    await this.findOne(id);
    const data: Prisma.UserUpdateInput = {
      email: input.email,
      name: input.name,
      role: input.role,
    };
    if (input.password) {
      data.passwordHash = await hash(input.password, 10);
    }
    const user = await this.prisma.user.update({ where: { id }, data });
    await this.audit(actorId, 'user.update', user.id);
    return toUserDto(user);
  }

  async remove(id: string, actorId?: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    await this.audit(actorId, 'user.delete', id);
  }

  private async audit(
    actorId: string | undefined,
    action: string,
    entityId: string,
    meta?: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: { actorId: actorId ?? null, action, entity: 'user', entityId, meta },
    });
  }
}
