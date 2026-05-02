#!/usr/bin/env node

/**
 * Agent Bridge Terminal Agent (PTY)
 *
 * Runs on your local machine. Each browser tab gets its own shell session.
 * Connects multiple WebSocket sessions to the API.
 *
 * Usage:
 *   node apps/terminal-agent.js --api http://localhost:3001
 *   node apps/terminal-agent.js --api https://your-api.com --cwd /path/to/project
 *   node apps/terminal-agent.js --shell /bin/bash --sessions 4
 */

const pty = require('node-pty');
const WebSocket = require('ws');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : null;
}

const apiUrl = (getArg('api') || 'http://localhost:3001').replace('http', 'ws');
const cwd = getArg('cwd') || process.cwd();
const shellPath = getArg('shell') || process.env.SHELL || '/bin/zsh';
const maxSessions = Number.parseInt(getArg('sessions') || '4', 10);

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

let sessionCount = 0;

function createSession() {
  if (sessionCount >= maxSessions) return;
  sessionCount++;
  const id = sessionCount;

  const ws = new WebSocket(`${apiUrl}/ws/terminal-agent`);

  ws.on('open', () => {
    log(`🖥️  Session ${id} connected`);

    const proc = pty.spawn(shellPath, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd,
      env: { ...process.env, TERM: 'xterm-256color' },
    });

    proc.onData((data) => {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'output', data }));
    });

    proc.onExit(({ exitCode }) => {
      log(`🖥️  Session ${id} shell exited (${exitCode})`);
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
    });

    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.event === 'input' && msg.data) proc.write(msg.data);
      if (msg.event === 'exec' && msg.data) proc.write(msg.data + '\n');
      if (msg.event === 'resize' && msg.cols && msg.rows) proc.resize(msg.cols, msg.rows);
    });

    ws.on('close', () => {
      log(`🖥️  Session ${id} disconnected`);
      proc.kill();
      sessionCount--;
      // Reconnect to keep pool full
      setTimeout(createSession, 1000);
    });
  });

  ws.on('error', () => {
    sessionCount--;
    setTimeout(createSession, 3000);
  });
}

log('🖥️  Agent Bridge Terminal Agent');
log(`   API:      ${apiUrl}`);
log(`   Shell:    ${shellPath}`);
log(`   CWD:      ${cwd}`);
log(`   Sessions: ${maxSessions}`);
log('');

// Create initial pool of sessions
for (let i = 0; i < maxSessions; i++) {
  setTimeout(() => createSession(), i * 500);
}
