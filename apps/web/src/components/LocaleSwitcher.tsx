'use client';

import { useRouter } from 'next/navigation';

export function LocaleSwitcher() {
  const router = useRouter();
  const toggle = () => {
    const current = document.cookie.match(/locale=(\w+)/)?.[1] || 'en';
    const next = current === 'en' ? 'es' : 'en';
    document.cookie = `locale=${next};path=/;max-age=31536000`;
    router.refresh();
  };
  return (
    <button onClick={toggle} className="px-2 py-1 rounded-lg text-xs font-medium text-(--muted) hover:text-(--foreground) hover:bg-(--surface-muted) transition-colors">
      🌐 EN/ES
    </button>
  );
}
