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
  private browserClients = new Set<WebSocket>();

  handleConnection(client: WebSocket): void {
    this.browserClients.add(client);
    const mode = this.agent ? 'remote agent (PTY)' : 'local';
    client.send(JSON.stringify({ type: 'output', data: `● Connected (${mode})\r\n` }));
  }

  handleDisconnect(client: WebSocket): void {
    this.browserClients.delete(client);
  }

  @SubscribeMessage('exec')
  handleExec(client: WebSocket, payload: string): void {
    const cmd = typeof payload === 'string' ? payload : String(payload);
    if (!cmd.trim()) return;

    if (this.agent && this.agent.readyState === 1) {
      // Forward to remote agent — it has a real PTY
      this.agent.send(JSON.stringify({ event: 'exec', data: cmd }));
      return;
    }

    // Fallback: local execution
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

  registerAgent(ws: WebSocket): void {
    this.agent = ws;
    this.logger.log('Remote terminal agent (PTY) registered');

    // Notify browsers
    this.browserClients.forEach((c) => {
      if (c.readyState === 1) c.send(JSON.stringify({ type: 'output', data: '● Remote agent connected (PTY)\r\n' }));
    });

    ws.on('message', (raw: Buffer) => {
      const msg = JSON.parse(raw.toString());
      // Forward agent output to all browser clients
      this.browserClients.forEach((client) => {
        if (client.readyState === 1) client.send(JSON.stringify(msg));
      });
    });

    ws.on('close', () => {
      this.agent = null;
      this.logger.log('Remote terminal agent disconnected');
      this.browserClients.forEach((c) => {
        if (c.readyState === 1) c.send(JSON.stringify({ type: 'output', data: '\r\n● Remote agent disconnected\r\n' }));
      });
    });
  }
}
