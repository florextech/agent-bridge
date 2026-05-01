# Agent Bridge

Multi-channel platform to connect code agents (Codex, Copilot, etc.) with messaging channels (Telegram, WhatsApp, Discord, Slack).

Get notified when your agent completes a task, needs review, hits an error, or needs your input — directly in your preferred messaging app.

## Architecture

```
agent-bridge/
├── apps/
│   ├── api/          # NestJS backend — events, sessions, providers
│   └── web/          # Next.js frontend — dashboard, timeline, settings
├── packages/
│   ├── core/         # Shared types, enums, DTOs, provider interface
│   └── sdk/          # TypeScript client for sending events
```

### Design decisions

- **Provider abstraction**: `MessagingProvider` interface in `packages/core` — Telegram is the first implementation, but WhatsApp/Discord/Slack can be added without touching core logic.
- **SQLite for MVP**: Zero-config database via `better-sqlite3`. Swap to PostgreSQL when needed.
- **Monorepo with pnpm workspaces**: Shared types between API, web, and SDK with no duplication.
- **TypeScript strict mode**: `noUncheckedIndexedAccess`, no `any`.

## Supported events

| Event | Description |
|---|---|
| `task_started` | Agent began working on a task |
| `task_completed` | Agent finished a task |
| `needs_review` | Agent needs code review |
| `needs_approval` | Agent needs approval to proceed |
| `error` | Agent encountered an error |
| `test_results` | Test run completed |
| `message` | General message |

## Quick start

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Setup

```bash
git clone <repo-url> && cd agent-bridge
cp .env.example .env
pnpm install
pnpm -r build
```

### Run locally

```bash
# Terminal 1 — API on :3001
pnpm dev:api

# Terminal 2 — Web on :3000
pnpm dev:web
```

### Docker

```bash
docker compose up
```

## Usage

### 1. Create a session

```bash
curl -X POST http://localhost:3001/agent-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-project",
    "agentName": "codex",
    "channelType": "telegram",
    "channelConfig": {
      "botToken": "YOUR_BOT_TOKEN",
      "chatId": "YOUR_CHAT_ID"
    }
  }'
```

### 2. Send an event

```bash
curl -X POST http://localhost:3001/agent-events \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "type": "task_completed",
    "payload": { "summary": "Refactored auth module" }
  }'
```

### 3. Using the SDK

```typescript
import { AgentBridgeClient } from '@agent-bridge/sdk';
import { AgentEventType } from '@agent-bridge/core';

const bridge = new AgentBridgeClient({
  baseUrl: 'http://localhost:3001',
});

await bridge.sendEvent({
  sessionId: 'SESSION_ID',
  type: AgentEventType.TaskCompleted,
  payload: { summary: 'Refactored auth module' },
});

const responses = await bridge.getResponses('SESSION_ID');
await bridge.markRead('SESSION_ID');
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/agent-sessions` | Create a session |
| `GET` | `/agent-sessions` | List all sessions |
| `GET` | `/agent-sessions/:id` | Get session details |
| `POST` | `/agent-events` | Send an agent event |
| `GET` | `/agent-sessions/:id/responses` | Get channel responses |
| `POST` | `/agent-sessions/:id/mark-read` | Mark responses as read |

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `3001` |
| `DB_PATH` | SQLite database path | `./agent-bridge.db` |
| `NEXT_PUBLIC_API_URL` | API URL for the web frontend | `http://localhost:3001` |

## Roadmap

- [ ] WhatsApp provider (Twilio/Cloud API)
- [ ] Discord provider (bot webhooks)
- [ ] Slack provider (Slack API)
- [ ] Webhook support for incoming responses
- [ ] Authentication & API keys
- [ ] Real-time updates via WebSocket
- [ ] Event filtering & notification preferences

## License

MIT
