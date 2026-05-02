import { Module } from '@nestjs/common';
import { TerminalGateway } from './terminal.gateway';
import { TerminalAgentGateway } from './terminal-agent.gateway';

@Module({
  providers: [TerminalGateway, TerminalAgentGateway],
})
export class TerminalModule {}
