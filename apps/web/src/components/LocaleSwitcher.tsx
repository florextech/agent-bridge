'use client';

import { Globe } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';

export function LocaleSwitcher() {
  const { locale, toggle } = useI18n();

  return (
    <button onClick={toggle} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-(--muted) hover:text-(--foreground) hover:bg-(--surface-muted) transition-colors">
      <Globe size={14} weight="duotone" />
      {locale === 'en' ? 'Español' : 'English'}
    </button>
  );
}
