'use client';

import { useReducer } from 'react';
import { Alert, Badge, Button, Input, Label, Text } from '@florexlabs/ui';
import { Envelope, UserPlus, Trash, Shield } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { useUsers, useInvite, useDeleteUser } from '@/lib/queries';

type TeamState = {
  inviteEmail: string;
  inviteRole: string;
  result: { ok: boolean; msg: string } | null;
};

type TeamAction =
  | { type: 'SET_INVITE_EMAIL'; payload: string }
  | { type: 'SET_INVITE_ROLE'; payload: string }
  | { type: 'SET_RESULT'; payload: { ok: boolean; msg: string } | null };

function teamReducer(state: TeamState, action: TeamAction): TeamState {
  switch (action.type) {
    case 'SET_INVITE_EMAIL': return { ...state, inviteEmail: action.payload };
    case 'SET_INVITE_ROLE': return { ...state, inviteRole: action.payload };
    case 'SET_RESULT': return { ...state, result: action.payload };
    default: return state;
  }
}

export function TeamTab() {
  const { t } = useI18n();
  const { data: users = [] } = useUsers();
  const [state, dispatch] = useReducer(teamReducer, { inviteEmail: '', inviteRole: 'member', result: null });
  const inviteMutation = useInvite();
  const deleteMutation = useDeleteUser();

  const sendInvite = () => {
    if (!state.inviteEmail) return;
    inviteMutation.mutate(
      { email: state.inviteEmail, role: state.inviteRole },
      {
        onSuccess: () => { dispatch({ type: 'SET_RESULT', payload: { ok: true, msg: t('settings.invitationSent').replace('{email}', state.inviteEmail) } }); dispatch({ type: 'SET_INVITE_EMAIL', payload: '' }); },
        onError: (err) => dispatch({ type: 'SET_RESULT', payload: { ok: false, msg: err.message } }),
      },
    );
  };

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Input id="inviteEmail" type="email" placeholder="user@example.com" value={state.inviteEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_INVITE_EMAIL', payload: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="inviteRole" className="text-xs">{t('settings.role')}</Label>
            <select id="inviteRole" aria-label={t('settings.role')} value={state.inviteRole} onChange={(e) => dispatch({ type: 'SET_INVITE_ROLE', payload: e.target.value })} className="px-3 py-2 rounded-lg bg-(--surface-muted) border border-(--border) text-sm text-(--foreground)">
              <option value="member">{t('settings.member')}</option>
              <option value="admin">{t('settings.admin')}</option>
            </select>
          </div>
          <Button onClick={sendInvite} size="sm"><UserPlus size={14} weight="bold" className="mr-1.5" />{t('settings.sendInvite')}</Button>
          {state.result && <Alert variant={state.result.ok ? 'success' : 'danger'}>{state.result.msg}</Alert>}
        </div>
      </div>

      <div className="flx-card">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-sm font-semibold">{t('settings.teamMembers')}</p>
          <Text variant="muted" size="xs">{users.length} {t('settings.userCount')}</Text>
        </div>
        {users.length === 0 ? (
          <div className="p-6 rounded-lg bg-(--surface-muted) border border-(--border) text-center">
            <Text variant="muted" size="sm">{t('settings.noUsersYet')}</Text>
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
                <button onClick={() => deleteMutation.mutate(u.id)} className="p-1.5 rounded hover:bg-(--surface) text-(--muted) hover:text-(--danger) transition-colors" title={t('settings.remove')}>
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
