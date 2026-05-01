import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createTestApp, createMockPrisma } from './test-utils';

describe('Telegram E2E', () => {
  let app: INestApplication;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    delete process.env['TELEGRAM_BOT_TOKEN'];
    const ctx = await createTestApp();
    app = ctx.app;
    mockPrisma = ctx.mockPrisma;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /telegram/status — returns { connected, botUsername }', async () => {
    const res = await request(app.getHttpServer())
      .get('/telegram/status')
      .expect(200);
    expect(res.body).toHaveProperty('connected');
    expect(res.body).toHaveProperty('botUsername');
    expect(res.body.connected).toBe(false);
  });

  it('GET /telegram/users — returns array', async () => {
    const res = await request(app.getHttpServer())
      .get('/telegram/users')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /telegram/webhook — returns { ok: true }', async () => {
    const res = await request(app.getHttpServer())
      .post('/telegram/webhook')
      .send({ message: null })
      .expect(201);
    expect(res.body).toEqual({ ok: true });
  });
});
