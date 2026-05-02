'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ListChecks, Gear, List, X, Terminal } from '@phosphor-icons/react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Logo } from '@/components/Logo';
import { useI18n } from '@/lib/i18n';
import { useTerminalStatus } from '@/lib/queries';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-(--surface) border-b border-(--border) flex items-center px-4 gap-3">
        <button onClick={() => setOpen(!open)} className="p-2 -ml-2 rounded-lg text-(--muted) hover:text-(--foreground)">
          {open ? <X size={20} /> : <List size={20} />}
        </button>
        <Logo size="sm" />
        <span className="font-display text-sm font-bold text-(--foreground)">Agent Bridge</span>
      </div>

      {open && <button className="md:hidden fixed inset-0 z-40 bg-black/50 cursor-default" onClick={() => setOpen(false)} aria-label={t('common.closeMenu')} />}

      <nav className={`fixed md:sticky top-0 z-40 h-screen w-[220px] shrink-0 border-r border-(--border) bg-(--surface) flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="hidden md:block px-5 pt-5 pb-4">
          <a href="/" className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="font-display text-[15px] font-bold tracking-tight text-(--foreground)">Agent Bridge</span>
          </a>
        </div>
        <div className="md:hidden h-14" />
        <NavLinks onNavigate={() => setOpen(false)} />
        <div className="px-3 pb-4 flex flex-col gap-2">
          <LocaleSwitcher />
          <div className="px-3 py-1.5 text-[10px] text-(--muted) opacity-60">v0.1.0</div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="max-w-[1100px] mx-auto px-4 py-6 sm:px-6 md:px-10 md:py-8">{children}</div>
      </main>
    </div>
  );
}

function NavLinks({ onNavigate }: Readonly<{ onNavigate: () => void }>) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { data: terminalStatus } = useTerminalStatus();

  const links = [
    { href: '/', icon: <ListChecks size={18} />, label: t('nav.sessions') },
    { href: '/settings', icon: <Gear size={18} />, label: t('nav.settings') },
    ...(terminalStatus?.enabled ? [{ href: '/terminal', icon: <Terminal size={18} />, label: t('nav.terminal') }] : []),
  ];

  return (
    <div className="flex-1 px-3 py-2">
      <div className="flex flex-col gap-1.5">
        {links.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
          return (
            <a key={l.href} href={l.href} onClick={onNavigate} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${active ? 'bg-[rgb(189_241_70/0.1)] text-(--brand-600) font-medium shadow-[inset_0_0_0_1px_rgb(189_241_70/0.15)]' : 'text-(--muted) hover:text-(--foreground) hover:bg-[rgb(255_255_255/0.03)]'}`}>
              {l.icon}
              {l.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
