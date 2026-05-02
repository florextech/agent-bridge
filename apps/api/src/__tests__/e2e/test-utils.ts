import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { SessionsController } from '../../sessions/sessions.controller';
import { SessionsService } from '../../sessions/sessions.service';
import { EventsController } from '../../events/events.controller';
import { EventsService } from '../../events/events.service';
import { TelegramController } from '../../telegram/telegram.controller';
import { TelegramUsersService } from '../../telegram/telegram-users.service';
import { UsersController } from '../../users/users.controller';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma.service';
import { ProviderRegistry } from '../../providers/provider-registry';
import { vi } from 'vitest';

export function createMockPrisma() {
  return {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    session: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    agentEvent: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    channelResponse: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn(),
    },
    telegramUser: {
      upsert: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
    },
    invitation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    appSetting: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn(),
    },
  };
}

export async function createTestApp() {
  const mockPrisma = createMockPrisma();
  const mockRegistry = { register: vi.fn(), get: vi.fn(), getAll: vi.fn().mockReturnValue([]) };

  const moduleRef = await Test.createTestingModule({
    controllers: [SessionsController, EventsController, TelegramController, UsersController],
    providers: [
      SessionsService,
      EventsService,
      TelegramUsersService,
      UsersService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: ProviderRegistry, useValue: mockRegistry },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return { app, mockPrisma, mockRegistry };
}
