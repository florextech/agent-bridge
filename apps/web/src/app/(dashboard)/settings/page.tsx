'use client';

import { useState } from 'react';
import { Alert, Badge, Button, Heading, Input, Label, Text, Tabs, TabsList, TabsTrigger, TabsContent } from '@florexlabs/ui';
import { TelegramLogo, Robot, Users, UserCheck, UserMinus, Copy, Check, Envelope, UserPlus, Trash, Shield, WhatsappLogo, DiscordLogo, SlackLogo, EnvelopeSimple } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { ChannelType } from '@agent-bridge/core';
import { bridgeApi } from '@/lib/api';
import type { AppUser } from '@/lib/api';
import { useTelegramStatus, useTelegramUsers, useSetupTelegram, useToggleTelegramAuth, useRemoveTelegramUser, useCreateSession, useUsers, useInvite, useDeleteUser } from '@/lib/queries';

export default function SettingsPage() {
  const { t } = useI18n();
  const [botToken, setBotToken] = useState('');
  const { data: telegramStatus } = useTelegramStatus();
  const botUsername = telegramStatus?.botUsername ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h2" size="lg">{t('settings.title')}</Heading>
        <Text variant="muted" size="sm">{t('settings.subtitle')}</Text>
      </div>

      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections"><span className="inline-flex items-center gap-1.5"><TelegramLogo size={15} weight="duotone" /> {t('settings.connections')}</span></TabsTrigger>
          <TabsTrigger value="sessions"><span className="inline-flex items-center gap-1.5"><Robot size={15} weight="duotone" /> Sessions</span></TabsTrigger>
          <TabsTrigger value="team"><span className="inline-flex items-center gap-1.5"><Users size={15} weight="duotone" /> Team</span></TabsTrigger>
        </TabsList>

        <TabsContent value="connections"><ConnectionsTab botToken={botToken} setBotToken={setBotToken} botUsername={botUsername} /></TabsContent>
        <TabsContent value="sessions"><SessionsTab botToken={botToken} /></TabsContent>
        <TabsContent value="team"><TeamTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Connections ─── */
function ConnectionsTab({ botToken, setBotToken, botUsername }: { botToken: string; setBotToken: (v: string) => void; botUsername: string | null }) {
  const { t } = useI18n();
  const { data: users = [] } = useTelegramUsers();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const setupMutation = useSetupTelegram();
  const toggleAuthMutation = useToggleTelegramAuth();
  const removeMutation = useRemoveTelegramUser();

  const setupBot = () => {
    if (!botToken) return setResult({ ok: false, msg: 'Enter your bot token first' });
    setupMutation.mutate(botToken, {
      onSuccess: (res) => {
        if (res.ok && res.botUsername) {
          setResult({ ok: true, msg: `Connected to @${res.botUsername}!` });
        } else {
          setResult({ ok: false, msg: res.error || 'Failed' });
        }
      },
      onError: (err) => setResult({ ok: false, msg: err.message }),
    });
  };

  const copyLink = () => { if (botUsername) { navigator.clipboard.writeText(`https://t.me/${botUsername}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: Connection */}
      <div className="flex flex-col gap-4">
        <div className="flx-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-9 rounded-lg bg-[rgb(0_136_204/0.15)] flex items-center justify-center">
              <TelegramLogo size={20} weight="duotone" className="text-[#0088cc]" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold">{t('settings.connectBot')}</p>
              <Text variant="muted" size="xs">{t('settings.connectBotDesc')}</Text>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="botToken" className="text-xs">{t('settings.botToken')}</Label>
              <Input id="botToken" type="password" placeholder="123456:ABC-DEF..." value={botToken} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBotToken(e.target.value)} />
            </div>
            <Button onClick={setupBot} size="sm">{botUsername ? t('settings.reconnect') : t('settings.connect')}</Button>
            {result && <Alert variant={result.ok ? 'success' : 'danger'}>{result.msg}</Alert>}
          </div>
        </div>

        {botUsername && (
          <div className="flx-card">
            <p className="font-display text-sm font-semibold mb-2">{t('settings.shareLink')}</p>
            <Text variant="muted" size="xs" className="mb-3">{t('settings.shareLinkDesc')}</Text>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-(--surface-muted) border border-(--border)">
              <code className="flex-1 text-xs text-(--brand-600) truncate">https://t.me/{botUsername}</code>
              <button onClick={copyLink} className="p-1.5 rounded hover:bg-(--surface) text-(--muted) hover:text-(--foreground) transition-colors">
                {copied ? <Check size={14} className="text-(--brand-600)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Users */}
      <div className="flx-card">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-sm font-semibold">{t('settings.authorizedUsers')}</p>
          {users.length > 0 && <Badge tone="brand">{users.filter((u) => u.authorized).length} {t('settings.active')}</Badge>}
        </div>
        <Text variant="muted" size="xs" className="mb-3">{users.length} {t('settings.usersLinked')}</Text>
        {users.length === 0 ? (
          <Text variant="muted" size="sm">{t('settings.noUsers')}</Text>
        ) : (
          <div className="flex flex-col gap-1.5">
            {users.map((u) => (
              <div key={u.chatId} className="flex items-center gap-2 p-2.5 rounded-lg bg-(--surface-muted) border border-(--border)">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{u.firstName || u.username || u.chatId}</p>
                  <p className="text-[10px] text-(--muted)">{u.username ? `@${u.username}` : `ID: ${u.chatId}`}</p>
                </div>
                <Badge tone={u.authorized ? 'success' : 'warning'}>{u.authorized ? t('settings.active') : t('settings.pending')}</Badge>
                {!u.authorized && (
                  <button onClick={() => toggleAuthMutation.mutate(u.chatId)} className="p-1.5 rounded hover:bg-[rgb(189_241_70/0.1)] text-(--muted) hover:text-(--brand-600) transition-colors" title="Approve">
                    <UserCheck size={14} />
                  </button>
                )}
                {u.authorized && (
                  <button onClick={() => toggleAuthMutation.mutate(u.chatId)} className="p-1.5 rounded hover:bg-[rgb(245_158_11/0.1)] text-(--muted) hover:text-(--warning) transition-colors" title="Revoke">
                    <UserMinus size={14} />
                  </button>
                )}
                <button onClick={() => removeMutation.mutate(u.chatId)} className="p-1.5 rounded hover:bg-[rgb(239_68_68/0.1)] text-(--muted) hover:text-(--danger) transition-colors" title="Remove">
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coming soon channels */}
      <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <ComingSoon name="WhatsApp" icon={<WhatsappLogo size={18} weight="duotone" className="text-[#25D366]" />} color="rgb(37 211 102 / 0.15)" />
        <ComingSoon name="Discord" icon={<DiscordLogo size={18} weight="duotone" className="text-[#5865F2]" />} color="rgb(88 101 242 / 0.15)" />
        <ComingSoon name="Slack" icon={<SlackLogo size={18} weight="duotone" className="text-[#E01E5A]" />} color="rgb(74 21 75 / 0.25)" />
        <ComingSoon name="Email" icon={<EnvelopeSimple size={18} weight="duotone" className="text-(--brand-600)" />} color="rgb(189 241 70 / 0.1)" />
      </div>
    </div>
  );
}

/* ─── Sessions ─── */
function SessionsTab({ botToken }: { botToken: string }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ projectName: '', agentName: '' });
  const [session, setSession] = useState<{ id: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState('');
  const createMutation = useCreateSession();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const copy = (key: string, text: string) => { navigator.clipboard.writeText(text); setCopiedKey(key); setTimeout(() => setCopiedKey(''), 2000); };

  const create = () => {
    createMutation.mutate(
      { projectName: form.projectName || 'my-project', agentName: form.agentName || 'codex', channelType: ChannelType.Telegram, channelConfig: { botToken } },
      { onSuccess: (s) => setSession(s) },
    );
  };

  const apiUrl = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : 'http://localhost:3001';

  const agentPrompt = session ? `You have access to Agent Bridge for notifications.\nSession ID: ${session.id}\nAPI: ${apiUrl}\n\nNotify me with:\ncurl -X POST ${apiUrl}/agent-events -H "Content-Type: application/json" -d '{"sessionId":"${session.id}","type":"TYPE","payload":{"summary":"DESCRIPTION"}}'\n\nEvent types: task_started, task_completed, needs_review, needs_approval, error, test_results, message\n\nCheck responses: curl ${apiUrl}/agent-sessions/${session.id}/responses\nMark read: curl -X POST ${apiUrl}/agent-sessions/${session.id}/mark-read` : '';

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: Create */}
      <div className="flx-card">
        <p className="font-display text-sm font-semibold mb-1">{t('settings.quickSession')}</p>
        <Text variant="muted" size="xs" className="mb-4">{t('settings.quickSessionDesc')}</Text>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="qProject" className="text-xs">{t('settings.projectName')}</Label>
            <Input id="qProject" placeholder="my-project" value={form.projectName} onChange={set('projectName')} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="qAgent" className="text-xs">{t('settings.agentName')}</Label>
            <Input id="qAgent" placeholder="codex" value={form.agentName} onChange={set('agentName')} />
          </div>
          <Button onClick={create} size="sm">{t('settings.createSession')}</Button>
        </div>
        {session && (
          <div className="mt-4 pt-4 border-t border-(--border)">
            <Alert variant="success">Session created!</Alert>
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-(--surface-muted) border border-(--border)">
              <code className="flex-1 text-xs text-(--brand-600) truncate">{session.id}</code>
              <button onClick={() => copy('id', session.id)} className="p-1.5 rounded hover:bg-(--surface) text-(--muted) hover:text-(--foreground) transition-colors">
                {copiedKey === 'id' ? <Check size={14} className="text-(--brand-600)" /> : <Copy size={14} />}
              </button>
            </div>
            <button onClick={() => setSession(null)} className="mt-2 text-xs text-(--muted) hover:text-(--foreground) transition-colors">+ Create another</button>
          </div>
        )}
      </div>

      {/* Right: Instructions */}
      <div className="flx-card">
        <p className="font-display text-sm font-semibold mb-1">Agent Instructions</p>
        <Text variant="muted" size="xs" className="mb-3">Paste into your agent&apos;s system prompt</Text>
        {session ? (
          <div className="relative">
            <pre className="p-3 rounded-lg bg-(--surface-muted) border border-(--border) text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap text-(--foreground) max-h-[400px] overflow-y-auto">{agentPrompt}</pre>
            <button onClick={() => copy('prompt', agentPrompt)} className="absolute top-2 right-2 p-1.5 rounded bg-(--surface) border border-(--border) text-(--muted) hover:text-(--foreground) transition-colors">
              {copiedKey === 'prompt' ? <Check size={12} className="text-(--brand-600)" /> : <Copy size={12} />}
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-lg bg-(--surface-muted) border border-(--border) text-center">
            <Text variant="muted" size="sm">Create a session to see the instructions</Text>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Team ─── */
function TeamTab() {
  const { t } = useI18n();
  const { data: users = [] } = useUsers();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const inviteMutation = useInvite();
  const deleteMutation = useDeleteUser();

  const sendInvite = () => {
    if (!inviteEmail) return;
    inviteMutation.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => { setResult({ ok: true, msg: `Invitation sent to ${inviteEmail}` }); setInviteEmail(''); },
        onError: (err) => setResult({ ok: false, msg: err.message }),
      },
    );
  };

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: Invite */}
      <div className="flx-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-9 rounded-lg bg-[rgb(118_183_61/0.15)] flex items-center justify-center">
            <Envelope size={20} weight="duotone" className="text-(--brand-600)" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold">{t('settings.inviteMember')}</p>
            <Text variant="muted" size="xs">{t('settings.sendInvitation')}</Text>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="inviteEmail" className="text-xs">{t('settings.email')}</Label>
            <Input id="inviteEmail" type="email" placeholder="user@example.com" value={inviteEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="inviteRole" className="text-xs">{t('settings.role')}</Label>
            <select id="inviteRole" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) text-sm text-(--foreground)">
              <option value="member">{t('settings.member')}</option>
              <option value="admin">{t('settings.admin')}</option>
            </select>
          </div>
          <Button onClick={sendInvite} size="sm"><UserPlus size={14} weight="bold" className="mr-1.5" />{t('settings.sendInvite')}</Button>
          {result && <Alert variant={result.ok ? 'success' : 'danger'}>{result.msg}</Alert>}
        </div>
      </div>

      {/* Right: User list */}
      <div className="flx-card">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-sm font-semibold">{t('settings.teamMembers')}</p>
          <Text variant="muted" size="xs">{users.length} user(s)</Text>
        </div>
        {users.length === 0 ? (
          <div className="p-6 rounded-lg bg-(--surface-muted) border border-(--border) text-center">
            <Text variant="muted" size="sm">No users yet</Text>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-(--surface-muted) border border-(--border)">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{u.name || u.email}</p>
                  <p className="text-[10px] text-(--muted)">{u.email}</p>
                </div>
                <Badge tone={u.role === 'admin' ? 'brand' : 'neutral'}>
                  {u.role === 'admin' && <Shield size={10} weight="bold" className="mr-0.5" />}
                  {u.role}
                </Badge>
                <button onClick={() => deleteMutation.mutate(u.id)} className="p-1.5 rounded hover:bg-(--surface) text-(--muted) hover:text-(--danger) transition-colors">
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ComingSoon({ name, icon, color }: { name: string; icon: React.ReactNode; color: string }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-(--border) bg-(--surface) p-3 flex items-center gap-2.5 opacity-50">
      <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: color }}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-(--foreground)">{name}</p>
        <p className="text-[10px] text-(--muted)">{t('settings.comingSoon')}</p>
      </div>
    </div>
  );
}
