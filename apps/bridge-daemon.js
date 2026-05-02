#!/usr/bin/env node

/**
 * Agent Bridge Daemon
 *
 * Background process that bridges Telegram with any CLI agent.
 * Listens for messages and can re-open the agent when the user sends instructions.
 *
 * Works with: Kiro, Codex, Claude, Gemini, Aider, or any CLI tool.
 *
 * Usage:
 *   node apps/bridge-daemon.js --session <ID> --agent "kiro-cli"
 *   node apps/bridge-daemon.js --session <ID> --agent "codex"
 *   node apps/bridge-daemon.js --session <ID> --agent "claude"
 *   node apps/bridge-daemon.js --session <ID> --agent "aider"
 *   node apps/bridge-daemon.js --session <ID> --agent "gemini"
 *   node apps/bridge-daemon.js --session <ID> --no-reopen   # just log, don't reopen
 *
 * How it works:
 *   1. Polls Telegram responses every 3 seconds
 *   2. While agent is running, prints messages to stdout
 *   3. When agent session ends, keeps listening
 *   4. If user sends a Telegram message, re-opens the agent
 *   5. Repeats forever until Ctrl+C
 */

const { spawn } = require('node:child_process');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : null;
}

const sessionId = getArg('session');
const apiUrl = getArg('api') ?? 'http://localhost:3001';
const agentCmd = getArg('agent') ?? 'kiro-cli';
const cwd = getArg('cwd') ?? process.cwd();
const autoReopen = !args.includes('--no-reopen');

if (!sessionId) {
  console.error(`Agent Bridge Daemon

Bridges Telegram with any CLI agent. Keeps listening even when the agent closes.

Usage:
  node apps/bridge-daemon.js --session <ID> --agent <command>

Agents:
  --agent "kiro-cli"     Kiro CLI
  --agent "codex"        OpenAI Codex CLI
  --agent "claude"       Claude Code CLI
  --agent "gemini"       Gemini CLI
  --agent "aider"        Aider
  --agent "cursor"       Cursor CLI
  --agent "any-command"  Any CLI tool

Options:
  --api <url>            API URL (default: http://localhost:3001)
  --cwd <path>           Working directory (default: current)
  --no-reopen            Don't auto-reopen agent, just log messages

Example:
  node apps/bridge-daemon.js --session abc-123 --agent "codex"
  # Now send messages via Telegram — when codex closes, daemon re-opens it`);
  process.exit(1);
}

const log = (msg) => console.log(`[bridge ${new Date().toLocaleTimeString()}] ${msg}`);

let agentRunning = false;
let reopening = false;

async function sendEvent(type, summary) {
  await fetch(`${apiUrl}/agent-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, type, payload: { summary } }),
  }).catch(() => { /* fire-and-forget */ });
}

function startAgent() {
  if (agentRunning) return;
  agentRunning = true;
  reopening = false;

  log(`🚀 Starting: ${agentCmd}`);
  const parts = agentCmd.split(' ');
  const proc = spawn(parts[0], parts.slice(1), {
    stdio: 'inherit',
    cwd,
    env: { ...process.env, AGENT_BRIDGE_SESSION: sessionId, AGENT_BRIDGE_API: apiUrl },
  });

  proc.on('close', (code) => {
    agentRunning = false;
    log(`⏸️  ${agentCmd} exited (${code}). Listening for Telegram...`);
    sendEvent('message', `Sesión de ${agentCmd} terminada. Envía un mensaje por Telegram para re-abrirla.`);
  });

  proc.on('error', (err) => {
    agentRunning = false;
    log(`❌ Failed to start ${agentCmd}: ${err.message}`);
  });
}

async function checkResponses() {
  try {
    const res = await fetch(`${apiUrl}/agent-sessions/${sessionId}/responses`);
    if (!res.ok) return;

    const responses = await res.json();
    const unread = responses.filter((r) => !r.read);
    if (unread.length === 0) return;

    await fetch(`${apiUrl}/agent-sessions/${sessionId}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    for (const r of unread) {
      log(`📨 ${r.author ?? 'User'}: ${r.content}`);
    }

    if (!agentRunning && autoReopen && !reopening) {
      reopening = true;
      const lastMsg = unread.at(-1)?.content ?? '';
      log(`🔄 Re-opening ${agentCmd} (triggered by: "${lastMsg}")`);
      await sendEvent('task_started', `Re-abriendo ${agentCmd} con instrucción: "${lastMsg}"`);
      startAgent();
    }
  } catch {
    /* silent retry */
  }
}

log('🌉 Agent Bridge Daemon');
log(`   Agent:   ${agentCmd}`);
log(`   Session: ${sessionId}`);
log(`   API:     ${apiUrl}`);
log(`   CWD:     ${cwd}`);
log(`   Reopen:  ${autoReopen ? 'yes' : 'no'}`);
log('');

// Start agent immediately
startAgent();

// Poll for Telegram messages
setInterval(checkResponses, 3000);
