#!/usr/bin/env node

/**
 * Agent Bridge Daemon
 *
 * Runs BETWEEN agent sessions. Listens for Telegram messages and
 * opens a new agent session when the user sends instructions.
 *
 * Flow:
 *   1. You close your agent (kiro, codex, etc.)
 *   2. Daemon keeps listening for Telegram
 *   3. You send a message via Telegram
 *   4. Daemon opens a new agent session
 *   5. Agent runs until it exits
 *   6. Back to step 2
 *
 * Usage:
 *   node apps/bridge-daemon.js --session <ID> --agent "kiro-cli"
 *   node apps/bridge-daemon.js --session <ID> --agent "codex"
 *   node apps/bridge-daemon.js --session <ID> --agent "claude"
 *   node apps/bridge-daemon.js --session <ID> --no-reopen
 */

const { spawnSync } = require('node:child_process');

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

Listens for Telegram between agent sessions. Re-opens the agent when you send a message.

Usage:
  node apps/bridge-daemon.js --session <ID> --agent <command>

Examples:
  node apps/bridge-daemon.js --session abc-123 --agent "kiro-cli"
  node apps/bridge-daemon.js --session abc-123 --agent "codex"
  node apps/bridge-daemon.js --session abc-123 --agent "claude"
  node apps/bridge-daemon.js --session abc-123 --no-reopen

Options:
  --agent <cmd>   Agent command (default: kiro-cli)
  --api <url>     API URL (default: http://localhost:3001)
  --cwd <path>    Working directory
  --no-reopen     Just log messages, don't open agent`);
  process.exit(1);
}

const log = (msg) => console.log(`\x1b[90m[bridge]\x1b[0m ${msg}`);

async function sendEvent(type, summary) {
  await fetch(`${apiUrl}/agent-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, type, payload: { summary } }),
  }).catch(() => { /* fire-and-forget */ });
}

async function getUnread() {
  try {
    const res = await fetch(`${apiUrl}/agent-sessions/${sessionId}/responses`);
    if (!res.ok) return [];
    const all = await res.json();
    return all.filter((r) => !r.read);
  } catch {
    return [];
  }
}

async function markRead() {
  await fetch(`${apiUrl}/agent-sessions/${sessionId}/mark-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => { /* fire-and-forget */ });
}

function runAgent() {
  log(`🚀 Opening ${agentCmd}...`);
  const parts = agentCmd.split(' ');
  spawnSync(parts[0], parts.slice(1), {
    stdio: 'inherit',
    cwd,
    env: { ...process.env, AGENT_BRIDGE_SESSION: sessionId, AGENT_BRIDGE_API: apiUrl },
  });
  log(`⏸️  ${agentCmd} closed.`);
}

async function waitForTelegram() {
  log('📱 Waiting for Telegram message...');
  await sendEvent('message', `${agentCmd} cerrado. Envía un mensaje por Telegram para re-abrirlo.`);

  while (true) {
    const unread = await getUnread();
    if (unread.length > 0) {
      await markRead();
      for (const r of unread) {
        log(`📨 ${r.author ?? 'User'}: ${r.content}`);
      }
      return unread;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
}

async function main() {
  log('🌉 Agent Bridge Daemon');
  log(`   Agent:   ${agentCmd}`);
  log(`   Session: ${sessionId.slice(0, 8)}...`);
  log('');

  // First run: open agent immediately
  runAgent();

  if (!autoReopen) {
    log('Auto-reopen disabled. Exiting.');
    return;
  }

  // Loop: wait for Telegram → open agent → repeat
  while (true) {
    const messages = await waitForTelegram();
    const lastMsg = messages.at(-1)?.content ?? '';
    log(`🔄 Re-opening ${agentCmd} (triggered by: "${lastMsg}")`);
    await sendEvent('task_started', `Re-abriendo ${agentCmd}: "${lastMsg}"`);
    runAgent();
  }
}

main();
