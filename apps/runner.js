#!/usr/bin/env node

/**
 * Agent Bridge Runner — Remote terminal + Command dispatcher
 *
 * Usage:
 *   node apps/runner.js --session <ID>
 *   node apps/runner.js --session <ID> --config commands.json
 *   node apps/runner.js --session <ID> --config commands.json --shell
 *
 * From Telegram:
 *   /test              → run configured command
 *   /build             → run configured command
 *   $ ls -la           → run shell command (if --shell enabled)
 *   hello              → default command or just log
 *
 * commands.json:
 * {
 *   "commands": { "test": "pnpm test", "build": "pnpm -r build" },
 *   "default": "echo"
 * }
 */

const fs = require('node:fs');
const { execSync } = require('node:child_process');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : null;
}

const sessionId = getArg('session');
const apiUrl = getArg('api') || 'http://localhost:3001';
const interval = Number.parseInt(getArg('interval') || '5', 10) * 1000;
const configPath = getArg('config');
const defaultCommand = getArg('command');
const shellEnabled = args.includes('--shell');
const cwd = getArg('cwd') || process.cwd();
const once = args.includes('--once');

if (!sessionId) {
  console.error(`Agent Bridge Runner

Usage:
  node apps/runner.js --session <ID> [options]

Options:
  --config <file>     Command mappings JSON file
  --command <cmd>     Default command for plain messages
  --shell             Enable remote shell ($ prefix)
  --cwd <path>        Working directory for commands
  --api <url>         API URL (default: http://localhost:3001)
  --interval <sec>    Poll interval (default: 5)
  --once              Poll once and exit

Telegram commands:
  /cmd [args]         Run configured command
  $ command           Run shell command (requires --shell)
  plain text          Run default command or log`);
  process.exit(1);
}

let commands = {};
let fallbackCommand = defaultCommand || null;
if (configPath) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    commands = config.commands || {};
    fallbackCommand = config.default || fallbackCommand;
  } catch (e) {
    console.error(`Config error: ${e.message}`);
    process.exit(1);
  }
}

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

function sendEvent(type, summary) {
  fetch(`${apiUrl}/agent-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, type, payload: { summary } }),
  }).catch(() => {});
}

function runCommand(label, fullCommand) {
  log(`🔄 ${label}`);
  const start = Date.now();
  try {
    const output = execSync(fullCommand, { timeout: 300000, encoding: 'utf8', cwd, maxBuffer: 10 * 1024 * 1024 });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const lines = (output || '').trim().split('\n').slice(-10).join('\n');
    log(`✅ ${label} (${elapsed}s)`);
    sendEvent('task_completed', `✅ *${label}* completed in ${elapsed}s\n\n\`\`\`\n${lines || '(no output)'}\n\`\`\``);
  } catch (e) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const err = (e.stderr || e.stdout || '').toString().trim().split('\n').slice(-8).join('\n') || e.message;
    log(`❌ ${label} (${elapsed}s)`);
    sendEvent('error', `❌ *${label}* failed in ${elapsed}s\n\n\`\`\`\n${err}\n\`\`\``);
  }
}

function processMessage(text) {
  const trimmed = text.trim();

  // Shell: $ command
  if (trimmed.startsWith('$ ') || trimmed.startsWith('> ')) {
    const cmd = trimmed.slice(2).trim();
    if (!shellEnabled) {
      sendEvent('message', '🔒 Shell disabled. Start runner with `--shell`');
      return;
    }
    if (cmd) runCommand(`$ ${cmd}`, cmd);
    return;
  }

  // Configured command: /test
  if (trimmed.startsWith('/')) {
    const spaceIdx = trimmed.indexOf(' ');
    const cmd = spaceIdx === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIdx);
    const cmdArgs = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();

    if (commands[cmd]) {
      runCommand(`/${cmd}`, cmdArgs ? `${commands[cmd]} "${cmdArgs}"` : commands[cmd]);
    } else {
      const available = Object.keys(commands).map(c => '/' + c).join(', ');
      sendEvent('message', `⚠️ Unknown: /${cmd}\n\nAvailable: ${available || 'none (use --config)'}`);
    }
    return;
  }

  // Default
  if (fallbackCommand) {
    runCommand('command', `${fallbackCommand} "${trimmed}"`);
  } else {
    log(`📨 ${trimmed}`);
  }
}

async function poll() {
  try {
    const res = await fetch(`${apiUrl}/agent-sessions/${sessionId}/responses`);
    if (!res.ok) { log(`API error: ${res.status}`); return; }

    const responses = await res.json();
    const unread = responses.filter((r) => !r.read);
    if (unread.length === 0) return;

    await fetch(`${apiUrl}/agent-sessions/${sessionId}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    for (const r of unread) {
      processMessage(r.content);
    }
  } catch (e) {
    log(`Error: ${e.message}`);
  }
}

log('🚀 Agent Bridge Runner');
log(`   Session:  ${sessionId}`);
log(`   CWD:      ${cwd}`);
log(`   Shell:    ${shellEnabled ? '✅' : '🔒'}`);
if (Object.keys(commands).length > 0) log(`   Commands: ${Object.keys(commands).map(c => '/' + c).join(', ')}`);
if (fallbackCommand) log(`   Default:  ${fallbackCommand}`);
log('');

if (once) {
  poll().then(() => process.exit(0));
} else {
  poll();
  setInterval(poll, interval);
}
