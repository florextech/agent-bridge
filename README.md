# Agent Bridge

Multi-channel notification platform for code agents. Connect Kiro, Codex, Claude, Gemini, or any CLI agent with Telegram, Email, and more — bidirectional communication so your agents can notify you and you can respond from your phone.

## How it works

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Code Agent  │────▶│  Agent Bridge │────▶│   Telegram   │
│ (Kiro, Codex │◀────│     API      │◀────│   (You)      │
│  Claude...)  │     └──────┬───────┘     └──────────────┘
└─────────────┘            │
                    ┌──────┴───────┐
                    │   Dashboard  │
                    │   (Next.js)  │
                    └──────────────┘
```

1. **Agent sends event** → API receives it → Telegram notifies you
2. **You respond on Telegram** → API stores it → Agent reads it
3. **Dashboard** shows everything: timeline, sessions, settings

## Multiple agents, one bot

A single Telegram bot handles all your agents. Each agent gets its own **session**:

```
┌─────────────────────────────────────────────────┐
│                 Telegram Bot                     │
│                                                  │
│  Session 1: Kiro → agent-bridge project          │
│  Session 2: Codex → my-api project               │
│  Session 3: Claude → docs project                │
│                                                  │
│  All notifications arrive in the same chat.      │
│  Your responses go to the latest active session. │
└─────────────────────────────────────────────────┘
```

Create sessions from the dashboard or via SDK/MCP. Each session has its own timeline, instructions, and event history.

## Communication modes

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Terminal Mode (default)                                 │
│  ├── You work in the terminal with the agent             │
│  ├── Agent sends Telegram notifications for key events   │
│  └── You can respond via Telegram or terminal            │
│                                                          │
│  Telegram Mode                                           │
│  ├── You tell the agent "communicate via Telegram"       │
│  ├── Agent enters polling loop, listens for messages     │
│  ├── You send instructions from your phone               │
│  └── Agent executes and reports back via Telegram        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Architecture

```
agent-bridge/
├── apps/
│   ├── api/              # NestJS + Prisma + PostgreSQL
│   ├── web/              # Next.js + NextAuth + @florexlabs/ui
│   └── terminal-agent.js # PTY agent for web terminal
├── packages/
│   ├── core/             # Shared types, enums, DTOs, MessagingProvider
│   ├── sdk/              # TypeScript client for agents
│   └── mcp/              # MCP server for native agent integration
├── docs/                 # Integration guides and agent prompts
└── .kiro/rules/          # Kiro CLI rules for auto-notifications
```

## Features

- **Bidirectional Telegram** — Send notifications, receive responses via polling
- **Multiple sessions** — One bot, many agents, each with its own session
- **Terminal & Telegram modes** — Work locally or remotely from your phone
- **MCP server** — Native tool integration for Kiro, Claude, Cursor
- **Web terminal** — Remote shell access from the dashboard (PTY)
- **User management** — Invite via email, role-based (admin/member)
- **Auto-linking** — Users send `/start` to the bot and get linked
- **Email notifications** — Via Resend provider
- **Unified timeline** — Agent events + user responses chronologically
- **SDK** — TypeScript client with full API coverage
- **i18n** — English and Spanish
- **FLX Design System** — Dark premium UI with @florexlabs/ui + Phosphor Icons

## Supported events

| Event | When to use |
|---|---|
| `task_started` | Agent begins working on a task |
| `task_completed` | Agent finishes a task |
| `needs_review` | Code needs the user to review it |
| `needs_approval` | Agent needs permission to proceed |
| `error` | Agent encounters a blocking error |
| `test_results` | Tests finish running |
| `message` | General messages or questions |

## Quick start

> **Recommended:** Run Agent Bridge locally on the same machine as your code agents. This keeps everything on the same network, avoids HTTPS requirements for Telegram webhooks, and gives you the lowest latency.

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL (or use Docker)

### Setup

```bash
git clone https://github.com/florextech/agent-bridge.git && cd agent-bridge
cp .env.example .env
# Edit .env: set DATABASE_URL and AUTH_SECRET

