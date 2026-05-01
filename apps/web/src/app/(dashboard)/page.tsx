'use client';

import { useEffect, useState } from 'react';
import { EmptyState, Heading, Spinner, Status, Text } from '@florexlabs/ui';
import { ListChecks, Pulse, XCircle, Trash, ArrowRight } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import type { Session } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';

export default function SessionsPage() {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    bridgeApi.getSessions()
      .then(setSessions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const active = sessions.filter((s) => s.status === 'active').length;

  const remove = async (id: string) => {
    await bridgeApi.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-40"><Spinner className="size-5" /></div>;
  if (error) return <Text variant="danger">{error}</Text>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Heading as="h2" size="lg">{t('dashboard.title')}</Heading>
        <Text variant="muted" size="sm">{t('dashboard.subtitle')}</Text>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<ListChecks size={18} />} label={t('dashboard.totalSessions')} value={sessions.length} />
        <StatCard icon={<Pulse size={18} />} label={t('dashboard.active')} value={active} accent />
        <StatCard icon={<XCircle size={18} />} label={t('dashboard.closed')} value={sessions.length - active} />
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="flx-card py-16">
          <EmptyState title={t('dashboard.noSessions')} description={t('dashboard.noSessionsDesc')} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <a
              key={s.id}
              href={`/sessions/${s.id}`}
              className="flx-card flx-card-hover p-4 flex items-center gap-4 group cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm text-(--foreground)">{s.projectName}</span>
                  <span className="flx-pill text-[10px] py-0">{s.channelType}</span>
                  <Status value={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Status>
                </div>
                <div className="flex items-center gap-3 text-xs text-(--muted)">
                  <span>{t('dashboard.agent')}: {s.agentName}</span>
                  <span>·</span>
                  <span>{new Date(s.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); remove(s.id); }}
                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[rgb(239_68_68/0.1)] transition-all text-(--muted) hover:text-(--danger)"
              >
                <Trash size={15} />
              </button>
              <ArrowRight size={16} className="text-(--muted) opacity-0 group-hover:opacity-60 transition-opacity" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-(--border) bg-(--surface) p-4 flex items-center gap-3">
      <div className={`size-9 rounded-lg flex items-center justify-center ${accent ? 'bg-[rgb(189_241_70/0.1)] text-(--brand-600)' : 'bg-(--surface-muted) text-(--muted)'}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold font-display text-(--foreground)">{value}</p>
        <p className="text-[11px] text-(--muted)">{label}</p>
      </div>
    </div>
  );
}
