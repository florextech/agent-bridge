'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Heading, Input, Label, Text } from '@florexlabs/ui';
import { ChannelType } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';

export default function SettingsPage() {
  const [form, setForm] = useState({ projectName: '', agentName: '', botToken: '', chatId: '' });
  const [result, setResult] = useState('');

  const handleCreate = async () => {
    try {
      const session = await bridgeApi.createSession({
        projectName: form.projectName,
        agentName: form.agentName,
        channelType: ChannelType.Telegram,
        channelConfig: { botToken: form.botToken, chatId: form.chatId },
      });
      setResult(`Session created: ${session.id}`);
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <Heading as="h2">Channel Settings</Heading>
      <Text className="text-neutral-400">Configure your Telegram bot to receive agent notifications.</Text>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Configuration</CardTitle>
          <CardDescription>Create a session linked to a Telegram bot.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" placeholder="my-project" value={form.projectName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, projectName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agentName">Agent Name</Label>
            <Input id="agentName" placeholder="codex" value={form.agentName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, agentName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="botToken">Bot Token</Label>
            <Input id="botToken" type="password" placeholder="123456:ABC-DEF..." value={form.botToken} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, botToken: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chatId">Chat ID</Label>
            <Input id="chatId" placeholder="-1001234567890" value={form.chatId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, chatId: e.target.value })} />
          </div>
          <Button onClick={handleCreate}>Create Session</Button>
          {result && <Text className="text-sm text-neutral-400">{result}</Text>}
        </CardContent>
      </Card>
    </div>
  );
}
