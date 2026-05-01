'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, DataList, DataListItem, EmptyState, Heading, Spinner, Status, Text, Timeline, TimelineItem } from '@florexlabs/ui';
import type { AgentEvent, ChannelResponse, Session } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';

const EVENT_EMOJI: Record<string, string> = {
  task_started: '🚀',
  task_completed: '✅',
  needs_review: '👀',
  needs_approval: '🔐',
  error: '❌',
  test_results: '🧪',
  message: '💬',
};

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [responses, setResponses] = useState<ChannelResponse[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      bridgeApi.getSession(id),
      bridgeApi.getEvents(id),
      bridgeApi.getResponses(id),
    ])
      .then(([s, e, r]) => { setSession(s); setEvents(e); setResponses(r); })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <Text variant="danger">{error}</Text>;
  if (!session) return <Spinner />;

  const unread = responses.filter((r) => !r.read).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h2" size="lg">{session.projectName}</Heading>
        <Text variant="muted">Agent: {session.agentName}</Text>
      </div>

      <Card>
        <CardHeader><CardTitle>Session Info</CardTitle></CardHeader>
        <CardContent>
          <DataList>
            <DataListItem label="Channel"><Badge tone="neutral">{session.channelType}</Badge></DataListItem>
            <DataListItem label="Status"><Status value={session.status === 'active' ? 'success' : 'neutral'}>{session.status}</Status></DataListItem>
            <DataListItem label="Created">{new Date(session.createdAt).toLocaleString()}</DataListItem>
            <DataListItem label="Updated">{new Date(session.updatedAt).toLocaleString()}</DataListItem>
          </DataList>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Event Timeline</CardTitle></CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState title="No events yet" description="Events will appear here when the agent sends them." />
          ) : (
            <Timeline>
              {events.map((ev) => (
                <TimelineItem key={ev.id} title={`${EVENT_EMOJI[ev.type] || '📨'} ${ev.type}`} icon={<Badge tone="neutral">{ev.deliveryStatus}</Badge>}>
                  <div className="flex flex-col gap-1">
                    {typeof ev.payload['summary'] === 'string' && (
                      <Text variant="muted" size="sm">{ev.payload['summary']}</Text>
                    )}
                    <Text variant="muted" size="xs">{new Date(ev.createdAt).toLocaleString()}</Text>
                  </div>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Responses {unread > 0 && <Badge tone="brand">{unread} unread</Badge>}</CardTitle></CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <EmptyState title="No responses yet" description="Responses from the channel will appear here." />
          ) : (
            <div className="flex flex-col gap-3">
              {responses.map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-3 rounded-(--radius-sm) bg-(--surface-muted)">
                  <div className="flex-1">
                    <Text>{r.content}</Text>
                    <Text variant="muted" size="xs">{new Date(r.createdAt).toLocaleString()}</Text>
                  </div>
                  {!r.read && <Badge tone="warning">unread</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
