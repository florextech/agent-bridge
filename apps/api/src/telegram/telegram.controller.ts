import { Body, Controller, Delete, Get, Logger, Param, Post } from '@nestjs/common';
import { TelegramUsersService } from './telegram-users.service';
import type { TelegramUser } from './telegram-users.service';

interface TelegramUpdate {
  message?: {
    chat: { id: number; username?: string; first_name?: string };
    text?: string;
  };
}

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly users: TelegramUsersService) {}

  /** Telegram webhook — receives messages, auto-links users on /start */
  @Post('webhook')
  handleWebhook(@Body() update: TelegramUpdate): { ok: true } {
    const msg = update.message;
    if (!msg) return { ok: true };

    const chatId = String(msg.chat.id);
    const username = msg.chat.username || null;
    const firstName = msg.chat.first_name || null;

    if (msg.text === '/start') {
      this.users.upsert(chatId, username, firstName);
      this.logger.log(`User linked: ${firstName || username || chatId} (${chatId})`);

      // Send welcome message back
      const botToken = process.env['TELEGRAM_BOT_TOKEN'];
      if (botToken) {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ *Linked!*\n\nYou'll now receive agent notifications here.\n\n_Agent Bridge_`,
            parse_mode: 'Markdown',
          }),
        }).catch(() => {});
      }
    }

    return { ok: true };
  }

  /** List all linked Telegram users */
  @Get('users')
  findAll(): TelegramUser[] {
    return this.users.findAll();
  }

  /** Toggle authorization for a user */
  @Post('users/:chatId/authorize')
  authorize(@Param('chatId') chatId: string): TelegramUser | null {
    const user = this.users.findByChatId(chatId);
    if (!user) return null;
    this.users.setAuthorized(chatId, !user.authorized);
    return this.users.findByChatId(chatId);
  }

  /** Remove a linked user */
  @Delete('users/:chatId')
  remove(@Param('chatId') chatId: string): { ok: true } {
    this.users.remove(chatId);
    return { ok: true };
  }

  /** Get the bot link for users to start the linking flow */
  @Get('link')
  getLink(): { botToken: string | null; setupUrl: string | null } {
    const botToken = process.env['TELEGRAM_BOT_TOKEN'];
    if (!botToken) return { botToken: null, setupUrl: null };
    // Extract bot username from token isn't possible, so we provide the webhook setup URL
    return {
      botToken: botToken.slice(0, 8) + '...',
      setupUrl: `/telegram/webhook`,
    };
  }
}
