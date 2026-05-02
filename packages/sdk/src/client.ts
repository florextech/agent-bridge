import type { AgentEvent, ChannelResponse, CreateAgentEventDto, CreateSessionDto, Session } from '@agent-bridge/core';

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

  /** Send an agent event notification */
  async sendEvent(dto: CreateAgentEventDto): Promise<AgentEvent> {
    return this.post<AgentEvent>('/agent-events', dto);
  }

  /** Get all events for a session */
  async getEvents(sessionId: string): Promise<AgentEvent[]> {
    return this.get<AgentEvent[]>(`/agent-events?sessionId=${sessionId}`);
  }

  /** Get channel responses (messages from the user) */
  async getResponses(sessionId: string): Promise<ChannelResponse[]> {
    return this.get<ChannelResponse[]>(`/agent-sessions/${sessionId}/responses`);
  }

  /** Get only unread responses */
  async getUnreadResponses(sessionId: string): Promise<ChannelResponse[]> {
    const all = await this.getResponses(sessionId);
    return all.filter((r) => !r.read);
  }

  /** Mark all responses as read */
  async markRead(sessionId: string): Promise<void> {
    await this.post(`/agent-sessions/${sessionId}/mark-read`, {});
  }

  /** Create a new session */
  async createSession(dto: CreateSessionDto): Promise<Session> {
    return this.post<Session>('/agent-sessions', dto);
  }

  /** List all sessions */
  async getSessions(): Promise<Session[]> {
    return this.get<Session[]>('/agent-sessions');
  }

  /** Get a session by ID */
  async getSession(sessionId: string): Promise<Session> {
    return this.get<Session>(`/agent-sessions/${sessionId}`);
  }

  /** Delete a session */
  async deleteSession(sessionId: string): Promise<void> {
    await this.request(`/agent-sessions/${sessionId}`, { method: 'DELETE' });
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers: this.headers });
    if (!res.ok) throw new Error(`agent-bridge: ${res.status} ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) as T : undefined as T;
  }
}
