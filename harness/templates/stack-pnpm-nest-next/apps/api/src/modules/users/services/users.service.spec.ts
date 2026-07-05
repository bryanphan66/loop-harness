import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compareSync } from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from './users.service';

const dbUser = {
  id: 'user-2',
  email: 'member@example.com',
  passwordHash: 'irrelevant-hash',
  name: 'Member',
  role: 'MEMBER' as const,
  createdAt: new Date('2026-01-02'),
  updatedAt: new Date('2026-01-02'),
};

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('lists users as safe dtos without password hashes', async () => {
    prismaMock.user.findMany.mockResolvedValue([dbUser]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('member@example.com');
    expect(result[0]).not.toHaveProperty('passwordHash');
  });

  it('hashes the password on create and writes an audit log', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(({ data }) =>
      Promise.resolve({ ...dbUser, ...data }),
    );
    prismaMock.auditLog.create.mockResolvedValue({});

    await service.create(
      { email: 'new@example.com', password: 'secret-pass-1', name: 'New' },
      'actor-1',
    );

    const created = prismaMock.user.create.mock.calls[0][0].data;
    expect(created.passwordHash).not.toBe('secret-pass-1');
    expect(compareSync('secret-pass-1', created.passwordHash)).toBe(true);
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'user.create', actorId: 'actor-1' }),
      }),
    );
  });

  it('rejects duplicate emails with 409', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser);

    await expect(
      service.create({ email: dbUser.email, password: 'secret-pass-1', name: 'Dup' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws 404 for a missing user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
