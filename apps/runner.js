#!/usr/bin/env node

/**
 * Agent Bridge Runner — command dispatcher
 *
 * Polls for Telegram responses and executes commands based on message content.
 * Configure commands in a JSON file or pass inline.
 *
 * Usage:
 *   node apps/runner.js --session <ID> --config commands.json
 *   node apps/runner.js --session <ID> --command "echo"
 *
 * Commands config (commands.json):
 * {
 *   "commands": {
 *     "kiro": "kiro chat --message",
 *     "codex": "codex --prompt",
 *     "test": "pnpm test",
 *     "build": "pnpm -r build",
 *     "deploy": "docker compose up -d"
 *   },
 *   "default": "echo"
 * }
 *
 * From Telegram, send:
 *   /kiro refactoriza el módulo de auth
 *   /test
 *   /build
 *   /deploy
 *   hola (uses default command)
 */

const fs = require('node:fs');
const { execSync } = require('node:child_process');

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const sessionId = getArg('session');
const apiUrl = getArg('api') || 'http://localhost:3001';
const interval = Number.parseInt(getArg('interval') || '5', 10) * 1000;
const defaultCommand = getArg('command');
const configPath = getArg('config');
const once = args.includes('--once');

if (!sessionId) {
  console.error(`Usage:
  node apps/runner.js --session <ID>
  node apps/runner.js --session <ID> --command "echo"
  node apps/runner.js --session <ID> --config commands.json

Commands config example (commands.json):
{
  "commands": {
    "kiro": "kiro chat --message",
    "codex": "codex --prompt",
    "test": "pnpm test",
    "build": "pnpm -r build"
  },
  "default": "echo"
}`);
  process.exit(1);
}

// Load commands config
let commands = {};
let fallbackCommand = defaultCommand || null;

if (configPath) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    commands = config.commands || {};
    fallbackCommand = config.default || fallbackCommand;
  } catch (e) {
    console.error(`Failed to load config: ${e.message}`);
    process.exit(1);
  }
}

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

function parseMessage(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('/')) {
    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) {
      return { cmd: trimmed.slice(1), args: '' };
    }
    return { cmd: trimmed.slice(1, spaceIdx), args: trimmed.slice(spaceIdx + 1).trim() };
  }
  return { cmd: null, args: trimmed };
}

function executeCommand(cmd, cmdArgs) {
  const template = commands[cmd];
  if (template) {
    const fullCommand = cmdArgs ? `${template} "${cmdArgs}"` : template;
    log(`🔄 /${cmd}: ${fullCommand}`);
    try {
      execSync(fullCommand, { stdio: 'inherit', timeout: 300000 });
      log(`✅ /${cmd} completed`);
    } catch (e) {
      log(`⚠️ /${cmd} failed: ${e.status || e.message}`);
    }
    return true;
  }
  return false;
}

async function poll() {
  try {
    const res = await fetch(`${apiUrl}/agent-sessions/${sessionId}/responses`);
    if (!res.ok) { log(`API error: ${res.status}`); return; }

    const responses = await res.json();
    const unread = responses.filter((r) => !r.read);
    if (unread.length === 0) return;

    // Mark as read first
    await fetch(`${apiUrl}/agent-sessions/${sessionId}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    for (const r of unread) {
      const { cmd, args: cmdArgs } = parseMessage(r.content);

      if (cmd && commands[cmd]) {
        executeCommand(cmd, cmdArgs);
      } else if (fallbackCommand) {
        const fullCommand = `${fallbackCommand} "${r.content}"`;
        log(`🔄 ${fullCommand}`);
        try {
          execSync(fullCommand, { stdio: 'inherit', timeout: 300000 });
        } catch (e) {
          log(`⚠️ Command failed: ${e.status || e.message}`);
        }
      } else {
        log(`📨 ${r.content}`);
        if (cmd) log(`   ⚠️ Unknown command: /${cmd}`);
      }
    }
  } catch (e) {
    log(`Error: ${e.message}`);
  }
}

log('🚀 Agent Bridge Runner started');
log(`   Session: ${sessionId}`);
log(`   API: ${apiUrl}`);
log(`   Interval: ${interval / 1000}s`);
if (Object.keys(commands).length > 0) {
  log(`   Commands: ${Object.keys(commands).map(c => '/' + c).join(', ')}`);
}
if (fallbackCommand) log(`   Default: ${fallbackCommand}`);
log('');

if (once) {
  poll().then(() => process.exit(0));
} else {
  poll();
  setInterval(poll, interval);
}
