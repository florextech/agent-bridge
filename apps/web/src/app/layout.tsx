import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agent Bridge',
  description: 'Multi-channel platform for code agent notifications',
};

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
          <Sidebar />
          <main className="flex-1 p-8 max-w-[1280px]">{children}</main>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <nav className="w-60 border-r border-(--border) bg-(--surface) p-5 flex flex-col gap-8">
      <a href="/" className="flex items-center gap-2.5">
        <span className="size-7 rounded-lg bg-(--brand-600) flex items-center justify-center text-[#111513] text-sm font-bold">AB</span>
        <span className="font-display text-lg font-bold tracking-tight text-(--foreground)">Agent Bridge</span>
      </a>
      <ul className="flex flex-col gap-1 text-sm">
        <NavItem href="/" label="Sessions" />
        <NavItem href="/settings" label="Settings" />
        <NavItem href="/integration" label="Integration" />
      </ul>
      <div className="mt-auto flx-card p-3 text-xs text-(--muted)">
        <p className="font-semibold text-(--brand-700) mb-1">v0.1.0</p>
        <p>Multi-channel agent notifications</p>
      </div>
    </nav>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a href={href} className="block px-3 py-2.5 rounded-xl text-(--muted) hover:text-(--foreground) hover:bg-(--surface-muted) transition-colors">
        {label}
      </a>
    </li>
  );
}
