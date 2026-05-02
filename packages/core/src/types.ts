import type { AgentEventType, ChannelType, DeliveryStatus, SessionStatus } from './enums';

// --- Core entities ---

export interface AgentEvent {
  id: string;
  sessionId: string;
  type: AgentEventType;
  payload: Record<string, unknown>;
  createdAt: string;
  deliveryStatus: DeliveryStatus;
}

export interface Session {
  id: string;
  projectName: string;
  agentName: string;
  status: SessionStatus;
  channelType: ChannelType;
  channelConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelResponse {
  id: string;
  sessionId: string;
  eventId: string;
  content: string;
  author?: string;
  read: boolean;
  createdAt: string;
}

// --- DTOs ---

export interface CreateAgentEventDto {
  sessionId: string;
  type: AgentEventType;
  payload: Record<string, unknown>;
}

export interface CreateSessionDto {
  projectName: string;
  agentName: string;
  channelType: ChannelType;
  channelConfig: Record<string, unknown>;
}

// --- API responses ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
