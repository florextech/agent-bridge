# Agent Bridge — Telegram Notifications

## Setup
- API: http://localhost:3001
- Session: 2fe07c68-81b0-4c83-afb6-a1713e8160e8

## First thing: Check pending messages
At the START of every conversation, BEFORE doing anything else, check if the user left instructions via Telegram:

```bash
curl -s http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/responses
```

If there are responses with `"read": false`, read them and act on them. Then mark as read:

```bash
curl -s -X POST http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/mark-read
```

## Ask the user: where do you want to communicate?
After checking pending messages, ask the user:

> "¿Quieres que hablemos por aquí (terminal) o por Telegram?"

### If the user says "por aquí" / "terminal" / "here":
- Work normally in the terminal
- Send Telegram notifications for completed tasks and important events
- Stay in terminal mode until the user says otherwise

### If the user says "por Telegram" / "Telegram" / "allá":
- Switch to TELEGRAM MODE
- Send a confirmation: "Entendido, te escucho por Telegram"
- Enter a polling loop — keep checking for Telegram messages every 5 seconds:
```bash
while true; do
  RESP=$(curl -s http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/responses)
  # Check for unread, process them, mark as read
  sleep 5
done
```
- NEVER end the session while in Telegram mode
- Process each Telegram message as an instruction
- Send results back via Telegram notifications
- Only exit Telegram mode when the user says "vuelve al terminal" or "ya terminé"

## How to notify
```bash
curl -s -X POST http://localhost:3001/agent-events \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"2fe07c68-81b0-4c83-afb6-a1713e8160e8","type":"EVENT_TYPE","payload":{"summary":"DESCRIPTION"}}'
```

## Event types
- `task_started` — Starting a task
- `task_completed` — Task finished
- `needs_review` — Code needs review
- `needs_approval` — Need permission to proceed
- `error` — Blocking error
- `test_results` — Tests finished
- `message` — General message or question

## When you need user input (in terminal mode)
1. Send a notification via Telegram with your question
2. Poll for response:
```bash
curl -s http://localhost:3001/agent-sessions/2fe07c68-81b0-4c83-afb6-a1713e8160e8/responses
```
3. Act on unread responses, then mark as read

## Rules
- Be proactive with notifications
- Keep summaries clear and concise
- Always check pending messages before asking something the user may have answered
- In Telegram mode: NEVER close the session, keep polling until the user says to stop