docker compose up db -d          # Start PostgreSQL
pnpm install                     # Install dependencies
pnpm -r build                    # Build all packages
cd apps/api && npx prisma db push && cd ../..  # Create tables
```

### Run

```bash
pnpm dev:api    # Terminal 1 → API on :3001
pnpm dev:web    # Terminal 2 → Web on :3000
```

### First time setup

1. Open `http://localhost:3000` → redirects to `/setup`
2. Create your admin account
3. Go to **Settings → Connections** → paste Telegram bot token → **Connect Bot**
4. Share `t.me/your_bot` → users press Start → admin approves
5. Go to **Settings → Sessions** → create a session → copy the agent prompt

### Connect your agent

**Option A: System prompt** — Copy the agent prompt from the session page into your agent's instructions.

**Option B: MCP** — Add to your agent's MCP config:
```json
{
  "mcpServers": {
    "agent-bridge": {
      "command": "node",
      "args": ["./packages/mcp/index.js"],
      "env": {
        "AGENT_BRIDGE_API": "http://localhost:3001",
        "AGENT_BRIDGE_SESSION": "YOUR_SESSION_ID"
      }
    }
  }
}
```

**Option C: SDK** —
```typescript
import { AgentBridgeClient } from '@agent-bridge/sdk';

const bridge = new AgentBridgeClient({ baseUrl: 'http://localhost:3001' });

await bridge.sendEvent({
  sessionId: 'SESSION_ID',
  type: 'task_completed',
  payload: { summary: 'Refactored auth module' },
});

const responses = await bridge.getUnreadResponses('SESSION_ID');
await bridge.markRead('SESSION_ID');
```

### Run tests

```bash
pnpm test                        # 73 unit + e2e tests
cd apps/web && pnpm test:e2e     # Playwright e2e
```

## Deploy with Dokploy

```bash
docker compose -f docker-compose.prod.yml up -d
```

Required: `POSTGRES_PASSWORD`, `AUTH_SECRET`, `AUTH_PASSWORD`
Optional: `TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY`, `NEXT_PUBLIC_API_URL`, `TERMINAL_ENABLED`

## MCP tools

| Tool | Description |
|---|---|
| `notify` | Send notification to user |
| `check_responses` | Check for Telegram responses |
| `mark_read` | Mark responses as read |
| `list_sessions` | List all sessions |
| `create_session` | Create a new session |
| `delete_session` | Delete a session |

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/agent-sessions` | Create session |
| `GET` | `/agent-sessions` | List sessions |
| `GET` | `/agent-sessions/:id` | Get session |
| `DELETE` | `/agent-sessions/:id` | Delete session |
| `POST` | `/agent-events` | Send event |
| `GET` | `/agent-events?sessionId=` | Get events |
| `GET` | `/agent-sessions/:id/responses` | Get responses |
| `POST` | `/agent-sessions/:id/mark-read` | Mark read |
| `POST` | `/telegram/setup` | Connect bot |
| `GET` | `/telegram/users` | List Telegram users |
| `GET` | `/docs` | Swagger API docs |

Full Swagger docs at `http://localhost:3001/docs`

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | ✅ |
| `AUTH_SECRET` | NextAuth secret | ✅ |
| `PORT` | API port (default: 3001) | |
| `TELEGRAM_BOT_TOKEN` | Auto-start polling | |
| `RESEND_API_KEY` | Email via Resend | |
| `TERMINAL_ENABLED` | Enable web terminal | |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | |

## Tech stack

- **API**: NestJS, Prisma, PostgreSQL, WebSocket
- **Web**: Next.js 15, NextAuth v5, @florexlabs/ui, Phosphor Icons, Tailwind CSS v4, TanStack Query, xterm.js
- **SDK**: TypeScript, fetch API
- **MCP**: Model Context Protocol server
- **Tests**: Vitest (73 tests) + Playwright e2e
- **Infra**: Docker Compose, Dokploy-ready, GitHub Actions CI

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT — [Florex Labs](https://github.com/florextech)
