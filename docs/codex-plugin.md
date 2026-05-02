# Agent Bridge Codex Plugin (Local)

This guide explains how to install and use the local `agent-bridge` plugin with Codex.

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

## 5. Troubleshooting

- Install button does nothing:
  - Verify marketplace path is exactly `~/.agents/plugins/marketplace.json`.
  - Verify plugin path is exactly `~/plugins/agent-bridge`.
  - Restart Codex Desktop.
- No icon:
  - Ensure these files exist:
    - `~/plugins/agent-bridge/assets/icon.png`
    - `~/plugins/agent-bridge/assets/logo.png`
