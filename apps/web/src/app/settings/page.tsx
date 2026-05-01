'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Heading, Input, Label, Text } from '@florexlabs/ui';
import { TelegramLogo, UserCheck, UserMinus, Copy, Check } from '@phosphor-icons/react';
import { ChannelType } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';
import type { TelegramUser } from '@/lib/api';

export default function SettingsPage() {
  const [botToken, setBotToken] = useState('');
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bridgeApi.getTelegramUsers().then(setUsers).catch(() => {});
    bridgeApi.getTelegramStatus().then((s) => { if (s.botUsername) setBotUsername(s.botUsername); }).catch(() => {});
  }, []);

  const setupBot = async () => {
    if (!botToken) return setResult({ ok: false, msg: 'Enter your bot token first' });
    const res = await bridgeApi.setupTelegram(botToken);
    if (res.ok && res.botUsername) {
      setBotUsername(res.botUsername);
      setResult({ ok: true, msg: `Connected to @${res.botUsername}! Share the link below.` });
    } else {
      setResult({ ok: false, msg: res.error || 'Failed to connect' });
    }
  };

  const toggleAuth = async (chatId: string) => {
    await bridgeApi.toggleTelegramAuth(chatId);
    setUsers(await bridgeApi.getTelegramUsers());
  };

  const removeUser = async (chatId: string) => {
    await bridgeApi.removeTelegramUser(chatId);
    setUsers(await bridgeApi.getTelegramUsers());
  };

  const copyLink = () => {
    if (botUsername) {
      navigator.clipboard.writeText(`https://t.me/${botUsername}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <div>
        <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-2">Configuration</p>
        <Heading as="h2" size="lg">Telegram Setup</Heading>
        <Text variant="muted" size="sm">Connect your bot and manage who receives notifications.</Text>
      </div>

      {/* Step 1: Connect bot */}
      <div className="flx-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-[rgb(0_136_204/0.15)] flex items-center justify-center">
            <TelegramLogo size={22} weight="duotone" className="text-[#0088cc]" />
          </div>
          <div>
            <p className="font-display font-semibold">1. Connect Bot</p>
            <Text variant="muted" size="xs">Paste your bot token from @BotFather</Text>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="botToken">Bot Token</Label>
            <Input id="botToken" type="password" placeholder="123456:ABC-DEF..." value={botToken} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBotToken(e.target.value)} />
          </div>
          <Button onClick={setupBot}>{botUsername ? 'Reconnect' : 'Connect Bot'}</Button>
          {result && <Alert variant={result.ok ? 'success' : 'danger'}>{result.msg}</Alert>}
        </div>
      </div>

      {/* Step 2: Share link */}
      {botUsername && (
        <div className="flx-card">
          <p className="font-display font-semibold mb-2">2. Share Link</p>
          <Text variant="muted" size="sm" className="mb-4">Anyone who clicks this link and presses Start will be auto-linked.</Text>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-(--surface-muted) border border-(--border)">
            <code className="flex-1 text-sm text-(--brand-600)">https://t.me/{botUsername}</code>
            <button onClick={copyLink} className="p-2 rounded-lg hover:bg-(--surface) transition-colors text-(--muted) hover:text-(--foreground)">
              {copied ? <Check size={16} weight="bold" className="text-(--brand-600)" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Users */}
      <div className="flx-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-display font-semibold">{botUsername ? '3. ' : ''}Authorized Users</p>
            <Text variant="muted" size="xs">{users.length} user(s) linked</Text>
          </div>
          {users.length > 0 && <Badge tone="brand">{users.filter((u) => u.authorized).length} active</Badge>}
        </div>
        {users.length === 0 ? (
          <Text variant="muted" size="sm">No users linked yet. Connect your bot and share the link.</Text>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.chatId} className="flex items-center gap-3 p-3 rounded-xl bg-(--surface-muted) border border-(--border)">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.firstName || u.username || u.chatId}</p>
                  <p className="text-xs text-(--muted)">{u.username ? `@${u.username}` : `ID: ${u.chatId}`}</p>
                </div>
                <Badge tone={u.authorized ? 'success' : 'neutral'}>{u.authorized ? 'active' : 'paused'}</Badge>
                <button onClick={() => toggleAuth(u.chatId)} className="p-2 rounded-lg hover:bg-(--surface) transition-colors text-(--muted) hover:text-(--foreground)" title={u.authorized ? 'Pause' : 'Activate'}>
                  <UserCheck size={16} weight={u.authorized ? 'fill' : 'regular'} />
                </button>
                <button onClick={() => removeUser(u.chatId)} className="p-2 rounded-lg hover:bg-(--surface) transition-colors text-(--muted) hover:text-(--danger)" title="Remove">
                  <UserMinus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick session */}
      {botUsername && (
        <div className="flx-card">
          <p className="font-display font-semibold mb-2">Quick Session</p>
          <Text variant="muted" size="sm" className="mb-4">Create a session that notifies all authorized users.</Text>
          <QuickSession botToken={botToken} />
        </div>
      )}
    </div>
  );
}

function QuickSession({ botToken }: { botToken: string }) {
  const [form, setForm] = useState({ projectName: '', agentName: '' });
  const [msg, setMsg] = useState('');
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const create = async () => {
    const s = await bridgeApi.createSession({
      projectName: form.projectName,
      agentName: form.agentName,
      channelType: ChannelType.Telegram,
      channelConfig: { botToken },
    });
    setMsg(`Created: ${s.id}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="qProject">Project</Label>
          <Input id="qProject" placeholder="my-project" value={form.projectName} onChange={set('projectName')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="qAgent">Agent</Label>
          <Input id="qAgent" placeholder="codex" value={form.agentName} onChange={set('agentName')} />
        </div>
      </div>
      <Button onClick={create}>Create Session</Button>
      {msg && <Alert variant="success">{msg}</Alert>}
    </div>
  );
}
