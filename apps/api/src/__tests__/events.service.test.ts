import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventsService } from '../events/events.service';

const mockPrisma = {
  agentEvent: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
};

let service: EventsService;

beforeEach(() => {
  vi.resetAllMocks();
  service = new EventsService(mockPrisma as any);
});

const fakeRow = {
  id: 'e1', sessionId: 's1', type: 'message', payload: { text: 'hi' },
  deliveryStatus: 'pending', createdAt: new Date('2025-01-01'),
};

describe('EventsService', () => {
  it('create calls prisma and returns mapped event', async () => {
    mockPrisma.agentEvent.create.mockResolvedValue(fakeRow);
    const result = await service.create({ sessionId: 's1', type: 'message' as any, payload: { text: 'hi' } });
    expect(mockPrisma.agentEvent.create).toHaveBeenCalledWith({
      data: { sessionId: 's1', type: 'message', payload: { text: 'hi' } },
    });
    expect(result.id).toBe('e1');
    expect(result.createdAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('findBySession returns mapped events', async () => {
    mockPrisma.agentEvent.findMany.mockResolvedValue([fakeRow]);
    const result = await service.findBySession('s1');
    expect(mockPrisma.agentEvent.findMany).toHaveBeenCalledWith({ where: { sessionId: 's1' }, orderBy: { createdAt: 'asc' } });
    expect(result).toHaveLength(1);
  });

  it('updateDeliveryStatus calls prisma update', async () => {
    mockPrisma.agentEvent.update.mockResolvedValue({});
    await service.updateDeliveryStatus('e1', 'sent');
    expect(mockPrisma.agentEvent.update).toHaveBeenCalledWith({ where: { id: 'e1' }, data: { deliveryStatus: 'sent' } });
  });
});
