import { Injectable, Logger } from '@nestjs/common';
import { ChannelType } from '@agent-bridge/core';
import type { AgentEvent, ChannelResponse, MessagingProvider } from '@agent-bridge/core';
import { Resend } from 'resend';

@Injectable()
export class EmailProvider implements MessagingProvider {
  private readonly logger = new Logger(EmailProvider.name);
  readonly channelType = ChannelType.Email;

  async sendNotification(event: AgentEvent, config: Record<string, unknown>): Promise<void> {
    const apiKey = (config['resendApiKey'] as string | undefined)?.trim() || process.env['RESEND_API_KEY'];
    const to = config['to'] as string | undefined;
    const from = (config['from'] as string | undefined) ?? process.env['RESEND_FROM'] ?? 'Agent Bridge <noreply@resend.dev>';

    if (!apiKey || !to) {
      this.logger.warn('Email skipped: missing RESEND_API_KEY or recipient');
      return;
    }

    const resend = new Resend(apiKey);
    const emoji: Record<string, string> = {
      task_started: '🚀', task_completed: '✅', needs_review: '👀',
      needs_approval: '🔐', error: '❌', test_results: '🧪', message: '💬',
    };
    const icon = emoji[event.type] || '📨';
    const summary = (event.payload['summary'] as string) || event.type;

    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `${icon} ${event.type} — Agent Bridge`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#111;color:#eee;border-radius:12px">
          <h2 style="margin:0 0 8px">${icon} ${event.type.replaceAll('_', ' ')}</h2>
          <p style="color:#b8c4ba;margin:0 0 16px">${summary}</p>
          <hr style="border:none;border-top:1px solid #263028;margin:16px 0">
          <p style="font-size:12px;color:#76b73d">Session: ${event.sessionId}</p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Resend error: ${error.message}`);
      throw new Error(error.message);
    }
  }

  parseIncomingMessage(_raw: unknown): ChannelResponse | null {
    return null;
  }
}
