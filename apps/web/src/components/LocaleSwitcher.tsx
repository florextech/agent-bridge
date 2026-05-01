'use client';

import { Globe } from '@phosphor-icons/react';

export function LocaleSwitcher() {
  const current = typeof document !== 'undefined'
    ? (document.cookie.match(/locale=(\w+)/)?.[1] || 'en')
    : 'en';

  const toggle = () => {
    const next = current === 'en' ? 'es' : 'en';
    document.cookie = `locale=${next};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-(--muted) hover:text-(--foreground) hover:bg-(--surface-muted) transition-colors"
    >
      <Globe size={14} weight="duotone" />
      {current === 'en' ? 'Español' : 'English'}
    </button>
  );
}
