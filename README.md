# Agent Bridge

Multi-channel platform to connect code agents (Codex, Kiro, Cursor, etc.) with messaging channels. Get notified on Telegram or email when your agent completes a task, needs review, hits an error, or needs your input — and respond directly from the channel.

## Architecture

```
agent-bridge/
├── apps/
│   ├── api/          # NestJS + Prisma + PostgreSQL
│   ├── web/          # Next.js + NextAuth + @florexlabs/ui
│   └── runner.js     # Autonomous polling script
├── packages/
│   ├── core/         # Shared types, enums, DTOs, MessagingProvider interface
│   └── sdk/          # TypeScript client for sending events
```

## Features

- **Bidirectional Telegram** — Send notifications, receive responses via polling
- **Email notifications** — Via Resend provider
- **Auto-linking** — Users send `/start` to the bot and get linked automatically
- **User management** — Invite users via email (like Dokploy), role-based (admin/member)
- **Auth** — NextAuth with credentials, first-time setup flow
- **Unified timeline** — Agent events and user responses in chronological order
- **SDK** — TypeScript client for any agent to integrate
- **Runner** — Autonomous script that polls responses and re-invokes agents
- **FLX Design System** — Dark premium UI with @florexlabs/ui + Phosphor Icons

## Supported events

| Event | Description |
|---|---|
| `task_started` | Agent began working |
| `task_completed` | Agent finished a task |
| `needs_review` | Agent needs code review |
| `needs_approval` | Agent needs approval to proceed |
| `error` | Agent encountered an error |
| `test_results` | Test run completed |
| `message` | General message |

## Quick start

> **Recommended:** Run Agent Bridge locally on the same machine as your code agents. This keeps everything on the same network, avoids HTTPS requirements for Telegram webhooks, and gives you the lowest latency for notifications.

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL (or use Docker)

### Setup

```bash
git clone <repo-url> && cd agent-bridge
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# Start PostgreSQL
docker compose up db -d

# Install and build
pnpm install
pnpm -r build

# Push schema to database
cd apps/api && npx prisma db push && cd ../..
```

### Run locally

```bash
# Terminal 1 — API on :3001
pnpm dev:api

# Terminal 2 — Web on :3000
pnpm dev:web
```

### First time

1. Open `http://localhost:3000`
2. You'll be redirected to `/setup` — create your admin account
3. Go to **Settings** → paste your Telegram bot token → **Connect Bot**
4. Share the `t.me/your_bot` link → users press Start to auto-link
5. Create a session → copy the **Agent System Prompt** into your agent

### Run tests

```bash
pnpm test
```

## Deploy with Dokploy

Use `docker-compose.prod.yml`:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Required env vars:
- `POSTGRES_PASSWORD` — Database password
- `AUTH_SECRET` — NextAuth secret (generate with `openssl rand -base64 32`)
- `AUTH_PASSWORD` — Initial admin password

Optional:
- `TELEGRAM_BOT_TOKEN` — Auto-start Telegram polling
- `RESEND_API_KEY` — Email notifications and invitations
- `RESEND_FROM` — Sender email address
- `NEXT_PUBLIC_API_URL` — API URL for the web frontend

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/agent-sessions` | Create a session |
| `GET` | `/agent-sessions` | List all sessions |
| `GET` | `/agent-sessions/:id` | Get session details |
| `DELETE` | `/agent-sessions/:id` | Delete session |
| `POST` | `/agent-events` | Send an agent event |
| `GET` | `/agent-events?sessionId=` | Get events for a session |
| `GET` | `/agent-sessions/:id/responses` | Get channel responses |
| `POST` | `/agent-sessions/:id/mark-read` | Mark responses as read |
| `POST` | `/telegram/setup` | Connect Telegram bot |
| `GET` | `/telegram/users` | List linked Telegram users |
| `POST` | `/telegram/users/:chatId/authorize` | Toggle user authorization |
| `POST` | `/users/setup` | Create first admin account |
| `POST` | `/users/login` | Authenticate |
| `POST` | `/users/invite` | Send email invitation |
| `POST` | `/users/accept-invite` | Accept invitation |
| `GET` | `/users` | List users |

## SDK usage

```typescript
import { AgentBridgeClient } from '@agent-bridge/sdk';
import { AgentEventType } from '@agent-bridge/core';

const bridge = new AgentBridgeClient({ baseUrl: 'http://localhost:3001' });

await bridge.sendEvent({
  sessionId: 'SESSION_ID',
  type: AgentEventType.TaskCompleted,
  payload: { summary: 'Refactored auth module' },
});

const responses = await bridge.getResponses('SESSION_ID');
await bridge.markRead('SESSION_ID');
```

## Runner (autonomous polling)

```bash
# Poll every 5s, re-invoke agent on response
node apps/runner.js --session <ID> --command "kiro chat"

# Just poll and print
node apps/runner.js --session <ID>

# Single poll (for cron)
node apps/runner.js --session <ID> --once
```

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `AUTH_SECRET` | NextAuth secret | ✅ |
| `PORT` | API port (default: 3001) | |
| `TELEGRAM_BOT_TOKEN` | Auto-start Telegram polling | |
| `RESEND_API_KEY` | Email via Resend | |
| `RESEND_FROM` | Sender email | |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | |

## Tech stack

- **API**: NestJS, Prisma, PostgreSQL
- **Web**: Next.js 15 App Router, NextAuth v5, @florexlabs/ui, Phosphor Icons, Tailwind CSS v4
- **SDK**: TypeScript, fetch API
- **Email**: Resend, React Email
- **Tests**: Vitest (33 tests)
- **Infra**: Docker Compose, Dokploy-ready

## License

MIT
