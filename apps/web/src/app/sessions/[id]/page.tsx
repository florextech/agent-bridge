'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Badge, DataList, DataListItem, EmptyState, Heading, Spinner, Status, Text, Timeline, TimelineItem } from '@florexlabs/ui';
import { ArrowLeft, Rocket, CheckCircle, Eye, ShieldCheck, XCircle, TestTube, ChatText } from '@phosphor-icons/react';
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

  const unread = responses.filter((r) => !r.read).length;

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

      <div className="flx-card">
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-4">Event Timeline</p>
        {events.length === 0 ? (
          <EmptyState title="No events yet" description="Events will appear here when the agent sends them." />
        ) : (
          <Timeline>
            {events.map((ev) => (
              <TimelineItem key={ev.id} title={ev.type.replace(/_/g, ' ')} icon={EVENT_ICONS[ev.type] || <ChatText size={16} weight="duotone" />}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{ev.deliveryStatus}</Badge>
                  </div>
                  {typeof ev.payload['summary'] === 'string' && <Text variant="muted" size="sm">{ev.payload['summary']}</Text>}
                  <Text variant="muted" size="xs">{new Date(ev.createdAt).toLocaleString()}</Text>
                </div>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </div>

      <div className="flx-card">
        <div className="flex items-center gap-3 mb-4">
          <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600)">Responses</p>
          {unread > 0 && <Badge tone="brand">{unread} unread</Badge>}
        </div>
        {responses.length === 0 ? (
          <EmptyState title="No responses yet" description="Responses from the channel will appear here." />
        ) : (
          <div className="flex flex-col gap-3">
            {responses.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-4 rounded-xl bg-(--surface-muted) border border-(--border)">
                <div className="flex-1">
                  <Text>{r.content}</Text>
                  <Text variant="muted" size="xs">{new Date(r.createdAt).toLocaleString()}</Text>
                </div>
                {!r.read && <Badge tone="warning">unread</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
