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

  const agentPrompt = `You have access to Agent Bridge, a bidirectional notification system that connects you with the user via Telegram.

## Configuration
- API: ${apiUrl}
- Session: ${session.id}

## Step 1: Check pending messages
At the START of every conversation, check for pending Telegram messages:
curl -s ${apiUrl}/agent-sessions/${session.id}/responses
If there are unread responses ("read": false), act on them, then mark as read:
curl -s -X POST ${apiUrl}/agent-sessions/${session.id}/mark-read

## Step 2: Ask communication preference
Ask: "Do you want to communicate here (terminal) or via Telegram?"

### Terminal mode: work normally, send Telegram notifications for important events.
### Telegram mode: enter polling loop, process each message as instruction, NEVER end session until user says "done".

## How to notify
curl -s -X POST ${apiUrl}/agent-events -H "Content-Type: application/json" -d '{"sessionId":"${session.id}","type":"EVENT_TYPE","payload":{"summary":"DESCRIPTION"}}'

## Event types
- task_started — Beginning a task
- task_completed — Task finished
- needs_review — Code needs review
- needs_approval — Need permission
- error — Blocking error
- test_results — Tests finished
- message — General message/question

## When to notify (ALWAYS)
1. Starting a significant task
2. Completing a task
3. Needing input, review, or approval
4. Encountering a blocking error
5. Tests passing or failing

## Checking for responses
curl -s ${apiUrl}/agent-sessions/${session.id}/responses
After reading: curl -s -X POST ${apiUrl}/agent-sessions/${session.id}/mark-read

## Rules
- Be proactive — the user relies on notifications
- Keep summaries concise (read on phone)
- Check pending messages before asking something already answered
- In Telegram mode: NEVER close session until user says to stop`;

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