import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramUsersService } from './telegram-users.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramUsersService],
  exports: [TelegramUsersService],
})
export class TelegramModule {}
