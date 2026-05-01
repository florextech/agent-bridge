import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createTestApp, createMockPrisma } from './test-utils';

describe('Events E2E', () => {
  let app: INestApplication;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    mockPrisma = ctx.mockPrisma;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /agent-events — creates event, returns 201', async () => {
    mockPrisma.agentEvent.create.mockResolvedValueOnce({
      id: 'evt-1', sessionId: 'sess-1', type: 'message',
      payload: { summary: 'hello' }, deliveryStatus: 'pending',
      createdAt: new Date(),
    });
    // Return null session so notification is skipped
    mockPrisma.session.findUnique.mockResolvedValueOnce(null);

    const res = await request(app.getHttpServer())
      .post('/agent-events')
      .send({ sessionId: 'sess-1', type: 'message', payload: { summary: 'hello' } })
      .expect(201);
    expect(res.body.id).toBe('evt-1');
    expect(res.body.sessionId).toBe('sess-1');
  });

  it('GET /agent-events?sessionId=xxx — returns array', async () => {
    const res = await request(app.getHttpServer())
      .get('/agent-events?sessionId=sess-1')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
