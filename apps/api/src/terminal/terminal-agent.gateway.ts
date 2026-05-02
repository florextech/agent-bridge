import { WebSocketGateway, OnGatewayConnection } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { WebSocket } from 'ws';
import { TerminalGateway } from './terminal.gateway';

@WebSocketGateway({ path: '/ws/terminal-agent' })
export class TerminalAgentGateway implements OnGatewayConnection {
  private readonly logger = new Logger(TerminalAgentGateway.name);

  constructor(private readonly terminal: TerminalGateway) {}

  handleConnection(client: WebSocket): void {
    this.logger.log('Terminal agent session connecting');
    this.terminal.registerAgent(client);
  }
}
