'use client';

import { useEffect, useState } from 'react';
import { Badge, EmptyState, Heading, Spinner, Stat, Status, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@florexlabs/ui';
import { ListChecks, Pulse, XCircle } from '@phosphor-icons/react';
import type { Session } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';

export default function SessionsPage() {
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

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  if (error) return <Text variant="danger">{error}</Text>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-2">Dashboard</p>
        <Heading as="h2" size="lg">Sessions</Heading>
        <Text variant="muted" size="sm">Active agent sessions across all projects.</Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flx-card flx-card-hover flex items-start gap-4">
          <div className="size-10 rounded-xl bg-[rgb(189_241_70/0.1)] flex items-center justify-center shrink-0">
            <ListChecks size={22} className="text-(--brand-600)" weight="duotone" />
          </div>
          <Stat label="Total Sessions" value={String(sessions.length)} />
        </div>
        <div className="flx-card flx-card-hover flex items-start gap-4">
          <div className="size-10 rounded-xl bg-[rgb(189_241_70/0.1)] flex items-center justify-center shrink-0">
            <Pulse size={22} className="text-(--brand-600)" weight="duotone" />
          </div>
          <Stat label="Active" value={String(active)} trend="up" />
        </div>
        <div className="flx-card flx-card-hover flex items-start gap-4">
          <div className="size-10 rounded-xl bg-[rgb(189_241_70/0.1)] flex items-center justify-center shrink-0">
            <XCircle size={22} className="text-(--muted)" weight="duotone" />
          </div>
          <Stat label="Closed" value={String(sessions.length - active)} trend="neutral" />
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="flx-card p-10">
          <EmptyState title="No sessions yet" description="Send an event from an agent to create your first session." />
        </div>
      ) : (
        <div className="flx-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
