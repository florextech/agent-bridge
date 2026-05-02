import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { EventsModule } from './events/events.module';
import { SessionsModule } from './sessions/sessions.module';
import { ProvidersModule } from './providers/providers.module';
import { TelegramModule } from './telegram/telegram.module';
import { UsersModule } from './users/users.module';
import { TerminalModule } from './terminal/terminal.module';

@Module({
  imports: [PrismaModule, EventsModule, SessionsModule, ProvidersModule, TelegramModule, UsersModule, TerminalModule],
})
export class AppModule {}
