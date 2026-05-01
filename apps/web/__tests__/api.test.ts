import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after stubbing fetch
const { bridgeApi } = await import('@/lib/api');

beforeEach(() => { mockFetch.mockReset(); });

function okJson(data: unknown) {
  return { ok: true, json: () => Promise.resolve(data), text: () => Promise.resolve('') };
}

describe('bridgeApi', () => {
  it('getSessions calls correct URL', async () => {
    mockFetch.mockResolvedValueOnce(okJson([]));
    await bridgeApi.getSessions();
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/agent-sessions', expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }));
  });

  it('createSession sends POST with body', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: '1' }));
    await bridgeApi.createSession({ name: 'test', channels: ['telegram'] } as any);
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toHaveProperty('name', 'test');
  });

  it('deleteSession sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ ok: true }));
    await bridgeApi.deleteSession('s1');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/agent-sessions/s1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('getTelegramUsers calls correct URL', async () => {
    mockFetch.mockResolvedValueOnce(okJson([]));
    await bridgeApi.getTelegramUsers();
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/telegram/users', expect.anything());
  });

  it('setupTelegram sends POST with botToken', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ ok: true }));
    await bridgeApi.setupTelegram('tok123');
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toHaveProperty('botToken', 'tok123');
  });

  it('getUserCount calls correct URL', async () => {
    mockFetch.mockResolvedValueOnce(okJson({ count: 5 }));
    const result = await bridgeApi.getUserCount();
    expect(result.count).toBe(5);
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/users/count', expect.anything());
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('err') });
    await expect(bridgeApi.getSessions()).rejects.toThrow('API 500');
  });
});
