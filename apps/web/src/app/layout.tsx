import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agent Bridge',
  description: 'Multi-channel platform for code agent notifications',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-neutral-50 min-h-screen">
        <div className="flex min-h-screen">
          <nav className="w-56 border-r border-neutral-800 p-4 flex flex-col gap-6">
            <h1 className="text-lg font-bold tracking-tight">Agent Bridge</h1>
            <ul className="flex flex-col gap-1 text-sm">
              <li><a href="/" className="block px-3 py-2 rounded-md hover:bg-neutral-800">Sessions</a></li>
              <li><a href="/settings" className="block px-3 py-2 rounded-md hover:bg-neutral-800">Settings</a></li>
              <li><a href="/integration" className="block px-3 py-2 rounded-md hover:bg-neutral-800">Integration</a></li>
            </ul>
          </nav>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
