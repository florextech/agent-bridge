'use client';

import { useState } from 'react';
import { Alert, Button, Heading, Input, Label, Text } from '@florexlabs/ui';
import { TelegramLogo } from '@phosphor-icons/react';
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
        <Text variant="muted" size="sm">Configure messaging channels to receive agent notifications.</Text>
      </div>

      <div className="flx-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-[rgb(0_136_204/0.15)] flex items-center justify-center">
            <TelegramLogo size={22} weight="duotone" className="text-[#0088cc]" />
          </div>
          <div>
            <p className="font-display font-semibold">Telegram</p>
            <Text variant="muted" size="xs">Create a session linked to a Telegram bot.</Text>
          </div>
        </div>

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
