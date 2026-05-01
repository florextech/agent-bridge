import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DeliveryStatus } from '@agent-bridge/core';
import type { AgentEvent, CreateAgentEventDto } from '@agent-bridge/core';
import { EventsService } from './events.service';
import { ProviderRegistry } from '../providers/provider-registry';
import { SessionsService } from '../sessions/sessions.service';

@Controller('agent-events')
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly sessions: SessionsService,
    private readonly providers: ProviderRegistry,
  ) {}

  @Get()
  findBySession(@Query('sessionId') sessionId: string): Promise<AgentEvent[]> {
    return this.events.findBySession(sessionId);
  }

  @Post()
  async create(@Body() dto: CreateAgentEventDto): Promise<AgentEvent> {
    const event = await this.events.create(dto);
    const session = await this.sessions.findById(dto.sessionId);
    if (session) {
      const provider = this.providers.get(session.channelType);
      if (provider) {
        try {
          await provider.sendNotification(event, session.channelConfig);
          await this.events.updateDeliveryStatus(event.id, 'sent');
          return { ...event, deliveryStatus: DeliveryStatus.Sent };
        } catch {
          await this.events.updateDeliveryStatus(event.id, 'failed');
          return { ...event, deliveryStatus: DeliveryStatus.Failed };
        }
      }
    }
    return event;
  }
}
