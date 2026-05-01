'use client';

import { useEffect, useState } from 'react';
import { Badge, EmptyState, Heading, Spinner, Stat, Status, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@florexlabs/ui';
import { ListChecks, Pulse, XCircle, Trash } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import type { Session } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';

export default function SessionsPage() {
  const t = useTranslations('dashboard');
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

  if (loading) return <div className="flex items-center justify-center h-32"><Spinner className="size-5" /></div>;
  if (error) return <Text variant="danger">{error}</Text>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-2">{t('eyebrow')}</p>
        <Heading as="h2" size="lg">{t('title')}</Heading>
        <Text variant="muted" size="sm">{t('subtitle')}</Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flx-card flx-card-hover flex items-start gap-4">
          <div className="size-10 rounded-xl bg-[rgb(189_241_70/0.1)] flex items-center justify-center shrink-0">
            <ListChecks size={22} className="text-(--brand-600)" weight="duotone" />
          </div>
          <Stat label={t('totalSessions')} value={String(sessions.length)} />
        </div>
        <div className="flx-card flx-card-hover flex items-start gap-4">
          <div className="size-10 rounded-xl bg-[rgb(189_241_70/0.1)] flex items-center justify-center shrink-0">
            <Pulse size={22} className="text-(--brand-600)" weight="duotone" />
          </div>
          <Stat label={t('active')} value={String(active)} trend="up" />
        </div>
        <div className="flx-card flx-card-hover flex items-start gap-4">
          <div className="size-10 rounded-xl bg-[rgb(189_241_70/0.1)] flex items-center justify-center shrink-0">
            <XCircle size={22} className="text-(--muted)" weight="duotone" />
          </div>
          <Stat label={t('closed')} value={String(sessions.length - active)} trend="neutral" />
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="flx-card p-10">
          <EmptyState title={t('noSessions')} description={t('noSessionsDesc')} />
        </div>
      ) : (
        <div className="flx-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('project')}</TableHead>
                <TableHead>{t('agent')}</TableHead>
                <TableHead>{t('channel')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('updated')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <a href={`/sessions/${s.id}`} className="text-(--brand-600) hover:text-(--brand-700) hover:underline font-medium">{s.projectName}</a>
                  </TableCell>
                  <TableCell><Text size="sm">{s.agentName}</Text></TableCell>
                  <TableCell><span className="flx-pill">{s.channelType}</span></TableCell>
                  <TableCell><Status value={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Status></TableCell>
                  <TableCell><Text variant="muted" size="xs">{new Date(s.updatedAt).toLocaleString()}</Text></TableCell>
                  <TableCell>
                    <button onClick={() => remove(s.id)} className="p-2 rounded-lg hover:bg-(--surface-muted) transition-colors text-(--muted) hover:text-(--danger)">
                      <Trash size={16} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
