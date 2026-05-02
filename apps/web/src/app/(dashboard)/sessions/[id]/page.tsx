'use client';

import { useState } from 'react';
import { use } from 'react';
import { Badge, DataList, DataListItem, EmptyState, Heading, Spinner, Status, Tabs, TabsList, TabsTrigger, TabsContent, Text, Timeline, TimelineItem } from '@florexlabs/ui';
import { ArrowLeft, Rocket, CheckCircle, Eye, ShieldCheck, XCircle, TestTube, ChatText, Copy, Check, User, Robot, ClockCounterClockwise, Code, Info } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { useSession, useEvents, useResponses } from '@/lib/queries';
import type { ReactNode } from 'react';

const EVENT_ICONS: Record<string, ReactNode> = {
  task_started: <Rocket size={16} weight="duotone" className="text-(--brand-600)" />,
  task_completed: <CheckCircle size={16} weight="duotone" className="text-(--success)" />,
  needs_review: <Eye size={16} weight="duotone" className="text-(--warning)" />,
  needs_approval: <ShieldCheck size={16} weight="duotone" className="text-(--brand-700)" />,
  error: <XCircle size={16} weight="duotone" className="text-(--danger)" />,
  test_results: <TestTube size={16} weight="duotone" className="text-(--brand-600)" />,
  message: <ChatText size={16} weight="duotone" className="text-(--muted)" />,
};

export default function SessionDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { t } = useI18n();
  const { data: session, isLoading: sessionLoading, error: sessionError } = useSession(id);
  const { data: events = [] } = useEvents(id);
  const { data: responses = [] } = useResponses(id);
  const [copiedKey, setCopiedKey] = useState('');

  const error = sessionError?.message ?? '';

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  if (error) return <Text variant="danger">{error}</Text>;
  if (sessionLoading || !session) return <div className="flex items-center justify-center h-32"><Spinner className="size-5" /></div>;

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

  const CopyBtn = ({ k, text }: { k: string; text: string }) => (
    <button onClick={() => copy(k, text)} className="absolute top-2 right-2 p-2 rounded-lg bg-(--surface) border border-(--border) text-(--muted) hover:text-(--foreground) transition-colors">
      {copiedKey === k ? <Check size={14} className="text-(--brand-600)" /> : <Copy size={14} />}
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <a href="/" className="inline-flex items-center gap-1.5 text-(--muted) text-sm hover:text-(--foreground) transition-colors mb-2">
          <ArrowLeft size={14} /> {t('session.backToSessions')}
        </a>
        <Heading as="h2" size="lg">{session.projectName}</Heading>
        <Text variant="muted" size="sm">Agent: {session.agentName}</Text>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline"><span className="inline-flex items-center gap-1.5"><ClockCounterClockwise size={15} weight="duotone" /> {t('session.timeline')}</span></TabsTrigger>
          <TabsTrigger value="instructions"><span className="inline-flex items-center gap-1.5"><Code size={15} weight="duotone" /> Instructions</span></TabsTrigger>
          <TabsTrigger value="info"><span className="inline-flex items-center gap-1.5"><Info size={15} weight="duotone" /> Info</span></TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <div className="flx-card">
            {events.length === 0 && responses.length === 0 ? (
              <EmptyState title={t('session.noActivity')} description={t('session.noActivityDesc')} />
            ) : (
              <div className="max-h-[500px] overflow-y-auto pr-1">
                <Timeline>
                  {[
                    ...events.map((ev) => ({ kind: 'event' as const, id: ev.id, date: ev.createdAt, ev })),
                    ...responses.map((r) => ({ kind: 'response' as const, id: r.id, date: r.createdAt, r })),
                  ]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((item) =>
                      item.kind === 'event' ? (
                        <TimelineItem key={item.id} title={item.ev.type.replace(/_/g, ' ')} icon={EVENT_ICONS[item.ev.type] || <ChatText size={16} weight="duotone" />}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="size-5 rounded-full bg-(--surface-muted) flex items-center justify-center"><Robot size={11} className="text-(--muted)" /></div>
                              <Badge tone="neutral">{item.ev.deliveryStatus}</Badge>
                            </div>
                            {typeof item.ev.payload['summary'] === 'string' && <Text variant="muted" size="sm">{item.ev.payload['summary']}</Text>}
                            <Text variant="muted" size="xs">{new Date(item.ev.createdAt).toLocaleString()}</Text>
                          </div>
                        </TimelineItem>
                      ) : (
                        <TimelineItem key={item.id} title={item.r.author || t('session.userResponse')} icon={<ChatText size={16} weight="duotone" className="text-(--brand-600)" />}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="size-5 rounded-full bg-[rgb(189_241_70/0.15)] flex items-center justify-center"><User size={11} className="text-(--brand-600)" /></div>
                              <Text variant="muted" size="xs">{item.r.author || t('session.userResponse')}</Text>
                              {!item.r.read && <Badge tone="warning">{t('session.unread')}</Badge>}
                            </div>
                            <Text size="sm">{item.r.content}</Text>
                            <Text variant="muted" size="xs">{new Date(item.r.createdAt).toLocaleString()}</Text>
                          </div>
                        </TimelineItem>
                      ),
                    )}
                </Timeline>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="instructions">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flx-card flex flex-col gap-3">
              <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600)">{t('session.agentInstructions')}</p>
              <Text variant="muted" size="xs">{t('session.instructionsDesc')}</Text>
              <div className="relative">
                <pre className="p-4 rounded-xl bg-(--surface-muted) border border-(--border) text-xs overflow-x-auto whitespace-pre-wrap text-(--foreground)">{agentPrompt}</pre>
                <CopyBtn k="prompt" text={agentPrompt} />
              </div>
            </div>
            <div className="flx-card flex flex-col gap-3">
              <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600)">MCP Configuration</p>
              <Text variant="muted" size="xs">Add this to your MCP client (e.g. Kiro) configuration:</Text>
              <div className="relative">
                <pre className="p-4 rounded-xl bg-(--surface-muted) border border-(--border) text-xs overflow-x-auto whitespace-pre-wrap text-(--foreground)">{mcpConfig}</pre>
                <CopyBtn k="mcp" text={mcpConfig} />
              </div>
              <div className="p-3 rounded-lg bg-(--surface-muted) border border-(--border)">
                <Text variant="muted" size="xs">Available MCP tools: <code className="text-(--foreground)">notify</code>, <code className="text-(--foreground)">check_responses</code>, <code className="text-(--foreground)">mark_read</code>, <code className="text-(--foreground)">list_sessions</code></Text>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info">
          <div className="flx-card">
            <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-4">{t('session.sessionInfo')}</p>
            <DataList>
              <DataListItem label="Channel"><span className="flx-pill">{session.channelType}</span></DataListItem>
              <DataListItem label="Status"><Status value={session.status === 'active' ? 'success' : 'neutral'}>{session.status}</Status></DataListItem>
              <DataListItem label={t('session.created')}>{new Date(session.createdAt).toLocaleString()}</DataListItem>
              <DataListItem label={t('session.updated')}>{new Date(session.updatedAt).toLocaleString()}</DataListItem>
            </DataList>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
