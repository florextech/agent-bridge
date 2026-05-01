import { Injectable } from '@nestjs/common';
import type { AgentEvent, CreateAgentEventDto } from '@agent-bridge/core';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAgentEventDto): Promise<AgentEvent> {
    const row = await this.prisma.agentEvent.create({
      data: { sessionId: dto.sessionId, type: dto.type, payload: dto.payload as Prisma.InputJsonValue },
    });
    return toEvent(row);
  }

  async findBySession(sessionId: string): Promise<AgentEvent[]> {
    const rows = await this.prisma.agentEvent.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
    return rows.map(toEvent);
  }

  async updateDeliveryStatus(id: string, status: string): Promise<void> {
    await this.prisma.agentEvent.update({ where: { id }, data: { deliveryStatus: status } });
  }
}

function toEvent(row: { id: string; sessionId: string; type: string; payload: unknown; deliveryStatus: string; createdAt: Date }): AgentEvent {
  return {
    id: row.id,
    sessionId: row.sessionId,
    type: row.type as AgentEvent['type'],
    payload: row.payload as Record<string, unknown>,
    deliveryStatus: row.deliveryStatus as AgentEvent['deliveryStatus'],
    createdAt: row.createdAt.toISOString(),
  };
}
