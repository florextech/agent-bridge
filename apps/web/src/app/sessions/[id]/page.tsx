'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, Heading, Status, Text, Timeline, TimelineItem } from '@florexlabs/ui';
import type { AgentEvent, ChannelResponse, Session } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';
import { use } from 'react';

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

  if (error) return <Text className="text-red-400">{error}</Text>;
  if (!session) return <Text className="text-neutral-500">Loading...</Text>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h2">{session.projectName}</Heading>
        <Text className="text-neutral-400">Agent: {session.agentName}</Text>
      </div>

      <div className="flex gap-3">
        <Badge>{session.channelType}</Badge>
        <Status value={session.status === 'active' ? 'success' : 'neutral'}>{session.status}</Status>
      </div>

      <Card>
        <CardHeader><CardTitle>Event Timeline</CardTitle></CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <Text className="text-neutral-500">No events yet.</Text>
          ) : (
            <Timeline>
              {events.map((ev) => (
                <TimelineItem key={ev.id} title={`${EVENT_EMOJI[ev.type] || '📨'} ${ev.type}`} icon={<Badge tone="neutral">{ev.deliveryStatus}</Badge>}>
                  <div className="flex flex-col gap-1">
                    {typeof ev.payload['summary'] === 'string' && (
                      <Text className="text-neutral-400 text-sm">{ev.payload['summary']}</Text>
                    )}
                    <Text className="text-neutral-600 text-xs">{ev.createdAt}</Text>
                  </div>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Responses ({responses.filter((r) => !r.read).length} unread)</CardTitle></CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <Text className="text-neutral-500">No responses yet.</Text>
          ) : (
            <div className="flex flex-col gap-3">
              {responses.map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900">
                  <div className="flex-1">
                    <Text>{r.content}</Text>
                    <Text className="text-neutral-600 text-xs">{r.createdAt}</Text>
                  </div>
                  {!r.read && <Badge>unread</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
