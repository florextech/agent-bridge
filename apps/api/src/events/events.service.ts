import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { AgentEvent, CreateAgentEventDto } from '@agent-bridge/core';
import { getDb } from '../database';

@Injectable()
export class EventsService {
  create(dto: CreateAgentEventDto): AgentEvent {
    const db = getDb();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO agent_events (id, session_id, type, payload) VALUES (?, ?, ?, ?)`,
    ).run(id, dto.sessionId, dto.type, JSON.stringify(dto.payload));

    return this.findById(id)!;
  }

  findBySession(sessionId: string): AgentEvent[] {
    const db = getDb();
    const rows = db
      .prepare(`SELECT * FROM agent_events WHERE session_id = ? ORDER BY created_at ASC`)
      .all(sessionId) as RawEvent[];
    return rows.map(toAgentEvent);
  }

  findById(id: string): AgentEvent | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM agent_events WHERE id = ?`).get(id) as RawEvent | undefined;
    return row ? toAgentEvent(row) : null;
  }

  updateDeliveryStatus(id: string, status: string): void {
    const db = getDb();
    db.prepare(`UPDATE agent_events SET delivery_status = ? WHERE id = ?`).run(status, id);
  }
}

interface RawEvent {
  id: string;
  session_id: string;
  type: string;
  payload: string;
  delivery_status: string;
  created_at: string;
}

function toAgentEvent(row: RawEvent): AgentEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    type: row.type as AgentEvent['type'],
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    deliveryStatus: row.delivery_status as AgentEvent['deliveryStatus'],
    createdAt: row.created_at,
  };
}
