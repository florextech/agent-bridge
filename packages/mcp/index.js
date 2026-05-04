#!/usr/bin/env node

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const API_URL = process.env.AGENT_BRIDGE_API || "http://localhost:3001";
const SESSION_ID = process.env.AGENT_BRIDGE_SESSION;

async function api(path, init) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

const server = new McpServer({
  name: "agent-bridge",
  version: "0.1.0",
});

// Tool: Send notification
server.tool(
  "notify",
  "Send a notification to the user via Telegram or other configured channels",
  {
    type: z.enum(["task_started", "task_completed", "needs_review", "needs_approval", "error", "test_results", "message"]),
    summary: z.string().describe("Brief description of what happened"),
    sessionId: z.string().optional().describe("Session ID (uses AGENT_BRIDGE_SESSION env if not provided)"),
  },
  async ({ type, summary, sessionId }) => {
    const sid = sessionId || SESSION_ID;
    if (!sid) return { content: [{ type: "text", text: "Error: No session ID. Set AGENT_BRIDGE_SESSION env or pass sessionId." }] };

    const event = await api("/agent-events", {
      method: "POST",
      body: JSON.stringify({ sessionId: sid, type, payload: { summary } }),
    });
    return { content: [{ type: "text", text: `Sent ${type} (delivery: ${event.deliveryStatus})` }] };
  }
);

// Tool: Check responses
server.tool(
  "check_responses",
  "Check if the user has responded via Telegram",
  {
    sessionId: z.string().optional(),
  },
  async ({ sessionId }) => {
    const sid = sessionId || SESSION_ID;
    if (!sid) return { content: [{ type: "text", text: "Error: No session ID." }] };

    const responses = await api(`/agent-sessions/${sid}/responses`);
    const unread = responses.filter((r) => !r.read);

    if (unread.length === 0) {
      return { content: [{ type: "text", text: "No new responses from the user." }] };
    }

    const lines = unread.map((r) => "- " + r.content).join("\n");

    return {
      content: [{
        type: "text",
        text: `${unread.length} response(s):\n${lines}`,
      }],
    };
  }
);

// Tool: Mark responses as read
server.tool(
  "mark_read",
  "Mark all responses as read after processing them",
  {
    sessionId: z.string().optional(),
  },
  async ({ sessionId }) => {
    const sid = sessionId || SESSION_ID;
    if (!sid) return { content: [{ type: "text", text: "Error: No session ID." }] };

    await api(`/agent-sessions/${sid}/mark-read`, { method: "POST" });
    return { content: [{ type: "text", text: "Responses marked as read." }] };
  }
);

// Tool: List sessions
server.tool(
  "list_sessions",
  "List all active agent sessions",
  {},
  async () => {
    const sessions = await api("/agent-sessions");
    if (sessions.length === 0) return { content: [{ type: "text", text: "No sessions." }] };

    const text = sessions.map((s) => `- ${s.projectName} (${s.agentName}) [${s.status}] ID: ${s.id}`).join("\n");
    return { content: [{ type: "text", text }] };
  }
);

// Tool: Create session
server.tool(
  "create_session",
  "Create a new agent session for notifications",
  {
    projectName: z.string().describe("Project name"),
    agentName: z.string().describe("Agent name (e.g. kiro, codex, claude)"),
    channelType: z.enum(["telegram", "email"]).default("telegram"),
  },
  async ({ projectName, agentName, channelType }) => {
    const session = await api("/agent-sessions", {
      method: "POST",
      body: JSON.stringify({ projectName, agentName, channelType, channelConfig: {} }),
    });
    return { content: [{ type: "text", text: `Session created: ${session.id}\nProject: ${session.projectName}\nAgent: ${session.agentName}` }] };
  }
);

// Tool: Delete session
server.tool(
  "delete_session",
  "Delete an agent session",
  {
    sessionId: z.string().describe("Session ID to delete"),
  },
  async ({ sessionId }) => {
    await api(`/agent-sessions/${sessionId}`, { method: "DELETE" });
    return { content: [{ type: "text", text: `Session ${sessionId} deleted.` }] };
  }
);

// Tool: Wait for response (blocking poll)
server.tool(
  "wait_for_response",
  "Wait until the user sends a response via Telegram. Polls every 5 seconds and returns when a new message arrives. Use this instead of manual polling loops.",
  {
    sessionId: z.string().optional().describe("Session ID (uses AGENT_BRIDGE_SESSION env if not provided)"),
    timeoutSeconds: z.number().optional().default(300).describe("Max seconds to wait (default 300 = 5 min)"),
  },
  async ({ sessionId, timeoutSeconds }) => {
    const sid = sessionId || SESSION_ID;
    if (!sid) return { content: [{ type: "text", text: "Error: No session ID." }] };

    const deadline = Date.now() + (timeoutSeconds ?? 300) * 1000;

    while (Date.now() < deadline) {
      const responses = await api(`/agent-sessions/${sid}/responses`);
      const unread = responses.filter((r) => !r.read);

      if (unread.length > 0) {
        const lines = unread.map((r) => `[${r.author}]: ${r.content}`).join("\n");
        await api(`/agent-sessions/${sid}/mark-read`, { method: "POST" });
        return { content: [{ type: "text", text: `${unread.length} message(s) received:\n${lines}` }] };
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return { content: [{ type: "text", text: "Timeout: no response received within the time limit." }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
