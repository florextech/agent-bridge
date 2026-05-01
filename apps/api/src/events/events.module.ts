import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { SessionsModule } from '../sessions/sessions.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [SessionsModule, ProvidersModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
