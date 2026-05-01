import { describe, it, expect } from 'vitest';
import { ProviderRegistry } from '../providers/provider-registry';

describe('ProviderRegistry', () => {
  it('register and get returns the provider', () => {
    const registry = new ProviderRegistry();
    const provider = { channelType: 'telegram', sendNotification: async () => {}, parseIncomingMessage: () => null };
    registry.register(provider);
    expect(registry.get('telegram')).toBe(provider);
  });

  it('get returns undefined for unregistered type', () => {
    const registry = new ProviderRegistry();
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('getAll returns all registered providers', () => {
    const registry = new ProviderRegistry();
    const p1 = { channelType: 'a', sendNotification: async () => {}, parseIncomingMessage: () => null };
    const p2 = { channelType: 'b', sendNotification: async () => {}, parseIncomingMessage: () => null };
    registry.register(p1);
    registry.register(p2);
    expect(registry.getAll()).toHaveLength(2);
  });
});
