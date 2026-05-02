import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import type { Server, WebSocket } from 'ws';

@WebSocketGateway({ path: '/ws/terminal' })
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TerminalGateway.name);

  @WebSocketServer()
  server!: Server;

  private agent: WebSocket | null = null;

  handleConnection(client: WebSocket, req: { url?: string }): void {
    this.logger.log(`Terminal client connected (${req.url || 'unknown'})`);
    const hasAgent = this.agent !== null;
    client.send(JSON.stringify({ type: 'output', data: hasAgent ? '● Connected (remote agent)\r\n' : '● Connected (local)\r\n' }));
  }

  handleDisconnect(): void {
    this.logger.log('Terminal client disconnected');
  }

  @SubscribeMessage('exec')
  handleExec(client: WebSocket, payload: string): void {
    const cmd = typeof payload === 'string' ? payload : String(payload);
    if (!cmd.trim()) return;

    // If a remote agent is connected, forward to it
    if (this.agent && this.agent.readyState === 1) {
      this.logger.log(`Forwarding to agent: ${cmd}`);
      this.agent.send(JSON.stringify({ event: 'exec', data: cmd }));
      return;
    }

    // Otherwise execute locally
    this.logger.log(`Local exec: ${cmd}`);
    const proc = spawn('sh', ['-c', cmd], {
      cwd: process.env['TERMINAL_CWD'] || process.cwd(),
      env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '1' },
    });

    proc.stdout.on('data', (data: Buffer) => {
      client.send(JSON.stringify({ type: 'output', data: data.toString() }));
    });

    proc.stderr.on('data', (data: Buffer) => {
      client.send(JSON.stringify({ type: 'output', data: data.toString() }));
    });

    proc.on('close', (code) => {
      client.send(JSON.stringify({ type: 'exit', code }));
    });
  }

  // Register a remote terminal agent
  registerAgent(ws: WebSocket): void {
    this.agent = ws;
    this.logger.log('Remote terminal agent registered');

    ws.on('message', (raw: Buffer) => {
      const msg = JSON.parse(raw.toString());
      // Forward agent output to all browser clients
      this.server.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(msg));
        }
      });
    });

    ws.on('close', () => {
      this.agent = null;
      this.logger.log('Remote terminal agent disconnected');
    });
  }
}
