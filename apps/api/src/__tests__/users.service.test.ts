import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from '../users/users.service';
import { HttpException } from '@nestjs/common';

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed-pw'),
  compare: vi.fn().mockImplementation((plain: string, hashed: string) =>
    Promise.resolve(plain === 'correct-pw')),
}));

const mockPrisma = {
  user: {
    count: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  invitation: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(mockPrisma as any);
  });

  it('count returns user count', async () => {
    mockPrisma.user.count.mockResolvedValue(3);
    expect(await service.count()).toBe(3);
  });

  it('create hashes password and returns sanitized user', async () => {
    mockPrisma.user.create.mockResolvedValue({
      id: '1', email: 'a@b.com', name: 'Admin', role: 'admin', password: 'hashed-pw', createdAt: new Date(),
    });
    const user = await service.create('a@b.com', 'Admin', 'pw', 'admin');
    expect(user).not.toHaveProperty('password');
    expect(user.email).toBe('a@b.com');
  });

  it('validate returns user for valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1', email: 'a@b.com', name: 'A', role: 'admin', password: 'hashed', createdAt: new Date(),
    });
    const user = await service.validate('a@b.com', 'correct-pw');
    expect(user).toBeTruthy();
    expect(user!.email).toBe('a@b.com');
  });

  it('validate returns null for invalid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1', email: 'a@b.com', name: 'A', role: 'admin', password: 'hashed', createdAt: new Date(),
    });
    expect(await service.validate('a@b.com', 'wrong-pw')).toBeNull();
  });

  it('validate returns null for unknown user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    expect(await service.validate('x@y.com', 'pw')).toBeNull();
  });

  it('invite creates invitation record', async () => {
    mockPrisma.invitation.create.mockResolvedValue({
      id: 'inv-1', email: 'b@c.com', role: 'user', token: 'tok', expiresAt: new Date(),
    });
    const inv = await service.invite('b@c.com', 'user');
    expect(inv.email).toBe('b@c.com');
    expect(mockPrisma.invitation.create).toHaveBeenCalledOnce();
  });

  it('acceptInvite creates user from valid token', async () => {
    mockPrisma.invitation.findUnique.mockResolvedValue({
      id: 'inv-1', email: 'b@c.com', role: 'user', token: 'tok', expiresAt: new Date(Date.now() + 86400000),
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: '2', email: 'b@c.com', name: 'Bob', role: 'user', password: 'hashed-pw', createdAt: new Date(),
    });
    mockPrisma.invitation.delete.mockResolvedValue({});
    const user = await service.acceptInvite('tok', 'Bob', 'pw');
    expect(user.email).toBe('b@c.com');
    expect(mockPrisma.invitation.delete).toHaveBeenCalledOnce();
  });

  it('acceptInvite rejects expired token', async () => {
    mockPrisma.invitation.findUnique.mockResolvedValue({
      id: 'inv-1', email: 'b@c.com', role: 'user', token: 'tok', expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.acceptInvite('tok', 'Bob', 'pw')).rejects.toThrow(HttpException);
  });

  it('acceptInvite rejects invalid token', async () => {
    mockPrisma.invitation.findUnique.mockResolvedValue(null);
    await expect(service.acceptInvite('bad', 'Bob', 'pw')).rejects.toThrow(HttpException);
  });
});
