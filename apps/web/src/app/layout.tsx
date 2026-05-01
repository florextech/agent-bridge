import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agent Bridge',
  description: 'Multi-channel platform for code agent notifications',
};

const links = [
  { href: '/', label: '📊 Sessions' },
  { href: '/settings', label: '⚙️ Settings' },
  { href: '/integration', label: '🔌 Integration' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="flex min-h-screen">
          <nav className="w-60 border-r border-(--border) bg-(--surface) p-5 flex flex-col gap-8">
            <div className="flex items-center gap-2">
              <span className="text-(--brand-600) text-2xl">⚡</span>
              <span className="font-display text-lg font-bold tracking-tight text-(--foreground)">Agent Bridge</span>
            </div>
            <ul className="flex flex-col gap-1 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="block px-3 py-2.5 rounded-xl text-(--muted) hover:text-(--foreground) hover:bg-(--surface-muted) transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <div className="flx-card p-3 text-xs text-(--muted)">
                <p className="font-semibold text-(--brand-700) mb-1">Agent Bridge v0.1</p>
                <p>Multi-channel notifications for code agents</p>
              </div>
            </div>
          </nav>
          <main className="flex-1 p-8 max-w-[1280px]">{children}</main>
        </div>
      </body>
    </html>
  );
}
