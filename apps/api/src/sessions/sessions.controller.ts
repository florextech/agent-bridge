import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { ChannelResponse, CreateSessionDto, Session } from '@agent-bridge/core';
import { SessionsService } from './sessions.service';

@Controller('agent-sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  create(@Body() dto: CreateSessionDto): Session {
    return this.sessions.create(dto);
  }

  @Get()
  findAll(): Session[] {
    return this.sessions.findAll();
  }

  @Get(':sessionId')
  findOne(@Param('sessionId') id: string): Session | null {
    return this.sessions.findById(id);
  }

  @Get(':sessionId/responses')
  getResponses(@Param('sessionId') sessionId: string): ChannelResponse[] {
    return this.sessions.getResponses(sessionId);
  }

  @Post(':sessionId/mark-read')
  markRead(@Param('sessionId') sessionId: string): { ok: true } {
    this.sessions.markRead(sessionId);
    return { ok: true };
  }
}
