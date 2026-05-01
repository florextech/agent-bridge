import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agent Bridge',
  description: 'Multi-channel platform for code agent notifications',
};

const links = [
  { href: '/', label: 'Sessions' },
  { href: '/settings', label: 'Settings' },
  { href: '/integration', label: 'Integration' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <nav className="w-56 border-r border-(--border) bg-(--surface) p-4 flex flex-col gap-6">
            <span className="text-lg font-bold tracking-tight text-(--foreground) font-(family-name:--font-montserrat)">Agent Bridge</span>
            <ul className="flex flex-col gap-1 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="block px-3 py-2 rounded-(--radius-sm) text-(--muted) hover:text-(--foreground) hover:bg-(--surface-muted) transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
