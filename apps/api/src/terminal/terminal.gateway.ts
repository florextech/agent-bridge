import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import type { Server, WebSocket } from 'ws';

@WebSocketGateway({ path: '/ws/terminal' })
export class TerminalGateway implements OnGatewayConnection {
  private readonly logger = new Logger(TerminalGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: WebSocket): void {
    this.logger.log('Terminal client connected');
    client.send(JSON.stringify({ type: 'output', data: '$ Connected to Agent Bridge terminal\r\n' }));
  }

  @SubscribeMessage('exec')
  handleExec(client: WebSocket, payload: string): void {
    const cmd = typeof payload === 'string' ? payload : String(payload);
    if (!cmd.trim()) return;

    this.logger.log(`Exec: ${cmd}`);

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
}
