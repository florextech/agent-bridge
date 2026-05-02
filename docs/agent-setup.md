# Agent Bridge — Integration Guide for Code Agents

Use this document to integrate Agent Bridge into any code agent (Codex, Claude, Cursor, Aider, etc.). Give this URL to your agent and tell it to follow the instructions.

## Setup (agent does this automatically)

The agent only needs the **API base URL** (e.g. `http://localhost:3001`). Everything else is automated.

### Step 1: Create a session

```bash
curl -s -X POST {API_URL}/agent-sessions \
  -H "Content-Type: application/json" \
  -d '{"projectName":"PROJECT_NAME","agentName":"AGENT_NAME","channelType":"telegram","channelConfig":{}}'
```

- `PROJECT_NAME`: name of the current project/repo
- `AGENT_NAME`: name of the agent (codex, claude, kiro, etc.)
- Save the `id` from the response — this is the `SESSION_ID`

### Step 2: Check for pending messages

```bash
curl -s {API_URL}/agent-sessions/{SESSION_ID}/responses
```

If there are responses with `"read": false`, those are instructions from the user. Process them, then mark as read:

```bash
curl -s -X POST {API_URL}/agent-sessions/{SESSION_ID}/mark-read -H "Content-Type: application/json"
```

### Step 3: Ask communication preference

Ask the user: **"Do you want to communicate here (terminal) or via Telegram?"**

- **Terminal mode**: Work normally. Send Telegram notifications for important events.
- **Telegram mode**: Enter polling loop. Check for messages every 5 seconds. Process each as an instruction. Never end the session until the user says "done".

## Sending notifications

```bash
curl -s -X POST {API_URL}/agent-events \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"{SESSION_ID}","type":"EVENT_TYPE","payload":{"summary":"DESCRIPTION"}}'
```

### Event types

| Type | When to use |
|---|---|
| `task_started` | Beginning a task |
| `task_completed` | Task finished successfully |
| `needs_review` | Code needs the user to review |
| `needs_approval` | Need permission before proceeding |
| `error` | Encountered a blocking error |
| `test_results` | Tests finished running |
| `message` | General message or question |

## Reading user responses

The user can respond via Telegram. Check for responses:

```bash
curl -s {API_URL}/agent-sessions/{SESSION_ID}/responses
```

Response format:
```json
[
  {
    "id": "uuid",
    "content": "user's message",
    "author": "Cristian",
    "read": false,
    "createdAt": "2026-05-02T..."
  }
]
```

After processing, mark as read:

```bash
curl -s -X POST {API_URL}/agent-sessions/{SESSION_ID}/mark-read -H "Content-Type: application/json"
```

## Telegram polling loop (for Telegram mode)

When the user chooses Telegram mode, repeat this every 5 seconds:

1. `GET {API_URL}/agent-sessions/{SESSION_ID}/responses`
2. Filter for `"read": false`
3. Process each message as an instruction
4. `POST {API_URL}/agent-sessions/{SESSION_ID}/mark-read`
5. Send results back via notification
6. Continue polling — **never exit** until user says "done" or "back to terminal"

## Session management

### List all sessions
```bash
curl -s {API_URL}/agent-sessions
```

### Get session details
```bash
curl -s {API_URL}/agent-sessions/{SESSION_ID}
```

### Delete a session
```bash
curl -s -X DELETE {API_URL}/agent-sessions/{SESSION_ID}
```

## Rules for the agent

1. **Always notify** — Send `task_started` before work, `task_completed` after
2. **Acknowledge immediately** — When receiving a Telegram message, confirm receipt before processing
3. **Never go silent** — If a task takes time, send progress updates
4. **Check before asking** — Always check pending messages before asking a question
5. **Keep it concise** — User reads on phone, keep summaries short
6. **In Telegram mode** — Never close the session, keep polling
7. **Ask "anything else?"** — After completing a task, always ask

## Quick start prompt for any agent

Give this to your agent:

```
Integrate with Agent Bridge for Telegram notifications.
API URL: http://localhost:3001

1. Create a session: POST /agent-sessions with projectName and agentName
2. Save the session ID
3. Check for pending messages: GET /agent-sessions/{id}/responses
4. Ask me: terminal or Telegram mode?
5. Start notifying me for every task you do

Full docs: https://github.com/florextech/agent-bridge/blob/main/docs/agent-setup.md
```
