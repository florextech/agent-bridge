import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createTestApp, createMockPrisma } from './test-utils';

describe('Sessions E2E', () => {
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

  it('POST /agent-sessions — creates session, returns 201', async () => {
    mockPrisma.session.create.mockResolvedValueOnce({
      id: 'sess-1', projectName: 'test', agentName: 'kiro',
      status: 'active', channelType: 'telegram', channelConfig: {},
      createdAt: new Date(), updatedAt: new Date(),
    });
    const res = await request(app.getHttpServer())
      .post('/agent-sessions')
      .send({ projectName: 'test', agentName: 'kiro', channelType: 'telegram', channelConfig: {} })
      .expect(201);
    expect(res.body.id).toBe('sess-1');
    expect(res.body.projectName).toBe('test');
  });

  it('GET /agent-sessions — returns array', async () => {
    const res = await request(app.getHttpServer())
      .get('/agent-sessions')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /agent-sessions/:id — returns session', async () => {
    mockPrisma.session.findUnique.mockResolvedValueOnce({
      id: 'sess-1', projectName: 'test', agentName: 'kiro',
      status: 'active', channelType: 'telegram', channelConfig: {},
      createdAt: new Date(), updatedAt: new Date(),
    });
    const res = await request(app.getHttpServer())
      .get('/agent-sessions/sess-1')
      .expect(200);
    expect(res.body.id).toBe('sess-1');
  });

  it('GET /agent-sessions/:id — returns empty when not found', async () => {
    mockPrisma.session.findUnique.mockResolvedValueOnce(null);
    const res = await request(app.getHttpServer())
      .get('/agent-sessions/nonexistent')
      .expect(200);
    expect(res.body).toEqual({});
  });

  it('DELETE /agent-sessions/:id — returns { ok: true }', async () => {
    mockPrisma.session.delete.mockResolvedValueOnce({});
    const res = await request(app.getHttpServer())
      .delete('/agent-sessions/sess-1')
      .expect(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET /agent-sessions/:id/responses — returns array', async () => {
    const res = await request(app.getHttpServer())
      .get('/agent-sessions/sess-1/responses')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /agent-sessions/:id/mark-read — returns { ok: true }', async () => {
    mockPrisma.channelResponse.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = await request(app.getHttpServer())
      .post('/agent-sessions/sess-1/mark-read')
      .expect(201);
    expect(res.body).toEqual({ ok: true });
  });
});
