import { Body, Controller, Delete, Get, Logger, Param, Post } from '@nestjs/common';
import { TelegramUsersService } from './telegram-users.service';
import { SessionsService } from '../sessions/sessions.service';
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

  constructor(
    private readonly users: TelegramUsersService,
    private readonly sessions: SessionsService,
  ) {
    const envToken = process.env['TELEGRAM_BOT_TOKEN'];
    if (envToken) this.startPolling(envToken);
  }

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
    this.poll();
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
      // silent retry
    }
  }

  private processUpdate(update: TelegramUpdate): void {
    const msg = update.message;
    if (!msg?.text) return;

    const chatId = String(msg.chat.id);
    const username = msg.chat.username || null;
    const firstName = msg.chat.first_name || null;

    if (msg.text === '/start') {
      this.users.upsert(chatId, username, firstName);
      this.logger.log(`User linked: ${firstName || username || chatId} (${chatId})`);
      this.sendReply(chatId, `✅ *Linked!*\n\nYou'll now receive agent notifications here.\n\n_Agent Bridge_`);
      return;
    }

    // Save as response to the latest active session
    const session = this.sessions.findLatestActive();
    if (!session) {
      this.logger.warn(`Response from ${chatId} but no active session`);
      return;
    }

    const eventId = this.sessions.getLastEventId(session.id);
    if (!eventId) return;

    this.sessions.addResponse(session.id, eventId, msg.text);
    this.logger.log(`Response saved from ${firstName || chatId}: "${msg.text}" → session ${session.id}`);
    this.sendReply(chatId, `📨 Response saved to *${session.projectName}*`);
  }

  private sendReply(chatId: string, text: string): void {
    if (!this.botToken) return;
    fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    }).catch(() => {});
  }
}
