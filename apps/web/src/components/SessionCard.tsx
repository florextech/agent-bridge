'use client';

import { Status } from '@florexlabs/ui';
import { Trash, ArrowRight } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import type { Session } from '@agent-bridge/core';

export function SessionCard({ session: s, onDelete }: Readonly<{ session: Session; onDelete: (id: string) => void }>) {
  const { t } = useI18n();

  return (
    <a
      href={`/sessions/${s.id}`}
      className="flx-card flx-card-hover p-4 flex items-center gap-4 group cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm text-(--foreground)">{s.projectName}</span>
          <span className="flx-pill text-[10px] py-0">{s.channelType}</span>
          <Status value={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Status>
        </div>
        <div className="flex items-center gap-3 text-xs text-(--muted)">
          <span>{t('dashboard.agent')}: {s.agentName}</span>
          <span>·</span>
          <span>{new Date(s.updatedAt).toLocaleString()}</span>
        </div>
      </div>
      <button
        title='delete'
        onClick={(e) => { e.preventDefault(); onDelete(s.id); }}
        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[rgb(239_68_68/0.1)] transition-all text-(--muted) hover:text-(--danger)"
      >
        <Trash size={15} />
      </button>
      <ArrowRight size={16} className="text-(--muted) opacity-0 group-hover:opacity-60 transition-opacity" />
    </a>
  );
}
