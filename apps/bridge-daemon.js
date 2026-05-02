#!/usr/bin/env node

/**
 * Agent Bridge Daemon
 *
 * Runs in background during a Kiro session. Listens for Telegram messages
 * and can re-open Kiro if the session closes.
 *
 * Usage:
 *   node apps/bridge-daemon.js --session <ID> [--api http://localhost:3001]
 *
 * Start it at the beginning of a Kiro session. It will:
 * 1. Poll for Telegram responses every 3 seconds
 * 2. Print them to stdout (so Kiro can see them)
 * 3. If Kiro session ends and user sends a message, re-open Kiro
 * 4. Keep running until explicitly stopped (Ctrl+C)
 */

const { execSync } = require('node:child_process');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : null;
}

const sessionId = getArg('session');
const apiUrl = getArg('api') ?? 'http://localhost:3001';
const reopenCmd = getArg('reopen') ?? 'kiro-cli';
const cwd = getArg('cwd') ?? process.cwd();
const autoReopen = !args.includes('--no-reopen');

if (!sessionId) {
  console.error(`Agent Bridge Daemon

Usage:
  node apps/bridge-daemon.js --session <ID> [options]

Options:
  --api <url>         API URL (default: http://localhost:3001)
  --reopen <cmd>      Command to reopen agent (default: kiro-cli)
  --cwd <path>        Working directory (default: current)
  --no-reopen         Don't auto-reopen agent, just log messages`);
  process.exit(1);
}

const log = (msg) => console.log(`[bridge ${new Date().toLocaleTimeString()}] ${msg}`);

let kiroRunning = true;
let reopening = false;

async function checkResponses() {
  try {
    const res = await fetch(`${apiUrl}/agent-sessions/${sessionId}/responses`);
    if (!res.ok) return;

    const responses = await res.json();
    const unread = responses.filter((r) => !r.read);
    if (unread.length === 0) return;

    // Mark as read
    await fetch(`${apiUrl}/agent-sessions/${sessionId}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    for (const r of unread) {
      log(`📨 ${r.author ?? 'User'}: ${r.content}`);
    }

    // If Kiro is not running and auto-reopen is enabled, restart it
    if (!kiroRunning && autoReopen && !reopening) {
      reopening = true;
      const lastMessage = unread.at(-1)?.content ?? '';
      log(`🔄 Re-opening agent with: "${lastMessage}"`);

      // Notify user
      await fetch(`${apiUrl}/agent-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type: 'task_started',
          payload: { summary: `Re-abriendo sesión de agente con tu instrucción: "${lastMessage}"` },
        }),
      });

      try {
        kiroRunning = true;
        execSync(`${reopenCmd}`, { stdio: 'inherit', cwd, timeout: 0 });
      } catch {
        // Kiro session ended
      }
      kiroRunning = false;
      reopening = false;
      log('⏸️  Agent session ended. Listening for Telegram messages...');
    }
  } catch {
    // Silent retry
  }
}

// Detect when parent Kiro process ends
process.on('SIGHUP', () => {
  kiroRunning = false;
  log('⏸️  Parent session ended. Still listening for Telegram...');
});

log('🚀 Agent Bridge Daemon started');
log(`   Session:  ${sessionId}`);
log(`   API:      ${apiUrl}`);
log(`   Reopen:   ${autoReopen ? reopenCmd : 'disabled'}`);
log(`   CWD:      ${cwd}`);
log('');
log('Listening for Telegram messages...');

// Start polling
setInterval(checkResponses, 3000);
checkResponses();

// When Kiro session ends naturally, keep daemon running
process.on('disconnect', () => {
  kiroRunning = false;
});
