# Agent Bridge Codex Plugin (Local)

This guide explains how to install and use the local `agent-bridge` plugin with Codex.

## How it works

The plugin provides two integration methods:

1. **MCP tools (recommended)** — Native tool integration. Codex calls `notify`, `check_responses`, `wait_for_response`, etc. directly. The `wait_for_response` tool handles polling internally and blocks until the user responds, solving the bidirectional communication problem.

2. **Bash scripts (fallback)** — Shell commands via `agent_setup.sh` for environments without MCP support.

## 1. Create plugin scaffold (repo-local)

From repo root:

```bash
# Option A: if plugin-creator skill is already available in your Codex session, use it directly.
# Option B: run the scaffold script from your Codex home (replace <codex-home>).
python3 <codex-home>/skills/.system/plugin-creator/scripts/create_basic_plugin.py agent-bridge \
  --path ./plugins \
  --marketplace-path ./.agents/plugins/marketplace.json \
  --with-marketplace --with-scripts --with-assets
```

## 2. Install plugin globally (home-local)

Copy plugin to home plugins directory:

```bash
mkdir -p ~/plugins
cp -R ./plugins/agent-bridge ~/plugins/agent-bridge
```

Create or update home marketplace:

```bash
mkdir -p ~/.agents/plugins
```

`~/.agents/plugins/marketplace.json`:

```json
{
  "name": "local-marketplace",
  "interface": {
    "displayName": "Local Plugin Marketplace"
  },
  "plugins": [
    {
      "name": "agent-bridge",
      "source": {
        "source": "local",
        "path": "./plugins/agent-bridge"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

Important: for the home marketplace above, the plugin folder must exist at `~/plugins/agent-bridge`.

## 3. Restart Codex

Restart Codex Desktop so it reloads `~/.agents/plugins/marketplace.json`.

## 4. Session commands

Use script:

`~/plugins/agent-bridge/scripts/agent_setup.sh`

Create session:

```bash
AGENT_BRIDGE_API_URL=http://localhost:3001 \
AGENT_BRIDGE_PROJECT_NAME=your-project \
AGENT_BRIDGE_AGENT_NAME=codex \
~/plugins/agent-bridge/scripts/agent_setup.sh create-session
```

Send event:

```bash
~/plugins/agent-bridge/scripts/agent_setup.sh notify <session_id> task_started "Starting task"
```

Read responses:

```bash
~/plugins/agent-bridge/scripts/agent_setup.sh check-responses <session_id>
```

Mark read:

```bash
~/plugins/agent-bridge/scripts/agent_setup.sh mark-read <session_id>
```

Telegram polling mode:

```bash
~/plugins/agent-bridge/scripts/agent_setup.sh poll-telegram <session_id>
```

Polling stops when a message contains `done` or `back to terminal`.

Telegram polling + execution mode:

```bash
~/plugins/agent-bridge/scripts/agent_setup.sh poll-telegram-exec <session_id>
```

Supported message patterns in execution mode:

- Natural language instruction: forwarded to Codex CLI execution.
- `sh: <command>` or `cmd: <command>`: runs shell command.
- `mode: telegram|terminal|hybrid`: changes runtime mode.

Environment variables (optional):

- `AGENT_BRIDGE_EXEC_TIMEOUT` (default: `180`) for shell execution timeout.
- `AGENT_BRIDGE_STATE_DIR` (default: `~/.agent-bridge`) for mode persistence.
- `AGENT_BRIDGE_WORKDIR` (default: current directory) as execution working directory.

Requirements:

- `curl` (all commands)
- `jq` (polling commands)

Security note:

`poll-telegram-exec` runs instructions received via Telegram. Use only with trusted users/chats.

## 5. Troubleshooting

- Install button does nothing:
  - Verify marketplace path is exactly `~/.agents/plugins/marketplace.json`.
  - Verify plugin path is exactly `~/plugins/agent-bridge`.
  - Restart Codex Desktop.
- No icon:
  - Ensure these files exist if you want custom branding:
    - `~/plugins/agent-bridge/assets/icon.png`
    - `~/plugins/agent-bridge/assets/logo.png`

## 6. MCP integration

The plugin's `.mcp.json` configures the agent-bridge MCP server automatically. When Codex loads the plugin, it gets access to these tools:

| Tool | Description |
|---|---|
| `notify` | Send notification (task_started, task_completed, etc.) |
| `check_responses` | Check for unread Telegram messages |
| `mark_read` | Mark responses as read |
| `wait_for_response` | Block until user responds (handles polling internally, 5min timeout) |
| `list_sessions` | List all sessions |
| `create_session` | Create a new session |
| `delete_session` | Delete a session |

### Telegram mode with MCP

Instead of manual polling loops, the agent uses `wait_for_response` which:
1. Polls the API every 5 seconds internally
2. Blocks until a new message arrives
3. Returns the message content and auto-marks as read
4. Times out after 5 minutes (configurable via `timeoutSeconds`)

This solves the problem of agents not maintaining persistent polling loops.
