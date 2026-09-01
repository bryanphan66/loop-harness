import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from './auth.service';

const adminUser = {
  id: 'user-1',
  email: 'admin@example.com',
  passwordHash: hashSync('admin1234', 4),
  name: 'Admin',
  role: 'ADMIN' as const,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('AuthService', () => {
  let service: AuthService;
  const prismaMock = {
    user: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('logs in a valid user and returns both tokens plus a safe user dto', async () => {
    prismaMock.user.findUnique.mockResolvedValue(adminUser);

    const result = await service.login('admin@example.com', 'admin1234');

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user.email).toBe('admin@example.com');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(adminUser);

    await expect(service.login('admin@example.com', 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.login('nobody@example.com', 'admin1234')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a garbage refresh token', async () => {
    await expect(service.refresh('not-a-jwt')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
