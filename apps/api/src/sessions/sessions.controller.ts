import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import type { ChannelResponse, CreateSessionDto, Session } from '@agent-bridge/core';
import { SessionsService } from './sessions.service';

@Controller('agent-sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  create(@Body() dto: CreateSessionDto): Promise<Session> {
    return this.sessions.create(dto);
  }

  @Get()
  findAll(): Promise<Session[]> {
    return this.sessions.findAll();
  }

  @Get(':sessionId')
  findOne(@Param('sessionId') id: string): Promise<Session | null> {
    return this.sessions.findById(id);
  }

  @Get(':sessionId/responses')
  getResponses(@Param('sessionId') sessionId: string): Promise<ChannelResponse[]> {
    return this.sessions.getResponses(sessionId);
  }

  @Post(':sessionId/mark-read')
  async markRead(@Param('sessionId') sessionId: string): Promise<{ ok: true }> {
    await this.sessions.markRead(sessionId);
    return { ok: true };
  }

  @Delete(':sessionId')
  async remove(@Param('sessionId') sessionId: string): Promise<{ ok: true }> {
    await this.sessions.remove(sessionId);
    return { ok: true };
  }
}
