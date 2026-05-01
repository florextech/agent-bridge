import { Injectable } from '@nestjs/common';
import { getDb } from '../database';

export interface TelegramUser {
  chatId: string;
  username: string | null;
  firstName: string | null;
  authorized: boolean;
  linkedAt: string;
}

interface RawTelegramUser {
  chat_id: string;
  username: string | null;
  first_name: string | null;
  authorized: number;
  linked_at: string;
}

@Injectable()
export class TelegramUsersService {
  upsert(chatId: string, username: string | null, firstName: string | null): TelegramUser {
    const db = getDb();
    db.prepare(
      `INSERT INTO telegram_users (chat_id, username, first_name) VALUES (?, ?, ?)
       ON CONFLICT(chat_id) DO UPDATE SET username = excluded.username, first_name = excluded.first_name`,
    ).run(chatId, username, firstName);
    return this.findByChatId(chatId)!;
  }

  findAll(): TelegramUser[] {
    const db = getDb();
    return (db.prepare(`SELECT * FROM telegram_users ORDER BY linked_at DESC`).all() as RawTelegramUser[]).map(toUser);
  }

  findAuthorized(): TelegramUser[] {
    const db = getDb();
    return (db.prepare(`SELECT * FROM telegram_users WHERE authorized = 1 ORDER BY linked_at DESC`).all() as RawTelegramUser[]).map(toUser);
  }

  findByChatId(chatId: string): TelegramUser | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM telegram_users WHERE chat_id = ?`).get(chatId) as RawTelegramUser | undefined;
    return row ? toUser(row) : null;
  }

  setAuthorized(chatId: string, authorized: boolean): void {
    const db = getDb();
    db.prepare(`UPDATE telegram_users SET authorized = ? WHERE chat_id = ?`).run(authorized ? 1 : 0, chatId);
  }

  remove(chatId: string): void {
    const db = getDb();
    db.prepare(`DELETE FROM telegram_users WHERE chat_id = ?`).run(chatId);
  }
}

function toUser(row: RawTelegramUser): TelegramUser {
  return {
    chatId: row.chat_id,
    username: row.username,
    firstName: row.first_name,
    authorized: row.authorized === 1,
    linkedAt: row.linked_at,
  };
}
