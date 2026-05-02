'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Heading, Text } from '@florexlabs/ui';
import { useI18n } from '@/lib/i18n';

interface TermLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export default function TerminalPage() {
  const { t } = useI18n();
  const [lines, setLines] = useState<TermLine[]>([{ type: 'system', text: 'Connecting...' }]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLine = useCallback((line: TermLine) => {
    setLines((prev) => [...prev.slice(-500), line]);
  }, []);

  useEffect(() => {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace('http', 'ws');
    const ws = new WebSocket(`${apiUrl}/ws/terminal`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setLines([{ type: 'system', text: '● Connected to Agent Bridge terminal' }]);
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data as string) as { type: string; data?: string; code?: number };
      if (msg.type === 'output' && msg.data) {
        const text = msg.data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        addLine({ type: 'output', text });
      } else if (msg.type === 'exit') {
        addLine({ type: 'system', text: `● Process exited (${msg.code})` });
      }
    };

    ws.onclose = () => {
      setConnected(false);
      addLine({ type: 'error', text: '● Disconnected' });
    };

    return () => ws.close();
  }, [addLine]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const send = (cmd: string) => {
    if (!cmd.trim() || !wsRef.current) return;
    addLine({ type: 'input', text: `$ ${cmd}` });
    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    wsRef.current.send(JSON.stringify({ event: 'exec', data: cmd }));
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      send(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      if (history[newIdx]) { setHistoryIdx(newIdx); setInput(history[newIdx]!); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= history.length) { setHistoryIdx(-1); setInput(''); }
      else { setHistoryIdx(newIdx); setInput(history[newIdx]!); }
    }
  };

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

      <div
        className="flex-1 rounded-xl border border-(--border) bg-[#0a0c0b] p-4 font-mono text-[13px] overflow-y-auto cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all ${
            line.type === 'input' ? 'text-(--brand-600)' :
            line.type === 'error' ? 'text-(--danger)' :
            line.type === 'system' ? 'text-(--muted) text-xs' :
            'text-(--foreground)'
          }`}>
            {line.text}
          </div>
        ))}

        <div className="flex items-center gap-2 mt-1">
          <span className="text-(--brand-600) shrink-0">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent outline-none text-(--foreground) caret-(--brand-600)"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
