'use client';

import { useEffect, useRef, useState } from 'react';
import { Heading, Text } from '@florexlabs/ui';

export default function TerminalPage() {
  const termRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!termRef.current) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      await import('@xterm/xterm/css/xterm.css');

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        theme: {
          background: '#0a0c0b',
          foreground: '#edf6ee',
          cursor: '#bdf146',
          selectionBackground: '#bdf14640',
          black: '#0b0d0c',
          green: '#bdf146',
          brightGreen: '#d7ff6d',
          yellow: '#f59e0b',
          red: '#ef4444',
          cyan: '#76b73d',
          white: '#edf6ee',
          brightWhite: '#f4ffe9',
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current!);
      fitAddon.fit();

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('http', 'ws');
      const ws = new WebSocket(`${apiUrl}/ws/terminal`);

      ws.onopen = () => {
        setConnected(true);
        // Send resize
        ws.send(JSON.stringify({ event: 'resize', cols: term.cols, rows: term.rows }));
      };

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data as string) as { type: string; data?: string; code?: number };
        if (msg.type === 'output' && msg.data) {
          term.write(msg.data);
        } else if (msg.type === 'exit') {
          term.write(`\r\n\x1b[90m● exit ${msg.code}\x1b[0m\r\n`);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        term.write('\r\n\x1b[31m● Disconnected\x1b[0m\r\n');
      };

      // Send user input to server
      term.onData((data) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ event: 'input', data }));
        }
      });

      // Handle resize
      const onResize = () => {
        fitAddon.fit();
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ event: 'resize', cols: term.cols, rows: term.rows }));
        }
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        window.removeEventListener('resize', onResize);
        ws.close();
        term.dispose();
      };
    })();

    return () => cleanup?.();
  }, []);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div>
          <Heading as="h2" size="lg">Terminal</Heading>
          <Text variant="muted" size="sm">Remote shell access</Text>
        </div>
        <div className={`flex items-center gap-2 text-xs ${connected ? 'text-(--brand-600)' : 'text-(--danger)'}`}>
          <span className={`size-2 rounded-full ${connected ? 'bg-(--brand-600)' : 'bg-(--danger)'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      <div ref={termRef} className="flex-1 rounded-xl border border-(--border) overflow-hidden" />
    </div>
  );
}
