import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentBridgeClient } from '../client';

const mockJson = vi.fn();
const mockText = vi.fn().mockResolvedValue('error body');

function mockFetch(ok: boolean, json: unknown = {}) {
  mockJson.mockResolvedValue(json);
  return vi.fn().mockResolvedValue({ ok, json: mockJson, text: mockText } as unknown as Response);
}

beforeEach(() => { vi.restoreAllMocks(); });

describe('AgentBridgeClient', () => {
  it('strips trailing slash from baseUrl', () => {
    const client = new AgentBridgeClient({ baseUrl: 'http://localhost:3001/' });
    expect((client as any).baseUrl).toBe('http://localhost:3001');
  });

  it('sendEvent calls fetch with correct URL and body', async () => {
    const fetchSpy = mockFetch(true, { id: '1' });
    vi.stubGlobal('fetch', fetchSpy);

    const client = new AgentBridgeClient({ baseUrl: 'http://localhost:3001' });
    const dto = { sessionId: 's1', type: 'message' as any, payload: { text: 'hi' } };
    await client.sendEvent(dto);

    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3001/agent-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  });

  it('getResponses calls correct URL', async () => {
    const fetchSpy = mockFetch(true, []);
    vi.stubGlobal('fetch', fetchSpy);

    const client = new AgentBridgeClient({ baseUrl: 'http://localhost:3001' });
    await client.getResponses('s1');

    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3001/agent-sessions/s1/responses', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('markRead calls correct URL with POST', async () => {
    const fetchSpy = mockFetch(true);
    vi.stubGlobal('fetch', fetchSpy);

    const client = new AgentBridgeClient({ baseUrl: 'http://localhost:3001' });
    await client.markRead('s1');

    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3001/agent-sessions/s1/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('throws on non-ok response', async () => {
    const fetchSpy = mockFetch(false);
    vi.stubGlobal('fetch', fetchSpy);

    const client = new AgentBridgeClient({ baseUrl: 'http://localhost:3001' });
    await expect(client.sendEvent({ sessionId: 's1', type: 'message' as any, payload: {} }))
      .rejects.toThrow('agent-bridge:');
  });

  it('includes Authorization header when apiKey provided', async () => {
    const fetchSpy = mockFetch(true, []);
    vi.stubGlobal('fetch', fetchSpy);

    const client = new AgentBridgeClient({ baseUrl: 'http://localhost:3001', apiKey: 'key123' });
    await client.getResponses('s1');

    expect(fetchSpy.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer key123',
    });
  });
});
