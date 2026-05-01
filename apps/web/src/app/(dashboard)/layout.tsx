'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ListChecks, Gear, Code, SignOut } from '@phosphor-icons/react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Logo } from '@/components/Logo';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}

function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="w-60 shrink-0 border-r border-(--border) bg-(--surface) p-4 flex flex-col gap-6">
      <a href="/" className="flex items-center gap-3 px-2 py-1">
        <Logo size="sm" />
        <span className="font-display text-base font-bold tracking-tight text-(--foreground)">{t('common.appName')}</span>
      </a>

      <div className="flex flex-col gap-0.5">
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-(--muted)">Menu</p>
        <NavItem href="/" icon={<ListChecks size={18} weight="duotone" />} label={t('nav.sessions')} active={pathname === '/'} />
        <NavItem href="/settings" icon={<Gear size={18} weight="duotone" />} label={t('nav.settings')} active={pathname === '/settings'} />
        <NavItem href="/integration" icon={<Code size={18} weight="duotone" />} label={t('nav.integration')} active={pathname === '/integration'} />
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <LocaleSwitcher />
        <div className="px-3 py-2 text-[10px] text-(--muted)">
          <span className="text-(--brand-600) font-semibold">{t('common.version')}</span>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
        active
          ? 'bg-[rgb(189_241_70/0.08)] text-(--brand-600) font-medium'
          : 'text-(--muted) hover:text-(--foreground) hover:bg-(--surface-muted)'
      }`}
    >
      {icon}
      {label}
    </a>
  );
}
