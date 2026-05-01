'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Badge, DataList, DataListItem, EmptyState, Heading, Spinner, Status, Text, Timeline, TimelineItem } from '@florexlabs/ui';
import { ArrowLeft, Rocket, CheckCircle, Eye, ShieldCheck, XCircle, TestTube, ChatText, Copy, Check } from '@phosphor-icons/react';
import type { AgentEvent, ChannelResponse, Session } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';
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

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [responses, setResponses] = useState<ChannelResponse[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([bridgeApi.getSession(id), bridgeApi.getEvents(id), bridgeApi.getResponses(id)])
      .then(([s, e, r]) => { setSession(s); setEvents(e); setResponses(r); })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <Text variant="danger">{error}</Text>;
  if (!session) return <div className="flex items-center justify-center h-32"><Spinner className="size-5" /></div>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <a href="/" className="inline-flex items-center gap-1.5 text-(--muted) text-sm hover:text-(--foreground) transition-colors mb-2">
          <ArrowLeft size={14} /> Back to sessions
        </a>
        <Heading as="h2" size="lg">{session.projectName}</Heading>
        <Text variant="muted" size="sm">Agent: {session.agentName}</Text>
      </div>

      <div className="flx-card">
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-4">Session Info</p>
        <DataList>
          <DataListItem label="Channel"><span className="flx-pill">{session.channelType}</span></DataListItem>
          <DataListItem label="Status"><Status value={session.status === 'active' ? 'success' : 'neutral'}>{session.status}</Status></DataListItem>
          <DataListItem label="Created">{new Date(session.createdAt).toLocaleString()}</DataListItem>
          <DataListItem label="Updated">{new Date(session.updatedAt).toLocaleString()}</DataListItem>
        </DataList>
      </div>

      <IntegrationBlock sessionId={session.id} />

      <div className="flx-card">
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-4">Timeline</p>
        {events.length === 0 && responses.length === 0 ? (
          <EmptyState title="No activity yet" description="Events and responses will appear here." />
        ) : (
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
                      <Badge tone="neutral">{item.ev.deliveryStatus}</Badge>
                      {typeof item.ev.payload['summary'] === 'string' && <Text variant="muted" size="sm">{item.ev.payload['summary']}</Text>}
                      <Text variant="muted" size="xs">{new Date(item.ev.createdAt).toLocaleString()}</Text>
                    </div>
                  </TimelineItem>
                ) : (
                  <TimelineItem key={item.id} title="User response" icon={<ChatText size={16} weight="duotone" className="text-(--brand-600)" />}>
                    <div className="flex flex-col gap-1">
                      <Text size="sm">{item.r.content}</Text>
                      <div className="flex items-center gap-2">
                        {!item.r.read && <Badge tone="warning">unread</Badge>}
                        <Text variant="muted" size="xs">{new Date(item.r.createdAt).toLocaleString()}</Text>
                      </div>
                    </div>
                  </TimelineItem>
                ),
              )}
          </Timeline>
        )}
      </div>
    </div>
  );
}

function IntegrationBlock({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const apiUrl = typeof window !== 'undefined'
    ? window.location.origin.replace(':3000', ':3001')
    : 'http://localhost:3001';

  const agentPrompt = `You have access to Agent Bridge for notifications.
Session ID: ${sessionId}
API: ${apiUrl}

When you complete a task, need review, need approval, hit an error, or finish tests, notify me:

curl -X POST ${apiUrl}/agent-events -H "Content-Type: application/json" -d '{"sessionId":"${sessionId}","type":"TYPE","payload":{"summary":"DESCRIPTION"}}'

Event types: task_started, task_completed, needs_review, needs_approval, error, test_results, message

To check if I responded: curl ${apiUrl}/agent-sessions/${sessionId}/responses
After reading: curl -X POST ${apiUrl}/agent-sessions/${sessionId}/mark-read`;

  return (
    <div className="flx-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600)">Agent Instructions</p>
        <span className="text-(--muted) text-xs">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <div className="mt-4 flex flex-col gap-3">
          <Text variant="muted" size="xs">Copy this into your agent&apos;s system prompt or instructions file.</Text>
          <div className="relative">
            <pre className="p-4 rounded-xl bg-(--surface-muted) border border-(--border) text-xs overflow-x-auto whitespace-pre-wrap text-(--foreground)">{agentPrompt}</pre>
            <button onClick={() => copy('prompt', agentPrompt)} className="absolute top-2 right-2 p-2 rounded-lg bg-(--surface) border border-(--border) text-(--muted) hover:text-(--foreground) transition-colors">
              {copiedKey === 'prompt' ? <Check size={14} className="text-(--brand-600)" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
