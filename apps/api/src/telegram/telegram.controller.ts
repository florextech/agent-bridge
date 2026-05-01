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
  private botToken: string | null = null;
  private botUsername: string | null = null;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private lastUpdateId = 0;

  constructor(private readonly users: TelegramUsersService) {
    // Auto-start polling if env var is set
    const envToken = process.env['TELEGRAM_BOT_TOKEN'];
    if (envToken) this.startPolling(envToken);
  }

  /** Setup bot: saves token, starts polling, returns bot username */
  @Post('setup')
  async setup(@Body() body: { botToken: string }): Promise<{ ok: boolean; botUsername?: string; error?: string }> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${body.botToken}/getMe`);
      const data = await res.json() as { ok: boolean; result?: { username: string }; description?: string };
      if (!data.ok) return { ok: false, error: data.description || 'Invalid bot token' };

      this.startPolling(body.botToken);
      this.botUsername = data.result?.username || null;
      return { ok: true, botUsername: this.botUsername || undefined };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  /** Webhook endpoint (for production with HTTPS) */
  @Post('webhook')
  handleWebhook(@Body() update: TelegramUpdate): { ok: true } {
    this.processUpdate(update);
    return { ok: true };
  }

  @Get('users')
  findAll(): TelegramUser[] {
    return this.users.findAll();
  }

  @Post('users/:chatId/authorize')
  authorize(@Param('chatId') chatId: string): TelegramUser | null {
    const user = this.users.findByChatId(chatId);
    if (!user) return null;
    this.users.setAuthorized(chatId, !user.authorized);
    return this.users.findByChatId(chatId);
  }

  @Delete('users/:chatId')
  remove(@Param('chatId') chatId: string): { ok: true } {
    this.users.remove(chatId);
    return { ok: true };
  }

  @Get('status')
  getStatus(): { connected: boolean; botUsername: string | null } {
    return { connected: this.botToken !== null, botUsername: this.botUsername };
  }

  private startPolling(token: string): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    this.botToken = token;
    this.logger.log('Telegram polling started');

    this.pollingTimer = setInterval(() => this.poll(), 3000);
    this.poll(); // immediate first poll
  }

  private async poll(): Promise<void> {
    if (!this.botToken) return;
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=1`;
      const res = await fetch(url);
      const data = await res.json() as { ok: boolean; result?: (TelegramUpdate & { update_id: number })[] };
      if (!data.ok || !data.result) return;

      for (const update of data.result) {
        this.lastUpdateId = update.update_id;
        this.processUpdate(update);
      }
    } catch {
      // silent — will retry next interval
    }
  }

  private processUpdate(update: TelegramUpdate): void {
    const msg = update.message;
    if (!msg) return;

    const chatId = String(msg.chat.id);
    const username = msg.chat.username || null;
    const firstName = msg.chat.first_name || null;

    if (msg.text === '/start') {
      this.users.upsert(chatId, username, firstName);
      this.logger.log(`User linked: ${firstName || username || chatId} (${chatId})`);

      if (this.botToken) {
        fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
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
  }
}
