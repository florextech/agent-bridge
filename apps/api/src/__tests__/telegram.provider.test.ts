import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramProvider } from '../providers/telegram.provider';

const mockUsersService = { findAuthorized: vi.fn() };

let provider: TelegramProvider;

beforeEach(() => {
  vi.resetAllMocks();
  provider = new TelegramProvider(mockUsersService as any);
});

describe('TelegramProvider', () => {
  it('channelType is telegram', () => {
    expect(provider.channelType).toBe('telegram');
  });

  it('formatMessage produces expected output', () => {
    const event = { id: 'e1', sessionId: 's1', type: 'task_completed', payload: { summary: 'Done!' }, deliveryStatus: 'pending', createdAt: '' };
    const msg = (provider as any).formatMessage(event);
    expect(msg).toContain('✅');
    expect(msg).toContain('Done!');
    expect(msg).toContain('s1');
  });

  it('sendNotification calls fetch for each authorized user', async () => {
    mockUsersService.findAuthorized.mockResolvedValue([{ chatId: '111' }, { chatId: '222' }]);
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    const event = { id: 'e1', sessionId: 's1', type: 'message', payload: {}, deliveryStatus: 'pending', createdAt: '' };
    await provider.sendNotification(event as any, { botToken: 'tok123' });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toContain('api.telegram.org/bottok123/sendMessage');
  });

  it('sendNotification throws without botToken', async () => {
    const orig = process.env['TELEGRAM_BOT_TOKEN'];
    delete process.env['TELEGRAM_BOT_TOKEN'];
    TelegramProvider.setupToken = null;

    const event = { id: 'e1', sessionId: 's1', type: 'message', payload: {}, deliveryStatus: 'pending', createdAt: '' };
    await expect(provider.sendNotification(event as any, {})).rejects.toThrow('botToken required');

    process.env['TELEGRAM_BOT_TOKEN'] = orig;
  });

  it('parseIncomingMessage returns null', () => {
    expect(provider.parseIncomingMessage({})).toBeNull();
  });
});
