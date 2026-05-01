'use client';

import { useState } from 'react';
import { Alert, Button, Heading, Input, Label, Text } from '@florexlabs/ui';
import { ChannelType } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';

export default function SettingsPage() {
  const [form, setForm] = useState({ projectName: '', agentName: '', botToken: '', chatId: '' });
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreate = async () => {
    try {
      const session = await bridgeApi.createSession({
        projectName: form.projectName,
        agentName: form.agentName,
        channelType: ChannelType.Telegram,
        channelConfig: { botToken: form.botToken, chatId: form.chatId },
      });
      setResult({ ok: true, msg: `Session created: ${session.id}` });
    } catch (e) {
      setResult({ ok: false, msg: (e as Error).message });
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div>
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-2">Configuration</p>
        <Heading as="h2" size="lg">Channel Settings</Heading>
        <Text variant="muted" size="sm">Configure your Telegram bot to receive agent notifications.</Text>
      </div>

      <div className="flx-card">
        <p className="font-display text-xl font-semibold mb-1">Telegram</p>
        <Text variant="muted" size="sm" className="mb-6">Create a session linked to a Telegram bot.</Text>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" placeholder="my-project" value={form.projectName} onChange={set('projectName')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agentName">Agent Name</Label>
            <Input id="agentName" placeholder="codex" value={form.agentName} onChange={set('agentName')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="botToken">Bot Token</Label>
            <Input id="botToken" type="password" placeholder="123456:ABC-DEF..." value={form.botToken} onChange={set('botToken')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chatId">Chat ID</Label>
            <Input id="chatId" placeholder="-1001234567890" value={form.chatId} onChange={set('chatId')} />
          </div>
          <Button onClick={handleCreate}>Create Session</Button>
          {result && <Alert variant={result.ok ? 'success' : 'danger'}>{result.msg}</Alert>}
        </div>
      </div>
    </div>
  );
}
