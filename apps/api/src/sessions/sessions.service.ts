import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ChannelResponse, CreateSessionDto, Session } from '@agent-bridge/core';
import { getDb } from '../database';

@Injectable()
export class SessionsService {
  create(dto: CreateSessionDto): Session {
    const db = getDb();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO sessions (id, project_name, agent_name, channel_type, channel_config) VALUES (?, ?, ?, ?, ?)`,
    ).run(id, dto.projectName, dto.agentName, dto.channelType, JSON.stringify(dto.channelConfig));
    return this.findById(id)!;
  }

  findAll(): Session[] {
    const db = getDb();
    return (db.prepare(`SELECT * FROM sessions ORDER BY updated_at DESC`).all() as RawSession[]).map(toSession);
  }

  findById(id: string): Session | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as RawSession | undefined;
    return row ? toSession(row) : null;
  }

  findLatestActive(): Session | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM sessions WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1`).get() as RawSession | undefined;
    return row ? toSession(row) : null;
  }

  getLastEventId(sessionId: string): string | null {
    const db = getDb();
    const row = db.prepare(`SELECT id FROM agent_events WHERE session_id = ? ORDER BY created_at DESC LIMIT 1`).get(sessionId) as { id: string } | undefined;
    return row?.id || null;
  }

  getResponses(sessionId: string): ChannelResponse[] {
    const db = getDb();
    const rows = db
      .prepare(`SELECT * FROM channel_responses WHERE session_id = ? ORDER BY created_at ASC`)
      .all(sessionId) as RawResponse[];
    return rows.map(toResponse);
  }

  addResponse(sessionId: string, eventId: string, content: string): ChannelResponse {
    const db = getDb();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO channel_responses (id, session_id, event_id, content) VALUES (?, ?, ?, ?)`,
    ).run(id, sessionId, eventId, content);
    db.prepare(`UPDATE sessions SET updated_at = datetime('now') WHERE id = ?`).run(sessionId);
    return this.getResponseById(id)!;
  }

  markRead(sessionId: string): void {
    const db = getDb();
    db.prepare(`UPDATE channel_responses SET read = 1 WHERE session_id = ? AND read = 0`).run(sessionId);
  }

  remove(sessionId: string): void {
    const db = getDb();
    db.prepare(`DELETE FROM channel_responses WHERE session_id = ?`).run(sessionId);
    db.prepare(`DELETE FROM agent_events WHERE session_id = ?`).run(sessionId);
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
  }

  private getResponseById(id: string): ChannelResponse | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM channel_responses WHERE id = ?`).get(id) as RawResponse | undefined;
    return row ? toResponse(row) : null;
  }
}

interface RawSession {
  id: string;
  project_name: string;
  agent_name: string;
  status: string;
  channel_type: string;
  channel_config: string;
  created_at: string;
  updated_at: string;
}

interface RawResponse {
  id: string;
  session_id: string;
  event_id: string;
  content: string;
  read: number;
  created_at: string;
}

function toSession(row: RawSession): Session {
  return {
    id: row.id,
    projectName: row.project_name,
    agentName: row.agent_name,
    status: row.status as Session['status'],
    channelType: row.channel_type as Session['channelType'],
    channelConfig: JSON.parse(row.channel_config) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toResponse(row: RawResponse): ChannelResponse {
  return {
    id: row.id,
    sessionId: row.session_id,
    eventId: row.event_id,
    content: row.content,
    read: row.read === 1,
    createdAt: row.created_at,
  };
}
