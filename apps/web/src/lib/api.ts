import type { AgentEvent, ChannelResponse, CreateSessionDto, Session } from '@agent-bridge/core';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface TelegramUser {
  chatId: string;
  username: string | null;
  firstName: string | null;
  authorized: boolean;
  linkedAt: string;
}

export const bridgeApi = {
  getSessions: () => api<Session[]>('/agent-sessions'),
  getSession: (id: string) => api<Session>(`/agent-sessions/${id}`),
  createSession: (dto: CreateSessionDto) =>
    api<Session>('/agent-sessions', { method: 'POST', body: JSON.stringify(dto) }),
  getEvents: (sessionId: string) => api<AgentEvent[]>(`/agent-events?sessionId=${sessionId}`),
  getResponses: (sessionId: string) => api<ChannelResponse[]>(`/agent-sessions/${sessionId}/responses`),
  markRead: (sessionId: string) =>
    api<{ ok: true }>(`/agent-sessions/${sessionId}/mark-read`, { method: 'POST' }),
  deleteSession: (sessionId: string) =>
    api<{ ok: true }>(`/agent-sessions/${sessionId}`, { method: 'DELETE' }),
  getTelegramUsers: () => api<TelegramUser[]>('/telegram/users'),
  toggleTelegramAuth: (chatId: string) =>
    api<TelegramUser>(`/telegram/users/${chatId}/authorize`, { method: 'POST' }),
  removeTelegramUser: (chatId: string) =>
    api<{ ok: true }>(`/telegram/users/${chatId}`, { method: 'DELETE' }),
};
