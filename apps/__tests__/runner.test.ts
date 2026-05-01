import { describe, it, expect, vi } from 'vitest';

describe('runner', () => {
  it('should parse --session arg', () => {
    const args = ['--session', 'abc-123', '--api', 'http://test:3001'];
    const getArg = (name: string) => {
      const idx = args.indexOf(`--${name}`);
      return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
    };
    expect(getArg('session')).toBe('abc-123');
    expect(getArg('api')).toBe('http://test:3001');
    expect(getArg('missing')).toBeNull();
  });

  it('should poll and process unread responses', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ content: 'hello', read: false }]) })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    const apiUrl = 'http://localhost:3001';
    const sessionId = 'test-session';
    const res = await fetch(`${apiUrl}/agent-sessions/${sessionId}/responses`);
    const responses = await res.json();
    const unread = responses.filter((r: { read: boolean }) => !r.read);
    expect(unread).toHaveLength(1);
    expect(unread[0].content).toBe('hello');

    await fetch(`${apiUrl}/agent-sessions/${sessionId}/mark-read`, { method: 'POST' });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });

  it('should handle API errors gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', mockFetch);
    const res = await fetch('http://localhost:3001/agent-sessions/x/responses');
    expect(res.ok).toBe(false);
    vi.unstubAllGlobals();
  });
});
