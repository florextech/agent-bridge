# Agent Bridge Codex Plugin (Local)

This local plugin provides a reusable base to connect coding workflows with Agent Bridge.

## Included

- Manifest: `.codex-plugin/plugin.json`
- Marketplace registration: `.agents/plugins/marketplace.json`
- Utility script: `scripts/agent_setup.sh`
- Starter skill doc: `skills/agent-bridge-workflow.md`
- Placeholder config files: `hooks.json`, `.mcp.json`, `.app.json`
- Placeholder assets directory: `assets/` (add `icon.png` and `logo.png` before publishing)

## Quick use

```bash
AGENT_BRIDGE_API_URL=http://localhost:3001 \
AGENT_BRIDGE_PROJECT_NAME=your-project \
AGENT_BRIDGE_AGENT_NAME=codex \
./scripts/agent_setup.sh create-session
```

Then use the returned session ID:

```bash
./scripts/agent_setup.sh notify <session_id> task_started "Starting task"
./scripts/agent_setup.sh poll-telegram <session_id>
```

## Commands

- `create-session`: create a new Agent Bridge session
- `check-responses <session_id>`: list unread/read responses
- `mark-read <session_id>`: mark responses as read
- `notify <session_id> <event_type> <summary>`: send session event
- `poll-telegram <session_id>`: polling loop for Telegram instructions
- `poll-telegram-exec <session_id>`: polling loop that can execute instructions

## Requirements

- `curl` for API requests
- `jq` for polling commands (`poll-telegram`, `poll-telegram-exec`)

## Security note

`poll-telegram-exec` can execute commands received from Telegram. Use it only in trusted sessions/projects.
