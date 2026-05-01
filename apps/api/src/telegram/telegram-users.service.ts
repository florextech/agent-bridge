import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface TelegramUser {
  chatId: string;
  username: string | null;
  firstName: string | null;
  authorized: boolean;
  linkedAt: string;
}

@Injectable()
export class TelegramUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(chatId: string, username: string | null, firstName: string | null): Promise<TelegramUser> {
    const row = await this.prisma.telegramUser.upsert({
      where: { chatId },
      create: { chatId, username, firstName },
      update: { username, firstName },
    });
    return toUser(row);
  }

  async findAll(): Promise<TelegramUser[]> {
    const rows = await this.prisma.telegramUser.findMany({ orderBy: { linkedAt: 'desc' } });
    return rows.map(toUser);
  }

  async findAuthorized(): Promise<TelegramUser[]> {
    const rows = await this.prisma.telegramUser.findMany({ where: { authorized: true }, orderBy: { linkedAt: 'desc' } });
    return rows.map(toUser);
  }

  async findByChatId(chatId: string): Promise<TelegramUser | null> {
    const row = await this.prisma.telegramUser.findUnique({ where: { chatId } });
    return row ? toUser(row) : null;
  }

  async setAuthorized(chatId: string, authorized: boolean): Promise<void> {
    await this.prisma.telegramUser.update({ where: { chatId }, data: { authorized } });
  }

  async remove(chatId: string): Promise<void> {
    await this.prisma.telegramUser.delete({ where: { chatId } });
  }
}

function toUser(row: { chatId: string; username: string | null; firstName: string | null; authorized: boolean; linkedAt: Date }): TelegramUser {
  return { chatId: row.chatId, username: row.username, firstName: row.firstName, authorized: row.authorized, linkedAt: row.linkedAt.toISOString() };
}
