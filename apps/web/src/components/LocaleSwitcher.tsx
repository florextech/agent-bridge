'use client';

import { useState, useEffect } from 'react';
import { Globe } from '@phosphor-icons/react';

export function LocaleSwitcher() {
  const [locale, setLocale] = useState<string | null>(null);

  useEffect(() => {
    setLocale(document.cookie.match(/locale=(\w+)/)?.[1] || 'en');
  }, []);

  const toggle = () => {
    const next = locale === 'en' ? 'es' : 'en';
    document.cookie = `locale=${next};path=/;max-age=31536000`;
    window.location.reload();
  };

  if (!locale) return null;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-(--muted) hover:text-(--foreground) hover:bg-(--surface-muted) transition-colors"
    >
      <Globe size={14} weight="duotone" />
      {locale === 'en' ? 'Español' : 'English'}
    </button>
  );
}
