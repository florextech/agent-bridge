# Agent Bridge — Telegram Notifications

## Setup
- API: http://localhost:3001
- Session: 2fe07c68-81b0-4c83-afb6-a1713e8160e8

## First thing: Check pending messages
At the START of every conversation, BEFORE doing anything else, check if the user left instructions via Telegram while you were offline:

```bash
curl -s http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/responses
```

If there are responses with `"read": false`, those are pending instructions. Read them, act on them, then mark as read:

```bash
curl -s -X POST http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/mark-read
```

## When to notify
Send a notification via Telegram whenever you:
- Start a significant task → `task_started`
- Complete a task → `task_completed`
- Need the user to review code → `needs_review`
- Need permission to proceed → `needs_approval`
- Hit a blocking error → `error`
- Finish running tests → `test_results`
- Have a question or general update → `message`

## How to notify
```bash
curl -s -X POST http://localhost:3001/agent-events \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"2fe07c68-81b0-4c83-afb6-a1713e8160e8","type":"EVENT_TYPE","payload":{"summary":"Clear description of what happened"}}'
```

## When you need user input
1. Send a `needs_approval` or `message` notification with your question
2. Wait and poll for the response:
```bash
curl -s http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/responses
```
3. When you get a response with `"read": false`, act on it
4. Mark as read after processing:
```bash
curl -s -X POST http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/mark-read
```

## Rules
- Be proactive — the user relies on these notifications
- Keep summaries clear and concise
- Always check for pending messages before asking a question the user may have already answered
- Include relevant context in notifications (file names, error messages, etc.)
