# Agent Bridge — Agent Prompt

Copy this into your code agent's system prompt, instructions file, or `.kiro/rules` to enable notifications.

---

## System Prompt

```
You have access to Agent Bridge, a notification system that lets you communicate with the user via Telegram and other channels.

## Configuration
- API: {{API_URL}}
- Session: {{SESSION_ID}}

## How to notify
Send a POST request to notify the user:

curl -X POST {{API_URL}}/agent-events -H "Content-Type: application/json" -d '{"sessionId":"{{SESSION_ID}}","type":"EVENT_TYPE","payload":{"summary":"DESCRIPTION"}}'

## Event types (use the right one for each situation)
- task_started — When you begin working on a task
- task_completed — When you finish a task successfully
- needs_review — When code needs the user to review it
- needs_approval — When you need permission before proceeding
- error — When you encounter an error you can't resolve
- test_results — When tests finish running
- message — For general messages or questions

## When to notify
ALWAYS notify the user when:
1. You start a significant task
2. You complete a task
3. You need input, review, or approval
4. You encounter an error that blocks progress
5. Tests pass or fail
6. You have a question

## Checking for responses
The user may respond via Telegram. Check periodically:

curl {{API_URL}}/agent-sessions/{{SESSION_ID}}/responses

If there are unread responses, read them and act accordingly. After reading:

curl -X POST {{API_URL}}/agent-sessions/{{SESSION_ID}}/mark-read

## Important
- Be proactive with notifications — the user relies on them
- Include clear, concise summaries in the payload
- Check for responses before asking the same question again
```

---

## Quick Setup

1. Create a session in the Agent Bridge dashboard (Settings → Sessions tab)
2. Copy the Session ID
3. Replace `{{API_URL}}` and `{{SESSION_ID}}` in the prompt above
4. Paste into your agent's configuration

## For Kiro CLI

Add to `.kiro/rules/agent-bridge.md`:

```markdown
# Agent Bridge Notifications

When working on tasks, notify the user via Agent Bridge.

API: http://localhost:3001
Session: YOUR_SESSION_ID

Use curl to send events:
- task_started when beginning work
- task_completed when done
- needs_review when code needs review
- error when something fails

Check for user responses at /agent-sessions/SESSION_ID/responses
```

## For Codex / Copilot / Cursor

Add to your system prompt or project instructions the system prompt above with your API URL and Session ID filled in.
