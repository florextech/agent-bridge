import { Injectable } from '@nestjs/common';
import type { ChannelResponse, CreateSessionDto, Session } from '@agent-bridge/core';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionDto): Promise<Session> {
    const row = await this.prisma.session.create({
      data: {
        projectName: dto.projectName,
        agentName: dto.agentName,
        channelType: dto.channelType,
        channelConfig: dto.channelConfig as Prisma.InputJsonValue,
      },
    });
    return toSession(row);
  }

  async findAll(): Promise<Session[]> {
    const rows = await this.prisma.session.findMany({ orderBy: { updatedAt: 'desc' } });
    return rows.map(toSession);
  }

  async findById(id: string): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { id } });
    return row ? toSession(row) : null;
  }

  async findLatestActive(): Promise<Session | null> {
    const row = await this.prisma.session.findFirst({ where: { status: 'active' }, orderBy: { updatedAt: 'desc' } });
    return row ? toSession(row) : null;
  }

  async getLastEventId(sessionId: string): Promise<string | null> {
    const ev = await this.prisma.agentEvent.findFirst({ where: { sessionId }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    return ev?.id || null;
  }

  async getResponses(sessionId: string): Promise<ChannelResponse[]> {
    const rows = await this.prisma.channelResponse.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
    return rows.map(toResponse);
  }

  async addResponse(sessionId: string, eventId: string, content: string): Promise<ChannelResponse> {
    const row = await this.prisma.channelResponse.create({ data: { sessionId, eventId, content } });
    await this.prisma.session.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });
    return toResponse(row);
  }

  async markRead(sessionId: string): Promise<void> {
    await this.prisma.channelResponse.updateMany({ where: { sessionId, read: false }, data: { read: true } });
  }

  async remove(sessionId: string): Promise<void> {
    await this.prisma.session.delete({ where: { id: sessionId } });
  }
}

function toSession(row: { id: string; projectName: string; agentName: string; status: string; channelType: string; channelConfig: unknown; createdAt: Date; updatedAt: Date }): Session {
  return {
    id: row.id,
    projectName: row.projectName,
    agentName: row.agentName,
    status: row.status as Session['status'],
    channelType: row.channelType as Session['channelType'],
    channelConfig: row.channelConfig as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toResponse(row: { id: string; sessionId: string; eventId: string; content: string; read: boolean; createdAt: Date }): ChannelResponse {
  return {
    id: row.id,
    sessionId: row.sessionId,
    eventId: row.eventId,
    content: row.content,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
}
