#!/usr/bin/env node

/**
 * Agent Bridge Terminal Agent (PTY)
 *
 * Runs a real shell on your local machine with full interactive support.
 * Connects to the API via WebSocket so the dashboard terminal can control it.
 *
 * Usage:
 *   node apps/terminal-agent.js --api http://localhost:3001
 *   node apps/terminal-agent.js --api https://your-api.com --cwd /path/to/project
 *   node apps/terminal-agent.js --api http://localhost:3001 --shell /bin/zsh
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

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

let ptyProcess = null;

function connect() {
  const ws = new WebSocket(`${apiUrl}/ws/terminal-agent`);

  ws.on('open', () => {
    log('✅ Connected to Agent Bridge API');
    log(`   Shell: ${shellPath}`);
    log(`   CWD:   ${cwd}`);

    // Spawn a real shell
    ptyProcess = pty.spawn(shellPath, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd,
      env: { ...process.env, TERM: 'xterm-256color' },
    });

    // Forward shell output to API
    ptyProcess.onData((data) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      log(`Shell exited (${exitCode}). Restarting...`);
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
      }
    });

    ws.send(JSON.stringify({ type: 'register', cwd, shell: shellPath }));
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    // Receive input from dashboard terminal
    if (msg.event === 'exec' && msg.data && ptyProcess) {
      ptyProcess.write(msg.data + '\n');
    }
    // Resize
    if (msg.event === 'resize' && msg.cols && msg.rows && ptyProcess) {
      ptyProcess.resize(msg.cols, msg.rows);
    }
  });

  ws.on('close', () => {
    log('⚠️ Disconnected. Reconnecting in 3s...');
    if (ptyProcess) { ptyProcess.kill(); ptyProcess = null; }
    setTimeout(connect, 3000);
  });

  ws.on('error', () => {});
}

log('🖥️  Agent Bridge Terminal Agent');
log(`   API:   ${apiUrl}`);
log(`   Shell: ${shellPath}`);
log(`   CWD:   ${cwd}`);
log('');
connect();
