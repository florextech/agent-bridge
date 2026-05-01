import { Injectable, Logger } from '@nestjs/common';
import { ChannelType } from '@agent-bridge/core';
import type { AgentEvent, ChannelResponse, MessagingProvider } from '@agent-bridge/core';

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

@Injectable()
export class TelegramProvider implements MessagingProvider {
  private readonly logger = new Logger(TelegramProvider.name);
  readonly channelType = ChannelType.Telegram;

  async sendNotification(event: AgentEvent, config: Record<string, unknown>): Promise<void> {
    const { botToken, chatId } = config as unknown as TelegramConfig;
    if (!botToken || !chatId) {
      throw new Error('Telegram config requires botToken and chatId');
    }

    const text = this.formatMessage(event);
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Telegram API error: ${res.status} ${body}`);
      throw new Error(`Telegram API error: ${res.status}`);
    }
  }

  parseIncomingMessage(_raw: unknown): ChannelResponse | null {
    // TODO: implement webhook parsing for Telegram responses
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
