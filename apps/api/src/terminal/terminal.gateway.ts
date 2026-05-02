import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, WebSocket } from 'ws';

@WebSocketGateway({ path: '/ws/terminal' })
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TerminalGateway.name);

  @WebSocketServer()
  server!: Server;

  private agent: WebSocket | null = null;
  private browserClients = new Set<WebSocket>();

  handleConnection(client: WebSocket): void {
    this.browserClients.add(client);
    const mode = this.agent ? 'remote PTY' : 'no agent';
    client.send(JSON.stringify({ type: 'output', data: `\x1b[90m● Connected (${mode})\x1b[0m\r\n` }));
  }

  handleDisconnect(client: WebSocket): void {
    this.browserClients.delete(client);
  }

  @SubscribeMessage('input')
  handleInput(_client: WebSocket, payload: string): void {
    if (this.agent && this.agent.readyState === 1) {
      this.agent.send(JSON.stringify({ event: 'input', data: payload }));
    }
  }

  @SubscribeMessage('exec')
  handleExec(_client: WebSocket, payload: string): void {
    if (this.agent && this.agent.readyState === 1) {
      this.agent.send(JSON.stringify({ event: 'exec', data: payload }));
    }
  }

  @SubscribeMessage('resize')
  handleResize(_client: WebSocket, payload: string | { cols: number; rows: number }): void {
    const data = typeof payload === 'string' ? JSON.parse(payload) as { cols: number; rows: number } : payload;
    if (this.agent && this.agent.readyState === 1 && data?.cols && data?.rows) {
      this.agent.send(JSON.stringify({ event: 'resize', cols: data.cols, rows: data.rows }));
    }
  }

  registerAgent(ws: WebSocket): void {
    this.agent = ws;
    this.logger.log('Remote terminal agent (PTY) registered');

    this.browserClients.forEach((c) => {
      if (c.readyState === 1) c.send(JSON.stringify({ type: 'output', data: '\x1b[32m● Remote agent connected\x1b[0m\r\n' }));
    });

    ws.on('message', (raw: Buffer) => {
      const msg = JSON.parse(raw.toString());
      this.browserClients.forEach((client) => {
        if (client.readyState === 1) client.send(JSON.stringify(msg));
      });
    });

    ws.on('close', () => {
      this.agent = null;
      this.logger.log('Remote terminal agent disconnected');
      this.browserClients.forEach((c) => {
        if (c.readyState === 1) c.send(JSON.stringify({ type: 'output', data: '\r\n\x1b[31m● Agent disconnected\x1b[0m\r\n' }));
      });
    });
  }
}
