# Integration Guide

## Install SDK

```bash
pnpm add @agent-bridge/sdk @agent-bridge/core
```

## TypeScript SDK

```typescript
import { AgentBridgeClient } from '@agent-bridge/sdk';
import { AgentEventType } from '@agent-bridge/core';

const bridge = new AgentBridgeClient({
  baseUrl: 'http://localhost:3001',
});

// Send a task completion event
await bridge.sendEvent({
  sessionId: 'SESSION_ID',
  type: AgentEventType.TaskCompleted,
  payload: { summary: 'Refactored auth module' },
});

// Check for responses from the user
const responses = await bridge.getResponses('SESSION_ID');
console.log(responses);

// Mark all responses as read
await bridge.markRead('SESSION_ID');
```

## curl Examples

### Create Session

```bash
curl -X POST http://localhost:3001/agent-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-project",
    "agentName": "codex",
    "channelType": "telegram",
    "channelConfig": { "botToken": "YOUR_BOT_TOKEN" }
  }'
```

### Send Event

```bash
curl -X POST http://localhost:3001/agent-events \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "type": "task_completed",
    "payload": { "summary": "Describe what happened" }
  }'
```

### Get Responses

```bash
curl http://localhost:3001/agent-sessions/SESSION_ID/responses
```

### Mark Read

```bash
curl -X POST http://localhost:3001/agent-sessions/SESSION_ID/mark-read
```

## Event Types

| Type | When to use |
|---|---|
| `task_started` | Agent began working on a task |
| `task_completed` | Agent finished a task |
| `needs_review` | Agent needs code review |
| `needs_approval` | Agent needs approval to proceed |
| `error` | Agent encountered an error |
| `test_results` | Test run completed |
| `message` | General message |

## Agent System Prompt

Paste this into your agent's system prompt:

```
You have access to Agent Bridge for notifications.
Session ID: <SESSION_ID>
API: http://localhost:3001

When you complete a task, need review, need approval, hit an error, or finish tests, notify me:

curl -X POST http://localhost:3001/agent-events -H "Content-Type: application/json" -d '{"sessionId":"<SESSION_ID>","type":"TYPE","payload":{"summary":"DESCRIPTION"}}'

Event types: task_started, task_completed, needs_review, needs_approval, error, test_results, message

To check if I responded: curl http://localhost:3001/agent-sessions/<SESSION_ID>/responses
After reading: curl -X POST http://localhost:3001/agent-sessions/<SESSION_ID>/mark-read
```

## Runner (Autonomous Polling)

```bash
# Poll every 5s, re-invoke agent on response
node apps/runner.js --session <ID> --command "kiro chat"

# Just poll and print
node apps/runner.js --session <ID>

# Single poll (for cron)
node apps/runner.js --session <ID> --once
```

## API Reference

Full Swagger docs available at `http://localhost:3001/docs` when the API is running.

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
| `POST` | `/users/setup` | Create first admin account |
| `POST` | `/users/login` | Authenticate |
| `POST` | `/users/invite` | Send email invitation |
| `GET` | `/users` | List users |
