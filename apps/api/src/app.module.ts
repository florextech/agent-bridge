import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { SessionsModule } from './sessions/sessions.module';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [EventsModule, SessionsModule, ProvidersModule],
})
export class AppModule {}
