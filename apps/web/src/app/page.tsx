'use client';

import { useEffect, useState } from 'react';
import { Badge, EmptyState, Heading, Spinner, Stat, Status, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@florexlabs/ui';
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

  if (loading) return <Spinner />;
  if (error) return <Text variant="danger">{error}</Text>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h2" size="lg">Sessions</Heading>
        <Text variant="muted">Active agent sessions across all projects.</Text>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total Sessions" value={String(sessions.length)} />
        <Stat label="Active" value={String(active)} trend="up" />
        <Stat label="Closed" value={String(sessions.length - active)} trend="neutral" />
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="No sessions yet" description="Send an event from an agent to create one." />
      ) : (
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
                  <a href={`/sessions/${s.id}`} className="text-(--brand-600) hover:underline">{s.projectName}</a>
                </TableCell>
                <TableCell>{s.agentName}</TableCell>
                <TableCell><Badge tone="neutral">{s.channelType}</Badge></TableCell>
                <TableCell><Status value={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Status></TableCell>
                <TableCell><Text variant="muted" size="sm">{new Date(s.updatedAt).toLocaleString()}</Text></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
