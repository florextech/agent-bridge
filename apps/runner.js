#!/usr/bin/env node

/**
 * Agent Bridge Runner — Remote terminal + AI + Command dispatcher
 *
 * Usage:
 *   node apps/runner.js --session <ID> --config commands.json
 *   node apps/runner.js --session <ID> --shell          # Enable remote shell
 *   node apps/runner.js --session <ID> --ai             # Enable AI assistant
 *   node apps/runner.js --session <ID> --shell --ai     # Both
 *
 * From Telegram:
 *   /test              → run configured command
 *   /build             → run configured command
 *   $ ls -la           → run shell command (if --shell enabled)
 *   $ git status       → run shell command
 *   ai: explain this error  → ask AI (if --ai enabled)
 *   hello              → default command or just log
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
const aiEnabled = args.includes('--ai');
const aiModel = getArg('ai-model') || 'gpt-4o-mini';
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
  --ai                Enable AI assistant (ai: prefix)
  --ai-model <model>  AI model (default: gpt-4o-mini)
  --cwd <path>        Working directory for commands
  --api <url>         API URL (default: http://localhost:3001)
  --interval <sec>    Poll interval (default: 5)
  --once              Poll once and exit

Telegram commands:
  /cmd [args]         Run configured command
  $ command           Run shell command (requires --shell)
  ai: question        Ask AI (requires --ai + OPENAI_API_KEY)
  plain text          Run default command or log`);
  process.exit(1);
}

// Load commands
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

async function askAI(question) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendEvent('error', '❌ OPENAI\\_API\\_KEY not set');
    return;
  }
  log(`🤖 AI: ${question}`);
  sendEvent('message', `🤖 *Thinking...*\n\n_${question}_`);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: `You are a helpful DevOps assistant. You help with code, infrastructure, and development tasks. Keep responses concise (max 500 chars). If the user asks to run something, suggest the exact command. Working directory: ${cwd}` },
          { role: 'user', content: question },
        ],
        max_tokens: 300,
      }),
    });
    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || 'No response';
    log(`🤖 Response: ${answer.slice(0, 100)}...`);
    sendEvent('message', `🤖 *AI*\n\n${answer}`);
  } catch (e) {
    sendEvent('error', `❌ AI error: ${e.message}`);
  }
}

function processMessage(text) {
  const trimmed = text.trim();

  // Shell command: $ ls -la
  if (trimmed.startsWith('$') || trimmed.startsWith('> ')) {
    const cmd = trimmed.slice(trimmed.startsWith('$ ') ? 2 : 2).trim();
    if (!shellEnabled) {
      sendEvent('error', '🔒 Shell not enabled. Start runner with `--shell`');
      return;
    }
    if (!cmd) return;
    runCommand(`$ ${cmd}`, cmd);
    return;
  }

  // AI: ai: explain this
  if (trimmed.toLowerCase().startsWith('ai:') || trimmed.toLowerCase().startsWith('ai ')) {
    const question = trimmed.slice(trimmed.indexOf(':') !== -1 ? trimmed.indexOf(':') + 1 : 3).trim();
    if (!aiEnabled) {
      sendEvent('error', '🔒 AI not enabled. Start runner with `--ai`');
      return;
    }
    if (!question) return;
    askAI(question);
    return;
  }

  // Configured command: /test
  if (trimmed.startsWith('/')) {
    const spaceIdx = trimmed.indexOf(' ');
    const cmd = spaceIdx === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIdx);
    const cmdArgs = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();

    if (commands[cmd]) {
      const template = commands[cmd];
      runCommand(`/${cmd}`, cmdArgs ? `${template} "${cmdArgs}"` : template);
    } else {
      sendEvent('message', `⚠️ Unknown command: /${cmd}\n\nAvailable: ${Object.keys(commands).map(c => '/' + c).join(', ') || 'none'}`);
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

// Startup
log('🚀 Agent Bridge Runner');
log(`   Session:  ${sessionId}`);
log(`   API:      ${apiUrl}`);
log(`   CWD:      ${cwd}`);
log(`   Interval: ${interval / 1000}s`);
log(`   Shell:    ${shellEnabled ? '✅ enabled' : '🔒 disabled'}`);
log(`   AI:       ${aiEnabled ? '✅ enabled (' + aiModel + ')' : '🔒 disabled'}`);
if (Object.keys(commands).length > 0) log(`   Commands: ${Object.keys(commands).map(c => '/' + c).join(', ')}`);
if (fallbackCommand) log(`   Default:  ${fallbackCommand}`);
log('');

if (once) {
  poll().then(() => process.exit(0));
} else {
  poll();
  setInterval(poll, interval);
}
