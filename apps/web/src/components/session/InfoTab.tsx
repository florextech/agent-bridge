'use client';

import { DataList, DataListItem, Status } from '@florexlabs/ui';
import { useI18n } from '@/lib/i18n';
import type { Session } from '@agent-bridge/core';

export function InfoTab({ session }: Readonly<{ session: Session }>) {
  const { t } = useI18n();

  return (
    <div className="flx-card">
      <p className="uppercase tracking-[0.18em] text-xs font-semibold text-(--brand-600) mb-4">{t('session.sessionInfo')}</p>
      <DataList>
        <DataListItem label={t('dashboard.channel')}><span className="flx-pill">{session.channelType}</span></DataListItem>
        <DataListItem label={t('dashboard.status')}><Status value={session.status === 'active' ? 'success' : 'neutral'}>{session.status}</Status></DataListItem>
        <DataListItem label={t('session.created')}>{new Date(session.createdAt).toLocaleString()}</DataListItem>
        <DataListItem label={t('session.updated')}>{new Date(session.updatedAt).toLocaleString()}</DataListItem>
      </DataList>
    </div>
  );
}
