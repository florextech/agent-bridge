import type { AgentEvent, ChannelResponse } from './types';

/**
 * Contract for messaging channel providers.
 * Implement this interface to add support for a new channel (Telegram, WhatsApp, etc.)
 */
export interface MessagingProvider {
  /** Unique channel identifier */
  readonly channelType: string;

  /** Send an agent event notification to the channel */
  sendNotification(event: AgentEvent, config: Record<string, unknown>): Promise<void>;

  /** Process an incoming message from the channel and return a structured response */
  parseIncomingMessage(raw: unknown): ChannelResponse | null;
}
