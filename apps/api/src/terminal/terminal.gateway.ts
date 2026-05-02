import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, WebSocket } from 'ws';

@WebSocketGateway({ path: '/ws/terminal' })
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TerminalGateway.name);

  @WebSocketServer()
  server!: Server;

  // Map browser client → its paired agent
  private clientToAgent = new Map<WebSocket, WebSocket>();
  private agentToClient = new Map<WebSocket, WebSocket>();
  private pendingClients: WebSocket[] = [];
  private availableAgents: WebSocket[] = [];

  handleConnection(client: WebSocket): void {
    this.logger.log('Browser client connected');
    // Try to pair with an available agent
    const agent = this.availableAgents.shift();
    if (agent && agent.readyState === 1) {
      this.pair(client, agent);
      client.send(JSON.stringify({ type: 'output', data: '\x1b[32m● Connected (remote PTY)\x1b[0m\r\n' }));
    } else {
      this.pendingClients.push(client);
      client.send(JSON.stringify({ type: 'output', data: '\x1b[33m● Waiting for agent...\x1b[0m\r\n' }));
    }
  }

  handleDisconnect(client: WebSocket): void {
    const agent = this.clientToAgent.get(client);
    if (agent) {
      this.clientToAgent.delete(client);
      this.agentToClient.delete(agent);
      // Return agent to pool
      if (agent.readyState === 1) this.availableAgents.push(agent);
    }
    this.pendingClients = this.pendingClients.filter((c) => c !== client);
  }

  @SubscribeMessage('input')
  handleInput(client: WebSocket, payload: string): void {
    const agent = this.clientToAgent.get(client);
    if (agent && agent.readyState === 1) {
      agent.send(JSON.stringify({ event: 'input', data: payload }));
    }
  }

  @SubscribeMessage('exec')
  handleExec(client: WebSocket, payload: string): void {
    const agent = this.clientToAgent.get(client);
    if (agent && agent.readyState === 1) {
      agent.send(JSON.stringify({ event: 'exec', data: payload }));
    }
  }

  @SubscribeMessage('resize')
  handleResize(client: WebSocket, payload: string | { cols: number; rows: number }): void {
    const data = typeof payload === 'string' ? JSON.parse(payload) as { cols: number; rows: number } : payload;
    const agent = this.clientToAgent.get(client);
    if (agent && agent.readyState === 1 && data?.cols && data?.rows) {
      agent.send(JSON.stringify({ event: 'resize', cols: data.cols, rows: data.rows }));
    }
  }

  registerAgent(ws: WebSocket): void {
    this.logger.log('Terminal agent registered');

    // Pair with a pending client or add to pool
    const client = this.pendingClients.shift();
    if (client && client.readyState === 1) {
      this.pair(client, ws);
      client.send(JSON.stringify({ type: 'output', data: '\x1b[32m● Agent connected\x1b[0m\r\n' }));
    } else {
      this.availableAgents.push(ws);
    }

    ws.on('close', () => {
      this.logger.log('Terminal agent disconnected');
      const pairedClient = this.agentToClient.get(ws);
      if (pairedClient) {
        this.clientToAgent.delete(pairedClient);
        this.agentToClient.delete(ws);
        if (pairedClient.readyState === 1) {
          pairedClient.send(JSON.stringify({ type: 'output', data: '\r\n\x1b[31m● Agent disconnected\x1b[0m\r\n' }));
        }
      }
      this.availableAgents = this.availableAgents.filter((a) => a !== ws);
    });
  }

  private pair(client: WebSocket, agent: WebSocket): void {
    this.clientToAgent.set(client, agent);
    this.agentToClient.set(agent, client);

    // Forward agent output only to its paired client
    agent.on('message', (raw: Buffer) => {
      if (client.readyState === 1) {
        client.send(raw.toString());
      }
    });
  }
}
