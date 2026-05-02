'use client';

import { useReducer } from 'react';
import { Alert, Badge, Button, Input, Label, Text } from '@florexlabs/ui';
import { TelegramLogo, UserCheck, UserMinus, Copy, Check, Trash, WhatsappLogo, DiscordLogo, SlackLogo, EnvelopeSimple } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { useTelegramStatus, useTelegramUsers, useSetupTelegram, useToggleTelegramAuth, useRemoveTelegramUser } from '@/lib/queries';

type TelegramState = {
  result: { ok: boolean; msg: string } | null;
  copied: boolean;
};

type TelegramAction =
  | { type: 'SET_RESULT'; payload: { ok: boolean; msg: string } | null }
  | { type: 'SET_COPIED'; payload: boolean };

function telegramReducer(state: TelegramState, action: TelegramAction): TelegramState {
  switch (action.type) {
    case 'SET_RESULT': return { ...state, result: action.payload };
    case 'SET_COPIED': return { ...state, copied: action.payload };
    default: return state;
  }
}

export function TelegramTab({ botToken, onBotTokenChange }: Readonly<{ botToken: string; onBotTokenChange: (v: string) => void }>) {
  const { t } = useI18n();
  const [state, dispatch] = useReducer(telegramReducer, { result: null, copied: false });
  const { data: telegramStatus } = useTelegramStatus();
  const botUsername = telegramStatus?.botUsername ?? null;
  const { data: users = [] } = useTelegramUsers();
  const setupMutation = useSetupTelegram();
  const toggleAuthMutation = useToggleTelegramAuth();
  const removeMutation = useRemoveTelegramUser();

  const setupBot = () => {
    if (!botToken) return dispatch({ type: 'SET_RESULT', payload: { ok: false, msg: 'Enter your bot token first' } });
    setupMutation.mutate(botToken, {
      onSuccess: (res) => {
        if (res.ok && res.botUsername) {
          dispatch({ type: 'SET_RESULT', payload: { ok: true, msg: `Connected to @${res.botUsername}!` } });
        } else {
          dispatch({ type: 'SET_RESULT', payload: { ok: false, msg: res.error ?? 'Failed' } });
        }
      },
      onError: (err) => dispatch({ type: 'SET_RESULT', payload: { ok: false, msg: err.message } }),
    });
  };

  const copyLink = () => {
    if (botUsername) {
      navigator.clipboard.writeText(`https://t.me/${botUsername}`);
      dispatch({ type: 'SET_COPIED', payload: true });
      setTimeout(() => dispatch({ type: 'SET_COPIED', payload: false }), 2000);
    }
  };

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
              <Input id="botToken" type="password" placeholder="123456:ABC-DEF..." value={botToken} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onBotTokenChange(e.target.value)} />
            </div>
            <Button onClick={setupBot} size="sm">{botUsername ? t('settings.reconnect') : t('settings.connect')}</Button>
            {state.result && <Alert variant={state.result.ok ? 'success' : 'danger'}>{state.result.msg}</Alert>}
          </div>
        </div>

        {botUsername && (
          <div className="flx-card">
            <p className="font-display text-sm font-semibold mb-2">{t('settings.shareLink')}</p>
            <Text variant="muted" size="xs" className="mb-3">{t('settings.shareLinkDesc')}</Text>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-(--surface-muted) border border-(--border)">
              <code className="flex-1 text-xs text-(--brand-600) truncate">https://t.me/{botUsername}</code>
              <button onClick={copyLink} className="p-1.5 rounded hover:bg-(--surface) text-(--muted) hover:text-(--foreground) transition-colors">
                {state.copied ? <Check size={14} className="text-(--brand-600)" /> : <Copy size={14} />}
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

function ComingSoon({ name, icon, color }: Readonly<{ name: string; icon: React.ReactNode; color: string }>) {
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
