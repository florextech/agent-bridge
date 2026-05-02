'use client';

import { EmptyState, Heading, Spinner, Text } from '@florexlabs/ui';
import { ListChecks, Pulse, XCircle } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { useSessions, useDeleteSession } from '@/lib/queries';
import { StatCard } from '@/components/StatCard';
import { SessionCard } from '@/components/SessionCard';

export default function SessionsPage() {
  const { t } = useI18n();
  const { data: sessions = [], isLoading, error } = useSessions();
  const deleteMutation = useDeleteSession();

  const active = sessions.filter((s) => s.status === 'active').length;

  if (isLoading) return <div className="flex items-center justify-center h-40"><Spinner className="size-5" /></div>;
  if (error) return <Text variant="danger">{error.message}</Text>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h2" size="lg">{t('dashboard.title')}</Heading>
        <Text variant="muted" size="sm">{t('dashboard.subtitle')}</Text>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<ListChecks size={18} />} label={t('dashboard.totalSessions')} value={sessions.length} />
        <StatCard icon={<Pulse size={18} />} label={t('dashboard.active')} value={active} accent />
        <StatCard icon={<XCircle size={18} />} label={t('dashboard.closed')} value={sessions.length - active} />
      </div>

      {sessions.length === 0 ? (
        <div className="flx-card py-16">
          <EmptyState title={t('dashboard.noSessions')} description={t('dashboard.noSessionsDesc')} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </div>
      )}
    </div>
  );
}
