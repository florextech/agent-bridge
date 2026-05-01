import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramUsersService } from './telegram-users.service';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SessionsModule],
  controllers: [TelegramController],
  providers: [TelegramUsersService],
  exports: [TelegramUsersService],
})
export class TelegramModule {}
