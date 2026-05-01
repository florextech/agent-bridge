import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = process.env['DB_PATH'] || join(process.cwd(), 'agent-bridge.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate(db);
  }
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      channel_type TEXT NOT NULL,
      channel_config TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      type TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      delivery_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS channel_responses (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      event_id TEXT NOT NULL REFERENCES agent_events(id),
      content TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS telegram_users (
      id INTEGER PRIMARY KEY,
      chat_id TEXT NOT NULL UNIQUE,
      username TEXT,
      first_name TEXT,
      authorized INTEGER NOT NULL DEFAULT 1,
      linked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
