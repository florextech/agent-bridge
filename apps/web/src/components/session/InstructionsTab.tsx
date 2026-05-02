'use client';

import { useState } from 'react';
import { Text } from '@florexlabs/ui';
import { Copy, Check } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import type { Session } from '@agent-bridge/core';

export function InstructionsTab({ session }: Readonly<{ session: Session }>) {
  const { t } = useI18n();
  const [copiedKey, setCopiedKey] = useState('');

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const apiUrl = globalThis.window === undefined
    ? 'http://localhost:3001'
    : globalThis.location.origin.replace(':3000', ':3001');

  const agentPrompt = `You have access to Agent Bridge, a notification system that lets you communicate with the user via Telegram and other channels.

## Configuration
- API: ${apiUrl}
- Session: ${session.id}

## How to notify
Send a POST request to notify the user:

curl -X POST ${apiUrl}/agent-events -H "Content-Type: application/json" -d '{"sessionId":"${session.id}","type":"EVENT_TYPE","payload":{"summary":"DESCRIPTION"}}'

## Event types (use the right one for each situation)
- task_started — When you begin working on a task
- task_completed — When you finish a task successfully
- needs_review — When code needs the user to review it
- needs_approval — When you need permission before proceeding
- error — When you encounter an error you can't resolve
- test_results — When tests finish running
- message — For general messages or questions

## When to notify
ALWAYS notify the user when:
1. You start a significant task
2. You complete a task
3. You need input, review, or approval
4. You encounter an error that blocks progress
5. Tests pass or fail
6. You have a question

## Checking for responses
The user may respond via Telegram. Check periodically:

curl ${apiUrl}/agent-sessions/${session.id}/responses

If there are unread responses, read them and act accordingly. After reading:

curl -X POST ${apiUrl}/agent-sessions/${session.id}/mark-read

## Important
- Be proactive with notifications — the user relies on them
- Include clear, concise summaries in the payload
- Check for responses before asking the same question again`;

  const mcpConfig = JSON.stringify({
    mcpServers: {
      'agent-bridge': {
        command: 'node',
        args: ['/path/to/agent-bridge/packages/mcp/index.js'],
        env: {
          AGENT_BRIDGE_API: apiUrl,
          AGENT_BRIDGE_SESSION: session.id,
        },
      },
    },
  }, null, 2);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flx-card flex flex-col gap-3">
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600)">{t('session.agentInstructions')}</p>
        <Text variant="muted" size="xs">{t('session.instructionsDesc')}</Text>
        <div className="relative">
          <pre className="p-4 rounded-xl bg-(--surface-muted) border border-(--border) text-xs overflow-x-auto whitespace-pre-wrap text-(--foreground)">{agentPrompt}</pre>
          <InlineCopyBtn active={copiedKey === 'prompt'} onClick={() => copy('prompt', agentPrompt)} />
        </div>
      </div>
      <div className="flx-card flex flex-col gap-3">
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600)">{t('session.mcpConfiguration')}</p>
        <Text variant="muted" size="xs">{t('session.mcpConfigDesc')}</Text>
        <div className="relative">
          <pre className="p-4 rounded-xl bg-(--surface-muted) border border-(--border) text-xs overflow-x-auto whitespace-pre-wrap text-(--foreground)">{mcpConfig}</pre>
          <InlineCopyBtn active={copiedKey === 'mcp'} onClick={() => copy('mcp', mcpConfig)} />
        </div>
        <div className="p-3 rounded-lg bg-(--surface-muted) border border-(--border)">
          <Text variant="muted" size="xs">Available MCP tools: <code className="text-(--foreground)">notify</code>, <code className="text-(--foreground)">check_responses</code>, <code className="text-(--foreground)">mark_read</code>, <code className="text-(--foreground)">list_sessions</code></Text>
        </div>
      </div>
    </div>
  );
}

function InlineCopyBtn({ active, onClick }: Readonly<{ active: boolean; onClick: () => void }>) {
  return (
    <button onClick={onClick} className="absolute top-2 right-2 p-2 rounded-lg bg-(--surface) border border-(--border) text-(--muted) hover:text-(--foreground) transition-colors">
      {active ? <Check size={14} className="text-(--brand-600)" /> : <Copy size={14} />}
    </button>
  );
}