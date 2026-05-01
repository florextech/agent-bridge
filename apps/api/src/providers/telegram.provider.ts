import { Injectable, Logger } from '@nestjs/common';
import { ChannelType } from '@agent-bridge/core';
import type { AgentEvent, ChannelResponse, MessagingProvider } from '@agent-bridge/core';
import { TelegramUsersService } from '../telegram/telegram-users.service';

@Injectable()
export class TelegramProvider implements MessagingProvider {
  private readonly logger = new Logger(TelegramProvider.name);
  readonly channelType = ChannelType.Telegram;
  static setupToken: string | null = null;

  constructor(private readonly users: TelegramUsersService) {}

  async sendNotification(event: AgentEvent, config: Record<string, unknown>): Promise<void> {
    const botToken = (config['botToken'] as string | undefined)?.trim() || process.env['TELEGRAM_BOT_TOKEN'] || TelegramProvider.setupToken;
    if (!botToken) throw new Error('Telegram botToken required');

    // If chatId is provided explicitly, send only there. Otherwise send to all authorized users.
    const explicitChatId = config['chatId'] as string | undefined;
    const targets = explicitChatId
      ? [explicitChatId]
      : this.users.findAuthorized().map((u) => u.chatId);

    if (targets.length === 0) {
      this.logger.warn('No authorized Telegram users to notify');
      return;
    }

    const text = this.formatMessage(event);
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await Promise.all(
      targets.map(async (chatId) => {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
        });
        if (!res.ok) {
          const body = await res.text();
          this.logger.error(`Telegram API error for ${chatId}: ${res.status} ${body}`);
        }
      }),
    );
  }

  parseIncomingMessage(_raw: unknown): ChannelResponse | null {
    return null;
  }

  private formatMessage(event: AgentEvent): string {
    const emoji: Record<string, string> = {
      task_started: '🚀',
      task_completed: '✅',
      needs_review: '👀',
      needs_approval: '🔐',
      error: '❌',
      test_results: '🧪',
      message: '💬',
    };
    const icon = emoji[event.type] || '📨';
    const summary = (event.payload['summary'] as string) || event.type;
    return `${icon} *${event.type}*\n\n${summary}\n\n_Session: ${event.sessionId}_`;
  }
}
