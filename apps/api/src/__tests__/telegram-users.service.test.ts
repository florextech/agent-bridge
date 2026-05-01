import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramUsersService } from '../telegram/telegram-users.service';

const mockPrisma = {
  telegramUser: { upsert: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
};

let service: TelegramUsersService;

beforeEach(() => {
  vi.resetAllMocks();
  service = new TelegramUsersService(mockPrisma as any);
});

const fakeRow = { chatId: '123', username: 'user', firstName: 'John', authorized: true, linkedAt: new Date('2025-01-01') };

describe('TelegramUsersService', () => {
  it('upsert calls prisma and returns mapped user', async () => {
    mockPrisma.telegramUser.upsert.mockResolvedValue(fakeRow);
    const result = await service.upsert('123', 'user', 'John');
    expect(mockPrisma.telegramUser.upsert).toHaveBeenCalledWith({
      where: { chatId: '123' },
      create: { chatId: '123', username: 'user', firstName: 'John' },
      update: { username: 'user', firstName: 'John' },
    });
    expect(result.linkedAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('findAll returns mapped users', async () => {
    mockPrisma.telegramUser.findMany.mockResolvedValue([fakeRow]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('findAuthorized filters by authorized', async () => {
    mockPrisma.telegramUser.findMany.mockResolvedValue([fakeRow]);
    await service.findAuthorized();
    expect(mockPrisma.telegramUser.findMany).toHaveBeenCalledWith({ where: { authorized: true }, orderBy: { linkedAt: 'desc' } });
  });

  it('setAuthorized calls prisma update', async () => {
    mockPrisma.telegramUser.update.mockResolvedValue({});
    await service.setAuthorized('123', false);
    expect(mockPrisma.telegramUser.update).toHaveBeenCalledWith({ where: { chatId: '123' }, data: { authorized: false } });
  });

  it('remove calls prisma delete', async () => {
    mockPrisma.telegramUser.delete.mockResolvedValue({});
    await service.remove('123');
    expect(mockPrisma.telegramUser.delete).toHaveBeenCalledWith({ where: { chatId: '123' } });
  });
});
