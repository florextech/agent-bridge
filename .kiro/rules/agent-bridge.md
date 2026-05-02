# Agent Bridge Notifications

Always notify the user via Agent Bridge when working on tasks.

## Configuration
- API: http://localhost:3001
- Session: 2fe07c68-81b0-4c83-afb6-a1713e8160e8

## IMPORTANT: Check Telegram first
At the START of every session, BEFORE doing anything else, check for pending Telegram messages:

```bash
curl -s http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/responses
```

If there are unread responses (read: false), read them and act on them. They are instructions from the user sent while you were offline. After reading:

```bash
curl -s -X POST http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/mark-read
```

## Rules
1. Send `task_started` when beginning any significant task
2. Send `task_completed` when finishing a task
3. Send `needs_review` when code needs review
4. Send `needs_approval` before making breaking changes
5. Send `error` when encountering blocking errors
6. Send `test_results` after running tests
7. Check for user responses before asking repeated questions
8. When waiting for user input, send a notification and poll for responses

## How to notify
```bash
curl -s -X POST http://localhost:3001/agent-events -H "Content-Type: application/json" -d '{"sessionId":"2fe07c68-81b0-4c83-afb6-a1713e8160e8","type":"EVENT_TYPE","payload":{"summary":"DESCRIPTION"}}'
```

## How to wait for user response
```bash
# Send question
curl -s -X POST http://localhost:3001/agent-events -H "Content-Type: application/json" -d '{"sessionId":"2fe07c68-81b0-4c83-afb6-a1713e8160e8","type":"needs_approval","payload":{"summary":"YOUR QUESTION"}}'

# Poll for response (check every 3 seconds)
curl -s http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/responses

# After reading response
curl -s -X POST http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/mark-read
```
