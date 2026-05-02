'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Heading } from '@florexlabs/ui';
import { Plus, X } from '@phosphor-icons/react';

interface TermTab {
  id: number;
  label: string;
}

let nextId = 1;

export default function TerminalPage() {
  const [tabs, setTabs] = useState<TermTab[]>([{ id: nextId++, label: 'Terminal 1' }]);
  const [activeTab, setActiveTab] = useState(1);

  const addTab = () => {
    const id = nextId++;
    setTabs((prev) => [...prev, { id, label: `Terminal ${id}` }]);
    setActiveTab(id);
  };

  const closeTab = (id: number) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) return prev;
      if (activeTab === id) setActiveTab(next[next.length - 1]!.id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-0 h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
      {/* Tab bar */}
      <div className="flex items-center gap-0 shrink-0">
        <div className="flex items-center gap-0 flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-(--brand-600) text-(--foreground)'
                  : 'border-transparent text-(--muted) hover:text-(--foreground)'
              }`}
            >
              {tab.label}
              {tabs.length > 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  className="p-0.5 rounded hover:bg-(--surface-muted) text-(--muted) hover:text-(--danger)"
                >
                  <X size={10} />
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={addTab} className="p-1.5 rounded-lg text-(--muted) hover:text-(--foreground) hover:bg-(--surface-muted) transition-colors shrink-0" title="New terminal">
          <Plus size={14} />
        </button>
      </div>

      {/* Terminal panels */}
      {tabs.map((tab) => (
        <div key={tab.id} className={`flex-1 min-h-0 ${activeTab === tab.id ? '' : 'hidden'}`}>
          <TerminalPanel id={tab.id} />
        </div>
      ))}
    </div>
  );
}

function TerminalPanel({ id }: { id: number }) {
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
        scrollback: 5000,
        padding: 12,
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
      setTimeout(() => fitAddon.fit(), 100);

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('http', 'ws');
      const ws = new WebSocket(`${apiUrl}/ws/terminal`);

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ event: 'resize', cols: term.cols, rows: term.rows }));
      };

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data as string) as { type: string; data?: string; code?: number };
        if (msg.type === 'output' && msg.data) term.write(msg.data);
        else if (msg.type === 'exit') term.write(`\r\n\x1b[90m● exit ${msg.code}\x1b[0m\r\n`);
      };

      ws.onclose = () => {
        setConnected(false);
        term.write('\r\n\x1b[31m● Disconnected\x1b[0m\r\n');
      };

      term.onData((data) => {
        if (ws.readyState === 1) ws.send(JSON.stringify({ event: 'input', data }));
      });

      const onResize = () => {
        fitAddon.fit();
        if (ws.readyState === 1) ws.send(JSON.stringify({ event: 'resize', cols: term.cols, rows: term.rows }));
      };
      window.addEventListener('resize', onResize);

      cleanup = () => { window.removeEventListener('resize', onResize); ws.close(); term.dispose(); };
    })();

    return () => cleanup?.();
  }, [id]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end px-2 py-1 shrink-0">
        <div className={`flex items-center gap-1.5 text-[10px] ${connected ? 'text-(--brand-600)' : 'text-(--danger)'}`}>
          <span className={`size-1.5 rounded-full ${connected ? 'bg-(--brand-600)' : 'bg-(--danger)'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      <div ref={termRef} className="flex-1 rounded-xl border border-(--border) overflow-hidden min-h-0 p-4 bg-[#0a0c0b]" />
    </div>
  );
}
