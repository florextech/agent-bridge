'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, X, Terminal, ShieldWarning } from '@phosphor-icons/react';

interface TermTab { id: string; label: string }

export default function TerminalPage() {
  const [tabs, setTabs] = useState<TermTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');

  // Initialize on client only
  useEffect(() => {
    const id = crypto.randomUUID();
    setTabs([{ id, label: 'zsh' }]);
    setActiveTab(id);
  }, []);

  const addTab = () => {
    const id = crypto.randomUUID();
    setTabs((p) => [...p, { id, label: 'zsh' }]);
    setActiveTab(id);
  };

  const closeTab = (id: string) => {
    setTabs((p) => { const n = p.filter((t) => t.id !== id); if (!n.length) return p; if (activeTab === id) setActiveTab(n[n.length - 1]!.id); return n; });
  };

  if (!tabs.length) return null;

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
      {/* Security warning */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[rgb(245_158_11/0.08)] border border-[rgb(245_158_11/0.25)] shrink-0">
        <ShieldWarning size={18} weight="duotone" className="text-(--warning) shrink-0" />
        <p className="text-xs text-(--warning)">This terminal has full shell access to the connected machine. Use with caution.</p>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-[rgb(245_158_11/0.15)] text-[10px] font-semibold text-(--warning) shrink-0">Experimental</span>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-(--border) overflow-hidden bg-[#0a0c0b] flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center bg-[#111513] border-b border-(--border) shrink-0">
        <div className="flex items-center flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2 text-xs transition-colors border-r border-(--border) ${
                activeTab === tab.id
                  ? 'bg-[#0a0c0b] text-(--foreground)'
                  : 'text-(--muted) hover:text-(--foreground) hover:bg-[rgb(255_255_255/0.03)]'
              }`}
            >
              <Terminal size={12} weight="bold" className={activeTab === tab.id ? 'text-(--brand-600)' : ''} />
              {tab.label}
              {tabs.length > 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[rgb(239_68_68/0.15)] text-(--muted) hover:text-(--danger) transition-all"
                >
                  <X size={10} />
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={addTab} className="px-3 py-2 text-(--muted) hover:text-(--foreground) hover:bg-[rgb(255_255_255/0.03)] transition-colors" title="New terminal">
          <Plus size={13} />
        </button>
      </div>

      {/* Panels */}
      {tabs.map((tab) => (
        <div key={tab.id} className={`flex-1 min-h-0 ${activeTab === tab.id ? '' : 'hidden'}`}>
          <TerminalPanel />
        </div>
      ))}
      </div>
    </div>
  );
}

function TerminalPanel() {
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
      setTimeout(() => fitAddon.fit(), 150);

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

      ws.onclose = () => { setConnected(false); term.write('\r\n\x1b[31m● Disconnected\x1b[0m\r\n'); };

      term.onData((data) => { if (ws.readyState === 1) ws.send(JSON.stringify({ event: 'input', data })); });

      const onResize = () => { fitAddon.fit(); if (ws.readyState === 1) ws.send(JSON.stringify({ event: 'resize', cols: term.cols, rows: term.rows })); };
      window.addEventListener('resize', onResize);

      cleanup = () => { window.removeEventListener('resize', onResize); ws.close(); term.dispose(); };
    })();

    return () => cleanup?.();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div ref={termRef} className="flex-1 min-h-0 overflow-hidden p-3 [&_.xterm]:h-full [&_.xterm-viewport]:!overflow-y-auto" />
      <div className="flex items-center justify-end px-4 py-1 bg-[#111513] border-t border-(--border)">
        <div className={`flex items-center gap-1.5 text-[10px] ${connected ? 'text-(--brand-600)' : 'text-(--danger)'}`}>
          <span className={`size-1.5 rounded-full ${connected ? 'bg-(--brand-600)' : 'bg-(--danger)'}`} />
          {connected ? 'connected' : 'disconnected'}
        </div>
      </div>
    </div>
  );
}
