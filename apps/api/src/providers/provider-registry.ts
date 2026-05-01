import { Injectable } from '@nestjs/common';
import type { MessagingProvider } from '@agent-bridge/core';

@Injectable()
export class ProviderRegistry {
  private readonly providers = new Map<string, MessagingProvider>();

  register(provider: MessagingProvider): void {
    this.providers.set(provider.channelType, provider);
  }

  get(channelType: string): MessagingProvider | undefined {
    return this.providers.get(channelType);
  }

  getAll(): MessagingProvider[] {
    return [...this.providers.values()];
  }
}
