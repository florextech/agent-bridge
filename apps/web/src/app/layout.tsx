import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { QueryProvider } from '@/lib/query-provider';

export const metadata: Metadata = {
  title: 'Agent Bridge',
  description: 'Multi-channel platform for code agent notifications',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'en';

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>
          <QueryProvider>{children}</QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
