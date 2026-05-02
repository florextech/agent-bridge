'use client';

import { useReducer } from 'react';
import { Alert, Button, Input, Label, Text } from '@florexlabs/ui';
import { Copy, Check } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { ChannelType } from '@agent-bridge/core';
import { useCreateSession } from '@/lib/queries';

type SessionsState = {
  projectName: string;
  agentName: string;
  session: { id: string } | null;
  copiedKey: string;
};

type SessionsAction =
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'SET_AGENT_NAME'; payload: string }
  | { type: 'SET_SESSION'; payload: { id: string } | null }
  | { type: 'SET_COPIED_KEY'; payload: string };

function sessionsReducer(state: SessionsState, action: SessionsAction): SessionsState {
  switch (action.type) {
    case 'SET_PROJECT_NAME': return { ...state, projectName: action.payload };
    case 'SET_AGENT_NAME': return { ...state, agentName: action.payload };
    case 'SET_SESSION': return { ...state, session: action.payload };
    case 'SET_COPIED_KEY': return { ...state, copiedKey: action.payload };
    default: return state;
  }
}

export function SessionsTab({ botToken }: { botToken: string }) {
  const { t } = useI18n();
  const [state, dispatch] = useReducer(sessionsReducer, { projectName: '', agentName: '', session: null, copiedKey: '' });
  const createMutation = useCreateSession();

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    dispatch({ type: 'SET_COPIED_KEY', payload: key });
    setTimeout(() => dispatch({ type: 'SET_COPIED_KEY', payload: '' }), 2000);
  };

  const create = () => {
    createMutation.mutate(
      { projectName: state.projectName || 'my-project', agentName: state.agentName || 'codex', channelType: ChannelType.Telegram, channelConfig: { botToken } },
      { onSuccess: (s) => dispatch({ type: 'SET_SESSION', payload: s }) },
    );
  };

  const apiUrl = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : 'http://localhost:3001';

  const agentPrompt = state.session ? `You have access to Agent Bridge, a notification system that lets you communicate with the user via Telegram and other channels.\n\n## Configuration\n- API: ${apiUrl}\n- Session: ${state.session.id}\n\n## How to notify\ncurl -X POST ${apiUrl}/agent-events -H "Content-Type: application/json" -d '{"sessionId":"${state.session.id}","type":"EVENT_TYPE","payload":{"summary":"DESCRIPTION"}}'\n\n## Event types\n- task_started — When you begin working\n- task_completed — When you finish a task\n- needs_review — When code needs review\n- needs_approval — When you need permission\n- error — When you encounter an error\n- test_results — When tests finish\n- message — General messages\n\n## Check responses\ncurl ${apiUrl}/agent-sessions/${state.session.id}/responses\ncurl -X POST ${apiUrl}/agent-sessions/${state.session.id}/mark-read` : '';

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: Create */}
      <div className="flx-card">
        <p className="font-display text-sm font-semibold mb-1">{t('settings.quickSession')}</p>
        <Text variant="muted" size="xs" className="mb-4">{t('settings.quickSessionDesc')}</Text>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="qProject" className="text-xs">{t('settings.projectName')}</Label>
            <Input id="qProject" placeholder="my-project" value={state.projectName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_PROJECT_NAME', payload: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="qAgent" className="text-xs">{t('settings.agentName')}</Label>
            <Input id="qAgent" placeholder="codex" value={state.agentName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_AGENT_NAME', payload: e.target.value })} />
          </div>
          <Button onClick={create} size="sm">{t('settings.createSession')}</Button>
        </div>
        {state.session && (
          <div className="mt-4 pt-4 border-t border-(--border)">
            <Alert variant="success">Session created!</Alert>
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-(--surface-muted) border border-(--border)">
              <code className="flex-1 text-xs text-(--brand-600) truncate">{state.session.id}</code>
              <button onClick={() => copy('id', state.session!.id)} className="p-1.5 rounded hover:bg-(--surface) text-(--muted) hover:text-(--foreground) transition-colors">
                {state.copiedKey === 'id' ? <Check size={14} className="text-(--brand-600)" /> : <Copy size={14} />}
              </button>
            </div>
            <button onClick={() => dispatch({ type: 'SET_SESSION', payload: null })} className="mt-2 text-xs text-(--muted) hover:text-(--foreground) transition-colors">+ Create another</button>
          </div>
        )}
      </div>

      {/* Right: Instructions */}
      <div className="flx-card">
        <p className="font-display text-sm font-semibold mb-1">Agent Instructions</p>
        <Text variant="muted" size="xs" className="mb-3">Paste into your agent&apos;s system prompt</Text>
        {state.session ? (
          <div className="relative">
            <pre className="p-3 rounded-lg bg-(--surface-muted) border border-(--border) text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap text-(--foreground) max-h-[400px] overflow-y-auto">{agentPrompt}</pre>
            <button onClick={() => copy('prompt', agentPrompt)} className="absolute top-2 right-2 p-1.5 rounded bg-(--surface) border border-(--border) text-(--muted) hover:text-(--foreground) transition-colors">
              {state.copiedKey === 'prompt' ? <Check size={12} className="text-(--brand-600)" /> : <Copy size={12} />}
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-lg bg-(--surface-muted) border border-(--border) text-center">
            <Text variant="muted" size="sm">Create a session to see the instructions</Text>
          </div>
        )}
      </div>
    </div>
  );
}
