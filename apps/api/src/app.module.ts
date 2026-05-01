import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { SessionsModule } from './sessions/sessions.module';
import { ProvidersModule } from './providers/providers.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [EventsModule, SessionsModule, ProvidersModule, TelegramModule],
})
export class AppModule {}
