import type { AgentEvent, ChannelResponse, CreateAgentEventDto } from '@agent-bridge/core';

export interface AgentBridgeConfig {
  baseUrl: string;
  apiKey?: string;
}

export class AgentBridgeClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: AgentBridgeConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    };
  }

  async sendEvent(dto: CreateAgentEventDto): Promise<AgentEvent> {
    const res = await fetch(`${this.baseUrl}/agent-events`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(`agent-bridge: ${res.status} ${await res.text()}`);
    return res.json() as Promise<AgentEvent>;
  }

  async getResponses(sessionId: string): Promise<ChannelResponse[]> {
    const res = await fetch(`${this.baseUrl}/agent-sessions/${sessionId}/responses`, {
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`agent-bridge: ${res.status} ${await res.text()}`);
    return res.json() as Promise<ChannelResponse[]>;
  }

  async markRead(sessionId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/agent-sessions/${sessionId}/mark-read`, {
      method: 'POST',
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`agent-bridge: ${res.status} ${await res.text()}`);
  }
}
