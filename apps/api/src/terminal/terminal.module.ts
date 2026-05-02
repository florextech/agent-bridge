import { Module } from '@nestjs/common';
import { TerminalGateway } from './terminal.gateway';
import { TerminalAgentGateway } from './terminal-agent.gateway';
import { TerminalController } from './terminal.controller';

@Module({
  controllers: [TerminalController],
  providers: [TerminalGateway, TerminalAgentGateway],
})
export class TerminalModule {}
