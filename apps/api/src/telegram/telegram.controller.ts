import { Body, Controller, Delete, Get, Logger, Param, Post, OnModuleInit } from '@nestjs/common';
import { TelegramUsersService } from './telegram-users.service';
import { SessionsService } from '../sessions/sessions.service';
import { TelegramProvider } from '../providers/telegram.provider';
import { PrismaService } from '../prisma.service';
import type { TelegramUser } from './telegram-users.service';

interface TelegramUpdate {
  message?: {
    chat: { id: number; username?: string; first_name?: string };
    text?: string;
  };
}

@Controller('telegram')
export class TelegramController implements OnModuleInit {
  private readonly logger = new Logger(TelegramController.name);
  private botToken: string | null = null;
  private botUsername: string | null = null;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private lastUpdateId = 0;

  constructor(
    private readonly users: TelegramUsersService,
    private readonly sessions: SessionsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Auto-load saved bot token
    const saved = await this.prisma.appSetting.findUnique({ where: { key: 'telegram_bot_token' } });
    if (saved?.value) {
      this.logger.log('Restoring Telegram bot from saved config');
      await this.connectBot(saved.value);
    } else {
      const envToken = process.env['TELEGRAM_BOT_TOKEN'];
      if (envToken) await this.connectBot(envToken);
    }
  }

  @Post('setup')
  async setup(@Body() body: { botToken: string }): Promise<{ ok: boolean; botUsername?: string; error?: string }> {
    try {
      const username = await this.connectBot(body.botToken);
      if (!username) return { ok: false, error: 'Invalid bot token' };

      // Persist token
      await this.prisma.appSetting.upsert({
        where: { key: 'telegram_bot_token' },
        create: { key: 'telegram_bot_token', value: body.botToken },
        update: { value: body.botToken },
      });
      await this.prisma.appSetting.upsert({
        where: { key: 'telegram_bot_username' },
        create: { key: 'telegram_bot_username', value: username },
        update: { value: username },
      });

      return { ok: true, botUsername: username };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  @Post('webhook')
  async handleWebhook(@Body() update: TelegramUpdate): Promise<{ ok: true }> {
    await this.processUpdate(update);
    return { ok: true };
  }

  @Get('users')
  findAll(): Promise<TelegramUser[]> {
    return this.users.findAll();
  }

  @Post('users/:chatId/authorize')
  async authorize(@Param('chatId') chatId: string): Promise<TelegramUser | null> {
    const user = await this.users.findByChatId(chatId);
    if (!user) return null;
    await this.users.setAuthorized(chatId, !user.authorized);
    return this.users.findByChatId(chatId);
  }

  @Delete('users/:chatId')
  async remove(@Param('chatId') chatId: string): Promise<{ ok: true }> {
    await this.users.remove(chatId);
    return { ok: true };
  }

  @Get('status')
  async getStatus(): Promise<{ connected: boolean; botUsername: string | null }> {
    if (this.botUsername) return { connected: true, botUsername: this.botUsername };
    // Check DB
    const saved = await this.prisma.appSetting.findUnique({ where: { key: 'telegram_bot_username' } });
    return { connected: this.botToken !== null, botUsername: saved?.value || null };
  }

  private async connectBot(token: string): Promise<string | null> {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json() as { ok: boolean; result?: { username: string }; description?: string };
    if (!data.ok) return null;

    this.botUsername = data.result?.username || null;
    TelegramProvider.setupToken = token;
    this.startPolling(token);
    return this.botUsername;
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
        await this.processUpdate(update);
      }
    } catch {
      // silent retry
    }
  }

  private async processUpdate(update: TelegramUpdate): Promise<void> {
    const msg = update.message;
    if (!msg?.text) return;

    const chatId = String(msg.chat.id);
    const username = msg.chat.username || null;
    const firstName = msg.chat.first_name || null;

    if (msg.text === '/start') {
      await this.users.upsert(chatId, username, firstName);
      this.logger.log(`User linked: ${firstName || username || chatId} (${chatId})`);
      this.sendReply(chatId, `⏳ *Request sent!*\n\nAn admin needs to authorize you before you receive notifications.\n\n_Agent Bridge_`);
      return;
    }

    const session = await this.sessions.findLatestActive();
    if (!session) {
      this.logger.warn(`Response from ${chatId} but no active session`);
      return;
    }

    const eventId = await this.sessions.getLastEventId(session.id);
    if (!eventId) {
      this.logger.warn(`Response from ${chatId} but session ${session.id} has no events`);
      return;
    }

    await this.sessions.addResponse(session.id, eventId, msg.text);
    this.logger.log(`Response saved from ${firstName || chatId}: "${msg.text}" → session ${session.id}`);
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
