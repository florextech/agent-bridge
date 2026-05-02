'use client';

import { useState } from 'react';
import { Copy, Check } from '@phosphor-icons/react';

export function CopyButton({ text, className }: Readonly<{ text: string; className?: string }>) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy} className={className ?? 'p-1.5 rounded hover:bg-(--surface) text-(--muted) hover:text-(--foreground) transition-colors'}>
      {copied ? <Check size={14} className="text-(--brand-600)" /> : <Copy size={14} />}
    </button>
  );
}
