'use client';

import { Badge, EmptyState, Text, Timeline, TimelineItem } from '@florexlabs/ui';
import { Rocket, CheckCircle, Eye, ShieldCheck, XCircle, TestTube, ChatText, User, Robot } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { useEvents, useResponses } from '@/lib/queries';
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

export function TimelineTab({ sessionId }: { sessionId: string }) {
  const { t } = useI18n();
  const { data: events = [] } = useEvents(sessionId);
  const { data: responses = [] } = useResponses(sessionId);

  return (
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
  );
}
