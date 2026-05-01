'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, Heading, Status, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@florexlabs/ui';
import type { Session } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    bridgeApi.getSessions().then(setSessions).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Heading as="h2">Sessions</Heading>
      <Text className="text-neutral-400">Active agent sessions across all projects.</Text>

      {error && <Text className="text-red-400">{error}</Text>}

      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <Text className="text-neutral-500">No sessions yet. Send an event from an agent to create one.</Text>
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
                      <a href={`/sessions/${s.id}`} className="text-blue-400 hover:underline">{s.projectName}</a>
                    </TableCell>
                    <TableCell>{s.agentName}</TableCell>
                    <TableCell><Badge>{s.channelType}</Badge></TableCell>
                    <TableCell><Status value={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Status></TableCell>
                    <TableCell className="text-neutral-500 text-sm">{s.updatedAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
