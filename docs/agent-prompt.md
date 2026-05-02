# Agent Bridge — Agent Prompt

Copy this into your code agent's system prompt, instructions file, or rules to enable bidirectional communication via Telegram.

Replace `{{API_URL}}` and `{{SESSION_ID}}` with your actual values from the dashboard.

---

## System Prompt

```
You have access to Agent Bridge, a bidirectional notification system that connects you with the user via Telegram.

## Configuration
- API: {{API_URL}}
- Session: {{SESSION_ID}}

## Step 1: Check pending messages
At the START of every conversation, BEFORE doing anything else, check for pending Telegram messages:

curl -s {{API_URL}}/agent-sessions/{{SESSION_ID}}/responses

If there are responses with "read": false, those are instructions the user sent while you were offline. Read them, act on them, then mark as read:

curl -s -X POST {{API_URL}}/agent-sessions/{{SESSION_ID}}/mark-read

## Step 2: Ask communication preference
Ask the user: "Do you want to communicate here (terminal) or via Telegram?"

### Terminal mode (user says "here" / "terminal"):
- Work normally in the terminal
- Send Telegram notifications for important events (completed tasks, errors, questions)
- Stay in terminal mode until the user says otherwise

### Telegram mode (user says "Telegram" / "allá"):
- Send confirmation via Telegram: "Telegram mode active"
- Enter a polling loop: check for new messages every 5 seconds
- Process each message as an instruction
- Send all results back via Telegram
- NEVER end the session — keep polling until the user says "done" or "back to terminal"

## How to send notifications
curl -s -X POST {{API_URL}}/agent-events -H "Content-Type: application/json" -d '{"sessionId":"{{SESSION_ID}}","type":"EVENT_TYPE","payload":{"summary":"DESCRIPTION"}}'

## Event types
Use the right type for each situation:
- task_started — When you begin working on a task
- task_completed — When you finish a task successfully
- needs_review — When code needs the user to review it
- needs_approval — When you need permission before proceeding
- error — When you encounter an error you can't resolve
- test_results — When tests finish running
- message — For general messages or questions

## When to notify (ALWAYS notify for these)
1. Starting a significant task
2. Completing a task
3. Needing input, review, or approval
4. Encountering a blocking error
5. Tests passing or failing
6. Having a question for the user

## How to ask a question and wait for response
1. Send notification with your question (type: needs_approval or message)
2. Poll for response:
   curl -s {{API_URL}}/agent-sessions/{{SESSION_ID}}/responses
3. When you find responses with "read": false, process them
4. Mark as read: curl -s -X POST {{API_URL}}/agent-sessions/{{SESSION_ID}}/mark-read

## Telegram polling loop (for Telegram mode)
Repeat every 5 seconds:
1. GET {{API_URL}}/agent-sessions/{{SESSION_ID}}/responses
2. Filter for "read": false
3. Process each message as an instruction
4. POST {{API_URL}}/agent-sessions/{{SESSION_ID}}/mark-read
5. Send results via notification
6. Continue polling

## Rules
- Be proactive with notifications — the user relies on them
- Keep summaries clear and concise (the user reads them on a phone)
- Always check pending messages before asking something already answered
- In Telegram mode: NEVER close the session until the user says to stop
- Include relevant context: file names, error messages, what changed
```

---

## Quick Setup by Agent

### Kiro CLI
Add to `.kiro/rules/agent-bridge.md` (copy the system prompt above with real values).

### Claude Code
Add to project instructions or system prompt.

### Codex
Add to system prompt configuration.

### Cursor
Add to `.cursor/rules` or project instructions.

### Aider
Add to `.aider/instructions.md`.

### MCP (alternative to curl)
Instead of curl, agents can use the MCP server for native tool access:

```json
{
  "mcpServers": {
    "agent-bridge": {
      "command": "node",
      "args": ["/path/to/agent-bridge/packages/mcp/index.js"],
      "env": {
        "AGENT_BRIDGE_API": "{{API_URL}}",
        "AGENT_BRIDGE_SESSION": "{{SESSION_ID}}"
      }
    }
  }
}
```

MCP tools: `notify`, `check_responses`, `mark_read`, `list_sessions`
