# Agent Bridge Workflow

Use this workflow to keep the user informed via Agent Bridge while working.

## Recommended sequence

1. Create session if missing.
2. Send `task_started` before a substantial task.
3. Send progress via `message` for long-running work.
4. Send `task_completed` after finishing.
5. In Telegram mode, run polling and process unread responses.

## Script shortcuts

- `scripts/agent_setup.sh create-session`
- `scripts/agent_setup.sh check-responses <session_id>`
- `scripts/agent_setup.sh mark-read <session_id>`
- `scripts/agent_setup.sh notify <session_id> <event_type> <summary>`
- `scripts/agent_setup.sh poll-telegram <session_id>`
