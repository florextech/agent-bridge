import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createTestApp, createMockPrisma } from './test-utils';

describe('Users E2E', () => {
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

  it('GET /users/count — returns { count: 0 }', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/count')
      .expect(200);
    expect(res.body).toEqual({ count: 0 });
  });

  it('POST /users/setup — creates admin', async () => {
    mockPrisma.user.count.mockResolvedValueOnce(0);
    mockPrisma.user.create.mockResolvedValueOnce({
      id: 'user-1', email: 'admin@test.com', name: 'Admin',
      password: 'hashed', role: 'admin', createdAt: new Date(),
    });
    const res = await request(app.getHttpServer())
      .post('/users/setup')
      .send({ email: 'admin@test.com', name: 'Admin', password: 'secret123' })
      .expect(201);
    expect(res.body.id).toBe('user-1');
    expect(res.body.role).toBe('admin');
    expect(res.body).not.toHaveProperty('password');
  });

  it('POST /users/setup — returns 409 if already set up', async () => {
    mockPrisma.user.count.mockResolvedValueOnce(1);
    await request(app.getHttpServer())
      .post('/users/setup')
      .send({ email: 'admin@test.com', name: 'Admin', password: 'secret123' })
      .expect(409);
  });

  it('POST /users/login — returns 401 for invalid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: 'bad@test.com', password: 'wrong' })
      .expect(401);
  });

  it('GET /users — returns array', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
