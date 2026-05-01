#!/usr/bin/env node

/**
 * Agent Bridge Runner — autonomous polling script
 *
 * Polls for Telegram responses and can re-invoke an agent command when
 * the user responds. Useful when agent sessions (like Kiro) expire.
 *
 * Usage:
 *   node runner.js --session <ID> [--api http://localhost:3001] [--interval 5] [--command "kiro chat"]
 *
 * Options:
 *   --session   Session ID to poll (required)
 *   --api       API base URL (default: http://localhost:3001)
 *   --interval  Polling interval in seconds (default: 5)
 *   --command   Command to run when a response is received (optional)
 *   --once      Poll once and exit (for cron usage)
 */

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const sessionId = getArg('session');
const apiUrl = getArg('api') || 'http://localhost:3001';
const interval = Number.parseInt(getArg('interval') || '5', 10) * 1000;
const command = getArg('command');
const once = args.includes('--once');

if (!sessionId) {
  console.error('Usage: node runner.js --session <SESSION_ID> [--api URL] [--interval 5] [--command "cmd"]');
  process.exit(1);
}

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

async function poll() {
  try {
    const res = await fetch(`${apiUrl}/agent-sessions/${sessionId}/responses`);
    if (!res.ok) { log(`API error: ${res.status}`); return; }

    const responses = await res.json();
    const unread = responses.filter((r) => !r.read);

    if (unread.length === 0) return;

    log(`📨 ${unread.length} new response(s):`);
    for (const r of unread) {
      log(`  → ${r.content}`);
    }

    // Mark as read
    await fetch(`${apiUrl}/agent-sessions/${sessionId}/mark-read`, { method: 'POST' });

    // Re-invoke agent if command is set
    if (command) {
      const fullCommand = `${command} "${unread.map((r) => r.content).join(' | ')}"`;
      log(`🔄 Running: ${fullCommand}`);
      const { execSync } = require('node:child_process');
      try {
        execSync(fullCommand, { stdio: 'inherit', timeout: 300000 });
      } catch (e) {
        log(`⚠️ Command exited with error: ${e.status || e.message}`);
      }
    }
  } catch (e) {
    log(`Error: ${e.message}`);
  }
}

log(`🚀 Agent Bridge Runner started`);
log(`   Session: ${sessionId}`);
log(`   API: ${apiUrl}`);
log(`   Interval: ${interval / 1000}s`);
if (command) log(`   Command: ${command}`);
log('');

if (once) {
  poll().then(() => process.exit(0));
} else {
  poll();
  setInterval(poll, interval);
}
