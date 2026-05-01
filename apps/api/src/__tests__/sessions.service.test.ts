import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionsService } from '../sessions/sessions.service';

const mockPrisma = {
  session: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  agentEvent: { findFirst: vi.fn() },
  channelResponse: { create: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
};

let service: SessionsService;

beforeEach(() => {
  vi.resetAllMocks();
  service = new SessionsService(mockPrisma as any);
});

const fakeRow = {
  id: 's1', projectName: 'proj', agentName: 'agent', status: 'active',
  channelType: 'telegram', channelConfig: {}, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01'),
};

describe('SessionsService', () => {
  it('create returns mapped session', async () => {
    mockPrisma.session.create.mockResolvedValue(fakeRow);
    const result = await service.create({ projectName: 'proj', agentName: 'agent', channelType: 'telegram' as any, channelConfig: {} });
    expect(result.id).toBe('s1');
    expect(result.createdAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('findAll returns mapped sessions', async () => {
    mockPrisma.session.findMany.mockResolvedValue([fakeRow]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('findById returns null when not found', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(null);
    expect(await service.findById('x')).toBeNull();
  });

  it('findById returns mapped session when found', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(fakeRow);
    const result = await service.findById('s1');
    expect(result?.id).toBe('s1');
  });

  it('remove calls prisma delete', async () => {
    mockPrisma.session.delete.mockResolvedValue({});
    await service.remove('s1');
    expect(mockPrisma.session.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
  });

  it('markRead calls updateMany', async () => {
    mockPrisma.channelResponse.updateMany.mockResolvedValue({});
    await service.markRead('s1');
    expect(mockPrisma.channelResponse.updateMany).toHaveBeenCalledWith({ where: { sessionId: 's1', read: false }, data: { read: true } });
  });
});
