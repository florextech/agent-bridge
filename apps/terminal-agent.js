#!/usr/bin/env node

/**
 * Agent Bridge Terminal Agent
 *
 * Runs on your local machine and connects to the API via WebSocket.
 * The dashboard terminal sends commands through the API to this agent.
 *
 * Usage:
 *   node apps/terminal-agent.js --api http://localhost:3001
 *   node apps/terminal-agent.js --api https://your-api.com --cwd /path/to/project
 */

const { execSync } = require('node:child_process');
const WebSocket = require('ws');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : null;
}

const apiUrl = (getArg('api') || 'http://localhost:3001').replace('http', 'ws');
const cwd = getArg('cwd') || process.cwd();

const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

function connect() {
  const ws = new WebSocket(`${apiUrl}/ws/terminal-agent`);

  ws.on('open', () => {
    log('✅ Connected to Agent Bridge API');
    log(`   CWD: ${cwd}`);
    ws.send(JSON.stringify({ type: 'register', cwd }));
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.event === 'exec' && msg.data) {
      const cmd = msg.data;
      log(`🔄 $ ${cmd}`);
      try {
        const output = execSync(cmd, { encoding: 'utf8', cwd, timeout: 300000, maxBuffer: 10 * 1024 * 1024 });
        ws.send(JSON.stringify({ type: 'output', data: output }));
        ws.send(JSON.stringify({ type: 'exit', code: 0 }));
      } catch (e) {
        const stderr = (e.stderr || e.stdout || '').toString();
        ws.send(JSON.stringify({ type: 'output', data: stderr || e.message }));
        ws.send(JSON.stringify({ type: 'exit', code: e.status || 1 }));
      }
    }
  });

  ws.on('close', () => {
    log('⚠️ Disconnected. Reconnecting in 3s...');
    setTimeout(connect, 3000);
  });

  ws.on('error', () => {});
}

log('🖥️  Agent Bridge Terminal Agent');
log(`   API: ${apiUrl}`);
log(`   CWD: ${cwd}`);
log('');
connect();
