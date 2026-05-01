import { Module, OnModuleInit } from '@nestjs/common';
import { ProviderRegistry } from './provider-registry';
import { TelegramProvider } from './telegram.provider';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  providers: [ProviderRegistry, TelegramProvider],
  exports: [ProviderRegistry],
})
export class ProvidersModule implements OnModuleInit {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly telegram: TelegramProvider,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.telegram);
  }
}
