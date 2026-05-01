import { Module, OnModuleInit } from '@nestjs/common';
import { ProviderRegistry } from './provider-registry';
import { TelegramProvider } from './telegram.provider';
import { EmailProvider } from './email.provider';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  providers: [ProviderRegistry, TelegramProvider, EmailProvider],
  exports: [ProviderRegistry],
})
export class ProvidersModule implements OnModuleInit {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly telegram: TelegramProvider,
    private readonly email: EmailProvider,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.telegram);
    this.registry.register(this.email);
  }
}
