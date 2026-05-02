# Agent Bridge MCP Server

MCP (Model Context Protocol) server that gives code agents native access to Agent Bridge notifications.

## Tools

| Tool | Description |
|---|---|
| `notify` | Send a notification (task_completed, needs_review, error, etc.) |
| `check_responses` | Check if the user responded via Telegram |
| `mark_read` | Mark responses as read |
| `list_sessions` | List all active sessions |

## Setup

### For Kiro CLI

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "agent-bridge": {
      "command": "node",
      "args": ["/path/to/agent-bridge/packages/mcp/index.js"],
      "env": {
        "AGENT_BRIDGE_API": "http://localhost:3001",
        "AGENT_BRIDGE_SESSION": "YOUR_SESSION_ID"
      }
    }
  }
}
```

### For Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-bridge": {
      "command": "node",
      "args": ["/path/to/agent-bridge/packages/mcp/index.js"],
      "env": {
        "AGENT_BRIDGE_API": "http://localhost:3001",
        "AGENT_BRIDGE_SESSION": "YOUR_SESSION_ID"
      }
    }
  }
}
```

### For Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agent-bridge": {
      "command": "node",
      "args": ["/path/to/agent-bridge/packages/mcp/index.js"],
      "env": {
        "AGENT_BRIDGE_API": "http://localhost:3001",
        "AGENT_BRIDGE_SESSION": "YOUR_SESSION_ID"
      }
    }
  }
}
```

## Usage

Once configured, the agent can use the tools directly:

- "Notify the user that the task is complete" → calls `notify` with `task_completed`
- "Check if the user responded" → calls `check_responses`
- "Tell the user I need approval" → calls `notify` with `needs_approval`
