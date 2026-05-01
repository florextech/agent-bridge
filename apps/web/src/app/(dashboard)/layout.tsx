'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ListChecks, Gear, Code } from '@phosphor-icons/react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Logo } from '@/components/Logo';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-8 sm:px-10">{children}</div>
      </main>
    </div>
  );
}

function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  const links = [
    { href: '/', icon: <ListChecks size={18} />, label: t('nav.sessions') },
    { href: '/settings', icon: <Gear size={18} />, label: t('nav.settings') },
    { href: '/integration', icon: <Code size={18} />, label: t('nav.integration') },
  ];

  return (
    <nav className="w-[220px] shrink-0 border-r border-(--border) bg-(--surface) flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <a href="/" className="flex items-center gap-2.5">
          <Logo size="sm" />
          <span className="font-display text-[15px] font-bold tracking-tight text-(--foreground)">
            {t('common.appName')}
          </span>
        </a>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3">
        <div className="flex flex-col gap-0.5">
          {links.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <a
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                  active
                    ? 'bg-[rgb(189_241_70/0.1)] text-(--brand-600) font-medium shadow-[inset_0_0_0_1px_rgb(189_241_70/0.15)]'
                    : 'text-(--muted) hover:text-(--foreground) hover:bg-[rgb(255_255_255/0.03)]'
                }`}
              >
                {l.icon}
                {l.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 pb-4 flex flex-col gap-2">
        <LocaleSwitcher />
        <div className="px-3 py-1.5 text-[10px] text-(--muted) opacity-60">
          {t('common.version')}
        </div>
      </div>
    </nav>
  );
}
