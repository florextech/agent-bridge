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

## MCP tools (preferred method)
If you have the agent-bridge MCP server configured, use these tools directly:
- notify — Send notification (type + summary)
- check_responses — Check for unread messages
- mark_read — Mark responses as read
- wait_for_response — Wait until the user responds (blocks until a message arrives, handles polling internally)
- list_sessions / create_session / delete_session — Session management

## Step 1: Check pending messages
At the START of every conversation, check for pending Telegram messages:
Use MCP tool: check_responses
Or: curl -s ${apiUrl}/agent-sessions/${session.id}/responses
If there are unread responses, act on them, then mark as read.

## Step 2: Ask communication preference
Ask: "Do you want to communicate here (terminal) or via Telegram?"

### Terminal mode: work normally, send notifications for important events.
### Telegram mode:
1. Send "Telegram mode active" via notify tool
2. Use wait_for_response to wait for instructions (this blocks until the user sends a message)
3. Process the instruction, send results via notify
4. Call wait_for_response again for the next instruction
5. Repeat until the user says "done" or "back to terminal"

## Event types
- task_started — Beginning a task
- task_completed — Task finished
- needs_review — Code needs review
- needs_approval — Need permission
- error — Blocking error
- test_results — Tests finished
- message — General message/question

## curl fallback (if MCP unavailable)
Notify: curl -s -X POST ${apiUrl}/agent-events -H "Content-Type: application/json" -d '{"sessionId":"${session.id}","type":"EVENT_TYPE","payload":{"summary":"DESCRIPTION"}}'
Check: curl -s ${apiUrl}/agent-sessions/${session.id}/responses
Mark read: curl -s -X POST ${apiUrl}/agent-sessions/${session.id}/mark-read

## Rules
- Be proactive with notifications
- Keep summaries clear and concise (user reads on phone)
- Always check pending messages before asking something the user may have answered
- In Telegram mode: use wait_for_response instead of manual polling loops`;

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
          <Text variant="muted" size="xs">Available MCP tools: <code className="text-(--foreground)">notify</code>, <code className="text-(--foreground)">check_responses</code>, <code className="text-(--foreground)">mark_read</code>, <code className="text-(--foreground)">wait_for_response</code>, <code className="text-(--foreground)">list_sessions</code>, <code className="text-(--foreground)">create_session</code>, <code className="text-(--foreground)">delete_session</code></Text>
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